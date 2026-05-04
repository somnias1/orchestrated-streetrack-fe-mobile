## Context

The mobile app has zero automated tests today. Every CRUD feature is implemented and merged into `main`, and the project has stabilised around clear architectural boundaries: a single `authFetch` HTTP layer, per-resource `api.ts` and `queries.ts` modules under `src/services/`, screen components under `src/features/`, and modal/tab routes under `app/`. This stability is exactly what makes now the right time to retrofit tests — the layers are not in flux.

The test account credentials are already wired into `.env.example` as `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`. Maestro is the chosen E2E driver because it works on the existing Android Studio emulator without needing a separate Detox build pipeline, and because YAML flows are easier to maintain than JavaScript-based runners for a small team.

## Goals / Non-Goals

**Goals:**
- Cover every fetcher in `src/services/*/api.ts` with unit tests that pin the URL, method, body, and error-handling behavior.
- Cover every hook in `src/services/*/queries.ts` with unit tests that pin the cache-key shape, the cross-cache invalidation set, and the optimistic-delete snapshot/rollback semantics.
- Cover every screen in `src/features/*/` with an integration test that exercises loading, error, 404, success, and at least one failure-path branch where applicable.
- Cover every CRUD flow end-to-end with a Maestro flow that creates and deletes its own data using an `[E2E-<timestamp>]` name prefix.
- Keep coverage above **85%** globally for `src/**` (lines, branches, functions, statements).
- Use centralised, typed mock fixtures so an OpenAPI change forces the mocks to update — no string-based "magic" mocks.

**Non-Goals:**
- CI integration. The thresholds are configured in `jest.config.js` but enforcement on PRs is a follow-up change.
- A test-login deep-link bypass for Auth0. The E2E suite drives the real sign-in screen so a regression in the auth flow surfaces as a test failure (per user requirement).
- iOS Maestro flows. Android is the only target per `mobile-companion-scope`.
- Snapshot / visual-regression testing. Out of scope for v1.x.
- Component library tests for `components/ui/` — those are not in scope until they hold non-trivial logic.

## Decisions

### D1 — Jest via `jest-expo` preset

`jest-expo` is the official Expo SDK 54 testing preset. It pre-configures the React Native transformer, mocks for native modules (Reanimated, Gesture Handler, Auth0 SDK), and handles the `metro` resolver. Using anything else (e.g., Vitest) would force us to maintain those mocks ourselves.

**Alternative considered:** Vitest. Rejected — no first-class React Native support; we'd be re-implementing what `jest-expo` already gives us.

### D2 — MSW for all network mocking; centralised per-resource handlers

Each `src/services/<resource>/__mocks__/handlers.ts` exports an array of MSW handlers. Each `src/services/<resource>/__mocks__/fixtures.ts` exports typed factory functions (e.g., `makeHangout(overrides?)`) returning the resource's `Read` type. The factories are imported by both unit and integration tests so a single OpenAPI change forces all tests to update.

`__tests__/setup.ts` boots an MSW server, registers all handlers, and resets handlers between tests via `server.resetHandlers()`.

**Alternative considered:** `jest.mock('@/services/transactions/api')` with hand-rolled mock implementations. Rejected — that's exactly the "magic mocks" pattern the user wants to avoid, and it bypasses the `authFetch` boundary so it doesn't catch URL/method/body bugs.

### D3 — `@testing-library/react-native` for integration; one `renderWithProviders` helper

`__tests__/test-utils.tsx` exports `renderWithProviders(ui)` which wraps the unit-under-test with `QueryClientProvider` (a fresh `QueryClient` per test, no `staleTime`/`gcTime`), `BottomSheetModalProvider`, and an Auth0 mock provider. Tests interact via `getByText`, `getByPlaceholderText`, `fireEvent.press`, etc. — never via implementation detail like `.props`.

For each integration test we also seed MSW handlers with the data the screen expects, then assert on rendered text and on `mock.calls` of MSW handlers (verifying the right mutation was sent).

### D4 — Per-resource `__mocks__/` colocation

Mocks live next to the code they mock:

```
src/services/hangouts/
  __mocks__/
    handlers.ts          # MSW handlers — GET /hangouts, POST, PATCH, DELETE
    fixtures.ts          # makeHangout(), makeHangoutListPage()
  api.ts
  api.test.ts
  queries.ts
  queries.test.ts
  ...
```

This is the same pattern Jest's docs recommend and it scales to N resources without a giant central `__mocks__` registry.

### D5 — Test file naming and execution

- Unit tests: co-located, named `*.test.ts(x)`. They mount only the unit and use MSW.
- Integration tests: co-located, named `*.test.tsx`. They mount a screen via `renderWithProviders` and exercise the full screen.
- E2E tests: under `.maestro/flows/`, named `NN-<scope>.yaml` so they run in deterministic order.

A single `npm test` runs Jest. A separate `npm run e2e` runs Maestro and assumes the emulator is already running with the dev build installed.

### D6 — Maestro flow structure with self-cleanup

Each flow follows the same skeleton:

```
appId: com.streetrack.mobile
env:
  E2E_PREFIX: "[E2E-${env.RUN_ID}]"
---
- runFlow: ../shared/sign-in.yaml
- ... do the thing under test, prefixing every name with ${E2E_PREFIX} ...
- runFlow: ../shared/cleanup.yaml
```

`shared/cleanup.yaml` opens each tab (transactions, hangouts) and deletes every row whose name contains `[E2E-`. This makes cleanup idempotent: even if a previous run crashed mid-flow, the next run sweeps the leftovers before exiting.

`RUN_ID` is the unix timestamp injected via `maestro test --env RUN_ID=$(date +%s)`. The `npm run e2e` script wraps that.

### D7 — Auth0 sign-in via Maestro: real browser flow only

Maestro's `runFlow` supports launching the system browser (Chrome Custom Tab on Android) and interacting with it via `extendedWaitUntil` + accessibility queries. The user's Auth0 universal-login page is the standard, unmodified Auth0 template, so a flow like:

```
- launchApp
- tapOn: "Sign in"
- extendedWaitUntil:
    visible: "Email"
    timeout: 10000
- tapOn: "Email"
- inputText: ${env.E2E_USER_EMAIL}
- tapOn: "Password"
- inputText: ${env.E2E_USER_PASSWORD}
- tapOn: "Continue"
- extendedWaitUntil:
    visible: "Dashboard"
    timeout: 15000
```

…works against the real flow. During implementation we'll use `maestro studio` and `maestro hierarchy` against the running emulator to confirm every accessibility ID and text label before committing each flow.

**Alternative considered:** A dev-only `?test-login=...` deep link that uses Auth0's Resource Owner Password grant to skip the browser. **Rejected per user requirement** — the whole point of E2E is to fail when the sign-in screen changes; a bypass defeats that.

### D8 — E2E test account is pre-seeded with a single fixture category + subcategory

Categories and subcategories CRUD is locked Tier 3 per `mobile-companion-scope` and is not exposed in the mobile app. The transaction form requires a subcategory, so the E2E test account MUST have a pre-existing pair to tag every E2E-created transaction with. The user has seeded the test account with:

- Category: `E2E Fixture` (case-sensitive, exactly that)
- Subcategory: `E2E Fixture` (case-sensitive, child of the above), configured as a **periodic expense with pay day 30**

E2E flows MUST select this subcategory by typing `E2E` (or `Fixture`) into the picker search and tapping the row labelled `E2E Fixture`. The flows MUST NOT depend on the subcategory being on the first page of unfiltered picker results, because real-account growth could push it off page 1.

The fixture name does NOT contain `[E2E-`, so the cleanup sweep (which matches that prefix) will never delete the fixture itself.

Because the subcategory is a periodic expense with pay day 30, creating a transaction tagged with `E2E Fixture` in the current month flips its row on the Dashboard's "due periodic expenses" card from "Unpaid" to "Paid". Deleting the same transaction flips it back. This gives the suite a free path to E2E-test the badge state machine via the `useDeleteTransaction` / `useCreateTransaction` invalidation set against `[dashboardQueryKey, 'duePeriodicExpenses']`.

**Alternative considered:** Provisioning the fixture category/subcategory programmatically before each run via the BE's admin API. Rejected for v1.x — the test account is a stable shared resource; provisioning once and treating it as a stable contract keeps E2E setup simpler.

### D9 — Coverage threshold: 85% globally

Jest config sets:
```js
coverageThreshold: {
  global: { branches: 85, functions: 85, lines: 85, statements: 85 },
}
```
Excludes: `**/__mocks__/**`, `**/*.d.ts`, `**/types.ts`, `app/**` (route stubs are 5-line wrappers; nothing to test), `components/ui/**` (presentational only until they grow logic).

The 85% bar is met by exercising every fetcher + every hook + every screen branch, which is the explicit unit/integration scope above. Pure styling (NativeWind class strings) is not counted.

## Risks / Trade-offs

- **Maestro flakiness on Auth0 universal login** → Mitigation: pin Maestro CLI version; build flows incrementally and verify each step via `maestro studio` (interactive hierarchy view) before committing. If a step proves flaky in practice, add `extendedWaitUntil` with a longer timeout rather than degrading to a deep-link bypass.
- **MSW + Hermes interop in jest-expo** → MSW v2 uses the Node interceptor under Jest, not the browser ServiceWorker. `jest-expo` uses Node, so this works. Pinning to MSW ≥ 2.6 ensures compatibility with React Native 0.81's fetch polyfill.
- **Optimistic-delete tests are timing-sensitive** → Mitigation: use `waitFor` / `findByText` everywhere, never `getByText` on async-rendered UI. Tests assert *eventual* state, not synchronous behavior.
- **E2E cleanup leaves artifacts if the test account is shared with humans** → The `[E2E-<timestamp>]` prefix is unique per run and the cleanup sweep matches `[E2E-` (anywhere in the name). Humans should never name things starting with `[E2E-`.
- **The 85% threshold could become aspirational if the codebase grows untested code** → Mitigation: this change establishes the threshold *before* a CI gate is in place. The follow-up CI change will fail PRs that drop below 85%, which is the natural enforcement point.
- **Maestro flows hit the real backend** → Slower than mocked E2E and dependent on the BE being up. Acceptable: the suite is meant to be run pre-merge, not on every keystroke. Unit + integration cover the fast-feedback need.

## Migration Plan

The change is purely additive — no existing runtime code is modified. The plan:

1. Wire up Jest config + MSW boot + `renderWithProviders` helper. Verify the empty suite passes.
2. Add `__mocks__/` (handlers + fixtures) per resource.
3. Add unit tests per resource (`api.test.ts`, `queries.test.ts`).
4. Add integration tests per screen.
5. Hit `npm run test:coverage` and confirm ≥ 85%; if any file is below, add the missing branch test.
6. Add Maestro CLI install instructions to README.
7. Build Maestro flows one at a time, verifying via `maestro studio` against the running emulator.
8. Run the full suite (`npm test && npm run e2e`); confirm green; merge.

Rollback: revert the merge commit. Nothing in the change touches runtime code, so rollback is risk-free.

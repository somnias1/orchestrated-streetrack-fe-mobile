## Why

The mobile app has reached feature-complete state for v1.x (auth, dashboard, transactions CRUD, hangouts CRUD), but every regression we've caught so far has been caught manually on-device. Without an automated test suite, every refactor or dependency bump is a roll of the dice — and the snapshot/rollback bug in `useDeleteHangout` (only surfaced when manually testing 7.8 with the backend offline) is a concrete example of behavior that an automated test would have caught the first time the code was written. Now is the right time to add tests, before the codebase grows further and before a CI pipeline is wired up in a follow-up change.

## What Changes

- Add Jest (via the official `jest-expo` preset) as the unit + integration test runner.
- Add `@testing-library/react-native` for component-level integration tests.
- Add `msw` (Mock Service Worker) as the network-mocking layer; centralise per-resource handlers and fixtures under `src/services/<resource>/__mocks__/`.
- Add Maestro as the end-to-end driver; flows live under `.maestro/flows/` and consume `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` from `.env` (already added).
- Enforce a global Jest coverage threshold of **85%** lines/branches/functions/statements across `src/**` (excluding type-only files, `__mocks__/`, and pure styling). CI gating is intentionally out of scope for this change.
- Add unit tests for every fetcher in `src/services/*/api.ts` and every hook in `src/services/*/queries.ts`, including optimistic-delete snapshot/rollback semantics.
- Add integration tests for every screen in `src/features/*/`, including the loading / error / 404 / success branches and the cross-cache invalidation behavior.
- Add Maestro flows for: auth sign-in, transactions CRUD, hangouts CRUD, cross-cache invalidation, with each flow self-cleaning via an `[E2E-<timestamp>]` name prefix on created entities.

## Capabilities

### New Capabilities

- `testing-infrastructure`: covers the test runner choice, mocking strategy, file layout conventions for unit/integration/E2E tests, coverage thresholds, and the E2E sign-in / cleanup pattern.

### Modified Capabilities

(none — testing is purely additive; no existing requirement of `mobile-techspec`, `auth-flow`, `dashboard-screen`, `transactions-screen`, or `hangouts-crud-screen` is altered.)

## Impact

- **DevDeps**: `jest`, `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`, `msw`, `@types/jest`, plus the Maestro CLI (installed locally, not via npm).
- **Scripts**: new `package.json` scripts — `test`, `test:watch`, `test:coverage`, `e2e` (runs `maestro test .maestro/flows/`).
- **New directories**: `__tests__/` (Jest setup + shared `renderWithProviders` helper), `src/services/*/__mocks__/`, co-located `*.test.ts(x)` next to the unit/integration target, `.maestro/` (flows + shared sub-flows).
- **Existing code**: zero changes to runtime code. Integration tests render existing screens without modification. The only `src/` touch is the addition of `__mocks__/` folders.
- **Backend**: Maestro flows hit the real backend running locally (or against the dev environment). Each flow MUST clean up after itself.
- **Out of scope**:
  - CI gating (separate follow-up change).
  - Visual regression / snapshot testing of UI.
  - Performance / load testing.
  - iOS Maestro flows (Android-only per `mobile-companion-scope`).
  - A test-login deep-link bypass for Auth0 — the E2E suite MUST exercise the real sign-in screen, so any change to the auth flow surfaces as a test failure.

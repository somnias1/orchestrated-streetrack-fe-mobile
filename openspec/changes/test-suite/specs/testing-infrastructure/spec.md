## ADDED Requirements

### Requirement: Jest is the unit and integration test runner

The mobile app SHALL use Jest configured via the `jest-expo` preset as the single test runner for unit and integration tests. The Jest config SHALL live in `jest.config.js` at the repo root, and `package.json` SHALL expose `test`, `test:watch`, and `test:coverage` scripts that invoke it.

#### Scenario: Jest is installed and runnable

- **WHEN** a developer runs `npm test`
- **THEN** Jest MUST execute via the `jest-expo` preset
- **AND** the suite MUST exit 0 when no tests fail

#### Scenario: Coverage script reports per-file metrics

- **WHEN** a developer runs `npm run test:coverage`
- **THEN** Jest MUST print a per-file coverage table including lines, branches, functions, and statements
- **AND** the report MUST cover all of `src/**` except the exclusions defined for the threshold

### Requirement: Global coverage threshold of 85%

The Jest config SHALL set a global coverage threshold of 85% for lines, branches, functions, and statements. The threshold SHALL apply to `src/**` excluding `**/__mocks__/**`, `**/*.d.ts`, `**/types.ts`, `app/**`, and `components/ui/**`. A test run that drops below the threshold SHALL exit non-zero.

#### Scenario: Coverage above threshold passes

- **WHEN** all measured files are at or above 85% on every metric
- **THEN** `npm run test:coverage` MUST exit 0

#### Scenario: Coverage below threshold fails

- **WHEN** any global metric (lines, branches, functions, or statements) drops below 85%
- **THEN** `npm run test:coverage` MUST exit non-zero
- **AND** the failing metric MUST be reported

### Requirement: MSW is the only network mocking layer

All Jest tests that exercise code calling `authFetch` SHALL intercept requests via Mock Service Worker (`msw` v2+). A single MSW server instance SHALL be created in `__tests__/setup.ts`, started before tests, reset between tests, and closed after the suite. Tests SHALL NOT mock `authFetch`, `fetch`, or any `src/services/*/api.ts` module directly via `jest.mock`.

#### Scenario: MSW server intercepts requests in unit tests

- **WHEN** a unit test calls a fetcher from `src/services/<resource>/api.ts`
- **THEN** the request MUST reach MSW and be matched against a registered handler
- **AND** the test MUST NOT bypass `authFetch`

#### Scenario: MSW handlers are reset between tests

- **WHEN** one test overrides a handler via `server.use(...)` and the next test runs
- **THEN** the next test MUST see only the default handlers, not the override

### Requirement: Mocks live alongside the resource they mock

Each resource directory under `src/services/<resource>/` SHALL contain a `__mocks__/` subdirectory exporting two files: `handlers.ts` (default MSW handlers covering every endpoint of that resource) and `fixtures.ts` (typed factory functions returning the resource's `Read`/`Create`/`Update` shapes). The factories SHALL accept partial overrides and SHALL be the single source of test data for that resource — no test SHALL hand-craft a response body or list page.

#### Scenario: Each resource exports default MSW handlers

- **WHEN** the codebase is inspected
- **THEN** every directory under `src/services/<resource>/` (other than the type-only `errors.ts`, `http.ts`, `queryClient.ts`, `types.ts`, `validation.ts`) MUST contain a `__mocks__/handlers.ts` exporting an array of handlers covering at minimum the endpoints used by that resource's `api.ts`

#### Scenario: Each resource exports typed fixture factories

- **WHEN** a test needs a sample `HangoutRead` (or any resource's read shape)
- **THEN** it MUST import a factory like `makeHangout(overrides?)` from `src/services/hangouts/__mocks__/fixtures.ts`
- **AND** the factory MUST return a value typed as `HangoutRead`

### Requirement: Test files are co-located with source

Every unit and integration test file SHALL be co-located with the file or component under test, named `<source>.test.ts` or `<source>.test.tsx`. Tests SHALL NOT live in a separate top-level `tests/` directory parallel to `src/`.

#### Scenario: api.ts has a co-located unit test

- **WHEN** `src/services/<resource>/api.ts` exists
- **THEN** `src/services/<resource>/api.test.ts` MUST exist and exercise every exported function

#### Scenario: queries.ts has a co-located unit test

- **WHEN** `src/services/<resource>/queries.ts` exists
- **THEN** `src/services/<resource>/queries.test.ts` MUST exist and exercise every exported hook

#### Scenario: Screen has a co-located integration test

- **WHEN** a screen file under `src/features/<feature>/<Screen>.tsx` is rendered by a route
- **THEN** `src/features/<feature>/<Screen>.test.tsx` MUST exist and exercise the screen via `@testing-library/react-native`

### Requirement: Shared test helpers live under `__tests__/`

The repo root SHALL contain a `__tests__/` directory with a `setup.ts` file referenced from `jest.config.js` as `setupFilesAfterEach` (or equivalent), and a `test-utils.tsx` file exporting a `renderWithProviders(ui, options?)` helper that wraps the unit-under-test in `QueryClientProvider`, `BottomSheetModalProvider`, and any other providers an authenticated screen requires. Each test SHALL receive a fresh `QueryClient` per render so cache state does not leak between tests.

#### Scenario: setup.ts boots and tears down MSW

- **WHEN** the Jest suite starts
- **THEN** `__tests__/setup.ts` MUST start the MSW server before the first test
- **AND** reset handlers between tests
- **AND** close the server after the last test

#### Scenario: renderWithProviders provides a fresh QueryClient

- **WHEN** two tests in the same file each call `renderWithProviders(<X />)`
- **THEN** the `QueryClient` instance in the second render MUST NOT contain any cached data from the first render

### Requirement: Unit tests cover every fetcher and every hook

For every resource under `src/services/`, the unit tests SHALL exercise every exported member of `api.ts` (URL, method, body for mutations, response parsing, error throw on non-2xx) and every exported member of `queries.ts` (cache key shape, list pagination, mutation invalidation set, optimistic delete with snapshot/rollback where applicable).

#### Scenario: Each fetcher has a happy-path test

- **WHEN** a function in `src/services/<resource>/api.ts` is exported
- **THEN** at least one test MUST assert the URL path, HTTP method, request body (for mutations), and the parsed return value matches the OpenAPI shape

#### Scenario: Each fetcher has a non-2xx test

- **WHEN** a function in `src/services/<resource>/api.ts` is exported
- **THEN** at least one test MUST configure MSW to return a non-2xx status and assert the function throws `ApiError` with the matching status

#### Scenario: Optimistic delete hooks rollback on error

- **WHEN** `useDeleteHangout` or `useDeleteTransaction` is invoked and MSW responds with a non-2xx status
- **THEN** the test MUST assert that the optimistically-removed item reappears in the cached list pages
- **AND** that the cross-cache invalidation was NOT triggered

#### Scenario: Mutation hooks invalidate the documented cache set

- **WHEN** a mutation hook resolves successfully under MSW
- **THEN** the test MUST assert that exactly the documented query keys were invalidated (e.g., `useUpdateHangout` invalidates both `[hangoutsQueryKey]` and `[transactionsQueryKey]`; `useCreateHangout` invalidates only `[hangoutsQueryKey]`)

### Requirement: Integration tests cover every screen branch

Every screen file under `src/features/*/` SHALL have an integration test rendering it via `renderWithProviders`. Each test SHALL exercise every state branch reachable in the screen (loading, error, 404, success, and any failure-path UI such as the delete error banner). Tests SHALL interact via user-visible affordances (text labels, placeholder text, accessibility roles) and SHALL NOT reach into component internals.

#### Scenario: List screen renders fetched rows

- **WHEN** the screen is rendered with MSW returning a non-empty list
- **THEN** the test MUST assert the rendered rows match the fixture data via `findByText` on item fields

#### Scenario: Edit screen renders 404 branch

- **WHEN** the edit screen is rendered with MSW returning 404 for the detail endpoint
- **THEN** the test MUST assert the "no longer exists" copy is visible and the form is not rendered

#### Scenario: Optimistic delete failure shows the error banner

- **WHEN** the list screen is rendered, the user confirms a delete, and MSW returns a non-2xx for the DELETE call
- **THEN** the deleted row MUST reappear in the list
- **AND** the inline error banner MUST be shown

### Requirement: Maestro is the E2E driver, flows live under `.maestro/`

The repo SHALL contain a `.maestro/` directory with a `flows/` subdirectory holding numbered YAML flow files (`NN-<scope>.yaml`) and a `shared/` subdirectory with reusable sub-flows (`sign-in.yaml`, `cleanup.yaml`). `package.json` SHALL expose an `e2e` script that runs `maestro test .maestro/flows/` against the running Android emulator.

#### Scenario: Maestro flows directory exists and is runnable

- **WHEN** a developer with the emulator running and the dev build installed runs `npm run e2e`
- **THEN** every flow under `.maestro/flows/` MUST execute in lexicographic order
- **AND** the script MUST exit 0 if every flow passes

#### Scenario: Sign-in is shared across flows

- **WHEN** a flow under `.maestro/flows/` requires an authenticated session
- **THEN** it MUST `runFlow: ../shared/sign-in.yaml` rather than duplicating the sign-in steps

### Requirement: E2E flows drive the real Auth0 sign-in screen

The shared `sign-in.yaml` flow SHALL drive the real Auth0 universal-login screen via the system browser using `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` from the environment. There SHALL NOT be a deep-link, debug-only, or backdoor sign-in path in the app or in the test suite.

#### Scenario: Sign-in flow uses universal login

- **WHEN** `shared/sign-in.yaml` runs
- **THEN** it MUST tap the in-app Sign In affordance, wait for the Auth0 universal-login screen to render in the system browser, type the credentials from env, submit, and wait for the Dashboard to be visible

#### Scenario: No bypass route exists in the app

- **WHEN** the runtime code is inspected
- **THEN** there MUST NOT be a route, deep link, or env-flag that grants a session without driving the Auth0 universal-login flow

### Requirement: Each E2E flow self-cleans via a unique name prefix

Every E2E flow that creates persistent data SHALL prefix the entity name with `[E2E-<RUN_ID>]`, where `RUN_ID` is a unique value injected per Maestro invocation (e.g., a unix timestamp). A `shared/cleanup.yaml` flow SHALL be invoked at the end of every flow that creates data, and SHALL delete every entity whose name contains the substring `[E2E-` from each list (transactions, hangouts), making the cleanup idempotent across crashed prior runs.

#### Scenario: Created entities use the E2E prefix

- **WHEN** a flow creates a transaction or hangout
- **THEN** the entity's `name`/`description` MUST start with `[E2E-${RUN_ID}]`

#### Scenario: Cleanup deletes leftover E2E entities

- **WHEN** `shared/cleanup.yaml` runs
- **THEN** every row in the hangouts list whose name contains `[E2E-` MUST be deleted
- **AND** every row in the transactions list whose description contains `[E2E-` MUST be deleted

#### Scenario: Cleanup tolerates leftovers from a previous run

- **WHEN** a previous run crashed and left `[E2E-…]` entities behind
- **THEN** the next run's cleanup MUST remove those leftovers without failing

### Requirement: E2E flows reference a pre-seeded fixture subcategory

E2E flows that create transactions SHALL select the pre-seeded subcategory named `E2E Fixture` (case-sensitive, child of category `E2E Fixture`) by typing into the subcategory picker's search input until the fixture row is visible, then tapping it. Flows SHALL NOT rely on the fixture appearing in the unfiltered first page of picker results. The fixture name does not contain `[E2E-`, so the cleanup sweep MUST NOT delete it.

#### Scenario: Picker selects fixture by search

- **WHEN** an E2E flow opens the subcategory picker
- **THEN** it MUST type `E2E` (or another distinguishing substring) into the picker's search input
- **AND** wait for the row labelled `E2E Fixture` to appear before tapping it

#### Scenario: Cleanup does not touch the fixture

- **WHEN** the cleanup sweep runs
- **THEN** the `E2E Fixture` category and subcategory MUST remain intact (their names do not contain `[E2E-`)

### Requirement: E2E flow asserts the periodic-expense paid/unpaid badge

Because the `E2E Fixture` subcategory is configured as a periodic expense with pay day 30, the dashboard's "due periodic expenses" card SHALL show a `Paid` badge for it after a current-month transaction tagged with `E2E Fixture` exists, and an `Unpaid` badge otherwise. A dedicated Maestro flow SHALL exercise this state machine.

#### Scenario: Creating a fixture-tagged transaction flips the badge to Paid

- **WHEN** the flow signs in, navigates to the Dashboard, captures the badge state for `E2E Fixture` (which may be Paid or Unpaid depending on whether prior current-month transactions exist), then creates a `[E2E-…]` transaction tagged with `E2E Fixture` in the current month
- **THEN** the Dashboard `E2E Fixture` row MUST show a `Paid` badge

#### Scenario: Deleting that transaction flips the badge back

- **WHEN** the flow then deletes the only current-month transaction tagged with `E2E Fixture`
- **THEN** the Dashboard `E2E Fixture` row MUST show an `Unpaid` badge

### Requirement: E2E flow coverage matches the CRUD surface

The `.maestro/flows/` directory SHALL contain at minimum these flows: `01-auth.yaml`, `02-transactions-crud.yaml`, `03-hangouts-crud.yaml`, `04-cross-cache.yaml`, and `05-periodic-expense-badge.yaml`. Each CRUD flow SHALL exercise create → list-verify → edit → list-verify → delete → list-absent for its resource. The cross-cache flow SHALL prove that renaming a hangout updates the transactions list and that deleting a hangout clears the `hangout_name` from tagged transaction rows.

#### Scenario: Auth flow lands on dashboard

- **WHEN** `01-auth.yaml` runs
- **THEN** it MUST sign in via universal login and assert the Dashboard tab is visible

#### Scenario: Transactions CRUD round-trip

- **WHEN** `02-transactions-crud.yaml` runs
- **THEN** it MUST create a `[E2E-…]`-named transaction, see it in the list, edit its description, see the edit, delete it, and assert it is no longer in the list

#### Scenario: Hangouts CRUD round-trip

- **WHEN** `03-hangouts-crud.yaml` runs
- **THEN** it MUST create a `[E2E-…]`-named hangout, see it in the list, edit its name, see the edit, delete it, and assert it is no longer in the list

#### Scenario: Cross-cache invalidation visible end-to-end

- **WHEN** `04-cross-cache.yaml` runs
- **THEN** it MUST create a hangout, create a transaction tagged with that hangout, rename the hangout, and assert the transaction row in the transactions list shows the new hangout name
- **AND** it MUST then delete the hangout and assert the transaction row no longer shows the old hangout name

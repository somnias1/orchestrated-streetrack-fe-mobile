## 0. Test account fixture (prerequisite — done by user, document in repo)

- [x] 0.1 Document in `.maestro/README.md` that the test account (signed in via `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`) MUST have a category `E2E Fixture` and a subcategory `E2E Fixture` (child of that category) configured as a periodic expense with pay day 30 — case-sensitive, exactly that spelling
- [x] 0.2 Note that the fixture name does NOT contain `[E2E-` so the cleanup sweep will leave it intact across runs

## 1. Test infrastructure setup

- [x] 1.1 Add devDeps: `jest`, `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`, `msw@^2.6`, `@types/jest`
- [x] 1.2 Create `jest.config.js` extending `jest-expo` preset, with `setupFilesAfterEach: ['<rootDir>/__tests__/setup.ts']`, `testPathIgnorePatterns` excluding `node_modules` and `.maestro`, and `transformIgnorePatterns` covering Expo + Reanimated
- [x] 1.3 Configure `coverageThreshold.global = { branches: 85, functions: 85, lines: 85, statements: 85 }` and `collectCoverageFrom` covering `src/**/*.{ts,tsx}` excluding `**/__mocks__/**`, `**/*.d.ts`, `**/types.ts`, `app/**`, `components/ui/**`
- [x] 1.4 Add `package.json` scripts: `test`, `test:watch`, `test:coverage`, `e2e`
- [x] 1.5 Create `__tests__/setup.ts` that boots an MSW server (`setupServer(...allHandlers)`), `beforeAll(server.listen)`, `afterEach(server.resetHandlers)`, `afterAll(server.close)`
- [x] 1.6 Create `__tests__/test-utils.tsx` exporting `renderWithProviders(ui, options?)` that wraps in a fresh `QueryClient` (no `staleTime`/`gcTime`), `BottomSheetModalProvider`, and a mocked `Auth0Provider`
- [x] 1.7 Verify the empty suite runs: `npm test` exits 0

## 2. Per-resource MSW handlers and fixtures

- [x] 2.1 Create `src/services/hangouts/__mocks__/fixtures.ts` exporting `makeHangout(overrides?)`, `makeHangoutListPage(items, overrides?)`
- [x] 2.2 Create `src/services/hangouts/__mocks__/handlers.ts` covering `GET /hangouts/`, `GET /hangouts/:id/`, `POST /hangouts/`, `PATCH /hangouts/:id/`, `DELETE /hangouts/:id/`
- [x] 2.3 Create `src/services/transactions/__mocks__/fixtures.ts` exporting `makeTransaction(overrides?)`, `makeTransactionListPage(...)`
- [x] 2.4 Create `src/services/transactions/__mocks__/handlers.ts` covering all transaction endpoints (list with year/month/skip/limit, get, create, update, delete)
- [x] 2.5 Create `src/services/dashboard/__mocks__/{fixtures,handlers}.ts` covering balance, monthBalance, duePeriodicExpenses
- [x] 2.6 Create `src/services/subcategories/__mocks__/{fixtures,handlers}.ts` covering the picker list endpoint
- [x] 2.7 Re-export an `allHandlers` array from `__tests__/handlers.ts` aggregating the per-resource handler arrays for `setupServer`

## 3. Service layer unit tests

- [x] 3.1 `src/services/http.test.ts`: `authFetch` attaches Bearer token, sets Accept/Content-Type, throws `ApiError` on non-2xx, aborts after 15 s
- [x] 3.2 `src/services/hangouts/api.test.ts`: every fetcher (URL, method, body, response shape) + non-2xx ApiError throw
- [x] 3.3 `src/services/hangouts/queries.test.ts`: `useInfiniteHangouts` (key shape + pagination), `useHangout` (enabled gate, 404), `useCreateHangout` (invalidates only `[hangoutsQueryKey]`), `useUpdateHangout` (invalidates `[hangoutsQueryKey]` + `[transactionsQueryKey]`), `useDeleteHangout` (optimistic remove, rollback on 500, cross-cache invalidate on success)
- [x] 3.4 `src/services/transactions/api.test.ts`: every fetcher + ApiError path
- [x] 3.5 `src/services/transactions/queries.test.ts`: `useInfiniteTransactions`, `useTransaction`, `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction` mirroring 3.3 — including dashboard-cache invalidation set
- [x] 3.6 `src/services/dashboard/queries.test.ts`: each read hook returns parsed shape and exposes refetch
- [x] 3.7 `src/services/subcategories/queries.test.ts`: picker hook pagination and search params

## 4. Feature integration tests

- [x] 4.1 `src/features/hangouts/HangoutsListScreen.test.tsx`: empty list, populated list, search debounce (typing fast issues one request after 300 ms), action sheet open/edit/delete branches, optimistic delete success, optimistic delete failure (row reappears + banner shows)
- [x] 4.2 `src/features/hangouts/HangoutForm.test.tsx`: pre-fill, validation errors for each field, successful submit invokes `onSubmit` with parsed values, submitError display
- [x] 4.3 `src/features/hangouts/CreateHangoutScreen.test.tsx`: submit → `useCreateHangout` called with body → `router.back()` called
- [x] 4.4 `src/features/hangouts/EditHangoutScreen.test.tsx`: loading spinner, 404 "no longer exists" copy, fetch error retry, success render with pre-filled form, header delete button confirms + deletes + closes modal, delete failure shows alert
- [x] 4.5 `src/features/transactions/TransactionsListScreen.test.tsx`: month nav, populated list, action sheet, optimistic delete success + failure
- [x] 4.6 `src/features/transactions/TransactionForm.test.tsx`: pre-fill, all field validations, picker integration (selecting a subcategory updates form state), successful submit
- [x] 4.7 `src/features/transactions/CreateTransactionScreen.test.tsx` + `EditTransactionScreen.test.tsx`: same shape as 4.3 / 4.4
- [x] 4.8 `src/features/transactions/pickers/SubcategoryPicker.test.tsx` + `HangoutPicker.test.tsx`: initial load, search debounce, infinite scroll, selection callback
- [x] 4.9 `src/features/dashboard/DashboardScreen.test.tsx`: three cards render data, error state with retry, `PaidBadge` renders `Paid` for `paid: true` and `Unpaid` for `paid: false` items in the due-periodic-expenses card
- [x] 4.10 `src/features/auth/AuthGate.test.tsx`: unauthenticated redirects to `/sign-in`; authenticated renders children

## 5. Coverage reach

- [x] 5.1 Run `npm run test:coverage`; identify any file under threshold
- [x] 5.2 Add missing branch tests until every metric is ≥ 85%; verify exit 0

## 6. Maestro setup

- [x] 6.1 Document Maestro CLI install in README (link to `https://maestro.mobile.dev/getting-started/installing-maestro`)
- [x] 6.2 Create `.maestro/config.yaml` declaring `appId: com.streetrack.mobile`
- [x] 6.3 Create `.maestro/shared/sign-in.yaml`: launch app, tap "Sign in", wait for universal-login email field, type `${E2E_USER_EMAIL}`, type `${E2E_USER_PASSWORD}`, submit, wait for "Dashboard" visible
- [x] 6.4 Create `.maestro/shared/cleanup.yaml`: open Hangouts tab, repeat-while any row contains `[E2E-` { tap row → tap Delete → confirm }; open Transactions tab, same loop on description
- [x] 6.5 Wire `npm run e2e` to inject `RUN_ID=$(date +%s)` into `maestro test --env RUN_ID=...`

## 7. Maestro flows

- [x] 7.1 `flows/01-auth.yaml`: `runFlow: ../shared/sign-in.yaml`; assert "Dashboard" tab visible
- [x] 7.2 `flows/02-transactions-crud.yaml`: sign in → create transaction with description `[E2E-${RUN_ID}] desc`, subcategory selected by typing `E2E` in picker search and tapping `E2E Fixture` row → assert in list → tap row → Edit → change description → assert in list → tap row → Delete → confirm → assert gone → cleanup
- [x] 7.3 `flows/03-hangouts-crud.yaml`: sign in → create hangout `[E2E-${RUN_ID}] hangout` → assert in list → tap row → Edit → change name → assert in list → tap row → Delete → confirm → assert gone → cleanup
- [x] 7.4 `flows/04-cross-cache.yaml`: sign in → create hangout `[E2E-${RUN_ID}] H1` → create transaction tagged with H1 (subcategory `E2E Fixture`) → rename H1 to `[E2E-${RUN_ID}] H1-renamed` → open transactions tab → assert transaction row shows the renamed hangout → delete H1 → assert transaction row no longer shows it → cleanup
- [x] 7.5 `flows/05-periodic-expense-badge.yaml`: sign in → open Dashboard → locate the `E2E Fixture` row in the "due periodic expenses" card → if any current-month transactions tagged with `E2E Fixture` exist (badge currently shows `Paid`), delete them via cleanup-of-the-current-fixture-only sub-routine first to land on a deterministic `Unpaid` baseline → create a `[E2E-${RUN_ID}]` transaction tagged with `E2E Fixture` in the current month → return to Dashboard → assert the row badge shows `Paid` → delete that transaction → return to Dashboard → assert the badge shows `Unpaid` → cleanup

## 8. Manual verification on device

- [ ] 8.1 With BE running and dev build installed on the emulator, run `npm run e2e`; confirm all flows pass green
- [ ] 8.2 Force-fail one flow mid-run (kill BE during step), then re-run — confirm next-run cleanup sweeps the orphaned `[E2E-…]` entities and the suite passes
- [ ] 8.3 Run `maestro studio` once against the running app to verify each accessibility ID/text label used by the flows still matches what the user sees
- [ ] 8.4 Run `npm run test:coverage` and capture the final per-file table; confirm global ≥ 85% and no flagged files

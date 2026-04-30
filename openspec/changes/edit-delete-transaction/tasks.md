## 1. Service layer

- [x] 1.1 Add `getTransaction(id)` fetcher in `src/services/transactions/api.ts` calling `authFetch(transactionsPaths.get(id))`
- [x] 1.2 Add `updateTransaction(id, body)` fetcher in `src/services/transactions/api.ts` (PATCH `transactionsPaths.update(id)`)
- [x] 1.3 Add `deleteTransaction(id)` fetcher in `src/services/transactions/api.ts` (DELETE `transactionsPaths.delete(id)`)
- [x] 1.4 Add `useTransaction(id)` `useQuery` hook in `src/services/transactions/queries.ts` keyed by `[transactionsQueryKey, 'detail', id]`
- [x] 1.5 Add `useUpdateTransaction()` `useMutation` hook that calls `useInvalidateTransactionsAndDashboard` on success
- [x] 1.6 Add `useDeleteTransaction()` `useMutation` hook with optimistic removal across cached infinite list pages, snapshot/rollback on error, and the same invalidation set on success

## 2. Shared TransactionForm extraction

- [x] 2.1 Create `src/features/transactions/TransactionForm.tsx` and move the form's JSX, zod schema, `useForm` setup, picker mount logic, and submit-button rendering out of `CreateTransactionScreen`
- [x] 2.2 Define props: `defaultValues`, `submitLabel`, `headerTitle`, `onSubmit`, `headerExtra?`
- [x] 2.3 Refactor `CreateTransactionScreen` to import and render `<TransactionForm />`, passing zero-state defaults, `submitLabel="Save transaction"`, `headerTitle="New Transaction"`, and an `onSubmit` that calls `useCreateTransaction`
- [x] 2.4 Smoke-test the create flow on device — same fields, same validation, same picker behavior

## 3. Edit screen

- [x] 3.1 Create `app/transaction-edit/[id].tsx` that wraps `<EditTransactionScreen />` in `<AuthGate>`
- [x] 3.2 Register the new modal route in `app/_layout.tsx` (`<Stack.Screen name="transaction-edit/[id]" options={{ presentation: 'modal', headerShown: false }} />`)
- [x] 3.3 Create `src/features/transactions/EditTransactionScreen.tsx`:
  - read `id` via `useLocalSearchParams`
  - call `useTransaction(id)` and render loading / error / not-found states
  - on success render `<TransactionForm />` with `defaultValues` derived from the fetched record, `submitLabel="Save changes"`, `headerTitle="Edit Transaction"`, `onSubmit` wired to `useUpdateTransaction`, and a delete button via `headerExtra`
- [x] 3.4 Implement the delete button (inside `EditTransactionScreen`) that calls `Alert.alert` for confirmation, fires `useDeleteTransaction`, and `router.back()` on success

## 4. List interaction

- [x] 4.1 Wrap each `TransactionRow` in a `Pressable` and add `selectedRowId` + `actionSheetVisible` state to `TransactionsListScreen`
- [x] 4.2 Render an in-screen action sheet (overlay + bottom panel) with "Edit", "Delete", "Cancel" buttons; backdrop tap dismisses
- [x] 4.3 Wire "Edit" to `router.push(\`/transaction-edit/${selectedRowId}\`)` and dismiss the sheet
- [x] 4.4 Wire "Delete" to a `confirmDelete(id)` helper that calls `Alert.alert` and triggers `useDeleteTransaction` on confirm
- [x] 4.5 Surface delete failure via a transient inline error (banner above the list) using a small piece of local state with auto-dismiss after a few seconds

## 5. Manual smoke test on device

- [x] 5.1 Tap a row → action sheet appears with the three options; cancel + backdrop both dismiss
- [x] 5.2 Edit flow: tap row → Edit → form is pre-filled → change a field → save → modal closes, list refreshes, dashboard reflects change
- [x] 5.3 Edit error path: kill backend, attempt save → modal stays open with inline error
- [x] 5.4 Delete from list: tap row → Delete → confirm → row disappears immediately, dashboard refreshes
- [x] 5.5 Delete failure: kill backend, attempt delete → row reappears, banner shows error
- [x] 5.6 Delete from edit screen: open edit → tap delete → confirm → modal closes, row gone
- [x] 5.7 Stale row: open edit on row A, in another client delete row A, return → screen shows "Transaction no longer exists" and back action works
- [x] 5.8 Verify no regressions in create flow (still works end-to-end after `TransactionForm` extraction)

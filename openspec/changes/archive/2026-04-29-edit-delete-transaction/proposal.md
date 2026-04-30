## Why

The mobile transactions screen lets users create transactions but not correct them. Per `mobile-companion-scope`, edit/delete is an explicit Tier 2 feature: in v1.0 wrong entries persist until the user opens the desktop, which makes the on-the-go flow feel half-finished. Shipping this rounds out the transaction lifecycle on mobile and removes the only friction blocking a clean v1.x build.

## What Changes

- Add row tap interaction on the transactions list that opens an action sheet ("Edit", "Delete", "Cancel").
- Add an edit-transaction modal route (`/transaction-edit/[id]`) that reuses the create form's components, pre-filled from the existing transaction, and submits via `PATCH /transactions/{id}`.
- Add a delete confirmation flow that submits via `DELETE /transactions/{id}` and removes the row optimistically.
- Extend `src/services/transactions/api.ts` with `updateTransaction(id, body)` and `deleteTransaction(id)` plain fetchers calling `authFetch`.
- Extend `src/services/transactions/queries.ts` with `useUpdateTransaction()` and `useDeleteTransaction()` hooks that invalidate the same query keys as `useCreateTransaction`.
- Extract the create form's field markup into a shared `TransactionForm` component consumed by both create and edit screens.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `transactions-screen`: rows become interactive (tap → action sheet), an edit modal route is added, and the form layer becomes shared between create and edit. The service layer requirement extends to cover the two new fetchers and hooks.

## Impact

- **Routes**: new `app/transaction-edit/[id].tsx` modal route registered in the root stack.
- **Features**: `src/features/transactions/EditTransactionScreen.tsx` (new), `src/features/transactions/TransactionForm.tsx` (extracted from `CreateTransactionScreen`), `CreateTransactionScreen` refactored to consume `TransactionForm`, `TransactionsListScreen` rows wrapped in a `Pressable` that opens an action sheet.
- **Services**: `src/services/transactions/api.ts` gains two fetchers; `src/services/transactions/queries.ts` gains two hooks; same dashboard + list cache invalidation set as create.
- **Backend**: consumes existing `PATCH /transactions/{id}/` and `DELETE /transactions/{id}/`; `TransactionUpdate` type already exists in `src/services/transactions/types.ts`. No backend changes.
- **Out of scope**: bulk edit/delete, undo, swipe-to-delete gestures, edit history. Tier 3 / future-version material.

## ADDED Requirements

### Requirement: Tapping a transaction row opens an action sheet

Each rendered row in `TransactionsListScreen` SHALL be wrapped in a `Pressable`. Tapping a row SHALL open an action sheet listing "Edit", "Delete", and "Cancel". Selecting "Edit" SHALL navigate to the edit modal. Selecting "Delete" SHALL trigger the delete confirmation flow. Selecting "Cancel" or tapping outside the sheet SHALL dismiss it without action.

#### Scenario: Row tap opens the action sheet

- **WHEN** the user taps a transaction row in the list
- **THEN** an action sheet MUST appear with the options "Edit", "Delete", and "Cancel"
- **AND** the row that triggered the sheet MUST be tracked so subsequent actions know which transaction is targeted

#### Scenario: Cancel dismisses the sheet

- **WHEN** the user taps "Cancel" or the sheet's backdrop
- **THEN** the sheet MUST close
- **AND** no navigation or mutation MUST occur

#### Scenario: Edit selection routes to the edit modal

- **WHEN** the user taps "Edit" in the action sheet
- **THEN** the sheet MUST close
- **AND** the app MUST navigate to `/transaction-edit/<id>` presented as a modal

#### Scenario: Delete selection opens confirmation

- **WHEN** the user taps "Delete" in the action sheet
- **THEN** the sheet MUST close
- **AND** a confirmation prompt MUST be shown via `Alert.alert` with destructive styling on the confirm action

### Requirement: Edit-transaction screen pre-fills the form and submits via PATCH

The route `/transaction-edit/[id]` SHALL render `<EditTransactionScreen />` from `src/features/transactions/EditTransactionScreen.tsx`. The screen SHALL fetch the transaction via `useTransaction(id)` and SHALL render `<TransactionForm />` with `defaultValues` derived from the fetched record. Submission SHALL call `PATCH /transactions/{id}/` with the validated body.

#### Scenario: Initial fetch blocks the form render

- **WHEN** the edit screen mounts
- **THEN** the screen MUST call `GET /transactions/{id}/` once before rendering the form
- **AND** while the fetch is pending the screen MUST render a centred loading indicator

#### Scenario: Fetch failure renders an error state

- **WHEN** the initial fetch fails
- **THEN** the screen MUST render an inline error message and a "Retry" button that calls the query's `refetch`
- **AND** the form MUST NOT be rendered until a successful fetch resolves

#### Scenario: Form is pre-filled from the fetched record

- **WHEN** the fetch resolves successfully
- **THEN** the form's `subcategory_id`, `value`, `description`, `date`, and `hangout_id` MUST be initialised from the fetched record
- **AND** the displayed subcategory and (when present) hangout names MUST match the fetched `subcategory_name` and `hangout_name`

#### Scenario: Valid submission persists the changes

- **WHEN** the user submits a valid edit
- **THEN** `PATCH /transactions/{id}/` MUST be called with `{ subcategory_id, value, description, date, hangout_id }`
- **AND** while the request is pending, the submit button MUST be disabled and show a spinner

#### Scenario: Successful submission closes the modal

- **WHEN** the update request resolves with 200
- **THEN** the modal MUST close back to the list
- **AND** the transactions list and dashboard caches MUST be invalidated using the same key set as `useCreateTransaction`

#### Scenario: Failed submission keeps the modal open

- **WHEN** the update request fails
- **THEN** the modal MUST remain open with form state preserved
- **AND** an inline error message MUST be shown above the submit button

#### Scenario: Transaction was already deleted

- **WHEN** the initial fetch resolves with 404
- **THEN** the screen MUST render a "Transaction no longer exists" message with a back action
- **AND** the form MUST NOT be rendered

### Requirement: Delete confirmation flow uses optimistic removal with rollback

The delete flow SHALL show a confirmation prompt before issuing the request. On confirm, the row SHALL be removed optimistically from any matching infinite list pages. On request success, the standard invalidation set SHALL run. On request failure, the snapshot SHALL be restored and an inline error MUST be shown to the user.

#### Scenario: Confirmation must be explicit

- **WHEN** the user taps "Delete" in the action sheet
- **THEN** the user MUST be prompted via `Alert.alert` with the destructive option labelled "Delete" and a "Cancel" option
- **AND** `DELETE /transactions/{id}/` MUST NOT be called until the user confirms

#### Scenario: Optimistic removal on confirm

- **WHEN** the user confirms deletion
- **THEN** the row MUST be removed from the visible list immediately (before the network response)
- **AND** the prior cache state MUST be snapshotted so it can be restored on failure

#### Scenario: Successful delete invalidates dependent caches

- **WHEN** `DELETE /transactions/{id}/` resolves successfully
- **THEN** the transactions list and dashboard caches MUST be invalidated using the same key set as `useCreateTransaction`

#### Scenario: Failed delete restores the row

- **WHEN** `DELETE /transactions/{id}/` fails
- **THEN** the cache MUST be restored from the snapshot so the row reappears in its original position
- **AND** an inline error message MUST be shown to the user (e.g., a transient banner above the list)

### Requirement: Edit screen exposes a delete affordance

The edit screen SHALL include a "Delete" button (rendered in or near the form's header). Tapping it SHALL trigger the same delete confirmation flow used by the list's action sheet. On successful delete, the modal SHALL close back to the list.

#### Scenario: Delete from the edit screen

- **WHEN** the user taps the delete button on the edit screen and confirms the prompt
- **THEN** `DELETE /transactions/{id}/` MUST be called
- **AND** on success the modal MUST close back to the list and the standard invalidation set MUST run

#### Scenario: Delete failure keeps the edit screen open

- **WHEN** the delete request fails from the edit screen
- **THEN** the modal MUST remain open with the form state intact
- **AND** an inline error message MUST be shown above the submit button

### Requirement: TransactionForm is a shared component used by create and edit screens

`src/features/transactions/TransactionForm.tsx` SHALL be the single owner of the transaction form's UI, validation schema, picker mount logic, and submit-button rendering. `CreateTransactionScreen` and `EditTransactionScreen` SHALL both render this component, passing only the props that differ between modes.

#### Scenario: Shared form component exists

- **WHEN** the codebase is inspected
- **THEN** `src/features/transactions/TransactionForm.tsx` MUST exist and export a `TransactionForm` component
- **AND** `CreateTransactionScreen.tsx` and `EditTransactionScreen.tsx` MUST both import and render it

#### Scenario: Form props parameterise behavior, not duplicate logic

- **WHEN** the form needs to differ between create and edit (button label, header title, default values, submit handler, optional delete affordance)
- **THEN** the differences MUST be expressed as props passed to `TransactionForm`
- **AND** the field markup, zod schema, picker toggle state, and `react-hook-form` wiring MUST NOT be duplicated in the screens

## MODIFIED Requirements

### Requirement: Service layer for transactions is fully implemented

`src/services/transactions/api.ts` SHALL export `getTransactions(params)`, `getTransaction(id)`, `createTransaction(body)`, `updateTransaction(id, body)`, and `deleteTransaction(id)` as plain async fetcher functions calling `authFetch`. `src/services/transactions/queries.ts` SHALL export `useInfiniteTransactions({ year, month })`, `useTransaction(id)`, `useCreateTransaction()`, `useUpdateTransaction()`, and `useDeleteTransaction()` as React Query hooks wrapping those fetchers.

#### Scenario: api.ts exports the full set of fetchers using authFetch

- **WHEN** the codebase is inspected
- **THEN** `src/services/transactions/api.ts` MUST export `getTransactions`, `getTransaction`, `createTransaction`, `updateTransaction`, and `deleteTransaction`
- **AND** each MUST call `authFetch` and MUST NOT call `fetch` directly

#### Scenario: queries.ts exports list, detail, create, update, and delete hooks

- **WHEN** a screen needs transactions data or to mutate a transaction
- **THEN** it MUST import from `src/services/transactions/queries.ts`
- **AND** it MUST NOT call `authFetch`, `getTransactions`, `getTransaction`, `createTransaction`, `updateTransaction`, or `deleteTransaction` directly from the screen

#### Scenario: Update and delete hooks invalidate the same cache set as create

- **WHEN** `useUpdateTransaction` or `useDeleteTransaction` resolves successfully
- **THEN** the same React Query keys MUST be invalidated as for `useCreateTransaction`: `[transactionsQueryKey]`, `[dashboardQueryKey, 'balance']`, `[dashboardQueryKey, 'monthBalance']`, `[dashboardQueryKey, 'duePeriodicExpenses']`

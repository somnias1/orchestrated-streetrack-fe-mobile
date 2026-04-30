## ADDED Requirements

### Requirement: Transactions tab replaces the Explore scaffold

The `(tabs)/explore.tsx` route SHALL be replaced by a new transactions route that renders `<TransactionsListScreen />` from `src/features/transactions/TransactionsListScreen.tsx`. The tab label SHALL be "Transactions" and its icon SHALL be `list.bullet`.

#### Scenario: Transactions tab is the second tab

- **WHEN** an authenticated user opens the app
- **THEN** the second tab MUST be labelled "Transactions"
- **AND** it MUST render the transactions list, not Expo scaffold content

#### Scenario: Explore route is removed

- **WHEN** the codebase is inspected
- **THEN** `app/(tabs)/explore.tsx` MUST NOT exist as a scaffold-only route
- **AND** the tabs layout MUST NOT register an "Explore" tab

### Requirement: Transactions list is paginated and filtered to a month

The transactions list SHALL fetch from `GET /transactions/?year=&month=&skip=&limit=` using TanStack Query's `useInfiniteQuery`. Page size SHALL be `DEFAULT_LIST_LIMIT` (50). The list SHALL default to the current calendar month and SHALL provide controls to step backward and forward by one month.

#### Scenario: Initial render fetches the current month

- **WHEN** the list mounts
- **THEN** it MUST call `GET /transactions/` with `year` and `month` set to the current calendar values
- **AND** with `skip=0` and `limit=50`

#### Scenario: Reaching the end fetches the next page

- **WHEN** the user scrolls within `onEndReachedThreshold` of the list end and `has_more` is true
- **THEN** the next page MUST be fetched via `fetchNextPage` using the API-returned `next_skip`
- **AND** the new items MUST append to the existing list, not replace it

#### Scenario: Stopping pagination when the API reports no more

- **WHEN** the API returns `has_more: false` for the latest page
- **THEN** subsequent `onEndReached` events MUST NOT trigger another fetch

#### Scenario: Switching month resets pagination

- **WHEN** the user changes the selected month via the header control
- **THEN** the query MUST refetch from `skip=0` for the newly selected month
- **AND** rows from the previous month MUST NOT remain visible

### Requirement: Transactions list rows display key fields

Each row SHALL display the transaction's `date`, signed `value` formatted via `formatValue`, `description`, `subcategory_name`, and (when non-null) `hangout_name`.

#### Scenario: Row layout

- **WHEN** the list renders a transaction
- **THEN** the row MUST show date, signed value, description, subcategory name
- **AND** the hangout name MUST be rendered if and only if `hangout_id` is non-null

#### Scenario: Sign indication

- **WHEN** a transaction's `value` is positive
- **THEN** the row MUST display the value with a `+` prefix
- **AND** when `value` is negative, the row MUST display the implicit `-` from `formatValue`

### Requirement: Empty list shows a placeholder

The list SHALL render a placeholder message when the API returns zero items for the selected month.

#### Scenario: Empty month

- **WHEN** the selected month has no transactions
- **THEN** the screen MUST render a placeholder (e.g., "No transactions in <month>")
- **AND** the FAB to create a new transaction MUST remain visible

### Requirement: Loading and error states are scoped to the list

The list SHALL render a loading indicator on the initial fetch and an inline error with a retry control on failure.

#### Scenario: Initial load

- **WHEN** the first page is in flight
- **THEN** the list MUST render a centred loading indicator instead of rows

#### Scenario: Initial load fails

- **WHEN** the first page fetch fails
- **THEN** the list MUST render an inline error message and a "Retry" button that calls `refetch`

#### Scenario: Subsequent page fails

- **WHEN** a non-first page fetch fails
- **THEN** the already-rendered rows MUST remain visible
- **AND** the list footer MUST show a "Couldn't load more — Retry" affordance that calls `fetchNextPage`

### Requirement: User can open a create flow from the list

A floating action button SHALL be rendered on the list screen and SHALL navigate to a modal-presented create-transaction route.

#### Scenario: FAB opens the create flow

- **WHEN** the user taps the FAB
- **THEN** the app MUST navigate to `/transaction-new` presented as a modal
- **AND** the underlying tabs UI MUST remain mounted in the background

### Requirement: Create-transaction form validates and submits

The create form SHALL be implemented with `react-hook-form` + a `zod` schema. The schema SHALL require: `subcategory_id` (uuid), `value` (number, non-zero), `description` (string, length 1–280), `date` (ISO `YYYY-MM-DD`), and optional `hangout_id` (uuid or null). Submission SHALL call `POST /transactions/` with the validated body.

#### Scenario: Valid submission persists the transaction

- **WHEN** the user submits a valid form
- **THEN** `POST /transactions/` MUST be called with `{ subcategory_id, value, description, date, hangout_id }`
- **AND** while the request is pending, the submit button MUST be disabled and show a spinner

#### Scenario: Submission validation failure

- **WHEN** the form is submitted with one or more zod-invalid fields
- **THEN** `POST /transactions/` MUST NOT be called
- **AND** each invalid field MUST display its zod error message inline

#### Scenario: Successful submission closes the modal

- **WHEN** the create request resolves with 201
- **THEN** the modal MUST close back to the list
- **AND** no toast or alert MUST be shown — the freshly invalidated list and dashboard provide the visible feedback

#### Scenario: Failed submission keeps the modal open

- **WHEN** the create request fails
- **THEN** the modal MUST remain open with form state preserved
- **AND** an inline error message MUST be shown above the submit button

### Requirement: Subcategory picker uses bottom-sheet with debounced server search

The form's subcategory field SHALL open a `@gorhom/bottom-sheet`-based picker that calls `GET /subcategories/?name=&skip=&limit=` with `PICKER_PAGE_LIMIT` (50) as the page size and a 300ms debounce on the search input.

#### Scenario: Picker opens on field tap

- **WHEN** the user taps the subcategory field
- **THEN** a bottom sheet MUST open with a search input at the top and a list of subcategories below
- **AND** the initial fetch MUST use an empty `name` parameter

#### Scenario: Search debounce

- **WHEN** the user types into the picker's search input
- **THEN** the API MUST NOT be called for each keystroke
- **AND** at most one request MUST be in flight 300ms after the user stops typing

#### Scenario: Picker selection updates the form

- **WHEN** the user taps a subcategory
- **THEN** the bottom sheet MUST close
- **AND** the form's `subcategory_id` MUST be set
- **AND** the form's display field MUST show the chosen `subcategory_name`

#### Scenario: Empty result state

- **WHEN** the search returns zero subcategories
- **THEN** the sheet MUST show "No subcategories found" within the list area

### Requirement: Hangout picker is optional and follows the same pattern

The hangout field SHALL be optional. When present, it SHALL open a bottom-sheet picker calling `GET /hangouts/?name=&skip=&limit=`. A "Clear" affordance SHALL be available inside the picker.

#### Scenario: No hangout selected

- **WHEN** the user submits without selecting a hangout
- **THEN** the request body MUST include `hangout_id: null` (or omit the field)

#### Scenario: Clearing a previously selected hangout

- **WHEN** the user opens the picker and taps "Clear"
- **THEN** the form's `hangout_id` MUST be set to null
- **AND** the field's display MUST revert to a placeholder

### Requirement: Date field uses a native date picker

The form's `date` field SHALL use `@react-native-community/datetimepicker`. The default value SHALL be today (`new Date()`) and the value SHALL be stored in the form state as `YYYY-MM-DD`.

#### Scenario: Default date is today

- **WHEN** the form first renders
- **THEN** the date field MUST display the current date in the device locale
- **AND** the underlying form value MUST be the current date in `YYYY-MM-DD`

#### Scenario: User picks a date

- **WHEN** the user picks a date and confirms
- **THEN** the form value MUST update to the chosen date in `YYYY-MM-DD`

### Requirement: Successful create invalidates list and dashboard caches

On successful `POST /transactions/`, the mutation SHALL invalidate React Query keys so the list and dashboard reflect the new data.

#### Scenario: Cache invalidation set

- **WHEN** the create mutation succeeds
- **THEN** the following query keys MUST be invalidated: `[transactionsQueryKey]`, `[dashboardQueryKey, 'balance']`, `[dashboardQueryKey, 'monthBalance']`, `[dashboardQueryKey, 'duePeriodicExpenses']`

#### Scenario: Visible UI refresh

- **WHEN** the user closes the modal after a successful create
- **THEN** the transactions list MUST refetch the current month and show the new row in its sorted position
- **AND** the dashboard balances MUST refetch and reflect the new transaction next time the user opens that tab

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

### Requirement: Service layer for subcategories supports the picker

`src/services/subcategories/api.ts` SHALL export `getSubcategories(params)` calling `authFetch`. `src/services/subcategories/queries.ts` SHALL export `useSubcategoriesPicker(name)` as a `useInfiniteQuery` wrapper using `PICKER_PAGE_LIMIT` (50).

#### Scenario: api.ts exports the fetcher

- **WHEN** the codebase is inspected
- **THEN** `src/services/subcategories/api.ts` MUST export `getSubcategories`
- **AND** it MUST call `authFetch` and MUST NOT call `fetch` directly

#### Scenario: useSubcategoriesPicker uses the locked page size

- **WHEN** the picker fetches subcategories
- **THEN** the request MUST send `limit=50` (from `PICKER_PAGE_LIMIT`)
- **AND** the React Query key MUST include the current `name` filter

### Requirement: Service layer for hangouts supports the picker

`src/services/hangouts/api.ts` SHALL export `getHangouts(params)` calling `authFetch`. `src/services/hangouts/queries.ts` SHALL export `useHangoutsPicker(name)` as a `useInfiniteQuery` wrapper using `PICKER_PAGE_LIMIT` (50). No further hangout hooks are required by this change.

#### Scenario: api.ts exports the fetcher

- **WHEN** the codebase is inspected
- **THEN** `src/services/hangouts/api.ts` MUST export `getHangouts`
- **AND** it MUST call `authFetch` and MUST NOT call `fetch` directly

#### Scenario: useHangoutsPicker uses the locked page size

- **WHEN** the picker fetches hangouts
- **THEN** the request MUST send `limit=50` (from `PICKER_PAGE_LIMIT`)
- **AND** the React Query key MUST include the current `name` filter

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
- **AND** an inline error message MUST be shown to the user

### Requirement: Edit screen exposes a delete affordance

The edit screen SHALL include a "Delete" button rendered in the form header. Tapping it SHALL trigger the same delete confirmation flow used by the list's action sheet. On successful delete, the modal SHALL close back to the list.

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

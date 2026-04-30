## ADDED Requirements

### Requirement: Hangouts tab is registered in the tabs layout

`app/(tabs)/_layout.tsx` SHALL register a fourth `Tabs.Screen` named "hangouts" labelled "Hangouts" with the `person.2.fill` icon. The tab SHALL render `<HangoutsListScreen />` from `src/features/hangouts/HangoutsListScreen.tsx` via the route file `app/(tabs)/hangouts.tsx`.

#### Scenario: Hangouts tab exists

- **WHEN** an authenticated user opens the app
- **THEN** the bottom tab bar MUST show four tabs in order: Dashboard, Transactions, Hangouts, Profile
- **AND** the Hangouts tab MUST render the hangouts list, not scaffold content

### Requirement: Hangouts list is paginated and supports server-side search

The hangouts list SHALL fetch from `GET /hangouts/?name=&skip=&limit=` using TanStack Query's `useInfiniteQuery` via a new `useInfiniteHangouts(name?)` hook. Page size SHALL be `DEFAULT_LIST_LIMIT` (50). The screen SHALL render a search input above the list that debounces input by 300 ms before triggering a refetch with the new `name` filter.

#### Scenario: Initial render fetches the first page unfiltered

- **WHEN** the list mounts
- **THEN** it MUST call `GET /hangouts/` with `skip=0`, `limit=50`, and no `name` parameter
- **AND** rows MUST display the hangout's `name` and `date`

#### Scenario: Reaching the end fetches the next page

- **WHEN** the user scrolls within `onEndReachedThreshold` of the list end and `has_more` is true
- **THEN** the next page MUST be fetched via `fetchNextPage` using the API-returned `next_skip`
- **AND** the new items MUST append to the existing list, not replace it

#### Scenario: Search debounce

- **WHEN** the user types into the search input
- **THEN** the API MUST NOT be called for each keystroke
- **AND** at most one request MUST be in flight 300 ms after the user stops typing

#### Scenario: Empty list shows a placeholder

- **WHEN** the API returns zero items for the current search
- **THEN** the screen MUST render a placeholder (e.g., "No hangouts found")
- **AND** the FAB to create a new hangout MUST remain visible

#### Scenario: Initial load fails

- **WHEN** the first page fetch fails
- **THEN** the screen MUST render an inline error message and a "Retry" button that calls `refetch`

### Requirement: Tapping a hangout row opens an action sheet

Each rendered row in `HangoutsListScreen` SHALL be wrapped in a `Pressable`. Tapping a row SHALL open an in-screen action sheet listing "Edit", "Delete", and "Cancel". Selecting "Edit" SHALL navigate to the edit modal. Selecting "Delete" SHALL trigger the delete confirmation flow. Selecting "Cancel" or tapping the backdrop SHALL dismiss the sheet without action.

#### Scenario: Row tap opens the action sheet

- **WHEN** the user taps a hangout row
- **THEN** an action sheet MUST appear with the options "Edit", "Delete", and "Cancel"
- **AND** the row that triggered the sheet MUST be tracked so subsequent actions know which hangout is targeted

#### Scenario: Edit selection routes to the edit modal

- **WHEN** the user taps "Edit" in the action sheet
- **THEN** the sheet MUST close
- **AND** the app MUST navigate to `/hangout-edit/<id>` presented as a modal

#### Scenario: Delete selection opens confirmation after sheet dismissal

- **WHEN** the user taps "Delete" in the action sheet
- **THEN** the sheet MUST close
- **AND** the `Alert.alert` confirmation MUST be shown after a brief delay (≥300 ms) to avoid the Modal-dismiss animation suppressing the Alert on Android

### Requirement: Create-hangout flow is a modal route

The route `app/hangout-new.tsx` SHALL render `<CreateHangoutScreen />` from `src/features/hangouts/CreateHangoutScreen.tsx` wrapped in `<AuthGate>`. The route SHALL be registered in `app/_layout.tsx` with `presentation: 'modal'` and `headerShown: false`. The screen SHALL render `<HangoutForm />` configured with zero-state defaults and `submitLabel="Save hangout"`. Submission SHALL call `POST /hangouts/` with the validated body.

#### Scenario: FAB opens the create modal

- **WHEN** the user taps the FAB on `HangoutsListScreen`
- **THEN** the app MUST navigate to `/hangout-new` presented as a modal
- **AND** the underlying tabs UI MUST remain mounted in the background

#### Scenario: Valid submission persists the hangout

- **WHEN** the user submits a valid form
- **THEN** `POST /hangouts/` MUST be called with `{ name, date, description }`
- **AND** while the request is pending, the submit button MUST be disabled and show a spinner

#### Scenario: Successful create closes the modal

- **WHEN** the create request resolves with 201
- **THEN** the modal MUST close back to the hangouts list
- **AND** the hangouts list cache MUST be invalidated so the new row appears

#### Scenario: Failed create keeps the modal open

- **WHEN** the create request fails
- **THEN** the modal MUST remain open with form state preserved
- **AND** an inline error message MUST be shown above the submit button

### Requirement: Edit-hangout screen pre-fills the form and submits via PATCH

The route `app/hangout-edit/[id].tsx` SHALL render `<EditHangoutScreen />` from `src/features/hangouts/EditHangoutScreen.tsx` wrapped in `<AuthGate>`. The route SHALL be registered in `app/_layout.tsx` with `presentation: 'modal'` and `headerShown: false`. The screen SHALL fetch the hangout via `useHangout(id)` and SHALL render `<HangoutForm />` with `defaultValues` derived from the fetched record. Submission SHALL call `PATCH /hangouts/{id}/` with the validated body.

#### Scenario: Initial fetch blocks the form render

- **WHEN** the edit screen mounts
- **THEN** the screen MUST call `GET /hangouts/{id}/` once before rendering the form
- **AND** while the fetch is pending the screen MUST render a centred loading indicator

#### Scenario: Form is pre-filled from the fetched record

- **WHEN** the fetch resolves successfully
- **THEN** the form's `name`, `date`, and `description` MUST be initialised from the fetched record

#### Scenario: Successful update closes the modal and refreshes dependent caches

- **WHEN** the update request resolves with 200
- **THEN** the modal MUST close back to the hangouts list
- **AND** both the hangouts list and the transactions list caches MUST be invalidated so transaction rows showing the renamed hangout pick up the new name

#### Scenario: Failed update keeps the modal open

- **WHEN** the update request fails
- **THEN** the modal MUST remain open with form state preserved
- **AND** an inline error message MUST be shown above the submit button

#### Scenario: Hangout was already deleted

- **WHEN** the initial fetch resolves with 404
- **THEN** the screen MUST render a "Hangout no longer exists" message with a back action
- **AND** the form MUST NOT be rendered

### Requirement: Edit screen exposes a delete affordance

`EditHangoutScreen` SHALL render a "Delete" button in the form header (via the `headerExtra` slot of `HangoutForm`). Tapping it SHALL trigger the same `Alert.alert` confirmation flow used by the list's action sheet. On successful delete, the modal SHALL close back to the list.

#### Scenario: Delete from the edit screen

- **WHEN** the user taps the delete button on the edit screen and confirms the prompt
- **THEN** `DELETE /hangouts/{id}/` MUST be called
- **AND** on success the modal MUST close back to the list and both `[hangoutsQueryKey]` and `[transactionsQueryKey]` MUST be invalidated

#### Scenario: Delete failure keeps the edit screen open

- **WHEN** the delete request fails from the edit screen
- **THEN** the modal MUST remain open with the form state intact
- **AND** an inline error message MUST be shown above the submit button

### Requirement: Delete confirmation flow uses optimistic removal with rollback

The list-screen delete flow SHALL show an `Alert.alert` confirmation before issuing the request. On confirm, the row SHALL be removed optimistically from any matching infinite list pages cached under `[hangoutsQueryKey, 'list', …]`. On request success, both `[hangoutsQueryKey]` and `[transactionsQueryKey]` SHALL be invalidated. On request failure, the snapshot SHALL be restored and a transient inline error banner MUST be shown above the list with auto-dismiss after a few seconds.

#### Scenario: Confirmation must be explicit

- **WHEN** the user taps "Delete" in the action sheet and the confirmation `Alert.alert` appears
- **THEN** `DELETE /hangouts/{id}/` MUST NOT be called until the user taps the destructive "Delete" option

#### Scenario: Optimistic removal on confirm

- **WHEN** the user confirms deletion
- **THEN** the row MUST disappear from the list immediately (before the network response)
- **AND** the prior cache state MUST be snapshotted so it can be restored on failure

#### Scenario: Successful delete invalidates both hangouts and transactions caches

- **WHEN** `DELETE /hangouts/{id}/` resolves successfully
- **THEN** both `[hangoutsQueryKey]` and `[transactionsQueryKey]` MUST be invalidated so transaction rows whose `hangout_id` matched the deleted hangout refresh

#### Scenario: Failed delete restores the row and shows an error

- **WHEN** `DELETE /hangouts/{id}/` fails
- **THEN** the cache MUST be restored from the snapshot so the row reappears in its original position
- **AND** an inline error banner MUST be shown above the list (auto-dismissing after a few seconds)

### Requirement: HangoutForm is a shared component used by create and edit screens

`src/features/hangouts/HangoutForm.tsx` SHALL be the single owner of the hangout form's UI, validation schema, date-picker integration, and submit-button rendering. `CreateHangoutScreen` and `EditHangoutScreen` SHALL both render this component, passing only the props that differ between modes (`defaultValues`, `submitLabel`, `headerTitle`, `onSubmit`, `headerExtra?`).

#### Scenario: Shared form component exists

- **WHEN** the codebase is inspected
- **THEN** `src/features/hangouts/HangoutForm.tsx` MUST exist and export a `HangoutForm` component
- **AND** `CreateHangoutScreen.tsx` and `EditHangoutScreen.tsx` MUST both import and render it

#### Scenario: Form validation rules

- **WHEN** the form schema is checked
- **THEN** `name` MUST be required (length 1–140), `date` MUST be a valid `YYYY-MM-DD` string, and `description` MUST be optional (max 500 characters)

#### Scenario: Default date is today on create

- **WHEN** the create form first renders
- **THEN** the date field MUST default to the current date in `YYYY-MM-DD`

### Requirement: Service layer for hangouts is fully implemented

`src/services/hangouts/api.ts` SHALL export `getHangouts(params)`, `getHangout(id)`, `createHangout(body)`, `updateHangout(id, body)`, and `deleteHangout(id)` as plain async fetcher functions calling `authFetch`. `src/services/hangouts/queries.ts` SHALL export `useHangoutsPicker(name?)` (unchanged), `useInfiniteHangouts(name?)`, `useHangout(id)`, `useCreateHangout()`, `useUpdateHangout()`, and `useDeleteHangout()` as React Query hooks wrapping those fetchers.

#### Scenario: api.ts exports the full set of fetchers using authFetch

- **WHEN** the codebase is inspected
- **THEN** `src/services/hangouts/api.ts` MUST export `getHangouts`, `getHangout`, `createHangout`, `updateHangout`, and `deleteHangout`
- **AND** each MUST call `authFetch` and MUST NOT call `fetch` directly

#### Scenario: queries.ts exports list, detail, picker, create, update, and delete hooks

- **WHEN** a screen needs hangouts data or to mutate a hangout
- **THEN** it MUST import from `src/services/hangouts/queries.ts`
- **AND** it MUST NOT call `authFetch`, `getHangouts`, `getHangout`, `createHangout`, `updateHangout`, or `deleteHangout` directly from the screen

#### Scenario: List and picker use distinct cache key namespaces

- **WHEN** `useInfiniteHangouts(name?)` and `useHangoutsPicker(name?)` are both active
- **THEN** they MUST use distinct query key namespaces (`[hangoutsQueryKey, 'list', …]` vs `[hangoutsQueryKey, 'picker', …]`) so that picker refetches do not duplicate list pagination state

#### Scenario: Update and delete invalidate transactions cache

- **WHEN** `useUpdateHangout` or `useDeleteHangout` resolves successfully
- **THEN** the React Query keys `[hangoutsQueryKey]` and `[transactionsQueryKey]` MUST be invalidated so transaction rows displaying the renamed or removed hangout refresh

#### Scenario: Create invalidates only hangouts cache

- **WHEN** `useCreateHangout` resolves successfully
- **THEN** only `[hangoutsQueryKey]` MUST be invalidated; the transactions cache MUST NOT be invalidated because no existing transaction can reference a hangout that was just created

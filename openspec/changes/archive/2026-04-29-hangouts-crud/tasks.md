## 1. Service layer

- [x] 1.1 Add `getHangout(id)` fetcher in `src/services/hangouts/api.ts` calling `authFetch(hangoutsPaths.get(id))`
- [x] 1.2 Add `createHangout(body)` fetcher (POST `hangoutsPaths.list`)
- [x] 1.3 Add `updateHangout(id, body)` fetcher (PATCH `hangoutsPaths.update(id)`)
- [x] 1.4 Add `deleteHangout(id)` fetcher (DELETE `hangoutsPaths.delete(id)`)
- [x] 1.5 Add `useInfiniteHangouts(name?)` hook in `src/services/hangouts/queries.ts` keyed by `[hangoutsQueryKey, 'list', { name }]` using `DEFAULT_LIST_LIMIT` (50)
- [x] 1.6 Add `useHangout(id)` `useQuery` hook keyed by `[hangoutsQueryKey, 'detail', id]`
- [x] 1.7 Add a private `useInvalidateHangoutsAndTransactions` helper that invalidates both `[hangoutsQueryKey]` and `[transactionsQueryKey]`
- [x] 1.8 Add `useCreateHangout()` `useMutation` hook that on success invalidates only `[hangoutsQueryKey]`
- [x] 1.9 Add `useUpdateHangout()` `useMutation` hook that on success invalidates both `[hangoutsQueryKey]` and `[transactionsQueryKey]`
- [x] 1.10 Add `useDeleteHangout()` `useMutation` hook with optimistic removal across cached `[hangoutsQueryKey, 'list', …]` infinite list pages, snapshot/rollback on error, and the cross-cache invalidation set on success

## 2. HangoutForm shared component

- [x] 2.1 Create `src/features/hangouts/HangoutForm.tsx` with the same shape as `TransactionForm`: header (Cancel + title + headerExtra slot), name input, date pressable + `DateTimePicker`, description multiline input, submit button
- [x] 2.2 Define and export the zod schema (`name` 1–140 chars, `date` `YYYY-MM-DD`, `description` optional max 500) and `defaultHangoutValues`
- [x] 2.3 Define props: `defaultValues`, `submitLabel`, `headerTitle`, `onSubmit`, `headerExtra?`
- [x] 2.4 Wire the submit error display (the `submitError` state pattern used by `TransactionForm`)

## 3. Hangouts list screen

- [x] 3.1 Create `src/features/hangouts/HangoutsListScreen.tsx` modelled after `TransactionsListScreen` (header with search input, FAB, list, action sheet, error banner)
- [x] 3.2 Wire the search input with a 300 ms debounce (use a small `useEffect` + `setTimeout` pattern; no new dependency)
- [x] 3.3 Render an infinite `FlatList` of rows showing `name` (primary) and `date` (secondary)
- [x] 3.4 Wrap each row in a `Pressable` and add `selectedRow` state; tapping opens the in-screen `Modal` action sheet (Edit / Delete / Cancel)
- [x] 3.5 Wire "Edit" to `router.push({ pathname: '/hangout-edit/[id]', params: { id } })` and dismiss the sheet
- [x] 3.6 Wire "Delete" to dismiss the sheet, then `setTimeout(() => Alert.alert(...), 350)` to confirm; on confirm fire `useDeleteHangout`
- [x] 3.7 Add the FAB → `router.push('/hangout-new')`
- [x] 3.8 Add the transient inline error banner (4 s auto-dismiss) for delete failures, mirroring `TransactionsListScreen`'s `deleteError` state

## 4. Create-hangout screen + route

- [x] 4.1 Create `src/features/hangouts/CreateHangoutScreen.tsx` that renders `<HangoutForm />` with zero-state defaults, `submitLabel="Save hangout"`, `headerTitle="New Hangout"`, and an `onSubmit` that calls `useCreateHangout` then `router.back()`
- [x] 4.2 Create `app/hangout-new.tsx` that wraps `<CreateHangoutScreen />` in `<AuthGate>`
- [x] 4.3 Register the modal route in `app/_layout.tsx` (`<Stack.Screen name="hangout-new" options={{ presentation: 'modal', headerShown: false }} />`)

## 5. Edit-hangout screen + route

- [x] 5.1 Create `app/hangout-edit/[id].tsx` that wraps `<EditHangoutScreen />` in `<AuthGate>`
- [x] 5.2 Register the modal route in `app/_layout.tsx` (`<Stack.Screen name="hangout-edit/[id]" options={{ presentation: 'modal', headerShown: false }} />`)
- [x] 5.3 Create `src/features/hangouts/EditHangoutScreen.tsx`:
  - read `id` via `useLocalSearchParams`
  - call `useHangout(id)` and render loading / error / not-found states (mirror `EditTransactionScreen`)
  - on success render `<HangoutForm />` with `defaultValues` from the fetched record, `submitLabel="Save changes"`, `headerTitle="Edit Hangout"`, `onSubmit` wired to `useUpdateHangout`, and a delete button via `headerExtra`
- [x] 5.4 Implement the delete button: `Alert.alert` confirmation → `useDeleteHangout` → `router.back()` on success (no need for the 350 ms delay here — there is no Modal action sheet to dismiss first)

## 6. Tab registration

- [x] 6.1 Create `app/(tabs)/hangouts.tsx` that renders `<HangoutsListScreen />`
- [x] 6.2 Add the fourth `Tabs.Screen` to `app/(tabs)/_layout.tsx` with `name="hangouts"`, `title="Hangouts"`, and icon `name="person.2.fill"`
- [x] 6.3 If `person.2.fill` is missing from `components/ui/icon-symbol.tsx` MAPPING, add `'person.2.fill': 'group'` (Material Icons name)

## 7. Manual smoke test on device

- [x] 7.1 Tabs bar shows four tabs: Dashboard, Transactions, Hangouts, Profile; tapping Hangouts opens the list
- [x] 7.2 Initial list loads; rows show name + date; pagination triggers as expected on scroll
- [x] 7.3 Search debounces — typing fast issues only one request 300 ms after the last keystroke
- [x] 7.4 FAB opens the create modal; saving a valid hangout closes the modal and the row appears in the list
- [x] 7.5 Tap a row → action sheet appears with Edit / Delete / Cancel; cancel and backdrop both dismiss
- [x] 7.6 Edit flow: tap Edit → form pre-filled → change name → save → modal closes → list shows new name → open transactions list → existing rows tagged with that hangout show the new name (proves cross-cache invalidation works)
- [x] 7.7 Delete from list: tap Delete → confirm → row disappears immediately; transactions list refreshes and rows tagged with that hangout no longer show its name
- [x] 7.8 Delete failure: kill backend, attempt delete → row reappears, banner shows error, banner auto-dismisses after ~4 s
- [x] 7.9 Delete from edit screen: open edit → tap Delete in header → confirm → modal closes → row gone
- [x] 7.10 Stale row: open edit on row A, in another client delete row A, return to mobile edit screen → screen shows "Hangout no longer exists" with a back action
- [x] 7.11 Verify no regression on the transaction form's hangout picker — newly created hangouts appear in the picker after invalidation

## 1. Dependencies

- [x] 1.1 Install `@react-native-community/datetimepicker` via `npx expo install @react-native-community/datetimepicker`
- [x] 1.2 Verify the install added the dep to `package.json` and that `expo prebuild` is not needed (the lib auto-links via Expo modules config)

## 2. Service layer — transactions

- [x] 2.1 Implement `getTransactions(params: TransactionsListParams): Promise<GetTransactionsResponse>` in `src/services/transactions/api.ts` — `authFetch(transactionsPaths.list + '?' + URLSearchParams)`, then `.json()`
- [x] 2.2 Implement `createTransaction(body: TransactionCreate): Promise<TransactionRead>` in the same file — `authFetch(transactionsPaths.list, { method: 'POST', body: JSON.stringify(body) })`, then `.json()`
- [x] 2.3 Verify neither function calls `fetch` directly
- [x] 2.4 Implement `useInfiniteTransactions({ year, month })` in `src/services/transactions/queries.ts` — `useInfiniteQuery({ queryKey: [transactionsQueryKey, 'list', { year, month }], queryFn: ({ pageParam = 0 }) => getTransactions({ year, month, skip: pageParam, limit: DEFAULT_LIST_LIMIT }), initialPageParam: 0, getNextPageParam: lastPage => lastPage.has_more ? lastPage.next_skip : undefined })`
- [x] 2.5 Implement `useCreateTransaction()` — `useMutation({ mutationFn: createTransaction, onSuccess: invalidateTransactionsAndDashboard })`
- [x] 2.6 Implement helper `invalidateTransactionsAndDashboard(queryClient)` that invalidates `[transactionsQueryKey]`, `[dashboardQueryKey, 'balance']`, `[dashboardQueryKey, 'monthBalance']`, `[dashboardQueryKey, 'duePeriodicExpenses']`

## 3. Service layer — subcategories

- [x] 3.1 Implement `getSubcategories(params: SubcategoriesListParams): Promise<GetSubcategoriesResponse>` in `src/services/subcategories/api.ts` — `authFetch` with URLSearchParams
- [x] 3.2 Verify it does not call `fetch` directly
- [x] 3.3 Implement `useSubcategoriesPicker(name?: string)` in `src/services/subcategories/queries.ts` — `useInfiniteQuery` keyed `[subcategoriesQueryKey, 'picker', { name }]`, fetching with `limit: PICKER_PAGE_LIMIT`, paginating via `next_skip`/`has_more`

## 4. Service layer — hangouts (picker only)

- [x] 4.1 Implement `getHangouts(params: HangoutsListParams): Promise<GetHangoutsResponse>` in `src/services/hangouts/api.ts` — `authFetch` with URLSearchParams
- [x] 4.2 Verify it does not call `fetch` directly
- [x] 4.3 Implement `useHangoutsPicker(name?: string)` in `src/services/hangouts/queries.ts` — same shape as `useSubcategoriesPicker`

## 5. Bottom-sheet picker component

- [x] 5.1 Create `src/features/transactions/pickers/ResourcePicker.tsx` — generic component taking `{ items, isLoading, hasNextPage, fetchNextPage, onSearch, onSelect, renderItem, emptyLabel, sheetRef }`. Internal: `BottomSheetModal` from `@gorhom/bottom-sheet` + `BottomSheetTextInput` + `BottomSheetFlatList` with infinite-scroll
- [x] 5.2 Apply 300ms debounce on the search input (use a small inline `useDebouncedValue` hook or `setTimeout` cleanup)
- [x] 5.3 Empty state: render `emptyLabel` when items.length === 0 and not loading
- [x] 5.4 Verify `BottomSheetModalProvider` is mounted at `app/_layout.tsx`; if not, add it (must wrap `Auth0Provider` and `AuthGate` so sheets render above the navigator)

## 6. Subcategory picker

- [x] 6.1 Create `src/features/transactions/pickers/SubcategoryPicker.tsx` — wraps `ResourcePicker` with `useSubcategoriesPicker`. Renders each item as subcategory name + category name secondary line
- [x] 6.2 Forward `sheetRef` and `onSelect(subcategory: SubcategoryRead)` to the parent form

## 7. Hangout picker

- [x] 7.1 Create `src/features/transactions/pickers/HangoutPicker.tsx` — wraps `ResourcePicker` with `useHangoutsPicker`
- [x] 7.2 Add a "Clear" row pinned at the top of the sheet that calls `onSelect(null)`

## 8. Transaction list screen

- [x] 8.1 Create `src/features/transactions/TransactionsListScreen.tsx`
- [x] 8.2 Local state: `const [selectedMonth, setSelectedMonth] = useState({ year, month })` initialised from `new Date()`
- [x] 8.3 Header: previous/next buttons around a label like "April 2026"; disable next if selected month is the current month or beyond
- [x] 8.4 Body: `FlatList` rendering items flattened from `data.pages.flatMap(p => p.items)`; `onEndReached` calls `fetchNextPage()` if `hasNextPage` and not `isFetchingNextPage`
- [x] 8.5 Each row: date (left), subcategory name + description (centre), signed value (right). Hangout name as small secondary text under description when non-null
- [x] 8.6 Footer: spinner while `isFetchingNextPage`; "Couldn't load more — Retry" when next-page errored
- [x] 8.7 Initial loading: centred spinner; initial error: inline error + retry calling `refetch`
- [x] 8.8 Empty state: "No transactions in <month label>" when initial data resolves with zero items
- [x] 8.9 Floating Action Button (FAB) bottom-right calling `router.push('/transaction-new')`
- [x] 8.10 Style with NativeWind classes only; use `formatValue` for the value column

## 9. Tab wiring

- [x] 9.1 Replace `app/(tabs)/explore.tsx` with `app/(tabs)/transactions.tsx` rendering `<TransactionsListScreen />`
- [x] 9.2 Update `app/(tabs)/_layout.tsx`: replace the `Tabs.Screen name="explore"` entry with `name="transactions"`, title "Transactions", icon `list.bullet`
- [x] 9.3 Add `'list.bullet': 'list'` to the `MAPPING` in `components/ui/icon-symbol.tsx`

## 10. Create-transaction modal route

- [x] 10.1 Edit `app/_layout.tsx` to register a stack screen `transaction-new` with `presentation: 'modal'`
- [x] 10.2 Create `app/transaction-new.tsx` rendering `<CreateTransactionScreen />` from `src/features/transactions/CreateTransactionScreen.tsx`
- [x] 10.3 Wrap the modal in `<AuthGate>` so an unauthenticated user can't open it

## 11. Create-transaction form

- [x] 11.1 Create `src/features/transactions/CreateTransactionScreen.tsx`
- [x] 11.2 Define a zod schema with: `subcategory_id` (uuid), `value` (number, refine non-zero), `description` (string min 1 max 280), `date` (regex `^\d{4}-\d{2}-\d{2}$`), `hangout_id` (uuid().nullable().optional())
- [x] 11.3 Use `useForm` with `zodResolver(schema)` and defaults: `value: 0`, `description: ''`, `date: today as YYYY-MM-DD`, `subcategory_id: undefined`, `hangout_id: null`
- [x] 11.4 Subcategory field: tappable Pressable that opens `SubcategoryPicker`; on select, set `subcategory_id` and stash `subcategory_name` in component state for display
- [x] 11.5 Value field: `TextInput` with `keyboardType="decimal-pad"`, two-decimal formatting, parsed back to number
- [x] 11.6 Description field: `TextInput`, max 280 chars
- [x] 11.7 Date field: tappable Pressable showing the current value formatted in device locale; tapping opens `DateTimePicker` from `@react-native-community/datetimepicker` with `mode="date"`; on change, store `YYYY-MM-DD`
- [x] 11.8 Hangout field: tappable Pressable opening `HangoutPicker`; selecting null clears the field
- [x] 11.9 Submit button: disabled when `formState.isSubmitting` or when `mutation.isPending`; spinner inside when pending
- [x] 11.10 On submit: call `mutation.mutateAsync(values)`; on success, `router.back()`; on error, set a top-of-form error message via `useState`
- [x] 11.11 Header "Cancel" button calling `router.back()`
- [x] 11.12 Style with NativeWind only

## 12. Update memory / docs

- [x] 12.1 Confirm no CLAUDE.md updates are needed; if a future-state hint exists in `memory/project_state.md`, update it to reflect "transactions screen merged" once implementation is complete

## 13. Manual verification on Android dev client

- [ ] 13.1 Sign in → Transactions tab visible as second tab with list icon
- [ ] 13.2 List shows current month's transactions; scrolling near the end loads more pages until `has_more: false`
- [ ] 13.3 Switching month via the header reloads the list with the new month's data
- [ ] 13.4 Empty month shows the placeholder; FAB still tappable
- [ ] 13.5 Airplane mode: initial load shows error + retry; recovering connectivity → retry succeeds
- [ ] 13.6 FAB opens the create modal; cancel returns to the list
- [ ] 13.7 Subcategory picker opens; typing filters server-side after debounce; selecting one updates the form display
- [ ] 13.8 Date picker opens; choosing a date updates the field
- [ ] 13.9 Optional hangout: selecting one sets it; "Clear" returns to placeholder
- [ ] 13.10 Submit a valid transaction → modal closes; the new row appears in the list (sorted as the API returns); switching to Dashboard shows updated balances
- [ ] 13.11 Submit an invalid transaction (empty description, zero value, no subcategory) → inline errors; no network request

## 14. OpenSpec validation

- [x] 14.1 Run `openspec validate add-transactions-screen` and resolve any issues
- [x] 14.2 Run `openspec status --change add-transactions-screen` and confirm `isComplete` is true

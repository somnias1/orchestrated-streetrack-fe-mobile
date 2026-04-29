## Context

The mobile-companion-scope locks the techspec stack: `expo-router` for routing, `@tanstack/react-query` v5 for server state, `react-hook-form` + `zod` for any 2+ field form, and `@gorhom/bottom-sheet` for the Subcategory/Hangout pickers. All four are already installed and used. The transactions service has typed stubs (`api.ts`, `queries.ts`) but no implementation; `subcategories/{api,queries}.ts` are also empty stubs that this change is the first consumer of (the create form needs a subcategory picker). The dashboard, just shipped, uses `authFetch` + a single `useQuery` per resource — this change introduces the first **infinite list** and the first **mutation+invalidation** patterns in the app, so the design choices here will be referenced by future changes (subcategories management, hangouts, etc).

## Goals / Non-Goals

**Goals:**
- A Transactions tab that replaces the Expo `(tabs)/explore` scaffold and uses an infinite-scroll list filtered to the current month by default.
- A "Add transaction" creation flow reachable from the list with a single FAB; the form persists via `POST /transactions/`, dismisses to the list on success, and visibly updates both the list AND the dashboard balances/periodic-expenses.
- Establish reusable patterns for `useInfiniteQuery` pagination, bottom-sheet pickers backed by debounced server-driven autocomplete, and cross-resource cache invalidation that subsequent screens can copy.

**Non-Goals:**
- Edit / delete / bulk-create transactions.
- Filters beyond the month picker (no subcategory or hangout filter on the list, no day-level filter).
- Offline mutation queueing; if the create fails the user retries manually.
- Subcategory / hangout creation from inside the picker — pickers are read-only this iteration; if no subcategory exists, the user is shown an empty state pointing them at a future subcategories screen.
- CSV / PDF export.

## Decisions

### D1. Pagination: `useInfiniteQuery` keyed by `[transactionsQueryKey, 'list', { year, month }]`

The list uses `@tanstack/react-query`'s `useInfiniteQuery`. Page size is `DEFAULT_LIST_LIMIT` (50). The `pageParam` is the `skip` cursor returned by the API (`next_skip` from `PaginatedRead`). `getNextPageParam` returns `next_skip` when `has_more` is true, otherwise `undefined`. The query key is `[transactionsQueryKey, 'list', { year, month }]` — month change produces a new key (no manual `setQueryData` shuffling).

**Why not a manual `skip`/`limit` cursor in component state?** Because TanStack Query already implements correct cache reuse, retry, and focus-refetch for infinite queries. Re-implementing it in state defeats the purpose of the query lock from the techspec.

**Alternative considered**: cursor-based pagination using a date cursor. Rejected — backend API exposes `skip`/`limit`, not cursors, and re-shaping it client-side adds complexity without benefit.

### D2. List rendering: `FlatList` with `onEndReached`

The list uses `react-native`'s built-in `FlatList`. `onEndReached` calls `fetchNextPage()` when not already fetching and `hasNextPage` is true. `onEndReachedThreshold` is `0.5`. No FlashList introduction this change — a 50-row page on a typical device renders fine in `FlatList` and the techspec doesn't lock a specific list lib.

### D3. Month filter: state-only, current month default

The selected `{ year, month }` lives in component-local `useState`, initialized from `new Date()`. A header control (`<` and `>` buttons around a label) increments/decrements the month. No URL param, no global store — month is purely a list-screen concern.

### D4. Create form: react-hook-form + zod, modal route at `app/transaction-new.tsx`

The create flow is a **modal-presented expo-router route** (`presentation: 'modal'` in the route options) sitting outside the `(tabs)` group, so it overlays both the list and the dashboard. This matches the techspec's "modal for create" pattern and keeps the list visible underneath via the modal animation. The form schema is a single `zod` object validating `subcategory_id` (uuid), `value` (number, non-zero), `description` (1–280), `date` (ISO `YYYY-MM-DD`), `hangout_id` (optional uuid).

**Why modal route instead of a sheet within the tab?** Modal routes get correct hardware-back behavior (Android back closes the modal without leaving the tab) for free, and the form can navigate to nested picker routes if needed without nesting bottom-sheets.

### D5. Subcategory picker: `@gorhom/bottom-sheet` + `useInfiniteQuery`-backed list with debounced search

The picker is a controlled bottom-sheet rendered inside the create form. The search input uses 300ms debounce on the `name` query param. The list inside the sheet is its own `useInfiniteQuery({ queryKey: [subcategoriesQueryKey, 'picker', { name }] })` using `PICKER_PAGE_LIMIT` from `src/services/types.ts`. The sheet pre-filters `belongs_to_income` based on whether the user is recording an income or expense — and since we're not splitting the form by sign, the picker shows ALL subcategories and the value sign is derived from the chosen subcategory's `belongs_to_income` server-side.

**Decision on sign**: rather than asking the user to pick "income" vs "expense" first, the value field accepts a positive amount and the backend treats it as income or expense depending on the subcategory's `belongs_to_income`. Frontend just sends the absolute value.

### D6. Hangout picker: same pattern, optional, defaults to none

Identical bottom-sheet pattern keyed by `[hangoutsQueryKey, 'picker', { name }]`. Since `hangouts` is a Tier-2 module per scope and we have no list screen for it yet, this change implements only the picker-shaped query (`useHangoutsPicker(name)`) — no full list/CRUD hooks. The form's hangout field is optional; clearing it sends `hangout_id: null`.

### D7. Date picker: `@react-native-community/datetimepicker`

Adds the standard Expo-supported native picker (Tier 2, Android-only target = Android native dialog). Field stores an ISO `YYYY-MM-DD` string in the form state; the picker emits a `Date` object that's serialized via `toISOString().slice(0, 10)`. Default value is today.

**Alternative considered**: a text input with regex validation. Rejected — bad mobile UX for date entry and the dependency is small and well-supported.

### D8. Cache invalidation on create success

On successful `POST /transactions/`, the `useCreateTransaction` mutation calls `queryClient.invalidateQueries` for:

- `[transactionsQueryKey]` — wipes ALL transactions queries (list, future detail). Simpler than per-month invalidation; the list will refetch only the visible month.
- `[dashboardQueryKey, 'balance']`
- `[dashboardQueryKey, 'monthBalance']` (without specific year/month — invalidates all month variants)
- `[dashboardQueryKey, 'duePeriodicExpenses']` (without specific year/month)

Optimistic updates are deliberately **not** used: the user is on a modal that closes on success, the dashboard re-render after invalidation is the visible feedback, and getting optimistic updates right for a paginated list with computed `total/has_more` is tricky.

### D9. Service-layer organisation

`src/services/transactions/api.ts` exports `getTransactions(params)`, `createTransaction(body)` — both via `authFetch`. `queries.ts` exports `useInfiniteTransactions({ year, month })` and `useCreateTransaction()`. The same shape is mirrored for subcategories: `getSubcategories(params)` + `useSubcategoriesPicker(name)`. Hangouts gets only `getHangouts(params)` + `useHangoutsPicker(name)` for now.

### D10. Tab icon

The tab uses `list.bullet` SF Symbol → mapped to `list` Material Icon in `components/ui/icon-symbol.tsx`. Tab title is "Transactions".

## Risks / Trade-offs

- **[Risk] `invalidateQueries` without a specific predicate over-fetches** → Mitigation: the only impacted users have just created a transaction, and the cost is a single re-fetch of three small dashboard endpoints + one transactions list. Acceptable. If profiling shows it matters later, narrow the predicate.
- **[Risk] Month-picker UX is minimal** (just `<` `>` buttons, no calendar to jump months) → Mitigation: explicitly out of scope; the 90% case is the current month, and a future change can add a calendar drawer if needed.
- **[Risk] The picker shows ALL subcategories regardless of income/expense** → Mitigation: D5 documents that the sign is server-derived, so this is the intended behaviour, not a leak. The server is the authority on which subcategories belong to income vs expense.
- **[Risk] No optimistic update means a slow network creates a perceptible lag between modal-close and dashboard refresh** → Mitigation: `mutation.isPending` keeps the modal open with a spinner until the server responds; only on success do we close. The dashboard refresh is then near-instant from cache invalidation. If perceived latency becomes a complaint, revisit with optimistic updates.
- **[Trade-off] Modal route vs bottom-sheet form** → modal route was chosen (D4). The bottom-sheet form alternative would have allowed a more "compact" feel but couldn't host the bottom-sheet pickers cleanly (sheet-in-sheet is brittle on Android).

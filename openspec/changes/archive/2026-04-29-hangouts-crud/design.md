## Context

The transactions feature now has the full CRUD lifecycle (list, create, edit, delete) with a stable set of patterns: a shared form component, a modal-presentation create/edit pair, an in-screen `Modal` action sheet on the list, and an optimistic-delete mutation with snapshot/rollback. Hangouts is structurally simpler — flat fields (`name`, `date`, `description`), no foreign keys to render, no pickers — so this change deliberately copies those patterns rather than inventing new ones.

The mobile-companion-scope locks two facts that shape the design: (a) bottom-sheet pickers are reserved for transaction-form selection, not for management screens, so the hangouts list is a full-tab `FlatList`, not a sheet; (b) v1.0 is online-first, so optimistic UI is acceptable for delete only — create and edit wait on the server.

## Goals / Non-Goals

**Goals:**
- Allow the user to list, search, create, edit, and delete hangouts entirely from mobile.
- Ensure transaction list/detail views reflect hangout renames and removals without a manual refresh.
- Keep the implementation patterns identical to the transactions feature so a future maintainer recognises the structure on sight.
- Preserve the existing `useHangoutsPicker` hook untouched — the transaction form's hangout picker is contractually stable.

**Non-Goals:**
- Inline "Create new hangout" affordance inside the transaction form's hangout picker. Possible future work; not in this change.
- Hangout-scoped transaction filtering (e.g. tap a hangout → see all its transactions). Not in v1.x scope.
- Bulk operations, swipe gestures, undo, hangout templates, recurring hangouts.
- Categories or subcategories CRUD (locked Tier 3 per `mobile-companion-scope`).

## Decisions

### D1 — Fourth tab labelled "Hangouts" with `person.2.fill` icon

Hangouts are user-managed reference data with on-the-go creation as the headline use case. A tab is the most discoverable and quick-access placement. Three tabs → four is still within the comfortable mobile range. The icon `person.2.fill` reads as "group of people" which matches the social-context meaning of a hangout.

**Alternative considered**: place the management screen behind a button on the Profile tab. Rejected — buries it, contradicts the "on-the-go" use case from the scope.

**Alternative considered**: replace the existing `Tabs.Screen` for `profile` with a "More" tab containing both Profile and Hangouts. Rejected — adds a navigation level for no real density gain.

### D2 — Mirror the transactions UX patterns verbatim

The list screen, action sheet, modal create/edit routes, optimistic delete, error banner, and 350 ms Modal-to-Alert delay are all reused exactly. This avoids the cognitive cost of two slightly different patterns for two adjacent CRUD features.

Concretely: `HangoutsListScreen` owns the `selectedRow` + `deleteError` state, renders an in-screen `Modal` action sheet with Edit / Delete / Cancel, and delegates row-press handling identically to `TransactionsListScreen`.

### D3 — `HangoutForm` shared component

Symmetrical to `TransactionForm`: a single component owns the `useForm` setup, zod schema, submit-button rendering, and header. Props parameterise differences: `defaultValues`, `submitLabel`, `headerTitle`, `onSubmit`, `headerExtra?` (for the delete button on the edit screen).

The schema:
- `name`: `z.string().min(1).max(140)`
- `date`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`
- `description`: `z.string().max(500).optional().nullable()`

Date input uses the same `@react-native-community/datetimepicker` pattern as the transaction form — defaults to today on create, defaults to the existing record's date on edit.

### D4 — Cache invalidation set crosses into transactions

`useUpdateHangout` and `useDeleteHangout` MUST invalidate `[transactionsQueryKey]` in addition to `[hangoutsQueryKey]`. Reason: `TransactionRead.hangout_name` is denormalised — a hangout rename changes how every transaction tagged with that hangout displays. A hangout delete cascades the FK to null on the backend (the API contract); the mobile cache must refetch transactions so the relevant rows show "no hangout" rather than the stale name.

`useCreateHangout` does NOT need to invalidate transactions (no existing transaction can reference a hangout that didn't exist yet), so it only invalidates `[hangoutsQueryKey]`.

`useHangoutsPicker` reads from the same `[hangoutsQueryKey]` namespace, so it picks up new/renamed/removed hangouts automatically after invalidation.

### D5 — Optimistic delete with snapshot/rollback, mirroring `useDeleteTransaction`

The implementation copies the structure of `useDeleteTransaction`: snapshot all `[hangoutsQueryKey, …]` infinite-list pages on `onMutate`, splice the row out, restore on `onError`, run the standard invalidation set on `onSuccess`. Same justification: a one-shot destructive action shouldn't feel sluggish.

Note: optimistic delete only touches the hangouts list cache. The transactions list isn't optimistically updated — those rows will still display the old `hangout_name` until the post-success invalidation triggers a refetch. That's acceptable because (a) the delete page closes immediately so the user isn't staring at the transactions list during the gap, and (b) the worst case is a brief stale name, not data loss.

### D6 — Search uses the same debounced pattern as the transaction form pickers

The list screen's search input uses 300 ms debounce + server-side `name` icontains, identical to the picker. The hook is a NEW `useInfiniteHangouts(name?)` — distinct from `useHangoutsPicker(name?)` — even though they're functionally the same, because the cache key namespace is different (`[hangoutsQueryKey, 'list', { name }]` vs `[hangoutsQueryKey, 'picker', { name }]`). Splitting the keys lets each surface invalidate without disturbing the other; merging them would fight the cache on every mutation.

**Alternative considered**: reuse `useHangoutsPicker` for the list screen. Rejected — the picker uses `PICKER_PAGE_LIMIT` (50) which is fine for both, but conflating list and picker semantics under one key creates implicit coupling.

### D7 — Edit route is a separate modal at `/hangout-edit/[id]`

Same pattern as `/transaction-edit/[id]`: dynamic segment, `useLocalSearchParams` to read id, `useHangout(id)` to fetch the record, render `<HangoutForm />` once data resolves. Loading / error / 404 states identical to `EditTransactionScreen`.

## Risks / Trade-offs

- **Four-tab layout pushes label width** → Mitigation: the existing labels are short ("Dashboard", "Transactions", "Profile") and "Hangouts" fits. If text truncation appears on small devices, swap the icon-only tabBarLabel render later — not urgent.
- **Cache invalidation cost on hangout rename** → A rename triggers a full transactions list refetch on the active month. For a typical user with <100 transactions per month, the cost is negligible. If it becomes a problem, switch to a targeted `setQueryData` patch that updates only `hangout_name` in cached pages.
- **Picker doesn't see new hangout until next render** → After creating a hangout, the user might immediately open the transaction form and expect the new hangout. Because both surfaces share `[hangoutsQueryKey]` and the create mutation invalidates it, the picker will refetch on its next mount. No additional plumbing needed.
- **Race on edit if backend deletes a hangout that has transactions** → Backend cascades delete the `hangout_id` FK to null. Mobile relies on this — if backend behavior changes (e.g., refuses delete when transactions exist), the optimistic-delete rollback would fire and show the inline error. Acceptable.

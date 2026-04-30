## Why

Hangouts CRUD is the second and final Tier 2 module per `mobile-companion-scope`, justified there as "on-the-go nature of hangout creation" — the primary use case is creating a hangout at the start of a trip and tagging transactions to it on the spot. Today the mobile app can only consume hangouts via the picker; users must open the desktop to create, rename, or delete them. Shipping this closes the last Tier 2 gap and makes mobile fully self-sufficient for v1.x.

## What Changes

- Add a fourth tab "Hangouts" rendering a `<HangoutsListScreen />` with infinite-scroll list, search, and a FAB for create.
- Add a row tap → action sheet (Edit / Delete / Cancel) — same pattern as the transactions list, including the 350 ms `Modal → Alert` delay fix and optimistic delete with snapshot/rollback.
- Add modal routes `/hangout-new` and `/hangout-edit/[id]` (presentation: 'modal'), each rendering a shared `<HangoutForm />` configured for create or edit mode.
- Extract a `HangoutForm` shared component covering name, date, and optional description, validated by a `zod` schema and `react-hook-form` resolver.
- Extend `src/services/hangouts/api.ts` with `getHangout(id)`, `createHangout(body)`, `updateHangout(id, body)`, and `deleteHangout(id)` plain fetchers calling `authFetch`.
- Extend `src/services/hangouts/queries.ts` with `useInfiniteHangouts(name?)`, `useHangout(id)`, `useCreateHangout()`, `useUpdateHangout()`, `useDeleteHangout()` — the latter three SHALL invalidate the `[hangoutsQueryKey]` cache and ALSO `[transactionsQueryKey]` (because transactions denormalise `hangout_name`, so renaming or deleting a hangout changes how existing transaction rows render).

## Capabilities

### New Capabilities

- `hangouts-crud-screen`: a tab-rendered screen for listing hangouts with infinite scroll + search, and modal-presented create/edit screens with delete affordance, plus the supporting service layer extensions.

### Modified Capabilities

(none — this is purely additive; the existing `transactions-screen` capability is unaffected because the picker continues to use `useHangoutsPicker(name?)` unchanged.)

## Impact

- **Routes**: new `app/(tabs)/hangouts.tsx`, `app/hangout-new.tsx`, and `app/hangout-edit/[id].tsx`. Both modal routes registered in the root stack alongside `transaction-new` and `transaction-edit/[id]`.
- **Tabs layout**: `app/(tabs)/_layout.tsx` gains a fourth `Tabs.Screen` for hangouts (icon: `person.2.fill`).
- **Features**: new directory `src/features/hangouts/` containing `HangoutsListScreen.tsx`, `CreateHangoutScreen.tsx`, `EditHangoutScreen.tsx`, and `HangoutForm.tsx`.
- **Services**: `src/services/hangouts/api.ts` gains four fetchers; `src/services/hangouts/queries.ts` gains five hooks (one new list hook + detail + three mutations). The existing `useHangoutsPicker` is unchanged.
- **Cache invalidation**: hangout mutations invalidate both `[hangoutsQueryKey]` and `[transactionsQueryKey]` so the transactions list re-renders with updated `hangout_name` values.
- **Backend**: consumes existing `POST /hangouts/`, `GET /hangouts/{id}/`, `PATCH /hangouts/{id}/`, `DELETE /hangouts/{id}/`. `HangoutCreate` / `HangoutUpdate` types already defined. No backend changes.
- **Out of scope**: bulk operations, undo, swipe gestures, rename inline from the picker, hangout-scoped transaction views (filtered list of transactions for a given hangout). Future work if asked for.

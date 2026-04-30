## Context

`add-transactions-screen` shipped the create flow and a paginated read-only list. The form lives inline inside `CreateTransactionScreen.tsx`, with subcategory/hangout pickers, a date picker, a `react-hook-form` + `zod` schema, and submit handler. The backend already exposes `PATCH /transactions/{id}/` and `DELETE /transactions/{id}/`, and the mobile types module (`TransactionUpdate`, path helpers in `constants.ts`) already accommodates them — they were left in place during initial scaffolding for exactly this Tier 2 feature.

The list view (`TransactionsListScreen.tsx`) renders rows via a `TransactionRow` subcomponent that is currently a static `View`. Users must currently switch to the desktop web app to fix or remove a wrong entry — the explicit Tier 2 trade-off documented in `mobile-companion-scope`.

## Goals / Non-Goals

**Goals:**
- Allow the user to tap an existing transaction row and either edit it or delete it.
- Reuse the existing create form's UI, validation, and pickers so the edit screen is visually and behaviorally identical except for pre-filled values and the destination endpoint.
- Keep the list and dashboard caches consistent after edit/delete using the same invalidation set as create.
- Preserve the modal-presentation pattern (tabs UI stays mounted underneath).

**Non-Goals:**
- Swipe-to-delete gestures or long-press menus. A simple tap → action sheet is enough for v1.x.
- Undo or recently-deleted recovery.
- Bulk operations (matches Tier 3 exclusion in `mobile-companion-scope`).
- Optimistic UI for edit (only delete is optimistic; edit waits on the server response and closes the modal on success — same as create).
- Edit history / audit trail.
- Inline editing inside the list row.

## Decisions

### D1 — Extract `TransactionForm` from `CreateTransactionScreen`

The create form's JSX, schema, and submit handler are tightly coupled. Splitting the form into a shared component avoids duplicating the pickers, date logic, and validation in two screens.

The shared component will accept:
- `defaultValues: FormValues` — pre-filled from the existing transaction in edit mode, or zero-state in create mode.
- `submitLabel: string` — `"Save transaction"` (create) or `"Save changes"` (edit).
- `onSubmit: (values: FormValues) => Promise<void>` — caller wires this to the create or update mutation.
- `headerTitle: string` — `"New Transaction"` or `"Edit Transaction"`.
- `headerExtra?: React.ReactElement` — optional slot for the delete button on the edit screen.

The component owns the form state, picker mount toggle, submit error, and pending state. The screens own only navigation and mutation wiring.

**Alternative considered**: pass the form as a hook (`useTransactionForm`) and have screens render the JSX themselves. Rejected — it just relocates the duplication into the screens.

### D2 — Edit route is a separate modal at `/transaction-edit/[id]`

Reuse the modal-presentation pattern already wired up for `/transaction-new`. The dynamic segment carries the transaction id, which the screen reads via `useLocalSearchParams`. The screen first calls a single-record fetcher to retrieve the current values, then renders `<TransactionForm defaultValues={...} />`.

**Alternative considered**: pass the transaction object as a navigation param. Rejected — expo-router stringifies non-trivial params, and a refresh-style flow that re-fetches the row is simpler and safer.

### D3 — Single-record fetch via `getTransaction(id)`

Add a `getTransaction(id: string): Promise<TransactionRead>` fetcher and a `useTransaction(id)` `useQuery` hook. The edit screen blocks render on this query so the form is never shown with stale data. The hook reuses the `[transactionsQueryKey, 'detail', id]` key so the cache hydrates after a list fetch where the row is already present (set via `queryClient.setQueryData` is *not* needed in v1; the network fetch is fine).

**Alternative considered**: pull the row out of the cached infinite list pages by id. Rejected — couples the edit screen to list pagination internals and breaks deep-linking later.

### D4 — Update mutation: `PATCH` with the full `TransactionUpdate` shape

`TransactionUpdate` already permits all fields nullable/optional (the backend accepts a partial). The mobile form will always send the full set of editable fields rather than diffing against the original. Diffing adds complexity for no real bandwidth win on a 5-field form.

### D5 — Delete: confirm via `Alert.alert`, optimistic removal, rollback on failure

Using React Native's built-in `Alert.alert` for the confirm — no extra dependency, native look. On confirm:
1. Snapshot affected query data, then `queryClient.setQueryData` to remove the row from any matching infinite list pages.
2. Fire `DELETE /transactions/{id}/`.
3. On success, run the standard invalidation set so dashboard balances reflect the removal.
4. On failure, restore the snapshot and surface an inline error in the row's action sheet caller (toast-style transient message in the list header — keep simple).

**Alternative considered**: pessimistic delete with a loading overlay. Rejected — feels sluggish for a one-tap action; rollback path is easy because the row is well-keyed.

### D6 — Action sheet implementation

Use a small in-screen modal sheet (a `Pressable` overlay + bottom panel of buttons). Avoid pulling in `@expo/vector-icons` or a third-party action sheet — the design only needs three labels (Edit, Delete, Cancel). Keep it self-contained inside `TransactionsListScreen` for now; if it grows beyond this screen, extract later.

**Alternative considered**: native `ActionSheetIOS` (Android-only project, doesn't apply) or `@gorhom/bottom-sheet` (already loaded; but spinning a fresh `BottomSheetModal` per tap would compound the cross-sheet focus issue we already fought with the pickers). Rejected.

### D7 — Invalidation set is shared

Both new mutations call the existing `useInvalidateTransactionsAndDashboard` helper. If we ever need separate behavior, we'll split — for now, edit and delete invalidate the same keys as create.

## Risks / Trade-offs

- **Refactor risk extracting `TransactionForm`** → Mitigation: snapshot tests aren't in v1, but a manual smoke test on the create flow before wiring edit catches regressions; the diff is structural only (move JSX, add props), no logic change.
- **Optimistic delete leaves stale row visible briefly on retry** → Mitigation: rollback restores the snapshot; user retries via re-tapping. Acceptable for a one-shot destructive action.
- **Edit screen race: user taps Edit on a stale row that was just deleted on another device** → Mitigation: `useTransaction` returns a 404; the screen renders an inline "Transaction no longer exists" with a back action.
- **Action sheet UX inconsistency vs. system pattern** → Mitigation: the in-screen sheet matches the create modal's visual language. If users complain, swap to a platform action sheet later — internal change, no spec impact.
- **`TransactionsListScreen` grows due to action sheet state** → Mitigation: confined to a small `selectedRowId` + `actionSheetVisible` pair; no need to extract until the file exceeds ~250 lines.

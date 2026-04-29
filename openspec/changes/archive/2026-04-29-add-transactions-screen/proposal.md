## Why

The mobile app currently surfaces aggregated balance data on the dashboard, but users have no way to see, search, or add the underlying transactions that produce those numbers. Without a transactions list and a creation flow, the app is read-only summary; users still need a desktop or another channel to record any new income or expense, which defeats the goal of a single-device finance tool.

## What Changes

- Replace the Expo `(tabs)/explore` scaffold with a new **Transactions** tab.
- Build a transactions list screen scoped to the current calendar month by default, with a month-picker control to switch month, infinite scrolling pagination, and per-row display of date, value (signed), description, subcategory name, and optional hangout name.
- Build an "Add transaction" creation flow reachable from the list (FAB or header button) that lets the user pick a subcategory (server-driven autocomplete picker), enter value/description/date, and optionally attach a hangout. The flow uses `POST /transactions/`.
- Implement the dashboard service-layer counterparts for transactions and subcategories (api.ts + queries.ts) since both are currently empty stubs.
- Add a server-driven autocomplete (debounced `name=` filter + skip/limit) for picking a subcategory inside the create form. Hangout picker is the same pattern but optional.
- React Query cache invalidation on successful create: invalidate `transactions` list keys AND the dashboard `balance`, `monthBalance`, `duePeriodicExpenses` keys so the dashboard reflects the new transaction immediately.

## Capabilities

### New Capabilities
- `transactions-screen`: Tab + list + creation flow for transactions, including month filtering, infinite pagination, and resource pickers used by the create form.

### Modified Capabilities
<!-- None — dashboard-screen behavior is unaffected; only its query cache gets invalidated by this change's create flow, which is an implementation detail not a spec change. -->

## Impact

- **Code**: Replaces `app/(tabs)/explore.tsx` with a transactions route. New `src/features/transactions/` directory (list screen, create screen, subcategory picker, hangout picker, components). Implements `src/services/transactions/{api,queries}.ts` and `src/services/subcategories/{api,queries}.ts` (currently empty stubs).
- **APIs (streetrack-be)**: `GET /transactions/` (with `year`, `month`, `skip`, `limit`), `POST /transactions/`, `GET /subcategories/` (with `name`, `belongs_to_income`, pagination), `GET /hangouts/` for the optional picker.
- **Navigation**: `(tabs)/_layout.tsx` updated — Explore tab replaced by Transactions tab; icon changes accordingly.
- **Dependencies**: Adds `@react-native-community/datetimepicker` (Expo-supported) for the create form's date field. Otherwise uses existing libraries: `@tanstack/react-query` (incl. `useInfiniteQuery`), NativeWind, expo-router, `react-hook-form` + `zod`.
- **Out of scope**: Edit/delete transactions, bulk import, per-day filtering, advanced filters (subcategory/hangout), and CSV export — all deferred to later changes.

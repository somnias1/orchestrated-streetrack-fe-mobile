## Why

The auth flow is complete and users can sign in, but every tab shows placeholder Expo scaffold content. The Dashboard summary is the first Tier 1 screen a signed-in user should see — it gives an immediate financial snapshot without any interaction. Implementing it now unblocks end-to-end testing of the full sign-in → data flow path.

## What Changes

- Implement the three dashboard fetcher functions in `src/services/dashboard/api.ts` (`getBalance`, `getMonthBalance`, `getDuePeriodicExpenses`) — the stubs and types are already in place.
- Implement the three React Query hooks in `src/services/dashboard/queries.ts` (`useBalance`, `useMonthBalance`, `useDuePeriodicExpenses`).
- Create `src/features/dashboard/DashboardScreen.tsx` composing the three data hooks into a read-only summary view: cumulative balance card, current-month balance card, and a due-periodic-expenses list with paid/unpaid badges.
- Replace the Expo scaffold content in `app/(tabs)/index.tsx` with `<DashboardScreen />`.
- Update the Home tab label and icon in `app/(tabs)/_layout.tsx` to "Dashboard".

## Capabilities

### New Capabilities
- `dashboard-screen`: Read-only dashboard showing cumulative balance, current-month balance, and due periodic expenses with paid/unpaid status for the current month.

### Modified Capabilities
<!-- None. mobile-companion-scope already describes what the dashboard must show; this change implements it without altering any spec-level requirement. -->

## Impact

- `src/services/dashboard/api.ts` — three new fetchers calling `authFetch`.
- `src/services/dashboard/queries.ts` — three new `useQuery` hooks.
- `src/features/dashboard/DashboardScreen.tsx` — new screen component (new file, new folder).
- `app/(tabs)/index.tsx` — replaces scaffold content with `<DashboardScreen />`.
- `app/(tabs)/_layout.tsx` — tab label changed to "Dashboard", icon updated.
- `components/ui/icon-symbol.tsx` — add icon mapping if needed.
- No new npm dependencies.
- No backend changes — `GET /dashboard/balance`, `GET /dashboard/month-balance`, and `GET /dashboard/due-periodic-expenses` all exist in `streetrack-be`.

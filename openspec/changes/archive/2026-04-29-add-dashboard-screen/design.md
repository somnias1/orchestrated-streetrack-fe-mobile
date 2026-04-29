## Context

The dashboard service layer has types (`src/services/dashboard/types.ts`) and path constants (`src/services/dashboard/constants.ts`) already in place from the initial-techspec. Both `api.ts` and `queries.ts` are empty stubs. The three backend endpoints are live:

- `GET /dashboard/balance` — cumulative net balance (no params)
- `GET /dashboard/month-balance?year=&month=` — net balance for a given month
- `GET /dashboard/due-periodic-expenses?year=&month=` — list of periodic subcategories with paid flag

`mobile-companion-scope` requires a read-only view with cumulative balance, current-month balance, and due periodic expenses with paid/unpaid badges. No "mark as paid" action is allowed — the backend derives paid status from recognised transactions. The `formatValue` utility already exists in `src/utils/format.ts`.

The current `app/(tabs)/index.tsx` is Expo scaffold content — it will be replaced wholesale.

## Goals / Non-Goals

**Goals:**
- Fill in the service layer (api.ts + queries.ts) for the three dashboard endpoints.
- Build a `DashboardScreen` component that renders all three data sections.
- Make all three queries run in parallel so no section blocks another.
- Show per-section loading and error states so a failing endpoint doesn't blank the whole screen.

**Non-Goals:**
- No month picker — current month is always used. A date navigation affordance is a Tier 2+ concern.
- No "mark as paid" or any write action on the dashboard.
- No pull-to-refresh implementation beyond React Query's default focus-refetch.
- No pagination on due-periodic-expenses — the endpoint returns all entries for the month as a flat array.

## Decisions

### 1. Three parallel `useQuery` calls; no waterfall

`useBalance`, `useMonthBalance`, and `useDuePeriodicExpenses` are three independent hooks called from `DashboardScreen`. React Query fires all three on mount in parallel. Each section renders its own skeleton / error independently.

**Alternative considered:** a single combined hook that awaits all three with `Promise.all`. Rejected: would hide which endpoint is slow, and React Query's built-in parallelism is free.

### 2. Current month derived at hook call time; no stored state

`useMonthBalance` and `useDuePeriodicExpenses` derive `year` and `month` from `new Date()` inside the hook. The query key includes `[year, month]`, so React Query automatically refetches when the month rolls over (next render sees a different key).

**Alternative considered:** accept year/month as params so the screen can eventually pass a picker value. Accepted: the hooks accept optional `year`/`month` params and default to the current month — this future-proofs with zero extra complexity.

### 3. Query keys follow `[dashboardQueryKey, '<endpoint>', ...params]`

```ts
['dashboard', 'balance']
['dashboard', 'monthBalance', year, month]
['dashboard', 'duePeriodicExpenses', year, month]
```

Consistent with the pattern implied by `dashboardQueryKey` in `constants.ts`.

### 4. Due-periodic-expenses sorted client-side by `due_day` (ascending, null last)

The backend returns an unsorted array. Client sorts by `due_day` ascending, placing `null` entries at the end, so expenses with a concrete due day appear first.

### 5. Home tab becomes Dashboard; icon updated to `chart.bar.fill`

The `(tabs)/index.tsx` route keeps its filename (no rename needed for expo-router) but the tab label changes to "Dashboard". The icon mapping `chart.bar.fill → bar-chart` is added to `icon-symbol.tsx`.

### 6. Balance displayed via existing `formatValue` from `src/utils/format.ts`

No new formatter needed. `formatValue(balance)` handles locale-aware thousands separators with 0–2 decimal places. For balances, 0 decimal places is typically cleaner — wrap with a sign prefix (`balance >= 0 ? '+' : ''`) so negative balances are clearly signed.

**Why sign prefix:** The cumulative balance can be positive (net income) or negative (net expense). A bare negative number is clear, but a positive balance without `+` can look like a plain number with no context.

## Risks / Trade-offs

- **[Risk] Month boundary edge case**: If the user opens the app right at midnight on the 1st of a new month, `new Date()` inside the hook returns the new month, but a cached response from the previous month might briefly show. → Acceptable: React Query's `staleTime: 0` (default) means the cache is always considered stale on focus; the dashboard always refetches on mount.

- **[Trade-off] No pull-to-refresh**: The user cannot manually trigger a reload. → Accepted for v1.0; React Query refetches on window focus (app comes to foreground), which covers the common "check after adding a transaction" pattern. Explicit pull-to-refresh is a UX polish task.

- **[Trade-off] Error is shown per section, not globally**: A network failure shows three separate error states instead of one. → Accepted: partial data is more useful than a blank screen. A global error is already caught by the root `ErrorBoundary` for hard crashes.

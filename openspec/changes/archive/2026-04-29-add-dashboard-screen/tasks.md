## 1. Service layer — api.ts

- [x] 1.1 Implement `getBalance(): Promise<DashboardBalanceRead>` in `src/services/dashboard/api.ts` — `authFetch(dashboardPaths.balance)` then `.json()`
- [x] 1.2 Implement `getMonthBalance(year: number, month: number): Promise<DashboardMonthBalanceRead>` — `authFetch` with `?year=&month=` query params
- [x] 1.3 Implement `getDuePeriodicExpenses(year: number, month: number): Promise<GetDashboardDuePeriodicExpensesResponse>` — `authFetch` with `?year=&month=`
- [x] 1.4 Verify none of the three functions call `fetch` directly

## 2. Service layer — queries.ts

- [x] 2.1 Implement `useBalance()` — `useQuery({ queryKey: [dashboardQueryKey, 'balance'], queryFn: getBalance })`
- [x] 2.2 Implement `useMonthBalance(year?: number, month?: number)` — defaults to `new Date()` year/month; query key includes `[dashboardQueryKey, 'monthBalance', year, month]`
- [x] 2.3 Implement `useDuePeriodicExpenses(year?: number, month?: number)` — same defaulting pattern; query key includes `[dashboardQueryKey, 'duePeriodicExpenses', year, month]`

## 3. Dashboard screen component

- [x] 3.1 Create `src/features/dashboard/DashboardScreen.tsx` composing all three hooks
- [x] 3.2 Render a "Cumulative balance" card: formatted value from `useBalance`, prefixed with `+` when positive, no prefix when zero, `-` implicit when negative
- [x] 3.3 Render a "Month balance" card: formatted value from `useMonthBalance`, with a human-readable month label (e.g., "April 2026")
- [x] 3.4 Render a due-periodic-expenses list from `useDuePeriodicExpenses`: each item shows `subcategory_name`, due day label ("Due on day X" or "No due date"), and a paid/unpaid badge
- [x] 3.5 Sort due-periodic-expenses client-side by `due_day` ascending, null entries last
- [x] 3.6 Show a placeholder message ("No periodic expenses this month") when the list is empty
- [x] 3.7 Each section renders its own `ActivityIndicator` while its query is loading and an inline error message on failure — no cross-section blocking
- [x] 3.8 Style with NativeWind classes only; use `formatValue` from `src/utils/format.ts` for all numeric values

## 4. Wire into tab navigation

- [x] 4.1 Replace the Expo scaffold content in `app/(tabs)/index.tsx` with `<DashboardScreen />`
- [x] 4.2 Update the Home tab entry in `app/(tabs)/_layout.tsx`: label → "Dashboard", icon → `chart.bar.fill`
- [x] 4.3 Add `'chart.bar.fill': 'bar-chart'` to the `MAPPING` in `components/ui/icon-symbol.tsx`

## 5. Manual verification on Android dev client

- [ ] 5.1 Sign in → Dashboard tab shows loading indicators, then all three sections populate
- [ ] 5.2 Cumulative balance card shows a signed value (+ or −)
- [ ] 5.3 Month balance card shows the correct month label and value
- [ ] 5.4 Due-periodic-expenses list shows items sorted by due_day with paid/unpaid badges; "No due date" renders for null entries
- [ ] 5.5 Empty periodic expenses list shows the placeholder message
- [ ] 5.6 Switch to another app and back — dashboard refetches automatically (focus-refetch)
- [ ] 5.7 Put device in airplane mode, navigate to Dashboard — each section shows inline error independently

## 6. OpenSpec validation

- [x] 6.1 Run `openspec validate add-dashboard-screen` and resolve any issues
- [x] 6.2 Run `openspec status --change add-dashboard-screen` and confirm `isComplete` is true

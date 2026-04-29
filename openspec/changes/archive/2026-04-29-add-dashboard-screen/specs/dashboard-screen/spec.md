## ADDED Requirements

### Requirement: Dashboard tab replaces the Home placeholder

The `(tabs)/index.tsx` route SHALL render `<DashboardScreen />` from `src/features/dashboard/DashboardScreen.tsx`. The tab label SHALL be "Dashboard" and its icon SHALL be updated from the Expo scaffold default.

#### Scenario: Dashboard tab is the first tab

- **WHEN** an authenticated user opens the app
- **THEN** the first tab MUST be labelled "Dashboard"
- **AND** it MUST render the dashboard summary screen, not Expo scaffold content

### Requirement: Dashboard screen calls three parallel queries for current-month data

`DashboardScreen` SHALL compose three React Query hooks — `useBalance`, `useMonthBalance`, and `useDuePeriodicExpenses` — that fire in parallel on mount. `useMonthBalance` and `useDuePeriodicExpenses` SHALL default to the current calendar year and month when no explicit params are provided.

#### Scenario: All three queries fire on mount without waterfall

- **WHEN** `DashboardScreen` mounts
- **THEN** `GET /dashboard/balance`, `GET /dashboard/month-balance`, and `GET /dashboard/due-periodic-expenses` MUST all be initiated simultaneously
- **AND** no query MUST wait for another to complete before starting

#### Scenario: Default month is the current calendar month

- **WHEN** `useMonthBalance` or `useDuePeriodicExpenses` is called with no year/month argument
- **THEN** the hook MUST derive year and month from `new Date()` at call time
- **AND** the derived values MUST be included in the React Query key

### Requirement: Cumulative balance card renders with sign

The dashboard SHALL render a "Cumulative balance" card displaying the value from `GET /dashboard/balance`. The value SHALL be formatted with `formatValue` from `src/utils/format.ts` and prefixed with `+` when positive, `-` when negative.

#### Scenario: Positive cumulative balance

- **WHEN** `balance` is a positive number
- **THEN** the card MUST display the value prefixed with `+`

#### Scenario: Negative cumulative balance

- **WHEN** `balance` is a negative number
- **THEN** the card MUST display the value with a leading `-` sign (implicit from `formatValue`)

#### Scenario: Zero balance

- **WHEN** `balance` is zero
- **THEN** the card MUST display `0` (no sign prefix)

### Requirement: Current-month balance card renders the month label

The dashboard SHALL render a "Month balance" card displaying the value from `GET /dashboard/month-balance` for the current month. The card SHALL include a human-readable month label (e.g., "April 2026") so the user knows which month is shown.

#### Scenario: Month balance card shows month and year

- **WHEN** the month balance query resolves
- **THEN** the card MUST display a label identifying the current month and year (e.g., "April 2026")
- **AND** it MUST display the formatted balance value

### Requirement: Due-periodic-expenses list renders paid/unpaid badges

The dashboard SHALL render a list of due periodic expenses from `GET /dashboard/due-periodic-expenses` for the current month. Each item SHALL display `subcategory_name`, the due day (or "No due date" when `due_day` is null), and a badge indicating paid or unpaid status. The list SHALL be sorted by `due_day` ascending with null entries last. There SHALL be no "mark as paid" action on any item.

#### Scenario: Paid expense shows a paid badge

- **WHEN** a `DashboardDuePeriodicExpenseRead` item has `paid: true`
- **THEN** it MUST render a clearly styled "Paid" badge
- **AND** it MUST NOT render a button or action to change its status

#### Scenario: Unpaid expense shows an unpaid badge

- **WHEN** a `DashboardDuePeriodicExpenseRead` item has `paid: false`
- **THEN** it MUST render a clearly styled "Unpaid" badge
- **AND** it MUST NOT render a button or action to change its status

#### Scenario: Items sorted by due_day ascending, null last

- **WHEN** the due-periodic-expenses list renders
- **THEN** items with a non-null `due_day` MUST appear before items with `due_day: null`
- **AND** non-null items MUST be sorted in ascending order of `due_day`

#### Scenario: Null due_day displays fallback label

- **WHEN** `due_day` is null for an expense
- **THEN** the item MUST display "No due date" in place of a day number

#### Scenario: Empty list shows a placeholder

- **WHEN** the due-periodic-expenses endpoint returns an empty array
- **THEN** the screen MUST render a placeholder message (e.g., "No periodic expenses this month")

### Requirement: Each dashboard section renders its own loading and error state

Loading and error states SHALL be scoped to each of the three sections independently. A failed query in one section SHALL NOT prevent the other sections from displaying their data.

#### Scenario: One query fails while others succeed

- **WHEN** `GET /dashboard/balance` fails but month-balance and due-periodic-expenses succeed
- **THEN** the balance card MUST show an inline error
- **AND** the other two sections MUST render their data normally

#### Scenario: Loading skeleton per section

- **WHEN** a query is in flight (`isLoading === true`)
- **THEN** the corresponding section MUST render a loading indicator or skeleton
- **AND** sections whose queries have already resolved MUST render their data

### Requirement: Dashboard service layer is fully implemented

`src/services/dashboard/api.ts` SHALL export `getBalance`, `getMonthBalance`, and `getDuePeriodicExpenses` as plain async fetcher functions calling `authFetch`. `src/services/dashboard/queries.ts` SHALL export `useBalance`, `useMonthBalance`, and `useDuePeriodicExpenses` as React Query hooks wrapping those fetchers.

#### Scenario: api.ts exports three fetchers using authFetch

- **WHEN** the codebase is inspected
- **THEN** `src/services/dashboard/api.ts` MUST export `getBalance`, `getMonthBalance`, and `getDuePeriodicExpenses`
- **AND** each MUST call `authFetch` and MUST NOT call `fetch` directly

#### Scenario: queries.ts exports three hooks

- **WHEN** a screen needs dashboard data
- **THEN** it MUST import from `src/services/dashboard/queries.ts`
- **AND** MUST NOT call `authFetch` or `getBalance`/`getMonthBalance`/`getDuePeriodicExpenses` directly from the screen

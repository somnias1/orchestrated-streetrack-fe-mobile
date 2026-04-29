# Streetrack Mobile — v1.0 TECHSPEC

## §0. Source of truth

This TECHSPEC consumes [`openspec/specs/mobile-companion-scope/spec.md`](../openspec/specs/mobile-companion-scope/spec.md) verbatim. The scope spec is authoritative for:

- Tier 1 / Tier 2 / Tier 3 module lists
- Target platform (Android-only)
- Auth posture (Auth0 native app + system browser + PKCE)
- Picker pattern (bottom sheet + search)
- Offline posture (online-first, retry on submit failure)
- Locked identity values (`com.streetrack.mobile`, `streetrack://callback`)
- Biometric lock policy
- "No push, no crash reporting" v1.0 stance

This TECHSPEC locks the HOW. Any conflict between this document and the scope spec is resolved in favour of the scope spec, and a new opspec change MUST be opened to reconcile.

---

## §1. Architecture

### §1.1 Layering

```
┌─────────────────────────────────────────────┐
│  app/         expo-router routes (thin)     │
├─────────────────────────────────────────────┤
│  src/features/<feature>/   composite UI     │
├─────────────────────────────────────────────┤
│  src/components/   reusable presentation    │
├─────────────────────────────────────────────┤
│  src/services/<resource>/queries.ts         │  ← React Query hooks
│  src/services/<resource>/api.ts             │  ← plain fetcher fns
│  src/services/http.ts (authFetch)           │  ← single auth boundary
├─────────────────────────────────────────────┤
│  Auth0 (react-native-auth0) + Keystore      │
├─────────────────────────────────────────────┤
│  streetrack-be  (existing FastAPI)          │
└─────────────────────────────────────────────┘
```

**Rule**: traffic flows top-to-bottom only. A screen never imports `authFetch`; it imports a hook from `queries.ts`. A component never imports `Constants.expoConfig`; it imports from `src/config.ts`.

### §1.2 Data flow

1. Cold start → splash held visible.
2. `Auth0Provider` mounts; `CredentialsManager.getCredentials()` resolves (silent refresh if needed).
3. `BiometricGate` mounts; `LocalAuthentication.authenticateAsync` runs if device has enrolled biometrics.
4. `QueryClientProvider` mounts; route tree mounts; splash hides.
5. Screens call hooks → hooks call resource `api.ts` → `api.ts` calls `authFetch` → `authFetch` calls `streetrack-be` with bearer token.
6. Mutations invalidate cache keys defined in `<resource>/constants.ts` (`transactionsQueryKey`, etc., already seeded).

---

## §2. Tech stack (locked)

| Concern              | Library                                  | Version target          | Decision section |
|----------------------|------------------------------------------|-------------------------|------------------|
| Runtime              | Expo SDK + React Native + React          | SDK 54 / RN 0.81 / R 19 | inherited        |
| Navigation           | `expo-router`                            | ^6                      | §2.1             |
| Server state         | `@tanstack/react-query`                  | ^5                      | §2.2             |
| Client state         | React Context (no global store)          | n/a                     | §2.3             |
| Forms                | `react-hook-form` + `zod` resolver       | ^7 / ^3                 | §2.4             |
| Picker / bottom sheet| `@gorhom/bottom-sheet`                   | ^5                      | §2.5             |
| Styling              | NativeWind                               | ^4                      | §2.6             |
| Auth SDK             | `react-native-auth0`                     | ^3                      | §2.7             |
| Secure storage       | `react-native-auth0`'s `CredentialsManager` (Keystore-backed) — no separate library | bundled with §2.7 | §2.8 |
| Biometric            | `expo-local-authentication`              | ^17 (Expo SDK 54)       | §2.9             |

### §2.1 Navigation — `expo-router` v6

File-based routing under `app/`. Already scaffolded. `streetrack://` deep-link scheme (locked by scope spec) handled via expo-router's built-in linking.

Group layout:
- `app/(auth)/` — unauthenticated routes (sign-in only).
- `app/(tabs)/` — bottom-tab shell, the authenticated default.
- `app/transactions/new.tsx` — modal presentation (outside the tab shell).

**Why locked**: file-based routing fits a 6-screen surface; deep-link handling is built in; no need for an independent React Navigation setup.

### §2.2 Server state — TanStack Query v5

Single `QueryClient` constructed in `src/services/queryClient.ts`. Defaults:

```ts
{
  queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false },
  mutations: { retry: 0 },
}
```

Per-resource hooks live in `src/services/<resource>/queries.ts`. Cache keys are arrays prefixed with the seeded `<resource>QueryKey` constant (e.g. `[transactionsQueryKey, listParams]`).

**Why locked**: gives pagination, retry, stale-while-revalidate, and mutation invalidation as building blocks every Tier 1 feature needs.

### §2.3 Client state — React Context only

Two contexts, no global store:

- `AuthContext` — re-exposes `useAuth0()` from `react-native-auth0` plus a derived `isAuthenticated` boolean.
- `SettingsContext` — colour scheme override (matches the existing `useColorScheme` hook), and any future device-local toggles.

**Why locked**: there is no client state large enough to warrant Redux/Zustand. Server data lives in React Query; form state lives in `react-hook-form`; ephemeral UI state lives in `useState`.

### §2.4 Forms — `react-hook-form` + `zod` resolver

Forms with two or more fields use `react-hook-form` with `@hookform/resolvers/zod`. Schemas live next to the form component (e.g. `src/features/transactions/transactionForm.schema.ts`) and import the canonical type from `src/services/transactions/types.ts` so the schema and the request body cannot drift.

Single-input cases (a picker's search box) use plain `useState` + the `useDebouncedValue` hook.

### §2.5 Picker / bottom sheet — `@gorhom/bottom-sheet` v5

All pickers (Subcategory, Hangout) and any modal-like surface that should feel native use `@gorhom/bottom-sheet` v5. Reanimated v4 + Gesture Handler are already installed as peer deps.

Common picker shape:

```
┌─────────────────────────┐
│  ─── (drag handle)  ────│
│  [ search input      ✕ ]│
│  ─────────────────────  │
│  • Option 1             │
│  • Option 2             │
│  • Option 3             │
│  …  (FlashList/FlatList)│
└─────────────────────────┘
```

Pagination uses the seeded constants in `src/services/types.ts`:
- `PICKER_PAGE_LIMIT = 50`
- `PICKER_LIST_PARAMS = { skip: 0, limit: 50 }`

Server-side filter is `name` (icontains) plus `skip`/`limit`. Debounce search input by 250 ms.

### §2.6 Styling — NativeWind v4

Tailwind class strings via NativeWind v4. `tailwind.config.ts` at repo root carries brand tokens; everything else uses the default theme.

Fallback if v4 fails to build under Expo SDK 54: drop to NativeWind v2 (still maintained) — captured as OQ1 in §11. No re-litigation of the broader styling choice.

### §2.7 Auth SDK — `react-native-auth0` v3

`<Auth0Provider domain={config.auth0Domain} clientId={config.auth0ClientId}>` at root. Universal login invoked with:

```ts
authorize({
  audience: config.auth0Audience,
  scope: 'openid profile email offline_access',
});
```

`offline_access` is required to receive a refresh token. Embedded WebView is forbidden (scope spec).

### §2.8 Secure storage — bundled with §2.7

**Decision**: do *not* install a separate secure-storage library. `react-native-auth0`'s `CredentialsManager` already persists tokens to Android Keystore and handles silent refresh. This is the only secret v1.0 stores; adding `expo-secure-store` would be an unused dependency.

If a future change introduces a non-token secret (e.g., a stored "trusted device" flag), revisit and add `expo-secure-store` then — captured as OQ2 in §11.

In-memory access tokens; Keystore-resident refresh token. Cold start path:

```
app launch
  → Auth0Provider mounts
  → CredentialsManager.getCredentials() resolves
       → if refresh token valid: returns fresh access token (memory)
       → else throws → app routes to (auth)/sign-in
```

### §2.9 Biometric — `expo-local-authentication`

`<BiometricGate>` between `<AuthProvider>` and `<QueryClientProvider>`:

```
hasHardwareAsync() && isEnrolledAsync()
  → authenticateAsync({ promptMessage: 'Unlock Streetrack' })
      → success → mount children
      → failure → "Try again" button (no PIN fallback in v1.0)
no biometrics enrolled → mount children directly
```

---

## §3. Project structure

```
app/
  _layout.tsx                  # ErrorBoundary > AuthProvider > BiometricGate > QueryClientProvider > Slot
  (auth)/
    _layout.tsx
    sign-in.tsx
  (tabs)/
    _layout.tsx                # bottom tabs
    index.tsx                  # Dashboard
    transactions/
      index.tsx                # Recent list
      [id].tsx                 # Transaction detail (read-only in v1.0)
    settings.tsx
  transactions/
    new.tsx                    # Modal presentation (Quick Transaction)
src/
  config.ts                    # Typed runtime config (§6.3)
  services/
    queryClient.ts             # Singleton QueryClient (§2.2)
    http.ts                    # authFetch (§4.2)
    errors.ts                  # ApiError class (§4.4)
    types.ts                   # PaginatedRead, DefaultParams, PICKER_PAGE_LIMIT — already seeded
    transactions/
      types.ts                 # already seeded
      constants.ts             # already seeded
      api.ts                   # plain fetchers
      queries.ts               # React Query hooks
    subcategories/             # same trio
    hangouts/                  # same trio
    dashboard/                 # same trio
  features/
    auth/
      AuthProvider.tsx
      BiometricGate.tsx
      useAuth.ts
    transactions/
      TransactionForm.tsx
      TransactionForm.schema.ts
      TransactionListItem.tsx
      TransactionDetail.tsx
    pickers/
      SubcategoryPicker.tsx
      HangoutPicker.tsx
      PickerSheet.tsx          # shared shell (drag handle + search + list)
    dashboard/
      BalanceCard.tsx
      MonthBalanceCard.tsx
      DuePeriodicExpensesList.tsx
  components/
    ErrorBoundary.tsx
    LoadingState.tsx           # variants: list-skeleton | full-screen | inline
    ErrorState.tsx             # variants: inline | full-screen | toast
    EmptyState.tsx
    Field.tsx                  # label + input + error wrapper
    Button.tsx
  hooks/
    use-color-scheme.ts        # already present
    use-color-scheme.web.ts    # already present (delete — Android only)
    use-theme-color.ts         # already present
    useDebouncedValue.ts
  utils/
    format.ts                  # already seeded (formatValue, formatDate)
```

**Routes stay thin** — they assemble `features/*` and `components/*`. No styling, no fetching, no validation in route files.

---

## §4. Data layer

### §4.1 Resource type files

The four resource folders under `src/services/<resource>/types.ts` are the contract with `streetrack-be`. They are **copied** from web (per scope spec D3) and are the only place where backend shapes live. `category_name` is intentionally absent from `TransactionRead` displays per the scope spec; the type retains the field but the UI ignores it.

Already seeded:
- `transactions/types.ts` — `TransactionRead`, `TransactionCreate`, `TransactionUpdate`, `TransactionsListParams`, `GetTransactionsResponse`
- `subcategories/types.ts`
- `hangouts/types.ts`
- `dashboard/types.ts` — `DashboardBalanceRead`, `DashboardMonthBalanceRead`, `DashboardDuePeriodicExpenseRead`

Cross-resource shapes in `src/services/types.ts` — `PaginatedRead<T>`, `DefaultParams`, `DEFAULT_LIST_LIMIT`, `PICKER_PAGE_LIMIT`, `PICKER_LIST_PARAMS`.

Drift between web and mobile types is handled out-of-band per scope spec D3 (quarterly diff). No automated sync in v1.0.

### §4.2 HTTP boundary — `authFetch`

`src/services/http.ts`:

```ts
import { config } from '@/src/config';
import { ApiError } from './errors';

type AuthFetch = (path: string, init?: RequestInit) => Promise<Response>;

export const createAuthFetch = (getAccessToken: () => Promise<string>): AuthFetch =>
  async (path, init = {}) => {
    const token = await getAccessToken();
    const url = `${config.apiBaseUrl}/${path.replace(/^\//, '')}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      let parsed: unknown;
      try { parsed = JSON.parse(body); } catch { parsed = body; }
      throw new ApiError(res.status, parsed);
    }
    return res;
  };
```

`getAccessToken` is wired in `AuthProvider.tsx` to call `auth0.credentialsManager.getCredentials()` (which silent-refreshes when needed). Resource `api.ts` files import the bound `authFetch` from a context-provided value.

**Rule**: nothing else in the codebase calls `fetch` against `streetrack-be`. One file owns the auth boundary.

### §4.3 Pagination contract

Backend returns `PaginatedRead<T>` (already in `src/services/types.ts`). Page size for lists = `DEFAULT_LIST_LIMIT` (50); page size for picker autocomplete = `PICKER_PAGE_LIMIT` (50).

Mobile uses `useInfiniteQuery` for the Recent Transactions list:

```ts
useInfiniteQuery({
  queryKey: [transactionsQueryKey, params],
  queryFn: ({ pageParam = 0 }) => transactionsApi.list({ ...params, skip: pageParam, limit: DEFAULT_LIST_LIMIT }),
  getNextPageParam: (last) => (last.has_more ? last.next_skip : undefined),
  initialPageParam: 0,
});
```

Pickers use the same shape but with `PICKER_PAGE_LIMIT` and the `name` filter.

### §4.4 Error model — `ApiError`

`src/services/errors.ts`:

```ts
export class ApiError extends Error {
  constructor(public readonly status: number, public readonly body: unknown) {
    super(`HTTP ${status}`);
    this.name = 'ApiError';
  }
  isUnauthorized() { return this.status === 401; }
  isValidation()   { return this.status === 422; }
  isServer()       { return this.status >= 500; }
}
```

React Query surfaces this in `error` from `useQuery` / `useMutation`. UI consumers branch on the helper methods, not on raw status codes scattered through screens.

`401` from `authFetch` triggers a sign-out (refresh token revoked / expired beyond renewal); the user is sent to `(auth)/sign-in` with a transient toast: "Session expired — please sign in again."

---

## §5. Auth flow

### §5.1 Auth0 native app provisioning

Out-of-band (captured in `tasks.md` of the `initial-techspec` change). Required tenant config:

- App type: Native
- Allowed callback URLs: `streetrack://callback`, `com.streetrack.mobile.auth0://<tenant-domain>/android/com.streetrack.mobile/callback`
- Allowed logout URLs: same as callbacks
- Connections: Google + Username-Password-Authentication (already enabled at tenant level)
- Refresh tokens: rotating, with absolute expiration disabled, inactivity 30 days (mobile-friendly defaults)

### §5.2 Universal login

```ts
const { authorize } = useAuth0();
await authorize({
  audience: config.auth0Audience,
  scope: 'openid profile email offline_access',
});
```

System browser opens (Chrome Custom Tabs on Android), serves Auth0 universal login (Google button + email/password form), redirects back via `streetrack://callback`, SDK exchanges code for tokens.

### §5.3 Token lifecycle

| Token         | Storage         | Lifetime     | Refresh                                  |
|---------------|-----------------|--------------|------------------------------------------|
| Access token  | In-memory only  | 1 hour (Auth0 default) | `getCredentials()` returns fresh value, refreshing via refresh token if needed |
| ID token      | In-memory only  | Same as access | Same                                  |
| Refresh token | Android Keystore (via `CredentialsManager`) | Rotating, 30-day inactivity | Rotates on each access-token refresh |

No token is ever logged. `console.log(credentials)` is forbidden.

### §5.4 Biometric gate

See §2.9. The gate prompts on cold start and on resume after the app has been backgrounded ≥ 5 minutes. Threshold is locked at **5 minutes** for v1.0 (constant `BIOMETRIC_REPROMPT_MS = 5 * 60_000` in `src/features/auth/BiometricGate.tsx`).

### §5.5 Sign-out

`useAuth0().clearSession()` — clears Keystore + revokes refresh token. App routes back to `(auth)/sign-in`. React Query cache is cleared via `queryClient.clear()` to prevent the next user (e.g., switching test accounts) from briefly seeing the previous account's cached data.

---

## §6. Configuration

### §6.1 Env-var shape

Single env file at repo root, **never committed** (`.env` is gitignored):

```
# .env
AUTH0_DOMAIN=<tenant>.auth0.com
AUTH0_CLIENT_ID=<native-app-client-id>
AUTH0_AUDIENCE=https://<api-identifier>
API_BASE_URL=https://<streetrack-be-host>
```

Committed companion: `.env.example` at the repo root documents the same keys with placeholders. Concrete hostnames are filled in directly by the developer per environment — see EAS-profile mapping below.

EAS profiles (§9) pick the right values per environment via `eas secret`:

| EAS profile   | API_BASE_URL                       | Auth0 client id                   |
|---------------|------------------------------------|-----------------------------------|
| `development` | `https://dev.streetrack.api`       | dev-tenant native app             |
| `preview`     | `https://staging.streetrack.api`   | dev-tenant native app             |
| `production`  | `https://api.streetrack.app`       | prod-tenant native app            |

(Concrete hostnames TBD by user; lock when first deployed.)

### §6.2 `app.config.ts`

Replaces `app.json`. Carries Expo config plus the `extra` block that surfaces env vars to runtime:

```ts
// app.config.ts
import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => ({
  name: 'Streetrack',
  slug: 'orchestrated-streetrack-fe-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'streetrack',                              // locked by scope spec
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  android: {
    package: 'com.streetrack.mobile',                // locked by scope spec
    adaptiveIcon: { /* placeholder per scope spec OQ10 */ },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-local-authentication',
    ['react-native-auth0', { domain: process.env.AUTH0_DOMAIN }],
    ['expo-splash-screen', { /* unchanged */ }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: {
    auth0Domain: process.env.AUTH0_DOMAIN,
    auth0ClientId: process.env.AUTH0_CLIENT_ID,
    auth0Audience: process.env.AUTH0_AUDIENCE,
    apiBaseUrl: process.env.API_BASE_URL,
  },
});
```

The existing `app.json` is deleted as part of the `initial-techspec` apply phase. iOS and web sections are removed (Android-only per scope spec).

### §6.3 Runtime reader — `src/config.ts`

```ts
import Constants from 'expo-constants';
import { z } from 'zod';

const schema = z.object({
  auth0Domain: z.string().min(1),
  auth0ClientId: z.string().min(1),
  auth0Audience: z.string().url(),
  apiBaseUrl: z.string().url(),
});

const parsed = schema.safeParse(Constants.expoConfig?.extra);
if (!parsed.success) {
  throw new Error(`Invalid runtime config: ${parsed.error.toString()}`);
}

export const config = Object.freeze(parsed.data);
export type Config = typeof config;
```

Throws at module load — a misconfigured profile breaks the splash screen, never a random user flow.

---

## §7. Screens (UX lock)

Screen-by-screen breakdown for Tier 1. Each section: route, purpose, layout sketch, data sources, primary interactions, loading state, error state, empty state.

### §7.1 Splash & boot sequence

- **Surface**: native splash (managed by `expo-splash-screen`).
- **Held visible until**: Auth0 credentials resolved AND biometric gate passed (or skipped).
- **Failure modes**:
  - No refresh token / refresh fails → hide splash, route to `(auth)/sign-in`.
  - Biometric prompt cancelled → hide splash, render a minimal "Tap to unlock" screen with a single button that re-invokes the prompt.

### §7.2 Sign-in — `app/(auth)/sign-in.tsx`

- **Purpose**: kick off Auth0 universal login.
- **Layout**:
  ```
  [Streetrack logo / wordmark]
  [Subtitle: "Personal finance, in your pocket."]
  [ Sign in with Auth0 ] (primary button, full-width)
  ```
- **Data sources**: none.
- **Primary interaction**: tap button → `authorize(...)` → system browser → callback → router replaces to `(tabs)`.
- **Loading**: button shows inline spinner while `authorize` is in flight (the system browser handles its own progress UI; the spinner covers the brief hand-off).
- **Error**: `ApiError` or generic `Error` from `authorize` → inline red banner above the button: "Couldn't sign in. Try again." No technical detail; the device log carries it.
- **Empty**: n/a.

### §7.3 Dashboard — `app/(tabs)/index.tsx` (default landing)

- **Purpose**: read-only summary per scope spec — cumulative balance, current-month balance, due periodic expenses with paid status.
- **Layout**:
  ```
  ┌─────────────────────────────────┐
  │ Cumulative balance              │
  │   $X,XXX                        │
  ├─────────────────────────────────┤
  │ This month (April 2026)         │
  │   −$XXX                         │
  ├─────────────────────────────────┤
  │ Due this month                  │
  │   ✓  Rent           $1,200      │
  │   ⏳  Internet         $50      │
  │   ⏳  Gym             $30       │
  └─────────────────────────────────┘
  ```
  Pull-to-refresh on the outer ScrollView.
- **Data sources**: 3 parallel queries —
  - `useBalanceQuery()` → `GET /dashboard/balance`
  - `useMonthBalanceQuery({ year, month })` → `GET /dashboard/month-balance?year=&month=` (defaulted to current).
  - `useDuePeriodicExpensesQuery()` → `GET /dashboard/due-periodic-expenses`
- **Primary interaction**: tap a periodic-expense row → no navigation (it's read-only per scope spec; no mark-as-paid action).
- **Loading**: skeleton blocks per card (3 stacked rounded rectangles).
- **Error**: any of the 3 queries failing → that card shows `<ErrorState variant="inline">` with a small "Retry" link. The other two cards keep rendering.
- **Empty**: due-periodic-expenses list empty → "Nothing due this month." muted text.

### §7.4 Recent transactions — `app/(tabs)/transactions/index.tsx`

- **Purpose**: paginated list of all transactions, newest first. Tap a row to view detail.
- **Layout**:
  ```
  ┌─────────────────────────────────┐
  │ Transactions          [date ⌄]  │  ← header with date-range filter trigger
  ├─────────────────────────────────┤
  │ Apr 28                          │
  │   Coffee — Café               $5│
  │   Groceries — Carulla        $42│
  │ Apr 27                          │
  │   Uber                       $12│
  │ …                                │
  └─────────────────────────────────┘
  [ + New transaction ] (FAB, bottom-right)
  ```
  Sections grouped by `date` (descending). FlashList for virtualisation.
- **Data sources**: `useTransactionsInfiniteQuery(params)` per §4.3.
- **Primary interactions**:
  - Tap row → push `transactions/[id]`.
  - Tap FAB → push modal `transactions/new`.
  - Tap `[date ⌄]` → open a small bottom sheet with two date pickers (from / to). Apply re-runs the query with `params.date_from`, `params.date_to`.
- **Loading (initial)**: 8-row skeleton (date label + amount).
- **Loading (next page)**: spinner footer in the list.
- **Error (initial)**: full-screen `<ErrorState variant="full-screen">` with "Retry".
- **Error (next page)**: footer "Couldn't load more — Retry" tap area.
- **Empty**: "No transactions yet. Tap **+** to add one."

### §7.5 Transaction detail — `app/(tabs)/transactions/[id].tsx`

- **Purpose**: show one transaction's fields. Read-only in v1.0 (Tier 2 adds edit/delete).
- **Layout**:
  ```
  ┌─────────────────────────────────┐
  │ ← Back                          │
  │                                 │
  │ $42.00                          │
  │ Groceries / Carulla             │
  │                                 │
  │ Date         Apr 28, 2026       │
  │ Subcategory  Groceries          │
  │ Hangout      —                  │
  │ Description  Weekly run         │
  └─────────────────────────────────┘
  ```
- **Data sources**: `useTransactionQuery(id)` → `GET /transactions/{id}/`. Hydrate from list cache via `getQueryData` to avoid a flicker.
- **Loading**: full-screen skeleton if no cached data, otherwise instant render of cached row.
- **Error**: full-screen `<ErrorState>` with "Retry" + "Back".
- **Empty**: n/a.

### §7.6 Quick transaction — `app/transactions/new.tsx` (modal)

- **Purpose**: create a transaction in ≤ 2 seconds while standing in line.
- **Layout** (modal pushed from below):
  ```
  ┌─────────────────────────────────┐
  │ Cancel    New transaction   Save│
  ├─────────────────────────────────┤
  │ Subcategory   [ Groceries   › ] │ ← opens SubcategoryPicker
  │ Amount        [ $0.00         ] │
  │ Date          [ Apr 28, 2026  ] │ ← native date picker
  │ Hangout       [ Optional    › ] │ ← opens HangoutPicker
  │ Description   [ Optional      ] │
  └─────────────────────────────────┘
  ```
  Subcategory and amount required (zod schema enforces). Date defaults to today.
- **Data sources**: `useCreateTransactionMutation()` → `POST /transactions/`.
- **Primary interactions**:
  - Save button disabled until form valid.
  - On save → mutation in flight → button shows spinner → on success: invalidate `[transactionsQueryKey]` + dashboard queries, dismiss modal.
  - Cancel discards (no confirmation; the form is small).
- **Loading**: only the Save button's inline spinner.
- **Error**:
  - Validation (`422`): map field errors to inline `<Field>` errors.
  - Network: form **stays open** with input preserved per scope spec. Top-of-modal red banner: "Couldn't save — check your connection. **Retry**." Tapping retry re-submits.
  - Other (`5xx`): same banner, generic copy.
- **Empty**: n/a.

### §7.7 Subcategory picker — `<SubcategoryPicker />` (bottom sheet)

- **Purpose**: pick one subcategory for a transaction.
- **Layout**: shared `<PickerSheet>` shell — drag handle, search input, list. List item shows subcategory name plus parent category in muted text (the type already carries `category_name`).
- **Data sources**: `useSubcategoriesInfiniteQuery({ name: debouncedSearch })`.
- **Primary interaction**: tap item → call `onSelect(subcategory)` → sheet closes.
- **Loading (initial)**: 6-row skeleton.
- **Loading (next page)**: footer spinner.
- **Error**: full-sheet `<ErrorState variant="inline">` with "Retry".
- **Empty**: "No matches." (when search has no results) / "No subcategories yet." (when the list is empty entirely — but that should never happen for an authenticated user).

### §7.8 Hangout picker — `<HangoutPicker />` (bottom sheet)

Same shell as §7.7 against `useHangoutsInfiniteQuery`. List item shows hangout name + date. **Optional** field on the form, so the sheet has a "Clear selection" row at the top.

### §7.9 Settings — `app/(tabs)/settings.tsx`

Minimal v1.0:

- Signed-in user (email).
- App version (read from `Constants.expoConfig?.version`).
- **Sign out** button — calls `clearSession` per §5.5.

No theme toggle in v1.0 (system colour scheme via `useColorScheme`). No notification preferences. No data export.

---

## §8. Error & loading state patterns

Three reusable components live in `src/components/`. Every screen consumes them — no ad-hoc spinners or red banners.

### §8.1 `<LoadingState>` variants

| Variant         | Use                                                  | Visual                          |
|-----------------|------------------------------------------------------|---------------------------------|
| `list-skeleton` | First-paint of a list (Transactions, pickers)        | N grey rounded rows             |
| `card-skeleton` | First-paint of a card (Dashboard cards)              | Single grey rounded rectangle   |
| `full-screen`   | First-paint of a single-record screen (Detail)       | Centred spinner + label         |
| `inline`        | Inside a button                                      | Small spinner replaces text     |

Skeletons use `react-native-reanimated`'s `withRepeat` for a subtle shimmer (already installed; no extra dep).

### §8.2 `<ErrorState>` variants

| Variant         | Use                                                       | Visual / behaviour                              |
|-----------------|-----------------------------------------------------------|-------------------------------------------------|
| `inline`        | One card or one list among multiple on the same screen    | Red icon + short copy + Retry link              |
| `full-screen`   | Entire screen failed to load                              | Centred icon + copy + Retry button + Back      |
| `toast`         | Mutation failed and the screen otherwise continues        | Snackbar slides up for 4s, swipe to dismiss     |

Copy is friendly, not technical:
- Network-class error → "Check your connection."
- 5xx → "Something went wrong. Try again."
- 401 → never shown (auto sign-out per §4.4).
- 422 → never shown via `<ErrorState>`; surfaces as inline field errors.

### §8.3 `<EmptyState>`

Single-line muted copy + optional CTA. Used by Dashboard's empty due list, the empty Transactions list, and empty picker results.

### §8.4 Network failure during mutation

Per scope spec: input preserved + retry offered.

Implementation: forms NEVER reset on `onError`. The submit button re-enables. A `toast`-variant error appears for 4s; an inline banner persists at the top of the form until the next submit attempt or dismiss.

### §8.5 Catastrophic / boundary

Root `<ErrorBoundary>` (around `<Slot />` in `_layout.tsx`) catches uncaught render errors. Fallback:

```
┌─────────────────────────────────┐
│       Something went wrong.     │
│                                 │
│       [ Try again ]             │
└─────────────────────────────────┘
```

"Try again" calls the boundary's `resetErrorBoundary`. No third-party crash reporter — only `console.error` (scope spec).

---

## §9. Build & release

### §9.1 EAS profiles

`eas.json`:

```json
{
  "cli": { "version": ">= 5.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": { "android": { "track": "internal" } }
  }
}
```

### §9.2 Distribution

- `eas build --profile production --platform android` → AAB.
- `eas submit --profile production --platform android` → Google Play Internal Testing track only.
- No Play public listing in v1.0 per scope spec OQ5.

---

## §10. Out of scope (verbatim from `mobile-companion-scope`)

The following modules MUST NOT appear in v1.0 — not in code, not in routes, not in `package.json`:

- Categories CRUD
- Subcategories CRUD
- Bulk transactions dialog
- Import (paste from spreadsheet)
- CSV export
- Three-select year/month/day filter (use date-range only)
- Mark-as-paid client action for periodic expenses
- iOS support
- Push notifications (FCM/APNS)
- Third-party crash reporters (Sentry/Bugsnag/Crashlytics)
- Edit / delete transactions (Tier 2 — v1.1+)
- Hangouts CRUD (Tier 2 — v1.1+)

Adding any of these requires a new opspec change documenting the justification.

---

## §11. Resolved questions

- **OQ1 (RESOLVED)**: NativeWind v4 first; fall back to v2 only if `eas build --profile development` fails after install. No re-litigation of the broader styling pick. Resolves itself at first build — no action needed up front.
- **OQ2 (RESOLVED)**: `expo-secure-store` is **NOT** shipped in v1.0. `react-native-auth0`'s `CredentialsManager` is the sole secure-storage path. Install `expo-secure-store` the day a non-token secret appears (none planned for v1.0).
- **OQ3 (RESOLVED)**: Android signing uses **EAS-managed credentials**. `eas build:configure` provisions the keystore. A future "publish to Play public listing" change must address key migration.
- **OQ4 (RESOLVED)**: Background-resume biometric re-prompt threshold = **5 minutes**. Locked as `BIOMETRIC_REPROMPT_MS = 5 * 60_000` (see §5.4).
- **OQ5 (RESOLVED)**: Concrete hostnames for `API_BASE_URL` live only in the developer's local `.env` (gitignored) and in `eas secret` per profile. They are not pinned in this TECHSPEC because they are deployment data, not architectural decisions.

## §12. Open questions

(None at v1.0 lock. Add new entries here if a future change uncovers an unresolved trade-off.)

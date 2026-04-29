## Context

The repo already contains an Expo Router scaffold (Expo SDK 54, RN 0.81, React 19, expo-router 6) and a seed of typed service stubs copied from the web app (`src/services/{transactions,subcategories,hangouts,dashboard}/`, `src/utils/format.ts`). The accepted scope spec (`mobile-companion-scope`) locks the WHAT — Tier 1/2/3 modules, Auth0 native universal login, Android-only, biometric lock, locked bundle id `com.streetrack.mobile`, locked deep-link scheme `streetrack://callback`. This TECHSPEC locks the HOW so Tier 1 implementation can begin without re-litigating foundational choices each time.

Constraints we cannot move:
- **Backend** — `streetrack-be` (FastAPI), single tenant per Auth0 user. Mobile must consume it as-is.
- **Auth0 tenant** — Mobile uses a distinct Native application but the same tenant; the connection list (Google + username/password) is shared.
- **Hermes engine** — Default for RN 0.81; supports `Intl.NumberFormat` and `Date.prototype.toLocaleString`, satisfying the scope's locale-formatting requirement.
- **Android-only** — No iOS provisioning, no Apple developer account, no `ios/` directory work.
- **Solo user** — No second engineer to coordinate with; library choices favour low maintenance over team-scaling features.

Stakeholder: same solo user as the web app. The TECHSPEC will be cited by every subsequent Tier 1 implementation change.

## Goals / Non-Goals

**Goals:**
- Lock a stack that lets every Tier 1 feature (Auth, Quick transaction, Recent list, Pickers, Dashboard) be built by composing the same primitives.
- Lock a project structure where "where does this file go?" is answered by the structure itself, not by judgement on each PR.
- Lock the auth integration shape end-to-end (provider, secure storage, fetch wrapper, refresh) so no feature has to re-invent it.
- Lock the configuration model so secrets/URLs come from a single typed source, not scattered string literals.
- Lock the build/release pipeline so the first internal release is one `eas build` + Play upload away.

**Non-Goals:**
- Implementing any Tier 1 feature. Each feature gets its own opspec change that consumes this TECHSPEC.
- Designing screen-level UX. Pickers, transaction form layout, dashboard composition belong to feature-specific changes.
- Picking a test framework. Test approach is deferred until the first feature needs one (`expect(1).toBe(1)` smoke is enough until then).
- iOS support. Out of scope per `mobile-companion-scope`.
- Tier 2 / Tier 3 features. Out of scope per `mobile-companion-scope`.

## Decisions

### D1. Navigation: keep `expo-router` (file-based, already scaffolded)

**Decision**: Use `expo-router` v6 (already in the scaffold). Routes live under `app/`, with `app/(tabs)/` for the bottom-tab shell.

**Why**: Already installed and wired into `app/_layout.tsx`. File-based routing matches the small surface area of Tier 1 (≤ 6 screens). Deep-linking integration with the locked `streetrack://callback` scheme is built in.

**Alternatives considered**:
- React Navigation directly (without expo-router) — more boilerplate for the same tabs shell; no benefit for a small app.

### D2. Server state: TanStack Query (`@tanstack/react-query` v5)

**Decision**: All `streetrack-be` reads/writes go through React Query. One `QueryClient` is created at app root and provided via `QueryClientProvider`. Per-resource hooks (`useTransactionsQuery`, `useCreateTransactionMutation`, …) live in `src/services/<resource>/queries.ts` next to the existing types.

**Why**: Mature pattern for paginated lists, optimistic updates, and the "retry on submit failure" behaviour the scope spec requires. Stale-while-revalidate keeps the dashboard fresh without manual cache plumbing. Same library as the web app, so the mental model transfers.

**Alternatives considered**:
- SWR — comparable but smaller mutation ergonomics; React Query's `useMutation` + `onError` gives the retry hook for free.
- Zustand / hand-rolled context — no caching, no retry, no pagination primitive. Would re-invent React Query badly.

### D3. Forms: `react-hook-form` + `zod` resolver

**Decision**: Quick-transaction form (and any later form) uses `react-hook-form` with `zod` validation via `@hookform/resolvers/zod`.

**Why**: Same stack as web; schemas can be lifted near-verbatim from `streetrack-fe`. Uncontrolled inputs avoid the per-keystroke re-render cost that hurts on mid-tier Android devices.

**Alternatives considered**:
- Formik — heavier, more re-renders.
- Hand-rolled `useState` per field — fine for the single-field cases (e.g., search input in a picker) and used there, but not for the transaction form.

### D4. Pickers / bottom sheets: `@gorhom/bottom-sheet` + custom search list

**Decision**: Subcategory and Hangout pickers use `@gorhom/bottom-sheet` to host a search input + scrollable list. Server-side `name icontains + skip/limit` pagination via the existing `PICKER_PAGE_LIMIT = 50` already seeded in `src/services/types.ts`.

**Why**: The scope spec rejects the web Combobox port and prescribes a bottom-sheet with search. `@gorhom/bottom-sheet` is the de-facto RN choice; integrates with `react-native-reanimated` v4 (already installed) and `react-native-gesture-handler` (already installed).

**Alternatives considered**:
- Modal screen instead of bottom sheet — wastes the screen-budget for what should feel ephemeral.
- `react-native-modal` — older, lacks the gesture polish.

### D5. Auth: `react-native-auth0` SDK

**Decision**: Use Auth0's official `react-native-auth0` v3+. Wrap the app in `<Auth0Provider>` at root. Universal login via `authorize({ audience, scope: 'openid profile email offline_access' })`. Refresh tokens enabled (`offline_access`).

**Why**: The scope spec mandates Auth0 PKCE via system browser, with both Google and username/password connections served by universal login. `react-native-auth0` handles PKCE, the Custom Tabs intent, and callback parsing — no hand-rolled `expo-auth-session` flow needed.

**Alternatives considered**:
- `expo-auth-session` — generic; would need to hand-write the Auth0-specific token exchange and callback handling.
- Embedded WebView — explicitly rejected by the scope spec.

### D6. Token storage: `react-native-auth0`'s `CredentialsManager` (no separate library)

**Decision**: Refresh tokens persist via `react-native-auth0`'s `CredentialsManager`, which uses Android Keystore directly. Access tokens are kept in memory only; on cold start the app calls `credentialsManager.getCredentials()`, which transparently refreshes. **No separate secure-storage library is installed in v1.0.**

**Why**: Tokens are the only secret the app handles in v1.0. The Auth0 SDK already owns Keystore-backed persistence end-to-end; adding `expo-secure-store` would be an unused dependency. If a future change introduces a non-token secret (e.g. a stored "trusted device" flag), install `expo-secure-store` then.

**Alternatives considered**:
- `expo-secure-store` — would work but redundant given the SDK's built-in manager; deferred until a non-token secret appears.
- `react-native-keychain` — adds a non-Expo native module with no upside over the SDK's manager.
- AsyncStorage — explicitly forbidden by scope spec.

### D7. Authenticated fetch: single `authFetch` wrapper

**Decision**: One module — `src/services/http.ts` — exports `authFetch(input, init)` which:
1. Calls `auth0.credentialsManager.getCredentials()` to obtain a fresh access token (the SDK handles silent refresh).
2. Adds `Authorization: Bearer <token>`.
3. Adds `Accept: application/json`.
4. Throws a typed `ApiError` for non-2xx responses (preserves status + parsed body).

All resource services (`transactions/`, `subcategories/`, `hangouts/`, `dashboard/`) call `authFetch` — never `fetch` directly. React Query hooks call the resource services — never `authFetch` directly. This keeps the layering uniform and the auth boundary inspectable in one file.

**Why**: Matches the seed pattern (resource folders already exist). Centralising the auth boundary means a future change (e.g., adding a `X-Trace-Id` header for the not-yet-built crash reporter) touches one file.

### D8. Biometric lock: `expo-local-authentication` gate at root layout

**Decision**: `app/_layout.tsx` mounts a `<BiometricGate>` between `<Auth0Provider>` and the route tree. On launch, if `LocalAuthentication.hasHardwareAsync() && isEnrolledAsync()`, call `authenticateAsync({ promptMessage: 'Unlock Streetrack' })`. On success, render children. On failure, show a retry button. If no biometrics are enrolled, render children directly.

**Why**: Scope spec mandates biometric gate on launch when biometrics are enrolled, and explicitly *no* PIN fallback in v1.0. `expo-local-authentication` is the Expo-native API.

### D9. Configuration: `app.config.ts` + typed `expo-constants` reader

**Decision**: Migrate `app.json` → `app.config.ts` (TypeScript). `extra` carries:
```ts
extra: {
  auth0Domain: process.env.AUTH0_DOMAIN,
  auth0ClientId: process.env.AUTH0_CLIENT_ID,
  auth0Audience: process.env.AUTH0_AUDIENCE,
  apiBaseUrl: process.env.API_BASE_URL,
}
```
A single `src/config.ts` reads `Constants.expoConfig?.extra` once at module load, parses it with `zod`, and exports a frozen typed object. Throws at startup if any required value is missing — fail fast, not on the first request.

**Why**: Avoids string-typed `process.env` reads scattered through code. A schema parse at boot means a misconfigured EAS profile breaks the splash screen, not a random user flow.

**Alternatives considered**:
- `react-native-config` — requires native linking and a `.env` file, which is overkill given Expo's first-class `extra` support.

### D10. Styling: NativeWind v4 (Tailwind classes for RN)

**Decision**: Use NativeWind v4. Reuse the same Tailwind class vocabulary the user already knows from the web app. Keep tokens minimal (default theme + a small `tailwind.config.ts` with brand colours).

**Why**: The scope spec explicitly *does not* mandate a styling library and notes web's shadcn/ui + Tailwind is web-only. NativeWind preserves the class-utility ergonomics without dragging Radix/shadcn primitives into RN. Tamagui was considered but its compiler + theme system is heavy for a one-developer Tier 1 surface.

**Alternatives considered**:
- Tamagui — better animations, but theme/compiler complexity outweighs the benefit at this scale.
- React Native Paper — Material-3 looks fine but locks the visual language to one design system; less flexibility than utility classes.
- StyleSheet.create only — works, but loses the muscle memory the user has from web.

### D11. Project structure (layout rule)

```
app/                       # expo-router routes only — thin screens
  _layout.tsx              # Auth0Provider > BiometricGate > QueryClientProvider > Slot
  (tabs)/
    index.tsx              # Dashboard
    transactions/
      index.tsx            # Recent transactions list
      new.tsx              # Quick transaction form
src/
  config.ts                # Typed runtime config (D9)
  services/
    http.ts                # authFetch (D7)
    types.ts               # Shared API types (already seeded)
    transactions/
      types.ts             # TransactionRead etc. (already seeded)
      api.ts               # Plain fetcher functions
      queries.ts           # React Query hooks
    subcategories/         # same trio
    hangouts/              # same trio
    dashboard/             # same trio
  features/                # Feature-specific composite components
    auth/
      AuthProvider.tsx
      BiometricGate.tsx
    transactions/
      TransactionForm.tsx
      TransactionList.tsx
    pickers/
      SubcategoryPicker.tsx
      HangoutPicker.tsx
  components/              # Reusable presentational primitives (Button, Card, Field)
  hooks/                   # Cross-feature hooks (useDebouncedValue, useColorScheme)
  utils/
    format.ts              # Already seeded (formatBalance/formatValue/formatDate)
```

**Rule**: A new file goes in `src/features/<feature>/` if it composes feature behaviour, in `src/services/<resource>/` if it talks to the API, in `src/components/` if it's reusable presentation, and in `app/` only if it's a route. Routes stay thin — they assemble feature components, they don't define UI.

### D12. Build & release: EAS Build + Google Play Internal Testing

**Decision**: `eas.json` defines three profiles:
- `development` — APK, dev client, local testing on the user's Android 16 device.
- `preview` — APK, production-like config, ad-hoc install for sanity checks.
- `production` — AAB, signed with EAS-managed credentials, uploaded to Play Internal Testing track.

`autoIncrement: true` for `versionCode` on production builds. `app.config.ts` reads `version` from `package.json`.

**Why**: EAS is the path of least resistance for an Expo managed project; avoids local Android Studio gymnastics. Internal Testing is the scope-mandated channel.

### D13. Error/logging posture: console + error boundary, no third-party reporters

**Decision**: A root `<ErrorBoundary>` (one screen-sized fallback with "Try again") wraps the route tree. Errors thrown inside React Query queries/mutations surface through hook return values; the screens decide their own retry UI. All `console.error` calls flow to device logs only.

**Why**: Scope spec forbids third-party crash reporters in v1.0. Solo user can `adb logcat` if a real bug surfaces.

## Risks / Trade-offs

- **Risk**: NativeWind v4 + Reanimated v4 + React 19 + RN 0.81 is a recent matrix; some libraries may have peer-dep warnings. → Mitigation: pin exact versions in the install task; if NativeWind v4 breaks, fall back to v2 (still actively maintained) — note in design rather than re-opening the choice. **Installed note**: `expo install --fix` reported no mismatches; matrix is clean.
- **Note (D6)**: `react-native-auth0` was bumped from v3 (as originally specified) to **v5.5.1** because v3 and v4 cap their React peer dep at `^18`; v5+ targets `>=19.0.0` matching this project. The v5 `useAuth0()` hook API is compatible with the patterns documented in this design.
- **Note (D4/D5)**: `zod` resolved to **v4.3.6** (latest), not v3. `@hookform/resolvers@5` supports zod v4 natively. Schemas written for this project target zod v4 API.
- **Note (D10)**: `tailwindcss@^3` is required as a dev dep alongside NativeWind v4 — NativeWind v4's peer dep is `>3.3.0`, meaning tailwindcss v4 is NOT compatible. Pinned to `^3` in `package.json`.
- **Risk**: `react-native-auth0` v3 currently still ships some autolinking quirks under Expo prebuild. → Mitigation: use the Expo config plugin in `app.config.ts` so the manifest entries (callback intent-filter for `streetrack://callback` and the SDK-generated `com.streetrack.mobile.auth0://...`) are added automatically.
- **Risk**: The "in-memory access token + refresh on cold start" pattern adds a launch-time network call before any screen renders. → Mitigation: render the splash screen until `getCredentials()` returns; only then mount routes. Acceptable for Tier 1 because every Tier 1 screen needs auth anyway.
- **Risk**: Configuration via `app.config.ts` reads environment at *build* time, not run time, so changing `API_BASE_URL` requires a new build. → Mitigation: this is desired (no runtime endpoint switching for a personal app); document the rebuild step in tasks.
- **Trade-off**: NativeWind makes web-style class strings work but RN's flexbox model differs from the web's (no `display: block`, default `flexDirection: column`). The user will trip on this once or twice; one paragraph of "RN flex is not web flex" in the project README is enough.
- **Trade-off**: Choosing React Query (D2) means we ship one more library, but the alternative is hand-rolling caching, retries, and pagination for every Tier 1 feature.

## Migration Plan

This is a greenfield techspec — there is no existing implementation to migrate. The migration steps are the install/wire-up sequence captured in `tasks.md`:

1. Install runtime libraries pinned to versions compatible with Expo SDK 54 / RN 0.81.
2. Migrate `app.json` → `app.config.ts` and add the Auth0 config plugin.
3. Add `src/config.ts` and the `authFetch` boundary.
4. Wire `<Auth0Provider>` + `<BiometricGate>` + `<QueryClientProvider>` into `app/_layout.tsx`.
5. Add `eas.json` and verify `eas build --profile development` succeeds before any feature change merges.

Rollback: if any decision turns out wrong before a Tier 1 feature ships, edit this design and re-run apply. Once a Tier 1 feature is merged on top, changes follow normal opspec rules (new change documenting the swap).

## Open Questions

- **OQ1 (RESOLVED)**: NativeWind v4 first; fall back to v2 only if `eas build --profile development` fails after install. No re-litigation of the broader styling choice.
- **OQ2 (RESOLVED)**: No runtime `zod` parsing of `streetrack-be` responses in v1.0 — trust the copied types under `src/services/*/types.ts`. The backend's authoritative OpenAPI document is available at `http://localhost:8000/openapi.json` (dev environment) and SHALL be consulted as the source-of-truth when the copied types need re-syncing or when a discrepancy is suspected. Revisit only if a backend schema bug ever ships a wrong shape.
- **OQ3 (RESOLVED)**: Android signing uses EAS-managed credentials. A future "publish to Play public listing" change must address key migration.

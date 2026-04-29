## ADDED Requirements

### Requirement: TECHSPEC consumes mobile-companion-scope verbatim

The mobile TECHSPEC SHALL cite `mobile-companion-scope` as its source of truth for module scope, target platform, identity values, and auth posture. It SHALL NOT silently expand or contract any tier list, target-platform decision, or locked identity value defined there.

#### Scenario: TECHSPEC cites the scope spec

- **WHEN** the TECHSPEC is read
- **THEN** it MUST reference `mobile-companion-scope` by name as the source for: Tier 1/2/3 module lists, Android-only target, biometric lock requirement, locked bundle identifier `com.streetrack.mobile`, and locked deep-link scheme `streetrack://callback`

#### Scenario: Scope deviation requires a new opspec change

- **WHEN** any TECHSPEC decision would alter scope-locked values (tier membership, target platform, bundle id, deep-link scheme, auth posture)
- **THEN** a new opspec change in this repo MUST be proposed before the TECHSPEC is updated

### Requirement: Locked navigation library

The mobile app SHALL use `expo-router` (v6+) for routing. All routes SHALL live under the `app/` directory and use file-based routing.

#### Scenario: expo-router is the only routing library

- **WHEN** a new screen is added
- **THEN** it MUST be added as a file under `app/` consumed by `expo-router`
- **AND** the project MUST NOT introduce a parallel routing library (`react-navigation` used directly, custom router, etc.)

### Requirement: Locked server-state library

The mobile app SHALL use TanStack Query (`@tanstack/react-query` v5+) for all reads and mutations against `streetrack-be`. A single `QueryClient` SHALL be created at app root and provided via `QueryClientProvider`.

#### Scenario: All API access goes through React Query

- **WHEN** a screen needs data from `streetrack-be`
- **THEN** it MUST consume a hook from `src/services/<resource>/queries.ts` that wraps `useQuery` or `useMutation`
- **AND** it MUST NOT call `fetch` or `authFetch` directly from the screen

#### Scenario: Single QueryClient at root

- **WHEN** the app mounts
- **THEN** exactly one `QueryClient` instance MUST be created and provided via `QueryClientProvider` in `app/_layout.tsx`

### Requirement: Locked form library

The mobile app SHALL use `react-hook-form` with `zod` validation (via `@hookform/resolvers/zod`) for any form with two or more fields. Single-input forms (e.g., a picker's search box) MAY use `useState` directly.

#### Scenario: Quick transaction form uses react-hook-form

- **WHEN** the Quick Transaction form is implemented
- **THEN** it MUST use `react-hook-form` with a `zod` schema as resolver
- **AND** it MUST NOT use Formik or hand-rolled `useState`-per-field for its multi-field inputs

### Requirement: Locked picker / bottom-sheet library

The mobile app SHALL use `@gorhom/bottom-sheet` to host the Subcategory and Hangout pickers required by `mobile-companion-scope`'s "Bottom-sheet picker pattern" requirement. The picker SHALL paginate via the existing `PICKER_PAGE_LIMIT` (50) defined in `src/services/types.ts`, using server-side `name icontains + skip/limit`.

#### Scenario: Pickers use @gorhom/bottom-sheet

- **WHEN** a Subcategory or Hangout picker is opened
- **THEN** it MUST be rendered inside a `@gorhom/bottom-sheet` instance with a search input at the top and a scrollable list below

#### Scenario: Picker pagination matches seeded constant

- **WHEN** a picker fetches options
- **THEN** it MUST use `PICKER_PAGE_LIMIT` from `src/services/types.ts` as the page size
- **AND** it MUST send `name` (icontains) and `skip`/`limit` as the query parameters

### Requirement: Auth0 SDK locked to react-native-auth0

The mobile app SHALL use `react-native-auth0` (v3+) as the Auth0 client. The app SHALL be wrapped in `<Auth0Provider>` at root. Universal login SHALL be invoked with `audience` and the scope string `'openid profile email offline_access'` so that refresh tokens are issued.

#### Scenario: Auth0Provider wraps the route tree

- **WHEN** any route renders
- **THEN** it MUST be a descendant of `<Auth0Provider>` configured with the locked Auth0 domain and client_id from `src/config.ts`

#### Scenario: offline_access scope is requested

- **WHEN** the user signs in via universal login
- **THEN** the `authorize()` call MUST include `audience` and `scope: 'openid profile email offline_access'`

#### Scenario: Embedded WebView is rejected

- **WHEN** a sign-in flow is implemented
- **THEN** it MUST NOT use a WebView; only the system browser via `react-native-auth0`'s `authorize()` is permitted, satisfying `mobile-companion-scope`'s PKCE requirement

### Requirement: Refresh tokens stored via Keystore-backed CredentialsManager

The mobile app SHALL persist refresh tokens through `react-native-auth0`'s `CredentialsManager` (which uses Android Keystore under the hood) and SHALL NOT store tokens in AsyncStorage or in plain files. Access tokens SHALL be kept in memory only and refreshed silently on demand by the SDK. The mobile app v1.0 SHALL NOT install a separate secure-storage library (`expo-secure-store`, `react-native-keychain`, etc.) because the SDK's manager covers the only secret the app handles.

#### Scenario: No AsyncStorage token writes

- **WHEN** the codebase is reviewed for token handling
- **THEN** there MUST NOT be any write of an access or refresh token to `@react-native-async-storage/async-storage` or to a plain file

#### Scenario: Cold start refreshes silently

- **WHEN** the app cold-starts and a previously-issued refresh token exists
- **THEN** the app MUST call `credentialsManager.getCredentials()` before mounting authenticated routes, allowing the SDK to refresh the access token transparently

### Requirement: Single authFetch boundary for all API calls

The mobile app SHALL expose exactly one HTTP boundary at `src/services/http.ts` (named `authFetch`) which: (a) obtains a fresh access token via `react-native-auth0`'s `CredentialsManager`, (b) attaches `Authorization: Bearer <token>`, (c) attaches `Accept: application/json`, and (d) throws a typed `ApiError` carrying status and parsed body for non-2xx responses. All resource service modules SHALL call `authFetch` and SHALL NOT call `fetch` directly.

#### Scenario: Resource services call authFetch

- **WHEN** a resource service module (`transactions/api.ts`, `subcategories/api.ts`, `hangouts/api.ts`, `dashboard/api.ts`) issues a request to `streetrack-be`
- **THEN** it MUST go through `authFetch` from `src/services/http.ts`

#### Scenario: Non-2xx responses raise ApiError

- **WHEN** `streetrack-be` returns a non-2xx response
- **THEN** `authFetch` MUST throw an `ApiError` instance carrying the HTTP status and the parsed JSON body (or raw text if body is not JSON)

### Requirement: Biometric gate at root layout

The mobile app SHALL gate the route tree behind `expo-local-authentication`. On launch, if `hasHardwareAsync()` and `isEnrolledAsync()` both return true, the app SHALL prompt for biometric authentication before mounting any authenticated screen. If no biometrics are enrolled, the app SHALL mount the route tree directly. This implements the `mobile-companion-scope` "Biometric app lock" requirement.

#### Scenario: Biometric prompt blocks the route tree

- **WHEN** the app cold-starts on a device with enrolled biometrics
- **THEN** the route tree MUST NOT mount until `LocalAuthentication.authenticateAsync()` resolves successfully

#### Scenario: No-biometrics fallback opens directly

- **WHEN** the app cold-starts on a device with no enrolled biometrics
- **THEN** the route tree MUST mount directly without prompting for any PIN or password

### Requirement: Typed configuration via app.config.ts + zod-parsed reader

The mobile app SHALL use `app.config.ts` (TypeScript) instead of `app.json` and SHALL expose runtime configuration through a single module `src/config.ts`. That module SHALL parse `Constants.expoConfig?.extra` with `zod` once at module load and SHALL throw at startup if any required value (`auth0Domain`, `auth0ClientId`, `auth0Audience`, `apiBaseUrl`) is missing.

#### Scenario: Config is read once at startup

- **WHEN** any module imports config values
- **THEN** it MUST import them from `src/config.ts` and MUST NOT read `process.env` or `Constants.expoConfig` directly elsewhere

#### Scenario: Missing config fails at boot

- **WHEN** a required config value is missing
- **THEN** `src/config.ts` MUST throw at module-load time, surfacing the failure during app startup rather than on the first request

### Requirement: Locked styling library

The mobile app SHALL use NativeWind v4 for styling. Brand tokens SHALL live in `tailwind.config.ts` at the repo root. Component styles SHALL be expressed as Tailwind class strings via NativeWind; ad-hoc `StyleSheet.create` blocks SHALL be the exception, not the default.

#### Scenario: NativeWind is the styling primitive

- **WHEN** a new component is added
- **THEN** styling MUST default to NativeWind class strings
- **AND** introducing a parallel styling system (Tamagui, React Native Paper, styled-components) MUST require a new opspec change

### Requirement: Locked project structure

The mobile app SHALL follow the layout below. Files SHALL be placed by purpose, not by author preference: routes in `app/` (thin), API plumbing in `src/services/<resource>/`, feature composition in `src/features/<feature>/`, reusable presentation in `src/components/`, cross-feature hooks in `src/hooks/`, formatting/util helpers in `src/utils/`.

```
app/
  _layout.tsx
  (tabs)/
    ...
src/
  config.ts
  services/
    http.ts
    types.ts
    <resource>/{types.ts, api.ts, queries.ts}
  features/<feature>/
  components/
  hooks/
  utils/
```

#### Scenario: Routes stay thin

- **WHEN** a new route is added under `app/`
- **THEN** it MUST compose components from `src/features/` and `src/components/` rather than defining feature behaviour or styled UI inline

#### Scenario: Per-resource service trio

- **WHEN** a new backend resource is wired up
- **THEN** its folder under `src/services/<resource>/` MUST contain `types.ts`, `api.ts` (plain fetcher functions calling `authFetch`), and `queries.ts` (React Query hooks)

### Requirement: Locked build & release pipeline

The mobile app SHALL be built via EAS Build with three profiles defined in `eas.json`: `development` (APK + dev client), `preview` (APK, production-like), and `production` (AAB, signed via EAS-managed credentials). The `production` profile SHALL be the only one whose output is uploaded to Google Play Internal Testing — the sole release channel per `mobile-companion-scope`.

#### Scenario: Three EAS profiles exist

- **WHEN** `eas.json` is read
- **THEN** it MUST define `development`, `preview`, and `production` build profiles with the artifact types listed above

#### Scenario: Production builds auto-increment versionCode

- **WHEN** an EAS production build is requested
- **THEN** the `versionCode` MUST auto-increment so consecutive uploads to Play Internal Testing do not collide

#### Scenario: Internal Testing is the only release destination

- **WHEN** a release is initiated
- **THEN** the destination MUST be Google Play Internal Testing
- **AND** publishing to a public Play listing MUST require a new opspec change

### Requirement: Error handling without third-party reporters

The mobile app SHALL wrap the route tree in a single root `<ErrorBoundary>` whose fallback is a screen-sized "Something went wrong / Try again" view. React Query errors SHALL surface through hook return values and SHALL be rendered as feature-local UI (inline error + retry). The app SHALL NOT integrate Sentry, Bugsnag, Crashlytics, or any third-party crash reporter, satisfying `mobile-companion-scope`'s "no crash reporting in v1.0" requirement.

#### Scenario: Root error boundary exists

- **WHEN** a render error escapes a screen
- **THEN** the root `<ErrorBoundary>` MUST catch it and render a recoverable fallback

#### Scenario: No third-party reporter installed

- **WHEN** `package.json` is reviewed
- **THEN** it MUST NOT list `@sentry/react-native`, `@bugsnag/react-native`, `@react-native-firebase/crashlytics`, or any equivalent third-party crash reporter

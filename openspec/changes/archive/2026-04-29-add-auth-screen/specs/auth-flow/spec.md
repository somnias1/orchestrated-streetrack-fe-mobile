## ADDED Requirements

### Requirement: Public sign-in route exists at `/sign-in`

The mobile app SHALL expose a public route at `app/sign-in.tsx` that renders a sign-in screen. The route SHALL be reachable without an Auth0 session and SHALL NOT be wrapped by the auth gate.

#### Scenario: Unauthenticated user can render sign-in

- **WHEN** the app navigates to `/sign-in` with no Auth0 session
- **THEN** the screen MUST mount without redirecting
- **AND** it MUST render a "Sign in" call-to-action

#### Scenario: Sign-in is not gated

- **WHEN** the route tree is inspected
- **THEN** `app/sign-in.tsx` MUST NOT be wrapped in `AuthGate`

### Requirement: Sign-in CTA invokes Auth0 universal login with locked scope

The sign-in screen's primary action SHALL call `react-native-auth0`'s `authorize()` with `audience` from `src/config.ts` and `scope: 'openid profile email offline_access'`. The call SHALL be issued via the `useAuthSession` hook so callers do not re-spell the scope string.

#### Scenario: Sign-in button calls authorize with locked scope

- **WHEN** the user taps "Sign in"
- **THEN** `useAuthSession().signIn()` MUST be invoked
- **AND** internally it MUST call `authorize({ audience, scope: 'openid profile email offline_access' })`

#### Scenario: Scope string is centralised

- **WHEN** the codebase is searched for `'openid profile email offline_access'`
- **THEN** that literal MUST appear only inside `src/features/auth/useAuthSession.ts`

### Requirement: Authenticated route group redirects unauthenticated users

The `(tabs)` route group SHALL be wrapped in an `AuthGate` component. When `useAuthSession().isAuthenticated` is `false` and `isLoading` is `false`, the gate SHALL render `<Redirect href="/sign-in" />` from `expo-router`. While `isLoading` is `true`, the gate SHALL render a splash view and SHALL NOT redirect.

#### Scenario: Unauthenticated cold start lands on sign-in

- **WHEN** the app cold-starts with no stored Auth0 credentials
- **THEN** after `Auth0Provider` finishes its initial silent refresh
- **AND** the user navigates to any `(tabs)` route
- **THEN** `AuthGate` MUST redirect to `/sign-in`

#### Scenario: Loading state does not flash sign-in

- **WHEN** `Auth0Provider` is still resolving stored credentials (`isLoading === true`)
- **THEN** `AuthGate` MUST render a splash view
- **AND** it MUST NOT render `<Redirect href="/sign-in" />`

#### Scenario: Authenticated user reaches tabs

- **WHEN** the app cold-starts with a valid refresh token
- **AND** the SDK silently refreshes successfully
- **THEN** `AuthGate` MUST render its children (the `Tabs` layout)

### Requirement: Successful sign-in routes the user into `(tabs)`

After `authorize()` resolves successfully, the user SHALL land on the default `(tabs)` route without an explicit programmatic navigation in the screen — `AuthGate`'s reactive redirect SHALL cover the transition.

#### Scenario: authorize success flips isAuthenticated and unmounts sign-in

- **WHEN** `authorize()` resolves with valid credentials
- **THEN** `useAuthSession().isAuthenticated` MUST become `true` on the next render
- **AND** if the user is currently on `/sign-in`, the app MUST navigate to the default `(tabs)` route via expo-router

### Requirement: Sign-in errors render inline without third-party reporters

When `authorize()` rejects with a non-cancellation error, the screen SHALL render the message inline. User-cancellation errors (Auth0 code `USER_CANCELLED` / `a0.session.user_cancelled`) SHALL be swallowed and SHALL NOT render an error. The screen SHALL NOT call any third-party crash or analytics reporter.

#### Scenario: Network error is shown inline

- **WHEN** `authorize()` rejects due to a network failure
- **THEN** the screen MUST render a recoverable inline message ("Couldn't sign in. Try again.")
- **AND** the "Sign in" button MUST remain enabled

#### Scenario: User cancellation is silent

- **WHEN** `authorize()` rejects with `USER_CANCELLED`
- **THEN** no error text MUST be rendered
- **AND** the "Sign in" button MUST remain enabled

#### Scenario: No third-party reporter is called

- **WHEN** any sign-in error is handled
- **THEN** the codebase MUST NOT call Sentry, Bugsnag, Crashlytics, or any equivalent third-party reporter

### Requirement: Cold-start silent refresh precedes any authenticated render

On app launch, `Auth0Provider` SHALL attempt a silent refresh of stored credentials. The route tree SHALL NOT mount any authenticated screen until that refresh has settled. The biometric prompt MAY run concurrently with the silent refresh; both MUST complete before `(tabs)` renders.

#### Scenario: Cold start with valid refresh token

- **WHEN** the app cold-starts and a non-expired refresh token exists in `CredentialsManager`
- **THEN** `Auth0Provider` MUST silently refresh the access token
- **AND** the user MUST land on `(tabs)` without seeing the sign-in screen

#### Scenario: Cold start with expired or revoked refresh token

- **WHEN** the app cold-starts and the refresh token is expired or revoked
- **THEN** `Auth0Provider` MUST settle with `user === null`
- **AND** `AuthGate` MUST redirect to `/sign-in`

### Requirement: Sign-out clears credentials and returns user to sign-in

The app SHALL expose a sign-out action on a `profile` tab inside `(tabs)`. The action SHALL call `useAuthSession().signOut()`, which internally calls `clearSession()`. After sign-out, `AuthGate` SHALL redirect the user to `/sign-in`.

#### Scenario: Sign-out is reachable from authenticated UI

- **WHEN** the user is authenticated and on any `(tabs)` route
- **THEN** the user MUST be able to navigate to a `profile` tab
- **AND** the profile screen MUST render a "Sign out" button

#### Scenario: Sign-out clears credentials

- **WHEN** the user taps "Sign out"
- **THEN** `clearSession()` MUST be invoked via `useAuthSession().signOut()`
- **AND** `CredentialsManager`-stored credentials MUST be cleared

#### Scenario: Post sign-out redirect

- **WHEN** sign-out resolves successfully
- **THEN** `useAuthSession().isAuthenticated` MUST become `false`
- **AND** `AuthGate` MUST redirect to `/sign-in`

### Requirement: `useAuthSession` is the only consumer of `react-native-auth0` outside `AuthProvider`

Application code (screens, gates, sign-out button) SHALL consume auth state and actions exclusively through `src/features/auth/useAuthSession.ts`. Direct imports of `useAuth0` from `react-native-auth0` SHALL be limited to `src/features/auth/AuthProvider.tsx` and `src/features/auth/useAuthSession.ts`.

#### Scenario: Screens do not import useAuth0 directly

- **WHEN** the codebase is searched for imports of `useAuth0` from `react-native-auth0`
- **THEN** matches MUST appear only in `src/features/auth/AuthProvider.tsx` and `src/features/auth/useAuthSession.ts`

#### Scenario: Sign-in and profile screens use the wrapper

- **WHEN** the sign-in screen or the profile screen needs to trigger sign-in or sign-out
- **THEN** they MUST call `useAuthSession()` and MUST NOT call `useAuth0()` directly

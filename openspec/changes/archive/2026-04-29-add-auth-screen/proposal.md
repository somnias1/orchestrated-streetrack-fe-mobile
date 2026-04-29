## Why

The mobile app already wires `Auth0Provider`, `BiometricGate`, and a `QueryClient` into the root layout, but there is no sign-in screen, no auth-state gate, and no sign-out path. As a result `getCredentials()` throws on cold start, the route tree mounts before any token is acquired, and there is no way for the user to actually authenticate. We need the actual auth flow before any Tier 1 feature (Quick transaction, Recent list, Pickers, Dashboard) can ship.

## What Changes

- Add a sign-in route at `app/sign-in.tsx` that calls `react-native-auth0`'s `authorize()` with `audience` and `scope: 'openid profile email offline_access'`.
- Gate authenticated routes (the `(tabs)` group) on a valid Auth0 session: redirect to `/sign-in` when there are no stored credentials, and to `/(tabs)` once `authorize()` resolves.
- Perform silent credential refresh on cold start via `credentialsManager.getCredentials()` before any authenticated route mounts; surface a splash/loading state while this resolves.
- Add a sign-out action accessible from an authenticated screen (e.g., a settings/profile entry in the tab bar) that calls `clearSession()` and clears stored credentials.
- Surface auth failures (cancelled flow, network error, refresh-token expiry) inline on the sign-in screen with a retry affordance — no third-party error reporter.
- Keep `BiometricGate` outside the auth gate so the biometric prompt continues to fire on every cold start, before either `/sign-in` or `/(tabs)` mounts.

## Capabilities

### New Capabilities
- `auth-flow`: Sign-in screen, route gating by Auth0 session state, cold-start silent refresh, and sign-out for the mobile app.

### Modified Capabilities
<!-- None. The `mobile-techspec` capability already locks SDK choice, scope string, and storage; this change consumes those locks rather than altering them. -->

## Impact

- New file `app/sign-in.tsx` (route).
- New files under `src/features/auth/`: `useAuthSession.ts` (session state + actions), `SignInScreen.tsx` (presentation), and an `AuthGate.tsx` wrapper used in `app/(tabs)/_layout.tsx` (or a parallel route group) to redirect unauthenticated users.
- Update `app/_layout.tsx`: wrap the `Stack` so that `(tabs)` is gated and `sign-in` is reachable as a sibling route; ensure `BiometricGate` still wraps everything.
- Update `src/features/auth/AuthProvider.tsx`: extend `AuthFetchBridge` (or add a sibling) so `initAuthFetch` and the cold-start refresh use the same `getCredentials` source of truth.
- No backend changes — the existing `streetrack-be` Auth0 audience is reused per `mobile-companion-scope` (separate Native Auth0 application, same tenant, Google + username/password connections).
- No new dependencies — `react-native-auth0`, `expo-router`, `nativewind`, and `react-hook-form` are already installed.

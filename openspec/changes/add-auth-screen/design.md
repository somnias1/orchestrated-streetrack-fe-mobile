## Context

The mobile root layout (`app/_layout.tsx`) already mounts `Auth0Provider` (via `src/features/auth/AuthProvider.tsx`), `BiometricGate`, and a `QueryClientProvider`. `AuthFetchBridge` wires `authFetch` to `useAuth0().getCredentials`. What is missing:

1. There is no UI surface for `authorize()` — `react-native-auth0`'s session is empty on first launch, so `getCredentials()` rejects and any authenticated screen will fail at first render.
2. The `(tabs)` group mounts unconditionally regardless of session state.
3. There is no sign-out path.

`mobile-techspec` already locks the SDK choice (`react-native-auth0` v3+), the universal-login posture (system browser, no WebView), the scope string (`'openid profile email offline_access'`), and refresh-token storage (`CredentialsManager`/Android Keystore). `mobile-companion-scope` requires both Google social and username/password connections — both are handled by Auth0 universal login, so the screen does not need any social-button or form fields. The user's only interaction is a single "Sign in" button that hands off to the system browser.

## Goals / Non-Goals

**Goals:**
- Provide a working authentication loop: cold-start → optional biometric → silent refresh → either tabs (authed) or sign-in (not authed) → universal login → tabs.
- Keep the existing `BiometricGate` ordering — biometric is the outermost gate, then auth.
- Make `authFetch` safe: any call must originate from a route that has already passed the auth gate.
- Provide a sign-out that clears Auth0 credentials and returns the user to the sign-in screen.

**Non-Goals:**
- No native email/password form. Universal login owns credential collection (per `mobile-companion-scope`).
- No native Google Sign-In SDK. Google connection is mediated by Auth0.
- No "remember device" / step-up auth / MFA UI. The Auth0 tenant decides those, not the app.
- No deep-link routing beyond the Auth0 callback already locked in `mobile-companion-scope`.
- No analytics or third-party crash reporting on auth events (per `mobile-techspec` "no third-party reporters").

## Decisions

### 1. Route layout: `sign-in` is a sibling of `(tabs)`, gated inside `(tabs)/_layout.tsx`

```
app/
  _layout.tsx          // ErrorBoundary > AuthProvider > BiometricGate > QueryClient > Stack
  sign-in.tsx          // public; renders <SignInScreen />
  (tabs)/
    _layout.tsx        // <AuthGate><Tabs/></AuthGate>
    index.tsx
    explore.tsx
    profile.tsx        // hosts the sign-out action
  modal.tsx
```

**Why this over an `(auth)` route group:** the only public route is `sign-in`; a group adds a directory for one file. Gating inside `(tabs)/_layout.tsx` keeps the public surface flat and lets `expo-router`'s `<Redirect>` do the work.

**Alternative considered:** gating in the root `_layout.tsx`. Rejected because it would also gate the modal route and any future public routes (e.g., a future "about" page).

### 2. `useAuthSession` wrapper around `useAuth0()`

Add `src/features/auth/useAuthSession.ts` that returns `{ isLoading, isAuthenticated, error, signIn, signOut }`. Internally it composes `useAuth0()`'s `user`, `isLoading`, `error`, `authorize`, and `clearSession`.

```ts
function signIn() {
  return authorize({
    audience: config.auth0Audience,
    scope: 'openid profile email offline_access',
  });
}
function signOut() {
  return clearSession();
}
```

**Why a wrapper:** the scope string and audience are spec-locked; centralising them prevents accidental drift in callers and makes the contract testable. Callers never construct `authorize()` arguments themselves.

**Alternative considered:** call `useAuth0()` directly from the screen. Rejected: every caller would re-spell the locked scope string.

### 3. `AuthGate` redirects via `expo-router`'s `<Redirect>`

```tsx
function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuthSession();
  if (isLoading) return <SplashView />;
  if (!isAuthenticated) return <Redirect href="/sign-in" />;
  return <>{children}</>;
}
```

`react-native-auth0`'s `<Auth0Provider>` automatically attempts a silent refresh on mount and exposes `isLoading: true` while it does so; once it settles, `user` is populated if a valid refresh token was on disk, else `user` is `null`. The gate uses `isLoading` to render a splash, never a redirect, until the SDK has decided.

**Why `<Redirect>` not `router.replace()`:** `<Redirect>` is declarative and re-runs on state change without effects, eliminating a class of stale-redirect bugs.

### 4. Sign-in screen is a single CTA, no form

`SignInScreen` renders the Streetrack wordmark, a one-line tagline, a "Sign in" button (calls `signIn()`), and an inline error region. `react-hook-form` is **not** used — there are no fields. NativeWind classes own styling.

Error states surfaced inline:
- `USER_CANCELLED` (Auth0 error code) → silent, no error text.
- Network / unknown errors → "Couldn't sign in. Try again." with the original `error.message` rendered in a muted small line for debuggability.

### 5. Sign-out lives on a `profile` tab

Add a third tab `profile.tsx` hosting the user's email (from `user.email`) and a "Sign out" button. Sign-out calls `clearSession()`; the gate then redirects to `/sign-in` automatically because `useAuthSession().isAuthenticated` flips false.

**Why a tab vs. a stack header button:** `mobile-companion-scope` Tier 1 lists Dashboard, Quick Transaction, Recent Transactions, Pickers — a profile screen does not appear in the tier list, but a user-visible sign-out is necessary for any auth flow. A minimal tab keeps the surface discoverable without inventing a navigation pattern (header-right buttons would also work but would have to be replicated per tab).

**Alternative considered:** put sign-out in the existing `modal.tsx` reachable from a header button. Rejected for v1.0: requires plumbing a header-right button into every tab and a new modal layout. The profile tab is cheaper.

### 6. `AuthFetchBridge` stays as-is, runs above the gate

`AuthFetchBridge` calls `initAuthFetch(getCredentials)` once on mount. Because the bridge is mounted by `AuthProvider` (above the gate), the credential-getter is wired before any authenticated screen renders. When `authFetch` is invoked from a `(tabs)` screen, it has already passed the gate, so `getCredentials()` will resolve to a fresh token (the SDK refreshes it transparently).

If the refresh token is revoked mid-session, `getCredentials()` rejects → the next `authFetch` throws an `ApiError` with status 0 / network-style failure → the React Query hook surfaces the error → `useAuthSession().isAuthenticated` will also flip to false on the next render because `user` is cleared, and the gate redirects to `/sign-in`.

## Risks / Trade-offs

- **[Risk] First-launch race: `BiometricGate` mounts before `Auth0Provider` settles.** → Mitigation: ordering in `_layout.tsx` is `AuthProvider > BiometricGate`. The provider initializes synchronously on mount; biometric prompt runs concurrently with the SDK's silent refresh. By the time the user passes biometric, the SDK has almost always finished, and if not the gate's `isLoading` splash covers the gap.

- **[Risk] User cancels the system browser.** → Mitigation: `react-native-auth0` rejects with `USER_CANCELLED`; `useAuthSession` swallows that code and resets local error state so the screen looks idle.

- **[Risk] Refresh token expiry triggers logout mid-session, losing in-flight form input (e.g., a half-typed Quick Transaction).** → Accepted for v1.0. `mobile-companion-scope` "Offline posture (v1)" only requires preserving form state on network failure, not on auth failure. Document in tasks for a future change.

- **[Trade-off] No deep-link from sign-in → originally-requested route.** A user who had a deep-link to `/(tabs)/transactions/123` will land on the default tab after sign-in instead. → Accepted: `mobile-companion-scope` does not require deep-link preservation in v1.0; adding it would need an intent/return-to plumbing layer not justified by current usage.

- **[Trade-off] `isAuthenticated` is derived from `user != null`, not from a fresh access-token check.** A revoked refresh token will only surface on the next `authFetch` call. → Acceptable: the SDK already keeps `user` in sync with the credential store; an additional health-check call on every render would add latency without changing outcomes.

## Migration Plan

This is the first auth-flow change after `initial-techspec`. There are no users to migrate. Rollout is a single PR that merges to `main`, after which any developer building locally must:

1. Configure Auth0 application (Native type) and populate `.env` with `EXPO_PUBLIC_AUTH0_DOMAIN`, `EXPO_PUBLIC_AUTH0_CLIENT_ID`, `EXPO_PUBLIC_AUTH0_AUDIENCE`, `EXPO_PUBLIC_API_BASE_URL` (already required by `src/config.ts`).
2. Add `streetrack://callback` and the SDK-generated callback URL to the Auth0 application's **Allowed Callback URLs** and **Allowed Logout URLs**.
3. Run `expo run:android` (dev client). The Auth0 redirect URLs require a custom dev-client build; Expo Go will not work for the auth flow.

Rollback: revert the PR. The pre-change app does not have a working auth surface either, so there is no regression risk.

## Open Questions

- Does the Profile tab render anything beyond email + sign-out for v1.0? (Recommendation: no — keep it minimal; revisit when Tier 2 lands.)
- Should we surface the Auth0 `error.message` to end-users, or only to developer logs? (Recommendation: muted, secondary text — useful for triage during Internal Testing, low harm.)

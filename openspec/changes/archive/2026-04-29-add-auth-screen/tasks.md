## 1. Auth session wrapper

- [x] 1.1 Create `src/features/auth/useAuthSession.ts` exposing `{ isLoading, isAuthenticated, user, error, signIn, signOut }`, composing `useAuth0()`
- [x] 1.2 Hard-code the locked scope `'openid profile email offline_access'` and `audience: config.auth0Audience` inside `signIn`; do not accept overrides from callers
- [x] 1.3 In `signIn`'s catch path, swallow `USER_CANCELLED` (Auth0 code `a0.session.user_cancelled`); surface all other errors via the hook's `error` field
- [x] 1.4 Verify by grep: the literal `'openid profile email offline_access'` appears only in `useAuthSession.ts`

## 2. Auth gate

- [x] 2.1 Create `src/features/auth/AuthGate.tsx`: renders splash while `isLoading`, `<Redirect href="/sign-in" />` when `!isAuthenticated`, else `children`
- [x] 2.2 Create `src/features/auth/SplashView.tsx` (NativeWind, brand wordmark, no spinner crash-reporting hook)
- [x] 2.3 Wrap `app/(tabs)/_layout.tsx`'s returned `<Tabs>` in `<AuthGate>`
- [x] 2.4 Confirm `AuthGate` is NOT applied to `app/sign-in.tsx` (sign-in must remain reachable)

## 3. Sign-in screen

- [x] 3.1 Create `app/sign-in.tsx` rendering `<SignInScreen />`
- [x] 3.2 Create `src/features/auth/SignInScreen.tsx` with brand wordmark, single "Sign in" CTA, and inline error region
- [x] 3.3 Wire the CTA to `useAuthSession().signIn`; disable the button while a sign-in is in flight
- [x] 3.4 Render the inline error: muted "Couldn't sign in. Try again." with a secondary line carrying `error.message` for triage
- [x] 3.5 Style with NativeWind classes only (no `StyleSheet.create` blocks beyond what is already idiomatic in `BiometricGate`)

## 4. Profile tab + sign-out

- [x] 4.1 Create `app/(tabs)/profile.tsx` rendering the user's email and a "Sign out" button
- [x] 4.2 Add a `Tabs.Screen` entry for `profile` in `app/(tabs)/_layout.tsx` with an appropriate `IconSymbol`
- [x] 4.3 Wire the "Sign out" button to `useAuthSession().signOut`; show a busy state while clearing
- [x] 4.4 Verify the user lands on `/sign-in` after sign-out (no manual `router.replace` needed — gate redirects reactively)

## 5. Provider wiring sanity check

- [x] 5.1 Confirm `app/_layout.tsx` order is `ErrorBoundary > AuthProvider > BiometricGate > QueryClientProvider > Stack`; no changes expected
- [x] 5.2 Confirm `AuthFetchBridge` continues to call `initAuthFetch(getCredentials)` once on mount and is not duplicated
- [x] 5.3 Grep for `useAuth0` imports outside `AuthProvider.tsx` and `useAuthSession.ts`; remove or refactor any other call site

## 6. Manual verification on Android dev client

- [x] 6.1 Cold start with no credentials → biometric (if enrolled) → splash → `/sign-in`
- [x] 6.2 Tap "Sign in" → system browser opens Auth0 universal login → username/password sign-in → returns to `(tabs)`
- [x] 6.3 Tap "Sign in" → cancel system browser → screen returns to idle, no error message
- [x] 6.4 Sign in via Google connection → returns to `(tabs)` with `user.email` populated
- [x] 6.5 Kill and relaunch app → cold start lands directly on `(tabs)` (silent refresh path)
- [x] 6.6 Open Profile tab → tap "Sign out" → lands on `/sign-in`; relaunch confirms credentials are cleared
- [x] 6.7 With airplane mode enabled, tap "Sign in" → inline error appears and the button stays enabled

## 7. OpenSpec validation

- [x] 7.1 Run `openspec validate add-auth-screen` and resolve any reported issues
- [x] 7.2 Run `openspec status --change add-auth-screen` and confirm `isComplete` is true

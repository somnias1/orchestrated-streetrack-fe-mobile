## 1. Auth0 tenant prerequisites (out-of-band)

- [ ] 1.1 Create a new Auth0 application of type **Native** alongside the existing SPA, in the same tenant
- [ ] 1.2 Configure allowed callback URLs: `streetrack://callback` AND `com.streetrack.mobile.auth0://<tenant-domain>/android/com.streetrack.mobile/callback`
- [ ] 1.3 Configure allowed logout URLs to mirror callbacks
- [ ] 1.4 Verify both Google social and username/password connections are enabled on the tenant (no per-app change needed if already enabled)
- [ ] 1.5 Capture the new app's `domain`, `client_id`, and `audience` (API identifier) for use in `app.config.ts`

## 2. Dependency installation (pinned to Expo SDK 54 / RN 0.81)

- [ ] 2.1 Install `react-native-auth0` (v3+) and its Expo config plugin
- [ ] 2.2 Install `expo-local-authentication` (do NOT install `expo-secure-store` — see TECHSPEC §2.8 / design D6)
- [ ] 2.3 Install `@tanstack/react-query` (v5+)
- [ ] 2.4 Install `@gorhom/bottom-sheet` (verify peer-dep compatibility with already-installed `react-native-reanimated@4` and `react-native-gesture-handler`)
- [ ] 2.5 Install `react-hook-form`, `zod`, and `@hookform/resolvers`
- [ ] 2.6 Install `nativewind@^4` and `tailwindcss` as dev-deps; add `tailwind.config.ts` and the NativeWind Babel/Metro config per its docs
- [ ] 2.7 Run `expo install --fix` to reconcile any version-mismatch warnings; record any forced downgrades in `design.md` Risks section

## 3. Configuration model

- [ ] 3.1 Create `app.config.ts` exporting an `ExpoConfig` derived from the existing `app.json` plus an `extra` object: `auth0Domain`, `auth0ClientId`, `auth0Audience`, `apiBaseUrl`
- [ ] 3.2 Add the `react-native-auth0` Expo config plugin to `app.config.ts` `plugins` so the Android manifest gets the `streetrack://callback` and SDK-generated intent-filters automatically
- [ ] 3.3 Delete `app.json` (replaced by `app.config.ts`)
- [ ] 3.4 Create `src/config.ts` that reads `Constants.expoConfig?.extra`, parses with a `zod` schema, and exports a frozen object; throw at module load if any required value is missing
- [ ] 3.5 Add a `.env.example` documenting `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`, `API_BASE_URL` (do NOT commit a real `.env`)

## 4. Service layer scaffolding

- [ ] 4.1 Create `src/services/http.ts` exporting `authFetch(input, init)` per design D7 (gets credentials → adds bearer + accept headers → throws typed `ApiError` on non-2xx)
- [ ] 4.2 Create `src/services/errors.ts` exporting the `ApiError` class with `status`, `body`, and `message` fields
- [ ] 4.3 For each existing resource folder (`transactions`, `subcategories`, `hangouts`, `dashboard`), add an empty `api.ts` and `queries.ts` so the structure is in place even before features land — each file should export nothing yet but include a top-of-file comment naming the spec section it serves

## 5. Root layout wiring

- [ ] 5.1 Create `src/features/auth/AuthProvider.tsx` that re-exports `Auth0Provider` configured from `src/config.ts`
- [ ] 5.2 Create `src/features/auth/BiometricGate.tsx` per design D8 (hardware + enrolled checks → `authenticateAsync` → render children on success / retry on failure / pass-through if no enrolment)
- [ ] 5.3 Create the root `<ErrorBoundary>` component with a screen-sized fallback ("Something went wrong / Try again") in `src/components/ErrorBoundary.tsx`
- [ ] 5.4 Update `app/_layout.tsx` to mount the providers in this order: `<ErrorBoundary>` → `<AuthProvider>` → `<BiometricGate>` → `<QueryClientProvider client={queryClient}>` → `<Slot />` (or the existing tabs layout)
- [ ] 5.5 Create `src/services/queryClient.ts` exporting a singleton `QueryClient` with sensible defaults (`staleTime: 30s`, `retry: 1`)

## 6. Build & release pipeline

- [ ] 6.1 Add `eas.json` defining `development` (APK + dev client), `preview` (APK), and `production` (AAB, `autoIncrement: true`) profiles
- [ ] 6.2 Run `eas build:configure` once to provision EAS-managed Android signing credentials
- [ ] 6.3 Smoke-test by running `eas build --profile development --platform android --local` (or non-local if user prefers cloud); install the APK on the user's Android 16 device and confirm the splash screen renders
- [ ] 6.4 Document the Play Internal Testing upload command (`eas submit --profile production --platform android`) in the repo `README.md`

## 7. Verification

- [ ] 7.1 Run `openspec validate initial-techspec` and resolve any schema errors
- [ ] 7.2 Manually verify on the user's device: cold-start → biometric prompt (if enrolled) → splash → empty tabs shell renders → tapping a tab does not crash
- [ ] 7.3 Confirm `package.json` does NOT list any third-party crash reporter (Sentry, Bugsnag, Crashlytics) per the spec's "Error handling without third-party reporters" requirement
- [ ] 7.4 Confirm `package.json` does NOT list `@react-native-async-storage/async-storage` for token use; if present for any other reason, comment justifying the non-token use
- [ ] 7.5 Update `README.md` with: prereqs (Node, EAS CLI, Android device with USB debugging), env-var list (mirrors `.env.example`), `npm run android` and `eas build` commands, and the "RN flex is not web flex" footnote called out in design.md trade-offs

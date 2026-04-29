## Context

The web app (`orchestrated-streetrack-fe`) is a personal-finance SPA: Categories → Subcategories → Transactions → Hangouts, plus a Dashboard. It's stable and ergonomic on desktop but tied to a desk. The user wants a React Native companion that lives in their pocket and is built for **capture**, not for managing the taxonomy.

Current state to inherit:
- **Backend**: `streetrack-be` (FastAPI). Mobile reuses it as-is — no new endpoints required for Tier 1.
- **Auth**: Auth0 SPA application. Mobile needs a separate Auth0 *Native* application.
- **Data shapes**: `PaginatedRead<T>` envelope, `CategoryRead`, `SubcategoryRead`, `TransactionRead`, `HangoutRead`, `DashboardBalanceRead`, `DashboardMonthBalanceRead`, `DashboardDuePeriodicExpenseRead`. These are the contract; mobile must mirror them.
- **Picker UX on web**: Combobox (cmdk + Radix Popover). Doesn't translate cleanly to mobile — needs replacement.

Stakeholder: solo user. No external API consumers. Backend is single-tenant per Auth0 user.

## Goals / Non-Goals

**Goals:**
- Define the **module tier list** (Tier 1 must / Tier 2 should / Tier 3 won't) so the new project's TECHSPEC starts with locked scope.
- Lock down **cross-cutting decisions** that the mobile project cannot defer: auth flow, type sharing, picker pattern, offline posture.
- Make the boundary between "mobile capture" and "desktop admin" explicit so the next time the user is tempted to add a feature to mobile they have a written rule to check it against.

**Non-Goals:**
- Writing the mobile TECHSPEC itself. That happens in the new repo.
- Picking a UI library, navigation library, or state management library. Those are TECHSPEC concerns once scope is fixed.
- Modifying the web app, the backend, or any specs in this repo.
- Building a 1:1 feature port. The whole point is reduced surface area.

## Decisions

### D1. Module tier list
**Tier 1 — Must ship (the reason mobile exists):**
- **Auth** — sign in, sign out, token refresh against the same Auth0 tenant. Supports both Google social login (primary user) and username/password (test accounts).
- **Quick transaction creation** — single transaction form (subcategory, value, date defaulted to today, optional description, optional hangout).
- **Recent transactions list** — paginated, sorted newest-first; tap to view detail. Filters limited to date range; no advanced multi-filter UI.
- **Subcategory + Hangout pickers** — same data, native UX (bottom sheet / search list, not Combobox).
- **Dashboard summary (read-only)** — cumulative balance, current month balance, AND due periodic expenses with their paid/unpaid status. All three sections are read-only views; paid status is pre-calculated server-side from transaction recognition (no client action required, no second query).

**Tier 2 — Should ship (high value, deferrable past v1.0):**
- **Edit / delete transaction** — fix mistakes captured via Tier 1. v1.0 trade-off: a wrong entry stays wrong until the user opens desktop. Accepted because v1.0 prioritises shipping the capture loop quickly; mistake correction is incremental.
- **Hangouts CRUD** — created on the go ("dinner Saturday"), simple form (name, date, optional description). Justified because hangouts often originate during/after the event.

**Tier 3 — Explicitly out of mobile scope (stay desktop-only):**
- Categories CRUD — a setup task. Touched once a quarter. Not worth screen real estate.
- Subcategories CRUD — same reasoning.
- Bulk transactions dialog — desktop-only flow with `useFieldArray` rows; small screens make it painful.
- Import (paste from spreadsheet) — clipboard-from-spreadsheet workflow is desktop-native.
- CSV export — file-management task; not useful from a phone.
- Year/month/day three-select transaction filter — too dense for mobile; replace with a single date-range picker if needed in Tier 1.

**Alternative considered**: ship a "lite admin" mode that includes Categories/Subcategories CRUD. Rejected — every minute spent on mobile admin is a minute not spent on capture polish, and the user already has a working desktop admin path.

### D2. Backend reuse vs. mobile-specific endpoints
**Reuse the existing API.** Tier 1 + Tier 2 fit entirely within current endpoints — `GET/POST /transactions`, `GET /subcategories`, `GET /hangouts`, `GET /dashboard/*`, `PATCH /dashboard/due-periodic-expenses/:id` (or whatever the paid-flag endpoint is — verify in TECHSPEC).

**Alternative considered**: a `/mobile/v1` namespace optimised for smaller payloads. Rejected as premature — current payloads are already small, and divergence between mobile and web APIs is a maintenance tax. Revisit only if a real performance signal shows up.

### D3. Type sharing between web and mobile
**Recommend: copy types into the mobile repo as a starting point; promote to a shared package only if drift becomes a real problem.**

Three options were considered:
- **Shared npm package** (`@streetrack/types`): cleanest long-term, highest setup cost (publishing, versioning, bumping in two repos for every change).
- **Git submodule of a `types/` directory**: avoids npm publishing but adds submodule friction and tooling sharp edges.
- **Copy + manual sync**: zero infrastructure, depends on discipline.

For a solo project with one backend and a stable schema, copy is fine. The schema barely changes. The TECHSPEC should pick this up explicitly so it's a deliberate choice, not an accident.

### D4. Auth flow on native
**Recommend: Auth0's official `react-native-auth0` SDK with PKCE + universal login (system browser).** Distinct Auth0 application of type "Native" alongside the existing SPA. Tokens stored in OS secure storage (Keychain / Keystore via `react-native-keychain` or `expo-secure-store`).

The same flow handles **both** the primary user's **Google social login** and the test users' **username/password login** transparently — Auth0's universal login renders whichever connection the tenant offers. No native Google SDK integration is required; Google sign-in is mediated through Auth0 over the system browser.

**Alternative considered**: integrating Google's native Sign-In SDK directly (bypassing Auth0 universal login for a native UX). Rejected — adds a second auth path, complicates token validation, and provides marginal UX benefit over a system-browser flow that already supports both Google and username/password connections.

**Alternative considered**: embedding a WebView and reusing the SPA flow. Rejected — Auth0 explicitly discourages this for native apps, and OAuth via system browser is the spec.

### D5. Picker UX
**Replace Combobox with native bottom-sheet + search.** The Subcategory and Hangout pickers on web use Combobox (cmdk + Radix Popover) which doesn't have a clean RN port. The mobile pattern is a full-width bottom sheet with a search input at top and a scrollable list — same data shape, native feel, no compromise.

The TECHSPEC will pick the specific component (likely `@gorhom/bottom-sheet` + a custom list).

### D6. Offline posture
**Recommend: online-first, with an explicit "queue on submit failure" deferred to v2.** Tier 1 means "capture an expense in 2 seconds while standing in line." If the user has no signal, the form should remember the input and let them retry — but a full offline sync engine is out of scope for v1.

The TECHSPEC should call out the v1 behavior (online-required, retry-on-failure) so this isn't ambiguous.

### D7. UI framework / styling
**Defer to TECHSPEC.** Out of scope here. The relevant decision is *not* to mirror web's shadcn/ui + Tailwind v4 stack — that's web-only. Native equivalents (NativeWind, Tamagui, React Native Paper, Restyle) all have trade-offs the TECHSPEC will weigh.

## Risks / Trade-offs

- **Risk**: Scope creep into mobile admin features ("just one more module"). → Mitigation: the Tier 3 list is the rule. Adding anything from Tier 3 requires a new opspec change with a documented justification.
- **Risk**: Type drift between web and mobile if D3 lands on "copy types." → Mitigation: schedule a quarterly diff between web's `services/*/types.ts` and the mobile copy; promote to shared package the first time drift causes a real bug.
- **Risk**: Auth0 mobile flow is meaningfully different from web (PKCE, secure storage, deep linking) and will eat more time than expected. → Mitigation: TECHSPEC sequences Auth as the **first** implementation milestone, not bundled with a feature.
- **Risk**: Building a "second-class web port" instead of a focused capture tool. → Mitigation: the proposal's "explicitly out of scope" Tier 3 is the contract. The TECHSPEC inherits it verbatim.
- **Trade-off**: Reduced features on mobile means some workflows still require the desktop. Accepted — that's the point. Mobile is for capture, desktop is for management.

## Migration Plan

Not applicable. No existing system is being migrated. The mobile project is a greenfield consumer of the existing backend.

When the mobile app ships and reaches feature-stable, optionally:
- Audit web app for any feature that has become "mobile-first" (e.g., mark-as-paid) and consider whether the web UX needs adjustment.
- Re-evaluate D3 (type sharing) based on real-world drift count.

## Resolved Questions

- **OQ1 (RESOLVED)**: Paid status for periodic expenses is calculated server-side at transaction recognition time. There is no separate "mark as paid" endpoint and no client action; the dashboard simply displays the pre-computed status. Implication: due-periodic-expenses is a **read-only** view, folded into the Tier 1 Dashboard summary; the originally-Tier-2 "mark as paid" interaction is deleted entirely.
- **OQ2 (RESOLVED)**: `TransactionRead` includes denormalised `subcategory_name` and `hangout_name` (the only two fields mobile renders). `category_name` is **not** required and **not** displayed on mobile. Mobile transaction lists render without N+1 round-trips.
- **OQ3 (RESOLVED)**: v1.0 = Tier 1 only. Tier 2 (Edit / delete transaction + Hangouts CRUD) follows in v1.1+. This is now reflected in the spec's Requirement: Tier 1 module list scenarios.
- **OQ4 (RESOLVED)**: Target platform is **Android only**. iOS is out of scope for v1.0 (no current need; the user's device runs Android 16). Removes ~40% of cross-platform overhead (no iOS provisioning, no App Store review, no Apple developer account required).
- **OQ5 (RESOLVED)**: Distribution = **Google Play Internal Testing only** (personal use). No public Play Store listing. (User initially mentioned TestFlight, which is iOS-only and dropped per OQ4.)
- **OQ6 (RESOLVED)**: Minimum Android version = **API 34 (Android 14)**, balancing user's primary device (Android 16) against Expo / Android Studio compatibility. Bumps required ABI/AGP versions but rules out almost no useful libraries.
- **OQ7 (RESOLVED)**: **Biometric app lock = yes** (fingerprint). Use `expo-local-authentication` (or `react-native-biometrics`) to gate app launch when biometrics are enrolled on the device.
- **OQ8 (RESOLVED)**: **No push notifications** in v1.0.
- **OQ9 (RESOLVED)**: **No crash reporting** in v1.0 (personal use). Logs to device console only.
- **OQ10 (RESOLVED)**: App branding = name "**Streetrack mobile**", icon and splash are placeholders/anything for v1.0 — defer real design assets until post-v1.0.
- **OQ11 (RESOLVED)**: Currency / locale formatting matches web — `Intl.NumberFormat` / `Date.prototype.toLocaleString` with system locale. Same `Intl` API works on RN's Hermes engine.

- **OQ12 (RESOLVED)**: Bundle identifier (Android Application ID) = **`com.streetrack.mobile`**. Locked — cannot be changed after first Play upload without a fresh listing.
- **OQ13 (RESOLVED)**: Deep-link scheme = **custom scheme `streetrack://callback`** plus the Auth0-SDK-generated URL based on `com.streetrack.mobile` (e.g., `com.streetrack.mobile.auth0://com.streetrack.mobile/android/com.streetrack.mobile/callback`). App Links deferred until a domain exists.

## Open Questions

(None remaining — all OQ1–OQ13 resolved. The TECHSPEC can now be drafted in the new mobile repo.)

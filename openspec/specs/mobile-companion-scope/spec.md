# mobile-companion-scope Specification

## Purpose
TBD - created by archiving change mobile-companion-scope. Update Purpose after archive.
## Requirements
### Requirement: Tier 1 module list (must ship in mobile v1.0)

The mobile companion SHALL include exactly the following Tier 1 modules in its v1.0 release: Auth, Quick transaction creation, Recent transactions list, Subcategory picker, Hangout picker, and a read-only Dashboard summary covering cumulative balance, current month balance, and due periodic expenses with their server-calculated paid/unpaid status.

#### Scenario: Auth module is in Tier 1
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST include sign-in, sign-out, and silent token refresh against the same Auth0 tenant as the web app, supporting both Google social login and username/password connections through Auth0 universal login

#### Scenario: Quick transaction creation is in Tier 1
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST include a single-transaction creation form with fields: subcategory (required), value (required), date (defaulted to today), description (optional), hangout (optional)

#### Scenario: Recent transactions list is in Tier 1
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST include a paginated list of the user's transactions sorted newest-first, with at minimum a date-range filter; advanced multi-filter UIs are NOT required

#### Scenario: Pickers are in Tier 1
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST include subcategory and hangout pickers used by the transaction form, rendering data via the existing `streetrack-be` list endpoints

#### Scenario: Dashboard summary is read-only in Tier 1
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST include a Dashboard screen showing cumulative balance, current-month balance, AND due periodic expenses with paid/unpaid badges
- **AND** the screen MUST be entirely read-only — there SHALL NOT be a "mark as paid" client action, because the backend pre-computes paid status from recognised transactions

#### Scenario: Edit and delete transaction are NOT in Tier 1
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** v1.0 MUST NOT include edit or delete actions for transactions; mistake correction is deferred to Tier 2 (v1.1+) with the trade-off that wrong entries persist until the user opens the desktop

### Requirement: Transaction list does not display category

The mobile transaction list and detail views SHALL render `subcategory_name` and `hangout_name` (denormalised on `TransactionRead`) but SHALL NOT render `category_name`. The category field exists on the data shape but is not surfaced on mobile.

#### Scenario: Category column is omitted on mobile
- **WHEN** the mobile transaction list or detail screen is designed
- **THEN** it MUST NOT show a category column or field
- **AND** it MUST show the subcategory and (when present) hangout names

### Requirement: Tier 2 module list (deferrable past v1.0)

The mobile companion SHALL plan for the following Tier 2 modules but MAY release v1.0 without them: Edit / delete transaction, and Hangouts CRUD.

#### Scenario: Hangouts CRUD is in Tier 2
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** Hangouts CRUD MUST be listed as a Tier 2 module, justified by the on-the-go nature of hangout creation; it MUST NOT be moved to Tier 3 without a separate opspec change

#### Scenario: Edit and delete transaction are in Tier 2
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** edit and delete actions for transactions MUST be listed as Tier 2 features; the v1.0 trade-off (wrong entries persist until desktop fix) MUST be documented in the TECHSPEC

### Requirement: Tier 3 module list (explicitly out of mobile scope)

The mobile companion SHALL NOT implement the following Tier 3 modules in any release. Adding any of them to mobile scope SHALL require a new opspec change documenting the justification.

#### Scenario: Categories and Subcategories CRUD stay desktop-only
- **WHEN** any mobile feature is proposed
- **THEN** Categories CRUD and Subcategories CRUD MUST remain web-only; mobile uses the lists read-only via pickers

#### Scenario: Bulk and import flows stay desktop-only
- **WHEN** any mobile feature is proposed
- **THEN** the bulk-transactions dialog and the import-transactions paste flow MUST remain web-only

#### Scenario: CSV export stays desktop-only
- **WHEN** any mobile feature is proposed
- **THEN** CSV export MUST remain web-only

#### Scenario: Dense desktop filters are not ported as-is
- **WHEN** the mobile transactions list filter is designed
- **THEN** it MUST NOT replicate the web's three-select year/month/day filter; a single date-range picker is the mobile pattern

#### Scenario: Mark-as-paid client action is rejected
- **WHEN** any mobile feature is proposed
- **THEN** there SHALL NOT be a client-initiated "mark as paid" action for periodic expenses; paid status is server-derived and only displayed

### Requirement: Backend reuse without forking

The mobile companion SHALL consume the existing `streetrack-be` API. Tier 1 and Tier 2 SHALL fit within current endpoints. No mobile-specific API namespace SHALL be introduced unless a measured performance or payload-size problem justifies it.

#### Scenario: Tier 1 fits existing endpoints
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST verify each Tier 1 feature maps to existing `streetrack-be` endpoints; if a gap exists, it MUST be flagged and a backend change proposed in the backend repo

#### Scenario: No `/mobile` namespace by default
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST NOT define a parallel `/mobile/*` API surface unless a documented performance problem justifies it

### Requirement: Auth0 native application

The mobile companion SHALL authenticate via a separate Auth0 application of type Native, distinct from the existing SPA application, using the OAuth 2.0 PKCE flow via the system browser. The configured connections SHALL match the SPA tenant's: Google social login (for the primary user) and username/password (for test accounts).

#### Scenario: Separate Auth0 application
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST require provisioning a new Auth0 application (type Native) with its own client_id, allowed callback URLs, and logout URLs

#### Scenario: PKCE via system browser
- **WHEN** the mobile auth flow is designed
- **THEN** it MUST use OAuth 2.0 PKCE via the system browser (e.g., `react-native-auth0`); embedded WebView auth flows MUST NOT be used

#### Scenario: Both Google and username/password connections work
- **WHEN** the mobile auth flow is implemented
- **THEN** the user MUST be able to sign in via Google (primary user) AND via username/password (test accounts) using the same universal-login flow
- **AND** there SHALL NOT be a separate native Google Sign-In SDK integration; Google auth is mediated through Auth0

#### Scenario: Secure token storage
- **WHEN** the mobile auth flow is designed
- **THEN** access and refresh tokens MUST be stored in OS-level secure storage (Keychain on iOS, Keystore on Android), not in AsyncStorage

### Requirement: Type sharing strategy

The mobile companion SHALL start by copying the relevant TypeScript type definitions from the web repo's `src/services/*/types.ts` into its own codebase. A shared package SHALL be introduced only if and when drift causes a documented production bug.

#### Scenario: Initial type duplication
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST specify which web type files are copied (Subcategory, Transaction, Hangout, Dashboard*, PaginatedRead) and acknowledge the manual-sync trade-off
- **AND** Category types MAY be omitted from the mobile copy since they are not displayed

#### Scenario: Promotion to shared package is gated
- **WHEN** drift between web and mobile types causes a bug
- **THEN** a follow-up opspec change MUST be opened to evaluate promoting types to a shared npm package

### Requirement: Picker UX adaptation

The mobile companion SHALL NOT port the web's Combobox (cmdk + Radix Popover) pattern. Subcategory and hangout pickers SHALL use a native bottom-sheet pattern with a search input and scrollable list.

#### Scenario: No Combobox port
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST NOT specify cmdk or Radix Popover for native pickers

#### Scenario: Bottom-sheet picker pattern
- **WHEN** the mobile transaction form is designed
- **THEN** subcategory and hangout selection MUST use a full-width bottom sheet with a search input at top and a scrollable list of options

### Requirement: Offline posture (v1)

The mobile companion v1.0 SHALL operate online-first. Network failures during a transaction submission SHALL preserve the user's input and offer a retry. A full offline sync engine SHALL be explicitly out of v1.0 scope.

#### Scenario: Online-first v1 behavior
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST state that v1.0 requires connectivity for reads and writes

#### Scenario: Retry on submit failure
- **WHEN** a transaction submission fails due to network error
- **THEN** the form input MUST be preserved and a retry action MUST be offered to the user

#### Scenario: No offline sync in v1
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST NOT include a queueing or offline-sync engine in the v1.0 scope; this is a deferred v2.0 candidate

### Requirement: Android-only target platform

The mobile companion SHALL target Android only. iOS SHALL NOT be included in the v1.0 scope. Adding iOS support SHALL require a new opspec change documenting the justification (current device, App Store listing intent, additional Auth0 callback URLs).

#### Scenario: No iOS in v1.0
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST target Android only; iOS-specific code paths, provisioning, and App Store assets SHALL NOT be in scope

#### Scenario: Minimum Android version
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST set the minimum Android version to API 34 (Android 14) or whatever Expo / Android Studio's current LTS-supported minimum allows, whichever is higher

#### Scenario: Distribution channel
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** distribution MUST be via Google Play Internal Testing only; no public Play Store listing is required for v1.0

### Requirement: Biometric app lock

The mobile companion SHALL gate app launch behind device-level biometric authentication (fingerprint) when biometrics are enrolled on the device. If no biometric is enrolled, the app SHALL fall back to opening directly (no PIN-only fallback in v1.0).

#### Scenario: Biometric prompt on launch
- **WHEN** the user opens the mobile app and biometrics are enrolled on the device
- **THEN** the app MUST prompt for fingerprint authentication before showing any user data

#### Scenario: No biometric enrolled
- **WHEN** the user opens the mobile app and no biometrics are enrolled
- **THEN** the app MUST open directly to the authenticated state (a PIN-only fallback is NOT required in v1.0)

### Requirement: No push notifications, no crash reporting (v1.0)

The mobile companion v1.0 SHALL NOT include push notifications or third-party crash/error reporting services. Both are deferred candidates for later versions only if a concrete need emerges.

#### Scenario: No push notifications in v1
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it SHALL NOT include FCM, APNS, or any push-notification flow

#### Scenario: No crash reporting in v1
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it SHALL NOT integrate Sentry, Bugsnag, Crashlytics, or any third-party crash reporter; logging is to device console only

### Requirement: Locale-aware formatting matches web

The mobile companion SHALL format currency and dates using the same `Intl` API (`Intl.NumberFormat`, `Date.prototype.toLocaleString`) that the web app uses, with the device's system locale.

#### Scenario: Currency formatting matches web behavior
- **WHEN** a transaction value is rendered on mobile
- **THEN** it MUST use `(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })` (the same call shape as web's `formatBalance`/`formatValue`), producing locale-appropriate thousands separators

#### Scenario: Date formatting matches web behavior
- **WHEN** a transaction date is rendered on mobile
- **THEN** it MUST use `Date.prototype.toLocaleString` with the system locale, matching the web's `formatDate` utility

### Requirement: Locked Android identity values

The mobile companion SHALL use the following identity values; they are locked at this scope phase because each feeds Auth0 callback URL configuration and (for the bundle identifier) is irreversible after first Play Store upload.

- Bundle identifier (Android Application ID): `com.streetrack.mobile`
- Custom deep-link scheme: `streetrack`
- Auth0 callback URL (custom scheme): `streetrack://callback`
- Auth0 callback URL (SDK-generated): derived from the bundle identifier per `react-native-auth0` conventions, e.g. `com.streetrack.mobile.auth0://com.streetrack.mobile/android/com.streetrack.mobile/callback`

#### Scenario: Bundle identifier is locked
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** the Android `applicationId` MUST be `com.streetrack.mobile`
- **AND** the value MUST NOT be changed without a new opspec change documenting why a fresh Play listing is acceptable

#### Scenario: Deep-link scheme is locked
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** the custom URL scheme registered in `AndroidManifest.xml` MUST include `streetrack`
- **AND** Auth0 callback URLs MUST include both `streetrack://callback` and the SDK-generated URL based on the bundle identifier

#### Scenario: App Links upgrade is gated
- **WHEN** App Links (`https://<domain>/callback`) are considered as a future replacement
- **THEN** they MUST be added as a parallel Auth0 callback URL without removing the custom scheme, so existing installs continue to function

### Requirement: TECHSPEC consumes this scope verbatim

The new mobile project's TECHSPEC SHALL explicitly reference this scope spec and MUST NOT silently expand or contract the tier lists.

#### Scenario: TECHSPEC cites this spec
- **WHEN** the mobile project's TECHSPEC is written
- **THEN** it MUST cite `mobile-companion-scope` as its source-of-truth for module scope

#### Scenario: Scope changes require a new opspec change
- **WHEN** any module would move between tiers (e.g., Tier 3 → Tier 1, or Tier 1 → out)
- **THEN** a new opspec change in the mobile repo (or this repo) MUST document the justification before the TECHSPEC is updated


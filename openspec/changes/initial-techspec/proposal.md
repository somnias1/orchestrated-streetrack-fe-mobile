## Why

`mobile-companion-scope` locked the WHAT (Tier 1/2/3 modules, Auth0 native, Android-only, locked identity values). Implementation cannot start until the HOW is also locked: which RN libraries, how files are organised, how data flows from `streetrack-be` to the screen, how auth tokens travel, and how the app is built and shipped. Without a written TECHSPEC, every Tier 1 feature change risks re-litigating these foundational decisions and producing inconsistent code across modules.

This change writes the TECHSPEC that the bootstrap commit hinted at — converting the seeded Expo scaffold and copied service types into a contract: "this is the stack, this is the structure, this is how a feature is built."

## What Changes

- Add a `mobile-techspec` capability that locks: UI/styling library, navigation library, server-state library, form library, picker/bottom-sheet library, Auth0 SDK choice, secure-storage choice, biometric library, and error/logging posture.
- Lock the project's file/folder layout (`app/`, `src/services/`, `src/features/`, `src/components/`, `src/hooks/`) and the rule for where new code goes.
- Lock the data-fetching and mutation pattern (single client + per-resource service modules + typed query/mutation hooks) consumed by every Tier 1 module.
- Lock the auth integration shape: `react-native-auth0` provider at the root, `react-native-auth0`'s Keystore-backed `CredentialsManager` for refresh tokens (no separate secure-storage library in v1.0), single `authFetch` wrapper that injects bearer tokens and handles silent refresh.
- Lock environment/config handling: `app.config.ts` + typed `expo-constants` reader for Auth0 domain, client_id, audience, and API base URL — no `.env` reads at runtime.
- Lock the build pipeline: EAS Build profiles (`development`, `preview`, `production`) and Google Play Internal Testing as the only release channel.
- Cite `mobile-companion-scope` as the source-of-truth for module scope and explicitly defer all Tier 2 / Tier 3 implementation choices to later changes.

## Capabilities

### New Capabilities
- `mobile-techspec`: foundational technical contract for the mobile app — library choices, project structure, data-fetching pattern, auth integration shape, configuration model, and build/release pipeline. Every Tier 1 feature change consumes this capability.

### Modified Capabilities
<!-- None. `mobile-companion-scope` is referenced but not modified — the TECHSPEC must consume the scope verbatim per its own requirement "TECHSPEC consumes this scope verbatim". -->

## Impact

- **Code**: introduces the canonical layout under `src/features/` and `src/services/<resource>/` (pattern only — feature implementations land in subsequent changes). Adds a root `<AuthProvider>` + query-client wrapper to `app/_layout.tsx` once libraries are installed.
- **Dependencies (to be added by follow-up implementation changes, not this one)**: `react-native-auth0`, `expo-local-authentication`, `@tanstack/react-query`, `@gorhom/bottom-sheet`, `react-hook-form` + `zod`, plus a chosen styling library (decided in design.md). `expo-secure-store` is intentionally NOT installed — `react-native-auth0`'s `CredentialsManager` covers token persistence.
- **Config**: `app.json` migrates to `app.config.ts` to allow typed `extra` for Auth0 domain / client_id / audience / API base URL. Bundle identifier and deep-link scheme already locked by scope (`com.streetrack.mobile`, `streetrack://callback`).
- **Auth0 tenant**: requires a new Native application provisioned alongside the existing SPA — out-of-band setup, captured as a TECHSPEC prerequisite, not code.
- **CI / release**: EAS project configuration (`eas.json`) is added; Google Play Internal Testing track is the only configured destination.
- **Tier 2 / Tier 3**: explicitly out of scope for this TECHSPEC. Edit/delete transaction, Hangouts CRUD, and any Tier 3 module require their own opspec changes per the scope spec.

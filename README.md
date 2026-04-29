# Streetrack Mobile

React Native companion app for [streetrack-fe](../orchestrated-streetrack-fe). Built for capture, not management. Android-only (v1.0).

See `.planning/techspec.md` for the full technical specification and `.planning/scope-design.md` for the module scope rationale.

## Prerequisites

- **Node.js** 20+
- **EAS CLI** — `npm install -g eas-cli`
- **Android device** with USB debugging enabled (Android 14 / API 34 minimum; tested on Android 16)
- **ADB** in PATH (`adb devices` should list your device)

## Setup

```bash
npm install
cp .env.example .env   # then fill in the four values — see below
```

### Environment variables (`.env`)

| Variable | Description |
|---|---|
| `AUTH0_DOMAIN` | Auth0 tenant domain (`<tenant>.auth0.com`) |
| `AUTH0_CLIENT_ID` | Client ID of the **Native** Auth0 application |
| `AUTH0_AUDIENCE` | API identifier (same audience as the web app) |
| `API_BASE_URL` | Base URL of `streetrack-be` (no trailing slash) |

These are read at **build time** via `app.config.ts` → `src/config.ts`. A missing or malformed value throws at app boot, not at runtime. See TECHSPEC §6.

## Running locally

```bash
# Start Metro (requires a development build installed on the device)
npm run android

# Or start with tunnel if the device is not on the same network
npx expo start --tunnel
```

## Builds (EAS)

```bash
# Development APK — install on device for local testing
eas build --profile development --platform android

# Preview APK — production config, ad-hoc install
eas build --profile preview --platform android

# Production AAB — signed, ready for Play Internal Testing
eas build --profile production --platform android

# Upload production build to Play Internal Testing
eas submit --profile production --platform android
```

`versionCode` auto-increments on production builds. `version` is read from `package.json`.

## RN flex ≠ web flex

React Native's flexbox differs from the web: `flexDirection` defaults to `column` (not `row`), and `display: block` does not exist. When translating a web layout, start from `flex-col` and work down. This is the most common source of layout surprises — expected, not a bug.

## Project structure

```
app/            expo-router routes (thin — assemble features, no UI logic)
src/
  config.ts     typed runtime config (zod-validated at boot)
  services/     API layer: http.ts, errors.ts, queryClient.ts, <resource>/{api,queries}.ts
  features/     composite UI: auth/, transactions/, pickers/, dashboard/
  components/   reusable presentational primitives
  hooks/        cross-feature hooks
  utils/        format.ts (formatValue, formatDate)
```

## Scope

v1.0 is Tier 1 only: Auth, Quick transaction, Recent transactions list, Pickers, Dashboard (read-only). Edit/delete and Hangouts CRUD are Tier 2 (v1.1+). Everything else is explicitly out of scope — see `.planning/scope-design.md`.

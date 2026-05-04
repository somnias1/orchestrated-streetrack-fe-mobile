# Maestro E2E Test Suite

## Prerequisites

### Install Maestro CLI

Follow the official instructions: https://maestro.mobile.dev/getting-started/installing-maestro

### Android emulator

The E2E suite targets Android only. Start the emulator and install the dev build before running flows:

```bash
npm run android
```

### E2E credentials

Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` in your `.env` file (see `.env.example`). These are used by `shared/sign-in.yaml` to drive the real Auth0 universal-login screen.

### E2E Fixture account prerequisite (REQUIRED — set up once)

The test account referenced by `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` **MUST** have the following pre-seeded data or the E2E suite will fail:

| Type | Name | Parent | Configuration |
|------|------|--------|---------------|
| Category | `E2E Fixture` | — | — |
| Subcategory | `E2E Fixture` | Category `E2E Fixture` | Periodic expense, pay day **30** |

- The names are **case-sensitive** — exactly `E2E Fixture` (capital E, capital F).
- Because subcategory / category CRUD is not exposed in the mobile app, these must be created via the backend admin API or the web app before running the suite.
- The `[E2E-` cleanup sweep matches only that prefix. The fixture name `E2E Fixture` does **not** start with `[E2E-`, so the cleanup sweep will never delete it. The fixture is a stable contract — it persists across all runs.

The `E2E Fixture` subcategory being a periodic expense with pay day 30 means the Dashboard's "due periodic expenses" card will show:
- `Paid` badge when at least one current-month transaction tagged with `E2E Fixture` exists.
- `Unpaid` badge when no such transaction exists.

Flow `05-periodic-expense-badge.yaml` exercises this state machine.

## Running the suite

```bash
npm run e2e
```

This injects a unix-timestamp `RUN_ID` into every flow so that created entities are uniquely prefixed `[E2E-<timestamp>]`. The cleanup sub-flow at the end of each flow deletes every entity whose name contains `[E2E-`.

## Flows

| File | What it tests |
|------|--------------|
| `flows/01-auth.yaml` | Sign-in via Auth0 universal login → Dashboard visible |
| `flows/02-transactions-crud.yaml` | Create → list-verify → edit → list-verify → delete → list-absent |
| `flows/03-hangouts-crud.yaml` | Create → list-verify → edit → list-verify → delete → list-absent |
| `flows/04-cross-cache.yaml` | Rename hangout → transaction list shows new name; delete hangout → name cleared |
| `flows/05-periodic-expense-badge.yaml` | Create fixture-tagged transaction → Paid badge; delete → Unpaid badge |

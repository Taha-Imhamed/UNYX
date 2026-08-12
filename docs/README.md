# UNYT System — Documentation Index

University admin + student portal for University of New York Tirana. Monorepo: Next.js frontend + Express/TS backend + Postgres (Supabase-hosted).

Last reconciled against live DB + code: **2026-08-11**.

## Start here

| Doc | What it covers | Ground truth as of |
|---|---|---|
| [OVERVIEW.md](./OVERVIEW.md) | What the system is, who it's for, goals/KPIs | 2026-08-11 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, request flow, auth, route architecture | 2026-08-11 (verified vs source) |
| [SCHEMA.md](./SCHEMA.md) | Full DB schema, generated from live introspection, dead-table audit | 2026-08-11 (159 tables) |
| [FEATURES.md](./FEATURES.md) | Feature inventory, one line per feature, grouped by role | 2026-08-11 |
| [TASKS.md](./TASKS.md) | Component-by-component build status tracker | 2026-08-11 |
| [SEED_DATA.md](./SEED_DATA.md) | Demo accounts, login creds, seed script inventory | 2026-08-11 |
| [SQL_FILES.md](./SQL_FILES.md) | Every `.sql` file in the repo — tracked migrations, archived migrations, ad-hoc root scripts, DB dumps | 2026-08-12 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Docker + VPS deploy guide | — |

## How these docs relate

- **SCHEMA.md is the DB source of truth.** If ARCHITECTURE.md or TASKS.md disagree with it on table counts/names, SCHEMA.md wins — it's generated from `information_schema`, not hand-maintained.
- **ARCHITECTURE.md is the source of truth for request flow, auth, and routing** — verified against source code, not just DB introspection.
- **SEED_DATA.md is the source of truth for login credentials.** Any creds written elsewhere may be stale.
- Dates matter. Each doc is only as fresh as its last-verified date. If it's been a while, re-check against live DB/code before trusting specifics.

## Archive

`docs/_archive/` holds superseded working notes kept for history — not maintained, not guaranteed accurate. See [_archive/README.md](./_archive/README.md) for what's there and why it was retired.

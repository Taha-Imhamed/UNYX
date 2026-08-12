# Archive — superseded / scratch docs

Not maintained. Kept for history only. Do not treat anything here as current — check the live doc in [`docs/`](../) instead.

| File | Why archived |
|---|---|
| `ARCHITECTURE.md.old`, `SCHEMA.md.old`, `TASKS.md.old`, `Project Overview.md.old`, `doc.md.old`, `functions.md.old` | Content moved into `docs/` verbatim (or near-verbatim) as the new canonical version. Kept here only as a pre-move snapshot. |
| `users.md` | Raw seed SQL + an early demo-account table. The SQL is now described (not duplicated) in [`SEED_DATA.md`](../SEED_DATA.md); the account table had drifted from what's actually live — superseded by `test.md`'s verified table, which is now in `SEED_DATA.md`. |
| `test.md` | The verified-live login credential table as of 2026-08-11. Merged into [`SEED_DATA.md`](../SEED_DATA.md), which is now the source of truth for creds. |
| `missing.md` | Tracked missing DB collections + seed gaps. Current content folded into [`SEED_DATA.md`](../SEED_DATA.md). |
| `cover.md` | Short role/feature summary, fully subsumed by [`FEATURES.md`](../FEATURES.md) (more detailed) and [`OVERVIEW.md`](../OVERVIEW.md) (target users). |
| `tahasql.md` | Original hand-written bootstrap schema SQL. Superseded by the tracked migration system (`backend/migrations/0001`–`0015`) and the generated [`SCHEMA.md`](../SCHEMA.md) (live introspection, 159 tables). Kept for historical reference only — do not run against a DB that already has migrations applied. |
| `last-thing-was-working-on.md` | Raw scratch notes / session brain-dump (login creds fragments, a to-do fragment). No structured content worth extracting beyond what's already elsewhere. |
| `AI_IMAGE_PROMPTS.md` | Prompts for generating illustrative architecture diagrams via image-gen AI. Not documentation of the system itself — kept in case the diagrams are regenerated later. |

If you need to resurrect something from here, verify it against current code/DB first — everything in this folder may be stale.

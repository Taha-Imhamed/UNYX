# Superseded (archived 2026-08-11)

These 5 files, now in `_archived/`, predate the tracked migration system
(`backend/migrations/` + `npm run migrate`, see `backend/migrations/README.md`) and were
never applied to the live database despite `ARCHITECTURE.md`/`TASKS.md` previously
claiming otherwise. Reconciliation is complete — verified 2026-08-11:

- `2026-05-02_enrollment_acl.sql`, `_campus.sql`, `_campus_backfill.sql`,
  `_campus_combined.sql` — folded into `backend/migrations/0007_add_enrollment_campus_and_acl.sql`,
  applied to the live DB on 2026-08-10. `_campus.sql` was a strict subset of
  `_campus_combined.sql` and was dropped rather than folded in (redundant).
- `2026-08-03_module_toggles.sql` — byte-identical `CREATE TABLE` to
  `backend/migrations/0009_register_module_toggles.sql`, confirmed by direct diff.
  `backend/src/routes/terminal.ts` additionally bootstraps further columns
  (`moduleStates`/`featureStates` derivation) at runtime on top of this base table.

No live gap: `backend/migrations/` fully covers everything these files defined. Kept in
`_archived/` for historical reference only — do not apply these directly, use
`backend/migrations/` going forward.

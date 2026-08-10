# Superseded

These 5 files predate the tracked migration system (`backend/migrations/` + `npm run migrate`,
see `backend/migrations/README.md`) and were never applied to the live database despite
`ARCHITECTURE.md`/`TASKS.md` previously claiming otherwise.

Their content has been folded into `backend/migrations/0007_add_enrollment_campus_and_acl.sql`
and applied to the live DB on 2026-08-10. `2026-05-02_enrollment_campus.sql` was a subset of
`2026-05-02_enrollment_campus_combined.sql` and was dropped rather than folded in (redundant).

Kept here for historical reference only. Do not apply these directly -- use
`backend/migrations/` going forward.

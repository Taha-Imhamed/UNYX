# UNYT System — SQL File Inventory

Every `.sql` file in the repo, what it does, and whether it's tracked or ad-hoc. Last checked: 2026-08-12.

## Tracked migrations (authoritative, ordered)

`backend/migrations/` — the real migration system. Applied via `backend/src/db/migrate.ts`, tracked in a `schema_migrations` table, forward-only. This is what actually built the live schema. See [SCHEMA.md](./SCHEMA.md) for the resulting table set.

| # | File | What it does |
|---|---|---|
| 0001 | `add_soft_delete_columns.sql` | Adds soft-delete columns (for course removal / 48h recovery window). |
| 0002 | `add_hr_and_library_tables.sql` | Adds HR + library subsystem tables. |
| 0003 | `add_campus_life_tables.sql` | Adds campus life / student affairs tables. |
| 0004 | `add_advising_appointments.sql` | Adds advising appointment tables. |
| 0005 | `add_user_mfa_columns.sql` | Adds MFA columns to `users`. |
| 0006 | `add_course_reviews.sql` | Adds course review tables. |
| 0007 | `add_enrollment_campus_and_acl.sql` | Adds campus + ACL columns to enrollments. Supersedes the archived 2026-05-02 enrollment ACL/campus scripts below. |
| 0008 | `add_enrollment_undocumented_columns.sql` | Backfills enrollment columns that existed live but weren't in a tracked migration. |
| 0009 | `register_module_toggles.sql` | Adds module on/off toggle system. Supersedes the archived 2026-08-03 module-toggles script below. |
| 0010 | `add_advising_messages.sql` | Adds `advising_messages` table. |
| 0011 | `add_semesters.sql` | Adds `semesters` table + `semester_id` FK on `courses`/`enrollments`/`finance_invoices`. |
| 0012 | `backfill_semesters.sql` | Backfills `semester_id` on existing rows. |
| 0013 | `fix_semester_matching.sql` | Fixes semester-matching logic issues found after 0012. |
| 0014 | `drop_dead_scaffold_tables.sql` | Drops confirmed-dead scaffold tables (see [SCHEMA.md](./SCHEMA.md) dead-table audit). |
| 0015 | `add_not_null_core_tables.sql` | Adds `NOT NULL` constraints to core tables once data was clean enough to enforce them. |

**To apply on a new environment:** run the migration runner (`backend/src/db/migrate.ts`), not these files directly — it tracks what's applied and runs them in order.

## Archived migrations (superseded, do not run)

`migrations/_archived/` — an earlier, untracked migration folder from 2026-05-02/08-03. Byte-verified 2026-08-11 against the tracked system: fully superseded by `backend/migrations/0007` and `0009` above. Kept for history only.

- `2026-05-02_enrollment_acl.sql`, `2026-05-02_enrollment_campus.sql`, `2026-05-02_enrollment_campus_backfill.sql`, `2026-05-02_enrollment_campus_combined.sql` → superseded by `0007_add_enrollment_campus_and_acl.sql`
- `2026-08-03_module_toggles.sql` → superseded by `0009_register_module_toggles.sql`

## Root-level ad-hoc SQL (not in migration system)

These live at `unyt-main/` root, applied manually/ad-hoc rather than through the tracked migration runner. Each is written idempotent ("safe to re-run") but **not** tracked in `schema_migrations` — run order and whether they've been applied isn't recorded anywhere except this file and git history.

| File | What it does | Depends on |
|---|---|---|
| `add_missing_student_columns.sql` | Adds student profile columns (middle name, major, gender, nationality, national ID, passport, blood type, address fields, emergency contact, mother's name, etc.) so the Add/Edit Student form persists all its fields. | `students` table exists |
| `make_class.sql` | Creates relational `campuses` and `classes` tables, backfills them from the JSONB blob on `academic_structure`. Moves campus/class data from loose JSON into real FK'd tables. | `academic_structure` table exists |
| `user.sql` | Users-only seed: same 51-account demo set (17 roles × 3) as the mega-seed described in [SEED_DATA.md](./SEED_DATA.md). Narrower version — users table only, no downstream module rows (visitor logs, incident reports, etc). | `users` table exists |

## Seed scripts

Already documented in [SEED_DATA.md](./SEED_DATA.md) — full run order, prerequisites, and what each seeds:

`seed_courses_departments_enrollments.sql` · `seed_enrollments_department_matching.sql` · `seed_software_engineering_courses.sql` · `simulation_seed.sql`

## Combined file

`all_root_sql_combined.sql` (repo root) — all 6 loose root scripts above (`add_missing_student_columns.sql`, `seed_courses_departments_enrollments.sql`, `make_class.sql`, `seed_software_engineering_courses.sql`, `seed_enrollments_department_matching.sql`, `simulation_seed.sql`) concatenated in dependency order into one runnable file. Assembled only — **not run against any DB**. Originals kept as-is; nothing deleted.

`simulation_seed.sql` had ~280 non-SQL lines appended after its last statement — an AI QA-testing agent prompt, not database code. Excluded from the combined file (would break execution); worth checking how that got into the file.

`user.sql` was not present in the root at merge time — the users mega-seed SQL it would have contributed is preserved in [`_archive/users.md`](./_archive/users.md); the combined file has a note marking where to prepend it if it reappears.

## Full database dumps (snapshots, not scripts)

| File | What it is |
|---|---|
| `unyt_backup_20260812_084102.sql` | Full `pg_dump`-style snapshot of the live DB, dated 2026-08-12. ~15,300 lines — schema + data as of that pull. Not idempotent, not meant to be read line-by-line; restore target for local/alternate Postgres (see restore steps below). Treat as a point-in-time backup, not documentation — re-pull a fresh one before relying on it if it's more than a few days old. |

### Restoring a dump locally

```bash
createdb unyt_local
psql -d unyt_local -f unyt_backup_20260812_084102.sql
```

## Recommended cleanup (not yet done)

The three root ad-hoc scripts (`add_missing_student_columns.sql`, `make_class.sql`, `user.sql`) do real schema/data work but sit outside the tracked migration system — same problem `backend/migrations/0008` had to fix retroactively (documenting a column that already existed live but wasn't tracked). If they've already been run against the live DB, consider folding them into a numbered `backend/migrations/00XX_*.sql` entry (schema-only parts) so `schema_migrations` reflects reality. Until then, don't assume a fresh environment has these applied — check live schema via [SCHEMA.md](./SCHEMA.md) or `information_schema` before assuming a column/table from this list exists.

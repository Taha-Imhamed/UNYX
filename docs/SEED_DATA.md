# UNYT System — Seed Data & Demo Accounts

Verified live against the Supabase DB on **2026-08-11** (bcrypt compare / live login check). This is the current source of truth for login credentials — if any other doc lists different usernames/passwords, this one wins.

## Demo login accounts (17 roles)

| Role | Username | Password | Notes |
|---|---|---|---|
| Student | `taha` | `tmm2010mt` | |
| Professor | `anas` | `Test@1234` | password reset 2026-08-11, was non-default |
| Professor | `anasprof` | `Test@1234` | password reset 2026-08-11, was non-default |
| Professor | `test1` | `Test@1234` | password reset 2026-08-11, was non-default |
| Teaching Assistant | `ta.noel` | `Test@1234` | |
| Academic Advisor | `advisor.omer` | `Test@1234` | password reset 2026-08-11, was non-default |
| Registrar | `registrar.rei` | `Test@1234` | username changed from `registrar.ines` |
| Admissions Officer | `admissions.era` | `Test@1234` | |
| Finance Staff | `finance.elira` | `Test@1234` | |
| IT Admin | `it.bora` | `Test@1234` | username changed from `it.klodi` |
| Dean | `dean.petra` | `Test@1234` | username changed from `dean.amelia` |
| HOD | `hod.cs` | `Test@1234` | also `hod.biz`, `hod.ds` exist |
| Librarian | `library.riela` | `Test@1234` | username changed from `library.ona` |
| Super Admin | `admin23` | `Test@1234` | replaces `superadmin.alban` (dead) and `superadmin.luan` (unknown password) |
| Student Affairs | `studaff.keti` | `Test@1234` | username changed from `studaff.ina` |
| HR Staff | `hr.gerta` | `Test@1234` | username changed from `hr.livia` |
| Security Officer | `security.dani` | `Test@1234` | |
| Facilities Manager | `facilities.rina` | `Test@1234` | |
| Research Officer | `research.nia` | `Test@1234` | account did not exist, seeded 2026-08-11 |

**Note:** the seed SQL in `seed_users.sql` (see below) generates a *different*, larger set of 3-per-role demo accounts (`ahmed.student`, `dr.hassan`, etc. — all password `Test@1234`) for a full re-seed from empty. The table above is what's actually live in the DB right now, which has diverged from that original seed via manual resets/renames. Don't assume the two lists match.

## Role list (17 roles)

Student · Professor · Teaching Assistant · Academic Advisor · Registrar · Admissions Officer · Finance Staff · IT Admin · Dean · HOD (Head of Department) · Librarian · Super Admin · Student Affairs · HR Staff · Security Officer · Facilities Manager · Research Officer

One-line role summaries: see [OVERVIEW.md](./OVERVIEW.md) target users, or [FEATURES.md](./FEATURES.md) for what each role can do.

## Resolved issues (previously tracked as open bugs)

All 4 already fixed as of 2026-08-11 — see [TASKS.md](./TASKS.md) §8 for root-cause writeups. Re-verified live in the 2026-08-11 pass (finance-only edit tested against `finance.elira`, requests direction confirmed in code, tiles/color scheme confirmed via screenshot of `/dashboard/finance`).

- ~~Finance role can edit full student record~~
- ~~Requests feature direction reversed~~
- ~~Dashboard tiles too small/dark~~
- ~~Dark-blue color scheme needs lightening~~

If any of these regress, note the exact page/role and reopen — code has been touched by multiple people/sessions and could drift again.

## Seed scripts

Four SQL seed files live at repo root (`unyt-main/`). Run against a fresh or partially-seeded DB — each is written to be idempotent/safe to re-run (upserts + conflict guards) unless noted.

| File | What it does |
|---|---|
| `seed_users.md` → raw SQL block in [_archive/users.md](./_archive/users.md) | Mega-seed: adds missing `user_role` enum values, adds `full_name`/`phone`/`department` columns if missing, inserts 3 demo users per role (17 roles × 3 = 51 accounts) with bcrypt password hash, plus sample rows for security/facilities/research/registrar/admissions modules (visitor logs, incident reports, ID card access, maintenance requests, room bookings, research grants, publications, transfer credits, transcript requests, graduation approvals, scholarship awards, interview schedules, offer letters). Skips existing users by normalized username/email. |
| `seed_courses_departments_enrollments.sql` | Seeds `academic_structure` (departments/campuses/majors as JSONB), then connected courses + schedules + enrollments. Creates `academic_structure` table if missing. Uses round-robin enrollment assignment. |
| `seed_enrollments_department_matching.sql` | Alternative enrollment seeding strategy — matches students to courses by department/program instead of round-robin. **Prerequisite:** courses already seeded via `seed_courses_departments_enrollments.sql` (reads `COURSE-SEED-*` IDs). Use one enrollment strategy or the other, not both. |
| `seed_software_engineering_courses.sql` | Seeds a specific Software Engineering curriculum (core + electives), distributing courses across existing professors in the DB via round-robin (`professor_pool`/`professor_count` CTEs). Requires professor users to already exist. |
| `simulation_seed.sql` | Full realistic simulation: student year-levels, advisor assignments, professor-course links, finance states (paid/partial/unpaid/scholarship), registration states (open/closed/blocked-by-balance). Creates `registration_state` and `maintenance_state` tables if missing. This is the seed that resolves the gaps tracked in the "missing collections" section below. |

Run order for a from-scratch DB: users → courses/departments → (pick one) enrollments seed → software-engineering courses (optional, adds more courses) → simulation seed (adds relationship depth).

## Known missing collections (as of last check)

These are referenced by backend code but may not exist in every environment. Backend tolerates their absence (returns empty results instead of crashing — see `db/postgres.ts` 42P01 handling), but related dashboard sections show no data until seeded/created:

`maintenance_state` · `id_card_access` · `sso_config` · `device_logs` · `transfer_credits` · `transcript_requests` · `graduation_approvals` · `enrollment_overrides` · `scholarship_awards` · `interview_schedules` · `offer_letters`

Cross-check against [SCHEMA.md](./SCHEMA.md)'s dead-table audit — some of these may since have been created by `simulation_seed.sql`/`seed_users.md` above, or may be genuinely unbuilt. `SCHEMA.md` (159-table live introspection) is authoritative over this list; this list just explains *why* something might be missing if you hit an empty section in the UI.

## If you want full simulation data instead of placeholders

1. Run `simulation_seed.sql` (creates `registration_state` + `maintenance_state`, adds student/advisor/professor/finance relationship rows).
2. Add `CREATE TABLE` statements for any remaining collections in the "missing" list above that you need live data for.
3. Seed relationship + finance rows for those new tables.

Backend no longer crashes on missing tables — remaining work here is seed completeness, not server stability.

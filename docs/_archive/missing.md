# Missing Tables / Collections

This file tracks the database-backed collections that are missing from the current Postgres schema but are still referenced by the backend, plus the simulation gaps that still need fake data.

## Current missing collections observed in logs

- `maintenance_state`
- `id_card_access`
- `sso_config`
- `device_logs`
- `transfer_credits`
- `transcript_requests`
- `graduation_approvals`
- `enrollment_overrides`
- `scholarship_awards`
- `interview_schedules`
- `offer_letters`

## Current behavior

- Missing collections now return empty results instead of crashing the backend.
- The app stays usable, but the related dashboard sections will show no data until the tables are created.

## Forgot / Still Needed In The Seed

The current `users.md` seed covers role users and a basic student record, but it still does not model the full UNYT simulation you asked for.

### Student relationships

- Every student should have a year level: first year, second year, or third year.
- Every student should be assigned an academic advisor.
- Every student should be linked to at least one professor or course group for the simulation.
- Every student should belong to a department or program area.

### Finance simulation

- Add fake finance cases for paid, partially paid, unpaid, and scholarship-covered students.
- Add students with holds so the UI can simulate blocked registration.
- Add students with zero balance and students with a positive outstanding balance.
- Add scholarship status coverage: awarded, pending, and not awarded.

### Registration simulation

- Add registration state examples for open registration and closed registration.
- Add a case where registration is open but the student still cannot register because the balance is unpaid.
- Add a case where registration is open and the student can register because the balance is cleared.
- Add a case where registration is closed even if the student is otherwise eligible.

### Academic simulation

- Add professor-to-course assignments so students can be mapped to real instructors.
- Add advisor-to-student assignment rows for the advisory workflow.
- Add first-year, second-year, and third-year student examples.
- Add students with scholarship awards and students without scholarships.

## Suggested fake data coverage

### Students

- 3 first-year students.
- 3 second-year students.
- 3 third-year students.
- At least 1 scholarship student in each year.
- At least 1 student with outstanding balance in each year.
- At least 1 student with registration hold in each year.

### Staff assignments

- 3 academic advisors already exist in the seed; map them to students.
- 3 professors already exist in the seed; map them to student groups or courses.
- 3 finance staff already exist in the seed; use them for payment review and holds.
- 3 admissions staff already exist in the seed; use them for applicant simulation.

### Finance states

- Paid in full.
- Partial payment made.
- Payment overdue.
- Scholarship applied.
- Fee waiver applied.

### Registration states

- Registration open and student eligible.
- Registration open but blocked by unpaid balance.
- Registration closed for everyone.
- Registration reopened after payment.

## Module-specific tables that still need seed rows

- `maintenance_state`
- `id_card_access`
- `sso_config`
- `device_logs`
- `transfer_credits`
- `transcript_requests`
- `graduation_approvals`
- `enrollment_overrides`
- `scholarship_awards`
- `interview_schedules`
- `offer_letters`

## Notes

- `maintenance_state` was the original blocker for login and API startup.
- The other collections are optional modules that should be added only if their UI/features are meant to stay backed by live data.
- If you want the simulation to be real instead of placeholder-only, add matching `CREATE TABLE` statements to the schema file and then seed the relationship rows and finance rows.
- The current backend now tolerates the missing tables, so the remaining work is seed completeness rather than server stability.
- The runnable seed file for this work is [simulation_seed.sql](simulation_seed.sql).

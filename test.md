Verified live against the Supabase DB on 2026-08-11. All usernames/passwords below were checked directly (bcrypt compare or live login) — this table replaces the previous one, which had drifted from what's actually seeded (several accounts renamed or never existed).

| Role               | Username         | Password  | Status |
| ------------------ | ---------------- | --------- | ------ |
| Student            | taha             | tmm2010mt | done 40% |
| Professor          | anas             | Test@1234 | password reset 2026-08-11, was non-default |
| Professor          | anasprof         | Test@1234 | password reset 2026-08-11, was non-default |
| Professor          | test1            | Test@1234 | password reset 2026-08-11, was non-default |
| Teaching Assistant | ta.noel          | Test@1234 | |
| Academic Advisor   | advisor.omer     | Test@1234 | password reset 2026-08-11, was non-default |
| Registrar          | registrar.rei    | Test@1234 | username changed from registrar.ines |
| Admissions Officer | admissions.era   | Test@1234 | |
| Finance Staff      | finance.elira    | Test@1234 | |
| IT Admin           | it.bora          | Test@1234 | username changed from it.klodi |
| Dean               | dean.petra       | Test@1234 | username changed from dean.amelia |
| HOD                | hod.cs           | Test@1234 | also hod.biz, hod.ds exist |
| Librarian          | library.riela    | Test@1234 | username changed from library.ona |
| Super Admin        | admin23          | Test@1234 | replaces superadmin.alban (dead) and superadmin.luan (unknown password) |
| Student Affairs    | studaff.keti     | Test@1234 | username changed from studaff.ina |
| HR Staff           | hr.gerta         | Test@1234 | username changed from hr.livia |
| Security Officer   | security.dani    | Test@1234 | |
| Facilities Manager | facilities.rina  | Test@1234 | |
| Research Officer   | research.nia     | Test@1234 | account did not exist, seeded 2026-08-11 |

## Resolved (previously tracked as open bugs)

All 4 items below were already fixed as of 2026-08-11 — see `TASKS.md` §8 for the full root-cause writeup of each. Re-verified live in this pass (finance-only edit tested against `finance.elira`, requests direction confirmed in code, tiles/color scheme confirmed via screenshot of `/dashboard/finance`) — all still hold.

- ~~Finance role can edit full student record~~
- ~~Requests feature direction reversed~~
- ~~Dashboard tiles too small/dark~~
- ~~Dark-blue color scheme needs lightening~~

If any of these regress, note the exact page/role and reopen — the code has been touched by multiple people/sessions and could drift again.

# UNYT System — Task & Component Tracker

Status legend: ✅ Done · 🟡 In Progress / Partial · ⬜ To Do

Source: code inspection + repo docs (`Project Overview.md`, `cover.md`, `missing.md`, `test.md`, `last thing was working on .md`, `users.md`, `tahasql.md`). Where repo gave no explicit signal, component marked ✅ if route+table+UI all exist, 🟡 if only some layers exist, ⬜ if referenced but not built.

> **Known-stale (2026-08-10):** the "DB Schema" section below only tracks the ~35 core tables this doc's authors knew about. Live introspection found **149 tables** — see [`SCHEMA.md`](./SCHEMA.md) for ground truth. A full per-table route/UI audit of the other ~114 tables (HR, library, research, campus life, quizzes/attendance, security/IT, reporting) has not been done yet and is tracked separately; don't treat this doc's completeness claims as covering those subsystems.

---

## 1. Infrastructure / Platform

| Task | Status | Notes |
|---|---|---|
| Monorepo scripts (root package.json, concurrently dev/build/start) | ✅ | |
| Backend Express server bootstrap (server.ts) | ✅ | |
| Custom Postgres data-access layer (db/postgres.ts) | ✅ | Mongo-like API, camelCase<->snake_case mapping |
| Missing-table resilience (42P01 tolerance) | ✅ | Deliberate pattern, lets UI ship ahead of schema |
| Shared types contract (shared/types/index.ts) | ✅ | Single source of DTOs for both FE/BE |
| JWT auth (12h expiry) + bcrypt password hashing | ✅ | |
| Role + permission matrix (20 roles) | ✅ | middleware/auth.ts |
| Custom roles / access profiles (beyond fixed 20) | 🟡 | CRUD exists (users.ts /custom-roles); depth of AccessProfile usage across UI unconfirmed |
| Maintenance-mode gate | ✅ | Was "original blocker for login/API startup" per missing.md — now resolved |
| Registration on/off switch (registration_state table) | 🟡 | Table + toggle exist; state coverage (open/closed/blocked-by-balance) flagged incomplete in missing.md |
| CORS allow-list config | ✅ | |
| Backend test setup (Jest + Supertest) | 🟡 | **Audited 2026-08-11, expanded same day (see §9e)**: was 1 file/9 declarations, all live-integration, zero unit tests, no CI. Now 24 real unit tests across 2 files (`academic-terms.test.ts`, `enrollment-logic.test.ts`) via a Jest esbuild transform, plus CI (`.github/workflows/ci.yml`) running typecheck + `npm test` on every push/PR. Caught a real null-pointer bug on first run. Still not comprehensive (most route handlers remain untested), but no longer thin-and-unenforced. |
| Frontend e2e setup (Playwright) | 🟡 | **Audited + expanded 2026-08-11 (see §9e)**: was 2 spec files, 4 test declarations, pure login/nav-visibility smoke checks. Added `student-portal-flow.spec.ts` (4 tests) exercising real data rendering (profile, schedule, enroll course list) rather than just navigation presence. Also added a frontend unit test runner (Vitest, previously nonexistent) with 11 tests, wired into CI. Still no CI run of the Playwright suite itself (needs live credentials/DB not provisioned in the workflow) — noted explicitly in the CI file, not silently skipped. |
| Deployment config (vercel.json, frontend) | ✅ | Frontend on Vercel; backend deploy target not specified in repo |
| DB migrations folder | ✅ | Real tracked runner (`backend/src/db/migrate.ts` + `schema_migrations` table, forward-only), 13 applied migrations (2026-08-06 through 2026-08-11). **Reconciliation complete 2026-08-11**: the second, orphaned root `migrations/` folder (5 files, 2026-05-02/08-03) was byte-verified against the tracked system — all 5 fully superseded by `backend/migrations/0007` and `0009` — and archived to `migrations/_archived/`. No live gap. |

---

## 2. Database Schema

| Entity/Table | Status | Notes |
|---|---|---|
| users | ✅ | Extended with full_name, phone, department via users.md |
| students | ✅ | Extended with many personal-info columns via add_missing_student_columns.sql |
| professors | ✅ | |
| courses | ✅ | Extended with campus, creditHours, courseType, prerequisiteCourseIds, semester_id (2026-08-11) |
| enrollments | ✅ | **Fixed 2026-08-10.** Live DB was missing 9 columns (`campus`, `is_finalized`, `grade_updated_at`, `grades_finalized_at`, `grades_finalized_by`, `payment_status`, `latest_advisor_message`, `latest_advisor_message_at`, `student`) that `insertEnrollmentRow()` in `enrollments.ts` always wrote to — this made **every enrollment-creation request fail** (`POST /enrollments/self` and `POST /enrollments/`), and silently dropped advisor-message updates. Root cause: orphaned root `migrations/` folder never applied + 4 columns with no migration ever written for them anywhere. Fixed via `backend/migrations/0007-0009`, applied and verified live. Extended with `semester_id` FK (2026-08-11, see semester structuring note below). |
| semesters | ✅ | **New 2026-08-11.** Real academic-term table (`id`, `label`, `academic_year`, `start_date`, `end_date`, `status`), replacing the old `startDate.slice(0,7)`-as-semester heuristic. Migrations `0011-0013`. Backfilled from existing course/enrollment dates + seeded with a standard Fall/Spring/Summer calendar spanning 1 year back to 2 years forward. Admin CRUD at `/dashboard/enrollment/semesters`, backend routes at `/enrollments/meta/semesters`. |
| payments | ✅ | |
| coupons | ✅ | |
| income / expenses | ✅ | |
| feedback | ✅ | |
| news | ✅ | |
| notifications | ✅ | |
| questions | ✅ | |
| site_content | ✅ | |
| academic_structure (singleton jsonb) | ✅ | departments/campuses/majors embedded |
| campuses / classes (normalized) | 🟡 | Backfilled from jsonb via make_class.sql; partial normalization |
| registration_state | ✅ | |
| maintenance_state | ✅ | |
| id_card_access | ✅ | Created via simulation_seed.sql |
| sso_config | ✅ | Created via simulation_seed.sql |
| device_logs | ✅ | Created via simulation_seed.sql |
| transfer_credits | ✅ | Created via simulation_seed.sql |
| transcript_requests | ✅ | Created via simulation_seed.sql |
| graduation_approvals | ✅ | Created via simulation_seed.sql |
| enrollment_overrides | ✅ | Created via simulation_seed.sql |
| scholarship_awards | ✅ | Created via simulation_seed.sql |
| interview_schedules | ✅ | Created via simulation_seed.sql |
| offer_letters | ✅ | Created via simulation_seed.sql |
| student_profiles_extra | ✅ | year_level, advisor, scholarship_status, tuition_balance |
| Finance tables (invoices, installment_plans, sponsorships, refunds, requests, ledger) | 🟡 | Backed by routes + ledger-repository.ts; not all confirmed in canonical tahasql.md — likely created ad hoc |
| Realistic seed data: student year-level/advisor/professor-group/department assignment | ⬜ | Explicitly flagged incomplete in missing.md |
| Finance state seed coverage (paid/partial/unpaid/scholarship/hold) | ⬜ | Explicitly flagged incomplete in missing.md |
| Registration state seed coverage (open/closed/blocked-by-balance scenarios) | ⬜ | Explicitly flagged incomplete in missing.md |
| Course department / "common" vs "major" categorization | 🟡 | courseType field + base-course-assignment.ts scaffolded; student-facing filter/badge added 2026-08-11 (see §9) |
| Semester-linked class/enrollment structuring | ✅ | **Fixed 2026-08-11.** See §9 "Semester structuring" entry for full detail — real `semesters` table, `semester_id` FKs on courses/enrollments/finance_invoices, `students.year_level` reused as a real integer class-year field (was dead legacy text column with word values like `'third-year'`, now converted), 8 duplicate year-derivation implementations and 5 duplicate semester-derivation implementations consolidated into one shared helper per side (`backend/src/lib/academic-terms.ts`, `frontend/lib/academic-terms.ts`). |

---

## 3. Backend Route Modules

| Module | Status | Notes |
|---|---|---|
| students.ts (CRUD, self-service, balance, transactions, transcript PDF/CSV) | ✅ | |
| professors.ts (CRUD) | ✅ | |
| professor-workspace.ts (mock classes, attendance, publish marks, assignments) | 🟡 | Exists; "mock classes" naming suggests simulation/placeholder data model |
| enrollments.ts (lifecycle, approvals, grading, advisor workflow, schedule conflicts) | ✅ | Largest, most mature module (~3700 lines) |
| admin-schedule.ts (room views/availability) | ✅ | |
| finance.ts (invoices, installments, sponsorships, refunds, requests) | ✅ | Route-complete; see finance table-backing caveat above |
| payments.ts | ✅ | Read-only listing |
| income.ts / expenses.ts | ✅ | |
| coupons.ts | ✅ | |
| feedback.ts | ✅ | Public submission path for admissions form |
| questions.ts (student<->professor Q&A) | ✅ | |
| news.ts | ✅ | |
| users.ts (CRUD, auth, custom roles, password mgmt, notifications) | ✅ | |
| dashboard.ts (stats/overview) | ✅ | |
| site-content.ts (public marketing content) | ✅ | |
| student-hints.ts | ✅ | Static content |
| admissions.ts (scholarships, interviews, offer letters) | 🟡 | CRUD built; workflow depth (e.g. interview scheduling logic) unconfirmed |
| registrar.ts (overrides, transfer credits, transcript/graduation requests) | 🟡 | CRUD built; approval workflow depth unconfirmed |
| facilities.ts (maintenance/equipment requests, room bookings) | 🟡 | CRUD built; integration with admin-schedule unconfirmed |
| it-admin.ts (SSO config, integrations, maintenance toggle, device logs) | 🟡 | CRUD built; actual SSO integration likely stubbed |
| research-office.ts (grants, publications, requests) | 🟡 | CRUD built; workflow depth unconfirmed |
| security.ts (visitor logs, incidents, ID-card access) | 🟡 | CRUD built; workflow depth unconfirmed |

---

## 4. Frontend — Public Site

| Page | Status |
|---|---|
| Home | ✅ |
| About | ✅ |
| Admissions | ✅ |
| Campus | ✅ |
| Contact | ✅ |
| Faculties | ✅ |
| Interest (lead capture?) | 🟡 |
| Login | ✅ |

---

## 5. Frontend — Dashboard Portal (by role)

Per `cover.md` (17-role spec) + `test.md` (login/testing coverage). All 20 roles have a route dir; functional completeness varies.

| Role | Route | Status | Notes |
|---|---|---|---|
| Super Admin | dashboard/super-admin | 🟡 | Route exists; full-permission role, coverage unconfirmed |
| Admin | (via role, no dedicated dir — uses shared dashboard) | 🟡 | |
| Dean | dashboard/dean | 🟡 | |
| HOD (Head of Dept) | dashboard/hod | 🟡 | |
| Registrar | dashboard/registrar | 🟡 | |
| Admissions Officer | dashboard/admissions | 🟡 | |
| Academic Advisor | dashboard/advisor, advisor/students | 🟡 | |
| Finance Staff | dashboard/finance | 🟡 | UI polish TODO: invoice/unpaid-balance tiles need lighter/bigger; edit scope needs restricting to finance fields only (test.md) |
| IT Admin | dashboard/it-admin | 🟡 | |
| Librarian | dashboard/librarian | ⬜ | No dedicated backend route module found (no library.ts) — likely UI-only/placeholder |
| Super/Student Affairs | dashboard/student-affairs | 🟡 | |
| HR Staff | dashboard/hr | 🟡 | No dedicated backend route module found — likely UI-only/placeholder |
| Security Officer | dashboard/security | 🟡 | |
| Facilities Manager | dashboard/facilities | 🟡 | |
| Research Officer | dashboard/research, research-office | 🟡 | |
| Professor | dashboard/professor, professors, grade-submission, students-requests | 🟡 | |
| Teaching Assistant | dashboard/ta | ⬜ | Route exists; no dedicated backend module (shares professor-workspace?) — unconfirmed |
| Users (admin user mgmt) | dashboard/users | ✅ | Backed by users.ts |
| Audit | dashboard/audit | 🟡 | audit:view/export permissions exist; dedicated backend module not confirmed |
| Report | dashboard/report | 🟡 | |
| Requests | dashboard/requests | 🟡 | Semantics bug noted in test.md: admin should see requests sent TO them and be able to edit/delete; currently reversed/confusing |
| Enrollment (admin view) | dashboard/enrollment | ✅ | |
| Grades Requests | dashboard/grades-requests | 🟡 | Has own Next.js API route |
| Applications | dashboard/applications | 🟡 | |
| Students (admin view) | dashboard/students, students/[studentId] | ✅ | |
| News | dashboard/news | ✅ | |
| Feedback | dashboard/feedback | ✅ | |
| Notifications | dashboard/notifications | ✅ | |
| Settings | dashboard/settings | 🟡 | |
| Dashboard shell (layout, sidebar, route guard) | dashboard/layout.tsx | ✅ | |
| Role-aware default landing | dashboard/page.tsx | ✅ | role-workspace-dashboard.tsx |

---

## 6. Frontend — Student Self-Service Portal

> **Updated 2026-08-11.** This table previously undercounted the portal (listed 15 of the ~24 routes that exist) and predated a consistency/gap-closing pass. All 24 routes are now wired to real backend data (none are static/placeholder), and every route is gated behind `StudentFeatureGate` + has a matching sidebar `featureKey` (previously 8 routes were ungated, so admins couldn't lock them and the sidebar link would stay visible even when the page itself was blocked).

| Feature | Route | Status | Notes |
|---|---|---|---|
| Enroll (course selection) | student/enroll | ✅ | Now shows live FIFO waitlist position (`GET /enrollments/:id/waitlist-position`) when status is `waitlisted`, gated by `waitlist-status` |
| Enrollment renewal | student/enrollment-renewal | ✅ | |
| Schedule | student/schedule | ✅ | |
| Attendance | student/attendance | 🟡 | |
| Grades | student/grades | ✅ | |
| Transcript | student/transcript | ✅ | PDF/CSV export backed |
| Billing | student/billing | ✅ | Includes scholarship/sponsorship "financial aid" section already |
| Payment plan | student/payment-plan | 🟡 | View + request installment plans works; no autopay/recurring charges, no in-page "pay now", no edit/cancel of a pending request |
| Profile | student/profile | ✅ | |
| Settings | student/settings | ✅ | Added notification preferences (email/SMS/push toggles), persisted via `Student.notificationPreferences` |
| Supervisor (advisor contact) | student/supervisor | ✅ | Added a real 2-way message thread with the assigned advisor (`advising_messages` table, migration 0010) — previously static contact-info only |
| Support | student/support | ✅ | Was orphaned from the sidebar (no nav entry); now has one under "Petition" |
| Department courses | student/department-courses | 🟡 | Added courseType (Major/Common) filter tabs + badge; underlying department/common categorization data model still needs the semester-linking work tracked in §9 |
| Document request | student/document-request | ✅ | |
| Message | student/message | ✅ | Read-only notifications inbox (distinct from the advisor message thread on the Supervisor page) |
| Advising (appointment booking) | student/advising | ✅ | |
| Campus events | student/campus-events | ✅ | |
| Course reviews | student/course-reviews | ✅ | Fixed a mobile layout issue (rating/difficulty row had no breakpoint, could crowd on narrow screens) |
| Degree audit | student/degree-audit | ✅ | |
| GPA calculator | student/gpa-calculator | ✅ | |
| Housing & meal plan | student/housing | ✅ | Fixed a mobile layout issue (list rows had no `flex-wrap`, could overflow on narrow screens) |

**Overall student role explicitly marked "done 40%" in `test.md`** — that note predates this pass and hasn't been touched, since it records manual QA state (someone clicking through the live app), not something re-derivable from code inspection alone. **Re-verified from code 2026-08-11**: all 21 feature routes (of 22 total; `settings` is the account page, deliberately ungated) are wired to real backend calls (no static/placeholder pages), all gated consistently via `StudentFeatureGate`, all have sidebar entries. Found and fixed one real gap during this re-check: `/student/settings` had zero navigation entry point anywhere in the sidebar (orphaned page, same class of bug `/student/support` had before the 2026-08-11 gap-closing pass) — added. Code-completeness and manual-QA-verified-working are different claims; `test.md`'s 40% should be re-scored by someone actually clicking through the live app, not overwritten here.

---

## 7. Frontend — Shared Components

| Component | Status |
|---|---|
| admin-sidebar / student-sidebar | ✅ |
| dashboard-header | ✅ |
| dashboard-route-guard (RBAC gate) | ✅ |
| data-table | ✅ |
| role-workspace-dashboard (generic role renderer) | ✅ |
| stats-card | ✅ |
| student-card / student-hint-card | ✅ |
| theme-provider | ✅ |
| enrollment/CourseSelector, RosterList, ScheduleGrid | ✅ |
| student/course-catalog, courses-table, grade-breakdown, grades-table, profile-card, student-overview | ✅ |
| ui/* (shadcn/Radix component library) | ✅ | Full kit present |
| auth-context.tsx (login/logout/permissions/notifications) | ✅ | |
| API client libs (lib/*-api.ts, one per domain) | ✅ | |

---

## 8. Known Bugs / Fixes Needed (explicit from test.md)

| Item | Status | Notes |
|---|---|---|
| Finance role can edit full student record — should be restricted to finance fields only | ✅ | **Fixed 2026-08-11.** Investigated first: the backend field-gating and a `financeOnly` restricted edit form already existed and were already correct — finance could never reach the personal-info field block, and `balance` was the only field the API applied for them. The actual bug was purely a frontend dead-end: `canEditStudents`/`canEditStudentRecord` in `dashboard/students/page.tsx` hard-excluded `isFinanceUser`, so finance had no Edit button at all and the correctly-built restricted form was unreachable dead code. Fixed by including finance in the edit-action gate. |
| Requests feature direction reversed — admin should receive & be able to edit/delete requests, not just send | ✅ | **Fixed 2026-08-11.** Investigated first: `/dashboard/requests`'s own logic was already correct — admin already receives the full inbox (`GET /requests` returns all requests for reviewer roles), and edit/delete were already wired and permission-gated correctly. The actual bug was two *other* UI entry points mislabeling the feature for admin as "send": a dead-end "Submit Purchase / Fund Request" button on the main dashboard (reworded to "Review Staff Requests"), and a universal feature tile pushed onto every role including admin with "...send it directly to finance" copy (admin/super-admin/supervisor now get a distinct reviewer-framed tile instead). |
| Dashboard tiles (invoice/unpaid balance) too small/dark — need lighter, bigger | ✅ | **Fixed 2026-08-11.** The finance page's 4 stat tiles (Revenue/Pending balances/Open invoices/Pending requests) were already light-colored, just modestly sized (`text-2xl`, ~20px padding) compared to the app's `StatsCard` component elsewhere (~40px values) — enlarged to match. Also fixed a separate hardcoded dark-navy divider (`#253b6e`) inside `StatsCard` itself, unrelated to the sidebar color, that put a visible dark bar on an otherwise light card. |
| Overall dark-blue color scheme needs lightening | ✅ | **Fixed 2026-08-11.** The dark navy was a single global CSS token, `--menu-color` (`frontend/app/globals.css`), consumed only by the sidebar — lightened from `#0f1c40`/`#05070d` (light/dark mode) to `#2a4a8c`/`#1c3566`, kept dark enough to preserve contrast against the light `--menu-foreground` sidebar text. |

## 9. Known TODOs (explicit from last thing was working on.md)

| Item | Status |
|---|---|
| Section for course department / "common" course categorization | 🟡 | Student-facing filter/badge added 2026-08-11 (department-courses page now has Major/Common tabs and shows common courses regardless of department match); admin-side courseType field + edit UI already existed. Remaining gap is deeper: no dedicated common-course catalog view, no per-major "which common courses satisfy your gen-ed requirement" mapping. |
| Semester structuring across class/enrollment/course | ✅ | **Fixed 2026-08-11** — see §9c for full detail. |

## 9b. Student Portal Gap-Closing Pass (2026-08-11)

Addressed in this pass — see §6 for per-route detail:
- **Feature-gate consistency**: 8 student routes (advising, campus-events, course-reviews, housing, message, enrollment-renewal, support, plus the pre-existing partial gates on billing/grades) were not wrapped in `StudentFeatureGate` and had no sidebar `featureKey`, so admins couldn't lock them via the Terminal UI and the sidebar link stayed visible regardless of lock state. All now gated; new feature keys (`campus-events`, `housing`, `course-reviews`, `message`, `support`, `enrollment-renewal`, `waitlist-status`) added to `frontend/lib/terminal-modules.ts`.
- **Support page was orphaned from navigation** — reachable only via a deep-link from the Supervisor page, no sidebar entry. Added under "Petition" section.
- **Waitlist self-view** (new): `GET /enrollments/:id/waitlist-position` returns FIFO queue position; shown on the Enroll page for `waitlisted` enrollments.
- **Notification preferences** (new): `Student.notificationPreferences` (email/sms/push booleans), settings page has toggles, persisted via existing `PUT /students/self`.
- **Advisor messaging** (new): previously advising.ts only supported appointment booking, no 2-way messaging — confirmed via code read that `advisor-contact` was already a registered feature key with the label "Advisor Messaging / Booking" but the messaging half was never built. Added `advising_messages` table (migration `0010_add_advising_messages.sql`, applied live), `GET/POST /advising/messages*` routes, and a message thread UI on the Supervisor page (scoped to the student's assigned advisor).
- **Department/common course split**: added Major/Common filter tabs + badges to the student department-courses page; backend `courseType` field and admin edit UI already existed but had no student-facing surface.
- **Mobile responsiveness**: fixed two pages with zero responsive breakpoints (housing, course-reviews) that could overflow/crowd on narrow screens.
- Fixed a stale duplicate of `shared/types/index.ts` under `frontend/shared/types/` that had drifted out of sync with the root copy (missing several types/fields, unrelated to this pass) — synced so the frontend build picks up the new `notificationPreferences` and `AdvisingMessage` types.
- **Scholarship/financial-aid status**: investigated, found already fully built (`billing/page.tsx` already surfaces `fetchMyScholarshipAwards()`) — no work needed.

## 9c. Semester Structuring Fix (2026-08-11)

Full-repo audit found 8 duplicate year-derivation implementations and 5 duplicate semester-derivation implementations scattered across backend and frontend, plus an untyped `Student.currentYear` field accessed only via casts, a live `students.year_level` column populated with word values (`'first-year'` etc.) by the ad-hoc `simulation_seed.sql` script and never read by any code, and a format mismatch between `enrollment.semester` (`"YYYY-MM"`) and `finance_invoices.semester` (free text like `"Fall 2026"`).

Fixed:
- **New `semesters` table** (migrations `0011-0013`): `id`, `label`, `academic_year`, `start_date`, `end_date`, `status` (upcoming/active/closed). Backfilled from existing course/enrollment `startDate` values (grouped into Fall/Spring/Summer buckets) plus seeded with a standard calendar spanning 1 year back to 2 years forward from today. Verified live: 0 orphaned enrollments, 0 dangling FK references.
- **`semester_id` FK columns** added to `courses`, `enrollments`, `finance_invoices` — real relational term reference, replacing the `course.startDate.slice(0, 7)` string-slicing heuristic (`getCourseSemester()`) used at 5+ call sites for duplicate-enrollment checks, schedule-conflict same-term comparison, and transcript grouping. The old free-text `semester` fields are kept (not removed) for backward compatibility and as a fallback when `semester_id` is unset.
- **`students.year_level`** (was a dead `text` column, values like `'third-year'`, zero code references anywhere) converted to `integer` and wired up as the real class-year field, replacing the regex-parsed `currentSemester`-as-year-level hack (`deriveCurrentYear()` / `/^(?:year\s*)?(\d+)$/i`) that conflated academic term and year-level throughout the codebase.
- **Consolidated duplicate logic** into one shared helper per side: `backend/src/lib/academic-terms.ts` (`deriveStudentYearLevel`, `resolveCourseSemester`, `resolveSemesterForDate`, semester CRUD helpers) and `frontend/lib/academic-terms.ts` (`deriveStudentYearLevel`). Replaced independent copies in `enrollments.ts` (2 sites), `students.ts`, `users.ts`, `base-course-assignment.ts` (which had drifted with zero shared imports), `frontend/app/student/enroll/page.tsx`, `frontend/components/student/student-overview.tsx`, `frontend/app/dashboard/students/page.tsx` (2 sites, one used a looser unanchored regex than the others), and `frontend/app/dashboard/advisor/students/page.tsx` (fixed a "Sem Year 2" display bug from concatenating a "Sem" prefix onto a value that was already "Year N").
- **Admin semester management UI** at `/dashboard/enrollment/semesters` (new tab in `EnrollmentTabNav`) — create/edit-status/delete terms; delete is blocked if courses still reference the term.
- **Course admin form** (`CourseEditDialog.tsx`) gained a "Semester / term" dropdown (additive, alongside the existing Year 1–6 eligibility checkboxes, which serve a different purpose — student eligibility vs. term scheduling). Wired through `POST/PUT /enrollments/meta/courses`, which previously silently dropped `semesterId` entirely if sent (not destructured from `req.body`).
- **`transcripts.ts`** semester grouping now prefers the real semester's `label` (via `enrollments.semester_id`/`courses.semester_id` join) over the old SQL-side `coalesce(startDate slice)` reimplementation, with the old chain kept as a fallback for enrollments not yet linked to a real term.
- **`registrar.ts`**/**`finance.ts`** tuition-invoice creation now resolves and passes the real semester label + `semesterId` instead of the raw `"YYYY-MM"` enrollment string, fixing the format mismatch with `finance_invoices.semester`.
- Not touched (explicitly out of scope): the 3rd, simplified eligibility-matching implementation in `EnrollmentCreateDialog.tsx` (admin manual-enroll dialog checks year only, not full program/faculty matching) — flagged in the original audit but not a semester-structuring issue per se.

---

## 9d. Remaining Gap-Closing Pass (2026-08-11)

Addressed the 4 test.md bugs (see §8 for detail) plus 3 more items:
- **`EnrollmentCreateDialog.tsx` eligibility divergence**: investigated first — found the backend doesn't eligibility-filter courses for admin/staff callers at all (`isAdminScope` bypasses `doesCourseMatchMajor` server-side), so the dialog's own weak client-side year-only filter was the *only* thing hiding courses from admin, using different logic than self-service. Since the dialog's own copy already states its purpose ("Admin staff can still place students manually if needed"), removed the filter entirely — the course list now matches the backend's own admin-scope behavior (unfiltered), with a non-blocking "outside student's usual year" hint retained per-course instead of a hard exclusion.
- **Orphaned root `migrations/` folder**: byte-diffed all 5 files against the tracked system — all fully superseded (`backend/migrations/0007` and `0009`), confirmed no live gap. Archived to `migrations/_archived/` via `git mv` (reversible), root `migrations/README.md` updated with the verification detail.
- **`student/tickets` page**: turned out to already be a fully-built 464-line multi-department ticketing system (`components/tickets-page.tsx`, `lib/tickets-api.ts`, backend `support-tickets.ts`, all wired) — not a stub as earlier assumed, just missing the same `StudentFeatureGate`/sidebar-`featureKey` consistency treatment every other student page got in the 2026-08-11 gap-closing pass. Fixed.
- **Test coverage (initial pass)**: backend was 1 file, 9 declarations, all live-integration, zero unit tests, no CI. Added a Jest esbuild transform so `.test.ts` files can unit-test real `.ts` source without a live server/DB, plus `tests/academic-terms.test.ts` (11 tests) — which caught a real null-pointer bug in `deriveStudentYearLevel()` on its first run (student param wasn't null-checked), fixed same pass. Frontend at that point had no unit test runner — see §9e, this was closed in the next round rather than left out of scope.

---

## 9e. Testing, CI, Schema Re-Audit, and Perf/Monitoring Verification Pass (2026-08-11)

- **Backend unit tests expanded**: added `tests/enrollment-logic.test.ts` (13 tests) covering `isTimeOverlapping` (the schedule-conflict/travel-buffer math), `normalizeCourseType`, and `normalizeEligibilityList` — exported these three previously-private pure functions from `enrollments.ts` (no behavior change) so they're directly testable without instantiating the whole route file's DB-backed state. Total backend unit tests: 24 (up from 11), full suite (unit + skippable integration) passes clean via `npm test`.
- **Frontend unit test runner added**: no unit test runner existed at all (Playwright E2E only). Installed Vitest (`--legacy-peer-deps`, matching this repo's own documented install pattern for its React-19-vs-peer-range conflicts), added `vitest.config.mts` (`.mts` + `import.meta.dirname` to avoid CJS/native-config-loader warnings), wired `npm test` → `vitest run`, added `frontend/lib/academic-terms.unit.test.ts` (11 tests, mirrors the backend coverage for the frontend's parallel copy of the same helper). `*.unit.test.ts` naming keeps these cleanly separate from Playwright's `*.spec.ts` files.
- **Playwright E2E expanded beyond login/nav-visibility smoke tests**: added `tests/e2e/student-portal-flow.spec.ts` (4 tests) — login as student and verify real profile data renders (not a static placeholder), schedule page loads without an error state, enroll page's live course-list fetch resolves, settings page is reachable from the sidebar (this last one specifically exercises the orphaned-nav-link fix from this same pass). Still credential-gated (skips cleanly without `E2E_STUDENT_USERNAME`/`PASSWORD`), consistent with the existing suite's pattern.
- **CI added**: `.github/workflows/ci.yml` — two jobs (`backend`, `frontend`), each running `npm ci` → `tsc --noEmit` → `npm test` on push/PR to main/master. Deliberately does NOT run Playwright E2E (needs a live backend + DB + seeded demo accounts this workflow doesn't provision) — noted inline in the workflow file with the reasoning, not silently omitted.
- **SCHEMA.md fully regenerated from live introspection** (was 2026-08-10, now 2026-08-11): confirmed **159 live tables** (up from 149 originally documented, 149→159 partly from this session's own additions — `semesters`, `advising_messages` — and partly from tables that existed but were never documented). **Major finding: 87 of the 159 tables are dead scaffold** — zero references anywhere in `backend/src/routes/*.ts` (excluding the diagnostics page) or the `data/*.ts`/`lib/*.ts` helpers routes call into. These are generic `id/title/description/status/notes` shaped leftovers from early schema generation that were never wired to real read/write paths — e.g. `academic_terms` (dead, superseded by the real `semesters` table), `installment_plans` (dead, real one is `finance_installment_plans`), `books`/`book_loans`/`book_copies` (dead, real ones are `library_books`/`library_loans`), `support_tickets`/`support_ticket_messages` (dead, real ones are `support_desk_tickets`/`support_desk_replies`), and `student_profiles_extra` (dead, its columns now live directly on `students`). Full dead-table list and dead-vs-real pairing table now in `SCHEMA.md` itself so this doesn't need re-discovering. Also fixed a pre-existing doc bug where `schema_migrations`' PK showed as `id,version,version` (join artifact) instead of `id`.
- **Student portal re-verified against `test.md`'s "done 40%" note**: all 22 routes (21 feature pages + settings) checked directly — every one wired to real backend calls, every feature page consistently gated, every page has a sidebar entry. **Found and fixed one real regression during the re-check**: `/student/settings` had zero navigation entry point anywhere (same class of bug `/student/support` had before the first gap-closing pass) — added to the sidebar. `test.md`'s 40% figure itself was deliberately left untouched — it records manual QA (someone clicking through the live app), which code inspection can't substitute for; that number should be re-scored by actually using the app, not overwritten from a code read.
- **Perf/monitoring reviewed, not rewritten** — checked the obvious risk spots and found this codebase already in good shape here, so nothing needed "fixing": `/api/health` already does a real DB ping (not a bare 200), returns 503 on DB failure; centralized Express error handler + `uncaughtException`/`unhandledRejection` handlers already wired; Sentry error tracking already integrated and correctly no-ops without `SENTRY_DSN` set (confirmed called at startup); the course-listing and dashboard-stats hot paths (both reviewed line-by-line) already batch their DB access correctly (aggregation pipelines for counts, `Promise.all` for parallel independent queries) with no N+1 patterns found; every new FK column added this session (`semester_id` on courses/enrollments/finance_invoices, `advising_messages.student_id`/`advisor_id`) already has a matching index from its own migration. One dead-code note (not a perf issue): `resolveCourseSemester`/`resolveSemesterForDate` in `backend/src/lib/academic-terms.ts` were written during the semester-structuring work but are never actually called anywhere — `transcripts.ts` still does its own separate SQL join instead of using them. Flagged, not changed — consolidating that is a design decision, not a perf fix.

---

## 9f. AI Assistant ("Kino") + Dean Dashboard + Credential Audit (2026-08-11)

- **Dean dashboard fully built out** (was a bare `RoleWorkspaceDashboard` shell, 4 read-only permissions, no dedicated backend): new `backend/src/routes/dean.ts` (academic-overview, faculty-performance, department-comparison, unified grade-change/graduation approvals inbox with confirm/reject, all audit-logged), 4 new `Permission` strings (`academic:approve`, `graduation:approve`, `professors:manage`, `hod:oversight`), dean-owned `/dashboard/dean` page (KPI cards, tabs, search/sort/CSV export, inline approve/reject). Verified live end-to-end against `dean.petra`.
- **In-app AI assistant ("Kino") added** — new `/dashboard/kino` page, ChatGPT/Claude-style centered composer with browser speech-to-text mic (Web Speech API, Chrome/Edge only). Backend: `backend/src/routes/ai-assistant.ts` (chat/confirm/cancel/history endpoints), `backend/src/lib/ai-tools.ts` (4-tool allowlist: `create_user`/`create_student`/`create_professor`/`create_course`, admin/super-admin only), 3 new tables (`ai_conversations`, `ai_messages`, `ai_pending_actions`). **Every mutating action requires explicit human confirm-click** — the model can never write to the DB directly, only propose a `pending_action` row the admin approves or cancels; non-admin roles never get tool definitions sent to the model at all (checked at call-construction, not just execution). Extracted `createUserCore()`/`createStudentCore()` out of `users.ts`/`students.ts` so the AI path reuses the exact same logic as the real routes instead of a drifting duplicate. LLM provider: Gemini (`gemini-2.5-flash` default, `GEMINI_API_KEY` env var) — originally built against Claude, switched per request; provider-neutral tool-definition shape in `ai-tools.ts` so a future swap only touches the API-call layer in `ai-assistant.ts`. Fixed one real bug post-launch: conversation history was being sent correctly but Gemini's default behavior deflected with a canned "I don't store personal data" response even with full context present — fixed via a stronger system-prompt instruction, verified live with a real multi-turn memory test.
- **Live-DB credential audit**: queried every non-student staff username directly against the DB and diffed against `test.md`'s documented table — **10 of 19 documented usernames had silently drifted** (renamed at some point, doc never updated): registrar.ines→registrar.rei, it.klodi→it.bora, dean.amelia→dean.petra, library.ona→library.riela, superadmin.alban→(dead, no live replacement had a known password until this pass), studaff.ina→studaff.keti, hr.livia→hr.gerta. Additionally found 4 accounts with non-default passwords that couldn't be recovered (bcrypt is one-way) — `advisor.omer` plus 3 manually-created professor test accounts (`anas`, `anasprof`, `test1`) — reset to the documented `Test@1234` default. **`research-office` role had zero seeded users at all** — nobody could log in as that role; seeded `research.nia` matching the existing account shape. `test.md` rewritten with the verified-live table plus a status column noting what changed per row.
- **Re-verified the 4 bugs already marked ✅ in §8** — finance edit-scope, requests direction, tile sizing, color scheme — all still hold on re-check (finance-only edit tested live against `finance.elira`, requests direction re-read in code, tiles/colors re-screenshotted on `/dashboard/finance`). No regressions found.

---

## 10. Documentation

| Doc | Status |
|---|---|
| Project Overview.md (product pitch, MVP scope) | ✅ |
| cover.md (17-role spec) | ✅ |
| tahasql.md (canonical DB schema) | ✅ |
| users.md (role seed data + enum migration) | ✅ |
| missing.md (gap tracker) | ✅ (living doc) |
| test.md (demo creds + QA notes) | ✅ (living doc) |
| last thing was working on .md (scratch TODO) | 🟡 | Informal, unresolved items still open |
| ARCHITECTURE.md (this task's output) | ✅ | Generated — system architecture + UML (mermaid) |
| AI_IMAGE_PROMPTS.md (this task's output) | ✅ | Generated — independent image-gen prompts |
| API reference doc (formal endpoint documentation) | ⬜ | Not found in repo; endpoints only discoverable by reading route files |
| ER diagram as standalone artifact | ✅ | Now in ARCHITECTURE.md §4 |

---

## Summary Counts

- Backend route modules: 22 total — 15 ✅, 7 🟡
- Dashboard role routes: ~20 — 2 ✅ fully backend-confirmed, ~16 🟡, 2 ⬜ (Librarian, TA — no matching backend module found)
- Student portal features: 14 — 6 ✅, 8 🟡
- Database tables: ~35 — 30 ✅, 5 🟡/⬜ (finance ad-hoc tables, seed-data completeness)
- Open bugs: 4 (all ⬜, from test.md)
- Open TODOs: 2 (both ⬜/🟡, from last-working-on note)

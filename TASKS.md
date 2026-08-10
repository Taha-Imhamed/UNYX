# UNYT System — Task & Component Tracker

Status legend: ✅ Done · 🟡 In Progress / Partial · ⬜ To Do

Source: code inspection + repo docs (`Project Overview.md`, `cover.md`, `missing.md`, `test.md`, `last thing was working on .md`, `users.md`, `tahasql.md`). Where repo gave no explicit signal, component marked ✅ if route+table+UI all exist, 🟡 if only some layers exist, ⬜ if referenced but not built.

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
| Backend test setup (Jest + Supertest) | 🟡 | Present, coverage depth unknown |
| Frontend e2e setup (Playwright) | 🟡 | Present, coverage depth unknown |
| Deployment config (vercel.json, frontend) | ✅ | Frontend on Vercel; backend deploy target not specified in repo |
| DB migrations folder | 🟡 | Only 4 tracked migrations (all one date, 2026-05-02); most schema changes done via ad-hoc root .sql files instead of a migration system |

---

## 2. Database Schema

| Entity/Table | Status | Notes |
|---|---|---|
| users | ✅ | Extended with full_name, phone, department via users.md |
| students | ✅ | Extended with many personal-info columns via add_missing_student_columns.sql |
| professors | ✅ | |
| courses | ✅ | Extended with campus, creditHours, courseType, prerequisiteCourseIds |
| enrollments | ✅ | Extended with campus column via migration |
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
| Course department / "common" vs "major" categorization | 🟡 | courseType field + base-course-assignment.ts scaffolded; UI section "not yet made" per last-working-on note |
| Semester-linked class/enrollment structuring | ⬜ | Explicit TODO in "last thing was working on .md" |

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

| Feature | Route | Status |
|---|---|---|
| Enroll (course selection) | student/enroll | ✅ |
| Enrollment renewal | student/enrollment-renewal | 🟡 |
| Schedule | student/schedule | ✅ |
| Attendance | student/attendance | 🟡 |
| Grades | student/grades | ✅ |
| Transcript | student/transcript | ✅ | PDF/CSV export backed |
| Billing | student/billing | ✅ |
| Payment plan | student/payment-plan | 🟡 |
| Profile | student/profile | ✅ |
| Settings | student/settings | ✅ |
| Supervisor (advisor contact) | student/supervisor | 🟡 |
| Support | student/support | 🟡 |
| Department courses | student/department-courses | 🟡 | Ties to unfinished dept/common-course categorization TODO |
| Document request | student/document-request | 🟡 |
| Message | student/message | 🟡 |

**Overall student role explicitly marked "done 40%" in `test.md`.**

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

| Item | Status |
|---|---|
| Finance role can edit full student record — should be restricted to finance fields only | ⬜ |
| Requests feature direction reversed — admin should receive & be able to edit/delete requests, not just send | ⬜ |
| Dashboard tiles (invoice/unpaid balance) too small/dark — need lighter, bigger | ⬜ |
| Overall dark-blue color scheme needs lightening | ⬜ |

## 9. Known TODOs (explicit from last thing was working on.md)

| Item | Status |
|---|---|
| Section for course department / "common" course categorization | 🟡 | Data model (courseType, baseCourseIds) scaffolded; UI/workflow not finished |
| Semester structuring across class/enrollment/course | ⬜ |

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

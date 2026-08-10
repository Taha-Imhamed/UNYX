# Requirements

## Functional (implemented)
- Manage students: create/read/update/delete; view balances and financial snapshots.
- Manage enrollments: create/read/update/delete; apply coupons/overrides; balance adjustments via internal transactions.
- Manage courses (metadata) and professors from Supabase/Postgres-backed tables.
- Record and list payments; adjust balances from enrollments (debits) and payments (credits).
- Finance tracking: income and expenses CRUD; dashboard aggregates (totals, net, averages).
- Feedback and news retrieval/creation from Supabase/Postgres.
- Dashboard overview: stats plus recent students, feedback, income, expenses.
- Auth middleware and admin-only guard for sensitive endpoints.

## Non-functional (aligned with implementation)
- Security: role-based checks for admin routes; password hashing for stored users; auth middleware across APIs.
- Performance: database indexes on ids, emails, codes, and date fields to keep CRUD/aggregations responsive.
- Maintainability: modular route files; shared types; database-driven state (no mock/seed fallbacks).
- Usability: consistent JSON API schema; handles empty database states gracefully.

## Mapping (requirement → feature)
- Student management → students routes/pages; balance and financial snapshot endpoints.
- Enrollment lifecycle → enrollments routes; coupon handling; balance debits; summary endpoint.
- Payments/ledger → payments routes; balance-after stored per transaction.
- Finance tracking → income/expenses routes; dashboard aggregates use these collections.
- Feedback/news → feedback and news routes; surfaced in dashboard recent items.
- Security → requireAuth middleware; requireAdmin guard; hashed user passwords.
- Enrollment permissions & sections → admin/supervisor-only state changes; self-enroll allowed for user role only when linked to the same studentId; professors cannot change enrollment states. Course sections support sectionId, branch/location, per-section schedules, and enrollment windows (enrollmentOpenAt/enrollmentCloseAt). Backend rejects enrollments outside the window and returns 409; UI must disable closed sections. Schedule preview endpoint POST /api/enrollments/schedule/preview merges existing + proposed sessions with conflict detection before saving.

-- backend/src/routes/enrollments.ts insertEnrollmentRow() and the advisor-message update path
-- write to these 4 columns, but no migration anywhere in the repo (root migrations/ or here)
-- ever created them. Confirmed via live schema introspection (2026-08-10) -- this is why
-- enrollment creation was hard-failing with "column does not exist" against the live DB.
-- Types/nullability inferred from shared/types/index.ts Enrollment interface.

alter table public.enrollments
  add column if not exists payment_status text null,
  add column if not exists latest_advisor_message text null,
  add column if not exists latest_advisor_message_at timestamptz null,
  add column if not exists student jsonb null;

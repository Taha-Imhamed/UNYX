-- Adds soft-delete support to the four most sensitive tables. Additive and
-- idempotent (safe to re-run): existing rows get deleted_at = null, meaning
-- "not deleted", and nothing already in these tables is touched otherwise.
alter table public.users add column if not exists deleted_at timestamptz null;
alter table public.students add column if not exists deleted_at timestamptz null;
alter table public.enrollments add column if not exists deleted_at timestamptz null;
alter table public.payments add column if not exists deleted_at timestamptz null;

create index if not exists idx_users_deleted_at on public.users (deleted_at);
create index if not exists idx_students_deleted_at on public.students (deleted_at);
create index if not exists idx_enrollments_deleted_at on public.enrollments (deleted_at);
create index if not exists idx_payments_deleted_at on public.payments (deleted_at);

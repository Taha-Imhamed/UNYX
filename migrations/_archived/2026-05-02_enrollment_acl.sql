-- Enrollment integrity, ACL, and grade finalization migration

-- 1) Add grade finalization fields
alter table public.enrollments
  add column if not exists is_finalized boolean not null default false,
  add column if not exists grade_updated_at timestamptz null,
  add column if not exists grades_finalized_at timestamptz null,
  add column if not exists grades_finalized_by text null;

-- 2) Prevent duplicate active enrollments (race condition guard)
create unique index if not exists idx_enrollments_unique_active
  on public.enrollments (student_id, course_id)
  where status not in ('cancelled', 'rejected', 'dropped');

-- 3) Per-user ACL table
create table if not exists public.user_permissions (
  id bigserial primary key,
  user_id text not null,
  permission_key text not null,
  allowed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_user_permissions_unique
  on public.user_permissions (user_id, permission_key);

create index if not exists idx_user_permissions_user_id
  on public.user_permissions (user_id);

-- 4) Foreign key constraints for orphan prevention
-- NOTE: Wrapped in DO blocks to avoid duplicate constraint errors on re-run.

do $$
begin
  alter table public.enrollments
    add constraint fk_enrollments_student
    foreign key (student_id) references public.students(id)
    on delete cascade;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.enrollments
    add constraint fk_enrollments_course
    foreign key (course_id) references public.courses(id)
    on delete cascade;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.enrollments
    add constraint fk_enrollments_professor
    foreign key (professor_id) references public.professors(id)
    on delete restrict;
exception
  when duplicate_object then null;
end $$;

-- Folds in the orphaned root migrations/2026-05-02_enrollment_campus_combined.sql and
-- migrations/2026-05-02_enrollment_acl.sql, which predate this migrations system and were
-- never applied to the live DB. Restores columns that backend/src/routes/enrollments.ts
-- insertEnrollmentRow() has always written to, breaking enrollment creation until now.

-- 1) Campus metadata
alter table public.enrollments
  add column if not exists campus text null;

update public.enrollments e
set campus = case
  when c.department ilike '%architecture%'
    or c.department ilike '%interior%'
    or c.department ilike '%computer science%'
    or c.department ilike '%cs%'
    or c.title ilike '%architecture%'
    or c.title ilike '%interior%'
    or c.title ilike '%computer science%'
    or c.title ilike '%cs%'
    or c.code ilike 'CS%'
  then 'East Campus'
  else 'Main Campus'
end
from public.courses c
where e.course_id = c.id
  and (e.campus is null or e.campus = '');

comment on table public.enrollments is
  'Travel buffer policy: 10 minutes minimum gap between classes on the same campus, 20 minutes minimum gap between Main and East campus classes.';

-- 2) Grade finalization fields
alter table public.enrollments
  add column if not exists is_finalized boolean not null default false,
  add column if not exists grade_updated_at timestamptz null,
  add column if not exists grades_finalized_at timestamptz null,
  add column if not exists grades_finalized_by text null;

-- 3) Prevent duplicate active enrollments (race condition guard)
create unique index if not exists idx_enrollments_unique_active
  on public.enrollments (student_id, course_id)
  where status not in ('cancelled', 'rejected', 'dropped');

-- 4) Per-user ACL table
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

-- 5) Foreign key constraints for orphan prevention
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

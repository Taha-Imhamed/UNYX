-- Combined migration: add campus, backfill, and document travel-buffer policy

-- 1) Add campus metadata for enrollments
alter table public.enrollments
  add column if not exists campus text null;

-- 2) One-time backfill for enrollment campus metadata
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

-- 3) Document travel buffer policy
comment on table public.enrollments is
  'Travel buffer policy: 10 minutes minimum gap between classes on the same campus, 20 minutes minimum gap between Main and East campus classes.';

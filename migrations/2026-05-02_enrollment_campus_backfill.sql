-- One-time backfill for enrollment campus metadata
-- Uses course department/title/code to infer campus when campus is null

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

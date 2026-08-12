-- 0012's course/enrollment -> semester_id matching used exact date_trunc('month')
-- equality against semesters.start_date, which only works for month-granular
-- semester rows. It missed multi-month semesters (e.g. "Spring 2026" spans
-- 2026-03-31 through 2026-07-31) where a course's start_date falls inside the
-- range but isn't exactly month-aligned with the semester's own start_date.
-- Also fixes an academic_year inconsistency: 0012 step 1 (deriving semesters from
-- existing course/enrollment dates) computed academic_year differently for its
-- "else" (non-fall) branch than step 5 (the standard-terms seed) did, leaving
-- some Spring/Summer rows with a bare year ("2026") instead of "YYYY-YYYY".

-- 1. Re-match every course/enrollment against semesters by date RANGE instead of
--    exact month-start equality. Prefer the narrowest matching semester if a date
--    somehow falls in more than one range (shouldn't happen with non-overlapping
--    standard terms, but guards against the earlier sparse derived rows overlapping
--    the broader standard-terms rows).
update public.courses c
set semester_id = matched.id
from (
  select distinct on (c2.id) c2.id as course_id, s.id
  from public.courses c2
  join public.semesters s on c2.start_date::date between s.start_date and s.end_date
  order by c2.id, (s.end_date - s.start_date) asc
) matched
where c.id = matched.course_id
  and c.start_date is not null;

update public.enrollments e
set semester_id = matched.id
from (
  select distinct on (e2.id) e2.id as enrollment_id, s.id
  from public.enrollments e2
  join public.semesters s on e2.start_date::date between s.start_date and s.end_date
  order by e2.id, (s.end_date - s.start_date) asc
) matched
where e.id = matched.enrollment_id
  and e.start_date is not null;

-- Fall back to the enrollment's course's semester for any enrollment whose own
-- start_date didn't land in any semester range.
update public.enrollments e
set semester_id = c.semester_id
from public.courses c
where e.semester_id is null
  and e.course_id = c.id
  and c.semester_id is not null;

-- 2. Fix academic_year on the sparse rows 0012 step 1 created directly from data
--    (id prefix distinguishes them from the standard-terms seed, which was already
--    correct) — recompute using the same fall-anchored rule the standard seed used.
update public.semesters
set academic_year = case
  when extract(month from start_date) >= 8
    then extract(year from start_date)::text || '-' || (extract(year from start_date)::int + 1)::text
  else (extract(year from start_date)::int - 1)::text || '-' || extract(year from start_date)::text
end
where academic_year !~ '^\d{4}-\d{4}$';

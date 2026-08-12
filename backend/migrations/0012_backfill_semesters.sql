-- Backfill: derive real semester rows from the existing free-text/startDate data,
-- then point courses/enrollments/invoices at them via semester_id.
-- Purely additive — never deletes or overwrites the legacy text columns, so old
-- code paths keep working untouched during rollout.

-- 1. Create one semester row per distinct "YYYY-MM" month found across course and
--    enrollment start dates (the same granularity getCourseSemester() used to fake),
--    grouped into a Fall/Spring/Summer term label.
with month_buckets as (
  select distinct substring(start_date::text from 1 for 7) as ym
  from public.courses
  where start_date is not null
  union
  select distinct substring(start_date::text from 1 for 7) as ym
  from public.enrollments
  where start_date is not null
),
derived as (
  select
    ym,
    (ym || '-01')::date as month_start,
    extract(month from (ym || '-01')::date)::int as month_num,
    extract(year from (ym || '-01')::date)::int as year_num
  from month_buckets
  where ym ~ '^\d{4}-\d{2}$'
),
labeled as (
  select
    ym,
    case
      when month_num between 1 and 5 then 'Spring ' || year_num
      when month_num between 6 and 7 then 'Summer ' || year_num
      else 'Fall ' || year_num
    end as label,
    case
      when month_num between 8 and 12 then (year_num || '-' || (year_num + 1))
      else ((year_num - 1) || '-' || year_num)
    end as academic_year_fall_based,
    year_num::text as academic_year_plain,
    month_num,
    month_start
  from derived
)
insert into public.semesters (id, label, academic_year, start_date, end_date, status)
select
  'SEM-' || upper(replace(replace(label, ' ', '-'), '--', '-')),
  label,
  case when month_num between 8 and 12 then academic_year_fall_based else academic_year_plain end,
  month_start,
  (month_start + interval '4 months')::date,
  case
    when month_start > current_date then 'upcoming'
    when month_start + interval '4 months' < current_date then 'closed'
    else 'active'
  end
from labeled
on conflict (id) do nothing;

-- 2. Point courses at their derived semester via the same month-bucket key.
update public.courses c
set semester_id = s.id
from public.semesters s
where c.semester_id is null
  and c.start_date is not null
  and s.start_date = date_trunc('month', c.start_date)::date;

-- 3. Point enrollments at their derived semester: prefer the enrollment's own
--    start_date, fall back to its course's start_date (mirrors the old
--    getCourseSemester()-as-fallback behavior in enrollments.ts).
update public.enrollments e
set semester_id = s.id
from public.semesters s
where e.semester_id is null
  and e.start_date is not null
  and s.start_date = date_trunc('month', e.start_date)::date;

update public.enrollments e
set semester_id = s.id
from public.courses c
join public.semesters s on s.id = c.semester_id
where e.semester_id is null
  and e.course_id = c.id
  and c.semester_id is not null;

-- 4. students.year_level: parse the legacy "Year N" / "N" free-text currentSemester
--    into a real integer year-level (1-6), the same regex every duplicate
--    deriveCurrentYear() implementation in the codebase used.
update public.students
set year_level = (regexp_match(current_semester, '^(?:year\s*)?(\d+)$', 'i'))[1]::integer
where year_level is null
  and current_semester ~* '^(?:year\s*)?\d+$';

-- 5. Seed a standard set of Fall/Spring/Summer terms spanning one year back and two
--    years forward from today, so the admin Semester management UI has real, usable
--    terms to assign right away instead of only the 1-2 rows the backfill above found
--    from sparse existing course/enrollment dates.
with academic_years as (
  select generate_series(
    extract(year from current_date)::int - 1,
    extract(year from current_date)::int + 2
  ) as y
),
standard_terms as (
  select 'Fall ' || y as label, make_date(y, 8, 15) as start_date, make_date(y, 12, 20) as end_date, (y || '-' || (y + 1)) as academic_year from academic_years
  union all
  select 'Spring ' || y, make_date(y, 1, 10), make_date(y, 5, 20), ((y - 1) || '-' || y) from academic_years
  union all
  select 'Summer ' || y, make_date(y, 6, 1), make_date(y, 7, 25), ((y - 1) || '-' || y) from academic_years
)
insert into public.semesters (id, label, academic_year, start_date, end_date, status)
select
  'SEM-' || upper(replace(label, ' ', '-')),
  label,
  academic_year,
  start_date,
  end_date,
  case
    when start_date > current_date then 'upcoming'
    when end_date < current_date then 'closed'
    else 'active'
  end
from standard_terms
on conflict (id) do nothing;

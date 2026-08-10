-- Alternative enrollment seed: department/program matching
-- Use this instead of round-robin enrollment assignment.
-- Prerequisite: courses already seeded (e.g. COURSE-SEED-* from seed_courses_departments_enrollments.sql)
-- Safe to re-run.

begin;

with seeded_courses as (
  select
    c.id as course_id,
    c.title as course_title,
    c.code as course_code,
    c.professor_id,
    c.professor_name,
    c.start_date,
    c.end_date,
    c.price,
    c.schedule,
    lower(coalesce(c.department, '')) as department_norm,
    case
      when lower(coalesce(c.department, '')) like '%computer%' then 'cs'
      when lower(coalesce(c.department, '')) like '%data%' then 'ds'
      when lower(coalesce(c.department, '')) like '%business%'
        or lower(coalesce(c.department, '')) like '%econom%'
        or lower(coalesce(c.department, '')) like '%finance%'
        or lower(coalesce(c.department, '')) like '%account%'
        or lower(coalesce(c.department, '')) like '%management%'
        or lower(coalesce(c.department, '')) like '%marketing%'
      then 'biz'
      else 'other'
    end as dept_key
  from courses c
  where c.id like 'COURSE-SEED-%'
),
student_pool as (
  select
    s.id as student_id,
    lower(coalesce(s.program, '')) as program_norm,
    coalesce(s.status, 'active') as status
  from students s
  where coalesce(s.status, 'active') = 'active'
),
matched_pairs as (
  select
    sp.student_id,
    sc.course_id,
    sc.course_title,
    sc.course_code,
    sc.professor_id,
    sc.professor_name,
    sc.start_date,
    sc.end_date,
    sc.price,
    sc.schedule,
    row_number() over (partition by sp.student_id order by sc.course_id) as rn_per_student
  from student_pool sp
  join seeded_courses sc on (
    (sc.dept_key = 'cs' and (
      sp.program_norm like '%computer%'
      or sp.program_norm like '%software%'
      or sp.program_norm like '%informatics%'
      or sp.program_norm like '%engineering%'
    ))
    or
    (sc.dept_key = 'ds' and (
      sp.program_norm like '%data%'
      or sp.program_norm like '%statistics%'
      or sp.program_norm like '%machine learning%'
    ))
    or
    (sc.dept_key = 'biz' and (
      sp.program_norm like '%business%'
      or sp.program_norm like '%econom%'
      or sp.program_norm like '%finance%'
      or sp.program_norm like '%account%'
      or sp.program_norm like '%management%'
      or sp.program_norm like '%marketing%'
      or sp.program_norm like '%banking%'
      or sp.program_norm like '%commerce%'
    ))
  )
),
selected_pairs as (
  -- Keep at most 2 matched courses per student for a balanced load.
  select *
  from matched_pairs
  where rn_per_student <= 2
),
numbered as (
  select
    sp.*,
    row_number() over (order by sp.student_id, sp.course_id) as seq
  from selected_pairs sp
),
to_insert as (
  select
    'ENR-MATCH-' || lpad(n.seq::text, 5, '0') as id,
    coalesce(n.course_code, 'SEED') || '-M-' || lpad(n.seq::text, 3, '0') as display_id,
    n.student_id,
    n.course_id,
    n.course_title,
    n.professor_id,
    n.professor_name,
    'active'::enrollment_status as status,
    n.start_date,
    n.end_date,
    n.price,
    n.price as base_price,
    null::text as coupon_code,
    null::numeric as discount_percent,
    null::numeric as discount_amount,
    now() as created_at,
    now() as updated_at,
    to_char(now(), 'YYYY-MM') as semester,
    false as tuition_charged,
    null::timestamptz as charged_at,
    false as payment_verified,
    null::text as approved_by_user_id,
    null::text as approved_by_name,
    null::user_role as approved_by_role,
    null::timestamptz as approved_at,
    n.schedule as course_schedule,
    n.course_code,
    null::text as course_branch
  from numbered n
  where not exists (
    select 1
    from enrollments e
    where e.student_id = n.student_id
      and e.course_id = n.course_id
      and e.status in ('pending','pendingSupervisorApproval','pendingAdvisorApproval','pending_approval','active','waitlisted','completed')
  )
)
insert into enrollments (
  id, display_id, student_id, course_id, course_title, professor_id, professor_name,
  status, start_date, end_date, price, base_price, coupon_code, discount_percent, discount_amount,
  created_at, updated_at, semester, tuition_charged, charged_at, payment_verified,
  approved_by_user_id, approved_by_name, approved_by_role, approved_at,
  course_schedule, course_code, course_branch
)
select
  id, display_id, student_id, course_id, course_title, professor_id, professor_name,
  status, start_date, end_date, price, base_price, coupon_code, discount_percent, discount_amount,
  created_at, updated_at, semester, tuition_charged, charged_at, payment_verified,
  approved_by_user_id, approved_by_name, approved_by_role, approved_at,
  course_schedule, course_code, course_branch
from to_insert
on conflict (id) do nothing;

commit;

-- Seed connected departments, courses, schedules, and enrollments
-- Safe to re-run (upserts + conflict guards)

begin;

-- 1) Ensure academic structure table exists for department/major definitions.
create table if not exists academic_structure (
  id text primary key,
  enrollment_open boolean not null default true,
  enrollment_message text,
  departments jsonb not null default '[]'::jsonb,
  campuses jsonb not null default '[]'::jsonb,
  majors jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) Upsert global departments + majors and connect majors to seeded course IDs.
with incoming as (
  select
    'global'::text as id,
    true as enrollment_open,
    null::text as enrollment_message,
    '[
      {"id":"dept-cs","name":"Computer Science"},
      {"id":"dept-ds","name":"Data Science"},
      {"id":"dept-biz","name":"Business Administration"}
    ]'::jsonb as departments,
    '[
      {"id":"campus-main","name":"Main Campus"},
      {"id":"campus-north","name":"East Campus"}
    ]'::jsonb as campuses,
    '[
      {"id":"major-se","name":"Software Engineering","departmentId":"dept-cs","years":4,"subjects":["Programming","Databases","Software Architecture"],"courseIds":["COURSE-SEED-0001","COURSE-SEED-0002"]},
      {"id":"major-ds","name":"Applied Data Science","departmentId":"dept-ds","years":4,"subjects":["Statistics","Machine Learning","Data Engineering"],"courseIds":["COURSE-SEED-0003","COURSE-SEED-0004"]},
      {"id":"major-ba","name":"Digital Business","departmentId":"dept-biz","years":3,"subjects":["Accounting","Marketing","Business Analytics"],"courseIds":["COURSE-SEED-0005","COURSE-SEED-0006"]}
    ]'::jsonb as majors
),
existing as (
  select *
  from academic_structure
  where id = 'global'
),
merged as (
  select
    i.id,
    i.enrollment_open,
    i.enrollment_message,
    coalesce(
      (
        select jsonb_agg(distinct elem)
        from (
          select jsonb_array_elements(coalesce(e.departments, '[]'::jsonb)) as elem
          from existing e
          union all
          select jsonb_array_elements(i.departments) as elem
        ) d
      ),
      '[]'::jsonb
    ) as departments,
        coalesce(
          (
            select jsonb_agg(distinct elem)
            from (
              select jsonb_array_elements(coalesce(e.campuses, '[]'::jsonb)) as elem
              from existing e
              union all
              select jsonb_array_elements(i.campuses) as elem
            ) c
          ),
          '[]'::jsonb
        ) as campuses,
    coalesce(
      (
        select jsonb_agg(distinct elem)
        from (
          select jsonb_array_elements(coalesce(e.majors, '[]'::jsonb)) as elem
          from existing e
          union all
          select jsonb_array_elements(i.majors) as elem
        ) m
      ),
      '[]'::jsonb
    ) as majors
  from incoming i
  left join existing e on true
)
insert into academic_structure (id, enrollment_open, enrollment_message, departments, campuses, majors, updated_at)
select id, enrollment_open, enrollment_message, departments, campuses, majors, now()
from merged
on conflict (id) do update
set
  enrollment_open = excluded.enrollment_open,
  enrollment_message = excluded.enrollment_message,
  departments = excluded.departments,
  campuses = excluded.campuses,
  majors = excluded.majors,
  updated_at = now();

-- 3) Choose available professors from existing data.
insert into professors (
  id,
  first_name,
  last_name,
  email,
  phone,
  department,
  specialization,
  status,
  created_at,
  updated_at
)
select
  u.id,
  coalesce(nullif(split_part(coalesce(u.full_name, ''), ' ', 1), ''), initcap(split_part(u.username, '.', 1)), 'Professor') as first_name,
  coalesce(
    nullif(trim(regexp_replace(coalesce(u.full_name, ''), '^\S+\s*', '')), ''),
    initcap(split_part(split_part(u.username, '.', 2), '@', 1)),
    'Staff'
  ) as last_name,
  lower(u.email),
  coalesce(u.phone, ''),
  coalesce(nullif(u.department, ''), 'General'),
  coalesce(nullif(u.department, ''), 'General'),
  'active'::professor_status,
  now(),
  now()
from users u
where u.role = 'professor'
on conflict (id) do update
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  phone = excluded.phone,
  department = excluded.department,
  specialization = excluded.specialization,
  status = excluded.status,
  updated_at = now();

update users
set professor_id = id
where role = 'professor'
  and (professor_id is null or professor_id = '');

with professor_pool as (
  select
    id,
    trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')) as professor_name,
    row_number() over (order by id) as rn
  from professors
),
fallback_professor as (
  select
    (select id from professor_pool where rn = 1) as id,
    (select professor_name from professor_pool where rn = 1) as professor_name
),
course_seed as (
  select * from (
    values
      ('COURSE-SEED-0001','SE201-A','Advanced Software Engineering','SE201',1,40,1300,'Computer Science','Main Campus','Lab CS-201','semester 3',now() + interval '5 day',now() + interval '120 day','[{"day":"monday","startTime":"09:00","endTime":"10:30","location":"Lab CS-201","department":"Computer Science","branch":"Main Campus"},{"day":"wednesday","startTime":"09:00","endTime":"10:30","location":"Lab CS-201","department":"Computer Science","branch":"Main Campus"}]'::jsonb),
      ('COURSE-SEED-0002','SE220-B','Cloud Application Development','SE220',2,35,1250,'Computer Science','Main Campus','Room CS-105','semester 3',now() + interval '6 day',now() + interval '118 day','[{"day":"tuesday","startTime":"11:00","endTime":"12:30","location":"Room CS-105","department":"Computer Science","branch":"Main Campus"},{"day":"thursday","startTime":"11:00","endTime":"12:30","location":"Room CS-105","department":"Computer Science","branch":"Main Campus"}]'::jsonb),
      ('COURSE-SEED-0003','DS210-A','Machine Learning Foundations','DS210',3,30,1400,'Data Science','North Campus','Room DS-301','semester 4',now() + interval '7 day',now() + interval '125 day','[{"day":"monday","startTime":"13:00","endTime":"14:30","location":"Room DS-301","department":"Data Science","branch":"North Campus"},{"day":"friday","startTime":"13:00","endTime":"14:30","location":"Room DS-301","department":"Data Science","branch":"North Campus"}]'::jsonb),
      ('COURSE-SEED-0004','DS240-C','Data Warehousing and BI','DS240',1,28,1350,'Data Science','North Campus','Room DS-220','semester 4',now() + interval '8 day',now() + interval '122 day','[{"day":"wednesday","startTime":"15:00","endTime":"16:30","location":"Room DS-220","department":"Data Science","branch":"North Campus"},{"day":"thursday","startTime":"15:00","endTime":"16:30","location":"Room DS-220","department":"Data Science","branch":"North Campus"}]'::jsonb),
      ('COURSE-SEED-0005','BA205-A','Digital Marketing Strategy','BA205',2,45,1100,'Business Administration','Main Campus','Room BA-110','semester 2',now() + interval '5 day',now() + interval '110 day','[{"day":"tuesday","startTime":"09:00","endTime":"10:30","location":"Room BA-110","department":"Business Administration","branch":"Main Campus"},{"day":"friday","startTime":"09:00","endTime":"10:30","location":"Room BA-110","department":"Business Administration","branch":"Main Campus"}]'::jsonb),
      ('COURSE-SEED-0006','BA230-B','Business Analytics in Practice','BA230',3,40,1150,'Business Administration','Main Campus','Room BA-203','semester 3',now() + interval '9 day',now() + interval '126 day','[{"day":"monday","startTime":"11:00","endTime":"12:30","location":"Room BA-203","department":"Business Administration","branch":"Main Campus"},{"day":"thursday","startTime":"11:00","endTime":"12:30","location":"Room BA-203","department":"Business Administration","branch":"Main Campus"}]'::jsonb)
  ) as t(
    id, display_id, title, code, prof_slot, capacity, price, department, branch, location,
    semester_token, start_date, end_date, schedule
  )
),
resolved_courses as (
  select
    c.id,
    c.display_id,
    c.title,
    c.code,
    coalesce(p.id, f.id) as professor_id,
    coalesce(p.professor_name, f.professor_name) as professor_name,
    split_part(c.display_id, '-', 2) as section_id,
    c.capacity,
    c.start_date,
    c.end_date,
    c.price,
    c.department,
    c.branch,
    c.location,
    c.schedule,
    array[lower(c.department)]::text[] as eligible_programs,
    array['engineering','business']::text[] as eligible_faculties,
    array[c.semester_token]::text[] as eligible_semesters,
    true as enrollment_open,
    now() - interval '2 day' as enrollment_opens_at,
    now() + interval '20 day' as enrollment_closes_at,
    now() - interval '2 day' as enrollment_open_at,
    now() + interval '20 day' as enrollment_close_at,
    null::text as enrollment_status_note
  from course_seed c
  left join professor_pool p on p.rn = c.prof_slot
  cross join fallback_professor f
)
insert into courses (
  id, display_id, title, code, professor_id, professor_name, section_id, capacity,
  start_date, end_date, price, department, branch, location,
  schedule, eligible_programs, eligible_faculties, eligible_semesters,
  enrollment_open, enrollment_opens_at, enrollment_closes_at, enrollment_open_at, enrollment_close_at, enrollment_status_note
)
select
  id, display_id, title, code, professor_id, professor_name, section_id, capacity,
  start_date, end_date, price, department, branch, location,
  schedule, eligible_programs, eligible_faculties, eligible_semesters,
  enrollment_open, enrollment_opens_at, enrollment_closes_at, enrollment_open_at, enrollment_close_at, enrollment_status_note
from resolved_courses
on conflict (id) do update set
  display_id = excluded.display_id,
  title = excluded.title,
  code = excluded.code,
  professor_id = excluded.professor_id,
  professor_name = excluded.professor_name,
  section_id = excluded.section_id,
  capacity = excluded.capacity,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  price = excluded.price,
  department = excluded.department,
  branch = excluded.branch,
  location = excluded.location,
  schedule = excluded.schedule,
  eligible_programs = excluded.eligible_programs,
  eligible_faculties = excluded.eligible_faculties,
  eligible_semesters = excluded.eligible_semesters,
  enrollment_open = excluded.enrollment_open,
  enrollment_opens_at = excluded.enrollment_opens_at,
  enrollment_closes_at = excluded.enrollment_closes_at,
  enrollment_open_at = excluded.enrollment_open_at,
  enrollment_close_at = excluded.enrollment_close_at,
  enrollment_status_note = excluded.enrollment_status_note;

-- 4) Assign existing students to seeded courses (round-robin), skipping duplicates.
with existing_students as (
  select
    s.id as student_id,
    row_number() over (order by s.id) as rn
  from students s
  where coalesce(s.status, 'active') = 'active'
  limit 18
),
seeded_courses as (
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
    row_number() over (order by c.id) as rn
  from courses c
  where c.id like 'COURSE-SEED-%'
),
pairings as (
  select
    st.student_id,
    sc.course_id,
    sc.course_title,
    sc.course_code,
    sc.professor_id,
    sc.professor_name,
    sc.start_date,
    sc.end_date,
    sc.price,
    sc.schedule,
    row_number() over (order by st.student_id, sc.course_id) as seq
  from existing_students st
  join seeded_courses sc
    on ((st.rn - 1) % (select greatest(count(*), 1) from seeded_courses)) + 1 = sc.rn
   or ((st.rn) % (select greatest(count(*), 1) from seeded_courses)) + 1 = sc.rn
),
to_insert as (
  select
    'ENR-SEED-' || lpad(seq::text, 4, '0') as id,
    coalesce(course_code, 'SEED') || '-' || lpad(seq::text, 3, '0') as display_id,
    student_id,
    course_id,
    course_title,
    professor_id,
    professor_name,
    'active'::enrollment_status as status,
    start_date,
    end_date,
    price,
    price as base_price,
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
    schedule as course_schedule,
    course_code,
    null::text as course_branch
  from pairings p
  where not exists (
    select 1
    from enrollments e
    where e.student_id = p.student_id
      and e.course_id = p.course_id
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

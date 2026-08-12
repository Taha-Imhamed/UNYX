-- =========================================================
-- ALL ROOT SQL — COMBINED
-- Merges every loose .sql file that lived at repo root (unyt-main/)
-- into one file, in dependency order. NOT run against any DB by
-- this merge — assembled only. Review before executing anywhere.
--
-- Source files, in the order they appear below:
--   1. user.sql (or the users seed block from users.md)          -- not present at merge time, see note
--   2. add_missing_student_columns.sql
--   3. seed_courses_departments_enrollments.sql
--   4. make_class.sql
--   5. seed_software_engineering_courses.sql
--   6. seed_enrollments_department_matching.sql
--   7. simulation_seed.sql (SQL portion only)
--
-- Each section is wrapped with its own BEGIN/COMMIT if the source
-- file had one. Sections without one (DDL-only files) run outside
-- an explicit transaction, same as the originals.
--
-- Full descriptions of each file: see docs/SQL_FILES.md
-- Seed run order + demo creds: see docs/SEED_DATA.md
-- =========================================================


-- =========================================================
-- NOTE: user.sql was not present in the root at merge time
-- (2026-08-12) — only 6 loose .sql files were found. The users
-- mega-seed it would have contributed is already covered by the
-- SQL block preserved in docs/_archive/users.md, and the verified
-- live credential table is in docs/SEED_DATA.md. If user.sql
-- reappears, prepend it here before section 2 (it must run before
-- any script that references existing users/professors).
-- =========================================================


-- =========================================================
-- SECTION 1 / source: add_missing_student_columns.sql
-- Add missing student profile columns so Add/Edit Student form data persists.
-- Safe to run multiple times.
-- =========================================================

alter table if exists students add column if not exists middle_name text;
alter table if exists students add column if not exists major text;
alter table if exists students add column if not exists gender text;
alter table if exists students add column if not exists nationality text;
alter table if exists students add column if not exists national_id text;
alter table if exists students add column if not exists passport_number text;
alter table if exists students add column if not exists blood_type text;
alter table if exists students add column if not exists city text;
alter table if exists students add column if not exists postal_code text;
alter table if exists students add column if not exists emergency_contact_name text;
alter table if exists students add column if not exists emergency_contact_phone text;
alter table if exists students add column if not exists mother_name text;
alter table if exists students add column if not exists father_name text;

-- Optional: helpful indexes for common filters/searches
create index if not exists idx_students_major on students (major);
create index if not exists idx_students_city on students (city);
create index if not exists idx_students_nationality on students (nationality);


-- =========================================================
-- SECTION 2 / source: seed_courses_departments_enrollments.sql
-- Seed connected departments, courses, schedules, and enrollments
-- Safe to re-run (upserts + conflict guards)
-- =========================================================

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


-- =========================================================
-- SECTION 3 / source: make_class.sql
-- Create relational tables for campuses and classes, and backfill from academic_structure JSONB.
-- =========================================================

-- Create campuses table
CREATE TABLE IF NOT EXISTS campuses (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id text PRIMARY KEY,
  campus_id text NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Robust backfill: detect where the campuses array lives and backfill campuses and classes
DO $$
DECLARE
  var_json jsonb;
  campuses_json jsonb := NULL;
  campus jsonb;
  cls jsonb;
  campus_id text;
  campus_name text;
  cls_id text;
  cls_name text;
  col_rec record;
BEGIN
  -- If a direct column named campuses exists, use it.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'academic_structure' AND column_name = 'campuses'
  ) THEN
    BEGIN
      SELECT campuses::jsonb INTO campuses_json FROM academic_structure WHERE id = 'global' LIMIT 1;
    EXCEPTION WHEN undefined_column THEN
      campuses_json := NULL;
    END;
  ELSE
    -- Otherwise search for any json/jsonb column that contains a top-level 'campuses' key.
    FOR col_rec IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'academic_structure' AND data_type IN ('json','jsonb')
    LOOP
      BEGIN
        EXECUTE format('SELECT %I FROM academic_structure WHERE id = %L', col_rec.column_name, 'global') INTO var_json;
      EXCEPTION WHEN others THEN
        var_json := NULL;
      END;
      IF var_json IS NOT NULL THEN
        campuses_json := var_json -> 'campuses';
        IF campuses_json IS NOT NULL AND jsonb_typeof(campuses_json) = 'array' THEN
          EXIT;
        ELSE
          campuses_json := NULL;
        END IF;
      END IF;
    END LOOP;
  END IF;

  IF campuses_json IS NULL THEN
    campuses_json := '[]'::jsonb;
  END IF;

  -- Insert or update campuses and any nested classes
  FOR campus IN SELECT jsonb_array_elements(coalesce(campuses_json, '[]'::jsonb)) LOOP
    campus_id := campus->> 'id';
    campus_name := campus->> 'name';
    IF campus_name IS NULL OR trim(campus_name) = '' THEN
      CONTINUE;
    END IF;
    IF campus_id IS NULL OR trim(campus_id) = '' THEN
      campus_id := 'campus-' || regexp_replace(lower(campus_name), '\\s+', '-', 'g');
    END IF;
    INSERT INTO campuses(id, name, created_at, updated_at)
    VALUES (campus_id, campus_name, now(), now())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

    -- backfill classes nested inside this campus element, if any
    FOR cls IN SELECT jsonb_array_elements(coalesce(campus->'classes', '[]'::jsonb)) LOOP
      cls_name := cls->> 'name';
      IF cls_name IS NULL OR trim(cls_name) = '' THEN
        CONTINUE;
      END IF;
      cls_id := cls->> 'id';
      IF cls_id IS NULL OR trim(cls_id) = '' THEN
        cls_id := 'class-' || substr(md5(campus_id || '::' || cls_name), 1, 12);
      END IF;
      INSERT INTO classes(id, campus_id, name, created_at, updated_at)
      VALUES (cls_id, campus_id, cls_name, now(), now())
      ON CONFLICT (id) DO UPDATE SET campus_id = EXCLUDED.campus_id, name = EXCLUDED.name, updated_at = now();
    END LOOP;
  END LOOP;
END$$;

-- Optional: index for faster lookup
CREATE INDEX IF NOT EXISTS idx_classes_campus_id ON classes(campus_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campuses' AND column_name = 'name'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_campuses_name ON campuses(lower(name))';
  END IF;
END$$;


-- =========================================================
-- SECTION 4 / source: seed_software_engineering_courses.sql
-- Software Engineering curriculum seed
-- Uses the course list you provided (core + electives)
-- Safe to re-run.
-- =========================================================

begin;

with professor_pool as (
  select
    id,
    coalesce(nullif(full_name, ''), username, id) as professor_name,
    row_number() over (order by id) as rn
  from users
  where role = 'professor'
),
professor_count as (
  select greatest(count(*), 1) as total from professor_pool
),
curriculum as (
  select * from (
    values
      -- First Year / First Semester
      ('CS 101', 'Computer Ethics', 8, 1, 'semester 1', false),
      ('CS 102', 'Computer Applications', 6, 1, 'semester 1', false),
      ('MATH 101', 'Calculus I', 6, 1, 'semester 1', false),
      ('ENG 101', 'Composition I', 6, 1, 'semester 1', false),
      ('FL 101', 'Foreign Language I', 4, 1, 'semester 1', false),

      -- First Year / Second Semester
      ('CS 104', 'Introduction to Programming', 8, 2, 'semester 2', false),
      ('CS 103', 'Introduction to Computer Science', 6, 2, 'semester 2', false),
      ('MATH 102', 'Calculus II', 6, 2, 'semester 2', false),
      ('ENG 102', 'Composition II', 6, 2, 'semester 2', false),
      ('FL 102', 'Foreign Language II', 4, 2, 'semester 2', false),

      -- Second Year / First Semester
      ('CS 201', 'Object Oriented Programming with Java', 6, 3, 'semester 3', false),
      ('CS 202', 'Computer Organization and System Architecture', 6, 3, 'semester 3', false),
      ('CS 203', 'Database Systems', 6, 3, 'semester 3', false),
      ('MATH 201', 'Discrete Mathematics', 6, 3, 'semester 3', false),
      ('SE 201', 'Programming in C# Net', 6, 3, 'semester 3', false),

      -- Second Year / Second Semester
      ('SE 202', 'Mobile Application Development', 8, 4, 'semester 4', false),
      ('CS 207', 'System Analysis and Design', 6, 4, 'semester 4', false),
      ('CS 208', 'Data Structures', 6, 4, 'semester 4', false),
      ('EDF 201', 'Elective in Department/Faculty Level I', 6, 4, 'semester 4', false),
      ('INT 299', 'Internship', 4, 4, 'semester 4', false),

      -- Third Year / First Semester
      ('SE 301', 'Software Engineering', 8, 5, 'semester 5', false),
      ('CS 302', 'Web Systems Development', 6, 5, 'semester 5', false),
      ('CS 303', 'Data Communications and Networking', 6, 5, 'semester 5', false),
      ('CS 304', 'Operating Systems', 6, 5, 'semester 5', false),
      ('EDF 202', 'Elective in Department/Faculty Level II', 4, 5, 'semester 5', false),

      -- Third Year / Second Semester
      ('EUL 201', 'Elective in University Level', 4, 6, 'semester 6', false),
      ('EDF 203', 'Elective in Department/Faculty Level III', 6, 6, 'semester 6', false),
      ('RMAS 333', 'Research Methods in Applied Sciences', 6, 6, 'semester 6', false),
      ('CS 305', 'Advanced Java', 6, 6, 'semester 6', false),
      ('GP 399', 'Graduation Project', 8, 6, 'semester 6', false),

      -- Elective Courses (Department/Faculty + University level list)
      ('BI 201', 'Management Information Systems', 6, 7, 'elective', true),
      ('BI 301', 'Business Information Systems', 6, 7, 'elective', true),
      ('CS 310', 'System Administration', 4, 7, 'elective', true),
      ('BI 302', 'Project Management in Information Technology', 4, 7, 'elective', true),
      ('CS 309', 'Network Administration and Management', 6, 7, 'elective', true),
      ('SE 210', 'Artificial Intelligence', 6, 7, 'elective', true),
      ('SE 211', 'Intro to Machine Learning', 6, 7, 'elective', true),
      ('CS 320', 'Virtualization and Cloud Computing', 4, 7, 'elective', true)
  ) as t(code, title, ects, term_order, semester_token, is_elective)
),
normalized as (
  select
    c.*,
    row_number() over (order by c.term_order, c.code, c.title) as row_no,
    -- Stable deterministic ID so reruns update same course
    'COURSE-SE-' || upper(substr(md5(c.code || '|' || c.title), 1, 8)) as id,
    replace(c.code, ' ', '') || '-A' as display_id,
    replace(c.code, ' ', '') as normalized_code
  from curriculum c
),
resolved as (
  select
    n.id,
    n.display_id,
    n.title,
    n.code,
    coalesce(pp.id, 'USR-PRO-1001') as professor_id,
    coalesce(pp.professor_name, 'Dr Hassan Alami') as professor_name,
    'A'::text as section_id,
    case when n.is_elective then 50 else 40 end as capacity,
    (now() + ((n.term_order + 3) || ' days')::interval) as start_date,
    (now() + ((n.term_order + 120) || ' days')::interval) as end_date,
    (n.ects * 180)::numeric as price,
    'Computer Science'::text as department,
    'Faculty of Engineering and Architecture'::text as branch,
    case
      when n.term_order % 3 = 1 then 'SE Lab 201'
      when n.term_order % 3 = 2 then 'SE Room 105'
      else 'SE Hall 3'
    end as location,
    case
      when n.term_order % 3 = 1 then jsonb_build_array(
        jsonb_build_object('day','monday','startTime','09:00','endTime','10:30','location','SE Lab 201','department','Computer Science','branch','Faculty of Engineering and Architecture'),
        jsonb_build_object('day','wednesday','startTime','09:00','endTime','10:30','location','SE Lab 201','department','Computer Science','branch','Faculty of Engineering and Architecture')
      )
      when n.term_order % 3 = 2 then jsonb_build_array(
        jsonb_build_object('day','tuesday','startTime','11:00','endTime','12:30','location','SE Room 105','department','Computer Science','branch','Faculty of Engineering and Architecture'),
        jsonb_build_object('day','thursday','startTime','11:00','endTime','12:30','location','SE Room 105','department','Computer Science','branch','Faculty of Engineering and Architecture')
      )
      else jsonb_build_array(
        jsonb_build_object('day','friday','startTime','13:00','endTime','14:30','location','SE Hall 3','department','Computer Science','branch','Faculty of Engineering and Architecture')
      )
    end as schedule,
    array['software engineering']::text[] as eligible_programs,
    array['faculty of engineering and architecture']::text[] as eligible_faculties,
    array[n.semester_token]::text[] as eligible_semesters,
    true as enrollment_open,
    now() - interval '3 day' as enrollment_opens_at,
    now() + interval '30 day' as enrollment_closes_at,
    now() - interval '3 day' as enrollment_open_at,
    now() + interval '30 day' as enrollment_close_at,
    ('ECTS: ' || n.ects::text || case when n.is_elective then ' | Elective course' else '' end) as enrollment_status_note
  from normalized n
  cross join professor_count pc
  left join professor_pool pp
    on pp.rn = ((n.row_no - 1) % pc.total) + 1
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
from resolved
on conflict (id) do update
set
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

commit;


-- =========================================================
-- SECTION 5 / source: seed_enrollments_department_matching.sql
-- Alternative enrollment seed: department/program matching
-- Use this instead of round-robin enrollment assignment (Section 2, step 4).
-- Prerequisite: courses already seeded (e.g. COURSE-SEED-* from Section 2)
-- Safe to re-run.
-- =========================================================

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


-- =========================================================
-- SECTION 6 / source: simulation_seed.sql (SQL portion only)
-- UNYT simulation seed
-- Adds realistic student/year/advisor/professor/finance/registration relationships.
-- Safe to re-run.
--
-- NOTE: the original simulation_seed.sql had ~280 lines of non-SQL
-- content appended after its last statement (an AI QA-testing agent
-- prompt, not database code). That content is excluded here — it is
-- not valid SQL and would break execution. See docs/SQL_FILES.md.
-- =========================================================

create table if not exists registration_state (
  id text primary key,
  is_open boolean not null default false,
  blocked_reason text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists maintenance_state (
  id text primary key,
  enabled boolean not null default false,
  message text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists id_card_access (
  id text primary key,
  holder_name text not null,
  holder_type text not null,
  card_number text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null,
  notes text
);

create table if not exists sso_config (
  id text primary key,
  provider text not null,
  client_id text not null,
  issuer_url text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists device_logs (
  id text primary key,
  device_name text not null,
  ip_address text,
  event_type text not null,
  created_at timestamptz not null default now(),
  user_id text,
  details text
);

create table if not exists transfer_credits (
  id text primary key,
  student_id text not null,
  source_institution text not null,
  course_title text not null,
  credit_hours integer not null,
  evaluated_by text,
  evaluated_at timestamptz,
  status text not null
);

create table if not exists transcript_requests (
  id text primary key,
  student_id text not null,
  requested_at timestamptz not null default now(),
  delivery_method text not null,
  status text not null,
  notes text
);

create table if not exists graduation_approvals (
  id text primary key,
  student_id text not null,
  program text not null,
  approved_by text,
  approved_at timestamptz,
  status text not null,
  remarks text
);

create table if not exists enrollment_overrides (
  id text primary key,
  student_id text not null,
  course_id text not null,
  reason text,
  approved_by text,
  created_at timestamptz not null default now(),
  status text not null
);

create table if not exists scholarship_awards (
  id text primary key,
  student_id text not null,
  scholarship_name text not null,
  amount numeric(12,2) not null,
  awarded_by text,
  awarded_at timestamptz,
  status text not null,
  notes text
);

create table if not exists interview_schedules (
  id text primary key,
  applicant_name text not null,
  program text not null,
  interviewer text,
  scheduled_at timestamptz,
  status text not null,
  notes text
);

create table if not exists offer_letters (
  id text primary key,
  applicant_name text not null,
  program text not null,
  issued_at timestamptz,
  status text not null,
  expiration_date timestamptz,
  notes text
);

create table if not exists student_profiles_extra (
  student_id text primary key,
  year_level text not null,
  advisor_id text,
  advisor_name text,
  professor_id text,
  professor_name text,
  scholarship_status text not null default 'none',
  payment_status text not null default 'unpaid',
  registration_hold boolean not null default false,
  tuition_balance numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists students add column if not exists year_level text;
alter table if exists students add column if not exists advisor_id text;
alter table if exists students add column if not exists advisor_name text;
alter table if exists students add column if not exists professor_id text;
alter table if exists students add column if not exists professor_name text;
alter table if exists students add column if not exists scholarship_status text;
alter table if exists students add column if not exists payment_status text;
alter table if exists students add column if not exists registration_hold boolean default false;
alter table if exists students add column if not exists tuition_balance numeric(12,2) default 0;

alter table if exists users add column if not exists year_level text;
alter table if exists users add column if not exists advisor_id text;
alter table if exists users add column if not exists advisor_name text;
alter table if exists users add column if not exists professor_id text;
alter table if exists users add column if not exists professor_name text;
alter table if exists users add column if not exists full_name text;
alter table if exists users add column if not exists phone text;
alter table if exists users add column if not exists department text;

insert into registration_state (id, is_open, blocked_reason, updated_at, updated_by)
values
  ('global', true, null, now(), 'USR-REG-1001')
on conflict (id) do update set
  is_open = excluded.is_open,
  blocked_reason = excluded.blocked_reason,
  updated_at = excluded.updated_at,
  updated_by = excluded.updated_by;

with extra_students as (
  select * from (
    values
      ('USR-STU-1001', 'first-year', 'USR-ADV-1001', 'advisor.omer', 'USR-PRO-1001', 'dr.hassan', 'scholarship', 'paid', false, 0, 'First year software engineering student with scholarship'),
      ('USR-STU-1002', 'first-year', 'USR-ADV-1002', 'advisor.nada', 'USR-PRO-1002', 'dr.mira', 'none', 'partial', false, 450, 'First year student with partial payment'),
      ('USR-STU-1003', 'first-year', 'USR-ADV-1003', 'advisor.ledi', 'USR-PRO-1003', 'dr.erjon', 'none', 'unpaid', true, 1200, 'First year student blocked by unpaid fees'),

      ('USR-STU-1004', 'second-year', 'USR-ADV-1001', 'advisor.omer', 'USR-PRO-1001', 'dr.hassan', 'scholarship', 'paid', false, 0, 'Second year student assigned to advisor and professor'),
      ('USR-STU-1005', 'second-year', 'USR-ADV-1002', 'advisor.nada', 'USR-PRO-1002', 'dr.mira', 'none', 'partial', false, 300, 'Second year student with balance remaining'),
      ('USR-STU-1006', 'second-year', 'USR-ADV-1003', 'advisor.ledi', 'USR-PRO-1003', 'dr.erjon', 'none', 'unpaid', true, 1400, 'Second year student with registration hold'),

      ('USR-STU-1007', 'third-year', 'USR-ADV-1001', 'advisor.omer', 'USR-PRO-1001', 'dr.hassan', 'scholarship', 'paid', false, 0, 'Third year student ready for internship and graduation planning'),
      ('USR-STU-1008', 'third-year', 'USR-ADV-1002', 'advisor.nada', 'USR-PRO-1002', 'dr.mira', 'none', 'partial', false, 250, 'Third year student with partial fee payment'),
      ('USR-STU-1009', 'third-year', 'USR-ADV-1003', 'advisor.ledi', 'USR-PRO-1003', 'dr.erjon', 'none', 'unpaid', true, 1600, 'Third year student blocked until fees are settled')
  ) as t(student_id, year_level, advisor_id, advisor_name, professor_id, professor_name, scholarship_status, payment_status, registration_hold, tuition_balance, notes)
)
insert into student_profiles_extra (
  student_id,
  year_level,
  advisor_id,
  advisor_name,
  professor_id,
  professor_name,
  scholarship_status,
  payment_status,
  registration_hold,
  tuition_balance,
  notes
)
select
  s.student_id,
  s.year_level,
  s.advisor_id,
  s.advisor_name,
  s.professor_id,
  s.professor_name,
  s.scholarship_status,
  s.payment_status,
  s.registration_hold,
  s.tuition_balance,
  s.notes
from extra_students s
on conflict (student_id) do update set
  year_level = excluded.year_level,
  advisor_id = excluded.advisor_id,
  advisor_name = excluded.advisor_name,
  professor_id = excluded.professor_id,
  professor_name = excluded.professor_name,
  scholarship_status = excluded.scholarship_status,
  payment_status = excluded.payment_status,
  registration_hold = excluded.registration_hold,
  tuition_balance = excluded.tuition_balance,
  notes = excluded.notes,
  updated_at = now();

update students s
set
  year_level = e.year_level,
  advisor_id = e.advisor_id,
  advisor_name = e.advisor_name,
  professor_id = e.professor_id,
  professor_name = e.professor_name,
  scholarship_status = e.scholarship_status,
  payment_status = e.payment_status,
  registration_hold = e.registration_hold,
  tuition_balance = e.tuition_balance
from student_profiles_extra e
where s.id = e.student_id;

update users u
set
  year_level = e.year_level,
  advisor_id = e.advisor_id,
  advisor_name = e.advisor_name,
  professor_name = e.professor_name
from student_profiles_extra e
where u.id = e.student_id;

with additional_student_accounts as (
  select * from (
    values
      ('USR-STU-1004', 'noah.student', 'noah.student@university.edu', 'Noah Gjoni', '+355680100004', 'Computer Science', 'second-year', 'USR-ADV-1001', 'advisor.omer', 'USR-PRO-1001', 'dr.hassan'),
      ('USR-STU-1005', 'elsa.student', 'elsa.student@university.edu', 'Elsa Muka', '+355680100005', 'Business Administration', 'second-year', 'USR-ADV-1002', 'advisor.nada', 'USR-PRO-1002', 'dr.mira'),
      ('USR-STU-1006', 'ardi.student', 'ardi.student@university.edu', 'Ardi Lika', '+355680100006', 'Data Science', 'second-year', 'USR-ADV-1003', 'advisor.ledi', 'USR-PRO-1003', 'dr.erjon'),
      ('USR-STU-1007', 'mira2.student', 'mira2.student@university.edu', 'Mira Kola', '+355680100007', 'Computer Science', 'third-year', 'USR-ADV-1001', 'advisor.omer', 'USR-PRO-1001', 'dr.hassan'),
      ('USR-STU-1008', 'denis.student', 'denis.student@university.edu', 'Denis Hasa', '+355680100008', 'Business Administration', 'third-year', 'USR-ADV-1002', 'advisor.nada', 'USR-PRO-1002', 'dr.mira'),
      ('USR-STU-1009', 'ana.student', 'ana.student@university.edu', 'Ana Balla', '+355680100009', 'Data Science', 'third-year', 'USR-ADV-1003', 'advisor.ledi', 'USR-PRO-1003', 'dr.erjon')
  ) as t(id, username, email, full_name, phone, department, year_level, advisor_id, advisor_name, professor_id, professor_name)
)
insert into students (
  id,
  display_id,
  first_name,
  last_name,
  email,
  phone,
  photo,
  enrollment_date,
  program,
  status,
  address,
  date_of_birth,
  balance,
  year_level,
  advisor_id,
  advisor_name,
  professor_id,
  professor_name,
  scholarship_status,
  payment_status,
  registration_hold,
  tuition_balance
)
select
  s.id,
  s.id,
  split_part(s.full_name, ' ', 1),
  split_part(s.full_name, ' ', 2),
  s.email,
  s.phone,
  '/placeholder-user.jpg',
  now(),
  s.department,
  'active'::student_status,
  s.department,
  '2002-01-01',
  case when s.year_level = 'first-year' then 0 when s.year_level = 'second-year' then 300 else 600 end,
  s.year_level,
  s.advisor_id,
  s.advisor_name,
  s.professor_id,
  s.professor_name,
  case when s.year_level = 'first-year' then 'awarded' when s.year_level = 'second-year' then 'pending' else 'none' end,
  case when s.year_level = 'first-year' then 'paid' when s.year_level = 'second-year' then 'partial' else 'unpaid' end,
  case when s.year_level = 'third-year' and s.id = 'USR-STU-1009' then true else false end,
  case when s.year_level = 'first-year' then 0 when s.year_level = 'second-year' then 300 else 1600 end
from additional_student_accounts s
where not exists (
  select 1 from students st where st.id = s.id
);

with additional_student_accounts as (
  select * from (
    values
      ('USR-STU-1004', 'noah.student', 'noah.student@university.edu', 'Noah Gjoni', '+355680100004', 'Computer Science', 'second-year', 'USR-ADV-1001', 'advisor.omer', 'USR-PRO-1001', 'dr.hassan'),
      ('USR-STU-1005', 'elsa.student', 'elsa.student@university.edu', 'Elsa Muka', '+355680100005', 'Business Administration', 'second-year', 'USR-ADV-1002', 'advisor.nada', 'USR-PRO-1002', 'dr.mira'),
      ('USR-STU-1006', 'ardi.student', 'ardi.student@university.edu', 'Ardi Lika', '+355680100006', 'Data Science', 'second-year', 'USR-ADV-1003', 'advisor.ledi', 'USR-PRO-1003', 'dr.erjon'),
      ('USR-STU-1007', 'mira2.student', 'mira2.student@university.edu', 'Mira Kola', '+355680100007', 'Computer Science', 'third-year', 'USR-ADV-1001', 'advisor.omer', 'USR-PRO-1001', 'dr.hassan'),
      ('USR-STU-1008', 'denis.student', 'denis.student@university.edu', 'Denis Hasa', '+355680100008', 'Business Administration', 'third-year', 'USR-ADV-1002', 'advisor.nada', 'USR-PRO-1002', 'dr.mira'),
      ('USR-STU-1009', 'ana.student', 'ana.student@university.edu', 'Ana Balla', '+355680100009', 'Data Science', 'third-year', 'USR-ADV-1003', 'advisor.ledi', 'USR-PRO-1003', 'dr.erjon')
  ) as t(id, username, email, full_name, phone, department, year_level, advisor_id, advisor_name, professor_id, professor_name)
)
insert into users (
  id,
  username,
  normalized_username,
  email,
  role,
  created_at,
  last_login,
  status,
  avatar_url,
  password,
  permissions,
  student_id,
  professor_id,
  full_name,
  phone,
  department,
  year_level,
  advisor_id,
  advisor_name,
  professor_name
)
select
  s.id,
  s.username,
  lower(s.username),
  lower(s.email),
  'student'::user_role,
  now(),
  now(),
  'active'::user_status,
  null,
  '$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm',
  '{}'::jsonb,
  s.id,
  null,
  s.full_name,
  s.phone,
  s.department,
  s.year_level,
  s.advisor_id,
  s.advisor_name,
  s.professor_name
from additional_student_accounts s
where not exists (
  select 1 from users u where u.normalized_username = lower(s.username) or u.email = lower(s.email)
);

insert into scholarship_awards (id, student_id, scholarship_name, amount, awarded_by, awarded_at, status, notes)
values
  ('SCH-2001', 'USR-STU-1001', 'Merit Excellence Award', 1500, 'USR-ADM-1001', now(), 'awarded', 'First-year scholarship student'),
  ('SCH-2002', 'USR-STU-1004', 'STEM Excellence Grant', 2000, 'USR-ADM-1002', now(), 'awarded', 'Second-year scholarship coverage'),
  ('SCH-2003', 'USR-STU-1007', 'Graduation Support Grant', 1800, 'USR-ADM-1003', now(), 'pending', 'Third-year student pending finance review')
on conflict (id) do update set
  student_id = excluded.student_id,
  scholarship_name = excluded.scholarship_name,
  amount = excluded.amount,
  awarded_by = excluded.awarded_by,
  awarded_at = excluded.awarded_at,
  status = excluded.status,
  notes = excluded.notes;

insert into enrollment_overrides (id, student_id, course_id, reason, approved_by, created_at, status)
values
  ('OVR-2001', 'USR-STU-1002', 'CS 104', 'Balance pending but registration open for probation case', 'USR-REG-1001', now(), 'pending'),
  ('OVR-2002', 'USR-STU-1005', 'CS 203', 'Advisor approved after payment partial clearance', 'USR-REG-1002', now(), 'approved'),
  ('OVR-2003', 'USR-STU-1009', 'GP 399', 'Graduation project enrollment blocked by unpaid balance', 'USR-REG-1003', now(), 'rejected')
on conflict (id) do update set
  student_id = excluded.student_id,
  course_id = excluded.course_id,
  reason = excluded.reason,
  approved_by = excluded.approved_by,
  created_at = excluded.created_at,
  status = excluded.status;

insert into transfer_credits (id, student_id, source_institution, course_title, credit_hours, evaluated_by, evaluated_at, status)
values
  ('TRN-2001', 'USR-STU-1007', 'Regional College', 'Database Systems', 3, 'USR-REG-1001', now(), 'approved'),
  ('TRN-2002', 'USR-STU-1008', 'City Institute', 'Business Analytics', 4, 'USR-REG-1002', now(), 'pending'),
  ('TRN-2003', 'USR-STU-1009', 'National Technical College', 'Advanced Java', 3, 'USR-REG-1003', now(), 'rejected')
on conflict (id) do update set
  student_id = excluded.student_id,
  source_institution = excluded.source_institution,
  course_title = excluded.course_title,
  credit_hours = excluded.credit_hours,
  evaluated_by = excluded.evaluated_by,
  evaluated_at = excluded.evaluated_at,
  status = excluded.status;

insert into transcript_requests (id, student_id, requested_at, delivery_method, status, notes)
values
  ('TSR-2001', 'USR-STU-1007', now(), 'email', 'ready', 'Third-year transcript request ready'),
  ('TSR-2002', 'USR-STU-1008', now(), 'pickup', 'pending', 'Pending fee clearance'),
  ('TSR-2003', 'USR-STU-1009', now(), 'email', 'blocked', 'Blocked until outstanding balance is paid')
on conflict (id) do update set
  student_id = excluded.student_id,
  requested_at = excluded.requested_at,
  delivery_method = excluded.delivery_method,
  status = excluded.status,
  notes = excluded.notes;

insert into graduation_approvals (id, student_id, program, approved_by, approved_at, status, remarks)
values
  ('GRA-2001', 'USR-STU-1007', 'Computer Science', 'USR-REG-1001', now(), 'approved', 'Eligible for graduation planning'),
  ('GRA-2002', 'USR-STU-1008', 'Business Administration', 'USR-REG-1002', now(), 'pending', 'Awaiting finance confirmation'),
  ('GRA-2003', 'USR-STU-1009', 'Data Science', 'USR-REG-1003', now(), 'blocked', 'Cannot proceed until payment is complete')
on conflict (id) do update set
  student_id = excluded.student_id,
  program = excluded.program,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at,
  status = excluded.status,
  remarks = excluded.remarks;

insert into interview_schedules (id, applicant_name, program, interviewer, scheduled_at, status, notes)
values
  ('INTV-2001', 'Student One', 'Software Engineering', 'admissions.era', now() + interval '2 days', 'scheduled', 'First-year applicant simulation'),
  ('INTV-2002', 'Student Two', 'Computer Science', 'admissions.lorik', now() + interval '3 days', 'scheduled', 'Second-year simulation'),
  ('INTV-2003', 'Student Three', 'Data Science', 'admissions.jona', now() + interval '4 days', 'scheduled', 'Third-year pathway simulation')
on conflict (id) do update set
  applicant_name = excluded.applicant_name,
  program = excluded.program,
  interviewer = excluded.interviewer,
  scheduled_at = excluded.scheduled_at,
  status = excluded.status,
  notes = excluded.notes;

insert into offer_letters (id, applicant_name, program, issued_at, status, expiration_date, notes)
values
  ('OFR-2001', 'Student One', 'Software Engineering', now(), 'issued', now() + interval '14 days', 'Offer generated for simulation'),
  ('OFR-2002', 'Student Two', 'Computer Science', now(), 'draft', null, 'Offer pending review'),
  ('OFR-2003', 'Student Three', 'Data Science', now(), 'issued', now() + interval '10 days', 'Offer tied to scholarship case')
on conflict (id) do update set
  applicant_name = excluded.applicant_name,
  program = excluded.program,
  issued_at = excluded.issued_at,
  status = excluded.status,
  expiration_date = excluded.expiration_date,
  notes = excluded.notes;

insert into device_logs (id, device_name, ip_address, event_type, created_at, user_id, details)
values
  ('DVC-2001', 'Finance Desk Terminal', '10.0.0.40', 'payment-review', now(), 'USR-FIN-1001', 'Reviewed partial payment record'),
  ('DVC-2002', 'Registrar Desktop', '10.0.0.41', 'registration-check', now(), 'USR-REG-1001', 'Checked open registration state'),
  ('DVC-2003', 'Advisor Laptop', '10.0.0.42', 'advisor-assignment', now(), 'USR-ADV-1001', 'Assigned student advisor mapping')
on conflict (id) do update set
  device_name = excluded.device_name,
  ip_address = excluded.ip_address,
  event_type = excluded.event_type,
  created_at = excluded.created_at,
  user_id = excluded.user_id,
  details = excluded.details;

insert into sso_config (id, provider, client_id, issuer_url, enabled, updated_at)
values
  ('SSO-2001', 'Azure AD', 'azure-client-id', 'https://login.microsoftonline.com/common/v2.0', true, now()),
  ('SSO-2002', 'Google Workspace', 'google-client-id', 'https://accounts.google.com', false, now())
on conflict (id) do update set
  provider = excluded.provider,
  client_id = excluded.client_id,
  issuer_url = excluded.issuer_url,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

insert into id_card_access (id, holder_name, holder_type, card_number, issued_at, expires_at, status, notes)
values
  ('IDC-2001', 'Ahmed Rashidi', 'student', 'CARD-1001', now(), now() + interval '1 year', 'active', 'First-year student access card'),
  ('IDC-2002', 'Sara Dervishi', 'student', 'CARD-1002', now(), now() + interval '1 year', 'active', 'Second-year student access card'),
  ('IDC-2003', 'Luka Hoxha', 'student', 'CARD-1003', now(), now() + interval '1 year', 'suspended', 'Blocked until registration clearance')
on conflict (id) do update set
  holder_name = excluded.holder_name,
  holder_type = excluded.holder_type,
  card_number = excluded.card_number,
  issued_at = excluded.issued_at,
  expires_at = excluded.expires_at,
  status = excluded.status,
  notes = excluded.notes;

insert into registration_state (id, is_open, blocked_reason, updated_at, updated_by)
values
  ('first-year-open', true, null, now(), 'USR-REG-1001'),
  ('second-year-open-hold', true, 'Unpaid tuition balance blocks registration', now(), 'USR-REG-1002'),
  ('third-year-closed', false, 'Registration closed by registrar', now(), 'USR-REG-1003')
on conflict (id) do update set
  is_open = excluded.is_open,
  blocked_reason = excluded.blocked_reason,
  updated_at = excluded.updated_at,
  updated_by = excluded.updated_by;

insert into maintenance_state (id, enabled, message, updated_at, updated_by)
values
  ('global', false, 'System online', now(), 'USR-IT-1001')
on conflict (id) do update set
  enabled = excluded.enabled,
  message = excluded.message,
  updated_at = excluded.updated_at,
  updated_by = excluded.updated_by;

-- =========================================================
-- END OF COMBINED FILE
-- =========================================================

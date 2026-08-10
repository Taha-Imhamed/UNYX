-- Software Engineering curriculum seed
-- Uses the course list you provided (core + electives)
-- Safe to re-run.

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

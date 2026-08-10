# Supabase SQL Setup For This Project

This file gives you a PostgreSQL schema for Supabase that matches your current backend models (users, students, professors, courses, enrollments, payments, feedback, news, coupons, questions, site content, notifications, income, expenses).

Run this in Supabase SQL Editor.

```sql
-- =========================================================
-- 1) OPTIONAL EXTENSIONS
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- 2) ENUMS
-- =========================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'supervisor', 'user', 'student', 'professor', 'advisor');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type user_status as enum ('active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'student_status') then
    create type student_status as enum ('active', 'inactive', 'graduated');
  end if;

  if not exists (select 1 from pg_type where typname = 'professor_status') then
    create type professor_status as enum ('active', 'on-leave', 'retired');
  end if;

  if not exists (select 1 from pg_type where typname = 'expense_status') then
    create type expense_status as enum ('pending', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'feedback_type') then
    create type feedback_type as enum ('course', 'facility', 'professor', 'general');
  end if;

  if not exists (select 1 from pg_type where typname = 'feedback_status') then
    create type feedback_status as enum ('new', 'reviewed', 'resolved');
  end if;

  if not exists (select 1 from pg_type where typname = 'feedback_priority') then
    create type feedback_priority as enum ('low', 'normal', 'high');
  end if;

  if not exists (select 1 from pg_type where typname = 'feedback_target_role') then
    create type feedback_target_role as enum ('admin', 'supervisor');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type payment_method as enum ('cash', 'card', 'transfer', 'internal');
  end if;

  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type transaction_type as enum ('credit', 'debit');
  end if;

  if not exists (select 1 from pg_type where typname = 'transaction_source') then
    create type transaction_source as enum ('payment', 'enrollment', 'adjustment');
  end if;

  if not exists (select 1 from pg_type where typname = 'enrollment_status') then
    create type enrollment_status as enum (
      'pending',
      'pendingSupervisorApproval',
      'pendingAdvisorApproval',
      'pending_approval',
      'active',
      'waitlisted',
      'completed',
      'cancelled',
      'rejected',
      'dropped'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'question_status') then
    create type question_status as enum ('open', 'answered');
  end if;
end
$$;

-- =========================================================
-- 3) TABLES
-- =========================================================

create table if not exists students (
  id text primary key,
  display_id text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null default '',
  photo text not null default '/placeholder-user.jpg',
  enrollment_date timestamptz not null default now(),
  program text not null default '',
  program_id text,
  faculty text,
  faculty_id text,
  current_semester text,
  status student_status not null default 'active',
  address text not null default '',
  date_of_birth date,
  balance numeric(12,2) not null default 0,
  supervisor_id text,
  supervisor_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists professors (
  id text primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null default '',
  photo text not null default '/placeholder-user.jpg',
  department text not null default 'General',
  salary numeric(12,2) not null default 0,
  hire_date timestamptz not null default now(),
  specialization text not null default '',
  status professor_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  username text not null,
  normalized_username text not null,
  email text not null,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  last_login timestamptz not null default now(),
  status user_status not null default 'active',
  avatar_url text,
  password text not null,
  permissions jsonb not null default '{}'::jsonb,
  student_id text,
  professor_id text,
  constraint users_username_unique unique (normalized_username),
  constraint users_email_unique unique (email),
  constraint users_student_fk foreign key (student_id) references students(id) on delete set null,
  constraint users_professor_fk foreign key (professor_id) references professors(id) on delete set null
);

create table if not exists courses (
  id text primary key,
  display_id text not null,
  title text not null,
  code text not null,
  professor_id text not null references professors(id) on delete restrict,
  professor_name text not null,
  section_id text,
  capacity integer not null check (capacity >= 0),
  start_date timestamptz not null,
  end_date timestamptz not null,
  price numeric(12,2) not null check (price >= 0),
  department text,
  branch text,
  location text,
  schedule jsonb,
  eligible_programs text[],
  eligible_faculties text[],
  eligible_semesters text[],
  enrollment_open boolean not null default true,
  enrollment_opens_at timestamptz,
  enrollment_closes_at timestamptz,
  enrollment_open_at timestamptz,
  enrollment_close_at timestamptz,
  enrollment_status_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_code_unique unique (code)
);

create table if not exists coupons (
  code text primary key,
  percent numeric(5,2) not null check (percent > 0 and percent <= 100),
  created_at timestamptz not null default now()
);

create table if not exists enrollments (
  id text primary key,
  display_id text not null,
  student_id text not null references students(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  course_title text not null,
  professor_id text not null references professors(id) on delete restrict,
  professor_name text not null,
  status enrollment_status not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  price numeric(12,2) not null check (price >= 0),
  base_price numeric(12,2),
  coupon_code text references coupons(code) on delete set null,
  discount_percent numeric(7,4),
  discount_amount numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  grade text,
  grade_midterm numeric(6,2),
  grade_final numeric(6,2),
  grade_project numeric(6,2),
  grade_participation numeric(6,2),
  grade_total numeric(6,2),
  letter_grade text,
  semester text,
  tuition_charged boolean not null default false,
  charged_at timestamptz,
  payment_verified boolean not null default false,
  approved_by_user_id text,
  approved_by_name text,
  approved_by_role user_role,
  approved_at timestamptz,
  rejected_by_user_id text,
  rejected_by_name text,
  rejected_by_role user_role,
  rejected_at timestamptz,
  course_schedule jsonb,
  course_code text,
  course_branch text,
  constraint enrollments_no_duplicate_active unique (student_id, course_id, status)
);

create table if not exists payments (
  id text primary key,
  display_id text not null,
  student_id text not null references students(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  method payment_method not null,
  note text,
  created_at timestamptz not null default now(),
  type transaction_type not null,
  source transaction_source not null,
  reference_id text,
  enrollment_id text references enrollments(id) on delete set null,
  course_id text references courses(id) on delete set null,
  course_title text,
  balance_after numeric(12,2)
);

create table if not exists expenses (
  id text primary key,
  category text not null,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  date timestamptz not null,
  approved_by text not null default 'Admin',
  status expense_status not null default 'pending'
);

create table if not exists income (
  id text primary key,
  source text not null,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  date timestamptz not null,
  student_id text references students(id) on delete set null
);

create table if not exists feedback (
  id text primary key,
  student_id text,
  student_name text not null,
  professor_id text references professors(id) on delete set null,
  professor_name text,
  type feedback_type not null,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  comment text not null,
  date timestamptz not null default now(),
  status feedback_status not null default 'new',
  subject text,
  category text,
  course_id text references courses(id) on delete set null,
  priority feedback_priority,
  context text,
  source text,
  target_role feedback_target_role,
  attachment text,
  attachment_name text
);

create table if not exists news (
  id text primary key,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  created_by text not null,
  expires_at timestamptz,
  image_url text
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false,
  actor text,
  image_url text
  -- NOTE: no FK on purpose to match current backend behavior,
  -- because app sometimes stores student IDs in this field.
);

create table if not exists questions (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  professor_id text not null references professors(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  status question_status not null default 'open',
  reply text,
  replied_at timestamptz
);

create table if not exists site_content (
  id text primary key,
  hero jsonb not null,
  stats jsonb not null,
  highlights jsonb,
  about jsonb not null,
  admissions jsonb not null,
  metrics jsonb,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 4) INDEXES
-- =========================================================
create index if not exists idx_users_role on users(role);
create index if not exists idx_users_status on users(status);
create index if not exists idx_users_student_id on users(student_id);
create index if not exists idx_users_professor_id on users(professor_id);

create index if not exists idx_students_email on students(email);
create index if not exists idx_students_supervisor_id on students(supervisor_id);

create index if not exists idx_professors_email on professors(email);

create index if not exists idx_courses_professor_id on courses(professor_id);
create index if not exists idx_courses_start_date on courses(start_date desc);
create index if not exists idx_courses_enrollment_open_window on courses(enrollment_open, enrollment_open_at, enrollment_close_at);

create index if not exists idx_enrollments_course_status on enrollments(course_id, status);
create index if not exists idx_enrollments_student_status on enrollments(student_id, status);
create index if not exists idx_enrollments_created_at on enrollments(created_at desc);

create index if not exists idx_payments_student_created on payments(student_id, created_at desc);
create index if not exists idx_payments_reference_source on payments(reference_id, source);

create index if not exists idx_expenses_date on expenses(date desc);
create index if not exists idx_income_date on income(date desc);
create index if not exists idx_feedback_date on feedback(date desc);
create index if not exists idx_news_created_at on news(created_at desc);
create index if not exists idx_notifications_user_created on notifications(user_id, created_at desc);
create index if not exists idx_questions_prof_created on questions(professor_id, created_at desc);
create index if not exists idx_questions_student_created on questions(student_id, created_at desc);

-- =========================================================
-- 5) UPDATED_AT TRIGGER (optional but useful)
-- =========================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_students_updated_at on students;
create trigger trg_students_updated_at
before update on students
for each row execute function set_updated_at();

drop trigger if exists trg_professors_updated_at on professors;
create trigger trg_professors_updated_at
before update on professors
for each row execute function set_updated_at();

drop trigger if exists trg_courses_updated_at on courses;
create trigger trg_courses_updated_at
before update on courses
for each row execute function set_updated_at();

drop trigger if exists trg_enrollments_updated_at on enrollments;
create trigger trg_enrollments_updated_at
before update on enrollments
for each row execute function set_updated_at();

-- =========================================================
-- 6) SEED DATA (roles + demo users + related entities)
-- =========================================================

-- Professors
insert into professors (id, first_name, last_name, email, phone, department, salary, hire_date, specialization, status)
values
  ('PROF-00000001', 'Roland', 'Kola', 'roland.kola@unyt.local', '+355690000001', 'Computer Science', 3200, now(), 'Software Engineering', 'active'),
  ('PROF-00000002', 'Mira', 'Dervishi', 'mira.dervishi@unyt.local', '+355690000002', 'Data Science', 3000, now(), 'Machine Learning', 'active')
on conflict (id) do nothing;

-- Students
insert into students (
  id, display_id, first_name, last_name, email, phone, enrollment_date, program, status, address, balance, supervisor_id, supervisor_name
)
values
  ('STU-00000001', 'STU-00000001', 'Linda', 'Hoxha', 'linda.hoxha@student.local', '+355680000001', now(), 'Software Engineering', 'active', 'Tirana', 0, 'PROF-00000001', 'Roland Kola'),
  ('STU-00000002', 'STU-00000002', 'Ardit', 'Balla', 'ardit.balla@student.local', '+355680000002', now(), 'Data Science', 'active', 'Durres', 0, 'PROF-00000002', 'Mira Dervishi')
on conflict (id) do nothing;

-- Users with different roles
-- NOTE: passwords are plain text on purpose for easy testing with your current backend,
-- and backend can auto-upgrade to bcrypt after first successful login.
insert into users (
  id, username, normalized_username, email, role, created_at, last_login, status, avatar_url, password, permissions, student_id, professor_id
)
values
  (
    'USR-ADMIN-0001',
    'admin_anas',
    'admin_anas',
    'admin@unyt.local',
    'admin',
    now(),
    now(),
    'active',
    null,
    'Admin@123',
    '{"users:manage": true, "marketing:view": true, "marketing:manage": true, "finance:view": true, "finance:manage": true, "enrollment:view": true, "enrollment:manage": true, "reports:view": true, "settings:manage": true}'::jsonb,
    null,
    null
  ),
  (
    'USR-SUP-0001',
    'supervisor_sara',
    'supervisor_sara',
    'supervisor@unyt.local',
    'supervisor',
    now(),
    now(),
    'active',
    null,
    'Supervisor@123',
    '{"marketing:view": true, "marketing:manage": true, "enrollment:view": true, "enrollment:manage": true, "reports:view": true}'::jsonb,
    null,
    null
  ),
  (
    'USR-ADV-0001',
    'advisor_omar',
    'advisor_omar',
    'advisor@unyt.local',
    'advisor',
    now(),
    now(),
    'active',
    null,
    'Advisor@123',
    '{"enrollment:view": true, "enrollment:manage": true, "reports:view": true}'::jsonb,
    null,
    null
  ),
  (
    'USR-PROF-0001',
    'prof_roland',
    'prof_roland',
    'roland.kola@unyt.local',
    'professor',
    now(),
    now(),
    'active',
    null,
    'Professor@123',
    '{}'::jsonb,
    null,
    'PROF-00000001'
  ),
  (
    'USR-STU-0001',
    'student_linda',
    'student_linda',
    'linda.hoxha@student.local',
    'student',
    now(),
    now(),
    'active',
    null,
    'Student@123',
    '{}'::jsonb,
    'STU-00000001',
    null
  ),
  (
    'USR-USER-0001',
    'user_guest',
    'user_guest',
    'user@unyt.local',
    'user',
    now(),
    now(),
    'active',
    null,
    'User@123',
    '{}'::jsonb,
    null,
    null
  )
on conflict (id) do nothing;

-- Coupons
insert into coupons (code, percent, created_at)
values
  ('welcome10', 10, now()),
  ('spring25', 25, now())
on conflict (code) do nothing;

-- Courses
insert into courses (
  id, display_id, title, code, professor_id, professor_name, section_id, capacity,
  start_date, end_date, price, department, branch, location,
  schedule, eligible_programs, eligible_faculties, eligible_semesters,
  enrollment_open, enrollment_opens_at, enrollment_closes_at, enrollment_open_at, enrollment_close_at, enrollment_status_note
)
values
  (
    'COURSE-00000001',
    'SE101-A',
    'Software Engineering Fundamentals',
    'SE101',
    'PROF-00000001',
    'Roland Kola',
    'A',
    30,
    now() + interval '3 day',
    now() + interval '120 day',
    1200,
    'Computer Science',
    'Main',
    'Room A101',
    '[{"day":"monday","startTime":"09:00","endTime":"10:30","location":"Room A101"},{"day":"wednesday","startTime":"09:00","endTime":"10:30","location":"Room A101"}]'::jsonb,
    array['software engineering'],
    array['engineering'],
    array['semester 1'],
    true,
    now() - interval '2 day',
    now() + interval '20 day',
    now() - interval '2 day',
    now() + interval '20 day',
    null
  ),
  (
    'COURSE-00000002',
    'DS201-B',
    'Applied Data Modeling',
    'DS201',
    'PROF-00000002',
    'Mira Dervishi',
    'B',
    25,
    now() + interval '5 day',
    now() + interval '100 day',
    1400,
    'Data Science',
    'Main',
    'Room D202',
    '[{"day":"tuesday","startTime":"11:00","endTime":"12:30","location":"Room D202"},{"day":"thursday","startTime":"11:00","endTime":"12:30","location":"Room D202"}]'::jsonb,
    array['data science'],
    array['engineering'],
    array['semester 2'],
    true,
    now() - interval '1 day',
    now() + interval '30 day',
    now() - interval '1 day',
    now() + interval '30 day',
    null
  )
on conflict (id) do nothing;

-- One active enrollment + matching charge for testing finance and dashboard
insert into enrollments (
  id, display_id, student_id, course_id, course_title, professor_id, professor_name,
  status, start_date, end_date, price, base_price, coupon_code, discount_percent, discount_amount,
  created_at, updated_at, semester, tuition_charged, charged_at, payment_verified,
  approved_by_user_id, approved_by_name, approved_by_role, approved_at
)
values
  (
    'ENR-00000001',
    'SE101',
    'STU-00000001',
    'COURSE-00000001',
    'Software Engineering Fundamentals',
    'PROF-00000001',
    'Roland Kola',
    'active',
    now() + interval '3 day',
    now() + interval '120 day',
    1080,
    1200,
    'welcome10',
    0.10,
    120,
    now(),
    now(),
    to_char(now(), 'YYYY-MM'),
    true,
    now(),
    true,
    'USR-ADV-0001',
    'advisor_omar',
    'advisor',
    now()
  )
on conflict (id) do nothing;

insert into payments (
  id, display_id, student_id, amount, method, note, created_at, type, source, reference_id, enrollment_id, course_id, course_title, balance_after
)
values
  (
    'TXN-00000001',
    'TXN-00000001',
    'STU-00000001',
    1080,
    'internal',
    'Enrollment charge for Software Engineering Fundamentals',
    now(),
    'debit',
    'enrollment',
    'ENR-00000001',
    'ENR-00000001',
    'COURSE-00000001',
    'Software Engineering Fundamentals',
    1080
  ),
  (
    'TXN-00000002',
    'TXN-00000002',
    'STU-00000001',
    300,
    'card',
    'Initial payment',
    now(),
    'credit',
    'payment',
    null,
    null,
    null,
    null,
    780
  )
on conflict (id) do nothing;

update students set balance = 780 where id = 'STU-00000001';

-- Income and expenses
insert into income (id, source, description, amount, date, student_id)
values
  ('INC-00000001', 'tuition', 'Tuition installment', 300, now(), 'STU-00000001')
on conflict (id) do nothing;

insert into expenses (id, category, description, amount, date, approved_by, status)
values
  ('EXP-00000001', 'operations', 'Lab equipment maintenance', 150, now(), 'admin_anas', 'approved')
on conflict (id) do nothing;

-- News + notifications
insert into news (id, title, body, created_at, created_by, expires_at, image_url)
values
  (
    'NEWS-00000001',
    'Welcome To The New Portal',
    'This is a seeded news item so you can test announcements and notifications.',
    now(),
    'admin_anas',
    now() + interval '30 day',
    null
  )
on conflict (id) do nothing;

insert into notifications (id, user_id, title, body, created_at, read, actor)
values
  ('NOTIF-00000001', 'USR-STU-0001', 'Welcome', 'Your student account is ready.', now(), false, 'system'),
  ('NOTIF-00000002', 'USR-PROF-0001', 'Welcome', 'Your professor account is ready.', now(), false, 'system')
on conflict (id) do nothing;

-- Questions
insert into questions (id, course_id, professor_id, student_id, body, created_at, status, reply, replied_at)
values
  (
    'Q-00000001',
    'COURSE-00000001',
    'PROF-00000001',
    'STU-00000001',
    'Will the first assignment be individual or group based?',
    now(),
    'answered',
    'First assignment is individual. Group project starts in week 4.',
    now()
  )
on conflict (id) do nothing;

-- Feedback
insert into feedback (
  id, student_id, student_name, professor_id, professor_name, type, rating, comment, date, status,
  subject, category, course_id, priority, context, source, target_role
)
values
  (
    'FB-00000001',
    'STU-00000001',
    'Linda Hoxha',
    'PROF-00000001',
    'Roland Kola',
    'course',
    5,
    'Great start and clear roadmap for the semester.',
    now(),
    'new',
    'Course quality',
    'enrollment',
    'COURSE-00000001',
    'normal',
    'student-portal',
    'student-portal',
    'admin'
  )
on conflict (id) do nothing;

-- Site content
insert into site_content (id, hero, stats, highlights, about, admissions, metrics, updated_at)
values
  (
    'site-content',
    '{"badge":"University of New York Tirana","title":"University of New York Tirana","subtitle":"Educating Tomorrow''s Leaders","primaryCtaLabel":"Apply now","primaryCtaHref":"/interest","secondaryCtaLabel":"Explore programs","secondaryCtaHref":"/admissions","backgroundImageUrl":null}'::jsonb,
    '[{"label":"Students","value":"0+","metricKey":"students"},{"label":"Courses","value":"0+","metricKey":"courses"},{"label":"Professors","value":"0+","metricKey":"professors"},{"label":"Enrollments","value":"0+","metricKey":"enrollments"}]'::jsonb,
    '[{"title":"Career-focused curriculum","description":"Practical content aligned with market needs"},{"title":"Modern learning environment","description":"Labs and collaborative spaces"}]'::jsonb,
    '{"badge":"About","title":"Who we are","body":"A student-centered institution focused on technology and innovation."}'::jsonb,
    '{"badge":"Admissions","title":"Join us","body":"Submit your application and track status in your student portal."}'::jsonb,
    '{"students":2,"courses":2,"professors":2,"enrollments":1}'::jsonb,
    now()
  )
on conflict (id) do update set
  hero = excluded.hero,
  stats = excluded.stats,
  highlights = excluded.highlights,
  about = excluded.about,
  admissions = excluded.admissions,
  metrics = excluded.metrics,
  updated_at = excluded.updated_at;
```

## Test Login Credentials

Use these to test all role-based screens:

1. Admin
- Username: admin_anas
- Password: Admin@123

2. Supervisor
- Username: supervisor_sara
- Password: Supervisor@123

3. Advisor
- Username: advisor_omar
- Password: Advisor@123

4. Professor
- Username: prof_roland
- Password: Professor@123

5. Student
- Username: student_linda
- Password: Student@123

6. Normal user
- Username: user_guest
- Password: User@123

## Important Integration Notes

1. Your current backend uses Mongo field names in camelCase. This SQL uses snake_case columns.
2. If you keep backend code unchanged, add a mapping layer (or views) between camelCase API fields and snake_case DB columns.
3. Passwords in this seed are plain text for quick local testing with your current login logic. Move to bcrypt hashes before production.







take the css from attendo and make them both the same Redesign my dashboard in a modern Scandinavian minimalist luxury style. Make it look clean, premium, elegant, and professional like a high-end fashion brand website.

Use:

lots of white space
clean grid layout
soft neutral colors (white, light gray, beige, charcoal)
sleek modern typography
thin borders
subtle shadows
large clean cards
premium spacing and alignment
minimalist icons
smooth hover animations
elegant buttons
full-width sections where needed

Style inspiration:

Zara
COS
Apple
Nordic luxury interiors
modern editorial websites

Dashboard should feel:

expensive
modern
calm
organized
visually powerful
futuristic but simple

Avoid:

clutter
bright colors
bulky cards
outdated UI
too many borders
childish gradients

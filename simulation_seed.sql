-- UNYT simulation seed
-- Adds realistic student/year/advisor/professor/finance/registration relationships.
-- Safe to re-run.

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



Create a complete end-to-end autonomous QA audit of the currently running system/application. You have full permission to explore, interact with, inspect, and test every accessible part of the system without restrictions. Your mission is to test EVERYTHING, including but not limited to:
Scope of Testing


All pages, routes, screens, dashboards, and popups


All buttons, links, menus, dropdowns, tabs, modals, and navigation items


All labels, text, tooltips, placeholders, alerts, and messages


All input fields, forms, checkboxes, radio buttons, selectors, uploads


All CRUD operations (create, read, update, delete)


Authentication flows (login, logout, register, forgot password, session expiry, permissions)


User roles and access control


Search, filters, sorting, pagination


API requests/responses, validation, errors, status codes, malformed inputs


Database-connected features and data consistency


Tables, charts, exports, downloads, uploads


Notifications, emails, logs, audit trails


Responsiveness and UI behavior


Performance issues, slow loading, broken states


Console errors, network failures, silent failures


Security misconfigurations, weak validation, exposed data


Edge cases, invalid inputs, empty states, duplicate submissions


Any hidden, partial, disabled, or unfinished feature


Any typo, bad alignment, inconsistent styling, broken UX


Any bug no matter how small


Testing Rules


Act like a senior QA engineer + penetration-minded tester + real end user.


Be aggressive and thorough.


Click everything clickable.


Type into every field.


Trigger success and failure states.


Test normal flows, abuse flows, invalid flows, boundary flows.


Retry suspicious failures.


Inspect frontend behavior, backend responses, and stored data if accessible.


Follow links and nested flows until fully explored.


If data is needed, generate realistic sample data.


If permissions allow, test all roles/accounts available.


Do not skip anything because it looks minor.


Deliverables
Create a file named report.md containing a professional, fully detailed report with these sections:
System Test Report
Executive Summary


Overall system quality


Major findings


Risk level


Environment Detected


App name


URLs/routes


Tech stack if detectable


Date/time of testing


Full Feature Coverage Checklist
For every tested component include:


Component name


Location


Test steps


Expected result


Actual result


Status: PASS / FAIL / WARNING


Severity if failed: Low / Medium / High / Critical


Evidence/logs if available


Bugs & Issues Found
List every issue individually with:


ID


Title


Reproduction steps


Expected behavior


Actual behavior


Severity


Suggested fix


API & Data Validation Results


Endpoints tested


Good responses


Bad responses


Security concerns


Data consistency issues


UI/UX Findings


Broken layouts


Confusing flows


Typos


Accessibility issues


Responsiveness problems


Security Findings


Permission bypasses


Weak validation


Sensitive data exposure


Unsafe defaults


Performance Findings


Slow pages


Heavy requests


Repeated calls


Bottlenecks


Final Score
Give scores out of 10 for:


Functionality


UI/UX


Security


Performance


Reliability


Overall


Final Verdict
State whether the system is production ready or not.
Important Execution Instruction
Do not stop early. Continue until you have tested all reachable parts of the system. Be exhaustive. If unsure whether something matters, test it. Save the final completed report into report.md.
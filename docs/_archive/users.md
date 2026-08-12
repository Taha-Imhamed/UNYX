# Users Seed SQL (All Roles)

```sql
-- =========================================================
-- USERS MEGA SEED (idempotent, safe to re-run)
-- - Adds missing role enum values if needed
-- - Adds full_name / phone / department columns if missing
-- - Inserts 3 users per role with bcrypt password hash
-- - Skips existing users by normalized_username or email
-- =========================================================

-- Ensure all role enum values exist.
do $$
begin
  if exists (select 1 from pg_type where typname = 'user_role') then
    alter type user_role add value if not exists 'super-admin';
    alter type user_role add value if not exists 'teaching-assistant';
    alter type user_role add value if not exists 'registrar';
    alter type user_role add value if not exists 'admissions';
    alter type user_role add value if not exists 'finance';
    alter type user_role add value if not exists 'it-admin';
    alter type user_role add value if not exists 'dean';
    alter type user_role add value if not exists 'hod';
    alter type user_role add value if not exists 'librarian';
    alter type user_role add value if not exists 'student-affairs';
    alter type user_role add value if not exists 'hr';
    alter type user_role add value if not exists 'security';
    alter type user_role add value if not exists 'facilities';
    alter type user_role add value if not exists 'research-office';
  end if;
end
$$;

commit;

-- Add profile columns used by this seed.
alter table if exists users add column if not exists full_name text;
alter table if exists users add column if not exists phone text;
alter table if exists users add column if not exists department text;

with seed_users as (
  select * from (
    values
      -- Student (3)
      ('USR-STU-1001','ahmed.student','ahmed.student@university.edu','student','Ahmed Rashidi','+355680100001','Computer Science'),
      ('USR-STU-1002','sara.student','sara.student@university.edu','student','Sara Dervishi','+355680100002','Business Administration'),
      ('USR-STU-1003','luka.student','luka.student@university.edu','student','Luka Hoxha','+355680100003','Data Science'),

      -- Professor (3)
      ('USR-PRO-1001','dr.hassan','dr.hassan@university.edu','professor','Dr Hassan Alami','+355680200001','Computer Science'),
      ('USR-PRO-1002','dr.mira','dr.mira@university.edu','professor','Dr Mira Konomi','+355680200002','Data Science'),
      ('USR-PRO-1003','dr.erjon','dr.erjon@university.edu','professor','Dr Erjon Balla','+355680200003','Engineering'),

      -- Teaching Assistant (3)
      ('USR-TA-1001','ta.noel','ta.noel@university.edu','teaching-assistant','Noel Kola','+355680300001','Computer Science'),
      ('USR-TA-1002','ta.arta','ta.arta@university.edu','teaching-assistant','Arta Islami','+355680300002','Data Science'),
      ('USR-TA-1003','ta.dion','ta.dion@university.edu','teaching-assistant','Dion Pasha','+355680300003','Engineering'),

      -- Academic Advisor (3)
      ('USR-ADV-1001','advisor.omer','advisor.omer@university.edu','advisor','Omer Kastrati','+355680400001','Advising'),
      ('USR-ADV-1002','advisor.nada','advisor.nada@university.edu','advisor','Nada Gjoni','+355680400002','Advising'),
      ('USR-ADV-1003','advisor.ledi','advisor.ledi@university.edu','advisor','Ledi Rama','+355680400003','Advising'),

      -- Registrar (3)
      ('USR-REG-1001','registrar.ines','registrar.ines@university.edu','registrar','Ines Bushi','+355680500001','Registrar Office'),
      ('USR-REG-1002','registrar.beni','registrar.beni@university.edu','registrar','Beni Deda','+355680500002','Registrar Office'),
      ('USR-REG-1003','registrar.rei','registrar.rei@university.edu','registrar','Rei Cani','+355680500003','Registrar Office'),

      -- Admissions Officer (3)
      ('USR-ADM-1001','admissions.era','admissions.era@university.edu','admissions','Era Duka','+355680600001','Admissions'),
      ('USR-ADM-1002','admissions.lorik','admissions.lorik@university.edu','admissions','Lorik Meta','+355680600002','Admissions'),
      ('USR-ADM-1003','admissions.jona','admissions.jona@university.edu','admissions','Jona Kaceli','+355680600003','Admissions'),

      -- Finance Staff (3)
      ('USR-FIN-1001','finance.elira','finance.elira@university.edu','finance','Elira Hasa','+355680700001','Finance Office'),
      ('USR-FIN-1002','finance.arber','finance.arber@university.edu','finance','Arber Sinani','+355680700002','Finance Office'),
      ('USR-FIN-1003','finance.anxhela','finance.anxhela@university.edu','finance','Anxhela Mema','+355680700003','Finance Office'),

      -- IT Admin (3)
      ('USR-IT-1001','it.klodi','it.klodi@university.edu','it-admin','Klodi Kola','+355680800001','IT Services'),
      ('USR-IT-1002','it.bora','it.bora@university.edu','it-admin','Bora Zeneli','+355680800002','IT Services'),
      ('USR-IT-1003','it.dren','it.dren@university.edu','it-admin','Dren Lila','+355680800003','IT Services'),

      -- Dean (3)
      ('USR-DEAN-1001','dean.amelia','dean.amelia@university.edu','dean','Amelia Kodra','+355680900001','Academic Affairs'),
      ('USR-DEAN-1002','dean.petra','dean.petra@university.edu','dean','Petra Nushi','+355680900002','Academic Affairs'),
      ('USR-DEAN-1003','dean.ilir','dean.ilir@university.edu','dean','Ilir Muja','+355680900003','Academic Affairs'),

      -- HOD (3)
      ('USR-HOD-1001','hod.cs','hod.cs@university.edu','hod','Arjan Tafaj','+355681000001','Computer Science'),
      ('USR-HOD-1002','hod.ds','hod.ds@university.edu','hod','Megi Dervishi','+355681000002','Data Science'),
      ('USR-HOD-1003','hod.biz','hod.biz@university.edu','hod','Besnik Lami','+355681000003','Business Administration'),

      -- Librarian (3)
      ('USR-LIB-1001','library.ona','library.ona@university.edu','librarian','Ona Vata','+355681100001','Library'),
      ('USR-LIB-1002','library.klevis','library.klevis@university.edu','librarian','Klevis Gega','+355681100002','Library'),
      ('USR-LIB-1003','library.riela','library.riela@university.edu','librarian','Riela Pango','+355681100003','Library'),

      -- Super Admin (3)
      ('USR-SA-1001','superadmin.alban','superadmin.alban@university.edu','super-admin','Alban Reka','+355681200001','Executive Admin'),
      ('USR-SA-1002','superadmin.fjora','superadmin.fjora@university.edu','super-admin','Fjora Gashi','+355681200002','Executive Admin'),
      ('USR-SA-1003','superadmin.luan','superadmin.luan@university.edu','super-admin','Luan Shkreli','+355681200003','Executive Admin'),

      -- Student Affairs Officer (3)
      ('USR-SAFF-1001','studaff.ina','studaff.ina@university.edu','student-affairs','Ina Lleshi','+355681300001','Student Affairs'),
      ('USR-SAFF-1002','studaff.keti','studaff.keti@university.edu','student-affairs','Keti Tola','+355681300002','Student Affairs'),
      ('USR-SAFF-1003','studaff.adi','studaff.adi@university.edu','student-affairs','Adi Guri','+355681300003','Student Affairs'),

      -- HR Staff (3)
      ('USR-HR-1001','hr.livia','hr.livia@university.edu','hr','Livia Cani','+355681400001','Human Resources'),
      ('USR-HR-1002','hr.aldo','hr.aldo@university.edu','hr','Aldo Bregu','+355681400002','Human Resources'),
      ('USR-HR-1003','hr.gerta','hr.gerta@university.edu','hr','Gerta Lila','+355681400003','Human Resources'),

      -- Security Officer (3)
      ('USR-SEC-1001','security.dani','security.dani@university.edu','security','Dani Frasheri','+355681500001','Security'),
      ('USR-SEC-1002','security.eri','security.eri@university.edu','security','Eri Mehmeti','+355681500002','Security'),
      ('USR-SEC-1003','security.bledi','security.bledi@university.edu','security','Bledi Ceka','+355681500003','Security'),

      -- Facilities Manager (3)
      ('USR-FAC-1001','facilities.rina','facilities.rina@university.edu','facilities','Rina Shehu','+355681600001','Facilities'),
      ('USR-FAC-1002','facilities.klajd','facilities.klajd@university.edu','facilities','Klajd Nika','+355681600002','Facilities'),
      ('USR-FAC-1003','facilities.elton','facilities.elton@university.edu','facilities','Elton Biba','+355681600003','Facilities'),

      -- Research Officer (3)
      ('USR-RES-1001','research.nia','research.nia@university.edu','research-office','Nia Sula','+355681700001','Research Office'),
      ('USR-RES-1002','research.aris','research.aris@university.edu','research-office','Aris Domi','+355681700002','Research Office'),
      ('USR-RES-1003','research.lina','research.lina@university.edu','research-office','Lina Koka','+355681700003','Research Office')
  ) as t(id, username, email, role, full_name, phone, department)
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
  department
)
select
  s.id,
  s.username,
  lower(s.username),
  lower(s.email),
  s.role::user_role,
  now(),
  now(),
  'active'::user_status,
  null,
  '$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm',
  '{}'::jsonb,
  null,
  null,
  s.full_name,
  s.phone,
  s.department
from seed_users s
where not exists (
  select 1
  from users u
  where u.normalized_username = lower(s.username)
     or u.email = lower(s.email)
);

-- Sample student rows for downstream registrar/admissions records.
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
  balance
)
select
  t.id,
  t.display_id,
  t.first_name,
  t.last_name,
  t.email,
  t.phone,
  t.photo,
  t.enrollment_date,
  t.program,
  t.status::student_status,
  t.address,
  t.date_of_birth::date,
  t.balance
from (
  values
    ('USR-STU-1001','USR-STU-1001','Ahmed','Rashidi','ahmed.student@university.edu','+355680100001','/placeholder-user.jpg',now(),'Computer Science','active','Campus Housing A','2002-04-15',0),
    ('USR-STU-1002','USR-STU-1002','Sara','Dervishi','sara.student@university.edu','+355680100002','/placeholder-user.jpg',now(),'Business Administration','active','Campus Housing B','2003-01-28',0),
    ('USR-STU-1003','USR-STU-1003','Luka','Hoxha','luka.student@university.edu','+355680100003','/placeholder-user.jpg',now(),'Data Science','active','Campus Housing C','2001-09-09',0)
) as t(id, display_id, first_name, last_name, email, phone, photo, enrollment_date, program, status, address, date_of_birth, balance)
where not exists (
  select 1 from students s where s.id = t.id
);

insert into maintenance_state (id, enabled, message, updated_at, updated_by)
values ('global', false, 'System online', now(), 'USR-IT-1001')
on conflict (id) do update set enabled = excluded.enabled, message = excluded.message, updated_at = excluded.updated_at, updated_by = excluded.updated_by;

insert into visitor_logs (id, visitor_name, purpose, contact_number, host_name, check_in_at, check_out_at, status, notes)
values
  ('VIS-1001', 'Alpha Consulting', 'Campus visit', '+355690000001', 'security.dani', now(), null, 'checked-in', 'Front gate badge issued'),
  ('VIS-1002', 'Maria Petrova', 'Admissions meeting', '+355690000002', 'admissions.era', now(), now(), 'checked-out', 'Left after interview');

insert into incident_reports (id, title, description, severity, location, reported_by, reported_at, status, resolved_at)
values
  ('INC-1001', 'Broken hallway light', 'West wing hallway light is out', 'low', 'Building A', 'security.dani', now(), 'open', null),
  ('INC-1002', 'Unauthorized access attempt', 'Unknown badge attempted access after hours', 'high', 'North Gate', 'security.eri', now(), 'investigating', null);

insert into id_card_access (id, holder_name, holder_type, card_number, issued_at, expires_at, status, notes)
values
  ('IDC-1001', 'Ahmed Rashidi', 'student', 'CARD-1001', now(), now() + interval '1 year', 'active', 'Campus entry card'),
  ('IDC-1002', 'Bora Zeneli', 'staff', 'CARD-2001', now(), now() + interval '2 years', 'active', 'IT admin access');

insert into maintenance_requests (id, title, description, category, location, requested_by, requested_at, status, priority, assigned_to, completed_at)
values
  ('MNT-1001', 'Fix projector', 'Projector not turning on', 'classroom', 'Room 204', 'facilities.rina', now(), 'open', 'high', null, null),
  ('MNT-1002', 'Replace AC filter', 'Routine filter replacement', 'building', 'Library', 'facilities.klajd', now(), 'in-progress', 'medium', 'facilities.elton', null);

insert into equipment_requests (id, item_name, quantity, requested_by, requested_at, location, status, notes)
values
  ('EQU-1001', 'HDMI cable', 8, 'facilities.rina', now(), 'AV store', 'pending', 'Needed for lecture halls'),
  ('EQU-1002', 'Desk chairs', 20, 'facilities.elton', now(), 'Main campus', 'approved', 'Approved by facilities manager');

insert into room_bookings (id, room_name, booked_by, purpose, start_at, end_at, status, notes)
values
  ('ROM-1001', 'Lecture Hall 1', 'registrar.ines', 'Orientation', now(), now() + interval '2 hours', 'approved', 'Reserved for new intake'),
  ('ROM-1002', 'Seminar Room B', 'research.nia', 'Research workshop', now() + interval '1 day', now() + interval '1 day 3 hours', 'requested', 'Pending approval');

insert into research_grants (id, project_title, principal_investigator, amount, sponsor, submitted_at, status, summary)
values
  ('GRN-1001', 'AI in campus operations', 'research.nia', 25000, 'TechForward Foundation', now(), 'submitted', 'Automation and analytics project'),
  ('GRN-1002', 'Green campus energy study', 'research.aris', 18000, 'Ministry of Education', now(), 'approved', 'Energy monitoring and reporting');

insert into publications (id, title, authors, journal, published_at, doi, status, abstract)
values
  ('PUB-1001', 'Campus Data Modernization', '["Dr. Mira Konomi", "Aris Domi"]'::jsonb, 'University Journal', now(), '10.1000/example1', 'published', 'Overview of the data platform rollout'),
  ('PUB-1002', 'Student Experience Metrics', '["Nia Sula"]'::jsonb, null, now(), null, 'submitted', 'Preprint on engagement and retention');

insert into research_requests (id, title, requester, requested_at, status, department, notes)
values
  ('RQR-1001', 'Survey lab access', 'research.nia', now(), 'open', 'Research Office', 'Needs faculty approvals'),
  ('RQR-1002', 'Data export approval', 'research.aris', now(), 'in-review', 'Data Science', 'Awaiting privacy review');

insert into sso_config (id, provider, client_id, issuer_url, enabled, updated_at)
values
  ('SSO-1001', 'Azure AD', 'azure-client-id', 'https://login.microsoftonline.com/common/v2.0', true, now()),
  ('SSO-1002', 'Google Workspace', 'google-client-id', 'https://accounts.google.com', false, now());

insert into integrations (id, name, endpoint, status, last_synced_at, notes)
values
  ('INT-1001', 'SMS Gateway', 'https://sms.example.edu/api', 'active', now(), 'Used for urgent notifications'),
  ('INT-1002', 'Email Relay', 'https://mail.example.edu/api', 'active', now(), 'Transactional messages');

insert into device_logs (id, device_name, ip_address, event_type, created_at, user_id, details)
values
  ('DVC-1001', 'Front Desk iPad', '10.0.0.12', 'login', now(), 'USR-SEC-1001', 'Security desk sign-in'),
  ('DVC-1002', 'IT Admin Laptop', '10.0.0.18', 'config-update', now(), 'USR-IT-1001', 'Maintenance flag checked');

insert into enrollment_overrides (id, student_id, course_id, reason, approved_by, created_at, status)
values
  ('OVR-1001', 'USR-STU-1001', 'COURSE-1001', 'Capacity override for graduation requirement', 'USR-REG-1001', now(), 'approved'),
  ('OVR-1002', 'USR-STU-1002', 'COURSE-1002', 'Late enrollment approved by registrar', 'USR-REG-1002', now(), 'pending');

insert into transfer_credits (id, student_id, source_institution, course_title, credit_hours, evaluated_by, evaluated_at, status)
values
  ('TRN-1001', 'USR-STU-1001', 'Regional College', 'Database Systems', 3, 'USR-REG-1001', now(), 'approved'),
  ('TRN-1002', 'USR-STU-1002', 'City Institute', 'Business Analytics', 4, 'USR-REG-1002', now(), 'pending');

insert into transcript_requests (id, student_id, requested_at, delivery_method, status, notes)
values
  ('TSR-1001', 'USR-STU-1001', now(), 'email', 'ready', 'Digital copy prepared'),
  ('TSR-1002', 'USR-STU-1002', now(), 'pickup', 'pending', 'Awaiting verification');

insert into graduation_approvals (id, student_id, program, approved_by, approved_at, status, remarks)
values
  ('GRA-1001', 'USR-STU-1001', 'Computer Science', 'USR-REG-1001', now(), 'approved', 'All requirements met'),
  ('GRA-1002', 'USR-STU-1003', 'Data Science', 'USR-REG-1002', now(), 'pending', 'Missing final elective');

insert into scholarship_awards (id, student_id, scholarship_name, amount, awarded_by, awarded_at, status, notes)
values
  ('SCH-1001', 'USR-STU-1001', 'Merit Excellence Award', 1500, 'USR-ADM-1001', now(), 'awarded', 'Fall scholarship cycle'),
  ('SCH-1002', 'USR-STU-1003', 'STEM Support Grant', 1000, 'USR-ADM-1002', now(), 'pending', 'Needs dean approval');

insert into interview_schedules (id, applicant_name, program, interviewer, scheduled_at, status, notes)
values)
  ('INTV-1001', 'Rina Halili', 'Business Administration', 'admissions.era', now() + interval '2 days', 'scheduled', 'Bring transcript copy'),
  ('INTV-1002', 'Elton Pasha', 'Computer Science', 'admissions.lorik', now() + interval '3 days', 'scheduled', 'Online interview');

insert into offer_letters (id, applicant_name, program, issued_at, status, expiration_date, notes)
values
  ('OFR-1001', 'Rina Halili', 'Business Administration', now(), 'issued', now() + interval '14 days', 'Conditional offer'),
  ('OFR-1002', 'Elton Pasha', 'Computer Science', now(), 'draft', null, 'Pending final approval');
```

ROLE              | USERNAME               | EMAIL                              | PASSWORD
------------------|------------------------|------------------------------------|-------------
Student           | ahmed.student          | ahmed.student@university.edu       | Test@1234
Student           | sara.student           | sara.student@university.edu        | Test@1234
Student           | luka.student           | luka.student@university.edu        | Test@1234
Professor         | dr.hassan              | dr.hassan@university.edu           | Test@1234
Professor         | dr.mira                | dr.mira@university.edu             | Test@1234
Professor         | dr.erjon               | dr.erjon@university.edu            | Test@1234
Teaching Assistant| ta.noel                | ta.noel@university.edu             | Test@1234
Teaching Assistant| ta.arta                | ta.arta@university.edu             | Test@1234
Teaching Assistant| ta.dion                | ta.dion@university.edu             | Test@1234
Academic Advisor  | advisor.omer           | advisor.omer@university.edu        | Test@1234
Academic Advisor  | advisor.nada           | advisor.nada@university.edu        | Test@1234
Academic Advisor  | advisor.ledi           | advisor.ledi@university.edu        | Test@1234
Registrar         | registrar.ines         | registrar.ines@university.edu      | Test@1234
Registrar         | registrar.beni         | registrar.beni@university.edu      | Test@1234
Registrar         | registrar.rei          | registrar.rei@university.edu       | Test@1234
Admissions Officer| admissions.era         | admissions.era@university.edu      | Test@1234
Admissions Officer| admissions.lorik       | admissions.lorik@university.edu    | Test@1234
Admissions Officer| admissions.jona        | admissions.jona@university.edu     | Test@1234
Finance Staff     | finance.elira          | finance.elira@university.edu       | Test@1234
Finance Staff     | finance.arber          | finance.arber@university.edu       | Test@1234
Finance Staff     | finance.anxhela        | finance.anxhela@university.edu     | Test@1234
IT Admin          | it.klodi               | it.klodi@university.edu            | Test@1234
IT Admin          | it.bora                | it.bora@university.edu             | Test@1234
IT Admin          | it.dren                | it.dren@university.edu             | Test@1234
Dean              | dean.amelia            | dean.amelia@university.edu         | Test@1234
Dean              | dean.petra             | dean.petra@university.edu          | Test@1234
Dean              | dean.ilir              | dean.ilir@university.edu           | Test@1234
HOD               | hod.cs                 | hod.cs@university.edu              | Test@1234
HOD               | hod.ds                 | hod.ds@university.edu              | Test@1234
HOD               | hod.biz                | hod.biz@university.edu             | Test@1234
Librarian         | library.ona            | library.ona@university.edu         | Test@1234
Librarian         | library.klevis         | library.klevis@university.edu      | Test@1234
Librarian         | library.riela          | library.riela@university.edu       | Test@1234
Super Admin       | superadmin.alban       | superadmin.alban@university.edu    | Test@1234
Super Admin       | superadmin.fjora       | superadmin.fjora@university.edu    | Test@1234
Super Admin       | superadmin.luan        | superadmin.luan@university.edu     | Test@1234
Student Affairs   | studaff.ina            | studaff.ina@university.edu         | Test@1234
Student Affairs   | studaff.keti           | studaff.keti@university.edu        | Test@1234
Student Affairs   | studaff.adi            | studaff.adi@university.edu         | Test@1234
HR Staff          | hr.livia               | hr.livia@university.edu            | Test@1234
HR Staff          | hr.aldo                | hr.aldo@university.edu             | Test@1234
HR Staff          | hr.gerta               | hr.gerta@university.edu            | Test@1234
Security Officer  | security.dani          | security.dani@university.edu       | Test@1234
Security Officer  | security.eri           | security.eri@university.edu        | Test@1234
Security Officer  | security.bledi         | security.bledi@university.edu      | Test@1234
Facilities Manager| facilities.rina        | facilities.rina@university.edu     | Test@1234
Facilities Manager| facilities.klajd       | facilities.klajd@university.edu    | Test@1234
Facilities Manager| facilities.elton       | facilities.elton@university.edu    | Test@1234
Research Officer  | research.nia           | research.nia@university.edu        | Test@1234
Research Officer  | research.aris          | research.aris@university.edu       | Test@1234
Research Officer  | research.lina          | research.lina@university.edu       | Test@1234



17(role)

Student — 3
Professor — 3
Teaching Assistant — 3
Academic Advisor — 3
Registrar — 3
Admissions Officer — 3
Finance Staff — 3
IT Admin — 3
Dean — 3
HOD (Head of Department) — 3
Librarian — 3
Super Admin — 3
Student Affairs — 3
HR Staff — 3
Security Officer — 3
Facilities Manager — 3
Research Officer — 3


the roles 

Student
Professor
Teaching Assistant
Academic Advisor
Registrar
Admissions Officer
Finance Staff
IT Admin
Dean
HOD (Head of Department)
Librarian
Super Admin
Student Affairs
HR Staff
Security Officer
Facilities Manager
Research Officer

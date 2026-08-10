-- Users-only seed SQL
-- Safe to run on an existing database that already has the users table.
--
-- Test credentials table:
--
-- ROLE              | USERNAME               | EMAIL                              | PASSWORD
-- ------------------|------------------------|------------------------------------|-------------
-- Student           | ahmed.student          | ahmed.student@university.edu       | Test@1234
-- Student           | sara.student           | sara.student@university.edu        | Test@1234
-- Student           | luka.student           | luka.student@university.edu        | Test@1234
-- Professor         | dr.hassan              | dr.hassan@university.edu           | Test@1234
-- Professor         | dr.mira                | dr.mira@university.edu             | Test@1234
-- Professor         | dr.erjon               | dr.erjon@university.edu            | Test@1234
-- Teaching Assistant| ta.noel                | ta.noel@university.edu             | Test@1234
-- Teaching Assistant| ta.arta                | ta.arta@university.edu             | Test@1234
-- Teaching Assistant| ta.dion                | ta.dion@university.edu             | Test@1234
-- Academic Advisor  | advisor.omer           | advisor.omer@university.edu        | Test@1234
-- Academic Advisor  | advisor.nada           | advisor.nada@university.edu        | Test@1234
-- Academic Advisor  | advisor.ledi           | advisor.ledi@university.edu        | Test@1234
-- Registrar         | registrar.ines         | registrar.ines@university.edu      | Test@1234
-- Registrar         | registrar.beni         | registrar.beni@university.edu      | Test@1234
-- Registrar         | registrar.rei          | registrar.rei@university.edu       | Test@1234
-- Admissions Officer| admissions.era         | admissions.era@university.edu      | Test@1234
-- Admissions Officer| admissions.lorik       | admissions.lorik@university.edu    | Test@1234
-- Admissions Officer| admissions.jona        | admissions.jona@university.edu     | Test@1234
-- Finance Staff     | finance.elira          | finance.elira@university.edu       | Test@1234
-- Finance Staff     | finance.arber          | finance.arber@university.edu       | Test@1234
-- Finance Staff     | finance.anxhela        | finance.anxhela@university.edu     | Test@1234
-- IT Admin          | it.klodi               | it.klodi@university.edu            | Test@1234
-- IT Admin          | it.bora                | it.bora@university.edu             | Test@1234
-- IT Admin          | it.dren                | it.dren@university.edu             | Test@1234
-- Dean              | dean.amelia            | dean.amelia@university.edu         | Test@1234
-- Dean              | dean.petra             | dean.petra@university.edu          | Test@1234
-- Dean              | dean.ilir              | dean.ilir@university.edu           | Test@1234
-- HOD               | hod.cs                 | hod.cs@university.edu              | Test@1234
-- HOD               | hod.ds                 | hod.ds@university.edu              | Test@1234
-- HOD               | hod.biz                | hod.biz@university.edu             | Test@1234
-- Librarian         | library.ona            | library.ona@university.edu         | Test@1234
-- Librarian         | library.klevis         | library.klevis@university.edu      | Test@1234
-- Librarian         | library.riela          | library.riela@university.edu       | Test@1234
-- Super Admin       | admin23              | superadmin.alban@university.edu    | Test@1234
-- Super Admin       | superadmin.fjora       | superadmin.fjora@university.edu    | Test@1234
-- Super Admin       | superadmin.luan        | superadmin.luan@university.edu     | Test@1234
-- Student Affairs   | studaff.ina            | studaff.ina@university.edu         | Test@1234
-- Student Affairs   | studaff.keti           | studaff.keti@university.edu        | Test@1234
-- Student Affairs   | studaff.adi            | studaff.adi@university.edu         | Test@1234
-- HR Staff          | hr.livia               | hr.livia@university.edu            | Test@1234
-- HR Staff          | hr.aldo                | hr.aldo@university.edu             | Test@1234
-- HR Staff          | hr.gerta               | hr.gerta@university.edu            | Test@1234
-- Security Officer  | security.dani          | security.dani@university.edu       | Test@1234
-- Security Officer  | security.eri           | security.eri@university.edu        | Test@1234
-- Security Officer  | security.bledi         | security.bledi@university.edu      | Test@1234
-- Facilities Manager| facilities.rina        | facilities.rina@university.edu     | Test@1234
-- Facilities Manager| facilities.klajd       | facilities.klajd@university.edu    | Test@1234
-- Facilities Manager| facilities.elton       | facilities.elton@university.edu    | Test@1234
-- Research Officer  | research.nia           | research.nia@university.edu        | Test@1234
-- Research Officer  | research.aris          | research.aris@university.edu       | Test@1234
-- Research Officer  | research.lina          | research.lina@university.edu       | Test@1234

-- Add any missing role enum values first.
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

alter table if exists users add column if not exists full_name text;
alter table if exists users add column if not exists phone text;
alter table if exists users add column if not exists department text;

with seed_users as (
  select * from (
    values
      ('USR-STU-1001','ahmed.student','ahmed.student@university.edu','student','Ahmed Rashidi','+355680100001','Computer Science'),
      ('USR-STU-1002','sara.student','sara.student@university.edu','student','Sara Dervishi','+355680100002','Business Administration'),
      ('USR-STU-1003','luka.student','luka.student@university.edu','student','Luka Hoxha','+355680100003','Data Science'),
      ('USR-PRO-1001','dr.hassan','dr.hassan@university.edu','professor','Dr Hassan Alami','+355680200001','Computer Science'),
      ('USR-PRO-1002','dr.mira','dr.mira@university.edu','professor','Dr Mira Konomi','+355680200002','Data Science'),
      ('USR-PRO-1003','dr.erjon','dr.erjon@university.edu','professor','Dr Erjon Balla','+355680200003','Engineering'),
      ('USR-TA-1001','ta.noel','ta.noel@university.edu','teaching-assistant','Noel Kola','+355680300001','Computer Science'),
      ('USR-TA-1002','ta.arta','ta.arta@university.edu','teaching-assistant','Arta Islami','+355680300002','Data Science'),
      ('USR-TA-1003','ta.dion','ta.dion@university.edu','teaching-assistant','Dion Pasha','+355680300003','Engineering'),
      ('USR-ADV-1001','advisor.omer','advisor.omer@university.edu','advisor','Omer Kastrati','+355680400001','Advising'),
      ('USR-ADV-1002','advisor.nada','advisor.nada@university.edu','advisor','Nada Gjoni','+355680400002','Advising'),
      ('USR-ADV-1003','advisor.ledi','advisor.ledi@university.edu','advisor','Ledi Rama','+355680400003','Advising'),
      ('USR-REG-1001','registrar.ines','registrar.ines@university.edu','registrar','Ines Bushi','+355680500001','Registrar Office'),
      ('USR-REG-1002','registrar.beni','registrar.beni@university.edu','registrar','Beni Deda','+355680500002','Registrar Office'),
      ('USR-REG-1003','registrar.rei','registrar.rei@university.edu','registrar','Rei Cani','+355680500003','Registrar Office'),
      ('USR-ADM-1001','admissions.era','admissions.era@university.edu','admissions','Era Duka','+355680600001','Admissions'),
      ('USR-ADM-1002','admissions.lorik','admissions.lorik@university.edu','admissions','Lorik Meta','+355680600002','Admissions'),
      ('USR-ADM-1003','admissions.jona','admissions.jona@university.edu','admissions','Jona Kaceli','+355680600003','Admissions'),
      ('USR-FIN-1001','finance.elira','finance.elira@university.edu','finance','Elira Hasa','+355680700001','Finance Office'),
      ('USR-FIN-1002','finance.arber','finance.arber@university.edu','finance','Arber Sinani','+355680700002','Finance Office'),
      ('USR-FIN-1003','finance.anxhela','finance.anxhela@university.edu','finance','Anxhela Mema','+355680700003','Finance Office'),
      ('USR-IT-1001','it.klodi','it.klodi@university.edu','it-admin','Klodi Kola','+355680800001','IT Services'),
      ('USR-IT-1002','it.bora','it.bora@university.edu','it-admin','Bora Zeneli','+355680800002','IT Services'),
      ('USR-IT-1003','it.dren','it.dren@university.edu','it-admin','Dren Lila','+355680800003','IT Services'),
      ('USR-DEAN-1001','dean.amelia','dean.amelia@university.edu','dean','Amelia Kodra','+355680900001','Academic Affairs'),
      ('USR-DEAN-1002','dean.petra','dean.petra@university.edu','dean','Petra Nushi','+355680900002','Academic Affairs'),
      ('USR-DEAN-1003','dean.ilir','dean.ilir@university.edu','dean','Ilir Muja','+355680900003','Academic Affairs'),
      ('USR-HOD-1001','hod.cs','hod.cs@university.edu','hod','Arjan Tafaj','+355681000001','Computer Science'),
      ('USR-HOD-1002','hod.ds','hod.ds@university.edu','hod','Megi Dervishi','+355681000002','Data Science'),
      ('USR-HOD-1003','hod.biz','hod.biz@university.edu','hod','Besnik Lami','+355681000003','Business Administration'),
      ('USR-LIB-1001','library.ona','library.ona@university.edu','librarian','Ona Vata','+355681100001','Library'),
      ('USR-LIB-1002','library.klevis','library.klevis@university.edu','librarian','Klevis Gega','+355681100002','Library'),
      ('USR-LIB-1003','library.riela','library.riela@university.edu','librarian','Riela Pango','+355681100003','Library'),
      ('USR-SA-1001','superadmin.alban','superadmin.alban@university.edu','super-admin','Alban Reka','+355681200001','Executive Admin'),
      ('USR-SA-1002','superadmin.fjora','superadmin.fjora@university.edu','super-admin','Fjora Gashi','+355681200002','Executive Admin'),
      ('USR-SA-1003','superadmin.luan','superadmin.luan@university.edu','super-admin','Luan Shkreli','+355681200003','Executive Admin'),
      ('USR-SAFF-1001','studaff.ina','studaff.ina@university.edu','student-affairs','Ina Lleshi','+355681300001','Student Affairs'),
      ('USR-SAFF-1002','studaff.keti','studaff.keti@university.edu','student-affairs','Keti Tola','+355681300002','Student Affairs'),
      ('USR-SAFF-1003','studaff.adi','studaff.adi@university.edu','student-affairs','Adi Guri','+355681300003','Student Affairs'),
      ('USR-HR-1001','hr.livia','hr.livia@university.edu','hr','Livia Cani','+355681400001','Human Resources'),
      ('USR-HR-1002','hr.aldo','hr.aldo@university.edu','hr','Aldo Bregu','+355681400002','Human Resources'),
      ('USR-HR-1003','hr.gerta','hr.gerta@university.edu','hr','Gerta Lila','+355681400003','Human Resources'),
      ('USR-SEC-1001','security.dani','security.dani@university.edu','security','Dani Frasheri','+355681500001','Security'),
      ('USR-SEC-1002','security.eri','security.eri@university.edu','security','Eri Mehmeti','+355681500002','Security'),
      ('USR-SEC-1003','security.bledi','security.bledi@university.edu','security','Bledi Ceka','+355681500003','Security'),
      ('USR-FAC-1001','facilities.rina','facilities.rina@university.edu','facilities','Rina Shehu','+355681600001','Facilities'),
      ('USR-FAC-1002','facilities.klajd','facilities.klajd@university.edu','facilities','Klajd Nika','+355681600002','Facilities'),
      ('USR-FAC-1003','facilities.elton','facilities.elton@university.edu','facilities','Elton Biba','+355681600003','Facilities'),
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



 --Dean              | dean.petra             | dean.petra@university.edu          | Test@1234
 

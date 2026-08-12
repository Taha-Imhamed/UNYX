-- Adds NOT NULL to columns that are already required in practice (enforced by
-- zod at the API layer in students.ts/enrollments.ts) but were never locked at
-- the DB layer, meaning a raw SQL insert or a future route bypassing validation
-- could silently write garbage. Scope limited to columns confirmed zero-NULL
-- across every existing row (checked against unyt_backup_20260812_084102.sql,
-- full table scan, before writing this) and confirmed required by the create
-- schemas: createStudentCoreSchema (students.ts), createEnrollmentSchema +
-- the /meta/courses handler (enrollments.ts). Columns the app treats as
-- optional (phone, balance, professorId on enrollments, price, etc.) are left
-- nullable on purpose — locking those would reject inserts the app already
-- makes today.

alter table public.students
  alter column first_name set not null,
  alter column last_name set not null,
  alter column email set not null;

alter table public.professors
  alter column first_name set not null,
  alter column last_name set not null,
  alter column email set not null;

alter table public.courses
  alter column title set not null,
  alter column professor_id set not null;

alter table public.enrollments
  alter column student_id set not null,
  alter column course_id set not null;

create table if not exists public.semesters (
  id text primary key,
  label text not null,
  academic_year text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_semesters_status on public.semesters (status);
create index if not exists idx_semesters_start_date on public.semesters (start_date);

alter table public.courses
  add column if not exists semester_id text null references public.semesters(id);

alter table public.enrollments
  add column if not exists semester_id text null references public.semesters(id);

alter table public.finance_invoices
  add column if not exists semester_id text null references public.semesters(id);

-- students.year_level already exists live as `text`, populated only by the ad-hoc
-- simulation_seed.sql script with word values ('first-year'/'second-year'/'third-year'),
-- never by application code (confirmed: zero code references anywhere in backend/frontend).
-- Convert to integer so it can become the real class-year field, mapping both the old
-- word vocabulary and any stray "Year N" / bare-digit values seen elsewhere in the app.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students' and column_name = 'year_level' and data_type <> 'integer'
  ) then
    alter table public.students
      alter column year_level type integer using (
        case lower(trim(year_level))
          when 'first-year' then 1
          when 'second-year' then 2
          when 'third-year' then 3
          when 'fourth-year' then 4
          when 'fifth-year' then 5
          when 'sixth-year' then 6
          else nullif(regexp_replace(year_level, '[^0-9]', '', 'g'), '')::integer
        end
      );
  end if;
end $$;

alter table public.students
  add column if not exists year_level integer null;

create index if not exists idx_courses_semester_id on public.courses (semester_id);
create index if not exists idx_enrollments_semester_id on public.enrollments (semester_id);
create index if not exists idx_finance_invoices_semester_id on public.finance_invoices (semester_id);

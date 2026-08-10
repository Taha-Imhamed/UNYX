create table if not exists public.advising_appointments (
  id text primary key,
  student_id text not null,
  student_name text not null,
  advisor_id text not null,
  advisor_name text not null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30,
  status text not null default 'requested',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_advising_appointments_student_id on public.advising_appointments (student_id);
create index if not exists idx_advising_appointments_advisor_id on public.advising_appointments (advisor_id);

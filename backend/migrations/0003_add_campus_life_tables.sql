-- Campus events
create table if not exists public.campus_events (
  id text primary key,
  title text not null,
  description text null,
  category text not null default 'other',
  location text not null,
  start_at timestamptz not null,
  end_at timestamptz null,
  capacity integer null,
  rsvp_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campus_event_rsvps (
  id text primary key,
  event_id text not null,
  student_id text not null,
  student_name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_campus_event_rsvps_unique on public.campus_event_rsvps (event_id, student_id);
create index if not exists idx_campus_event_rsvps_event_id on public.campus_event_rsvps (event_id);

-- Housing
create table if not exists public.housing_assignments (
  id text primary key,
  student_id text not null,
  student_name text not null,
  building_name text not null,
  room_number text not null,
  bed_number text null,
  status text not null default 'active',
  start_date timestamptz not null,
  end_date timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_housing_assignments_student_id on public.housing_assignments (student_id);

-- Meal plans
create table if not exists public.meal_plans (
  id text primary key,
  student_id text not null,
  student_name text not null,
  plan_name text not null,
  balance numeric not null default 0,
  status text not null default 'active',
  start_date timestamptz not null,
  end_date timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_meal_plans_student_id on public.meal_plans (student_id);

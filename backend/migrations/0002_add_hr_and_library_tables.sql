-- HR module tables
create table if not exists public.staff_records (
  id text primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  department text null,
  "position" text null,
  employment_status text not null default 'active',
  hire_date timestamptz null,
  salary numeric null,
  phone text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_entries (
  id text primary key,
  staff_id text not null,
  staff_name text not null,
  pay_period text not null,
  amount numeric not null,
  status text not null default 'pending',
  paid_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payroll_entries_staff_id on public.payroll_entries (staff_id);

-- Library module tables
create table if not exists public.library_books (
  id text primary key,
  title text not null,
  author text not null,
  isbn text null,
  category text null,
  total_copies integer not null default 1,
  available_copies integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_loans (
  id text primary key,
  book_id text not null,
  book_title text not null,
  borrower_name text not null,
  borrower_type text not null default 'student',
  borrowed_at timestamptz not null default now(),
  due_at timestamptz not null,
  returned_at timestamptz null,
  status text not null default 'borrowed',
  created_at timestamptz not null default now()
);

create index if not exists idx_library_loans_book_id on public.library_loans (book_id);

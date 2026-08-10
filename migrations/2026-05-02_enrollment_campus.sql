-- Add campus metadata for enrollments
alter table public.enrollments
  add column if not exists campus text null;

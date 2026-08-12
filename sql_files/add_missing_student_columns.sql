-- Add missing student profile columns so Add/Edit Student form data persists.
-- Safe to run multiple times.

alter table if exists students add column if not exists middle_name text;
alter table if exists students add column if not exists major text;
alter table if exists students add column if not exists gender text;
alter table if exists students add column if not exists nationality text;
alter table if exists students add column if not exists national_id text;
alter table if exists students add column if not exists passport_number text;
alter table if exists students add column if not exists blood_type text;
alter table if exists students add column if not exists city text;
alter table if exists students add column if not exists postal_code text;
alter table if exists students add column if not exists emergency_contact_name text;
alter table if exists students add column if not exists emergency_contact_phone text;
alter table if exists students add column if not exists mother_name text;
alter table if exists students add column if not exists father_name text;

-- Optional: helpful indexes for common filters/searches
create index if not exists idx_students_major on students (major);
create index if not exists idx_students_city on students (city);
create index if not exists idx_students_nationality on students (nationality);

alter table public.users add column if not exists mfa_enabled boolean not null default false;
alter table public.users add column if not exists mfa_secret text null;

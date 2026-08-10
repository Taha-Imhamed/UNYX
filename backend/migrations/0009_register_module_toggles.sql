-- module_toggles already exists live (hand-applied 2026-08-03 from the orphaned root
-- migrations/2026-08-03_module_toggles.sql, outside the tracked migration system).
-- This file is a no-op against the live table; it exists purely so schema_migrations
-- has a record of it going forward.

create table if not exists public.module_toggles (
  id text primary key,
  passphrase_hash text null,
  disabled_modules jsonb not null default '[]'::jsonb,
  disabled_features jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text null
);

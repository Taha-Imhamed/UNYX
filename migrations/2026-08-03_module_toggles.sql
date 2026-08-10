-- Terminal module visibility toggles (super-admin only)
create table if not exists public.module_toggles (
  id text primary key,
  passphrase_hash text null,
  disabled_modules jsonb not null default '[]'::jsonb,
  disabled_features jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text null
);

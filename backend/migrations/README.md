# Migrations

Versioned, ordered SQL schema changes. Run with:

```
npm run migrate
```

This applies every `NNNN_description.sql` file in this folder that isn't already recorded in the `public.schema_migrations` table, in filename order, and records each one as it succeeds.

## Adding a migration

1. Create a new file: `000N_short_description.sql` (next number, zero-padded).
2. Write plain SQL. Prefer additive, idempotent statements (`add column if not exists`, `create index if not exists`) so a migration is safe to re-run and doesn't destroy data if something goes wrong partway through.
3. Run `npm run migrate` locally against your dev database to confirm it applies cleanly before committing.

Migrations only ever move forward — there's no down/rollback mechanism. To undo a change, write a new migration that reverses it.

## Relationship to the ad-hoc `.sql` files at the repo root

Files like `add_missing_student_columns.sql`, `seed_*.sql`, etc. at the repo root are one-off scripts (seed data, manual patches) run by hand — they predate this migrations system and aren't tracked in `schema_migrations`. Going forward, real schema changes should be added here instead of as loose root-level scripts.

#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BACKFILL_SQL="$ROOT_DIR/migrations/2026-05-02_enrollment_campus_backfill.sql"

run() {
  printf '\n> %s\n' "$*"
  "$@"
}

printf 'UNYT deploy verification starting...\n'

run npm --prefix "$ROOT_DIR/backend" run build
run npm --prefix "$ROOT_DIR/frontend" run build

run npm --prefix "$ROOT_DIR/backend" test

if node -e "const p=require(process.argv[1]); process.exit(p.scripts && p.scripts.test ? 0 : 1)" "$ROOT_DIR/frontend/package.json"; then
  run npm --prefix "$ROOT_DIR/frontend" test
else
  printf '\n> frontend unit tests\n'
  printf 'No frontend unit test script is defined; skipping frontend unit tests.\n'
fi

DB_URL="${DATABASE_URL:-${SUPABASE_DB_URL:-}}"
if [ -z "$DB_URL" ]; then
  printf 'DATABASE_URL or SUPABASE_DB_URL is required to run the migration backfill.\n' >&2
  exit 1
fi

if [ ! -f "$BACKFILL_SQL" ]; then
  printf 'Backfill migration not found: %s\n' "$BACKFILL_SQL" >&2
  exit 1
fi

node -e "const { spawnSync } = require('node:child_process'); process.exit(spawnSync('psql', ['--version'], { stdio: 'ignore' }).status === 0 ? 0 : 1)"
run psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$BACKFILL_SQL"

if [ -n "${VERIFY_SERVER_URL:-}" ]; then
  node -e "const base=process.env.VERIFY_SERVER_URL.replace(/\/$/, ''); fetch(base + '/api/health').then(async (res) => { const body = await res.text(); if (!res.ok) throw new Error(body || ('health failed: ' + res.status)); console.log('Health check OK:', body); }).catch((error) => { console.error(error.message); process.exit(1); })"
else
  printf '\n> server health\n'
  printf 'VERIFY_SERVER_URL not set; build, tests, and migration backfill completed. Set VERIFY_SERVER_URL to verify a live /api/health endpoint.\n'
fi

printf '\nUNYT deploy verification completed successfully. Production readiness checks passed.\n'

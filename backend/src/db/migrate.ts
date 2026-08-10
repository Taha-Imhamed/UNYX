import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { runDbQuery, disconnectDb } from './postgres.js'
import { logger } from '../lib/logger.js'

dotenv.config({ path: '.env.local' })
dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
// Compiled output lives at dist/backend/src/db/migrate.js; migrations/ stays at the
// backend package root, three levels up from there. In dev (tsx), this file runs from
// src/db/ directly, one level up from the package root — resolve whichever exists.
const MIGRATIONS_DIR_CANDIDATES = [
  join(__dirname, '../../../../migrations'), // dist/backend/src/db -> backend/migrations
  join(__dirname, '../../migrations'), // src/db -> backend/migrations
]

function resolveMigrationsDir(): string {
  for (const candidate of MIGRATIONS_DIR_CANDIDATES) {
    try {
      readdirSync(candidate)
      return candidate
    } catch {
      continue
    }
  }
  throw new Error(`Could not locate migrations/ directory. Tried: ${MIGRATIONS_DIR_CANDIDATES.join(', ')}`)
}

async function ensureMigrationsTable() {
  await runDbQuery(`
    create table if not exists public.schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `)
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await runDbQuery<{ id: string }>('select id from public.schema_migrations')
  return new Set(rows.map((row) => row.id))
}

export async function runMigrations() {
  const migrationsDir = resolveMigrationsDir()
  await ensureMigrationsTable()
  const applied = await getAppliedMigrations()

  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()

  let ranCount = 0
  for (const file of files) {
    if (applied.has(file)) continue
    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    logger.info(`[migrate] applying ${file}`)
    await runDbQuery(sql)
    await runDbQuery('insert into public.schema_migrations (id) values ($1)', [file])
    ranCount += 1
  }

  if (ranCount === 0) {
    logger.info('[migrate] already up to date')
  } else {
    logger.info(`[migrate] applied ${ranCount} migration(s)`)
  }
}

// This module is only ever invoked directly as a CLI entrypoint (`npm run migrate`),
// never imported elsewhere, so it's safe to just run on load.
runMigrations()
  .then(() => disconnectDb())
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, '[migrate] failed')
    process.exit(1)
  })

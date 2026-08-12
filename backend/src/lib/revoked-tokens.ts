import { runDbQuery } from '../db/postgres.js'

let schemaReady = false

async function ensureRevokedTokensStorage() {
  if (schemaReady) return
  await runDbQuery(`
    create table if not exists public.revoked_tokens (
      jti text primary key,
      revoked_at timestamptz not null default now(),
      revoked_by text null,
      reason text null
    )
  `)
  schemaReady = true
}

// In-process cache so the hot path (every authenticated request) doesn't hit Postgres —
// revocations are rare (an admin action), reads are constant. Cleared entries are never
// removed from the DB table (tokens naturally expire after 12h; the table just accumulates
// a small amount of history, cheap to leave as an audit trail).
const revokedCache = new Set<string>()
let cacheLoaded = false

async function loadCache() {
  if (cacheLoaded) return
  await ensureRevokedTokensStorage()
  const { rows } = await runDbQuery<{ jti: string }>('select jti from public.revoked_tokens')
  rows.forEach((row) => revokedCache.add(row.jti))
  cacheLoaded = true
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  await loadCache()
  return revokedCache.has(jti)
}

export async function revokeToken(jti: string, revokedBy?: string | null, reason?: string | null) {
  await ensureRevokedTokensStorage()
  await runDbQuery(
    'insert into public.revoked_tokens (jti, revoked_by, reason) values ($1, $2, $3) on conflict (jti) do nothing',
    [jti, revokedBy ?? null, reason ?? null],
  )
  revokedCache.add(jti)
}

import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { moduleTogglesCollection } from '../data/collections.js'
import { TERMINAL_MODULES } from '../data/terminal-modules.js'
import { runDbQuery, getCollection, invalidateTableCache } from '../db/postgres.js'
import type { ModuleAccessState, ModuleToggleState, SystemRole, User } from '../../../shared/types/index.js'

export const terminalRoutes: ReturnType<typeof Router> = Router()

const VALID_STATES: ModuleAccessState[] = ['open', 'locked', 'hidden']

// Roles with a dedicated terminal module today — the only roles that get real
// feature-level controls in the Terminal's role view. Other roles show a live
// user count only, since there's no gated module to toggle for them yet.
const ROLE_MODULE_MAP: Partial<Record<SystemRole, string>> = {
  student: 'student-portal',
  professor: 'professor',
}

interface UserFeatureOverride extends Record<string, unknown> {
  id: string
  userId: string
  moduleKey: string
  featureKey: string
  state: ModuleAccessState
  createdAt: string
  createdBy?: string | null
}

let schemaReady = false

// The module_toggles table was originally created with only disabled_modules/disabled_features
// (a hidden-only boolean list). Locked/hidden per-module state and the lock message need their
// own columns, or writes to those fields are silently dropped by the generic column-mapped ORM.
async function ensureTerminalSchema() {
  if (schemaReady) return
  await runDbQuery(`
    create table if not exists module_toggles (
      id text primary key,
      passphrase_hash text null,
      disabled_modules jsonb not null default '[]'::jsonb,
      disabled_features jsonb not null default '[]'::jsonb,
      module_states jsonb not null default '{}'::jsonb,
      feature_states jsonb not null default '{}'::jsonb,
      lock_message text null,
      updated_at timestamptz not null default now(),
      updated_by text null
    )
  `)
  await runDbQuery(`
    alter table module_toggles
      add column if not exists module_states jsonb not null default '{}'::jsonb,
      add column if not exists feature_states jsonb not null default '{}'::jsonb,
      add column if not exists lock_message text null
  `)
  await runDbQuery(`
    create table if not exists public.user_feature_overrides (
      id text primary key,
      user_id text not null,
      module_key text not null,
      feature_key text not null,
      state text not null,
      created_at timestamptz not null default now(),
      created_by text null,
      unique (user_id, module_key, feature_key)
    )
  `)
  await runDbQuery(`create index if not exists idx_user_feature_overrides_user_id on public.user_feature_overrides (user_id)`)
  invalidateTableCache('module_toggles')
  invalidateTableCache('user_feature_overrides')
  schemaReady = true
}

function isSuperAdmin(role?: string) {
  return role === 'super-admin'
}

async function userFeatureOverridesCollection() {
  await ensureTerminalSchema()
  return getCollection<UserFeatureOverride>('user_feature_overrides')
}

async function loadOverridesForUser(userId: string): Promise<Record<string, ModuleAccessState>> {
  const collection = await userFeatureOverridesCollection()
  const rows = await collection.find({ userId }).toArray()
  const overrides: Record<string, ModuleAccessState> = {}
  for (const row of rows) {
    overrides[`${row.moduleKey}:${row.featureKey}`] = row.state
  }
  return overrides
}

function migrateLegacyState(state: ModuleToggleState): ModuleToggleState {
  if (state.moduleStates && state.featureStates) return state
  const moduleStates: Record<string, ModuleAccessState> = {}
  const featureStates: Record<string, ModuleAccessState> = {}
  for (const key of state.disabledModules ?? []) moduleStates[key] = 'hidden'
  for (const key of state.disabledFeatures ?? []) featureStates[key] = 'hidden'
  return { ...state, moduleStates, featureStates }
}

async function loadState(): Promise<ModuleToggleState> {
  await ensureTerminalSchema()
  const collection = await moduleTogglesCollection()
  const state = await collection.findOne({ id: 'global' })
  const base: ModuleToggleState = state ?? {
    id: 'global',
    passphraseHash: null,
    disabledModules: [],
    disabledFeatures: [],
    moduleStates: {},
    featureStates: {},
    lockMessage: null,
    updatedAt: new Date().toISOString(),
    updatedBy: null,
  }
  return migrateLegacyState(base)
}

export async function getModuleState(moduleKey: string): Promise<ModuleAccessState> {
  const state = await loadState()
  return state.moduleStates[moduleKey] ?? 'open'
}

export async function getLockMessage(): Promise<string> {
  const state = await loadState()
  return state.lockMessage || 'This page is under maintenance. We are working on it.'
}

terminalRoutes.get('/public-state', async (req, res) => {
  try {
    const state = await loadState()
    // Per-user overrides win over the global feature state for the requesting user
    // only — this is the single merge point every frontend consumer reads through
    // (ModuleTogglesProvider), so overrides apply everywhere with no other changes.
    const userId = req.auth?.userId
    const featureStates = userId
      ? { ...state.featureStates, ...(await loadOverridesForUser(userId)) }
      : state.featureStates

    res.json({
      success: true,
      data: {
        moduleStates: state.moduleStates,
        featureStates,
        lockMessage: state.lockMessage || 'This page is under maintenance. We are working on it.',
      },
    })
  } catch (error) {
    console.error('Failed to fetch public terminal state', error)
    res.status(500).json({ success: false, error: 'Failed to fetch terminal state' })
  }
})

terminalRoutes.get('/state', async (req, res) => {
  try {
    if (!isSuperAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Super admin access required' })
    }
    const state = await loadState()
    res.json({
      success: true,
      data: {
        moduleStates: state.moduleStates,
        featureStates: state.featureStates,
        lockMessage: state.lockMessage ?? '',
        modules: TERMINAL_MODULES,
      },
    })
  } catch (error) {
    console.error('Failed to fetch terminal state', error)
    res.status(500).json({ success: false, error: 'Failed to fetch terminal state' })
  }
})

terminalRoutes.put('/toggles', async (req, res) => {
  try {
    if (!isSuperAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Super admin access required' })
    }

    const rawModuleStates = req.body?.moduleStates
    const rawFeatureStates = req.body?.featureStates
    const lockMessage = typeof req.body?.lockMessage === 'string' ? req.body.lockMessage : undefined

    const sanitize = (raw: unknown): Record<string, ModuleAccessState> => {
      if (!raw || typeof raw !== 'object') return {}
      const out: Record<string, ModuleAccessState> = {}
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof value === 'string' && VALID_STATES.includes(value as ModuleAccessState)) {
          out[key] = value as ModuleAccessState
        }
      }
      return out
    }

    const moduleStates = sanitize(rawModuleStates)
    const featureStates = sanitize(rawFeatureStates)

    const state = await loadState()
    const updated: ModuleToggleState = {
      ...state,
      moduleStates,
      featureStates,
      disabledModules: Object.entries(moduleStates).filter(([, v]) => v === 'hidden').map(([k]) => k),
      disabledFeatures: Object.entries(featureStates).filter(([, v]) => v === 'hidden').map(([k]) => k),
      lockMessage: lockMessage !== undefined ? lockMessage : state.lockMessage,
      updatedAt: new Date().toISOString(),
      updatedBy: req.auth?.username ?? req.auth?.userId ?? null,
    }
    const collection = await moduleTogglesCollection()
    await collection.updateOne({ id: 'global' }, { $set: updated }, { upsert: true })
    res.json({
      success: true,
      data: {
        moduleStates: updated.moduleStates,
        featureStates: updated.featureStates,
        lockMessage: updated.lockMessage ?? '',
      },
    })
  } catch (error) {
    console.error('Failed to update terminal toggles', error)
    res.status(500).json({ success: false, error: 'Failed to update terminal toggles' })
  }
})

const ALL_ROLES: SystemRole[] = [
  'admin', 'super-admin', 'supervisor', 'user', 'student', 'professor', 'advisor',
  'teaching-assistant', 'registrar', 'admissions', 'finance', 'it-admin', 'dean',
  'hod', 'librarian', 'student-affairs', 'hr', 'security', 'facilities', 'research-office',
]

terminalRoutes.get('/roles', async (req, res) => {
  try {
    if (!isSuperAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Super admin access required' })
    }
    const { rows } = await runDbQuery<{ role: string; count: string }>(
      `select role, count(*)::text as count from public.users group by role`,
    )
    const countByRole = new Map(rows.map((row) => [row.role, Number(row.count)]))

    const data = ALL_ROLES.map((role) => ({
      role,
      userCount: countByRole.get(role) ?? 0,
      moduleKey: ROLE_MODULE_MAP[role] ?? null,
    }))

    res.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch role summaries', error)
    res.status(500).json({ success: false, error: 'Failed to fetch role summaries' })
  }
})

terminalRoutes.get('/roles/:role/users', async (req, res) => {
  try {
    if (!isSuperAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Super admin access required' })
    }
    const role = req.params.role
    const query = typeof req.query.query === 'string' ? req.query.query.trim().toLowerCase() : ''

    const usersCol = await getCollection<User>('users')
    const users = await usersCol.find({ role }).toArray()
    const filtered = !query
      ? users
      : users.filter((user) =>
          [user.username, user.email].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)),
        )

    res.json({
      success: true,
      data: filtered.map((user) => ({ id: user.id, username: user.username, email: user.email, status: user.status })),
    })
  } catch (error) {
    console.error('Failed to fetch users in role', error)
    res.status(500).json({ success: false, error: 'Failed to fetch users in role' })
  }
})

terminalRoutes.get('/overrides/:userId', async (req, res) => {
  try {
    if (!isSuperAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Super admin access required' })
    }
    const collection = await userFeatureOverridesCollection()
    const items = await collection.find({ userId: req.params.userId }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Failed to fetch user overrides', error)
    res.status(500).json({ success: false, error: 'Failed to fetch user overrides' })
  }
})

terminalRoutes.put('/overrides/:userId', async (req, res) => {
  try {
    if (!isSuperAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Super admin access required' })
    }
    const { moduleKey, featureKey, state } = req.body ?? {}
    if (typeof moduleKey !== 'string' || !moduleKey || typeof featureKey !== 'string' || !featureKey) {
      return res.status(400).json({ success: false, error: 'moduleKey and featureKey are required' })
    }

    const collection = await userFeatureOverridesCollection()
    const userId = req.params.userId

    // A null/"inherit" state means "remove the override, fall back to the global setting."
    if (state === null || state === 'inherit' || state === undefined) {
      await collection.deleteOne({ userId, moduleKey, featureKey })
      return res.json({ success: true, data: null })
    }

    if (!VALID_STATES.includes(state)) {
      return res.status(400).json({ success: false, error: 'state must be open, locked, hidden, or null' })
    }

    const existing = await collection.findOne({ userId, moduleKey, featureKey })
    const record: UserFeatureOverride = {
      id: existing?.id ?? `OVR-${randomUUID().slice(0, 8).toUpperCase()}`,
      userId,
      moduleKey,
      featureKey,
      state,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      createdBy: req.auth?.username ?? req.auth?.userId ?? null,
    }
    await collection.updateOne({ userId, moduleKey, featureKey }, { $set: record }, { upsert: true })
    res.json({ success: true, data: record })
  } catch (error) {
    console.error('Failed to update user override', error)
    res.status(500).json({ success: false, error: 'Failed to update user override' })
  }
})

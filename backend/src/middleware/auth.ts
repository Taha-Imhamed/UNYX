import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { maintenanceStateCollection } from '../data/collections.js'
import type { AccessProfile, Permission, SystemRole } from '../../../shared/types/index.js'
import { logger } from '../lib/logger.js'
import { isTokenRevoked } from '../lib/revoked-tokens.js'

const rawSecret = process.env.JWT_SECRET

if (!rawSecret) {
  const env = process.env.NODE_ENV || 'development'
  if (env === 'development' || env === 'test') {
    logger.warn('[auth] Using insecure dev JWT secret; set JWT_SECRET in production')
  } else {
    throw new Error('JWT_SECRET must be set in production environments')
  }
}

const JWT_SECRET = rawSecret || 'dev-insecure-secret'

export interface AuthTokenPayload {
  userId: string
  role: SystemRole
  secondaryRoles?: SystemRole[]
  username: string
  permissions?: Partial<Record<Permission, boolean>>
  customRoleId?: string | null
  customRoleName?: string | null
  accessProfile?: AccessProfile
  studentId?: string | null
  professorId?: string | null
  jti?: string
}

export interface AuthContext extends AuthTokenPayload {
  effectivePermissions: Permission[]
  jti?: string
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      auth?: AuthContext
    }
  }
}

const publicPaths = new Set<string>([
  '/api/health',
  '/api/users/auth/login',
  '/api/public/site-content',
  // allow unauthenticated clients to read maintenance state so admins can log in and recover access
  '/api/it-admin/maintenance-state',
])

const rolePermissions: Record<AuthTokenPayload['role'], Permission[]> = {
  admin: [
    'manage_users',
    'users:manage',
    'users:create',
    'users:edit',
    'users:delete',
    'students:view',
    'students:create',
    'students:edit',
    'students:delete',
    'professors:view',
    'professors:create',
    'professors:edit',
    'professors:delete',
    'marketing:view',
    'marketing:manage',
    'applications:view',
    'applications:manage',
    'finance:view',
    'finance:manage',
    'finance:approve',
    'VIEW_FINANCIALS',
    'enrollment:view',
    'enrollment:manage',
    'enrollment:self',
    'enrollment:override-window',
    'enrollment:override-capacity',
    'override_capacity',
    'edit_any_grade',
    'feedback:view',
    'feedback:manage',
    'news:view',
    'news:manage',
    'audit:view',
    'audit:export',
    'reports:view',
    'reports:export',
    'ADMIN_VIEW_SCHEDULE',
    'MANAGE_RESOURCES',
    'settings:manage',
    'settings:security',
    'settings:integrations',
    'settings:sso',
  ],
  'super-admin': [
    'manage_users',
    'users:manage',
    'users:create',
    'users:edit',
    'users:delete',
    'students:view',
    'students:create',
    'students:edit',
    'students:delete',
    'professors:view',
    'professors:create',
    'professors:edit',
    'professors:delete',
    'marketing:view',
    'marketing:manage',
    'applications:view',
    'applications:manage',
    'finance:view',
    'finance:manage',
    'finance:approve',
    'VIEW_FINANCIALS',
    'enrollment:view',
    'enrollment:manage',
    'enrollment:self',
    'enrollment:override-window',
    'enrollment:override-capacity',
    'override_capacity',
    'edit_any_grade',
    'feedback:view',
    'feedback:manage',
    'news:view',
    'news:manage',
    'audit:view',
    'audit:export',
    'reports:view',
    'reports:export',
    'ADMIN_VIEW_SCHEDULE',
    'MANAGE_RESOURCES',
    'settings:manage',
    'settings:security',
    'settings:integrations',
    'settings:sso',
  ],
  supervisor: ['students:view', 'students:edit', 'professors:view', 'professors:edit', 'marketing:view', 'marketing:manage', 'applications:view', 'applications:manage', 'enrollment:view', 'enrollment:manage', 'edit_any_grade', 'feedback:view', 'feedback:manage', 'news:view', 'news:manage', 'reports:view', 'reports:export', 'ADMIN_VIEW_SCHEDULE'],
  advisor: ['students:view', 'enrollment:view', 'enrollment:manage', 'feedback:view', 'reports:view'],
  'teaching-assistant': ['students:view', 'enrollment:view', 'reports:view'],
  registrar: ['students:view', 'students:edit', 'enrollment:view', 'enrollment:manage', 'enrollment:register', 'reports:view'],
  admissions: ['students:view', 'students:create', 'students:edit', 'marketing:view', 'marketing:manage', 'applications:view', 'applications:manage', 'enrollment:view', 'enrollment:manage', 'reports:view'],
  finance: ['students:view', 'finance:view', 'finance:manage', 'finance:approve', 'VIEW_FINANCIALS', 'reports:view', 'reports:export'],
  'it-admin': ['users:manage', 'users:edit', 'audit:view', 'audit:export', 'settings:manage', 'settings:security', 'settings:integrations', 'settings:sso', 'reports:view'],
  dean: ['students:view', 'professors:view', 'professors:manage', 'enrollment:view', 'reports:view', 'reports:export', 'academic:approve', 'graduation:approve', 'hod:oversight'],
  hod: ['professors:view', 'enrollment:view', 'enrollment:manage', 'reports:view'],
  librarian: ['reports:view'],
  'student-affairs': ['students:view', 'students:edit', 'marketing:view', 'marketing:manage', 'feedback:view', 'feedback:manage', 'reports:view'],
  hr: ['users:manage', 'users:create', 'users:edit', 'settings:manage', 'reports:view'],
  security: ['audit:view', 'audit:export', 'reports:view'],
  facilities: ['reports:view', 'enrollment:view'],
  'research-office': ['marketing:view', 'news:view', 'news:manage', 'reports:view'],
  user: ['enrollment:self'],
  student: ['enrollment:self'],
  professor: ['ENTER_GRADES', 'edit_own_grades'],
}

function resolvePermissions(role: AuthTokenPayload['role'], overrides?: Partial<Record<Permission, boolean>>, secondaryRoles?: SystemRole[]): Permission[] {
  const base = new Set(rolePermissions[role] ?? [])
  ;(Array.isArray(secondaryRoles) ? secondaryRoles : []).forEach((secondaryRole) => {
    for (const permission of rolePermissions[secondaryRole] ?? []) {
      base.add(permission)
    }
  })
  if (overrides) {
    for (const [key, value] of Object.entries(overrides) as Array<[Permission, boolean]>) {
      if (value) {
        base.add(key)
      } else {
        base.delete(key)
      }
    }
  }
  return Array.from(base)
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign({ ...payload, jti: payload.jti ?? randomUUID() }, JWT_SECRET, { expiresIn: '12h' })
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const rawPath = req.originalUrl.split('?')[0]
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath
  if (publicPaths.has(path)) {
    return next()
  }

  // Allow unauthenticated public submissions to feedback (admissions form)
  if (path === '/api/feedback' && req.method.toUpperCase() === 'POST') {
    return next()
  }

  const header = req.get('authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  const token = header.slice('Bearer '.length)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload
    // Forced-timeout support: a JWT is otherwise valid until its 12h expiry with no
    // server-side way to revoke it early, so IoT Connectors' "timeout" action records the
    // jti here — every request after that point is rejected even though the token itself
    // still verifies fine.
    if (decoded.jti && (await isTokenRevoked(decoded.jti))) {
      return res.status(401).json({ success: false, error: 'Session has been ended by an administrator' })
    }
    req.auth = { ...decoded, effectivePermissions: resolvePermissions(decoded.role, decoded.permissions, decoded.secondaryRoles) }
    return next()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token'
    logger.warn({ path: req.originalUrl, reason: message }, '[auth] authentication failed')
    return res.status(401).json({ success: false, error: `Authentication failed: ${message}` })
  }
}

function isMaintenanceExempt(auth?: AuthContext) {
  return auth?.role === 'admin' || auth?.role === 'super-admin' || auth?.role === 'it-admin'
}

function isMissingRelationError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '42P01'
}

export async function enforceMaintenanceMode(req: Request, res: Response, next: NextFunction) {
  try {
    const maintenanceCol = await maintenanceStateCollection()
    const state = await maintenanceCol.findOne({ id: 'global' })

    if (!state?.enabled) {
      return next()
    }

    if (isMaintenanceExempt(req.auth)) {
      return next()
    }

    return res.status(503).json({
      success: false,
      error: state.message || 'The system is temporarily in maintenance mode',
      maintenance: true,
    })
  } catch (error) {
    if (isMissingRelationError(error)) {
      logger.warn('[auth] maintenance_state table missing; skipping maintenance enforcement')
      return next()
    }

    throw error
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'super-admin' || req.auth?.role === 'supervisor'
  if (!isPrivileged) {
    return res.status(403).json({ success: false, error: 'Admin or supervisor privileges required' })
  }
  return next()
}

export function requirePermission(...required: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Admin should bypass granular permission checks
    if (req.auth?.role === 'admin' || req.auth?.role === 'super-admin') {
      return next()
    }
    const available = req.auth?.effectivePermissions ?? []
    const allowed = required.every((perm) => available.includes(perm))
    if (!allowed) {
      logger.warn(
        {
          path: req.originalUrl,
          userId: req.auth?.userId,
          role: req.auth?.role,
          required,
        },
        '[auth] permission denied',
      )
      return res.status(403).json({ success: false, error: 'Insufficient permissions' })
    }
    return next()
  }
}

export function getEffectivePermissions(auth?: AuthTokenPayload) {
  if (!auth) return [] as Permission[]
  return resolvePermissions(auth.role, auth.permissions, auth.secondaryRoles)
}

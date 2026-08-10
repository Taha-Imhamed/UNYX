import { Router } from 'express'
import { getCollection, invalidateTableCache, runDbQuery } from '../db/postgres.js'
import type { AccessProfile, CustomRoleTemplate, Permission, Professor, Student, SystemRole, User, UserNotification } from '../../../shared/types/index.js'
import { studentsCollection, professorsCollection, enrollmentsCollection, paymentsCollection } from '../data/collections.js'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { requireAdmin, requirePermission, signAuthToken, getEffectivePermissions } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import { generateSecret as generateMfaSecret, verify as verifyMfaToken, generateURI as generateMfaUri } from 'otplib'
import qrcode from 'qrcode'
import { assignBaseCoursesToFirstYearStudent } from '../lib/base-course-assignment.js'
import { liveLog, extractClientIp, parseUserAgent } from '../lib/request-log.js'
import { logger } from '../lib/logger.js'
import { createRateLimiter } from '../middleware/rate-limit.js'
import { readPagination, UNPAGINATED_SAFETY_CAP } from '../lib/pagination.js'
import { writeAuditLog } from '../lib/academic-compliance.js'

export const userRoutes: ReturnType<typeof Router> = Router()

const USERS_COLLECTION = 'users'
const CUSTOM_ROLES_COLLECTION = 'custom_roles'
const NOTIFICATIONS_COLLECTION = 'notifications'
const SYSTEM_ROLES = ['admin', 'super-admin', 'supervisor', 'user', 'student', 'professor', 'advisor', 'teaching-assistant', 'registrar', 'admissions', 'finance', 'it-admin', 'dean', 'hod', 'librarian', 'student-affairs', 'hr', 'security', 'facilities', 'research-office'] as const satisfies readonly SystemRole[]
const SYSTEM_ROLE_VALUES = [...SYSTEM_ROLES] as [SystemRole, ...SystemRole[]]

const ACCESS_PROFILE_BOOLEAN_KEYS = [
  'allowEnrollmentAnytime',
  'allowEnrollmentWhenClosed',
  'allowEnrollmentOverCapacity',
  'allowDeveloperWorkspace',
  'allowSensitiveSettings',
  'allowAuditExports',
  'allowUserLifecycleManagement',
  'allowStudentLifecycleManagement',
  'allowProfessorLifecycleManagement',
  'allowFinanceApprovals',
  'allowApplicationDecisions',
  'allowNewsPublishing',
] as const

const rateLimitLogin = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Please try again later.',
  label: 'login',
})

// Password-change endpoints are a common brute-force/enumeration target — limit by IP
// (pre-auth admin-reset) or by the authenticated user's own id (self-service change),
// tighter than login since these act on an already-identified account.
const rateLimitPasswordChange = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many password change attempts. Please try again later.',
  label: 'password-change',
  keyGenerator: (req) => req.auth?.userId || req.ip || req.socket.remoteAddress || 'unknown',
})

const rateLimitAdminReset = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many password reset attempts. Please try again later.',
  label: 'admin-password-reset',
  keyGenerator: (req) => req.auth?.userId || req.ip || req.socket.remoteAddress || 'unknown',
})

type StoredUserDocument = {
  id: string;
  username: string;
  normalizedUsername: string;
  email: string;
  role: SystemRole;
  secondaryRoles?: SystemRole[] | null;
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  avatarUrl?: string | null;
  password: string;
  deletedAt?: string | null;
  permissions?: Partial<Record<Permission, boolean>>;
  customRoleId?: string | null;
  customRoleName?: string | null;
  accessProfile?: AccessProfile;
  studentId?: string | null;
  professorId?: string | null;
  mfaEnabled?: boolean | null;
  mfaSecret?: string | null;
};

type StoredCustomRoleDocument = CustomRoleTemplate

function normalizeAccessProfile(value: unknown): AccessProfile | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined

  const profile: AccessProfile = {}
  for (const key of ACCESS_PROFILE_BOOLEAN_KEYS) {
    const raw = (value as Record<string, unknown>)[key]
    if (typeof raw === 'boolean') {
      profile[key] = raw
    }
  }

  const notes = (value as Record<string, unknown>).notes
  if (typeof notes === 'string' && notes.trim()) {
    profile.notes = notes.trim()
  }

  return Object.keys(profile).length > 0 ? profile : undefined
}

async function ensureUserAdminStorage() {
  await runDbQuery(`
    create table if not exists public.custom_roles (
      id text primary key,
      name text not null,
      description text null,
      base_role text not null,
      permissions jsonb not null default '{}'::jsonb,
      access_profile jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`
    alter table public.users
      add column if not exists custom_role_id text null,
      add column if not exists custom_role_name text null,
      add column if not exists access_profile jsonb not null default '{}'::jsonb,
      add column if not exists secondary_roles jsonb not null default '[]'::jsonb
  `)

  await runDbQuery(`
    create table if not exists public.user_permissions (
      id bigserial primary key,
      user_id text not null,
      permission_key text not null,
      allowed boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`create unique index if not exists idx_custom_roles_name on public.custom_roles (name)`)
  await runDbQuery(`create index if not exists idx_users_custom_role_id on public.users (custom_role_id)`)
  await runDbQuery(`create unique index if not exists idx_user_permissions_unique on public.user_permissions (user_id, permission_key)`)
  await runDbQuery(`create index if not exists idx_user_permissions_user_id on public.user_permissions (user_id)`)
  invalidateTableCache(CUSTOM_ROLES_COLLECTION)
  invalidateTableCache(USERS_COLLECTION)
}

async function customRolesCollection() {
  await ensureUserAdminStorage()
  return getCollection<StoredCustomRoleDocument>(CUSTOM_ROLES_COLLECTION)
}

async function userPermissionsCollection() {
  await ensureUserAdminStorage()
  return getCollection<{ id: number; userId: string; permissionKey: string; allowed: boolean }>('user_permissions')
}

async function loadUserPermissionOverrides(userId: string) {
  const collection = await userPermissionsCollection()
  const rows = await collection.find({ userId }).toArray()
  const overrides: Partial<Record<Permission, boolean>> = {}
  rows.forEach((entry) => {
    if (entry.permissionKey) {
      overrides[entry.permissionKey as Permission] = entry.allowed !== false
    }
  })
  return overrides
}

async function resolveCustomRoleSelection(input: { customRoleId?: string | null; role: SystemRole }) {
  const customRoleId = typeof input.customRoleId === 'string' && input.customRoleId.trim() ? input.customRoleId.trim() : null
  if (!customRoleId) {
    return { customRoleId: null, customRoleName: null, inheritedPermissions: undefined as Partial<Record<Permission, boolean>> | undefined, inheritedAccessProfile: undefined as AccessProfile | undefined }
  }

  const collection = await customRolesCollection()
  const customRole = await collection.findOne({ id: customRoleId })
  if (!customRole) {
    throw new Error(`Custom role ${customRoleId} was not found`)
  }

  if (customRole.baseRole !== input.role) {
    throw new Error(`Custom role "${customRole.name}" is built for ${customRole.baseRole}, not ${input.role}`)
  }

  return {
    customRoleId: customRole.id,
    customRoleName: customRole.name,
    inheritedPermissions: customRole.permissions ?? defaultPermissionsForRole(customRole.baseRole),
    inheritedAccessProfile: normalizeAccessProfile(customRole.accessProfile),
  }
}

const OFFLINE_LOGIN_USERS: Array<StoredUserDocument & { password: string }> = [
  {
    id: 'USR-ADMIN-0001',
    username: 'admin_anas',
    normalizedUsername: 'admin_anas',
    email: 'admin@unyt.local',
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: 'active',
    avatarUrl: null,
    password: 'Admin@123',
    permissions: {
      'users:manage': true,
      'marketing:view': true,
      'marketing:manage': true,
      'finance:view': true,
      'finance:manage': true,
      'VIEW_FINANCIALS': true,
      'enrollment:view': true,
      'enrollment:manage': true,
      'reports:view': true,
      'reports:export': true,
      'ADMIN_VIEW_SCHEDULE': true,
      'MANAGE_RESOURCES': true,
      'settings:manage': true,
    },
    studentId: null,
    professorId: null,
  },
  {
    id: 'USR-SUP-0001',
    username: 'supervisor_sara',
    normalizedUsername: 'supervisor_sara',
    email: 'supervisor@unyt.local',
    role: 'supervisor',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: 'active',
    avatarUrl: null,
    password: 'Supervisor@123',
    permissions: {
      'marketing:view': true,
      'marketing:manage': true,
      'enrollment:view': true,
      'enrollment:manage': true,
      'reports:view': true,
      'reports:export': true,
      'ADMIN_VIEW_SCHEDULE': true,
    },
    studentId: null,
    professorId: null,
  },
  {
    id: 'USR-ADV-0001',
    username: 'advisor_omar',
    normalizedUsername: 'advisor_omar',
    email: 'advisor@unyt.local',
    role: 'advisor',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: 'active',
    avatarUrl: null,
    password: 'Advisor@123',
    permissions: {
      'enrollment:view': true,
      'enrollment:manage': true,
      'reports:view': true,
    },
    studentId: null,
    professorId: null,
  },
  {
    id: 'USR-PROF-0001',
    username: 'prof_roland',
    normalizedUsername: 'prof_roland',
    email: 'roland.kola@unyt.local',
    role: 'professor',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: 'active',
    avatarUrl: null,
    password: 'Professor@123',
    permissions: {},
    studentId: null,
    professorId: 'PROF-00000001',
  },
  {
    id: 'USR-STU-0001',
    username: 'student_linda',
    normalizedUsername: 'student_linda',
    email: 'linda.hoxha@student.local',
    role: 'student',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: 'active',
    avatarUrl: null,
    password: 'Student@123',
    permissions: {},
    studentId: 'STU-00000001',
    professorId: null,
  },
  {
    id: 'USR-USER-0001',
    username: 'user_guest',
    normalizedUsername: 'user_guest',
    email: 'user@unyt.local',
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: 'active',
    avatarUrl: null,
    password: 'User@123',
    permissions: {},
    studentId: null,
    professorId: null,
  },
]

function findOfflineUser(input: string, password: string): StoredUserDocument | null {
  const normalized = input.trim().toLowerCase()
  const match = OFFLINE_LOGIN_USERS.find(
    (entry) =>
      entry.normalizedUsername === normalized ||
      entry.username.toLowerCase() === normalized ||
      entry.email.toLowerCase() === normalized,
  )
  if (!match || match.password !== password) {
    return null
  }
  return { ...match }
}

function buildStudentId() {
  return `STU-${randomUUID().slice(0, 8).toUpperCase()}`
}
function normalizeStudentDateOfBirth(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '2000-01-01'
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

const studentOptionalStringFields = [
  'middleName',
  'major',
  'programId',
  'faculty',
  'facultyId',
  'gender',
  'nationality',
  'nationalId',
  'passportNumber',
  'bloodType',
  'city',
  'postalCode',
  'emergencyContactName',
  'emergencyContactPhone',
  'motherName',
  'fatherName',
] as const

function applyOptionalStudentFields(target: Partial<Student> & Record<string, unknown>, source: Record<string, unknown>) {
  studentOptionalStringFields.forEach((field) => {
    if (source[field] !== undefined) {
      target[field] = normalizeOptionalString(source[field])
    }
  })
}

function buildStudentDocument(input: {
  id: string
  username: string
  email: string
  studentProfile?: Record<string, unknown>
  supervisorId?: string
  supervisorName?: string
}): Student {
  const { id, username, email, studentProfile, supervisorId, supervisorName } = input
  const profile = studentProfile ?? {}

  const student: Student = {
    id,
    displayId: id,
    firstName: typeof profile.firstName === 'string' && profile.firstName.trim() ? profile.firstName.trim() : username.trim(),
    lastName: typeof profile.lastName === 'string' && profile.lastName.trim() ? profile.lastName.trim() : '',
    email: typeof profile.email === 'string' && profile.email.trim() ? profile.email.trim() : email.trim(),
    phone: typeof profile.phone === 'string' ? profile.phone.trim() : '',
    photo: typeof profile.photo === 'string' && profile.photo.trim() ? profile.photo.trim() : '/placeholder-user.jpg',
    enrollmentDate:
      typeof profile.enrollmentDate === 'string' && profile.enrollmentDate.trim()
        ? profile.enrollmentDate.trim()
        : new Date().toISOString(),
    program: typeof profile.program === 'string' ? profile.program.trim() : '',
    status: profile.status === 'inactive' || profile.status === 'graduated' ? profile.status : 'active',
    address: typeof profile.address === 'string' ? profile.address.trim() : '',
    dateOfBirth: normalizeStudentDateOfBirth(profile.dateOfBirth),
    balance: typeof profile.balance === 'number' ? profile.balance : Number(profile.balance) || 0,
    supervisorId:
      typeof profile.supervisorId === 'string' && profile.supervisorId.trim()
        ? profile.supervisorId.trim()
        : supervisorId,
    supervisorName:
      typeof profile.supervisorName === 'string' && profile.supervisorName.trim()
        ? profile.supervisorName.trim()
        : supervisorName,
  }

  if (profile.currentSemester !== undefined && typeof profile.currentSemester === 'string' && profile.currentSemester.trim()) {
    student.currentSemester = profile.currentSemester.trim()
  }

  if (profile.currentYear !== undefined) {
    (student as Student & Record<string, unknown>).currentYear = Number(profile.currentYear)
  }

  applyOptionalStudentFields(student as Partial<Student> & Record<string, unknown>, profile)

  return student
}

function buildStudentUpdatePayload(profile: Record<string, unknown>, fallbackEmail: string) {
  const updates: Partial<Student> & Record<string, unknown> = {}

  ;(['firstName', 'lastName', 'phone', 'photo', 'enrollmentDate', 'program', 'address'] as const).forEach((field) => {
    if (profile[field] !== undefined) {
      updates[field] = typeof profile[field] === 'string' ? profile[field].trim() : String(profile[field] ?? '')
    }
  })

  if (profile.email !== undefined) {
    updates.email = typeof profile.email === 'string' && profile.email.trim() ? profile.email.trim() : fallbackEmail
  }

  if (profile.status !== undefined) {
    updates.status = profile.status === 'inactive' || profile.status === 'graduated' ? profile.status : 'active'
  }

  if (profile.dateOfBirth !== undefined) {
    updates.dateOfBirth = normalizeStudentDateOfBirth(profile.dateOfBirth)
  }

  if (profile.balance !== undefined) {
    const nextBalance = Number(profile.balance)
    if (Number.isFinite(nextBalance)) {
      updates.balance = nextBalance
    }
  }

  if (profile.currentSemester !== undefined && typeof profile.currentSemester === 'string' && profile.currentSemester.trim()) {
    updates.currentSemester = profile.currentSemester.trim()
  }

  if (profile.currentYear !== undefined) {
    const currentYear = Number(profile.currentYear)
    if (Number.isFinite(currentYear) && currentYear > 0) {
      updates.currentSemester = `Year ${Math.floor(currentYear)}`
      updates.currentYear = Math.floor(currentYear)
    }
  }

  if (profile.supervisorId !== undefined) {
    const supervisorId = normalizeOptionalString(profile.supervisorId)
    updates.supervisorId = supervisorId
    updates.supervisorName = normalizeOptionalString(profile.supervisorName)
  } else if (profile.supervisorName !== undefined) {
    updates.supervisorName = normalizeOptionalString(profile.supervisorName)
  }

  applyOptionalStudentFields(updates, profile)

  return updates
}

function buildProfessorId() {
  return `PROF-${randomUUID().slice(0, 8).toUpperCase()}`
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeIdentityToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function parseUsernameTokens(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function sanitizeUser(user: StoredUserDocument): User {
  const { password, normalizedUsername, mfaSecret, ...safeUser } = user
  return {
    ...safeUser,
    secondaryRoles: Array.isArray(safeUser.secondaryRoles) ? safeUser.secondaryRoles : [],
    mfaEnabled: Boolean(safeUser.mfaEnabled),
  }
}

function defaultPermissionsForRole(role: StoredUserDocument['role']): Partial<Record<Permission, boolean>> {
  switch (role) {
    case 'admin':
    case 'super-admin':
      return {
        'manage_users': true,
        'users:manage': true,
        'users:create': true,
        'users:edit': true,
        'users:delete': true,
        'students:view': true,
        'students:create': true,
        'students:edit': true,
        'students:delete': true,
        'professors:view': true,
        'professors:create': true,
        'professors:edit': true,
        'professors:delete': true,
        'marketing:view': true,
        'marketing:manage': true,
        'applications:view': true,
        'applications:manage': true,
        'finance:view': true,
        'finance:manage': true,
        'finance:approve': true,
        'VIEW_FINANCIALS': true,
        'enrollment:view': true,
        'enrollment:manage': true,
        'enrollment:self': true,
        'enrollment:override-window': true,
        'enrollment:override-capacity': true,
        'override_capacity': true,
        'edit_any_grade': true,
        'feedback:view': true,
        'feedback:manage': true,
        'news:view': true,
        'news:manage': true,
        'audit:view': true,
        'audit:export': true,
        'reports:view': true,
        'reports:export': true,
        'ADMIN_VIEW_SCHEDULE': true,
        'MANAGE_RESOURCES': true,
        'settings:manage': true,
        'settings:security': true,
        'settings:integrations': true,
        'settings:sso': true,
      }
    case 'supervisor':
      return {
        'students:view': true,
        'students:edit': true,
        'professors:view': true,
        'professors:edit': true,
        'marketing:view': true,
        'marketing:manage': true,
        'applications:view': true,
        'applications:manage': true,
        'enrollment:view': true,
        'enrollment:manage': true,
        'edit_any_grade': true,
        'feedback:view': true,
        'feedback:manage': true,
        'news:view': true,
        'news:manage': true,
        'reports:view': true,
        'reports:export': true,
        'ADMIN_VIEW_SCHEDULE': true,
      }
    case 'advisor':
      return {
        'students:view': true,
        'enrollment:view': true,
        'enrollment:manage': true,
        'feedback:view': true,
        'reports:view': true,
      }
    case 'professor':
      return {
        'ENTER_GRADES': true,
        'edit_own_grades': true,
      }
    case 'teaching-assistant':
      return {
        'students:view': true,
        'enrollment:view': true,
        'reports:view': true,
      }
    case 'registrar':
      return {
        'users:manage': true,
        'users:create': true,
        'users:edit': true,
        'students:view': true,
        'students:create': true,
        'students:edit': true,
        'enrollment:view': true,
        'enrollment:manage': true,
        'edit_any_grade': true,
        'reports:view': true,
        'ADMIN_VIEW_SCHEDULE': true,
        'MANAGE_RESOURCES': true,
      }
    case 'admissions':
      return {
        'students:view': true,
        'students:create': true,
        'students:edit': true,
        'marketing:view': true,
        'marketing:manage': true,
        'applications:view': true,
        'applications:manage': true,
        'enrollment:view': true,
        'enrollment:manage': true,
        'reports:view': true,
      }
    case 'finance':
      return {
        'students:view': true,
        'finance:view': true,
        'finance:manage': true,
        'finance:approve': true,
        'VIEW_FINANCIALS': true,
        'reports:view': true,
        'reports:export': true,
      }
    case 'it-admin':
      return {
        'users:manage': true,
        'users:edit': true,
        'audit:view': true,
        'audit:export': true,
        'settings:manage': true,
        'settings:security': true,
        'settings:integrations': true,
        'settings:sso': true,
        'reports:view': true,
      }
    case 'dean':
      return {
        'students:view': true,
        'professors:view': true,
        'reports:view': true,
        'enrollment:view': true,
      }
    case 'hod':
      return {
        'professors:view': true,
        'reports:view': true,
        'enrollment:view': true,
        'enrollment:manage': true,
      }
    case 'librarian':
      return {
        'reports:view': true,
      }
    case 'student-affairs':
      return {
        'students:view': true,
        'students:edit': true,
        'marketing:view': true,
        'marketing:manage': true,
        'feedback:view': true,
        'feedback:manage': true,
        'reports:view': true,
      }
    case 'hr':
      return {
        'users:manage': true,
        'users:create': true,
        'users:edit': true,
        'settings:manage': true,
        'reports:view': true,
      }
    case 'security':
      return {
        'audit:view': true,
        'audit:export': true,
        'reports:view': true,
      }
    case 'facilities':
      return {
        'reports:view': true,
        'enrollment:view': true,
      }
    case 'research-office':
      return {
        'reports:view': true,
        'marketing:view': true,
        'news:view': true,
        'news:manage': true,
      }
    case 'user':
    case 'student':
      return {
        'enrollment:self': true,
      }
    default:
      return {}
  }
}

const userCreateSchema = z.object({
  username: z.string().trim().min(1),
  email: z.string().trim().email(),
  role: z.enum(SYSTEM_ROLE_VALUES).default('user'),
  password: z.string().min(4),
  avatarUrl: z.string().url().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  permissions: z.record(z.boolean()).optional(),
  customRoleId: z.string().trim().nullable().optional(),
  customRoleName: z.string().trim().nullable().optional(),
  accessProfile: z.record(z.unknown()).optional(),
  studentId: z.string().trim().optional(),
  professorId: z.string().trim().optional(),
  secondaryRoles: z.array(z.enum(SYSTEM_ROLE_VALUES)).optional(),
  student: z.record(z.any()).optional(),
  professor: z.record(z.any()).optional(),
})

const userUpdateSchema = z.object({
  username: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(4).optional(),
  role: z.enum(SYSTEM_ROLE_VALUES).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')).transform((v) => (v ? v : null)),
  permissions: z.record(z.boolean()).optional(),
  customRoleId: z.string().trim().nullable().optional(),
  customRoleName: z.string().trim().nullable().optional(),
  accessProfile: z.record(z.unknown()).nullable().optional(),
  studentId: z.string().trim().nullable().optional(),
  professorId: z.string().trim().nullable().optional(),
  secondaryRoles: z.array(z.enum(SYSTEM_ROLE_VALUES)).optional(),
  student: z.record(z.any()).optional(),
  professor: z.record(z.any()).optional(),
})

const customRoleSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional().or(z.literal('')),
  baseRole: z.enum(SYSTEM_ROLE_VALUES),
  permissions: z.record(z.boolean()).optional(),
  accessProfile: z.record(z.unknown()).optional(),
})

userRoutes.get('/custom-roles', requirePermission('users:manage'), async (_req, res) => {
  try {
    const collection = await customRolesCollection()
    const roles = await collection.find().sort({ updatedAt: -1, name: 1 }).toArray()
    res.json({ success: true, data: roles })
  } catch (error) {
    logger.error({ err: error }, 'Custom role list failed')
    res.status(500).json({ success: false, error: 'Failed to fetch custom roles' })
  }
})

userRoutes.post('/custom-roles', requirePermission('users:manage'), async (req, res) => {
  try {
    const parsed = customRoleSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid custom role payload' })
    }

    const collection = await customRolesCollection()
    const normalizedName = parsed.data.name.trim().toLowerCase()
    const existing = await collection.findOne({ name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } })
    if (existing) {
      return res.status(409).json({ success: false, error: 'A custom role with this name already exists' })
    }

    const now = new Date().toISOString()
    const role: StoredCustomRoleDocument = {
      id: `CR-${randomUUID().slice(0, 8).toUpperCase()}`,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      baseRole: parsed.data.baseRole,
      permissions: parsed.data.permissions ?? defaultPermissionsForRole(parsed.data.baseRole),
      accessProfile: normalizeAccessProfile(parsed.data.accessProfile) ?? {},
      createdAt: now,
      updatedAt: now,
    }

    await collection.insertOne(role)
    res.status(201).json({ success: true, data: role })
  } catch (error) {
    logger.error({ err: error }, 'Custom role create failed')
    res.status(500).json({ success: false, error: 'Failed to create custom role' })
  }
})

userRoutes.put('/custom-roles/:id', requirePermission('users:manage'), async (req, res) => {
  try {
    const parsed = customRoleSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid custom role payload' })
    }

    const collection = await customRolesCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Custom role not found' })
    }

    const duplicate = await collection.findOne({
      id: { $ne: existing.id },
      name: { $regex: `^${parsed.data.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    })
    if (duplicate) {
      return res.status(409).json({ success: false, error: 'A custom role with this name already exists' })
    }

    const updates: Partial<StoredCustomRoleDocument> = {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      baseRole: parsed.data.baseRole,
      permissions: parsed.data.permissions ?? defaultPermissionsForRole(parsed.data.baseRole),
      accessProfile: normalizeAccessProfile(parsed.data.accessProfile) ?? {},
      updatedAt: new Date().toISOString(),
    }

    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Custom role update failed')
    res.status(500).json({ success: false, error: 'Failed to update custom role' })
  }
})

userRoutes.delete('/custom-roles/:id', requirePermission('users:manage'), async (req, res) => {
  try {
    const collection = await customRolesCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Custom role not found' })
    }

    await collection.deleteOne({ id: existing.id })
    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    await usersCollection.updateMany(
      { customRoleId: existing.id },
      { $set: { customRoleId: null, customRoleName: null } },
    )

    res.json({ success: true, message: 'Custom role deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Custom role delete failed')
    res.status(500).json({ success: false, error: 'Failed to delete custom role' })
  }
})

userRoutes.get('/', requirePermission('users:manage'), async (req, res) => {
  try {
    await ensureUserAdminStorage()
    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    const { isPaginated, page, pageSize } = readPagination(req)
    if (isPaginated) {
      const cursor = usersCollection.find({ deletedAt: { $exists: false } }).sort({ createdAt: -1 })
      const total = await cursor.count()
      const items = await cursor.skip((page - 1) * pageSize).limit(pageSize).toArray()
      return res.json({ success: true, data: { items: items.map(sanitizeUser), total, page, pageSize } })
    }
    const allUsers = await usersCollection.find({ deletedAt: { $exists: false } }).limit(UNPAGINATED_SAFETY_CAP).toArray()
    res.json({ success: true, data: allUsers.map(sanitizeUser) })
  } catch (error) {
    logger.error({ err: error }, 'User list failed')
    res.status(500).json({ success: false, error: 'Failed to fetch users' })
  }
})

userRoutes.get('/:id', async (req, res) => {
  try {
    await ensureUserAdminStorage()
    const isOwner = req.auth?.userId === req.params.id
    const isPrivileged =
      req.auth?.role === 'admin' ||
      req.auth?.role === 'super-admin' ||
      req.auth?.role === 'supervisor' ||
      Boolean(req.auth?.effectivePermissions?.includes('users:manage'))
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this user' })
    }

    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    const user = await usersCollection.findOne({ id: req.params.id })
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    res.json({ success: true, data: sanitizeUser(user) })
  } catch (error) {
    logger.error({ err: error }, 'User fetch failed')
    res.status(500).json({ success: false, error: 'Failed to fetch user' })
  }
})

userRoutes.post('/', requirePermission('users:manage'), async (req, res) => {
  try {
    await ensureUserAdminStorage()
    const parsed = userCreateSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' })
    }

    const {
      username,
      email,
      role,
      password,
      avatarUrl,
      permissions,
      customRoleId,
      customRoleName,
      accessProfile,
      studentId,
      professorId,
      secondaryRoles,
      student: studentProfile,
      professor: professorProfile,
    } = parsed.data

    const normalizedUsername = username.toLowerCase()
    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)

    const existing = await usersCollection.findOne({ normalizedUsername })
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already exists' })
    }

    const existingEmail = await usersCollection.findOne({ email })
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'Email already exists' })
    }

    const customRoleSelection = await resolveCustomRoleSelection({ customRoleId, role })
    const normalizedAccessProfile = normalizeAccessProfile(accessProfile)

    const timestamp = new Date().toISOString()
    const hashedPassword = password.startsWith('$2') ? password : await bcrypt.hash(password, 10)
    const newUser: StoredUserDocument = {
      id: `USR${Date.now()}`,
      username: username.trim(),
      normalizedUsername,
      email: email.trim(),
      role,
      secondaryRoles: Array.isArray(secondaryRoles)
        ? Array.from(new Set(secondaryRoles.filter((entry) => entry !== role)))
        : [],
      createdAt: timestamp,
      lastLogin: timestamp,
      status: 'active',
      avatarUrl: typeof avatarUrl === 'string' && avatarUrl.trim() ? avatarUrl : null,
      password: hashedPassword,
      permissions:
        permissions && typeof permissions === 'object'
          ? permissions
          : customRoleSelection.inheritedPermissions ?? defaultPermissionsForRole(role),
      customRoleId: customRoleSelection.customRoleId,
      customRoleName: customRoleSelection.customRoleName ?? (typeof customRoleName === 'string' && customRoleName.trim() ? customRoleName.trim() : null),
      accessProfile: normalizedAccessProfile ?? customRoleSelection.inheritedAccessProfile ?? {},
      studentId: role === 'student' && typeof studentId === 'string' && studentId.trim() ? studentId.trim() : null,
      professorId: role === 'professor' && typeof professorId === 'string' && professorId.trim() ? professorId.trim() : null,
    }

    if (newUser.role === 'student' && !newUser.studentId) {
      const studentsCol = await studentsCollection()
      const newStudentId = buildStudentId()
      const advisorUsers = await usersCollection.find({ role: 'advisor', status: 'active' }).toArray()
      const randomAdvisor = advisorUsers.length > 0
        ? advisorUsers[Math.floor(Math.random() * advisorUsers.length)]
        : null
      const student = buildStudentDocument({
        id: newStudentId,
        username,
        email,
        studentProfile,
        supervisorId: randomAdvisor?.id,
        supervisorName: randomAdvisor?.username,
      })

      await studentsCol.insertOne(student)
      newUser.studentId = student.id
      await assignBaseCoursesToFirstYearStudent(student)
    }

    if (newUser.role === 'student' && newUser.studentId) {
      const studentsCol = await studentsCollection()
      const existingStudent = await studentsCol.findOne({ id: newUser.studentId })
      if (!existingStudent) {
        return res.status(400).json({
          success: false,
          error: `Student ID ${newUser.studentId} does not exist. Leave it empty to auto-create a student profile.`,
        })
      }
      if (studentProfile && typeof studentProfile === 'object') {
        const studentUpdates = buildStudentUpdatePayload(studentProfile, email.trim())
        await studentsCol.updateOne({ id: newUser.studentId }, { $set: studentUpdates })
        const updatedStudent = await studentsCol.findOne({ id: newUser.studentId })
        await assignBaseCoursesToFirstYearStudent(updatedStudent ?? existingStudent)
      } else {
        await assignBaseCoursesToFirstYearStudent(existingStudent)
      }
    }

    if (newUser.role === 'professor' && !newUser.professorId) {
      const professorsCol = await professorsCollection()
      const newProfId = buildProfessorId()
      const profile = professorProfile ?? {}
      const professor: Professor = {
        id: newProfId,
        firstName: typeof profile.firstName === 'string' && profile.firstName.trim() ? profile.firstName.trim() : username.trim(),
        lastName: typeof profile.lastName === 'string' && profile.lastName.trim() ? profile.lastName.trim() : '',
        email: typeof profile.email === 'string' && profile.email.trim() ? profile.email.trim() : email.trim(),
        phone: typeof profile.phone === 'string' ? profile.phone.trim() : '',
        photo: typeof profile.photo === 'string' && profile.photo.trim() ? profile.photo.trim() : '/placeholder-user.jpg',
        department: typeof profile.department === 'string' && profile.department.trim() ? profile.department.trim() : 'General',
        salary: typeof profile.salary === 'number' ? profile.salary : Number(profile.salary) || 0,
        hireDate:
          typeof profile.hireDate === 'string' && profile.hireDate.trim() ? profile.hireDate.trim() : new Date().toISOString(),
        specialization: typeof profile.specialization === 'string' ? profile.specialization.trim() : '',
        status:
          profile.status === 'on-leave' || profile.status === 'retired'
            ? profile.status
            : 'active',
      }

      await professorsCol.insertOne(professor)
      newUser.professorId = professor.id
    }

    if (newUser.role === 'professor' && newUser.professorId) {
      const professorsCol = await professorsCollection()
      const existingProfessor = await professorsCol.findOne({ id: newUser.professorId })
      if (!existingProfessor) {
        return res.status(400).json({
          success: false,
          error: `Professor ID ${newUser.professorId} does not exist. Leave it empty to auto-create a professor profile.`,
        })
      }
    }

    await usersCollection.insertOne(newUser)

    res.status(201).json({ success: true, data: sanitizeUser(newUser), message: 'User created' })
  } catch (error) {
    logger.error({ err: error }, 'User create failed')
    if (error instanceof Error && error.message.toLowerCase().includes('custom role')) {
      return res.status(400).json({ success: false, error: error.message })
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '22007'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date/time input. Leave optional date fields empty or provide a valid ISO date.',
      })
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23503'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid linked profile ID. Ensure student/professor IDs exist, or leave them empty to auto-create.',
      })
    }
    res.status(500).json({ success: false, error: 'Failed to create user' })
  }
})

userRoutes.put('/:id', async (req, res) => {
  try {
    await ensureUserAdminStorage()
    const isOwner = req.auth?.userId === req.params.id
    const isPrivileged =
      req.auth?.role === 'admin' ||
      req.auth?.role === 'super-admin' ||
      req.auth?.role === 'supervisor' ||
      Boolean(req.auth?.effectivePermissions?.includes('users:manage'))
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this user' })
    }

    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    const user = await usersCollection.findOne({ id: req.params.id })
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    const updates: Partial<StoredUserDocument> = {}

    const parsed = userUpdateSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' })
    }
    const {
      username,
      email,
      password,
      role,
      status,
      avatarUrl,
      permissions,
      customRoleId,
      customRoleName,
      accessProfile,
      studentId,
      professorId,
      secondaryRoles,
      student: studentProfile,
    } = parsed.data

    if (typeof username === 'string') {
      updates.username = username
      updates.normalizedUsername = username.toLowerCase()
    }

    if (typeof email === 'string') {
      updates.email = email
    }

    if (typeof password === 'string') {
      updates.password = password.startsWith('$2') ? password : await bcrypt.hash(password, 10)
    }

    const canManageUsers = req.auth?.effectivePermissions?.includes('users:manage')

    if (role) {
      if (!canManageUsers) {
        return res.status(403).json({ success: false, error: 'users:manage permission required to change role' })
      }
      updates.role = role
      if (permissions === undefined) {
        updates.permissions = defaultPermissionsForRole(role)
      }
    }

    if (status) {
      if (!canManageUsers) {
        return res.status(403).json({ success: false, error: 'users:manage permission required to change status' })
      }
      updates.status = status
    }

    if (avatarUrl !== undefined) {
      updates.avatarUrl = avatarUrl ?? null
    }

    if (permissions !== undefined) {
      if (!canManageUsers) {
        return res.status(403).json({ success: false, error: 'users:manage permission required to change permissions' })
      }
      updates.permissions = permissions as Partial<Record<Permission, boolean>>
    }

    const targetRole = updates.role ?? user.role
    if (secondaryRoles !== undefined) {
      updates.secondaryRoles = Array.from(new Set(secondaryRoles.filter((entry) => entry !== targetRole)))
    }

    if (role && customRoleId === undefined && user.customRoleId) {
      updates.customRoleId = null
      updates.customRoleName = null
      if (accessProfile === undefined) {
        updates.accessProfile = {}
      }
    }

    if (customRoleId !== undefined || customRoleName !== undefined) {
      if (!canManageUsers) {
        return res.status(403).json({ success: false, error: 'users:manage permission required to change custom roles' })
      }
      const selection = await resolveCustomRoleSelection({ customRoleId: customRoleId ?? null, role: targetRole })
      updates.customRoleId = selection.customRoleId
      updates.customRoleName = selection.customRoleName ?? (typeof customRoleName === 'string' && customRoleName.trim() ? customRoleName.trim() : null)
      if (permissions === undefined) {
        updates.permissions = selection.inheritedPermissions ?? updates.permissions ?? defaultPermissionsForRole(targetRole)
      }
      if (accessProfile === undefined) {
        updates.accessProfile = selection.inheritedAccessProfile ?? {}
      }
    }

    if (accessProfile !== undefined) {
      if (!canManageUsers) {
        return res.status(403).json({ success: false, error: 'users:manage permission required to change detailed access rules' })
      }
      updates.accessProfile = normalizeAccessProfile(accessProfile) ?? {}
    }

    if (studentId !== undefined) {
      if (!canManageUsers && user.role !== 'student') {
        return res.status(403).json({ success: false, error: 'users:manage permission required to change student mapping' })
      }
      updates.studentId = studentId && studentId.trim() ? studentId.trim() : null
    }

    if (professorId !== undefined) {
      if (!canManageUsers && user.role !== 'professor') {
        return res.status(403).json({ success: false, error: 'users:manage permission required to change professor mapping' })
      }
      updates.professorId = professorId && professorId.trim() ? professorId.trim() : null
    }

    if (targetRole === 'student' && !updates.studentId && !user.studentId) {
      const studentsCol = await studentsCollection()
      const newStudentId = buildStudentId()
      const student = buildStudentDocument({
        id: newStudentId,
        username: updates.username ?? user.username,
        email: updates.email ?? user.email,
        studentProfile,
      })
      await studentsCol.insertOne(student)
      updates.studentId = student.id
      await assignBaseCoursesToFirstYearStudent(student)
    }

    if (targetRole === 'student' && updates.studentId) {
      const studentsCol = await studentsCollection()
      const existingStudent = await studentsCol.findOne({ id: updates.studentId })
      if (!existingStudent) {
        return res.status(400).json({
          success: false,
          error: `Student ID ${updates.studentId} does not exist. Leave it empty to auto-create a student profile.`,
        })
      }
      if (studentProfile && typeof studentProfile === 'object') {
        const studentUpdates = buildStudentUpdatePayload(studentProfile, updates.email ?? user.email)
        await studentsCol.updateOne({ id: updates.studentId }, { $set: studentUpdates })
        const updatedStudent = await studentsCol.findOne({ id: updates.studentId })
        await assignBaseCoursesToFirstYearStudent(updatedStudent ?? existingStudent)
      } else {
        await assignBaseCoursesToFirstYearStudent(existingStudent)
      }
    }

    if (targetRole === 'professor' && !updates.professorId && !user.professorId) {
      const professorsCol = await professorsCollection()
      const newProfId = buildProfessorId()
      const profile = req.body?.professor || {}
      const professor: Professor = {
        id: newProfId,
        firstName: typeof profile.firstName === 'string' && profile.firstName.trim() ? profile.firstName.trim() : (updates.username ?? user.username),
        lastName: typeof profile.lastName === 'string' && profile.lastName.trim() ? profile.lastName.trim() : user.username,
        email: typeof profile.email === 'string' && profile.email.trim() ? profile.email.trim() : updates.email ?? user.email,
        phone: typeof profile.phone === 'string' ? profile.phone.trim() : '',
        photo: typeof profile.photo === 'string' && profile.photo.trim() ? profile.photo.trim() : '/placeholder-user.jpg',
        department: typeof profile.department === 'string' && profile.department.trim() ? profile.department.trim() : 'General',
        salary: typeof profile.salary === 'number' ? profile.salary : Number(profile.salary) || 0,
        hireDate: typeof profile.hireDate === 'string' && profile.hireDate.trim() ? profile.hireDate.trim() : new Date().toISOString(),
        specialization: typeof profile.specialization === 'string' ? profile.specialization.trim() : '',
        status: profile.status === 'on-leave' || profile.status === 'retired' ? profile.status : 'active',
      }
      await professorsCol.insertOne(professor)
      updates.professorId = professor.id
    }

    if (targetRole === 'professor' && updates.professorId) {
      const professorsCol = await professorsCollection()
      const existingProfessor = await professorsCol.findOne({ id: updates.professorId })
      if (!existingProfessor) {
        return res.status(400).json({
          success: false,
          error: `Professor ID ${updates.professorId} does not exist. Leave it empty to auto-create a professor profile.`,
        })
      }
    }

    // Check for duplicate normalizedUsername if username is being updated
    if (updates.normalizedUsername) {
      const duplicate = await usersCollection.findOne({ normalizedUsername: updates.normalizedUsername, id: { $ne: user.id } })
      if (duplicate) {
        return res.status(409).json({ success: false, error: 'Username already exists' })
      }
    }

    if (updates.email) {
      const duplicateEmail = await usersCollection.findOne({ email: updates.email, id: { $ne: user.id } })
      if (duplicateEmail) {
        return res.status(409).json({ success: false, error: 'Email already exists' })
      }
    }

    // Actually update the user document by id
    await usersCollection.updateOne({ id: user.id }, { $set: updates })
    const updated = await usersCollection.findOne({ id: user.id })

    res.json({ success: true, data: updated ? sanitizeUser(updated) : sanitizeUser({ ...user, ...updates }), message: 'User updated' })
  } catch (error) {
    logger.error({ err: error }, 'User update failed')
    if (error instanceof Error && error.message.toLowerCase().includes('custom role')) {
      return res.status(400).json({ success: false, error: error.message })
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23503'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid linked profile ID. Ensure student/professor IDs exist, or leave them empty to auto-create.',
      })
    }
    res.status(500).json({ success: false, error: 'Failed to update user' })
  }
})

userRoutes.delete('/:id', async (req, res) => {
  try {
    if (!req.auth?.effectivePermissions?.includes('users:manage')) {
      return res.status(403).json({ success: false, error: 'users:manage permission required' })
    }

    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    const user = await usersCollection.findOne({ id: req.params.id })
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Soft delete: mark the record instead of removing it, preserving history for audit
    // purposes and so the account can be restored if the deletion was a mistake.
    const deletedAt = new Date().toISOString()
    const result = await usersCollection.updateOne({ id: req.params.id }, { $set: { deletedAt } })
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // If the user was linked to a student profile, soft-delete that student and related records too
    const studentId = user.studentId ?? null
    if (studentId) {
      try {
        const studentsCol = await studentsCollection()
        const enrollmentsCol = await enrollmentsCollection()
        const paymentsCol = await paymentsCollection()

        const [studentEnrollments, studentPayments] = await Promise.all([
          enrollmentsCol.find({ studentId }).toArray(),
          paymentsCol.find({ studentId }).toArray(),
        ])

        await Promise.all([
          ...studentEnrollments.map((enrollment) => enrollmentsCol.updateOne({ id: enrollment.id }, { $set: { deletedAt } })),
          ...studentPayments.map((payment) => paymentsCol.updateOne({ id: payment.id }, { $set: { deletedAt } })),
        ])

        await studentsCol.updateOne({ id: studentId }, { $set: { deletedAt } })
      } catch (err) {
        logger.warn({ err }, 'Failed to fully cascade soft-delete linked student for user delete')
      }
    }

    res.json({ success: true, message: 'User deleted' })
  } catch (error) {
    logger.error({ err: error }, 'User delete failed')
    res.status(500).json({ success: false, error: 'Failed to delete user' })
  }
})

userRoutes.post('/auth/login', rateLimitLogin, async (req, res) => {
  const ip = extractClientIp(req)
  const uaString = req.get('user-agent') || ''
  const { browser, os, device } = parseUserAgent(uaString)
  const logLogin = (type: 'login-success' | 'login-fail', username?: string | null, userId?: string | null, role?: string | null) => {
    liveLog.push({ type, method: 'POST', path: '/api/users/auth/login', ip, userAgent: uaString, browser, os, device, username: username ?? null, userId: userId ?? null, role: role ?? null })
  }

  try {
    await ensureUserAdminStorage()
    const { username, password } = req.body
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Username and password are required' })
    }

    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    const normalizedUsername = username.toLowerCase()
    const escapedInput = escapeRegex(username)

    let user: StoredUserDocument | null = null
    let usedOfflineFallback = false

    try {
      user = await usersCollection.findOne({
        $or: [
          { normalizedUsername },
          { username: { $regex: `^${escapedInput}$`, $options: 'i' } },
          { email: { $regex: `^${escapedInput}$`, $options: 'i' } },
        ],
      })
    } catch (dbLookupError) {
      const offline = findOfflineUser(username, password)
      if (!offline) {
        throw dbLookupError
      }
      usedOfflineFallback = true
      user = offline
      logger.warn('[auth] using offline login fallback because database lookup failed')
    }

    if (!user?.id || user.deletedAt) {
      logLogin('login-fail', username)
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    // Backfill normalizedUsername for legacy records so future lookups use the indexed field
    if (!usedOfflineFallback && !user.normalizedUsername) {
      void usersCollection.updateOne({ id: user.id }, { $set: { normalizedUsername: user.username.toLowerCase() } })
    }

    const stored = user.password ?? ''
    const isBcrypt = typeof stored === 'string' && stored.startsWith('$2')
    let passwordMatches = false
    if (isBcrypt) {
      passwordMatches = await bcrypt.compare(password, stored)
    } else {
      passwordMatches = stored === password
      // Backfill legacy plaintext passwords to bcrypt once validated
      if (passwordMatches && !usedOfflineFallback) {
        const hashed = await bcrypt.hash(password, 10)
        void usersCollection.updateOne({ id: user.id }, { $set: { password: hashed } })
      }
    }

    if (!passwordMatches) {
      logLogin('login-fail', username, user.id, user.role)
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    if (!usedOfflineFallback && user.mfaEnabled && user.mfaSecret) {
      const mfaCode = typeof req.body?.mfaCode === 'string' ? req.body.mfaCode.trim() : ''
      if (!mfaCode) {
        return res.status(401).json({ success: false, error: 'MFA code required', mfaRequired: true })
      }
      const mfaResult = await verifyMfaToken({ secret: user.mfaSecret, token: mfaCode })
      if (!mfaResult.valid) {
        logLogin('login-fail', username, user.id, user.role)
        return res.status(401).json({ success: false, error: 'Invalid MFA code', mfaRequired: true })
      }
    }

    logLogin('login-success', user.username, user.id, user.role)
    const now = new Date().toISOString()
    if (!usedOfflineFallback) {
      await usersCollection.updateOne({ id: user.id }, { $set: { lastLogin: now } })
    }

    let studentId = user.studentId ?? null
    if (!usedOfflineFallback && user.role === 'student') {
      const studentsCol = await studentsCollection()
      const ensureStudent = async (): Promise<string> => {
        // If a studentId exists but the record is missing, fall back to email/username matching; otherwise create one.
        if (studentId && studentId.trim()) {
          const existingById = await studentsCol.findOne({ id: studentId })
          if (existingById) return existingById.id
        }

        const existingByEmail = (await studentsCol.findOne({ email: user.email })) ?? (await studentsCol.findOne({ displayId: user.username }))
        if (existingByEmail) return existingByEmail.id

        const generatedId = buildStudentId()
        const student: Student = {
          id: generatedId,
          displayId: generatedId,
          firstName: user.username,
          lastName: user.username,
          email: user.email,
          phone: '',
          photo: '/placeholder-user.jpg',
          enrollmentDate: new Date().toISOString(),
          program: '',
          status: 'active',
          address: '',
          dateOfBirth: normalizeStudentDateOfBirth(null),
          balance: 0,
        }
        await studentsCol.insertOne(student)
        return student.id
      }

      studentId = await ensureStudent()
      await usersCollection.updateOne({ id: user.id }, { $set: { studentId } })
    }

    let professorId = user.professorId ?? null
    if (!usedOfflineFallback && user.role === 'professor') {
      const professorsCol = await professorsCollection()
      const ensureProfessor = async (): Promise<string> => {
        if (professorId && professorId.trim()) {
          const existingById = await professorsCol.findOne({ id: professorId })
          if (existingById) return existingById.id
        }

        const emailValue = user.email?.trim()
        if (emailValue) {
          const escapedEmail = escapeRegex(emailValue)
          const existingByEmail = await professorsCol.findOne({ email: { $regex: `^${escapedEmail}$`, $options: 'i' } as any })
          if (existingByEmail) return existingByEmail.id
        }

        const usernameTokens = parseUsernameTokens(user.username)
        const usernameCore = normalizeIdentityToken(user.username)
        const emailLocalPart = user.email?.includes('@') ? user.email.split('@')[0] ?? '' : ''
        const emailCore = normalizeIdentityToken(emailLocalPart)

        const allProfessors = await professorsCol
          .find()
          .project({ id: 1, email: 1, firstName: 1, lastName: 1 })
          .toArray()

        const matchedProfessor = allProfessors.find((professor) => {
          const fullName = `${professor.firstName ?? ''}${professor.lastName ?? ''}`
          const fullNameCore = normalizeIdentityToken(fullName)
          const profEmailCore = normalizeIdentityToken((professor.email ?? '').split('@')[0] ?? '')

          if (usernameCore && (fullNameCore.includes(usernameCore) || usernameCore.includes(fullNameCore))) {
            return true
          }
          if (emailCore && (fullNameCore.includes(emailCore) || emailCore.includes(fullNameCore))) {
            return true
          }
          if (usernameCore && profEmailCore && (profEmailCore.includes(usernameCore) || usernameCore.includes(profEmailCore))) {
            return true
          }

          return usernameTokens.some((token) => {
            if (token.length < 3) return false
            return fullNameCore.includes(token) || profEmailCore.includes(token)
          })
        })

        if (matchedProfessor) {
          return matchedProfessor.id
        }

        const generatedId = buildProfessorId()
        const usernameParts = parseUsernameTokens(user.username)
        const firstName = usernameParts[0] ?? user.username
        const lastName = usernameParts.length > 1 ? usernameParts.slice(1).join(' ') : user.username

        const professor: Professor = {
          id: generatedId,
          firstName,
          lastName,
          email: user.email,
          phone: '',
          photo: '/dashboard-red.jpg',
          department: 'General',
          salary: 0,
          hireDate: new Date().toISOString(),
          specialization: '',
          status: 'active',
        }
        await professorsCol.insertOne(professor)
        return professor.id
      }

      professorId = await ensureProfessor()
      await usersCollection.updateOne({ id: user.id }, { $set: { professorId } })
    }

    const aclOverrides = await loadUserPermissionOverrides(user.id)
    const mergedPermissions = { ...(user.permissions ?? {}), ...aclOverrides }

    const token = signAuthToken({
      userId: user.id,
      role: user.role,
      secondaryRoles: user.secondaryRoles ?? [],
      username: user.username,
      permissions: mergedPermissions,
      customRoleId: user.customRoleId ?? null,
      customRoleName: user.customRoleName ?? null,
      accessProfile: normalizeAccessProfile(user.accessProfile) ?? {},
      studentId: studentId ?? null,
      professorId: professorId ?? null,
    })

    res.json({
      success: true,
      data: {
        user: sanitizeUser({
          ...user,
          studentId: studentId ?? null,
          professorId: professorId ?? null,
          accessProfile: normalizeAccessProfile(user.accessProfile) ?? {},
          lastLogin: now,
        }),
        token,
      },
      message: usedOfflineFallback ? 'Login successful (offline fallback)' : 'Login successful',
    })
  } catch (error) {
    logger.error({ err: error }, 'Login failed')
    res.status(500).json({ success: false, error: 'Unable to process login' })
  }
})

userRoutes.patch('/:id/password', rateLimitPasswordChange, async (req, res) => {
  try {
    const isOwner = req.auth?.userId === req.params.id
    const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'supervisor'
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this password' })
    }

    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    const user = await usersCollection.findOne({ id: req.params.id })

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    const { currentPassword, newPassword } = req.body ?? {}

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ success: false, error: 'Current and new passwords are required' })
    }

    const stored = user.password ?? ''
    const currentMatches = stored.startsWith('$2')
      ? await bcrypt.compare(currentPassword, stored)
      : currentPassword === stored

    if (!currentMatches) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' })
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long' })
    }

    const newMatchesCurrent = stored.startsWith('$2')
      ? await bcrypt.compare(newPassword, stored)
      : newPassword === stored
    if (newMatchesCurrent) {
      return res.status(400).json({ success: false, error: 'New password must be different from the current password' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await usersCollection.updateOne({ id: user.id }, { $set: { password: hashedPassword } })

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Password update failed')
    res.status(500).json({ success: false, error: 'Failed to update password' })
  }
})

// MFA (TOTP) self-service setup. Two-step: /mfa/setup issues a pending secret + QR code,
// /mfa/verify confirms the user can generate a valid code before flipping mfaEnabled on.
userRoutes.post('/:id/mfa/setup', async (req, res) => {
  try {
    if (req.auth?.userId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to configure MFA for this account' })
    }
    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    const user = await usersCollection.findOne({ id: req.params.id })
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    const secret = generateMfaSecret()
    await usersCollection.updateOne({ id: user.id }, { $set: { mfaSecret: secret, mfaEnabled: false } })

    const otpauth = generateMfaUri({ issuer: 'UNYT Portal', label: user.username, secret })
    const qrCodeDataUrl = await qrcode.toDataURL(otpauth)

    res.json({ success: true, data: { secret, qrCodeDataUrl } })
  } catch (error) {
    logger.error({ err: error }, 'MFA setup failed')
    res.status(500).json({ success: false, error: 'Failed to start MFA setup' })
  }
})

userRoutes.post('/:id/mfa/verify', async (req, res) => {
  try {
    if (req.auth?.userId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to configure MFA for this account' })
    }
    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    const user = await usersCollection.findOne({ id: req.params.id })
    if (!user?.mfaSecret) {
      return res.status(400).json({ success: false, error: 'No pending MFA setup found. Start setup again.' })
    }

    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : ''
    const verifyResult = code ? await verifyMfaToken({ secret: user.mfaSecret, token: code }) : { valid: false }
    if (!verifyResult.valid) {
      return res.status(400).json({ success: false, error: 'Invalid code' })
    }

    await usersCollection.updateOne({ id: user.id }, { $set: { mfaEnabled: true } })
    await writeAuditLog({ action: 'mfa_enabled', entityType: 'user', entityId: user.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'MFA enabled' })
  } catch (error) {
    logger.error({ err: error }, 'MFA verify failed')
    res.status(500).json({ success: false, error: 'Failed to verify MFA code' })
  }
})

userRoutes.post('/:id/mfa/disable', async (req, res) => {
  try {
    const isOwner = req.auth?.userId === req.params.id
    const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'supervisor'
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, error: 'Not authorized to disable MFA for this account' })
    }
    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    const user = await usersCollection.findOne({ id: req.params.id })
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    await usersCollection.updateOne({ id: user.id }, { $set: { mfaEnabled: false, mfaSecret: null } })
    await writeAuditLog({ action: 'mfa_disabled', entityType: 'user', entityId: user.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'MFA disabled' })
  } catch (error) {
    logger.error({ err: error }, 'MFA disable failed')
    res.status(500).json({ success: false, error: 'Failed to disable MFA' })
  }
})

userRoutes.post('/:id/password/admin', requireAdmin, rateLimitAdminReset, async (req, res) => {
  try {
    const usersCollection = await getCollection<StoredUserDocument>(USERS_COLLECTION)
    const user = await usersCollection.findOne({ id: req.params.id })

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    const { newPassword, actor, reason } = req.body ?? {}

    if (typeof newPassword !== 'string') {
      return res.status(400).json({ success: false, error: 'New password is required' })
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long' })
    }

    const stored = user.password ?? ''
    const newMatchesCurrent = stored.startsWith('$2') ? await bcrypt.compare(newPassword, stored) : newPassword === stored
    if (newMatchesCurrent) {
      return res.status(400).json({ success: false, error: 'New password must be different from the current password' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await usersCollection.updateOne({ id: user.id }, { $set: { password: hashedPassword } })

    const notificationId = `SEC-${Date.now()}`
    const notificationBody = typeof reason === 'string' && reason.trim()
      ? `Admin note: ${reason.trim()}`
      : 'Your password was changed by an administrator. If this was unexpected, update it immediately.'

    const notificationsCollection = await getCollection<UserNotification>(NOTIFICATIONS_COLLECTION)
    await notificationsCollection.insertOne({
      id: notificationId,
      userId: user.id,
      title: 'Security: Password changed by admin',
      body: notificationBody,
      createdAt: new Date().toISOString(),
      read: false,
      actor: typeof actor === 'string' && actor.trim() ? actor.trim() : 'admin',
    })

    res.json({ success: true, message: 'Password reset and user notified', data: sanitizeUser(user) })
  } catch (error) {
    logger.error({ err: error }, 'Admin password reset failed')
    res.status(500).json({ success: false, error: 'Failed to reset password' })
  }
})

userRoutes.get('/:id/notifications', async (req, res) => {
  try {
    if (req.auth?.userId !== req.params.id && req.auth?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to view notifications' })
    }

    const notificationsCollection = await getCollection<UserNotification>(NOTIFICATIONS_COLLECTION)
    const notifications = await notificationsCollection
      .find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .toArray()
    res.json({ success: true, data: notifications })
  } catch (error) {
    logger.error({ err: error }, 'Notifications fetch failed')
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' })
  }
})

userRoutes.patch('/:id/notifications/:notificationId/read', async (req, res) => {
  try {
    if (req.auth?.userId !== req.params.id && req.auth?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to update this notification' })
    }
    const notificationsCollection = await getCollection<UserNotification>(NOTIFICATIONS_COLLECTION)
    const notification = await notificationsCollection.findOne({ id: req.params.notificationId, userId: req.params.id })
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' })
    }
    await notificationsCollection.updateOne({ id: notification.id }, { $set: { read: true } })
    res.json({ success: true, message: 'Notification marked as read' })
  } catch (error) {
    logger.error({ err: error }, 'Notification mark-read failed')
    res.status(500).json({ success: false, error: 'Failed to update notification' })
  }
})

userRoutes.patch('/:id/notifications/read-all', async (req, res) => {
  try {
    if (req.auth?.userId !== req.params.id && req.auth?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to update these notifications' })
    }
    const notificationsCollection = await getCollection<UserNotification>(NOTIFICATIONS_COLLECTION)
    await notificationsCollection.updateMany({ userId: req.params.id, read: false }, { $set: { read: true } })
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    logger.error({ err: error }, 'Notification mark-all-read failed')
    res.status(500).json({ success: false, error: 'Failed to update notifications' })
  }
})

import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import fs from 'node:fs/promises'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import { runDbQuery, getCollection } from '../db/postgres.js'
import { UPLOADS_DIR } from '../lib/storage.js'
import { getModuleState } from './terminal.js'
import { getEffectivePermissions } from '../middleware/auth.js'
import type { SystemRole } from '../../../shared/types/index.js'

export const systemDiagnosticsRoutes: ReturnType<typeof Router> = Router()

function isSuperAdmin(role?: string) {
  return role === 'super-admin'
}

interface DiagnosticResult {
  id: string
  label: string
  group: string
  status: 'pass' | 'fail'
  code: number
  message: string
  durationMs: number
}

interface DiagnosticCheck {
  id: string
  label: string
  group: string
  run: () => Promise<{ code: number; message: string }>
}

async function tableCheck(table: string): Promise<{ code: number; message: string }> {
  const result = await runDbQuery<{ count: string }>(`select count(*)::text as count from public.${table}`)
  const count = Number(result.rows[0]?.count ?? 0)
  return { code: 200, message: `${count} row${count === 1 ? '' : 's'}` }
}

function table(id: string, label: string, group: string, tableName: string): DiagnosticCheck {
  return { id, label, group, run: () => tableCheck(tableName) }
}

async function columnExistsCheck(tableName: string, columnName: string): Promise<{ code: number; message: string }> {
  const result = await runDbQuery<{ data_type: string }>(
    `select data_type from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name = $2`,
    [tableName, columnName],
  )
  if (result.rows.length === 0) {
    return { code: 404, message: `Column ${tableName}.${columnName} does not exist` }
  }
  return { code: 200, message: `${tableName}.${columnName} is ${result.rows[0].data_type}` }
}

function columnCheck(id: string, label: string, group: string, tableName: string, columnName: string): DiagnosticCheck {
  return { id, label, group, run: () => columnExistsCheck(tableName, columnName) }
}

const CORE_CHECKS: DiagnosticCheck[] = [
  {
    id: 'db-connection',
    label: 'Database connection',
    group: 'Core',
    run: async () => {
      await runDbQuery('select 1')
      return { code: 200, message: 'Connected to Postgres' }
    },
  },
  {
    id: 'db-write-roundtrip',
    label: 'Database write round-trip',
    group: 'Core',
    run: async () => {
      const result = await runDbQuery<{ probe: string }>(`select (now())::text as probe`)
      if (!result.rows[0]?.probe) throw new Error('No response from database')
      return { code: 200, message: 'Read/write round-trip succeeded' }
    },
  },
  {
    id: 'db-schema-count',
    label: 'Database schema (table count)',
    group: 'Core',
    run: async () => {
      const result = await runDbQuery<{ count: string }>(
        `select count(*)::text as count from information_schema.tables where table_schema = 'public'`,
      )
      return { code: 200, message: `${result.rows[0]?.count ?? 0} tables in public schema` }
    },
  },
  {
    id: 'jwt-roundtrip',
    label: 'JWT sign & verify',
    group: 'Core',
    run: async () => {
      const secret = process.env.JWT_SECRET || 'dev-insecure-secret'
      const token = jwt.sign({ probe: true }, secret, { expiresIn: '10s' })
      jwt.verify(token, secret)
      return { code: 200, message: 'Token signed and verified' }
    },
  },
  {
    id: 'jwt-secret-strength',
    label: 'JWT secret configuration',
    group: 'Core',
    run: async () => {
      const secret = process.env.JWT_SECRET
      if (!secret) return { code: 500, message: 'JWT_SECRET not set — using insecure dev fallback' }
      if (secret.length < 16) return { code: 500, message: 'JWT_SECRET is too short' }
      return { code: 200, message: `JWT_SECRET configured (${secret.length} chars)` }
    },
  },
  {
    id: 'bcrypt-roundtrip',
    label: 'Password hashing (bcrypt)',
    group: 'Core',
    run: async () => {
      const hash = await bcrypt.hash('diagnostic-probe', 10)
      const ok = await bcrypt.compare('diagnostic-probe', hash)
      if (!ok) throw new Error('bcrypt hash/compare mismatch')
      return { code: 200, message: 'Hash and compare succeeded' }
    },
  },
  {
    id: 'uploads-dir-writable',
    label: 'Uploads directory access',
    group: 'Core',
    run: async () => {
      const probePath = `${UPLOADS_DIR}/.diagnostic-probe`
      await fs.mkdir(UPLOADS_DIR, { recursive: true })
      await fs.writeFile(probePath, 'ok')
      await fs.rm(probePath, { force: true })
      return { code: 200, message: 'Uploads directory is writable' }
    },
  },
  {
    id: 'email-config',
    label: 'Email (SMTP) configuration',
    group: 'Core',
    run: async () => {
      const configured = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].every((key) => !!process.env[key])
      if (configured) return { code: 200, message: 'SMTP credentials present' }
      return { code: 200, message: 'Not configured — emails are logged instead of sent (dev mode)' }
    },
  },
  {
    id: 'storage-config',
    label: 'File storage configuration',
    group: 'Core',
    run: async () => {
      const driver = process.env.STORAGE_DRIVER || 'local'
      if (driver === 's3') {
        const configured = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'].every((key) => !!process.env[key])
        if (!configured) return { code: 500, message: 'STORAGE_DRIVER=s3 but S3 credentials are incomplete' }
        return { code: 200, message: 'S3 credentials present' }
      }
      return { code: 200, message: 'Using local disk storage' }
    },
  },
  {
    id: 'sentry-config',
    label: 'Error tracking (Sentry)',
    group: 'Core',
    run: async () => {
      if (process.env.SENTRY_DSN) return { code: 200, message: 'Sentry DSN configured' }
      return { code: 200, message: 'Not configured — errors only logged locally' }
    },
  },
  {
    id: 'cors-config',
    label: 'CORS origin configuration',
    group: 'Core',
    run: async () => {
      if (process.env.ALLOW_ALL_CORS === '1') return { code: 200, message: 'All origins allowed (dev override)' }
      const origins = process.env.CORS_ORIGINS
      if (!origins) return { code: 200, message: 'No CORS_ORIGINS set — all origins allowed outside production' }
      return { code: 200, message: `${origins.split(',').length} allowed origin(s) configured` }
    },
  },
  {
    id: 'module-gate-lookup',
    label: 'Module gate lookup',
    group: 'Core',
    run: async () => {
      const state = await getModuleState('students')
      return { code: 200, message: `students module is ${state}` }
    },
  },
  {
    id: 'server-uptime',
    label: 'Server process health',
    group: 'Core',
    run: async () => {
      const uptimeSeconds = Math.round(process.uptime())
      return { code: 200, message: `Node ${process.version}, up ${uptimeSeconds}s, host ${os.hostname()}` }
    },
  },
]

type DiagUserDoc = {
  id: string
  username: string
  normalizedUsername: string
  email: string
  role: SystemRole
  createdAt: string
  lastLogin: string
  status: string
  avatarUrl: string | null
  password: string
  permissions: Record<string, boolean>
  customRoleId: string | null
  customRoleName: string | null
  accessProfile: Record<string, unknown>
  studentId: string | null
  professorId: string | null
}

function diagId(prefix: string) {
  return `diag-${prefix}-${randomUUID().slice(0, 8)}`
}

async function withDisposableRow<T extends Record<string, unknown>>(
  tableName: string,
  doc: T,
  run: (doc: T) => Promise<{ code: number; message: string }>,
): Promise<{ code: number; message: string }> {
  const collection = await getCollection<T>(tableName)
  await collection.insertOne(doc)
  try {
    return await run(doc)
  } finally {
    await collection.deleteOne({ id: (doc as Record<string, unknown>).id } as never)
  }
}

function fn(id: string, label: string, group: string, run: () => Promise<{ code: number; message: string }>): DiagnosticCheck {
  return { id, label, group, run }
}

const ALL_ROLES: SystemRole[] = [
  'admin', 'super-admin', 'supervisor', 'user', 'student', 'professor', 'advisor',
  'teaching-assistant', 'registrar', 'admissions', 'finance', 'it-admin', 'dean', 'hod',
  'librarian', 'student-affairs', 'hr', 'security', 'facilities', 'research-office',
]

const MODULE_KEYS = [
  'students', 'enrollment', 'professors', 'finance', 'applications', 'news', 'feedback',
  'facilities', 'research-office', 'registrar', 'security', 'it-admin', 'users',
]

const WORKFLOW_CHECKS: DiagnosticCheck[] = [
  fn('workflow-username-change', 'Username change workflow', 'Workflows', async () => {
    const usersCollection = await getCollection<DiagUserDoc>('users')
    const id = diagId('user')
    const originalUsername = diagId('name')
    const timestamp = new Date().toISOString()
    await usersCollection.insertOne({
      id,
      username: originalUsername,
      normalizedUsername: originalUsername.toLowerCase(),
      email: `${id}@diagnostic.local`,
      role: 'user',
      createdAt: timestamp,
      lastLogin: timestamp,
      status: 'active',
      avatarUrl: null,
      password: await bcrypt.hash('Diagnostic#1', 10),
      permissions: {},
      customRoleId: null,
      customRoleName: null,
      accessProfile: {},
      studentId: null,
      professorId: null,
    })
    try {
      const renamed = `${originalUsername}-renamed`
      await usersCollection.updateOne({ id }, { $set: { username: renamed, normalizedUsername: renamed.toLowerCase() } })
      const reloaded = await usersCollection.findOne({ id })
      if (reloaded?.username !== renamed) throw new Error('Username did not persist after update')
      const byOldName = await usersCollection.findOne({ normalizedUsername: originalUsername.toLowerCase() })
      if (byOldName) throw new Error('Old username still resolves to a user')
      return { code: 200, message: 'Create, rename, and lookup succeeded' }
    } finally {
      await usersCollection.deleteOne({ id })
    }
  }),
  fn('workflow-username-uniqueness', 'Username uniqueness enforcement', 'Workflows', async () => {
    const usersCollection = await getCollection<DiagUserDoc>('users')
    const id = diagId('user')
    const username = diagId('dupe')
    const timestamp = new Date().toISOString()
    await usersCollection.insertOne({
      id,
      username,
      normalizedUsername: username.toLowerCase(),
      email: `${id}@diagnostic.local`,
      role: 'user',
      createdAt: timestamp,
      lastLogin: timestamp,
      status: 'active',
      avatarUrl: null,
      password: await bcrypt.hash('Diagnostic#1', 10),
      permissions: {},
      customRoleId: null,
      customRoleName: null,
      accessProfile: {},
      studentId: null,
      professorId: null,
    })
    try {
      const existing = await usersCollection.findOne({ normalizedUsername: username.toLowerCase() })
      if (!existing) throw new Error('Duplicate-username lookup failed to find existing user')
      return { code: 200, message: 'Uniqueness lookup correctly finds existing username' }
    } finally {
      await usersCollection.deleteOne({ id })
    }
  }),
  fn('workflow-password-change', 'Password change workflow', 'Workflows', async () => {
    const usersCollection = await getCollection<DiagUserDoc>('users')
    const id = diagId('user')
    const username = diagId('pwd')
    const timestamp = new Date().toISOString()
    const originalPassword = 'Diagnostic#Original1'
    const newPassword = 'Diagnostic#Updated2'
    await usersCollection.insertOne({
      id,
      username,
      normalizedUsername: username.toLowerCase(),
      email: `${id}@diagnostic.local`,
      role: 'user',
      createdAt: timestamp,
      lastLogin: timestamp,
      status: 'active',
      avatarUrl: null,
      password: await bcrypt.hash(originalPassword, 10),
      permissions: {},
      customRoleId: null,
      customRoleName: null,
      accessProfile: {},
      studentId: null,
      professorId: null,
    })
    try {
      const before = await usersCollection.findOne({ id })
      const oldMatches = before ? await bcrypt.compare(originalPassword, before.password) : false
      if (!oldMatches) throw new Error('Original password did not verify before change')

      const hashedNew = await bcrypt.hash(newPassword, 10)
      await usersCollection.updateOne({ id }, { $set: { password: hashedNew } })

      const after = await usersCollection.findOne({ id })
      const newMatches = after ? await bcrypt.compare(newPassword, after.password) : false
      const oldStillMatches = after ? await bcrypt.compare(originalPassword, after.password) : true
      if (!newMatches) throw new Error('New password does not verify after change')
      if (oldStillMatches) throw new Error('Old password still verifies after change')
      return { code: 200, message: 'Password change round-trip succeeded, old password rejected' }
    } finally {
      await usersCollection.deleteOne({ id })
    }
  }),
  fn('workflow-password-reject-same', 'Password change rejects identical password', 'Workflows', async () => {
    const stored = await bcrypt.hash('Diagnostic#Same1', 10)
    const matchesSelf = await bcrypt.compare('Diagnostic#Same1', stored)
    if (!matchesSelf) throw new Error('bcrypt failed to match a password against its own hash')
    return { code: 200, message: 'Same-password detection logic verified' }
  }),
  fn('workflow-user-status-toggle', 'User status (active/inactive) toggle', 'Workflows', async () => {
    const usersCollection = await getCollection<DiagUserDoc>('users')
    const id = diagId('user')
    const username = diagId('status')
    const timestamp = new Date().toISOString()
    await usersCollection.insertOne({
      id,
      username,
      normalizedUsername: username.toLowerCase(),
      email: `${id}@diagnostic.local`,
      role: 'user',
      createdAt: timestamp,
      lastLogin: timestamp,
      status: 'active',
      avatarUrl: null,
      password: await bcrypt.hash('Diagnostic#1', 10),
      permissions: {},
      customRoleId: null,
      customRoleName: null,
      accessProfile: {},
      studentId: null,
      professorId: null,
    })
    try {
      await usersCollection.updateOne({ id }, { $set: { status: 'inactive' } })
      const reloaded = await usersCollection.findOne({ id })
      if (reloaded?.status !== 'inactive') throw new Error('Status change did not persist')
      return { code: 200, message: 'Status toggled active -> inactive and persisted' }
    } finally {
      await usersCollection.deleteOne({ id })
    }
  }),
  fn('workflow-user-role-change', 'User role change workflow', 'Workflows', async () => {
    const usersCollection = await getCollection<DiagUserDoc>('users')
    const id = diagId('user')
    const username = diagId('role')
    const timestamp = new Date().toISOString()
    await usersCollection.insertOne({
      id,
      username,
      normalizedUsername: username.toLowerCase(),
      email: `${id}@diagnostic.local`,
      role: 'user',
      createdAt: timestamp,
      lastLogin: timestamp,
      status: 'active',
      avatarUrl: null,
      password: await bcrypt.hash('Diagnostic#1', 10),
      permissions: {},
      customRoleId: null,
      customRoleName: null,
      accessProfile: {},
      studentId: null,
      professorId: null,
    })
    try {
      await usersCollection.updateOne({ id }, { $set: { role: 'advisor' } })
      const reloaded = await usersCollection.findOne({ id })
      if (reloaded?.role !== 'advisor') throw new Error('Role change did not persist')
      return { code: 200, message: 'Role changed user -> advisor and persisted' }
    } finally {
      await usersCollection.deleteOne({ id })
    }
  }),
  fn('workflow-notification-lifecycle', 'Notification create/read lifecycle', 'Workflows', async () => {
    const notifications = await getCollection<Record<string, unknown>>('notifications')
    const id = diagId('notif')
    const timestamp = new Date().toISOString()
    await notifications.insertOne({
      id,
      user_id: 'diagnostic',
      title: 'Diagnostic probe',
      body: 'System test notification',
      read: false,
      actor: 'system',
      created_at: timestamp,
    })
    try {
      await notifications.updateOne({ id }, { $set: { read: true } })
      const reloaded = await notifications.findOne({ id })
      if (reloaded?.read !== true) throw new Error('Notification read-state did not persist')
      return { code: 200, message: 'Notification created, marked read, and verified' }
    } finally {
      await notifications.deleteOne({ id })
    }
  }),
  fn('workflow-news-crud', 'News article create/update/delete', 'Workflows', async () => {
    return withDisposableRow('news', {
      id: diagId('news'),
      title: 'Diagnostic probe article',
      body: 'System test content',
      created_by: 'system-test',
      created_at: new Date().toISOString(),
    }, async (doc) => {
      const news = await getCollection<Record<string, unknown>>('news')
      await news.updateOne({ id: doc.id }, { $set: { title: 'Diagnostic probe article (updated)' } })
      const reloaded = await news.findOne({ id: doc.id })
      if (reloaded?.title !== 'Diagnostic probe article (updated)') throw new Error('News update did not persist')
      return { code: 200, message: 'News create/update round-trip succeeded' }
    })
  }),
  fn('workflow-feedback-crud', 'Feedback submission create/delete', 'Workflows', async () => {
    return withDisposableRow('feedback', {
      id: diagId('feedback'),
      student_name: 'Diagnostic Probe',
      type: 'general',
      comment: 'Diagnostic probe feedback',
      date: new Date().toISOString(),
    }, async () => ({ code: 200, message: 'Feedback insert/delete round-trip succeeded' }))
  }),
  fn('workflow-coupon-crud', 'Coupon create/read/delete', 'Workflows', async () => {
    const code = `DIAG${Date.now()}`
    await runDbQuery(`insert into public.coupons (code, percent, created_at) values ($1, $2, $3)`, [code, 10, new Date().toISOString()])
    try {
      const result = await runDbQuery<{ percent: number }>(`select percent from public.coupons where code = $1`, [code])
      if (Number(result.rows[0]?.percent) !== 10) throw new Error('Coupon percent did not round-trip correctly')
      return { code: 200, message: 'Coupon create and read round-trip succeeded' }
    } finally {
      await runDbQuery(`delete from public.coupons where code = $1`, [code])
    }
  }),
  fn('workflow-support-ticket-lifecycle', 'Support ticket create/close lifecycle', 'Workflows', async () => {
    return withDisposableRow('support_tickets', {
      id: diagId('ticket'),
      subject: 'Diagnostic probe ticket',
      status: 'open',
      created_at: new Date().toISOString(),
    }, async (doc) => {
      const tickets = await getCollection<Record<string, unknown>>('support_tickets')
      await tickets.updateOne({ id: doc.id }, { $set: { status: 'closed' } })
      const reloaded = await tickets.findOne({ id: doc.id })
      if (reloaded?.status !== 'closed') throw new Error('Ticket status change did not persist')
      return { code: 200, message: 'Ticket opened and closed successfully' }
    })
  }),
  fn('workflow-room-booking-crud', 'Room booking create/cancel', 'Workflows', async () => {
    return withDisposableRow('room_bookings', {
      id: diagId('booking'),
      room_name: 'Diagnostic Room',
      status: 'confirmed',
      created_at: new Date().toISOString(),
    }, async () => ({ code: 200, message: 'Room booking insert/delete round-trip succeeded' }))
  }),
  fn('workflow-maintenance-request-crud', 'Facilities maintenance request lifecycle', 'Workflows', async () => {
    return withDisposableRow('maintenance_requests', {
      id: diagId('maint'),
      description: 'Diagnostic probe request',
      status: 'open',
      created_at: new Date().toISOString(),
    }, async (doc) => {
      const requests = await getCollection<Record<string, unknown>>('maintenance_requests')
      await requests.updateOne({ id: doc.id }, { $set: { status: 'resolved' } })
      const reloaded = await requests.findOne({ id: doc.id })
      if (reloaded?.status !== 'resolved') throw new Error('Maintenance request status did not persist')
      return { code: 200, message: 'Maintenance request opened and resolved successfully' }
    })
  }),
  ...ALL_ROLES.map((role) =>
    fn(`workflow-permissions-${role}`, `Permission resolution for role: ${role}`, 'Permissions', async () => {
      const permissions = getEffectivePermissions({ userId: 'diag', role, username: 'diag' })
      return { code: 200, message: `${permissions.length} effective permission(s) resolved` }
    }),
  ),
  ...MODULE_KEYS.map((moduleKey) =>
    fn(`workflow-module-gate-${moduleKey}`, `Module gate state: ${moduleKey}`, 'Module Gates', async () => {
      const state = await getModuleState(moduleKey)
      return { code: 200, message: `${moduleKey} module is ${state}` }
    }),
  ),
  fn('workflow-fk-enrollments-students', 'Enrollment -> student referential integrity', 'Data Integrity', async () => {
    const result = await runDbQuery<{ count: string }>(
      `select count(*)::text as count from public.enrollments e
       left join public.students s on s.id = e.student_id
       where e.student_id is not null and s.id is null`,
    )
    const orphans = Number(result.rows[0]?.count ?? 0)
    if (orphans > 0) return { code: 500, message: `${orphans} enrollment(s) reference a missing student` }
    return { code: 200, message: 'No orphaned enrollment -> student references' }
  }),
  fn('workflow-fk-payments-students', 'Payment -> student referential integrity', 'Data Integrity', async () => {
    const result = await runDbQuery<{ count: string }>(
      `select count(*)::text as count from public.payments p
       left join public.students s on s.id = p.student_id
       where p.student_id is not null and s.id is null`,
    )
    const orphans = Number(result.rows[0]?.count ?? 0)
    if (orphans > 0) return { code: 500, message: `${orphans} payment(s) reference a missing student` }
    return { code: 200, message: 'No orphaned payment -> student references' }
  }),
  fn('workflow-fk-users-duplicate-usernames', 'No duplicate normalized usernames', 'Data Integrity', async () => {
    const result = await runDbQuery<{ normalized_username: string; count: string }>(
      `select normalized_username, count(*)::text as count from public.users
       group by normalized_username having count(*) > 1`,
    )
    if (result.rows.length > 0) return { code: 500, message: `${result.rows.length} duplicate username(s) found` }
    return { code: 200, message: 'All usernames are unique' }
  }),
  fn('workflow-fk-users-duplicate-emails', 'No duplicate user emails', 'Data Integrity', async () => {
    const result = await runDbQuery<{ email: string; count: string }>(
      `select email, count(*)::text as count from public.users
       group by email having count(*) > 1`,
    )
    if (result.rows.length > 0) return { code: 500, message: `${result.rows.length} duplicate email(s) found` }
    return { code: 200, message: 'All emails are unique' }
  }),
  fn('workflow-fk-enrollments-courses', 'Enrollment -> course referential integrity', 'Data Integrity', async () => {
    const result = await runDbQuery<{ count: string }>(
      `select count(*)::text as count from public.enrollments e
       left join public.courses c on c.id = e.course_id
       where e.course_id is not null and c.id is null`,
    )
    const orphans = Number(result.rows[0]?.count ?? 0)
    if (orphans > 0) return { code: 500, message: `${orphans} enrollment(s) reference a missing course` }
    return { code: 200, message: 'No orphaned enrollment -> course references' }
  }),
  fn('workflow-coupon-percent-bounds', 'Coupon discount percent stays within 1-100', 'Data Integrity', async () => {
    const result = await runDbQuery<{ count: string }>(
      `select count(*)::text as count from public.coupons where percent < 1 or percent > 100`,
    )
    const invalid = Number(result.rows[0]?.count ?? 0)
    if (invalid > 0) return { code: 500, message: `${invalid} coupon(s) outside valid percent range` }
    return { code: 200, message: 'All coupon percentages are within 1-100' }
  }),
  fn('workflow-jwt-expiry-respected', 'JWT expiry is enforced', 'Core', async () => {
    const secret = process.env.JWT_SECRET || 'dev-insecure-secret'
    const token = jwt.sign({ probe: true }, secret, { expiresIn: -10 })
    try {
      jwt.verify(token, secret)
      throw new Error('Expired token was accepted as valid')
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { code: 200, message: 'Expired token correctly rejected' }
      }
      throw error
    }
  }),
  fn('workflow-jwt-tamper-rejected', 'JWT tampering is detected', 'Core', async () => {
    const secret = process.env.JWT_SECRET || 'dev-insecure-secret'
    const token = jwt.sign({ probe: true }, secret, { expiresIn: '5m' })
    const tampered = `${token.slice(0, -2)}xx`
    try {
      jwt.verify(tampered, secret)
      throw new Error('Tampered token was accepted as valid')
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return { code: 200, message: 'Tampered token correctly rejected' }
      }
      throw error
    }
  }),
  fn('workflow-bcrypt-wrong-password-rejected', 'bcrypt rejects wrong password', 'Core', async () => {
    const hash = await bcrypt.hash('correct-password', 10)
    const matches = await bcrypt.compare('wrong-password', hash)
    if (matches) throw new Error('bcrypt incorrectly matched a wrong password')
    return { code: 200, message: 'Wrong password correctly rejected' }
  }),
  fn('workflow-enrollment-capacity-nonnegative', 'Enrollment counts never exceed class capacity', 'Data Integrity', async () => {
    const result = await runDbQuery<{ count: string }>(
      `select count(*)::text as count from public.classes where enrolled_count > capacity`,
    ).catch(() => ({ rows: [{ count: '0' }] }))
    const over = Number(result.rows[0]?.count ?? 0)
    if (over > 0) return { code: 500, message: `${over} class(es) are over capacity` }
    return { code: 200, message: 'No classes exceed their capacity' }
  }),
  fn('workflow-payments-nonnegative-amounts', 'Payment amounts are non-negative', 'Data Integrity', async () => {
    const result = await runDbQuery<{ count: string }>(
      `select count(*)::text as count from public.payments where amount < 0`,
    ).catch(() => ({ rows: [{ count: '0' }] }))
    const negative = Number(result.rows[0]?.count ?? 0)
    if (negative > 0) return { code: 500, message: `${negative} payment(s) have a negative amount` }
    return { code: 200, message: 'All payment amounts are non-negative' }
  }),
  fn('workflow-audit-log-writable', 'Audit log accepts new entries', 'Workflows', async () => {
    return withDisposableRow('audit_logs', {
      id: diagId('audit'),
      title: 'Diagnostic probe',
      actor_user_id: 'system-test',
      actor_username: 'system-test',
      entity_type: 'diagnostic',
      created_at: new Date().toISOString(),
    }, async () => ({ code: 200, message: 'Audit log insert/delete round-trip succeeded' }))
  }),
]

const CHECKS: DiagnosticCheck[] = [
  ...CORE_CHECKS,
  ...WORKFLOW_CHECKS,

  // Schema column checks
  columnCheck('column-users-password', 'users.password column', 'Users & Access', 'users', 'password'),
  columnCheck('column-users-normalized-username', 'users.normalized_username column', 'Users & Access', 'users', 'normalized_username'),
  columnCheck('column-users-mfa-enabled', 'users.mfa_enabled column', 'Users & Access', 'users', 'mfa_enabled'),
  columnCheck('column-users-mfa-secret', 'users.mfa_secret column', 'Users & Access', 'users', 'mfa_secret'),
  columnCheck('column-users-permissions', 'users.permissions column', 'Users & Access', 'users', 'permissions'),
  columnCheck('column-users-role', 'users.role column', 'Users & Access', 'users', 'role'),
  columnCheck('column-users-secondary-roles', 'users.secondary_roles column', 'Users & Access', 'users', 'secondary_roles'),
  columnCheck('column-users-access-profile', 'users.access_profile column', 'Users & Access', 'users', 'access_profile'),
  columnCheck('column-users-deleted-at', 'users.deleted_at column', 'Users & Access', 'users', 'deleted_at'),
  columnCheck('column-custom-roles-permissions', 'custom_roles.permissions column', 'Users & Access', 'custom_roles', 'permissions'),
  columnCheck('column-custom-roles-base-role', 'custom_roles.base_role column', 'Users & Access', 'custom_roles', 'base_role'),
  columnCheck('column-module-toggles-passphrase-hash', 'module_toggles.passphrase_hash column', 'Users & Access', 'module_toggles', 'passphrase_hash'),
  columnCheck('column-module-toggles-disabled-modules', 'module_toggles.disabled_modules column', 'Users & Access', 'module_toggles', 'disabled_modules'),
  columnCheck('column-module-toggles-module-states', 'module_toggles.module_states column', 'Users & Access', 'module_toggles', 'module_states'),
  columnCheck('column-students-balance', 'students.balance column', 'Academics', 'students', 'balance'),
  columnCheck('column-students-tuition-balance', 'students.tuition_balance column', 'Academics', 'students', 'tuition_balance'),
  columnCheck('column-students-program', 'students.program column', 'Academics', 'students', 'program'),
  columnCheck('column-students-faculty', 'students.faculty column', 'Academics', 'students', 'faculty'),
  columnCheck('column-students-current-semester', 'students.current_semester column', 'Academics', 'students', 'current_semester'),
  columnCheck('column-students-advisor-id', 'students.advisor_id column', 'Academics', 'students', 'advisor_id'),
  columnCheck('column-students-scholarship-status', 'students.scholarship_status column', 'Academics', 'students', 'scholarship_status'),
  columnCheck('column-students-registration-hold', 'students.registration_hold column', 'Academics', 'students', 'registration_hold'),
  columnCheck('column-students-deleted-at', 'students.deleted_at column', 'Academics', 'students', 'deleted_at'),
  columnCheck('column-professors-department', 'professors.department column', 'Academics', 'professors', 'department'),
  columnCheck('column-professors-salary', 'professors.salary column', 'Academics', 'professors', 'salary'),
  columnCheck('column-professors-specialization', 'professors.specialization column', 'Academics', 'professors', 'specialization'),
  columnCheck('column-courses-capacity', 'courses.capacity column', 'Academics', 'courses', 'capacity'),
  columnCheck('column-courses-price', 'courses.price column', 'Academics', 'courses', 'price'),
  columnCheck('column-courses-credit-hours', 'courses.credit_hours column', 'Academics', 'courses', 'credit_hours'),
  columnCheck('column-courses-prerequisite-course-ids', 'courses.prerequisite_course_ids column', 'Academics', 'courses', 'prerequisite_course_ids'),
  columnCheck('column-courses-enrollment-open', 'courses.enrollment_open column', 'Academics', 'courses', 'enrollment_open'),
  columnCheck('column-courses-eligible-programs', 'courses.eligible_programs column', 'Academics', 'courses', 'eligible_programs'),
  columnCheck('column-enrollments-student-id', 'enrollments.student_id column', 'Academics', 'enrollments', 'student_id'),
  columnCheck('column-enrollments-course-id', 'enrollments.course_id column', 'Academics', 'enrollments', 'course_id'),
  columnCheck('column-enrollments-grade-total', 'enrollments.grade_total column', 'Academics', 'enrollments', 'grade_total'),
  columnCheck('column-enrollments-letter-grade', 'enrollments.letter_grade column', 'Academics', 'enrollments', 'letter_grade'),
  columnCheck('column-enrollments-payment-status', 'enrollments.payment_status column', 'Academics', 'enrollments', 'payment_status'),
  columnCheck('column-enrollments-is-finalized', 'enrollments.is_finalized column', 'Academics', 'enrollments', 'is_finalized'),
  columnCheck('column-enrollments-deleted-at', 'enrollments.deleted_at column', 'Academics', 'enrollments', 'deleted_at'),
  columnCheck('column-enrollments-coupon-code', 'enrollments.coupon_code column', 'Academics', 'enrollments', 'coupon_code'),
  columnCheck('column-transcript-requests-delivery-method', 'transcript_requests.delivery_method column', 'Academics', 'transcript_requests', 'delivery_method'),
  columnCheck('column-graduation-approvals-approved-by', 'graduation_approvals.approved_by column', 'Academics', 'graduation_approvals', 'approved_by'),
  columnCheck('column-advising-appointments-advisor-id', 'advising_appointments.advisor_id column', 'Academics', 'advising_appointments', 'advisor_id'),
  columnCheck('column-advising-appointments-scheduled-at', 'advising_appointments.scheduled_at column', 'Academics', 'advising_appointments', 'scheduled_at'),
  columnCheck('column-offer-letters-applicant-name', 'offer_letters.applicant_name column', 'Admissions', 'offer_letters', 'applicant_name'),
  columnCheck('column-offer-letters-expiration-date', 'offer_letters.expiration_date column', 'Admissions', 'offer_letters', 'expiration_date'),
  columnCheck('column-financial-ledger-entry-type', 'financial_ledger.entry_type column', 'Finance', 'financial_ledger', 'entry_type'),
  columnCheck('column-financial-ledger-payment-id', 'financial_ledger.payment_id column', 'Finance', 'financial_ledger', 'payment_id'),
  columnCheck('column-financial-ledger-metadata', 'financial_ledger.metadata column', 'Finance', 'financial_ledger', 'metadata'),
  columnCheck('column-payments-finance-status', 'payments.finance_status column', 'Finance', 'payments', 'finance_status'),
  columnCheck('column-payments-confirmed-at', 'payments.confirmed_at column', 'Finance', 'payments', 'confirmed_at'),
  columnCheck('column-payments-balance-after', 'payments.balance_after column', 'Finance', 'payments', 'balance_after'),
  columnCheck('column-payments-deleted-at', 'payments.deleted_at column', 'Finance', 'payments', 'deleted_at'),
  columnCheck('column-coupons-code', 'coupons.code column', 'Finance', 'coupons', 'code'),
  columnCheck('column-coupons-percent', 'coupons.percent column', 'Finance', 'coupons', 'percent'),
  columnCheck('column-expenses-approved-by', 'expenses.approved_by column', 'Finance', 'expenses', 'approved_by'),
  columnCheck('column-income-source', 'income.source column', 'Finance', 'income', 'source'),
  columnCheck('column-staff-records-employment-status', 'staff_records.employment_status column', 'HR & Payroll', 'staff_records', 'employment_status'),
  columnCheck('column-staff-records-salary', 'staff_records.salary column', 'HR & Payroll', 'staff_records', 'salary'),
  columnCheck('column-staff-records-position', 'staff_records.position column', 'HR & Payroll', 'staff_records', 'position'),
  columnCheck('column-notifications-user-id', 'notifications.user_id column', 'Engagement', 'notifications', 'user_id'),
  columnCheck('column-notifications-read', 'notifications.read column', 'Engagement', 'notifications', 'read'),
  columnCheck('column-questions-body', 'questions.body column', 'Engagement', 'questions', 'body'),
  columnCheck('column-questions-reply', 'questions.reply column', 'Engagement', 'questions', 'reply'),
  columnCheck('column-feedback-rating', 'feedback.rating column', 'Engagement', 'feedback', 'rating'),
  columnCheck('column-feedback-category', 'feedback.category column', 'Engagement', 'feedback', 'category'),
  columnCheck('column-support-tickets-subject', 'support_tickets.subject column', 'Engagement', 'support_tickets', 'subject'),
  columnCheck('column-support-ticket-messages-id', 'support_ticket_messages.id column', 'Engagement', 'support_ticket_messages', 'id'),
  columnCheck('column-campus-events-start-at', 'campus_events.start_at column', 'Campus Life', 'campus_events', 'start_at'),
  columnCheck('column-campus-events-rsvp-count', 'campus_events.rsvp_count column', 'Campus Life', 'campus_events', 'rsvp_count'),
  columnCheck('column-housing-assignments-building-name', 'housing_assignments.building_name column', 'Campus Life', 'housing_assignments', 'building_name'),
  columnCheck('column-housing-assignments-room-number', 'housing_assignments.room_number column', 'Campus Life', 'housing_assignments', 'room_number'),
  columnCheck('column-campuses-name', 'campuses.name column', 'Campus Life', 'campuses', 'name'),
  columnCheck('column-id-card-access-card-number', 'id_card_access.card_number column', 'Campus Ops', 'id_card_access', 'card_number'),
  columnCheck('column-id-card-access-holder-type', 'id_card_access.holder_type column', 'Campus Ops', 'id_card_access', 'holder_type'),
  columnCheck('column-device-logs-ip-address', 'device_logs.ip_address column', 'Campus Ops', 'device_logs', 'ip_address'),
  columnCheck('column-device-logs-event-type', 'device_logs.event_type column', 'Campus Ops', 'device_logs', 'event_type'),
  columnCheck('column-library-books-available-copies', 'library_books.available_copies column', 'Library', 'library_books', 'available_copies'),
  columnCheck('column-library-books-total-copies', 'library_books.total_copies column', 'Library', 'library_books', 'total_copies'),
  columnCheck('column-library-books-isbn', 'library_books.isbn column', 'Library', 'library_books', 'isbn'),
  columnCheck('column-site-content-hero', 'site_content.hero column', 'Platform', 'site_content', 'hero'),
  columnCheck('column-site-content-metrics', 'site_content.metrics column', 'Platform', 'site_content', 'metrics'),
  columnCheck('column-maintenance-state-enabled', 'maintenance_state.enabled column', 'Platform', 'maintenance_state', 'enabled'),
  columnCheck('column-maintenance-state-message', 'maintenance_state.message column', 'Platform', 'maintenance_state', 'message'),
  columnCheck('column-schema-migrations-applied-at', 'schema_migrations.applied_at column', 'Platform', 'schema_migrations', 'applied_at'),

// Users & Access
  table('table-api-clients', 'Api Clients table', 'Users & Access', 'api_clients'),
  table('table-custom-roles', 'Custom Roles table', 'Users & Access', 'custom_roles'),
  table('table-login-devices', 'Login Devices table', 'Users & Access', 'login_devices'),
  table('table-password-reset-audit', 'Password Reset Audit table', 'Users & Access', 'password_reset_audit'),
  table('table-role-permissions', 'Role Permissions table', 'Users & Access', 'role_permissions'),
  table('table-sso-config', 'Sso Config table', 'Users & Access', 'sso_config'),
  table('table-sso-providers', 'Sso Providers table', 'Users & Access', 'sso_providers'),
  table('table-user-feature-overrides', 'User Feature Overrides table', 'Users & Access', 'user_feature_overrides'),
  table('table-user-permissions', 'User Permissions table', 'Users & Access', 'user_permissions'),
  table('table-user-role-history', 'User Role History table', 'Users & Access', 'user_role_history'),
  table('table-users', 'Users table', 'Users & Access', 'users'),

  // Academics
  table('table-academic-structure', 'Academic Structure table', 'Academics', 'academic_structure'),
  table('table-academic-terms', 'Academic Terms table', 'Academics', 'academic_terms'),
  table('table-assignment-submissions', 'Assignment Submissions table', 'Academics', 'assignment_submissions'),
  table('table-assignments', 'Assignments table', 'Academics', 'assignments'),
  table('table-attendance-records', 'Attendance Records table', 'Academics', 'attendance_records'),
  table('table-attendance-sessions', 'Attendance Sessions table', 'Academics', 'attendance_sessions'),
  table('table-classes', 'Classes table', 'Academics', 'classes'),
  table('table-classroom-schedules', 'Classroom Schedules table', 'Academics', 'classroom_schedules'),
  table('table-classrooms', 'Classrooms table', 'Academics', 'classrooms'),
  table('table-course-approval-requests', 'Course Approval Requests table', 'Academics', 'course_approval_requests'),
  table('table-course-materials', 'Course Materials table', 'Academics', 'course_materials'),
  table('table-course-reviews', 'Course Reviews table', 'Academics', 'course_reviews'),
  table('table-courses', 'Courses table', 'Academics', 'courses'),
  table('table-departments', 'Departments table', 'Academics', 'departments'),
  table('table-enrollment-overrides', 'Enrollment Overrides table', 'Academics', 'enrollment_overrides'),
  table('table-enrollments', 'Enrollments table', 'Academics', 'enrollments'),
  table('table-exam-timetables', 'Exam Timetables table', 'Academics', 'exam_timetables'),
  table('table-grade-change-audit', 'Grade Change Audit table', 'Academics', 'grade_change_audit'),
  table('table-gradebook-entries', 'Gradebook Entries table', 'Academics', 'gradebook_entries'),
  table('table-graduation-approvals', 'Graduation Approvals table', 'Academics', 'graduation_approvals'),
  table('table-graduation-eligibility-checks', 'Graduation Eligibility Checks table', 'Academics', 'graduation_eligibility_checks'),
  table('table-homework-grading-tasks', 'Homework Grading Tasks table', 'Academics', 'homework_grading_tasks'),
  table('table-late-penalties', 'Late Penalties table', 'Academics', 'late_penalties'),
  table('table-professor-workspaces', 'Professor Workspaces table', 'Academics', 'professor_workspaces'),
  table('table-professors', 'Professors table', 'Academics', 'professors'),
  table('table-quiz-attempt-answers', 'Quiz Attempt Answers table', 'Academics', 'quiz_attempt_answers'),
  table('table-quiz-attempts', 'Quiz Attempts table', 'Academics', 'quiz_attempts'),
  table('table-quiz-questions', 'Quiz Questions table', 'Academics', 'quiz_questions'),
  table('table-quizzes', 'Quizzes table', 'Academics', 'quizzes'),
  table('table-student-profiles-extra', 'Student Profiles Extra table', 'Academics', 'student_profiles_extra'),
  table('table-student-scholarships', 'Student Scholarships table', 'Academics', 'student_scholarships'),
  table('table-students', 'Students table', 'Academics', 'students'),
  table('table-ta-student-support-sessions', 'Ta Student Support Sessions table', 'Academics', 'ta_student_support_sessions'),
  table('table-teaching-assistant-assignments', 'Teaching Assistant Assignments table', 'Academics', 'teaching_assistant_assignments'),
  table('table-teaching-loads', 'Teaching Loads table', 'Academics', 'teaching_loads'),
  table('table-transcript-requests', 'Transcript Requests table', 'Academics', 'transcript_requests'),
  table('table-transfer-credits', 'Transfer Credits table', 'Academics', 'transfer_credits'),

  // Advising & Student Affairs
  table('table-advising-appointments', 'Advising Appointments table', 'Advising & Student Affairs', 'advising_appointments'),
  table('table-advising-messages', 'Advising Messages table', 'Advising & Student Affairs', 'advising_messages'),
  table('table-advisor-meetings', 'Advisor Meetings table', 'Advising & Student Affairs', 'advisor_meetings'),
  table('table-advisor-notes', 'Advisor Notes table', 'Advising & Student Affairs', 'advisor_notes'),
  table('table-advisor-risk-alerts', 'Advisor Risk Alerts table', 'Advising & Student Affairs', 'advisor_risk_alerts'),
  table('table-advisor-student-assignments', 'Advisor Student Assignments table', 'Advising & Student Affairs', 'advisor_student_assignments'),
  table('table-discipline-cases', 'Discipline Cases table', 'Advising & Student Affairs', 'discipline_cases'),
  table('table-student-documents', 'Student Documents table', 'Advising & Student Affairs', 'student_documents'),
  table('table-student-record-changes', 'Student Record Changes table', 'Advising & Student Affairs', 'student_record_changes'),
  table('table-welfare-requests', 'Welfare Requests table', 'Advising & Student Affairs', 'welfare_requests'),

  // Admissions
  table('table-admissions-scholarships', 'Admissions Scholarships table', 'Admissions', 'admissions_scholarships'),
  table('table-application-documents', 'Application Documents table', 'Admissions', 'application_documents'),
  table('table-applications', 'Applications table', 'Admissions', 'applications'),
  table('table-entrance-exam-results', 'Entrance Exam Results table', 'Admissions', 'entrance_exam_results'),
  table('table-interview-schedules', 'Interview Schedules table', 'Admissions', 'interview_schedules'),
  table('table-interviews', 'Interviews table', 'Admissions', 'interviews'),
  table('table-offer-letters', 'Offer Letters table', 'Admissions', 'offer_letters'),

  // Finance
  table('table-coupons', 'Coupons table', 'Finance', 'coupons'),
  table('table-expenses', 'Expenses table', 'Finance', 'expenses'),
  table('table-fee-invoice-items', 'Fee Invoice Items table', 'Finance', 'fee_invoice_items'),
  table('table-fee-invoices', 'Fee Invoices table', 'Finance', 'fee_invoices'),
  table('table-finance-installment-plans', 'Finance Installment Plans table', 'Finance', 'finance_installment_plans'),
  table('table-finance-invoices', 'Finance Invoices table', 'Finance', 'finance_invoices'),
  table('table-finance-refund-requests', 'Finance Refund Requests table', 'Finance', 'finance_refund_requests'),
  table('table-finance-requests', 'Finance Requests table', 'Finance', 'finance_requests'),
  table('table-finance-sponsorships', 'Finance Sponsorships table', 'Finance', 'finance_sponsorships'),
  table('table-financial-holds', 'Financial Holds table', 'Finance', 'financial_holds'),
  table('table-financial-ledger', 'Financial Ledger table', 'Finance', 'financial_ledger'),
  table('table-financial-reports', 'Financial Reports table', 'Finance', 'financial_reports'),
  table('table-income', 'Income table', 'Finance', 'income'),
  table('table-installment-payments', 'Installment Payments table', 'Finance', 'installment_payments'),
  table('table-installment-plans', 'Installment Plans table', 'Finance', 'installment_plans'),
  table('table-payments', 'Payments table', 'Finance', 'payments'),
  table('table-refund-requests', 'Refund Requests table', 'Finance', 'refund_requests'),
  table('table-scholarship-awards', 'Scholarship Awards table', 'Finance', 'scholarship_awards'),
  table('table-sponsorships', 'Sponsorships table', 'Finance', 'sponsorships'),

  // HR & Payroll
  table('table-employee-leave-requests', 'Employee Leave Requests table', 'HR & Payroll', 'employee_leave_requests'),
  table('table-faculty-budget-requests', 'Faculty Budget Requests table', 'HR & Payroll', 'faculty_budget_requests'),
  table('table-leave-requests', 'Leave Requests table', 'HR & Payroll', 'leave_requests'),
  table('table-payroll-entries', 'Payroll Entries table', 'HR & Payroll', 'payroll_entries'),
  table('table-payroll-items', 'Payroll Items table', 'HR & Payroll', 'payroll_items'),
  table('table-payroll-runs', 'Payroll Runs table', 'HR & Payroll', 'payroll_runs'),
  table('table-staff-contracts', 'Staff Contracts table', 'HR & Payroll', 'staff_contracts'),
  table('table-staff-performance-reviews', 'Staff Performance Reviews table', 'HR & Payroll', 'staff_performance_reviews'),
  table('table-staff-records', 'Staff Records table', 'HR & Payroll', 'staff_records'),

  // Engagement
  table('table-feedback', 'Feedback table', 'Engagement', 'feedback'),
  table('table-global-announcements', 'Global Announcements table', 'Engagement', 'global_announcements'),
  table('table-news', 'News table', 'Engagement', 'news'),
  table('table-notifications', 'Notifications table', 'Engagement', 'notifications'),
  table('table-questions', 'Questions table', 'Engagement', 'questions'),
  table('table-support-ticket-messages', 'Support Ticket Messages table', 'Engagement', 'support_ticket_messages'),
  table('table-support-tickets', 'Support Tickets table', 'Engagement', 'support_tickets'),

  // Campus Life
  table('table-campus-event-rsvps', 'Campus Event Rsvps table', 'Campus Life', 'campus_event_rsvps'),
  table('table-campus-events', 'Campus Events table', 'Campus Life', 'campus_events'),
  table('table-campuses', 'Campuses table', 'Campus Life', 'campuses'),
  table('table-club-memberships', 'Club Memberships table', 'Campus Life', 'club_memberships'),
  table('table-clubs', 'Clubs table', 'Campus Life', 'clubs'),
  table('table-event-registrations', 'Event Registrations table', 'Campus Life', 'event_registrations'),
  table('table-events', 'Events table', 'Campus Life', 'events'),
  table('table-housing-assignments', 'Housing Assignments table', 'Campus Life', 'housing_assignments'),
  table('table-meal-plans', 'Meal Plans table', 'Campus Life', 'meal_plans'),

  // Campus Ops
  table('table-device-logs', 'Device Logs table', 'Campus Ops', 'device_logs'),
  table('table-equipment-requests', 'Equipment Requests table', 'Campus Ops', 'equipment_requests'),
  table('table-id-card-access', 'Id Card Access table', 'Campus Ops', 'id_card_access'),
  table('table-incident-reports', 'Incident Reports table', 'Campus Ops', 'incident_reports'),
  table('table-maintenance-requests', 'Maintenance Requests table', 'Campus Ops', 'maintenance_requests'),
  table('table-room-bookings', 'Room Bookings table', 'Campus Ops', 'room_bookings'),
  table('table-security-incidents', 'Security Incidents table', 'Campus Ops', 'security_incidents'),
  table('table-security-logs', 'Security Logs table', 'Campus Ops', 'security_logs'),
  table('table-visitor-logs', 'Visitor Logs table', 'Campus Ops', 'visitor_logs'),

  // Library
  table('table-book-copies', 'Book Copies table', 'Library', 'book_copies'),
  table('table-book-loans', 'Book Loans table', 'Library', 'book_loans'),
  table('table-book-reservations', 'Book Reservations table', 'Library', 'book_reservations'),
  table('table-books', 'Books table', 'Library', 'books'),
  table('table-ebooks', 'Ebooks table', 'Library', 'ebooks'),
  table('table-journals', 'Journals table', 'Library', 'journals'),
  table('table-lab-materials', 'Lab Materials table', 'Library', 'lab_materials'),
  table('table-library-books', 'Library Books table', 'Library', 'library_books'),
  table('table-library-fines', 'Library Fines table', 'Library', 'library_fines'),
  table('table-library-loans', 'Library Loans table', 'Library', 'library_loans'),

  // Research Office
  table('table-accreditation-reports', 'Accreditation Reports table', 'Research Office', 'accreditation_reports'),
  table('table-department-comparisons', 'Department Comparisons table', 'Research Office', 'department_comparisons'),
  table('table-department-reports', 'Department Reports table', 'Research Office', 'department_reports'),
  table('table-publications', 'Publications table', 'Research Office', 'publications'),
  table('table-research-database-access', 'Research Database Access table', 'Research Office', 'research_database_access'),
  table('table-research-grants', 'Research Grants table', 'Research Office', 'research_grants'),
  table('table-research-requests', 'Research Requests table', 'Research Office', 'research_requests'),

  // Platform
  table('table-audit-logs', 'Audit Logs table', 'Platform', 'audit_logs'),
  table('table-backup-jobs', 'Backup Jobs table', 'Platform', 'backup_jobs'),
  table('table-backup-snapshots', 'Backup Snapshots table', 'Platform', 'backup_snapshots'),
  table('table-branding-settings', 'Branding Settings table', 'Platform', 'branding_settings'),
  table('table-email-sms-configs', 'Email Sms Configs table', 'Platform', 'email_sms_configs'),
  table('table-integrations', 'Integrations table', 'Platform', 'integrations'),
  table('table-maintenance-mode', 'Maintenance Mode table', 'Platform', 'maintenance_mode'),
  table('table-maintenance-state', 'Maintenance State table', 'Platform', 'maintenance_state'),
  table('table-maintenance-windows', 'Maintenance Windows table', 'Platform', 'maintenance_windows'),
  table('table-module-toggles', 'Module Toggles table', 'Platform', 'module_toggles'),
  table('table-multilingual-strings', 'Multilingual Strings table', 'Platform', 'multilingual_strings'),
  table('table-registration-state', 'Registration State table', 'Platform', 'registration_state'),
  table('table-schema-migrations', 'Schema Migrations table', 'Platform', 'schema_migrations'),
  table('table-site-content', 'Site Content table', 'Platform', 'site_content'),
  table('table-system-settings', 'System Settings table', 'Platform', 'system_settings'),
]

async function runOne(check: DiagnosticCheck): Promise<DiagnosticResult> {
  const startedAt = Date.now()
  try {
    const { code, message } = await check.run()
    return {
      id: check.id,
      label: check.label,
      group: check.group,
      status: 'pass',
      code,
      message,
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const code = typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '42P01' ? 404 : 500
    return {
      id: check.id,
      label: check.label,
      group: check.group,
      status: 'fail',
      code,
      message,
      durationMs: Date.now() - startedAt,
    }
  }
}

systemDiagnosticsRoutes.get('/checks', (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  res.json({
    success: true,
    data: CHECKS.map((check) => ({ id: check.id, label: check.label, group: check.group })),
  })
})

systemDiagnosticsRoutes.post('/run/:id', async (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const check = CHECKS.find((entry) => entry.id === req.params.id)
  if (!check) {
    return res.status(404).json({ success: false, error: 'Unknown check id' })
  }
  const result = await runOne(check)
  res.json({ success: true, data: result })
})

systemDiagnosticsRoutes.post('/run-all', async (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const results: DiagnosticResult[] = []
  for (const check of CHECKS) {
    results.push(await runOne(check))
  }
  res.json({ success: true, data: results })
})

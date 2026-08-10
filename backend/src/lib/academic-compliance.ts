import { randomUUID } from 'node:crypto'
import type { Request } from 'express'
import { getCollection, runDbQuery, type FilterQuery } from '../db/postgres.js'
import type { FinancialLedgerEntry } from '../../../shared/types/index.js'

type AuthLike = Request['auth']

type AuditLogRecord = Record<string, unknown> & {
  id: string
  action: string
  actorUserId?: string | null
  actorUsername?: string | null
  entityType?: string | null
  entityId?: string | null
  details: Record<string, unknown>
  createdAt: string
}

type FinancialLedgerRecord = FinancialLedgerEntry

type GradeAuditRecord = Record<string, unknown> & {
  id: string
  enrollmentId: string
  studentId: string
  courseId: string
  actorUserId?: string | null
  actorUsername?: string | null
  beforeState: Record<string, unknown>
  afterState: Record<string, unknown>
  createdAt: string
}

let storageReady = false

function currentActor(auth?: AuthLike) {
  return {
    userId: auth?.userId ?? null,
    username: auth?.username ?? null,
    role: auth?.role ?? null,
  }
}

export async function ensureAcademicComplianceStorage() {
  if (storageReady) return

  await runDbQuery(`
    create table if not exists public.audit_logs (
      id text primary key,
      action text not null,
      actor_user_id text null,
      actor_username text null,
      entity_type text null,
      entity_id text null,
      details jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`
    create table if not exists public.financial_ledger (
      id text primary key,
      student_id text not null,
      amount numeric not null,
      entry_type text not null,
      source text not null,
      note text null,
      payment_id text null,
      enrollment_id text null,
      invoice_id text null,
      created_at timestamptz not null default now(),
      created_by_user_id text null,
      created_by_name text null,
      metadata jsonb not null default '{}'::jsonb
    )
  `)

  await runDbQuery(`
    create table if not exists public.grade_change_audit (
      id text primary key,
      enrollment_id text not null,
      student_id text not null,
      course_id text not null,
      actor_user_id text null,
      actor_username text null,
      before_state jsonb not null default '{}'::jsonb,
      after_state jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`
    alter table public.audit_logs
      add column if not exists actor_user_id text null,
      add column if not exists actor_username text null,
      add column if not exists entity_type text null,
      add column if not exists entity_id text null,
      add column if not exists details jsonb not null default '{}'::jsonb
  `)

  await runDbQuery(`
    alter table public.courses
      add column if not exists prerequisite_course_ids jsonb null,
      add column if not exists credit_hours numeric null
  `)

  await runDbQuery(`
    alter table public.enrollments
      add column if not exists updated_by_user_id text null,
      add column if not exists updated_by_name text null,
      add column if not exists updated_by_role text null
  `)

  await runDbQuery(`create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc)`)
  await runDbQuery(`create index if not exists idx_audit_logs_entity_id on public.audit_logs (entity_id)`)
  await runDbQuery(`create index if not exists idx_financial_ledger_student_id on public.financial_ledger (student_id, created_at desc)`)
  await runDbQuery(`create index if not exists idx_financial_ledger_enrollment_id on public.financial_ledger (enrollment_id)`)
  await runDbQuery(`create index if not exists idx_grade_change_audit_enrollment_id on public.grade_change_audit (enrollment_id, created_at desc)`)
  await runDbQuery(`create index if not exists idx_grade_change_audit_student_id on public.grade_change_audit (student_id, created_at desc)`)
  await runDbQuery(`create index if not exists idx_courses_schedule_gin on public.courses using gin (schedule)`)
  await runDbQuery(`create index if not exists idx_enrollments_student_semester_status on public.enrollments (student_id, semester, status)`)
  await runDbQuery(`create index if not exists idx_enrollments_course_semester_status on public.enrollments (course_id, semester, status)`)
  await runDbQuery(`
    create unique index if not exists idx_enrollments_student_course_semester_unique
      on public.enrollments (student_id, course_id, semester)
      where status not in ('cancelled', 'rejected', 'dropped')
  `)

  storageReady = true
}

async function auditLogsCollection() {
  await ensureAcademicComplianceStorage()
  return getCollection<AuditLogRecord>('audit_logs')
}

export async function financialLedgerCollection() {
  await ensureAcademicComplianceStorage()
  return getCollection<FinancialLedgerRecord>('financial_ledger')
}

export async function listAuditLogs(filter: FilterQuery = {}, limit = 500) {
  const collection = await auditLogsCollection()
  return collection.find(filter).sort({ createdAt: -1 }).limit(limit).toArray()
}

export async function writeAuditLog(input: {
  action: string
  entityType?: string | null
  entityId?: string | null
  details?: Record<string, unknown>
  auth?: AuthLike
}) {
  const actor = currentActor(input.auth)
  const collection = await auditLogsCollection()
  const entry: AuditLogRecord = {
    id: `AUD-${randomUUID().slice(0, 8).toUpperCase()}`,
    action: input.action,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    details: input.details ?? {},
    createdAt: new Date().toISOString(),
  }
  await collection.insertOne(entry)
  return entry
}

export async function appendFinancialLedgerEntry(input: {
  studentId: string
  amount: number
  entryType: 'credit' | 'debit'
  source: FinancialLedgerRecord['source']
  note?: string | null
  paymentId?: string | null
  enrollmentId?: string | null
  invoiceId?: string | null
  metadata?: Record<string, unknown>
  auth?: AuthLike
}) {
  await ensureAcademicComplianceStorage()
  const actor = currentActor(input.auth)
  const createdAt = new Date().toISOString()
  const entry: FinancialLedgerRecord = {
    id: `LED-${randomUUID().slice(0, 8).toUpperCase()}`,
    studentId: input.studentId,
    amount: Number(input.amount.toFixed(2)),
    entryType: input.entryType,
    source: input.source,
    note: input.note ?? null,
    paymentId: input.paymentId ?? null,
    enrollmentId: input.enrollmentId ?? null,
    invoiceId: input.invoiceId ?? null,
    createdAt,
    createdByUserId: actor.userId,
    createdByName: actor.username,
    metadata: input.metadata ?? {},
  }

  await runDbQuery(
    `
      insert into public.financial_ledger (
        id,
        student_id,
        amount,
        entry_type,
        source,
        note,
        payment_id,
        enrollment_id,
        invoice_id,
        created_at,
        created_by_user_id,
        created_by_name,
        metadata
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb
      )
    `,
    [
      entry.id,
      entry.studentId,
      entry.amount,
      entry.entryType,
      entry.source,
      entry.note,
      entry.paymentId,
      entry.enrollmentId,
      entry.invoiceId,
      entry.createdAt,
      entry.createdByUserId,
      entry.createdByName,
      JSON.stringify(entry.metadata ?? {}),
    ],
  )

  return entry
}

export async function recordGradeAudit(input: {
  enrollmentId: string
  studentId: string
  courseId: string
  beforeState: Record<string, unknown>
  afterState: Record<string, unknown>
  auth?: AuthLike
}) {
  await ensureAcademicComplianceStorage()
  const actor = currentActor(input.auth)
  const entry: GradeAuditRecord = {
    id: `GRA-${randomUUID().slice(0, 8).toUpperCase()}`,
    enrollmentId: input.enrollmentId,
    studentId: input.studentId,
    courseId: input.courseId,
    actorUserId: actor.userId,
    actorUsername: actor.username,
    beforeState: input.beforeState,
    afterState: input.afterState,
    createdAt: new Date().toISOString(),
  }

  await runDbQuery(
    `
      insert into public.grade_change_audit (
        id,
        enrollment_id,
        student_id,
        course_id,
        actor_user_id,
        actor_username,
        before_state,
        after_state,
        created_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9
      )
    `,
    [
      entry.id,
      entry.enrollmentId,
      entry.studentId,
      entry.courseId,
      entry.actorUserId,
      entry.actorUsername,
      JSON.stringify(entry.beforeState),
      JSON.stringify(entry.afterState),
      entry.createdAt,
    ],
  )

  return entry
}

export async function checkBalance(studentId: string, tuitionFee = 0) {
  await ensureAcademicComplianceStorage()
  const { rows } = await runDbQuery<{ balance: number | string | null }>(
    `select balance from public.students where id = $1 limit 1`,
    [studentId],
  )

  const rawBalance = rows[0]?.balance
  const balance = Number(rawBalance ?? 0)
  const outstandingBalance = Number.isFinite(balance) ? balance : 0

  return {
    studentId,
    tuitionFee: Number.isFinite(tuitionFee) ? Number(tuitionFee) : 0,
    balance: outstandingBalance,
    cleared: outstandingBalance <= 0,
  }
}

export function enrollmentActorPatch(auth?: AuthLike) {
  const actor = currentActor(auth)
  return {
    updatedByUserId: actor.userId,
    updatedByName: actor.username,
    updatedByRole: actor.role,
  }
}

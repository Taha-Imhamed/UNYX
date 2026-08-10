import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { expensesCollection, paymentsCollection, studentsCollection } from '../data/collections.js'
import { getCollection, invalidateTableCache, runDbQuery } from '../db/postgres.js'
import { requirePermission } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'
import type {
  Expense,
  FinanceInstallmentPlan,
  FinanceInvoice,
  FinanceInvoiceLineItem,
  FinanceRequest,
  FinanceRefundRequest,
  FinanceReportSummary,
  FinanceSponsorship,
  FinancialHold,
  PaymentTransaction,
  Student,
} from '../../../shared/types/index.js'
import { appendFinancialLedgerEntry, ensureAcademicComplianceStorage, financialLedgerCollection, writeAuditLog } from '../lib/academic-compliance.js'
import { sendMail } from '../lib/mailer.js'

const FINANCE_INVOICES_COLLECTION = 'finance_invoices'
const FINANCE_INSTALLMENT_PLANS_COLLECTION = 'finance_installment_plans'
const FINANCE_SPONSORSHIPS_COLLECTION = 'finance_sponsorships'
const FINANCE_REFUNDS_COLLECTION = 'finance_refund_requests'
const FINANCE_REQUESTS_COLLECTION = 'finance_requests'
const FINANCE_HOLDS_COLLECTION = 'financial_holds'

export const financeRoutes: ReturnType<typeof Router> = Router()

const invoiceLineItemSchema = z.object({
  type: z.enum(['tuition', 'semester', 'hostel', 'transport', 'late-penalty', 'refund', 'other']),
  label: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().positive().default(1),
  unitAmount: z.coerce.number().positive(),
})

const createInvoiceSchema = z.object({
  studentId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  semester: z.string().trim().optional().nullable(),
  issueDate: z.string().trim().min(1),
  dueDate: z.string().trim().min(1),
  notes: z.string().trim().optional().nullable(),
  lineItems: z.array(invoiceLineItemSchema).min(1),
})

const installmentPlanSchema = z.object({
  studentId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  totalAmount: z.coerce.number().positive(),
  installmentCount: z.coerce.number().int().positive(),
  paidAmount: z.coerce.number().min(0).default(0),
  startDate: z.string().trim().min(1),
  nextDueDate: z.string().trim().min(1),
  status: z.enum(['draft', 'active', 'completed', 'defaulted']).default('active'),
  notes: z.string().trim().optional().nullable(),
})

const sponsorshipSchema = z.object({
  studentId: z.string().trim().min(1),
  sponsorName: z.string().trim().min(1),
  sponsorType: z.enum(['family', 'company', 'scholarship', 'government', 'other']).default('other'),
  coverageType: z.enum(['fixed', 'percentage']).default('fixed'),
  coverageValue: z.coerce.number().positive(),
  appliedAmount: z.coerce.number().min(0).default(0),
  status: z.enum(['pending', 'active', 'ended']).default('active'),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})

const refundSchema = z.object({
  studentId: z.string().trim().min(1),
  invoiceId: z.string().trim().optional().nullable(),
  amount: z.coerce.number().positive(),
  reason: z.string().trim().min(1),
  notes: z.string().trim().optional().nullable(),
})

const paymentConfirmSchema = z.object({
  note: z.string().trim().optional().nullable(),
})

const financeRequestSchema = z.object({
  department: z.string().trim().optional().nullable(),
  requestType: z.enum(['purchase', 'fund']),
  title: z.string().trim().min(1),
  itemName: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  urgency: z.enum(['low', 'normal', 'high']).default('normal'),
  justification: z.string().trim().min(1),
  vendorName: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})

const financeRequestDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected', 'fulfilled']),
  financeNotes: z.string().trim().optional().nullable(),
})

const financeRequestUpdateSchema = z.object({
  department: z.string().trim().optional().nullable(),
  requestType: z.enum(['purchase', 'fund']).optional(),
  title: z.string().trim().min(1).optional(),
  itemName: z.string().trim().min(1).optional(),
  amount: z.coerce.number().positive().optional(),
  urgency: z.enum(['low', 'normal', 'high']).optional(),
  justification: z.string().trim().min(1).optional(),
  vendorName: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'fulfilled']).optional(),
  financeNotes: z.string().trim().optional().nullable(),
})

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function currentActorLabel(auth: Express.Request['auth']) {
  return auth?.username ?? auth?.userId ?? 'finance'
}

function canSubmitFinanceRequest(auth?: Express.Request['auth']) {
  return Boolean(auth && auth.role !== 'student')
}

function canManageFinanceRequests(auth?: Express.Request['auth']) {
  return Boolean(
    auth &&
      (auth.role === 'admin' ||
        auth.role === 'super-admin' ||
        auth.role === 'supervisor' ||
        auth.effectivePermissions.includes('finance:view') ||
        auth.effectivePermissions.includes('finance:manage')),
  )
}

async function ensureFinanceStorage() {
  await runDbQuery(`
    create table if not exists public.finance_invoices (
      id text primary key,
      invoice_number text not null,
      student_id text not null,
      student_name text not null,
      student_display_id text null,
      title text not null,
      semester text null,
      issue_date text not null,
      due_date text not null,
      status text not null,
      subtotal numeric not null,
      total numeric not null,
      paid_amount numeric not null default 0,
      balance_due numeric not null,
      currency text not null default 'USD',
      notes text null,
      line_items jsonb not null default '[]'::jsonb,
      created_by text null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`
    create table if not exists public.finance_installment_plans (
      id text primary key,
      student_id text not null,
      student_name text not null,
      title text not null,
      total_amount numeric not null,
      installment_count integer not null,
      amount_per_installment numeric not null,
      paid_amount numeric not null default 0,
      remaining_balance numeric not null,
      start_date text not null,
      next_due_date text not null,
      status text not null,
      notes text null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`
    create table if not exists public.finance_sponsorships (
      id text primary key,
      student_id text not null,
      student_name text not null,
      sponsor_name text not null,
      sponsor_type text not null,
      coverage_type text not null,
      coverage_value numeric not null,
      applied_amount numeric not null default 0,
      status text not null,
      start_date text not null,
      end_date text null,
      notes text null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`
    create table if not exists public.finance_refund_requests (
      id text primary key,
      student_id text not null,
      student_name text not null,
      invoice_id text null,
      invoice_number text null,
      amount numeric not null,
      reason text not null,
      requested_at timestamptz not null default now(),
      status text not null,
      approved_at timestamptz null,
      approved_by text null,
      notes text null
    )
  `)

  await runDbQuery(`
    create table if not exists public.finance_requests (
      id text primary key,
      request_number text not null,
      requester_id text not null,
      requester_name text not null,
      requester_role text not null,
      department text null,
      request_type text not null,
      title text not null,
      item_name text not null,
      amount numeric not null,
      urgency text not null,
      justification text not null,
      vendor_name text null,
      notes text null,
      status text not null,
      handled_at timestamptz null,
      handled_by text null,
      finance_notes text null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`
    alter table public.payments
      add column if not exists invoice_id text null,
      add column if not exists finance_status text null,
      add column if not exists confirmed_at timestamptz null,
      add column if not exists confirmed_by text null,
      add column if not exists confirmation_note text null
  `)

  await runDbQuery(`
    create table if not exists public.financial_holds (
      id text primary key,
      student_id text not null,
      student_name text not null,
      student_display_id text null,
      reason text not null,
      balance_at_hold numeric not null,
      status text not null default 'active',
      created_at timestamptz not null default now(),
      released_at timestamptz null,
      released_by text null
    )
  `)

  await runDbQuery(`create unique index if not exists idx_finance_invoices_invoice_number on public.finance_invoices (invoice_number)`)
  await runDbQuery(`create index if not exists idx_finance_invoices_student_id on public.finance_invoices (student_id)`)
  await runDbQuery(`create index if not exists idx_finance_invoices_status on public.finance_invoices (status)`)
  await runDbQuery(`create index if not exists idx_finance_installment_plans_student_id on public.finance_installment_plans (student_id)`)
  await runDbQuery(`create index if not exists idx_finance_sponsorships_student_id on public.finance_sponsorships (student_id)`)
  await runDbQuery(`create index if not exists idx_finance_refund_requests_student_id on public.finance_refund_requests (student_id)`)
  await runDbQuery(`create unique index if not exists idx_finance_requests_request_number on public.finance_requests (request_number)`)
  await runDbQuery(`create index if not exists idx_finance_requests_requester_id on public.finance_requests (requester_id)`)
  await runDbQuery(`create index if not exists idx_finance_requests_status on public.finance_requests (status)`)
  await runDbQuery(`create index if not exists idx_financial_holds_student_id on public.financial_holds (student_id)`)
  await runDbQuery(`create index if not exists idx_financial_holds_status on public.financial_holds (status)`)

  invalidateTableCache(FINANCE_INVOICES_COLLECTION)
  invalidateTableCache(FINANCE_INSTALLMENT_PLANS_COLLECTION)
  invalidateTableCache(FINANCE_SPONSORSHIPS_COLLECTION)
  invalidateTableCache(FINANCE_REFUNDS_COLLECTION)
  invalidateTableCache(FINANCE_REQUESTS_COLLECTION)
  invalidateTableCache(FINANCE_HOLDS_COLLECTION)
  invalidateTableCache('payments')
}

async function financeInvoicesCollection() {
  await ensureFinanceStorage()
  return getCollection<FinanceInvoice>(FINANCE_INVOICES_COLLECTION)
}

async function installmentPlansCollection() {
  await ensureFinanceStorage()
  return getCollection<FinanceInstallmentPlan>(FINANCE_INSTALLMENT_PLANS_COLLECTION)
}

async function sponsorshipsCollection() {
  await ensureFinanceStorage()
  return getCollection<FinanceSponsorship>(FINANCE_SPONSORSHIPS_COLLECTION)
}

async function refundRequestsCollection() {
  await ensureFinanceStorage()
  return getCollection<FinanceRefundRequest>(FINANCE_REFUNDS_COLLECTION)
}

async function financeRequestsCollection() {
  await ensureFinanceStorage()
  return getCollection<FinanceRequest>(FINANCE_REQUESTS_COLLECTION)
}

async function financialHoldsCollection() {
  await ensureFinanceStorage()
  return getCollection<FinancialHold>(FINANCE_HOLDS_COLLECTION)
}

function normalizeLineItems(items: z.infer<typeof invoiceLineItemSchema>[]): FinanceInvoiceLineItem[] {
  return items.map((item) => {
    const quantity = Number(item.quantity ?? 1)
    const unitAmount = Number(item.unitAmount)
    const total = Number((quantity * unitAmount).toFixed(2))

    return {
      id: buildId('INVLINE'),
      type: item.type,
      label: item.label,
      description: item.description ?? null,
      quantity,
      unitAmount,
      total,
    }
  })
}

function computeInvoiceStatus(invoice: FinanceInvoice, transactions: PaymentTransaction[]) {
  const applied = transactions
    .filter((payment) => payment.invoiceId === invoice.id)
    .filter((payment) => payment.type === 'credit')
    .filter((payment) => payment.financeStatus !== 'rejected' && payment.financeStatus !== 'pending')
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)

  const paidAmount = Number(applied.toFixed(2))
  const balanceDue = Math.max(0, Number((invoice.total - paidAmount).toFixed(2)))

  let status: FinanceInvoice['status'] = invoice.status
  if (invoice.status !== 'cancelled' && invoice.status !== 'draft') {
    status = balanceDue <= 0 ? 'paid' : paidAmount > 0 ? 'partially-paid' : 'open'
  }

  return {
    ...invoice,
    paidAmount,
    balanceDue,
    status,
  }
}

async function getStudentOr404(studentId: string) {
  const studentsCol = await studentsCollection()
  const student = await studentsCol.findOne<Student>({ id: studentId })
  return { student }
}

async function createChargeTransaction(options: {
  student: Student
  amount: number
  note: string
  invoiceId: string
}) {
  const { student, amount, note, invoiceId } = options
  const studentsCol = await studentsCollection()
  const paymentsCol = await paymentsCollection()
  const current = Number(student.balance ?? 0)
  const nextBalance = Number((current + amount).toFixed(2))
  const createdAt = new Date().toISOString()
  const transactionId = buildId('TXN')

  const transaction: PaymentTransaction = {
    id: transactionId,
    displayId: transactionId,
    studentId: student.id,
    amount: Number(amount.toFixed(2)),
    method: 'internal',
    note,
    createdAt,
    type: 'debit',
    source: 'adjustment',
    referenceId: invoiceId,
    invoiceId,
    balanceAfter: nextBalance,
    financeStatus: 'confirmed',
    confirmedAt: createdAt,
    confirmedBy: 'system',
    confirmationNote: 'Invoice charge posted',
  }

  await paymentsCol.insertOne(transaction)
  await studentsCol.updateOne({ id: student.id }, { $set: { balance: nextBalance } })
  await ensureAcademicComplianceStorage()
  await appendFinancialLedgerEntry({
    studentId: student.id,
    amount: transaction.amount,
    entryType: 'debit',
    source: 'invoice',
    note,
    paymentId: transaction.id,
    invoiceId,
    metadata: {
      balanceAfter: nextBalance,
      referenceId: invoiceId,
    },
  })
}

financeRoutes.get('/invoices', requirePermission('finance:view', 'VIEW_FINANCIALS'), async (req, res) => {
  try {
    const query = typeof req.query.query === 'string' ? req.query.query.trim().toLowerCase() : ''
    const invoicesCol = await financeInvoicesCollection()
    const paymentsCol = await paymentsCollection()
    const [invoices, payments] = await Promise.all([invoicesCol.find().sort({ createdAt: -1 }).toArray(), paymentsCol.find().toArray()])

    const hydrated = invoices.map((invoice) => computeInvoiceStatus(invoice, payments))
    const filtered = !query
      ? hydrated
      : hydrated.filter((invoice) =>
          [invoice.id, invoice.invoiceNumber, invoice.title, invoice.studentName, invoice.studentDisplayId]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query)),
        )

    res.json({ success: true, data: filtered })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch finance invoices')
    res.status(500).json({ success: false, error: 'Failed to fetch finance invoices' })
  }
})

financeRoutes.post('/invoices', requirePermission('finance:manage'), async (req, res) => {
  try {
    const parsed = createInvoiceSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid invoice payload' })
    }

    const { student } = await getStudentOr404(parsed.data.studentId)
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const lineItems = normalizeLineItems(parsed.data.lineItems)
    const subtotal = Number(lineItems.reduce((sum, item) => sum + item.total, 0).toFixed(2))
    const total = subtotal
    const now = new Date().toISOString()
    const invoice: FinanceInvoice = {
      id: buildId('FININV'),
      invoiceNumber: buildId('INV'),
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentDisplayId: student.displayId ?? null,
      title: parsed.data.title,
      semester: parsed.data.semester ?? null,
      issueDate: parsed.data.issueDate,
      dueDate: parsed.data.dueDate,
      status: 'open',
      subtotal,
      total,
      paidAmount: 0,
      balanceDue: total,
      currency: 'USD',
      notes: parsed.data.notes ?? null,
      lineItems,
      createdBy: currentActorLabel(req.auth),
      createdAt: now,
      updatedAt: now,
    }

    const invoicesCol = await financeInvoicesCollection()
    await invoicesCol.insertOne(invoice)
    await createChargeTransaction({
      student: { ...student, balance: student.balance ?? 0 },
      amount: total,
      note: `Invoice ${invoice.invoiceNumber}: ${invoice.title}`,
      invoiceId: invoice.id,
    })
    await writeAuditLog({
      action: 'finance_invoice_created',
      entityType: 'finance_invoice',
      entityId: invoice.id,
      details: { studentId: student.id, total: invoice.total },
      auth: req.auth,
    })

    res.status(201).json({ success: true, data: invoice })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create invoice')
    res.status(500).json({ success: false, error: 'Failed to create invoice' })
  }
})

financeRoutes.get('/installment-plans', requirePermission('finance:view', 'VIEW_FINANCIALS'), async (_req, res) => {
  try {
    const collection = await installmentPlansCollection()
    const items = await collection.find().sort({ updatedAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch installment plans')
    res.status(500).json({ success: false, error: 'Failed to fetch installment plans' })
  }
})

financeRoutes.post('/installment-plans', requirePermission('finance:manage'), async (req, res) => {
  try {
    const parsed = installmentPlanSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid installment plan payload' })
    }

    const { student } = await getStudentOr404(parsed.data.studentId)
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const now = new Date().toISOString()
    const totalAmount = Number(parsed.data.totalAmount.toFixed(2))
    const paidAmount = Number(parsed.data.paidAmount.toFixed(2))
    const installmentCount = parsed.data.installmentCount
    const amountPerInstallment = Number((totalAmount / installmentCount).toFixed(2))
    const remainingBalance = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)))

    const plan: FinanceInstallmentPlan = {
      id: buildId('PLAN'),
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      title: parsed.data.title,
      totalAmount,
      installmentCount,
      amountPerInstallment,
      paidAmount,
      remainingBalance,
      startDate: parsed.data.startDate,
      nextDueDate: parsed.data.nextDueDate,
      status: remainingBalance <= 0 ? 'completed' : parsed.data.status,
      notes: parsed.data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    }

    const collection = await installmentPlansCollection()
    await collection.insertOne(plan)
    await writeAuditLog({
      action: 'finance_installment_plan_created',
      entityType: 'finance_installment_plan',
      entityId: plan.id,
      details: { studentId: student.id, totalAmount: plan.totalAmount },
      auth: req.auth,
    })
    res.status(201).json({ success: true, data: plan })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create installment plan')
    res.status(500).json({ success: false, error: 'Failed to create installment plan' })
  }
})

const studentPlanRequestSchema = z.object({
  totalAmount: z.coerce.number().positive(),
  installmentCount: z.coerce.number().int().min(2).max(12),
  notes: z.string().trim().optional().nullable(),
})

// Student self-service: view own installment plans, and request a new one. A request
// lands as status "draft" — an existing, real status in the model meaning "not yet
// active" — so finance staff review and activate it from the admin installment-plans
// page, same as any other plan. No separate request resource needed.
financeRoutes.get('/installment-plans/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await installmentPlansCollection()
    const items = await collection.find({ studentId }).sort({ updatedAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch student installment plans')
    res.status(500).json({ success: false, error: 'Failed to fetch installment plans' })
  }
})

financeRoutes.post('/installment-plans/request', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const parsed = studentPlanRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payment plan request' })
    }

    const { student } = await getStudentOr404(studentId)
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const now = new Date().toISOString()
    const totalAmount = Number(parsed.data.totalAmount.toFixed(2))
    const installmentCount = parsed.data.installmentCount
    const amountPerInstallment = Number((totalAmount / installmentCount).toFixed(2))
    const nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const plan: FinanceInstallmentPlan = {
      id: buildId('PLAN'),
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      title: `Payment plan requested by ${student.firstName} ${student.lastName}`,
      totalAmount,
      installmentCount,
      amountPerInstallment,
      paidAmount: 0,
      remainingBalance: totalAmount,
      startDate: now,
      nextDueDate,
      status: 'draft',
      notes: parsed.data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    }

    const collection = await installmentPlansCollection()
    await collection.insertOne(plan)
    await writeAuditLog({
      action: 'finance_installment_plan_requested',
      entityType: 'finance_installment_plan',
      entityId: plan.id,
      details: { studentId: student.id, totalAmount },
      auth: req.auth,
    })
    res.status(201).json({ success: true, data: plan })
  } catch (error) {
    logger.error({ err: error }, 'Failed to submit payment plan request')
    res.status(500).json({ success: false, error: 'Failed to submit payment plan request' })
  }
})

financeRoutes.get('/sponsorships/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await sponsorshipsCollection()
    const items = await collection.find({ studentId }).sort({ updatedAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch student sponsorships')
    res.status(500).json({ success: false, error: 'Failed to fetch sponsorships' })
  }
})

financeRoutes.get('/sponsorships', requirePermission('finance:view', 'VIEW_FINANCIALS'), async (_req, res) => {
  try {
    const collection = await sponsorshipsCollection()
    const items = await collection.find().sort({ updatedAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch sponsorships')
    res.status(500).json({ success: false, error: 'Failed to fetch sponsorships' })
  }
})

financeRoutes.post('/sponsorships', requirePermission('finance:manage'), async (req, res) => {
  try {
    const parsed = sponsorshipSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid sponsorship payload' })
    }

    const { student } = await getStudentOr404(parsed.data.studentId)
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const now = new Date().toISOString()
    const sponsorship: FinanceSponsorship = {
      id: buildId('SPON'),
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      sponsorName: parsed.data.sponsorName,
      sponsorType: parsed.data.sponsorType,
      coverageType: parsed.data.coverageType,
      coverageValue: Number(parsed.data.coverageValue.toFixed(2)),
      appliedAmount: Number(parsed.data.appliedAmount.toFixed(2)),
      status: parsed.data.status,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate ?? null,
      notes: parsed.data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    }

    const collection = await sponsorshipsCollection()
    await collection.insertOne(sponsorship)
    await writeAuditLog({
      action: 'finance_sponsorship_created',
      entityType: 'finance_sponsorship',
      entityId: sponsorship.id,
      details: { studentId: student.id, sponsorName: sponsorship.sponsorName, appliedAmount: sponsorship.appliedAmount },
      auth: req.auth,
    })
    res.status(201).json({ success: true, data: sponsorship })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create sponsorship')
    res.status(500).json({ success: false, error: 'Failed to create sponsorship' })
  }
})

financeRoutes.get('/refunds', requirePermission('finance:view', 'VIEW_FINANCIALS'), async (_req, res) => {
  try {
    const collection = await refundRequestsCollection()
    const items = await collection.find().sort({ requestedAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch refunds')
    res.status(500).json({ success: false, error: 'Failed to fetch refunds' })
  }
})

financeRoutes.post('/refunds', requirePermission('finance:manage'), async (req, res) => {
  try {
    const parsed = refundSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid refund payload' })
    }

    const { student } = await getStudentOr404(parsed.data.studentId)
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    let invoice: FinanceInvoice | null = null
    if (parsed.data.invoiceId) {
      const invoicesCol = await financeInvoicesCollection()
      invoice = await invoicesCol.findOne({ id: parsed.data.invoiceId })
    }

    const request: FinanceRefundRequest = {
      id: buildId('RFND'),
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      invoiceId: parsed.data.invoiceId ?? null,
      invoiceNumber: invoice?.invoiceNumber ?? null,
      amount: Number(parsed.data.amount.toFixed(2)),
      reason: parsed.data.reason,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      approvedAt: null,
      approvedBy: null,
      notes: parsed.data.notes ?? null,
    }

    const collection = await refundRequestsCollection()
    await collection.insertOne(request)
    await writeAuditLog({
      action: 'finance_refund_requested',
      entityType: 'finance_refund',
      entityId: request.id,
      details: { studentId: student.id, amount: request.amount },
      auth: req.auth,
    })
    res.status(201).json({ success: true, data: request })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create refund request')
    res.status(500).json({ success: false, error: 'Failed to create refund request' })
  }
})

financeRoutes.post('/refunds/:id/approve', requirePermission('finance:approve'), async (req, res) => {
  try {
    const collection = await refundRequestsCollection()
    const request = await collection.findOne({ id: req.params.id })
    if (!request) {
      return res.status(404).json({ success: false, error: 'Refund request not found' })
    }

    if (request.status === 'approved') {
      return res.json({ success: true, data: request })
    }

    const approvedAt = new Date().toISOString()
    const approvedBy = currentActorLabel(req.auth)
    const updates: Partial<FinanceRefundRequest> = {
      status: 'approved',
      approvedAt,
      approvedBy,
      notes: typeof req.body?.notes === 'string' && req.body.notes.trim() ? req.body.notes.trim() : request.notes ?? null,
    }

    await collection.updateOne({ id: request.id }, { $set: updates })

    const expensesCol = await expensesCollection()
    const refundExpense: Expense = {
      id: buildId('EXP'),
      category: 'Refunds',
      description: `Approved refund for ${request.studentName}${request.invoiceNumber ? ` (${request.invoiceNumber})` : ''}`,
      amount: Number(request.amount.toFixed(2)),
      date: approvedAt.slice(0, 10),
      approvedBy,
      status: 'approved',
    }
    await expensesCol.insertOne(refundExpense)
    await writeAuditLog({
      action: 'finance_refund_approved',
      entityType: 'finance_refund',
      entityId: request.id,
      details: { studentId: request.studentId, amount: request.amount },
      auth: req.auth,
    })

    res.json({ success: true, data: { ...request, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to approve refund request')
    res.status(500).json({ success: false, error: 'Failed to approve refund request' })
  }
})

financeRoutes.post('/payments/:id/confirm', requirePermission('finance:approve'), async (req, res) => {
  try {
    const parsed = paymentConfirmSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid confirmation payload' })
    }

    const paymentsCol = await paymentsCollection()
    const payment = await paymentsCol.findOne<PaymentTransaction>({ id: req.params.id })
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' })
    }

    const confirmedAt = new Date().toISOString()
    const updates: Partial<PaymentTransaction> = {
      financeStatus: 'confirmed',
      confirmedAt,
      confirmedBy: currentActorLabel(req.auth),
      confirmationNote: parsed.data.note ?? null,
    }

    await paymentsCol.updateOne({ id: payment.id }, { $set: updates })
    await writeAuditLog({
      action: 'finance_payment_confirmed',
      entityType: 'payment',
      entityId: payment.id,
      details: { studentId: payment.studentId, amount: payment.amount },
      auth: req.auth,
    })

    const payingStudent = await (await studentsCollection()).findOne({ id: payment.studentId })
    if (payingStudent?.email) {
      void sendMail({
        to: payingStudent.email,
        subject: 'Payment confirmed',
        text: `Your payment of $${payment.amount} has been confirmed.`,
      })
    }

    res.json({ success: true, data: { ...payment, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to confirm payment')
    res.status(500).json({ success: false, error: 'Failed to confirm payment' })
  }
})

financeRoutes.get('/unpaid-balances', requirePermission('finance:view', 'VIEW_FINANCIALS'), async (_req, res) => {
  try {
    const [studentsCol, invoicesCol, paymentsCol] = await Promise.all([
      studentsCollection(),
      financeInvoicesCollection(),
      paymentsCollection(),
    ])
    const [students, invoices, payments] = await Promise.all([
      studentsCol.find().toArray(),
      invoicesCol.find().toArray(),
      paymentsCol.find().toArray(),
    ])

    const hydratedInvoices = invoices.map((invoice) => computeInvoiceStatus(invoice, payments))
    const openInvoicesByStudent = new Map<string, FinanceInvoice[]>()
    hydratedInvoices
      .filter((invoice) => invoice.balanceDue > 0)
      .forEach((invoice) => {
        openInvoicesByStudent.set(invoice.studentId, [...(openInvoicesByStudent.get(invoice.studentId) ?? []), invoice])
      })

    const data = students
      .filter((student) => Number(student.balance ?? 0) > 0)
      .map((student) => ({
        studentId: student.id,
        studentDisplayId: student.displayId,
        studentName: `${student.firstName} ${student.lastName}`,
        balance: Number(student.balance ?? 0),
        openInvoices: openInvoicesByStudent.get(student.id) ?? [],
      }))
      .sort((left, right) => right.balance - left.balance)

    res.json({ success: true, data })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch unpaid balances')
    res.status(500).json({ success: false, error: 'Failed to fetch unpaid balances' })
  }
})

financeRoutes.get('/reports/summary', requirePermission('reports:view'), async (_req, res) => {
  try {
    const [studentsCol, invoicesCol, refundsCol, plansCol, sponsorshipsCol, paymentsCol, expensesCol] = await Promise.all([
      studentsCollection(),
      financeInvoicesCollection(),
      refundRequestsCollection(),
      installmentPlansCollection(),
      sponsorshipsCollection(),
      paymentsCollection(),
      expensesCollection(),
    ])

    const [students, invoices, refunds, plans, sponsorships, payments, expenses] = await Promise.all([
      studentsCol.find().toArray(),
      invoicesCol.find().toArray(),
      refundsCol.find().toArray(),
      plansCol.find().toArray(),
      sponsorshipsCol.find().toArray(),
      paymentsCol.find().toArray(),
      expensesCol.find().toArray(),
    ])

    const hydratedInvoices = invoices.map((invoice) => computeInvoiceStatus(invoice, payments))
    const totalRevenue = Number(hydratedInvoices.reduce((sum, invoice) => sum + invoice.total, 0).toFixed(2))
    const totalCollectedPayments = Number(
      payments
        .filter((payment) => payment.type === 'credit')
        .filter((payment) => payment.financeStatus !== 'rejected' && payment.financeStatus !== 'pending')
        .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
        .toFixed(2),
    )
    const totalPendingBalances = Number(students.reduce((sum, student) => sum + Math.max(0, Number(student.balance ?? 0)), 0).toFixed(2))
    const totalExpenses = Number(expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0).toFixed(2))

    const summary: FinanceReportSummary = {
      totalRevenue,
      totalCollectedPayments,
      totalPendingBalances,
      totalExpenses,
      netRevenue: Number((totalCollectedPayments - totalExpenses).toFixed(2)),
      unpaidStudentCount: students.filter((student) => Number(student.balance ?? 0) > 0).length,
      openInvoiceCount: hydratedInvoices.filter((invoice) => invoice.balanceDue > 0).length,
      pendingRefundCount: refunds.filter((request) => request.status === 'pending').length,
      activeInstallmentPlanCount: plans.filter((plan) => plan.status === 'active').length,
      activeSponsorshipCount: sponsorships.filter((sponsorship) => sponsorship.status === 'active').length,
    }

    res.json({
      success: true,
      data: {
        summary,
        recentInvoices: hydratedInvoices.slice(0, 10),
        recentRefunds: refunds.slice(0, 10),
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch finance report summary')
    res.status(500).json({ success: false, error: 'Failed to fetch finance report summary' })
  }
})

financeRoutes.get('/requests', async (req, res) => {
  try {
    const auth = req.auth
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    const collection = await financeRequestsCollection()
    const all = await collection.find().sort({ createdAt: -1 }).toArray()
    const canReviewAll =
      auth.role === 'admin' ||
      auth.role === 'super-admin' ||
      auth.role === 'supervisor' ||
      auth.effectivePermissions.includes('finance:view') ||
      auth.effectivePermissions.includes('finance:manage')
    const filtered = canReviewAll ? all : all.filter((item) => item.requesterId === auth.userId)
    res.json({ success: true, data: filtered })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch finance requests')
    res.status(500).json({ success: false, error: 'Failed to fetch finance requests' })
  }
})

financeRoutes.post('/requests', async (req, res) => {
  try {
    if (!canSubmitFinanceRequest(req.auth)) {
      return res.status(403).json({ success: false, error: 'Only staff can submit finance requests' })
    }

    const parsed = financeRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request payload' })
    }

    const now = new Date().toISOString()
    const request: FinanceRequest = {
      id: buildId('FREQ'),
      requestNumber: buildId('REQ'),
      requesterId: req.auth?.userId ?? 'unknown',
      requesterName: req.auth?.username ?? 'Staff member',
      requesterRole: req.auth?.role ?? 'user',
      department: parsed.data.department ?? null,
      requestType: parsed.data.requestType,
      title: parsed.data.title,
      itemName: parsed.data.itemName,
      amount: Number(parsed.data.amount.toFixed(2)),
      urgency: parsed.data.urgency,
      justification: parsed.data.justification,
      vendorName: parsed.data.vendorName ?? null,
      notes: parsed.data.notes ?? null,
      status: 'pending',
      handledAt: null,
      handledBy: null,
      financeNotes: null,
      createdAt: now,
      updatedAt: now,
    }

    const collection = await financeRequestsCollection()
    await collection.insertOne(request)
    await writeAuditLog({
      action: 'finance_request_created',
      entityType: 'finance_request',
      entityId: request.id,
      details: { amount: request.amount, requestType: request.requestType },
      auth: req.auth,
    })
    res.status(201).json({ success: true, data: request })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create finance request')
    res.status(500).json({ success: false, error: 'Failed to create finance request' })
  }
})

financeRoutes.post('/requests/:id/handle', requirePermission('finance:approve'), async (req, res) => {
  try {
    const parsed = financeRequestDecisionSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request decision payload' })
    }

    const collection = await financeRequestsCollection()
    const request = await collection.findOne({ id: req.params.id })
    if (!request) {
      return res.status(404).json({ success: false, error: 'Finance request not found' })
    }

    const updates: Partial<FinanceRequest> = {
      status: parsed.data.status,
      financeNotes: parsed.data.financeNotes ?? null,
      handledAt: new Date().toISOString(),
      handledBy: currentActorLabel(req.auth),
      updatedAt: new Date().toISOString(),
    }

    await collection.updateOne({ id: request.id }, { $set: updates })
    await writeAuditLog({
      action: 'finance_request_handled',
      entityType: 'finance_request',
      entityId: request.id,
      details: { status: updates.status, amount: request.amount },
      auth: req.auth,
    })
    res.json({ success: true, data: { ...request, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to handle finance request')
    res.status(500).json({ success: false, error: 'Failed to handle finance request' })
  }
})

financeRoutes.put('/requests/:id', async (req, res) => {
  try {
    if (!canManageFinanceRequests(req.auth)) {
      return res.status(403).json({ success: false, error: 'Finance request editing is restricted to reviewers' })
    }

    const parsed = financeRequestUpdateSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid finance request payload' })
    }

    const collection = await financeRequestsCollection()
    const request = await collection.findOne({ id: req.params.id })
    if (!request) {
      return res.status(404).json({ success: false, error: 'Finance request not found' })
    }

    const updates: Partial<FinanceRequest> = {
      updatedAt: new Date().toISOString(),
    }

    if (parsed.data.department !== undefined) updates.department = parsed.data.department ?? null
    if (parsed.data.requestType !== undefined) updates.requestType = parsed.data.requestType
    if (parsed.data.title !== undefined) updates.title = parsed.data.title
    if (parsed.data.itemName !== undefined) updates.itemName = parsed.data.itemName
    if (parsed.data.amount !== undefined) updates.amount = Number(parsed.data.amount.toFixed(2))
    if (parsed.data.urgency !== undefined) updates.urgency = parsed.data.urgency
    if (parsed.data.justification !== undefined) updates.justification = parsed.data.justification
    if (parsed.data.vendorName !== undefined) updates.vendorName = parsed.data.vendorName ?? null
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes ?? null
    if (parsed.data.status !== undefined) updates.status = parsed.data.status
    if (parsed.data.financeNotes !== undefined) updates.financeNotes = parsed.data.financeNotes ?? null
    if (parsed.data.status !== undefined) {
      updates.handledAt = new Date().toISOString()
      updates.handledBy = currentActorLabel(req.auth)
    }

    await collection.updateOne({ id: request.id }, { $set: updates })
    await writeAuditLog({
      action: 'finance_request_updated',
      entityType: 'finance_request',
      entityId: request.id,
      details: { updatedFields: Object.keys(updates) },
      auth: req.auth,
    })
    res.json({ success: true, data: { ...request, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update finance request')
    res.status(500).json({ success: false, error: 'Failed to update finance request' })
  }
})

financeRoutes.delete('/requests/:id', async (req, res) => {
  try {
    if (!canManageFinanceRequests(req.auth)) {
      return res.status(403).json({ success: false, error: 'Finance request deletion is restricted to reviewers' })
    }

    const collection = await financeRequestsCollection()
    const request = await collection.findOne({ id: req.params.id })
    if (!request) {
      return res.status(404).json({ success: false, error: 'Finance request not found' })
    }

    await collection.deleteOne({ id: request.id })
    await writeAuditLog({
      action: 'finance_request_deleted',
      entityType: 'finance_request',
      entityId: request.id,
      details: { amount: request.amount },
      auth: req.auth,
    })
    res.json({ success: true, data: request })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete finance request')
    res.status(500).json({ success: false, error: 'Failed to delete finance request' })
  }
})

// --- Ledger view ------------------------------------------------------------
// Ledger entries are written by createChargeTransaction/enrollment/payment handlers
// elsewhere via appendFinancialLedgerEntry, but until now nothing read them back.
financeRoutes.get('/ledger', requirePermission('finance:view', 'VIEW_FINANCIALS'), async (req, res) => {
  try {
    const studentId = typeof req.query.studentId === 'string' ? req.query.studentId.trim() : ''
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200))
    const collection = await financialLedgerCollection()
    const filter: Record<string, string> = studentId ? { studentId } : {}
    const items = await collection.find(filter).sort({ createdAt: -1 }).limit(limit).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch financial ledger')
    res.status(500).json({ success: false, error: 'Failed to fetch financial ledger' })
  }
})

// --- Payment method reconciliation -------------------------------------------
financeRoutes.get('/reconciliation', requirePermission('finance:view', 'VIEW_FINANCIALS'), async (req, res) => {
  try {
    const paymentsCol = await paymentsCollection()
    const payments = await paymentsCol.find().toArray()

    const confirmed = payments.filter(
      (payment) => payment.type === 'credit' && payment.financeStatus !== 'rejected' && payment.financeStatus !== 'pending',
    )

    const byMethod = new Map<string, { method: string; count: number; total: number }>()
    for (const payment of confirmed) {
      const method = String(payment.method ?? 'unknown')
      const bucket = byMethod.get(method) ?? { method, count: 0, total: 0 }
      bucket.count += 1
      bucket.total = Number((bucket.total + Number(payment.amount ?? 0)).toFixed(2))
      byMethod.set(method, bucket)
    }

    const pendingCount = payments.filter((payment) => payment.financeStatus === 'pending').length
    const rejectedCount = payments.filter((payment) => payment.financeStatus === 'rejected').length

    res.json({
      success: true,
      data: {
        byMethod: Array.from(byMethod.values()).sort((a, b) => b.total - a.total),
        pendingCount,
        rejectedCount,
        totalConfirmed: Number(confirmed.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0).toFixed(2)),
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to compute payment reconciliation')
    res.status(500).json({ success: false, error: 'Failed to compute payment reconciliation' })
  }
})

// --- Outstanding balance report ----------------------------------------------
// Extends the existing /unpaid-balances data with aging buckets (days past due,
// keyed off the oldest open invoice per student) for a report-style view.
financeRoutes.get('/outstanding-balance-report', requirePermission('finance:view', 'VIEW_FINANCIALS'), async (_req, res) => {
  try {
    const [studentsCol, invoicesCol, paymentsCol] = await Promise.all([
      studentsCollection(),
      financeInvoicesCollection(),
      paymentsCollection(),
    ])
    const [students, invoices, payments] = await Promise.all([
      studentsCol.find().toArray(),
      invoicesCol.find().toArray(),
      paymentsCol.find().toArray(),
    ])

    const hydratedInvoices = invoices.map((invoice) => computeInvoiceStatus(invoice, payments))
    const openInvoicesByStudent = new Map<string, FinanceInvoice[]>()
    hydratedInvoices
      .filter((invoice) => invoice.balanceDue > 0)
      .forEach((invoice) => {
        openInvoicesByStudent.set(invoice.studentId, [...(openInvoicesByStudent.get(invoice.studentId) ?? []), invoice])
      })

    const now = Date.now()
    const rows = students
      .filter((student) => Number(student.balance ?? 0) > 0)
      .map((student) => {
        const openInvoices = openInvoicesByStudent.get(student.id) ?? []
        const oldestDueDate = openInvoices
          .map((invoice) => new Date(invoice.dueDate).getTime())
          .filter((time) => Number.isFinite(time))
          .sort((a, b) => a - b)[0]
        const daysPastDue = oldestDueDate ? Math.max(0, Math.floor((now - oldestDueDate) / (24 * 60 * 60 * 1000))) : 0
        const bucket = daysPastDue === 0 ? 'current' : daysPastDue <= 30 ? '1-30' : daysPastDue <= 60 ? '31-60' : daysPastDue <= 90 ? '61-90' : '90+'

        return {
          studentId: student.id,
          studentDisplayId: student.displayId,
          studentName: `${student.firstName} ${student.lastName}`,
          department: student.faculty ?? student.program ?? null,
          balance: Number(student.balance ?? 0),
          openInvoiceCount: openInvoices.length,
          daysPastDue,
          agingBucket: bucket,
        }
      })
      .sort((left, right) => right.balance - left.balance)

    const byDepartment = new Map<string, { department: string; studentCount: number; totalBalance: number }>()
    for (const row of rows) {
      const key = row.department ?? 'Unassigned'
      const bucket = byDepartment.get(key) ?? { department: key, studentCount: 0, totalBalance: 0 }
      bucket.studentCount += 1
      bucket.totalBalance = Number((bucket.totalBalance + row.balance).toFixed(2))
      byDepartment.set(key, bucket)
    }

    res.json({
      success: true,
      data: {
        byStudent: rows,
        byDepartment: Array.from(byDepartment.values()).sort((a, b) => b.totalBalance - a.totalBalance),
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to build outstanding balance report')
    res.status(500).json({ success: false, error: 'Failed to build outstanding balance report' })
  }
})

// --- Automated late-fee assessment --------------------------------------------
// No cron/scheduler exists in this codebase; late-fee assessment is an
// admin-triggered job rather than an in-process scheduled task, consistent with
// how other batch operations (semester rollover, bulk imports) work here.
const LATE_FEE_PERCENT = 0.05 // 5% of the overdue invoice balance
const LATE_FEE_GRACE_DAYS = 7

financeRoutes.post('/jobs/assess-late-fees', requirePermission('finance:manage'), async (req, res) => {
  try {
    const [invoicesCol, paymentsCol, studentsCol] = await Promise.all([
      financeInvoicesCollection(),
      paymentsCollection(),
      studentsCollection(),
    ])
    const [invoices, payments] = await Promise.all([invoicesCol.find().toArray(), paymentsCol.find().toArray()])
    const hydrated = invoices.map((invoice) => computeInvoiceStatus(invoice, payments))

    const now = Date.now()
    const graceMs = LATE_FEE_GRACE_DAYS * 24 * 60 * 60 * 1000
    const overdue = hydrated.filter((invoice) => {
      if (invoice.balanceDue <= 0 || invoice.status === 'cancelled' || invoice.status === 'draft') return false
      const dueTime = new Date(invoice.dueDate).getTime()
      if (!Number.isFinite(dueTime)) return false
      return now - dueTime > graceMs
    })

    // Skip invoices that already have a late-penalty line item, so re-running
    // this job doesn't double-charge the same overdue invoice.
    const alreadyAssessed = new Set(
      invoices.filter((invoice) => invoice.lineItems.some((item) => item.type === 'late-penalty')).map((invoice) => invoice.id),
    )

    const assessed: { invoiceId: string; studentId: string; feeAmount: number }[] = []
    for (const invoice of overdue) {
      if (alreadyAssessed.has(invoice.id)) continue
      const student = await studentsCol.findOne({ id: invoice.studentId })
      if (!student) continue

      const feeAmount = Number((invoice.balanceDue * LATE_FEE_PERCENT).toFixed(2))
      if (feeAmount <= 0) continue

      const feeLineItem: FinanceInvoiceLineItem = {
        id: buildId('INVLINE'),
        type: 'late-penalty',
        label: 'Late payment fee',
        description: `${LATE_FEE_PERCENT * 100}% late fee, assessed ${new Date().toISOString().slice(0, 10)}`,
        quantity: 1,
        unitAmount: feeAmount,
        total: feeAmount,
      }
      const updatedLineItems = [...invoice.lineItems, feeLineItem]
      const newSubtotal = Number((invoice.subtotal + feeAmount).toFixed(2))
      const newTotal = Number((invoice.total + feeAmount).toFixed(2))

      await invoicesCol.updateOne(
        { id: invoice.id },
        { $set: { lineItems: updatedLineItems, subtotal: newSubtotal, total: newTotal, updatedAt: new Date().toISOString() } },
      )
      await createChargeTransaction({
        student: { ...student, balance: student.balance ?? 0 },
        amount: feeAmount,
        note: `Late fee on invoice ${invoice.invoiceNumber}`,
        invoiceId: invoice.id,
      })
      assessed.push({ invoiceId: invoice.id, studentId: invoice.studentId, feeAmount })
    }

    await writeAuditLog({
      action: 'finance_late_fees_assessed',
      entityType: 'finance_invoice',
      entityId: null,
      details: { assessedCount: assessed.length, invoiceIds: assessed.map((a) => a.invoiceId) },
      auth: req.auth,
    })

    res.json({ success: true, data: { assessedCount: assessed.length, assessed } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to assess late fees')
    res.status(500).json({ success: false, error: 'Failed to assess late fees' })
  }
})

// --- Financial hold auto-trigger ----------------------------------------------
// checkBalance() (academic-compliance.ts) already blocks enrollment approval for
// any student with balance > 0 — that enforcement is untouched. This adds a
// persistent, visible hold record so staff can see/manage who is held and why,
// instead of the block being purely implicit in a live balance query.
financeRoutes.get('/holds', requirePermission('finance:view', 'VIEW_FINANCIALS'), async (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'active'
    const collection = await financialHoldsCollection()
    const filter: Record<string, string> = status === 'all' ? {} : { status }
    const items = await collection.find(filter).sort({ createdAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch financial holds')
    res.status(500).json({ success: false, error: 'Failed to fetch financial holds' })
  }
})

financeRoutes.post('/holds/sync', requirePermission('finance:manage'), async (req, res) => {
  try {
    const [studentsCol, holdsCol] = await Promise.all([studentsCollection(), financialHoldsCollection()])
    const [students, existingHolds] = await Promise.all([studentsCol.find().toArray(), holdsCol.find({ status: 'active' }).toArray()])

    const activeHoldByStudent = new Map(existingHolds.map((hold) => [hold.studentId, hold]))
    const now = new Date().toISOString()

    let created = 0
    let released = 0

    for (const student of students) {
      const balance = Number(student.balance ?? 0)
      const existingHold = activeHoldByStudent.get(student.id)

      if (balance > 0 && !existingHold) {
        const hold: FinancialHold = {
          id: buildId('HOLD'),
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          studentDisplayId: student.displayId ?? null,
          reason: 'Outstanding balance',
          balanceAtHold: balance,
          status: 'active',
          createdAt: now,
        }
        await holdsCol.insertOne(hold)
        created += 1
      } else if (balance <= 0 && existingHold) {
        await holdsCol.updateOne(
          { id: existingHold.id },
          { $set: { status: 'released', releasedAt: now, releasedBy: currentActorLabel(req.auth) } },
        )
        released += 1
      }
    }

    await writeAuditLog({
      action: 'finance_holds_synced',
      entityType: 'financial_hold',
      entityId: null,
      details: { created, released },
      auth: req.auth,
    })

    res.json({ success: true, data: { created, released } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to sync financial holds')
    res.status(500).json({ success: false, error: 'Failed to sync financial holds' })
  }
})

financeRoutes.post('/holds/:id/release', requirePermission('finance:manage'), async (req, res) => {
  try {
    const collection = await financialHoldsCollection()
    const hold = await collection.findOne({ id: req.params.id })
    if (!hold) {
      return res.status(404).json({ success: false, error: 'Financial hold not found' })
    }
    const now = new Date().toISOString()
    await collection.updateOne({ id: hold.id }, { $set: { status: 'released', releasedAt: now, releasedBy: currentActorLabel(req.auth) } })
    await writeAuditLog({
      action: 'finance_hold_released',
      entityType: 'financial_hold',
      entityId: hold.id,
      details: { studentId: hold.studentId },
      auth: req.auth,
    })
    res.json({ success: true, data: { ...hold, status: 'released', releasedAt: now, releasedBy: currentActorLabel(req.auth) } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to release financial hold')
    res.status(500).json({ success: false, error: 'Failed to release financial hold' })
  }
})

// --- Net income dashboard trend chart ------------------------------------------
financeRoutes.get('/net-income-trend', requirePermission('reports:view'), async (req, res) => {
  try {
    const months = Math.min(24, Math.max(1, Number(req.query.months) || 12))
    const [incomeCol, expensesCol] = await Promise.all([getCollection<{ amount: number; date: string }>('income'), expensesCollection()])
    const [income, expenses] = await Promise.all([incomeCol.find().toArray(), expensesCol.find().toArray()])

    const now = new Date()
    const buckets: { month: string; income: number; expenses: number; netIncome: number }[] = []
    for (let i = months - 1; i >= 0; i -= 1) {
      const bucketDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, '0')}`
      buckets.push({ month: key, income: 0, expenses: 0, netIncome: 0 })
    }
    const bucketIndex = new Map(buckets.map((bucket, idx) => [bucket.month, idx]))

    for (const record of income) {
      const date = new Date(record.date)
      if (Number.isNaN(date.getTime())) continue
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const idx = bucketIndex.get(key)
      if (idx === undefined) continue
      buckets[idx].income = Number((buckets[idx].income + Number(record.amount ?? 0)).toFixed(2))
    }
    for (const record of expenses) {
      const date = new Date(record.date)
      if (Number.isNaN(date.getTime())) continue
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const idx = bucketIndex.get(key)
      if (idx === undefined) continue
      buckets[idx].expenses = Number((buckets[idx].expenses + Number(record.amount ?? 0)).toFixed(2))
    }
    for (const bucket of buckets) {
      bucket.netIncome = Number((bucket.income - bucket.expenses).toFixed(2))
    }

    res.json({ success: true, data: buckets })
  } catch (error) {
    logger.error({ err: error }, 'Failed to compute net income trend')
    res.status(500).json({ success: false, error: 'Failed to compute net income trend' })
  }
})

// --- Accounting export (CSV) ----------------------------------------------------
function csvEscape(value: unknown) {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

financeRoutes.get('/export', requirePermission('reports:export', 'finance:view'), async (req, res) => {
  try {
    const format = typeof req.query.format === 'string' ? req.query.format : 'csv'
    const paymentsCol = await paymentsCollection()
    const payments = await paymentsCol
      .find()
      .sort({ createdAt: -1 })
      .toArray()

    // QuickBooks-compatible 3-column CSV (Date, Description, Amount) is the
    // widely-supported "Banking > Upload transactions" import shape; a full IIF
    // export is out of scope here but this format is directly importable.
    const header = ['Date', 'Description', 'Amount', 'Type', 'Method', 'StudentId', 'ReferenceId']
    const rows = payments.map((payment) => [
      payment.createdAt.slice(0, 10),
      csvEscape(payment.note || `${payment.source} ${payment.type}`),
      payment.type === 'debit' ? -Math.abs(Number(payment.amount ?? 0)) : Math.abs(Number(payment.amount ?? 0)),
      payment.type,
      payment.method,
      payment.studentId,
      payment.referenceId ?? '',
    ])

    if (format === 'json') {
      return res.json({ success: true, data: payments })
    }

    const csv = [header.join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="finance-export-${new Date().toISOString().slice(0, 10)}.csv"`)
    res.send(csv)
  } catch (error) {
    logger.error({ err: error }, 'Failed to export finance data')
    res.status(500).json({ success: false, error: 'Failed to export finance data' })
  }
})

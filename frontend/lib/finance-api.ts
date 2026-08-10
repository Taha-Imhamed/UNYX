import type {
  Income,
  Expense,
  PaymentTransaction,
  Coupon,
  FinanceInstallmentPlan,
  FinanceInvoice,
  FinanceRequest,
  FinanceRefundRequest,
  FinanceReportSummary,
  FinanceSponsorship,
  FinanceChargeType,
  FinancialHold,
} from '@shared/types'
import { API_BASE_URL, apiFetch, authHeaders } from './api-client'

// Income
export function fetchIncome(signal?: AbortSignal) {
  return apiFetch<Income[]>('/income', { signal })
}

export function createIncome(payload: { source: string; description: string; amount: number; date: string; studentId?: string }) {
  return apiFetch<Income>('/income', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateIncome(id: string, payload: Partial<Income>) {
  return apiFetch<Income>(`/income/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteIncome(id: string) {
  return apiFetch<void>(`/income/${id}`, { method: 'DELETE' })
}

// Expenses
export function fetchExpenses(signal?: AbortSignal) {
  return apiFetch<Expense[]>('/expenses', { signal })
}

export function createExpense(payload: { category: string; description: string; amount: number; date: string; approvedBy?: string; status?: Expense['status'] }) {
  return apiFetch<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateExpense(id: string, payload: Partial<Expense>) {
  return apiFetch<Expense>(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteExpense(id: string) {
  return apiFetch<void>(`/expenses/${id}`, { method: 'DELETE' })
}

export interface PaymentPage {
  items: PaymentTransaction[]
  total: number
  page: number
  pageSize: number
}

export function fetchPayments(params?: { page?: number; pageSize?: number; studentId?: string; signal?: AbortSignal }) {
  const search = new URLSearchParams()
  if (params?.page) search.set('page', String(params.page))
  if (params?.pageSize) search.set('limit', String(params.pageSize))
  if (params?.studentId) search.set('studentId', params.studentId)

  const query = search.toString()
  const path = `/payments${query ? `?${query}` : ''}`

  const { signal } = params ?? {}
  return apiFetch<PaymentPage>(path, { signal })
}

// Coupons
export function createCoupon(payload: { code: string; percent: number }) {
  return apiFetch<Coupon>(`/coupons`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchCoupons(signal?: AbortSignal) {
  return apiFetch<Coupon[]>(`/coupons`, { signal })
}

export function fetchFinanceInvoices(params?: { query?: string; signal?: AbortSignal }) {
  const search = new URLSearchParams()
  if (params?.query) search.set('query', params.query)
  const query = search.toString()
  return apiFetch<FinanceInvoice[]>(`/finance/invoices${query ? `?${query}` : ''}`, { signal: params?.signal })
}

export function createFinanceInvoice(payload: {
  studentId: string
  title: string
  semester?: string | null
  issueDate: string
  dueDate: string
  notes?: string | null
  lineItems: Array<{
    type: FinanceChargeType
    label: string
    description?: string | null
    quantity: number
    unitAmount: number
  }>
}) {
  return apiFetch<FinanceInvoice>('/finance/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchInstallmentPlans(signal?: AbortSignal) {
  return apiFetch<FinanceInstallmentPlan[]>('/finance/installment-plans', { signal })
}

export function createInstallmentPlan(payload: {
  studentId: string
  title: string
  totalAmount: number
  installmentCount: number
  paidAmount?: number
  startDate: string
  nextDueDate: string
  status?: FinanceInstallmentPlan['status']
  notes?: string | null
}) {
  return apiFetch<FinanceInstallmentPlan>('/finance/installment-plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Student self-service payment plan
export function fetchMyInstallmentPlans(signal?: AbortSignal) {
  return apiFetch<FinanceInstallmentPlan[]>('/finance/installment-plans/mine', { signal })
}

export function requestInstallmentPlan(payload: { totalAmount: number; installmentCount: number; notes?: string | null }) {
  return apiFetch<FinanceInstallmentPlan>('/finance/installment-plans/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchSponsorships(signal?: AbortSignal) {
  return apiFetch<FinanceSponsorship[]>('/finance/sponsorships', { signal })
}

export function fetchMySponsorships(signal?: AbortSignal) {
  return apiFetch<FinanceSponsorship[]>('/finance/sponsorships/mine', { signal })
}

export function createSponsorship(payload: {
  studentId: string
  sponsorName: string
  sponsorType?: FinanceSponsorship['sponsorType']
  coverageType?: FinanceSponsorship['coverageType']
  coverageValue: number
  appliedAmount?: number
  status?: FinanceSponsorship['status']
  startDate: string
  endDate?: string | null
  notes?: string | null
}) {
  return apiFetch<FinanceSponsorship>('/finance/sponsorships', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchRefundRequests(signal?: AbortSignal) {
  return apiFetch<FinanceRefundRequest[]>('/finance/refunds', { signal })
}

export function createRefundRequest(payload: {
  studentId: string
  invoiceId?: string | null
  amount: number
  reason: string
  notes?: string | null
}) {
  return apiFetch<FinanceRefundRequest>('/finance/refunds', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveRefundRequest(id: string, notes?: string | null) {
  return apiFetch<FinanceRefundRequest>(`/finance/refunds/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  })
}

export function confirmFinancePayment(id: string, note?: string | null) {
  return apiFetch<PaymentTransaction>(`/finance/payments/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  })
}

export interface UnpaidBalanceItem {
  studentId: string
  studentDisplayId?: string
  studentName: string
  balance: number
  openInvoices: FinanceInvoice[]
}

export function fetchUnpaidBalances(signal?: AbortSignal) {
  return apiFetch<UnpaidBalanceItem[]>('/finance/unpaid-balances', { signal })
}

export interface FinanceSummaryResponse {
  summary: FinanceReportSummary
  recentInvoices: FinanceInvoice[]
  recentRefunds: FinanceRefundRequest[]
}

export function fetchFinanceReportSummary(signal?: AbortSignal) {
  return apiFetch<FinanceSummaryResponse>('/finance/reports/summary', { signal })
}

export function fetchFinanceRequests(signal?: AbortSignal) {
  return apiFetch<FinanceRequest[]>('/finance/requests', { signal })
}

export function createFinanceRequest(payload: {
  department?: string | null
  requestType: FinanceRequest["requestType"]
  title: string
  itemName: string
  amount: number
  urgency?: FinanceRequest["urgency"]
  justification: string
  vendorName?: string | null
  notes?: string | null
}) {
  return apiFetch<FinanceRequest>('/finance/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function handleFinanceRequest(id: string, payload: { status: "approved" | "rejected" | "fulfilled"; financeNotes?: string | null }) {
  return apiFetch<FinanceRequest>(`/finance/requests/${id}/handle`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateFinanceRequest(
  id: string,
  payload: Partial<
    Pick<
      FinanceRequest,
      "department" | "requestType" | "title" | "itemName" | "amount" | "urgency" | "justification" | "vendorName" | "notes" | "status" | "financeNotes"
    >
  >,
) {
  return apiFetch<FinanceRequest>(`/finance/requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteFinanceRequest(id: string) {
  return apiFetch<FinanceRequest>(`/finance/requests/${id}`, {
    method: 'DELETE',
  })
}

// Ledger
export interface LedgerEntry {
  id: string
  studentId: string
  amount: number
  entryType: 'credit' | 'debit'
  source: string
  note?: string | null
  paymentId?: string | null
  enrollmentId?: string | null
  invoiceId?: string | null
  createdAt: string
  createdByUserId?: string | null
  createdByName?: string | null
  metadata?: Record<string, unknown>
}

export function fetchLedger(params?: { studentId?: string; limit?: number; signal?: AbortSignal }) {
  const search = new URLSearchParams()
  if (params?.studentId) search.set('studentId', params.studentId)
  if (params?.limit) search.set('limit', String(params.limit))
  const query = search.toString()
  return apiFetch<LedgerEntry[]>(`/finance/ledger${query ? `?${query}` : ''}`, { signal: params?.signal })
}

// Payment method reconciliation
export interface ReconciliationSummary {
  byMethod: { method: string; count: number; total: number }[]
  pendingCount: number
  rejectedCount: number
  totalConfirmed: number
}

export function fetchReconciliation(signal?: AbortSignal) {
  return apiFetch<ReconciliationSummary>('/finance/reconciliation', { signal })
}

// Outstanding balance report
export interface OutstandingBalanceReport {
  byStudent: {
    studentId: string
    studentDisplayId?: string
    studentName: string
    department: string | null
    balance: number
    openInvoiceCount: number
    daysPastDue: number
    agingBucket: 'current' | '1-30' | '31-60' | '61-90' | '90+'
  }[]
  byDepartment: { department: string; studentCount: number; totalBalance: number }[]
}

export function fetchOutstandingBalanceReport(signal?: AbortSignal) {
  return apiFetch<OutstandingBalanceReport>('/finance/outstanding-balance-report', { signal })
}

// Late fee assessment (admin-triggered job)
export function assessLateFees() {
  return apiFetch<{ assessedCount: number; assessed: { invoiceId: string; studentId: string; feeAmount: number }[] }>(
    '/finance/jobs/assess-late-fees',
    { method: 'POST' },
  )
}

// Financial holds
export function fetchFinancialHolds(status: 'active' | 'released' | 'all' = 'active', signal?: AbortSignal) {
  return apiFetch<FinancialHold[]>(`/finance/holds?status=${status}`, { signal })
}

export function syncFinancialHolds() {
  return apiFetch<{ created: number; released: number }>('/finance/holds/sync', { method: 'POST' })
}

export function releaseFinancialHold(id: string) {
  return apiFetch<FinancialHold>(`/finance/holds/${id}/release`, { method: 'POST' })
}

// Net income trend
export interface NetIncomeTrendPoint {
  month: string
  income: number
  expenses: number
  netIncome: number
}

export function fetchNetIncomeTrend(months = 12, signal?: AbortSignal) {
  return apiFetch<NetIncomeTrendPoint[]>(`/finance/net-income-trend?months=${months}`, { signal })
}

// Accounting export
export async function downloadFinanceExportCsv(signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/finance/export?format=csv`, {
    method: 'GET',
    signal,
    headers: {
      Accept: 'text/csv',
      ...authHeaders(),
    },
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { error?: string; message?: string }
      throw new Error(payload.error || payload.message || `Request failed (${response.status})`)
    }
    throw new Error(`Request failed (${response.status})`)
  }

  return response.blob()
}

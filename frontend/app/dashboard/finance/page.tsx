"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { announceFinanceRequestsChanged, subscribeToFinanceRequestChanges } from "@/lib/finance-request-events"
import { fetchStudents, recordStudentPayment } from "@/lib/students-api"
import {
  approveRefundRequest,
  confirmFinancePayment,
  createFinanceInvoice,
  createInstallmentPlan,
  createRefundRequest,
  createSponsorship,
  fetchExpenses,
  fetchFinanceInvoices,
  fetchFinanceRequests,
  fetchFinanceReportSummary,
  fetchInstallmentPlans,
  fetchPayments,
  fetchRefundRequests,
  fetchSponsorships,
  fetchUnpaidBalances,
  handleFinanceRequest,
  type FinanceSummaryResponse,
  type UnpaidBalanceItem,
} from "@/lib/finance-api"
import type {
  FinanceChargeType,
  FinanceInstallmentPlan,
  FinanceInvoice,
  FinanceRequest,
  FinanceRefundRequest,
  FinanceSponsorship,
  PaymentTransaction,
  PaymentMethod,
  Student,
} from "@shared/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Plus, Receipt, Search, ShieldCheck, Wallet, WalletCards } from "lucide-react"
import { LedgerPanel } from "@/components/finance/ledger-panel"
import { HoldsPanel } from "@/components/finance/holds-panel"
import { ReportsExtraPanel } from "@/components/finance/reports-extra-panel"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const chargePresets: Array<{ type: FinanceChargeType; label: string; title: string }> = [
  { type: "tuition", label: "Tuition invoice", title: "Tuition Invoice" },
  { type: "semester", label: "Semester charge", title: "Semester Charge" },
  { type: "hostel", label: "Hostel fee", title: "Hostel Fee" },
  { type: "transport", label: "Transport fee", title: "Transport Fee" },
  { type: "late-penalty", label: "Late penalty", title: "Late Penalty" },
]

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function getStudentName(student: Student) {
  return `${student.firstName} ${student.lastName}`
}

function buildInvoiceHtml(invoice: FinanceInvoice) {
  const rows = invoice.lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #dbe5f1;">${item.label}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #dbe5f1;">${item.type}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #dbe5f1;">${item.quantity}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #dbe5f1;">${currencyFormatter.format(item.unitAmount)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #dbe5f1;">${currencyFormatter.format(item.total)}</td>
        </tr>
      `,
    )
    .join("")

  return `
    <html>
      <head>
        <title>${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; background:#f4f8fc; color:#163150; padding:32px; }
          .sheet { background:#fff; border:1px solid #d8e2f0; border-radius:20px; overflow:hidden; }
          .hero { padding:28px 32px; background:linear-gradient(135deg,#eff5ff 0%,#fbfdff 100%); border-bottom:1px solid #d8e2f0; }
          .hero h1 { margin:0; font-size:26px; color:#4c79b3; }
          .muted { color:#607a9d; font-size:13px; }
          .grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:18px; }
          .stat { border:1px solid #d8e2f0; border-radius:14px; padding:12px 14px; }
          .content { padding:24px 32px 32px; }
          table { width:100%; border-collapse:collapse; border:1px solid #d8e2f0; border-radius:14px; overflow:hidden; }
          th { text-align:left; background:#6e98cf; color:#fff; padding:12px 14px; font-size:12px; text-transform:uppercase; }
          .total { margin-top:18px; text-align:right; font-size:16px; font-weight:700; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="hero">
            <h1>Finance Invoice</h1>
            <div class="muted">${invoice.invoiceNumber} • ${invoice.title}</div>
            <div class="grid">
              <div class="stat"><strong>Student</strong><br/>${invoice.studentName}</div>
              <div class="stat"><strong>Issue Date</strong><br/>${invoice.issueDate}</div>
              <div class="stat"><strong>Due Date</strong><br/>${invoice.dueDate}</div>
            </div>
          </div>
          <div class="content">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="total">Balance Due: ${currencyFormatter.format(invoice.balanceDue)}</div>
          </div>
        </div>
      </body>
    </html>
  `
}

function buildFinanceReportHtml(summary: FinanceSummaryResponse["summary"], invoices: FinanceInvoice[], balances: UnpaidBalanceItem[]) {
  const invoiceRows = invoices
    .slice(0, 12)
    .map(
      (invoice) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #dbe5f1;">${invoice.invoiceNumber}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #dbe5f1;">${invoice.studentName}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #dbe5f1;">${invoice.status}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #dbe5f1;">${currencyFormatter.format(invoice.balanceDue)}</td>
        </tr>
      `,
    )
    .join("")

  const balanceRows = balances
    .slice(0, 12)
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #dbe5f1;">${item.studentName}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #dbe5f1;">${item.studentDisplayId ?? item.studentId}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #dbe5f1;">${currencyFormatter.format(item.balance)}</td>
        </tr>
      `,
    )
    .join("")

  return `
    <html>
      <head>
        <title>Finance Report</title>
      </head>
      <body style="font-family:Arial,sans-serif;background:#f4f8fc;padding:28px;color:#17304f;">
        <div style="background:#fff;border:1px solid #dbe5f1;border-radius:20px;overflow:hidden;">
          <div style="padding:24px 28px;background:linear-gradient(135deg,#eff5ff 0%,#fbfdff 100%);border-bottom:1px solid #dbe5f1;">
            <h1 style="margin:0 0 6px;">Finance Report</h1>
            <div style="color:#67809f;">Generated on ${new Date().toLocaleString()}</div>
          </div>
          <div style="padding:24px 28px;">
            <p><strong>Total revenue:</strong> ${currencyFormatter.format(summary.totalRevenue)}</p>
            <p><strong>Collected payments:</strong> ${currencyFormatter.format(summary.totalCollectedPayments)}</p>
            <p><strong>Pending balances:</strong> ${currencyFormatter.format(summary.totalPendingBalances)}</p>
            <p><strong>Net revenue:</strong> ${currencyFormatter.format(summary.netRevenue)}</p>
            <h2>Recent Invoices</h2>
            <table style="width:100%;border-collapse:collapse;border:1px solid #dbe5f1;">
              <thead><tr style="background:#6e98cf;color:#fff;"><th style="padding:10px 12px;text-align:left;">Invoice</th><th style="padding:10px 12px;text-align:left;">Student</th><th style="padding:10px 12px;text-align:left;">Status</th><th style="padding:10px 12px;text-align:left;">Balance</th></tr></thead>
              <tbody>${invoiceRows}</tbody>
            </table>
            <h2>Unpaid Balances</h2>
            <table style="width:100%;border-collapse:collapse;border:1px solid #dbe5f1;">
              <thead><tr style="background:#6e98cf;color:#fff;"><th style="padding:10px 12px;text-align:left;">Student</th><th style="padding:10px 12px;text-align:left;">ID</th><th style="padding:10px 12px;text-align:left;">Balance</th></tr></thead>
              <tbody>${balanceRows}</tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `
}

function buildReceiptHtml(params: { studentName: string; studentId: string; amount: number; method: string; note?: string | null; date: string }) {
  return `
    <html>
      <head>
        <title>Payment Receipt</title>
        <style>body{font-family:Arial,sans-serif;padding:28px;background:#f7fbff;color:#123;} .card{background:#fff;border-radius:12px;padding:20px;border:1px solid #e1eef9} .muted{color:#6c89a6;font-size:13px}</style>
      </head>
      <body>
        <div class="card">
          <h2>Payment Receipt</h2>
          <div class="muted">Student: ${params.studentName} (${params.studentId})</div>
          <div style="margin-top:12px;font-size:18px;font-weight:600">Amount: ${currencyFormatter.format(params.amount)}</div>
          <div style="margin-top:8px" class="muted">Method: ${params.method}</div>
          <div style="margin-top:8px" class="muted">Note: ${params.note ?? ""}</div>
          <div style="margin-top:12px" class="muted">Date: ${params.date}</div>
        </div>
      </body>
    </html>
  `
}

export default function FinancePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading, hasPermission } = useAuth()
  const canView = hasPermission("finance:view") || hasPermission("reports:view")
  const canManage = hasPermission("finance:manage")
  const canApprove = hasPermission("finance:approve")
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const [pageLoading, setPageLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [expenses, setExpenses] = useState<{ amount: number }[]>([])
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([])
  const [unpaidBalances, setUnpaidBalances] = useState<UnpaidBalanceItem[]>([])
  const [installmentPlans, setInstallmentPlans] = useState<FinanceInstallmentPlan[]>([])
  const [sponsorships, setSponsorships] = useState<FinanceSponsorship[]>([])
  const [refunds, setRefunds] = useState<FinanceRefundRequest[]>([])
  const [financeRequests, setFinanceRequests] = useState<FinanceRequest[]>([])
  const [reportData, setReportData] = useState<FinanceSummaryResponse | null>(null)
  const [invoiceSearch, setInvoiceSearch] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(null)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)
  const [planFormOpen, setPlanFormOpen] = useState(false)
  const [sponsorshipFormOpen, setSponsorshipFormOpen] = useState(false)
  const [refundFormOpen, setRefundFormOpen] = useState(false)
  const [invoicePreset, setInvoicePreset] = useState<(typeof chargePresets)[number]>(chargePresets[0])
  const [selectedInvoiceStudent, setSelectedInvoiceStudent] = useState<string>("")
  const [selectedPaymentStudent, setSelectedPaymentStudent] = useState<string>("")

  const loadFinanceData = useCallback(
    async (signal?: AbortSignal) => {
      if (isLoading || !user) return
      if (!canView) {
        router.push("/dashboard")
        return
      }

      setPageLoading(true)
      try {
        const [
          studentData,
          paymentPage,
          expenseData,
          invoiceData,
          unpaidData,
          installmentData,
          sponsorshipData,
          refundData,
          requestData,
          financeSummary,
        ] = await Promise.all([
          fetchStudents(signal),
          fetchPayments({ page: 1, pageSize: 500, signal }),
          fetchExpenses(signal),
          fetchFinanceInvoices({ signal }),
          fetchUnpaidBalances(signal),
          fetchInstallmentPlans(signal),
          fetchSponsorships(signal),
          fetchRefundRequests(signal),
          fetchFinanceRequests(signal),
          fetchFinanceReportSummary(signal),
        ])

        if (signal?.aborted) return
        setStudents(studentData)
        setPayments(paymentPage.items)
        setExpenses(expenseData)
        setInvoices(invoiceData)
        setUnpaidBalances(unpaidData)
        setInstallmentPlans(installmentData)
        setSponsorships(sponsorshipData)
        setRefunds(refundData)
        setFinanceRequests(requestData)
        setReportData(financeSummary)
        setSelectedInvoiceStudent((prev) => prev || studentData[0]?.id || "")
        setSelectedPaymentStudent((prev) => prev || studentData[0]?.id || "")
      } catch (error) {
        if (!signal?.aborted) {
          toast({
            variant: "destructive",
            title: "Finance dashboard failed to load",
            description: error instanceof Error ? error.message : "Unable to load finance data",
          })
        }
      } finally {
        if (!signal?.aborted) setPageLoading(false)
      }
    },
    [canView, isLoading, router, toast, user],
  )

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, router, user])

  useEffect(() => {
    const controller = new AbortController()
    void loadFinanceData(controller.signal)
    return () => controller.abort()
  }, [loadFinanceData, refreshVersion])

  useEffect(() => {
    return subscribeToFinanceRequestChanges(() => {
      void fetchFinanceRequests()
        .then((items) => setFinanceRequests(items))
        .catch(() => undefined)
    })
  }, [])

  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase()
    if (!query) return invoices
    return invoices.filter((invoice) =>
      [invoice.invoiceNumber, invoice.id, invoice.title, invoice.studentName, invoice.studentDisplayId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [invoiceSearch, invoices])

  const openInvoicesForSelectedStudent = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.studentId === selectedPaymentStudent && invoice.balanceDue > 0 && invoice.status !== "cancelled",
      ),
    [invoices, selectedPaymentStudent],
  )

  const financeSummary = reportData?.summary
  const pendingRequestCount = useMemo(() => financeRequests.filter((item) => item.status === "pending").length, [financeRequests])
  const pendingPayments = useMemo(
    () => payments.filter((payment) => payment.type === "credit" && payment.financeStatus !== "confirmed"),
    [payments],
  )

  const studentMap = useMemo(() => new Map(students.map((student) => [student.id, student])), [students])

  const selectedPaymentBalance = useMemo(() => {
    const found = unpaidBalances.find((b) => b.studentId === selectedPaymentStudent)
    return found ? found.balance : 0
  }, [unpaidBalances, selectedPaymentStudent])

  const triggerHtmlDownload = (html: string, filename: string) => {
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const printInvoice = (invoice: FinanceInvoice) => {
    const popup = window.open("", "_blank")
    if (!popup) return
    popup.document.write(buildInvoiceHtml(invoice))
    popup.document.close()
    popup.focus()
    popup.print()
  }

  const downloadInvoice = (invoice: FinanceInvoice) => {
    triggerHtmlDownload(buildInvoiceHtml(invoice), `${invoice.invoiceNumber}.html`)
  }

  const downloadFinanceReport = () => {
    if (!financeSummary) return
    triggerHtmlDownload(
      buildFinanceReportHtml(financeSummary, invoices, unpaidBalances),
      `finance-report-${todayString()}.html`,
    )
  }

  const handleInvoiceCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const amount = Number(formData.get("amount"))
    const quantity = Number(formData.get("quantity") ?? 1)

    try {
      const studentId = String(formData.get("studentId") || selectedInvoiceStudent || "")
      if (!studentId) {
        throw new Error("Select a student first")
      }
      await createFinanceInvoice({
        studentId,
        title: String(formData.get("title")),
        semester: String(formData.get("semester") || "") || null,
        issueDate: String(formData.get("issueDate")),
        dueDate: String(formData.get("dueDate")),
        notes: String(formData.get("notes") || "") || null,
        lineItems: [
          {
            type: String(formData.get("chargeType")) as FinanceChargeType,
            label: String(formData.get("lineLabel")),
            description: String(formData.get("lineDescription") || "") || null,
            quantity,
            unitAmount: amount,
          },
        ],
      })
      setInvoiceFormOpen(false)
      toast({ title: "Invoice created" })
      void loadFinanceData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invoice not created",
        description: error instanceof Error ? error.message : "Unable to create invoice",
      })
    }
  }

  const handleRecordPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      const invoiceIdRaw = String(formData.get("invoiceId") || "")
      const studentId = String(formData.get("studentId"))
      const amount = Number(formData.get("amount"))
      const method = String(formData.get("method")) as PaymentMethod
      const note = String(formData.get("note") || "") || undefined

      await recordStudentPayment(studentId, {
        amount,
        method,
        note,
        invoiceId: invoiceIdRaw && invoiceIdRaw !== "none" ? invoiceIdRaw : null,
      })

      // create a saved invoice/receipt record for traceability
      try {
        const created = await createFinanceInvoice({
          studentId,
          title: `Payment receipt - ${todayString()}`,
          semester: null,
          issueDate: todayString(),
          dueDate: todayString(),
          notes: `Payment method: ${method}. ${note ?? ""}`,
          lineItems: [
            { type: chargePresets[0].type, label: "Payment received", description: "Recorded payment receipt", quantity: 1, unitAmount: amount },
          ],
        })
        // download receipt HTML immediately
        triggerHtmlDownload(buildReceiptHtml({ studentName: getStudentName(studentMap.get(studentId) as Student || { firstName: "", lastName: "" } as Student), studentId, amount, method, note, date: new Date().toLocaleString() }), `${created.invoiceNumber || 'receipt'}.html`)
      } catch (err) {
        // non-fatal: if saving receipt fails, continue
        console.warn("Unable to save receipt invoice", err)
      }

      setPaymentFormOpen(false)
      toast({ title: "Payment recorded" })
      void loadFinanceData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unable to record payment",
      })
    }
  }

  const handleCreatePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      await createInstallmentPlan({
        studentId: String(formData.get("studentId")),
        title: String(formData.get("title")),
        totalAmount: Number(formData.get("totalAmount")),
        installmentCount: Number(formData.get("installmentCount")),
        paidAmount: Number(formData.get("paidAmount") || 0),
        startDate: String(formData.get("startDate")),
        nextDueDate: String(formData.get("nextDueDate")),
        status: String(formData.get("status")) as FinanceInstallmentPlan["status"],
        notes: String(formData.get("notes") || "") || null,
      })
      setPlanFormOpen(false)
      toast({ title: "Installment plan created" })
      void loadFinanceData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Plan not created",
        description: error instanceof Error ? error.message : "Unable to create installment plan",
      })
    }
  }

  const handleCreateSponsorship = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      await createSponsorship({
        studentId: String(formData.get("studentId")),
        sponsorName: String(formData.get("sponsorName")),
        sponsorType: String(formData.get("sponsorType")) as FinanceSponsorship["sponsorType"],
        coverageType: String(formData.get("coverageType")) as FinanceSponsorship["coverageType"],
        coverageValue: Number(formData.get("coverageValue")),
        appliedAmount: Number(formData.get("appliedAmount") || 0),
        status: String(formData.get("status")) as FinanceSponsorship["status"],
        startDate: String(formData.get("startDate")),
        endDate: String(formData.get("endDate") || "") || null,
        notes: String(formData.get("notes") || "") || null,
      })
      setSponsorshipFormOpen(false)
      toast({ title: "Sponsorship saved" })
      void loadFinanceData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sponsorship failed",
        description: error instanceof Error ? error.message : "Unable to save sponsorship",
      })
    }
  }

  const handleCreateRefund = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      const invoiceIdRaw = String(formData.get("invoiceId") || "")
      await createRefundRequest({
        studentId: String(formData.get("studentId")),
        invoiceId: invoiceIdRaw && invoiceIdRaw !== "none" ? invoiceIdRaw : null,
        amount: Number(formData.get("amount")),
        reason: String(formData.get("reason")),
        notes: String(formData.get("notes") || "") || null,
      })
      setRefundFormOpen(false)
      toast({ title: "Refund request created" })
      void loadFinanceData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refund request failed",
        description: error instanceof Error ? error.message : "Unable to create refund request",
      })
    }
  }

  const handleApproveRefund = async (refund: FinanceRefundRequest) => {
    try {
      await approveRefundRequest(refund.id, refund.notes ?? null)
      toast({ title: "Refund approved" })
      void loadFinanceData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refund approval failed",
        description: error instanceof Error ? error.message : "Unable to approve refund",
      })
    }
  }

  const handleConfirmPayment = async (payment: PaymentTransaction) => {
    try {
      await confirmFinancePayment(payment.id, "Confirmed from finance dashboard")
      toast({ title: "Payment confirmed" })
      void loadFinanceData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment confirmation failed",
        description: error instanceof Error ? error.message : "Unable to confirm payment",
      })
    }
  }

  const handleFinanceRequestDecision = async (request: FinanceRequest, status: "approved" | "rejected" | "fulfilled") => {
    try {
      const updated = await handleFinanceRequest(request.id, { status, financeNotes: `Marked ${status} from finance dashboard` })
      setFinanceRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      announceFinanceRequestsChanged()
      toast({ title: `Request ${status}` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Request update failed",
        description: error instanceof Error ? error.message : "Unable to update request",
      })
    }
  }

  if (isLoading || pageLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading finance workspace...</div>
  }

  if (!user || !canView) {
    return null
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Finance" description="Invoices, charges, balances, refunds, plans, and reports." />

      <div className="flex-1 space-y-5 p-4">
        <Card className="overflow-hidden border-[#dce9f8] bg-[radial-gradient(circle_at_top_left,_rgba(125,179,255,0.22),_transparent_36%),linear-gradient(135deg,#fcfdff_0%,#f1f7ff_46%,#f8fbff_100%)] shadow-sm">
          <CardContent className="flex flex-wrap items-end justify-between gap-4 p-6">
            <div className="max-w-2xl space-y-2">
              <Badge variant="outline" className="border-[#cddcf2] bg-white/80 text-[#5c84ba]">Finance Operations Desk</Badge>
              <h2 className="text-3xl font-bold tracking-tight text-[#4e77ad]">A cleaner workspace for billing, approvals, requests, and reporting.</h2>
              <p className="text-sm text-[#6f89a9]">
                Finance can now manage invoices, balances, payment confirmations, refunds, installment plans, sponsorships, and staff purchase or fund requests from one dashboard.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-[#d7e4f5] bg-white/80 text-[#5279ad]" onClick={() => router.push("/dashboard/requests")}>
                Open staff requests
              </Button>
              <Button onClick={downloadFinanceReport} disabled={!hasPermission("reports:export")}>
                Download report
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-4">
          <Card className="border-[#dce7f7] bg-[#fbfdff]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-semibold text-foreground">{currencyFormatter.format(financeSummary?.totalRevenue ?? 0)}</p>
              </div>
              <Receipt className="h-8 w-8 text-[#6d95c9]" />
            </CardContent>
          </Card>
          <Card className="border-[#dce7f7] bg-[#fbfdff]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Pending balances</p>
                <p className="text-2xl font-semibold text-destructive">{currencyFormatter.format(financeSummary?.totalPendingBalances ?? 0)}</p>
              </div>
              <Wallet className="h-8 w-8 text-[#ef8d86]" />
            </CardContent>
          </Card>
          <Card className="border-[#dce7f7] bg-[#fbfdff]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Open invoices</p>
                <p className="text-2xl font-semibold text-foreground">{financeSummary?.openInvoiceCount ?? 0}</p>
              </div>
              <FileText className="h-8 w-8 text-[#6d95c9]" />
            </CardContent>
          </Card>
          <Card className="border-[#dce7f7] bg-[#fbfdff]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Pending requests</p>
                <p className="text-2xl font-semibold text-foreground">{pendingRequestCount}</p>
              </div>
              <WalletCards className="h-8 w-8 text-[#6d95c9]" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList className="h-auto min-h-[64px] flex-wrap gap-2 rounded-2xl border border-[#dce7f7] bg-[#f5f9ff] p-2">
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="invoices">Invoices</TabsTrigger>
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="accounts">Unpaid Balances</TabsTrigger>
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="payments">Payments</TabsTrigger>
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="plans">Installments</TabsTrigger>
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="sponsorships">Sponsorships</TabsTrigger>
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="requests">Requests</TabsTrigger>
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="refunds">Refunds</TabsTrigger>
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="reports">Reports</TabsTrigger>
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="receipts">Receipts</TabsTrigger>
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="ledger">Ledger</TabsTrigger>
              <TabsTrigger className="min-h-[44px] rounded-xl px-3 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#4d76aa]" value="holds">Holds</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap gap-2">
              <Dialog open={invoiceFormOpen} onOpenChange={setInvoiceFormOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!canManage}>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Generate invoice or charge</DialogTitle>
                    <DialogDescription>Create tuition invoices, semester charges, hostel fees, transport fees, or late penalties.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-wrap gap-2">
                    {chargePresets.map((preset) => (
                      <Button
                        key={preset.type}
                        type="button"
                        variant={invoicePreset.type === preset.type ? "default" : "outline"}
                        onClick={() => setInvoicePreset(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <form className="space-y-4" onSubmit={handleInvoiceCreate}>
                    <div className="space-y-2">
                      <Label htmlFor="invoiceStudent">Student</Label>
                      <input type="hidden" name="studentId" value={selectedInvoiceStudent} />
                      <Select value={selectedInvoiceStudent} onValueChange={setSelectedInvoiceStudent}>
                        <SelectTrigger id="invoiceStudent">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {getStudentName(student)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceTitle">Invoice title</Label>
                        <Input id="invoiceTitle" name="title" defaultValue={invoicePreset.title} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chargeType">Charge type</Label>
                        <Input id="chargeType" name="chargeType" value={invoicePreset.type} readOnly />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="lineLabel">Line label</Label>
                        <Input id="lineLabel" name="lineLabel" defaultValue={invoicePreset.label} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" name="amount" type="number" min={0} step="0.01" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lineDescription">Description</Label>
                      <Input id="lineDescription" name="lineDescription" placeholder="Optional invoice note" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Input id="semester" name="semester" placeholder="Fall 2026" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="issueDate">Issue date</Label>
                        <Input id="issueDate" name="issueDate" type="date" defaultValue={todayString()} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due date</Label>
                        <Input id="dueDate" name="dueDate" type="date" defaultValue={todayString()} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Finance notes</Label>
                      <Textarea id="notes" name="notes" rows={3} />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">Create invoice</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={paymentFormOpen} onOpenChange={setPaymentFormOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!canManage}>
                    <Plus className="mr-2 h-4 w-4" />
                    Confirm / Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Record a payment</DialogTitle>
                    <DialogDescription>Apply a payment to a student account and optionally link it to an invoice.</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleRecordPayment}>
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <input type="hidden" name="studentId" value={selectedPaymentStudent} />
                      <Select value={selectedPaymentStudent} onValueChange={setSelectedPaymentStudent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {getStudentName(student)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Outstanding balance: <span className="font-medium text-foreground">{currencyFormatter.format(selectedPaymentBalance)}</span>
                        {openInvoicesForSelectedStudent.length > 0 && (
                          <span className="ml-2 text-xs text-sky-700">• {openInvoicesForSelectedStudent.length} open invoice(s)</span>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="paymentAmount">Amount</Label>
                        <Input id="paymentAmount" name="amount" type="number" min={0} step="0.01" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Method</Label>
                        <Select name="method" defaultValue="transfer">
                          <SelectTrigger id="paymentMethod">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoiceId">Invoice</Label>
                      <Select name="invoiceId" defaultValue="none">
                        <SelectTrigger id="invoiceId">
                          <SelectValue placeholder="Optional invoice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No linked invoice</SelectItem>
                          {openInvoicesForSelectedStudent.map((invoice) => (
                            <SelectItem key={invoice.id} value={invoice.id}>
                              {invoice.invoiceNumber} • {currencyFormatter.format(invoice.balanceDue)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentNote">Note</Label>
                      <Textarea id="paymentNote" name="note" rows={3} />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">Save payment</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="invoices">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Invoices and charges</CardTitle>
                <p className="text-sm text-muted-foreground">Search by invoice name or ID, open the invoice, and download or print it.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search invoice name or ID"
                    value={invoiceSearch}
                    onChange={(event) => setInvoiceSearch(event.target.value)}
                  />
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/40">
                        <TableHead>Invoice</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{invoice.invoiceNumber}</span>
                              <span className="text-xs text-muted-foreground">{invoice.id}</span>
                            </div>
                          </TableCell>
                          <TableCell>{invoice.studentName}</TableCell>
                          <TableCell>{invoice.title}</TableCell>
                          <TableCell>
                            <Badge variant={invoice.status === "paid" ? "default" : invoice.status === "cancelled" ? "destructive" : "secondary"}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{currencyFormatter.format(invoice.balanceDue)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setInvoiceDialogOpen(true)
                              }}
                            >
                              Open invoice
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredInvoices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                            No invoices matched your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Receipts</CardTitle>
                <p className="text-sm text-muted-foreground">Download saved payment receipts for any student as PDF.</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-4">
                  <div>
                    <Label>Student</Label>
                    <Select value={selectedInvoiceStudent} onValueChange={setSelectedInvoiceStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {getStudentName(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2" />
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/40">
                        <TableHead>Receipt</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices
                        .filter((inv) => inv.studentId === selectedInvoiceStudent)
                        .filter((inv) => (inv.title || '').toLowerCase().includes('receipt') || inv.lineItems.some((li) => li.label?.toLowerCase().includes('payment')))
                        .map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{inv.invoiceNumber}</span>
                                <span className="text-xs text-muted-foreground">{inv.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>{inv.issueDate}</TableCell>
                            <TableCell>{currencyFormatter.format(inv.lineItems?.reduce((s, i) => s + (i.total ?? i.unitAmount * i.quantity), 0) || inv.balanceDue || 0)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => {
                                  const popup = window.open('', '_blank')
                                  if (!popup) return
                                  popup.document.write(buildInvoiceHtml(inv))
                                  popup.document.close()
                                  popup.focus()
                                  // let user choose Print -> Save as PDF
                                  setTimeout(() => popup.print(), 300)
                                }}>
                                  Download PDF
                                </Button>
                                <Button size="sm" onClick={() => downloadInvoice(inv)}>Open</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Unpaid balances</CardTitle>
                <p className="text-sm text-muted-foreground">Students with open balances and the invoices attached to them.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/40">
                      <TableHead>Student</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Open invoices</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaidBalances.map((item) => (
                      <TableRow key={item.studentId}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.studentName}</span>
                            <span className="text-xs text-muted-foreground">{item.studentDisplayId ?? item.studentId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-destructive">{currencyFormatter.format(item.balance)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {item.openInvoices.map((invoice) => (
                              <Button
                                key={invoice.id}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoice(invoice)
                                  setInvoiceDialogOpen(true)
                                }}
                              >
                                {invoice.invoiceNumber}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Payment confirmations</CardTitle>
                  <p className="text-sm text-muted-foreground">Review payments that still need a finance confirmation.</p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/40">
                        <TableHead>Payment</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{payment.displayId}</span>
                              <span className="text-xs text-muted-foreground">{currencyFormatter.format(payment.amount)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{studentMap.get(payment.studentId) ? getStudentName(studentMap.get(payment.studentId) as Student) : payment.studentId}</TableCell>
                          <TableCell>{payment.invoiceId ?? "Not linked"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{payment.financeStatus ?? "pending"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" disabled={!canApprove} onClick={() => void handleConfirmPayment(payment)}>
                              Confirm
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pendingPayments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                            No pending payment confirmations.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Collections snapshot</CardTitle>
                  <p className="text-sm text-muted-foreground">Quick read on how payments are moving through finance.</p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Confirmed payments</span>
                    <span className="font-semibold">{payments.filter((item) => item.financeStatus === "confirmed").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending payments</span>
                    <span className="font-semibold">{pendingPayments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Collected total</span>
                    <span className="font-semibold">{currencyFormatter.format(financeSummary?.totalCollectedPayments ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expense total</span>
                    <span className="font-semibold">{currencyFormatter.format(expenses.reduce((sum, item) => sum + item.amount, 0))}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plans">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Installment plans</CardTitle>
                  <p className="text-sm text-muted-foreground">Manage payment plans for students who pay in stages.</p>
                </div>
                <Dialog open={planFormOpen} onOpenChange={setPlanFormOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!canManage}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create installment plan</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleCreatePlan}>
                      <div className="space-y-2">
                        <Label>Student</Label>
                        <Select name="studentId" defaultValue={students[0]?.id}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>{getStudentName(student)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="planTitle">Title</Label>
                          <Input id="planTitle" name="title" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="planStatus">Status</Label>
                          <Select name="status" defaultValue="active">
                            <SelectTrigger id="planStatus"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="defaulted">Defaulted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Input name="totalAmount" type="number" step="0.01" placeholder="Total amount" required />
                        <Input name="installmentCount" type="number" min={1} placeholder="Installments" required />
                        <Input name="paidAmount" type="number" step="0.01" placeholder="Already paid" defaultValue={0} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input name="startDate" type="date" defaultValue={todayString()} required />
                        <Input name="nextDueDate" type="date" defaultValue={todayString()} required />
                      </div>
                      <Textarea name="notes" rows={3} placeholder="Optional notes" />
                      <div className="flex justify-end"><Button type="submit">Save plan</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/40">
                      <TableHead>Student</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Next due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installmentPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>{plan.studentName}</TableCell>
                        <TableCell>{plan.title}</TableCell>
                        <TableCell>{currencyFormatter.format(plan.remainingBalance)}</TableCell>
                        <TableCell>{plan.nextDueDate}</TableCell>
                        <TableCell><Badge variant="outline">{plan.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sponsorships">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Sponsorships</CardTitle>
                  <p className="text-sm text-muted-foreground">Track sponsored tuition support and coverage agreements.</p>
                </div>
                <Dialog open={sponsorshipFormOpen} onOpenChange={setSponsorshipFormOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!canManage}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add sponsorship
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create sponsorship</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleCreateSponsorship}>
                      <Select name="studentId" defaultValue={students[0]?.id}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>{getStudentName(student)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input name="sponsorName" placeholder="Sponsor name" required />
                        <Select name="sponsorType" defaultValue="company">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="family">Family</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="scholarship">Scholarship</SelectItem>
                            <SelectItem value="government">Government</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Select name="coverageType" defaultValue="fixed">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input name="coverageValue" type="number" step="0.01" placeholder="Coverage value" required />
                        <Input name="appliedAmount" type="number" step="0.01" placeholder="Applied amount" defaultValue={0} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Select name="status" defaultValue="active">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="ended">Ended</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input name="startDate" type="date" defaultValue={todayString()} required />
                        <Input name="endDate" type="date" />
                      </div>
                      <Textarea name="notes" rows={3} placeholder="Optional notes" />
                      <div className="flex justify-end"><Button type="submit">Save sponsorship</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/40">
                      <TableHead>Student</TableHead>
                      <TableHead>Sponsor</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sponsorships.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.studentName}</TableCell>
                        <TableCell>{item.sponsorName}</TableCell>
                        <TableCell>{item.coverageType} • {item.coverageValue}</TableCell>
                        <TableCell>{currencyFormatter.format(item.appliedAmount)}</TableCell>
                        <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Staff purchase and fund requests</CardTitle>
                  <p className="text-sm text-muted-foreground">Review requests from admins, professors, and other staff, then approve, reject, or mark them fulfilled.</p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/40">
                        <TableHead>Request</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financeRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{request.title}</span>
                              <span className="text-xs text-muted-foreground">{request.requestNumber} • {request.itemName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{request.requesterName}</span>
                              <span className="text-xs capitalize text-muted-foreground">{request.requesterRole}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{request.requestType}</TableCell>
                          <TableCell>{currencyFormatter.format(request.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={request.status === "approved" || request.status === "fulfilled" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" disabled={!canApprove || request.status !== "pending"} onClick={() => void handleFinanceRequestDecision(request, "approved")}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" disabled={!canApprove || request.status !== "pending"} onClick={() => void handleFinanceRequestDecision(request, "rejected")}>
                                Reject
                              </Button>
                              <Button size="sm" disabled={!canApprove || (request.status !== "approved" && request.status !== "pending")} onClick={() => void handleFinanceRequestDecision(request, "fulfilled")}>
                                Fulfill
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {financeRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                            No staff finance requests yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Queue summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending requests</span>
                    <span className="font-semibold">{financeRequests.filter((item) => item.status === "pending").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Approved requests</span>
                    <span className="font-semibold">{financeRequests.filter((item) => item.status === "approved").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fulfilled requests</span>
                    <span className="font-semibold">{financeRequests.filter((item) => item.status === "fulfilled").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Requested amount</span>
                    <span className="font-semibold">
                      {currencyFormatter.format(financeRequests.reduce((sum, item) => sum + item.amount, 0))}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/20 p-4 text-muted-foreground">
                    Staff submit requests from <span className="font-medium text-foreground">/dashboard/requests</span>, and finance handles them here.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="refunds">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Refund approvals</CardTitle>
                  <p className="text-sm text-muted-foreground">Review and approve refund requests from the finance desk.</p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/40">
                        <TableHead>Student</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refunds.map((refund) => (
                        <TableRow key={refund.id}>
                          <TableCell>{refund.studentName}</TableCell>
                          <TableCell>{refund.invoiceNumber ?? "General refund"}</TableCell>
                          <TableCell>{currencyFormatter.format(refund.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={refund.status === "approved" ? "default" : refund.status === "rejected" ? "destructive" : "secondary"}>
                              {refund.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canApprove || refund.status !== "pending"}
                              onClick={() => void handleApproveRefund(refund)}
                            >
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Create refund request</CardTitle>
                    <p className="text-sm text-muted-foreground">Prepare refunds before approval.</p>
                  </div>
                  <Dialog open={refundFormOpen} onOpenChange={setRefundFormOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" disabled={!canManage}>
                        <Plus className="mr-2 h-4 w-4" />
                        New refund
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Create refund request</DialogTitle>
                      </DialogHeader>
                      <form className="space-y-4" onSubmit={handleCreateRefund}>
                        <Select name="studentId" defaultValue={students[0]?.id}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>{getStudentName(student)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select name="invoiceId" defaultValue="none">
                          <SelectTrigger><SelectValue placeholder="Optional invoice" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No linked invoice</SelectItem>
                            {invoices.map((invoice) => (
                              <SelectItem key={invoice.id} value={invoice.id}>{invoice.invoiceNumber}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input name="amount" type="number" step="0.01" placeholder="Refund amount" required />
                        <Textarea name="reason" rows={3} placeholder="Reason" required />
                        <Textarea name="notes" rows={3} placeholder="Internal note" />
                        <div className="flex justify-end"><Button type="submit">Create refund</Button></div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending approvals</span>
                    <span className="font-semibold">{refunds.filter((item) => item.status === "pending").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Approved refunds</span>
                    <span className="font-semibold">{refunds.filter((item) => item.status === "approved").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Refund total</span>
                    <span className="font-semibold">
                      {currencyFormatter.format(refunds.reduce((sum, item) => sum + item.amount, 0))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Revenue and finance reports</CardTitle>
                  <p className="text-sm text-muted-foreground">Monitor revenue, payments, unpaid balances, and export a downloadable report.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-sm text-muted-foreground">Collected payments</p>
                      <p className="text-xl font-semibold">{currencyFormatter.format(financeSummary?.totalCollectedPayments ?? 0)}</p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-sm text-muted-foreground">Net revenue</p>
                      <p className="text-xl font-semibold">{currencyFormatter.format(financeSummary?.netRevenue ?? 0)}</p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-sm text-muted-foreground">Students with unpaid balances</p>
                      <p className="text-xl font-semibold">{financeSummary?.unpaidStudentCount ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-sm text-muted-foreground">Active sponsorships</p>
                      <p className="text-xl font-semibold">{financeSummary?.activeSponsorshipCount ?? 0}</p>
                    </div>
                  </div>
                  <Button onClick={downloadFinanceReport} disabled={!hasPermission("reports:export")}>
                    Download finance report
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Recent invoice activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(reportData?.recentInvoices ?? []).map((invoice) => (
                    <button
                      key={invoice.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left hover:bg-secondary/20"
                      onClick={() => {
                        setSelectedInvoice(invoice)
                        setInvoiceDialogOpen(true)
                      }}
                    >
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{invoice.studentName}</p>
                      </div>
                      <Badge variant="outline">{invoice.status}</Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="mt-4">
              <ReportsExtraPanel />
            </div>
          </TabsContent>

          <TabsContent value="ledger">
            <LedgerPanel />
          </TabsContent>

          <TabsContent value="holds">
            <HoldsPanel />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedInvoice.invoiceNumber}</DialogTitle>
                <DialogDescription>{selectedInvoice.studentName} • {selectedInvoice.title}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-4">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold">{selectedInvoice.status}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Issue</p><p className="font-semibold">{selectedInvoice.issueDate}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Due</p><p className="font-semibold">{selectedInvoice.dueDate}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Balance</p><p className="font-semibold">{currencyFormatter.format(selectedInvoice.balanceDue)}</p></CardContent></Card>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/40">
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{currencyFormatter.format(item.unitAmount)}</TableCell>
                      <TableCell>{currencyFormatter.format(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => downloadInvoice(selectedInvoice)}>Download</Button>
                <Button onClick={() => printInvoice(selectedInvoice)}>Open / Print</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

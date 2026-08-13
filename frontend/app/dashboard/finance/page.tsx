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
import { Card, CardContent } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Plus, Receipt, Wallet, WalletCards } from "lucide-react"
import { LedgerPanel } from "@/components/finance/ledger-panel"
import { HoldsPanel } from "@/components/finance/holds-panel"
import { InvoicesPanel } from "@/components/finance/invoices-panel"
import { ReceiptsPanel } from "@/components/finance/receipts-panel"
import { UnpaidBalancesPanel } from "@/components/finance/unpaid-balances-panel"
import { PaymentsPanel } from "@/components/finance/payments-panel"
import { InstallmentPlansPanel } from "@/components/finance/installment-plans-panel"
import { SponsorshipsPanel } from "@/components/finance/sponsorships-panel"
import { RequestsPanel } from "@/components/finance/requests-panel"
import { RefundsPanel } from "@/components/finance/refunds-panel"
import { ReportsPanel } from "@/components/finance/reports-panel"
import { InvoiceDetailDialog } from "@/components/finance/invoice-detail-dialog"

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
      <head><title>${invoice.invoiceNumber}</title></head>
      <body style="font-family: sans-serif; padding: 32px;">
        <h2>${invoice.title}</h2>
        <p>${invoice.invoiceNumber} • ${invoice.studentName}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:12px 14px;border-bottom:2px solid #4d76aa;">Label</th>
              <th style="text-align:left;padding:12px 14px;border-bottom:2px solid #4d76aa;">Type</th>
              <th style="text-align:left;padding:12px 14px;border-bottom:2px solid #4d76aa;">Qty</th>
              <th style="text-align:left;padding:12px 14px;border-bottom:2px solid #4d76aa;">Unit</th>
              <th style="text-align:left;padding:12px 14px;border-bottom:2px solid #4d76aa;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;font-weight:600;">Balance due: ${currencyFormatter.format(invoice.balanceDue)}</p>
      </body>
    </html>
  `
}

function buildFinanceReportHtml(
  summary: FinanceSummaryResponse["summary"],
  invoices: FinanceInvoice[],
  unpaidBalances: UnpaidBalanceItem[],
) {
  const invoiceRows = invoices
    .slice(0, 25)
    .map(
      (invoice) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #dbe5f1;">${invoice.invoiceNumber}</td>
          <td style="padding:10px;border-bottom:1px solid #dbe5f1;">${invoice.studentName}</td>
          <td style="padding:10px;border-bottom:1px solid #dbe5f1;">${invoice.status}</td>
          <td style="padding:10px;border-bottom:1px solid #dbe5f1;">${currencyFormatter.format(invoice.balanceDue)}</td>
        </tr>
      `,
    )
    .join("")

  const balanceRows = unpaidBalances
    .slice(0, 25)
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #dbe5f1;">${item.studentName}</td>
          <td style="padding:10px;border-bottom:1px solid #dbe5f1;">${currencyFormatter.format(item.balance)}</td>
        </tr>
      `,
    )
    .join("")

  return `
    <html>
      <head><title>Finance report</title></head>
      <body style="font-family: sans-serif; padding: 32px;">
        <h2>Finance report — ${todayString()}</h2>
        <div style="display:flex;gap:24px;margin:16px 0;">
          <div><p>Revenue</p><p style="font-weight:700;">${currencyFormatter.format(summary.totalRevenue)}</p></div>
          <div><p>Collected</p><p style="font-weight:700;">${currencyFormatter.format(summary.totalCollectedPayments)}</p></div>
          <div><p>Pending balances</p><p style="font-weight:700;">${currencyFormatter.format(summary.totalPendingBalances)}</p></div>
          <div><p>Net revenue</p><p style="font-weight:700;">${currencyFormatter.format(summary.netRevenue)}</p></div>
        </div>
        <h3>Recent invoices</h3>
        <table style="width:100%;border-collapse:collapse;">${invoiceRows}</table>
        <h3 style="margin-top:24px;">Unpaid balances</h3>
        <table style="width:100%;border-collapse:collapse;">${balanceRows}</table>
      </body>
    </html>
  `
}

function buildReceiptHtml(options: {
  studentName: string
  studentId: string
  amount: number
  method: string
  note?: string
  date: string
}) {
  return `
    <html>
      <head><title>Receipt</title></head>
      <body style="font-family: sans-serif; padding: 32px;">
        <h2>Payment receipt</h2>
        <p>${options.studentName} (${options.studentId})</p>
        <p style="font-size:1.4rem;font-weight:700;">${currencyFormatter.format(options.amount)}</p>
        <p>Method: ${options.method}</p>
        ${options.note ? `<p>Note: ${options.note}</p>` : ""}
        <p>${options.date}</p>
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

  const openInvoiceDialog = (invoice: FinanceInvoice) => {
    setSelectedInvoice(invoice)
    setInvoiceDialogOpen(true)
  }

  const reportError = (title: string, description: string) => {
    toast({ variant: "destructive", title, description })
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
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-[2.4rem] font-semibold leading-tight tracking-[-0.02em] text-foreground">{currencyFormatter.format(financeSummary?.totalRevenue ?? 0)}</p>
              </div>
              <Receipt className="h-10 w-10 text-[#6d95c9]" />
            </CardContent>
          </Card>
          <Card className="border-[#dce7f7] bg-[#fbfdff]">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending balances</p>
                <p className="text-[2.4rem] font-semibold leading-tight tracking-[-0.02em] text-destructive">{currencyFormatter.format(financeSummary?.totalPendingBalances ?? 0)}</p>
              </div>
              <Wallet className="h-10 w-10 text-[#ef8d86]" />
            </CardContent>
          </Card>
          <Card className="border-[#dce7f7] bg-[#fbfdff]">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open invoices</p>
                <p className="text-[2.4rem] font-semibold leading-tight tracking-[-0.02em] text-foreground">{financeSummary?.openInvoiceCount ?? 0}</p>
              </div>
              <FileText className="h-10 w-10 text-[#6d95c9]" />
            </CardContent>
          </Card>
          <Card className="border-[#dce7f7] bg-[#fbfdff]">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending requests</p>
                <p className="text-[2.4rem] font-semibold leading-tight tracking-[-0.02em] text-foreground">{pendingRequestCount}</p>
              </div>
              <WalletCards className="h-10 w-10 text-[#6d95c9]" />
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
            <InvoicesPanel
              invoices={filteredInvoices}
              search={invoiceSearch}
              onSearchChange={setInvoiceSearch}
              onOpenInvoice={openInvoiceDialog}
            />
          </TabsContent>

          <TabsContent value="receipts">
            <ReceiptsPanel
              invoices={invoices}
              students={students}
              selectedStudentId={selectedInvoiceStudent}
              onSelectStudent={setSelectedInvoiceStudent}
            />
          </TabsContent>

          <TabsContent value="accounts">
            <UnpaidBalancesPanel unpaidBalances={unpaidBalances} onOpenInvoice={openInvoiceDialog} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsPanel
              payments={payments}
              pendingPayments={pendingPayments}
              expenses={expenses}
              studentMap={studentMap}
              financeSummary={financeSummary}
              canApprove={canApprove}
              onConfirmPayment={(payment) => void handleConfirmPayment(payment)}
            />
          </TabsContent>

          <TabsContent value="plans">
            <InstallmentPlansPanel
              plans={installmentPlans}
              students={students}
              canManage={canManage}
              onChanged={() => {
                toast({ title: "Installment plan created" })
                void loadFinanceData()
              }}
              onError={reportError}
            />
          </TabsContent>

          <TabsContent value="sponsorships">
            <SponsorshipsPanel
              sponsorships={sponsorships}
              students={students}
              canManage={canManage}
              onChanged={() => {
                toast({ title: "Sponsorship saved" })
                void loadFinanceData()
              }}
              onError={reportError}
            />
          </TabsContent>

          <TabsContent value="requests">
            <RequestsPanel
              requests={financeRequests}
              canApprove={canApprove}
              onDecision={(request, status) => void handleFinanceRequestDecision(request, status)}
            />
          </TabsContent>

          <TabsContent value="refunds">
            <RefundsPanel
              refunds={refunds}
              students={students}
              invoices={invoices}
              canManage={canManage}
              canApprove={canApprove}
              onApprove={(refund) => void handleApproveRefund(refund)}
              onChanged={() => {
                toast({ title: "Refund request created" })
                void loadFinanceData()
              }}
              onError={reportError}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsPanel
              financeSummary={financeSummary}
              recentInvoices={reportData?.recentInvoices ?? []}
              canExport={hasPermission("reports:export")}
              onDownloadReport={downloadFinanceReport}
              onOpenInvoice={openInvoiceDialog}
            />
          </TabsContent>

          <TabsContent value="ledger">
            <LedgerPanel />
          </TabsContent>

          <TabsContent value="holds">
            <HoldsPanel />
          </TabsContent>
        </Tabs>
      </div>

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        onDownload={downloadInvoice}
        onPrint={printInvoice}
      />
    </div>
  )
}

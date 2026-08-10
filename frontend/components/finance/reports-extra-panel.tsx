"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, TrendingUp, Zap } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  assessLateFees,
  downloadFinanceExportCsv,
  fetchNetIncomeTrend,
  fetchOutstandingBalanceReport,
  fetchReconciliation,
  type NetIncomeTrendPoint,
  type OutstandingBalanceReport,
  type ReconciliationSummary,
} from "@/lib/finance-api"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

const trendChartConfig: ChartConfig = {
  income: { label: "Income", color: "hsl(var(--chart-1, 221 83% 53%))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-2, 0 84% 60%))" },
  netIncome: { label: "Net income", color: "hsl(var(--chart-3, 142 71% 45%))" },
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function ReportsExtraPanel() {
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const canManage = hasPermission("finance:manage")

  const [reconciliation, setReconciliation] = useState<ReconciliationSummary | null>(null)
  const [outstanding, setOutstanding] = useState<OutstandingBalanceReport | null>(null)
  const [trend, setTrend] = useState<NetIncomeTrendPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [assessing, setAssessing] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    Promise.all([
      fetchReconciliation(controller.signal),
      fetchOutstandingBalanceReport(controller.signal),
      fetchNetIncomeTrend(12, controller.signal),
    ])
      .then(([r, o, t]) => {
        setReconciliation(r)
        setOutstanding(o)
        setTrend(t)
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  const handleAssessLateFees = async () => {
    setAssessing(true)
    try {
      const result = await assessLateFees()
      toast({ title: "Late fees assessed", description: `${result.assessedCount} overdue invoice(s) charged a late fee.` })
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to assess late fees", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setAssessing(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await downloadFinanceExportCsv()
      saveBlob(blob, `finance-export-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (err) {
      toast({ variant: "destructive", title: "Export failed", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Loading extended reports
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" /> Net income trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendChartConfig} className="h-[240px] w-full">
            <LineChart data={trend} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={56} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="netIncome" stroke="var(--color-netIncome)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Payment method reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ChartContainer config={trendChartConfig} className="h-[160px] w-full">
            <BarChart data={reconciliation?.byMethod ?? []} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="method" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={56} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-income)" radius={4} />
            </BarChart>
          </ChartContainer>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{reconciliation?.pendingCount ?? 0} pending</Badge>
            <Badge variant="outline">{reconciliation?.rejectedCount ?? 0} rejected</Badge>
            <Badge variant="secondary">{currencyFormatter.format(reconciliation?.totalConfirmed ?? 0)} confirmed</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card xl:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Outstanding balance report</CardTitle>
          {canManage && (
            <Button size="sm" variant="outline" disabled={assessing} onClick={handleAssessLateFees}>
              {assessing ? <Spinner className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
              Assess late fees
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {(outstanding?.byDepartment ?? []).slice(0, 6).map((dept) => (
              <div key={dept.department} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{dept.department}</p>
                <p className="text-lg font-semibold">{currencyFormatter.format(dept.totalBalance)}</p>
                <p className="text-xs text-muted-foreground">{dept.studentCount} student(s)</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Days past due</TableHead>
                  <TableHead>Aging</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(outstanding?.byStudent ?? []).slice(0, 15).map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell>{row.studentName}</TableCell>
                    <TableCell>{currencyFormatter.format(row.balance)}</TableCell>
                    <TableCell>{row.daysPastDue}</TableCell>
                    <TableCell>
                      <Badge variant={row.agingBucket === "current" ? "outline" : "destructive"}>{row.agingBucket}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Accounting export</CardTitle>
          <p className="text-sm text-muted-foreground">Export all payment transactions as a CSV, importable into QuickBooks Banking &gt; Upload transactions.</p>
        </CardHeader>
        <CardContent>
          <Button disabled={exporting} onClick={handleExport}>
            {exporting ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            Download CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

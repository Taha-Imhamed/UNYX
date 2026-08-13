"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportsExtraPanel } from "@/components/finance/reports-extra-panel"
import type { FinanceSummaryResponse } from "@/lib/finance-api"
import type { FinanceInvoice } from "@shared/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function ReportsPanel({
  financeSummary,
  recentInvoices,
  canExport,
  onDownloadReport,
  onOpenInvoice,
}: {
  financeSummary: FinanceSummaryResponse["summary"] | undefined
  recentInvoices: FinanceInvoice[]
  canExport: boolean
  onDownloadReport: () => void
  onOpenInvoice: (invoice: FinanceInvoice) => void
}) {
  return (
    <>
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
            <Button onClick={onDownloadReport} disabled={!canExport}>
              Download finance report
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Recent invoice activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentInvoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left hover:bg-secondary/20"
                onClick={() => onOpenInvoice(invoice)}
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
    </>
  )
}

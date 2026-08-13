"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FinanceInvoice } from "@shared/types"
import type { UnpaidBalanceItem } from "@/lib/finance-api"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function UnpaidBalancesPanel({
  unpaidBalances,
  onOpenInvoice,
}: {
  unpaidBalances: UnpaidBalanceItem[]
  onOpenInvoice: (invoice: FinanceInvoice) => void
}) {
  return (
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
                      <Button key={invoice.id} variant="outline" size="sm" onClick={() => onOpenInvoice(invoice)}>
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
  )
}

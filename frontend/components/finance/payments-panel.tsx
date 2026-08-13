"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FinanceSummaryResponse } from "@/lib/finance-api"
import type { PaymentTransaction, Student } from "@shared/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function getStudentName(student: Student) {
  return `${student.firstName} ${student.lastName}`
}

export function PaymentsPanel({
  payments,
  pendingPayments,
  expenses,
  studentMap,
  financeSummary,
  canApprove,
  onConfirmPayment,
}: {
  payments: PaymentTransaction[]
  pendingPayments: PaymentTransaction[]
  expenses: { amount: number }[]
  studentMap: Map<string, Student>
  financeSummary: FinanceSummaryResponse["summary"] | undefined
  canApprove: boolean
  onConfirmPayment: (payment: PaymentTransaction) => void
}) {
  return (
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
                    <Button size="sm" variant="outline" disabled={!canApprove} onClick={() => onConfirmPayment(payment)}>
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
  )
}

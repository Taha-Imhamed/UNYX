"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { createRefundRequest } from "@/lib/finance-api"
import type { FinanceInvoice, FinanceRefundRequest, Student } from "@shared/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function getStudentName(student: Student) {
  return `${student.firstName} ${student.lastName}`
}

export function RefundsPanel({
  refunds,
  students,
  invoices,
  canManage,
  canApprove,
  onApprove,
  onChanged,
  onError,
}: {
  refunds: FinanceRefundRequest[]
  students: Student[]
  invoices: FinanceInvoice[]
  canManage: boolean
  canApprove: boolean
  onApprove: (refund: FinanceRefundRequest) => void
  onChanged: () => void
  onError: (title: string, description: string) => void
}) {
  const [formOpen, setFormOpen] = useState(false)

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
      setFormOpen(false)
      onChanged()
    } catch (error) {
      onError("Refund request failed", error instanceof Error ? error.message : "Unable to create refund request")
    }
  }

  return (
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
                      onClick={() => onApprove(refund)}
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
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
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
  )
}

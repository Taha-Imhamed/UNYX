"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FinanceInvoice, Student } from "@shared/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

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

function downloadInvoiceHtml(invoice: FinanceInvoice) {
  const blob = new Blob([buildInvoiceHtml(invoice)], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${invoice.invoiceNumber}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function ReceiptsPanel({
  invoices,
  students,
  selectedStudentId,
  onSelectStudent,
}: {
  invoices: FinanceInvoice[]
  students: Student[]
  selectedStudentId: string
  onSelectStudent: (studentId: string) => void
}) {
  const receipts = invoices
    .filter((inv) => inv.studentId === selectedStudentId)
    .filter((inv) => (inv.title || "").toLowerCase().includes("receipt") || inv.lineItems.some((li) => li.label?.toLowerCase().includes("payment")))

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Receipts</CardTitle>
        <p className="text-sm text-muted-foreground">Download saved payment receipts for any student as PDF.</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <div>
            <Label>Student</Label>
            <Select value={selectedStudentId} onValueChange={onSelectStudent}>
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
              {receipts.map((inv) => (
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const popup = window.open("", "_blank")
                          if (!popup) return
                          popup.document.write(buildInvoiceHtml(inv))
                          popup.document.close()
                          popup.focus()
                          setTimeout(() => popup.print(), 300)
                        }}
                      >
                        Download PDF
                      </Button>
                      <Button size="sm" onClick={() => downloadInvoiceHtml(inv)}>Open</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

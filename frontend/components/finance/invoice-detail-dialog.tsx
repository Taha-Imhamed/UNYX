"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FinanceInvoice } from "@shared/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function InvoiceDetailDialog({
  invoice,
  open,
  onOpenChange,
  onDownload,
  onPrint,
}: {
  invoice: FinanceInvoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: (invoice: FinanceInvoice) => void
  onPrint: (invoice: FinanceInvoice) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {invoice && (
          <>
            <DialogHeader>
              <DialogTitle>{invoice.invoiceNumber}</DialogTitle>
              <DialogDescription>{invoice.studentName} • {invoice.title}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-4">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold">{invoice.status}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Issue</p><p className="font-semibold">{invoice.issueDate}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Due</p><p className="font-semibold">{invoice.dueDate}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Balance</p><p className="font-semibold">{currencyFormatter.format(invoice.balanceDue)}</p></CardContent></Card>
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
                {invoice.lineItems.map((item) => (
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
              <Button variant="outline" onClick={() => onDownload(invoice)}>Download</Button>
              <Button onClick={() => onPrint(invoice)}>Open / Print</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

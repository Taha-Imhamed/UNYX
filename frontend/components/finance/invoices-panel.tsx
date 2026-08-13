"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import type { FinanceInvoice } from "@shared/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function InvoicesPanel({
  invoices,
  search,
  onSearchChange,
  onOpenInvoice,
}: {
  invoices: FinanceInvoice[]
  search: string
  onSearchChange: (value: string) => void
  onOpenInvoice: (invoice: FinanceInvoice) => void
}) {
  return (
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
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
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
              {invoices.map((invoice) => (
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
                    <Button variant="outline" size="sm" onClick={() => onOpenInvoice(invoice)}>
                      Open invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
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
  )
}

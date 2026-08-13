"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FinanceRequest } from "@shared/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function RequestsPanel({
  requests,
  canApprove,
  onDecision,
}: {
  requests: FinanceRequest[]
  canApprove: boolean
  onDecision: (request: FinanceRequest, status: "approved" | "rejected" | "fulfilled") => void
}) {
  return (
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
              {requests.map((request) => (
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
                      <Button size="sm" variant="outline" disabled={!canApprove || request.status !== "pending"} onClick={() => onDecision(request, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" disabled={!canApprove || request.status !== "pending"} onClick={() => onDecision(request, "rejected")}>
                        Reject
                      </Button>
                      <Button size="sm" disabled={!canApprove || (request.status !== "approved" && request.status !== "pending")} onClick={() => onDecision(request, "fulfilled")}>
                        Fulfill
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
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
            <span className="font-semibold">{requests.filter((item) => item.status === "pending").length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Approved requests</span>
            <span className="font-semibold">{requests.filter((item) => item.status === "approved").length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Fulfilled requests</span>
            <span className="font-semibold">{requests.filter((item) => item.status === "fulfilled").length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Requested amount</span>
            <span className="font-semibold">
              {currencyFormatter.format(requests.reduce((sum, item) => sum + item.amount, 0))}
            </span>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-4 text-muted-foreground">
            Staff submit requests from <span className="font-medium text-foreground">/dashboard/requests</span>, and finance handles them here.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

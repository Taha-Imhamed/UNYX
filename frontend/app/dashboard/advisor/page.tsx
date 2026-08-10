"use client"

import { useEffect, useState } from "react"
import { DashboardRouteGuard } from "@/components/dashboard-route-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import {
  advisorApproveEnrollment,
  advisorMessageEnrollment,
  advisorRejectEnrollment,
  fetchEnrollments,
  type EnrollmentRecord,
} from "@/lib/enrollment-api"

const visibleStatuses = ["pendingAdvisorApproval", "pending_approval"] as const

function paymentLabel(record: EnrollmentRecord) {
  if (record.paymentStatus === "paid" || record.paymentVerified) return "Paid"
  return "Payment Required"
}

export default function AdvisorDashboardPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<EnrollmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [messageState, setMessageState] = useState<{ open: boolean; record: EnrollmentRecord | null; value: string }>({
    open: false,
    record: null,
    value: "Please complete your payment to proceed with enrollment approval.",
  })

  const load = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchEnrollments({ page: 1, pageSize: 200, status: [...visibleStatuses] })
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const interval = setInterval(() => void load(), 5000)
    return () => clearInterval(interval)
  }, [])

  const runAction = async (id: string, action: () => Promise<unknown>, successTitle: string, successDescription: string) => {
    try {
      setBusyId(id)
      await action()
      toast({ title: successTitle, description: successDescription })
      await load()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err instanceof Error ? err.message : "Please try again.",
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardRouteGuard allowedRoles={["advisor", "admin", "super-admin", "supervisor", "professor"]} redirectTo="/dashboard">
      <div className="flex h-full flex-col">
        <DashboardHeader title="Enrollment Approvals" description="Review student renewal requests, payment state, and advisor decisions" />
        <div className="flex-1 space-y-6 p-6 pt-4 md:pt-6">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Load failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Requests</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{items.length}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending Payment</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {items.filter((item) => paymentLabel(item) === "Payment Required").length}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ready To Approve</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {items.filter((item) => paymentLabel(item) === "Paid").length}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Approval Queue</CardTitle>
              <Button variant="outline" onClick={() => void load()} disabled={isLoading}>
                {isLoading ? <Spinner className="h-4 w-4" /> : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No renewal requests waiting.</p>
              ) : (
                <div className="space-y-4">
                  {items.map((record) => {
                    const loading = busyId === record.id
                    const unpaid = paymentLabel(record) === "Payment Required"
                    return (
                      <div key={record.id} className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold">
                                {record.student.firstName} {record.student.lastName}
                              </h3>
                              <Badge variant={unpaid ? "destructive" : "secondary"}>{paymentLabel(record)}</Badge>
                              <Badge variant={record.status === "pending_approval" ? "outline" : "secondary"}>
                                {record.status === "pending_approval" ? "Pending Payment" : "Pending Advisor Approval"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {record.student.displayId} · {record.student.email}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Course:</span> {record.courseTitle}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Tuition:</span> ${record.price.toFixed(2)}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Outstanding balance:</span> ${Number(record.student.balance ?? 0).toFixed(2)}
                            </p>
                            {record.latestAdvisorMessage ? (
                              <div className="rounded-xl bg-muted/60 p-3 text-sm">
                                <span className="font-medium">Latest advisor message:</span> {record.latestAdvisorMessage}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() =>
                                void runAction(
                                  record.id,
                                  () => advisorApproveEnrollment(record.id),
                                  "Enrollment approved",
                                  "Student notified.",
                                )
                              }
                              disabled={loading}
                            >
                              {loading ? <Spinner className="h-4 w-4" /> : "Approve"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                setMessageState({
                                  open: true,
                                  record,
                                  value: unpaid
                                    ? "Please complete your payment to proceed with enrollment approval."
                                    : "Please review your course selection and reply to this notice.",
                                })
                              }
                              disabled={loading}
                            >
                              Message
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                void runAction(
                                  record.id,
                                  () => advisorRejectEnrollment(record.id),
                                  "Enrollment rejected",
                                  "Student notified.",
                                )
                              }
                              disabled={loading}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={messageState.open}
        onOpenChange={(open) => setMessageState((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Advisor Message</DialogTitle>
          </DialogHeader>
          <Textarea
            value={messageState.value}
            onChange={(event) => setMessageState((prev) => ({ ...prev, value: event.target.value }))}
            className="min-h-32"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageState((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!messageState.record) return
                void runAction(
                  messageState.record.id,
                  () => advisorMessageEnrollment(messageState.record!.id, messageState.value),
                  "Message sent",
                  "Student notified.",
                ).then(() => {
                  setMessageState((prev) => ({ ...prev, open: false }))
                })
              }}
              disabled={!messageState.value.trim() || busyId === messageState.record?.id}
            >
              {busyId === messageState.record?.id ? <Spinner className="h-4 w-4" /> : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardRouteGuard>
  )
}

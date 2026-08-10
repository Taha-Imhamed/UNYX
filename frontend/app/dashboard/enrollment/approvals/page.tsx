"use client"

import { useState } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { DashboardHeader } from "@/components/dashboard-header"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import { pillButtonStyles } from "@/components/enrollment/shared"
import { useEnrollments } from "@/hooks/enrollment/use-enrollments"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  advisorApproveEnrollment,
  advisorRejectEnrollment,
  approvePaymentEnrollment,
  rejectPaymentEnrollment,
} from "@/lib/enrollment-api"

export default function EnrollmentApprovalsPage() {
  const { toast } = useToast()
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const canManageEnrollment = hasPermission("enrollment:manage") && user?.role !== "professor"
  const canViewEnrollment = canManageEnrollment || hasPermission("enrollment:view") || user?.role === "professor"
  const enabled = !authLoading && canViewEnrollment

  const { enrollments, isRefreshing, loadError, refresh: refreshEnrollmentList } = useEnrollments({
    enabled,
    refreshKey: refreshVersion,
  })

  const [manualRefreshing, setManualRefreshing] = useState(false)

  const pendingAdvisorApprovals = Array.isArray(enrollments)
    ? enrollments.filter((enr) => enr.status === "pendingAdvisorApproval")
    : []

  const pendingApprovals = Array.isArray(enrollments)
    ? enrollments.filter((enr) => enr.status === "pending_approval")
    : []

  const refreshEnrollments = async () => {
    if (!canViewEnrollment) return
    setManualRefreshing(true)
    try {
      await refreshEnrollmentList()
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh enrollments from the server.",
        variant: "destructive",
      })
    } finally {
      setManualRefreshing(false)
    }
  }

  const handleApprovePayment = async (id: string) => {
    try {
      await approvePaymentEnrollment(id)
      toast({ title: "Enrollment approved", description: "Payment verified; enrollment activated." })
      refreshEnrollments()
    } catch (error) {
      console.error("Approve payment failed", error)
      toast({ variant: "destructive", title: "Unable to approve", description: "Please try again." })
    }
  }

  const handleRejectPayment = async (id: string) => {
    try {
      await rejectPaymentEnrollment(id)
      toast({ title: "Enrollment rejected", description: "Request was rejected." })
      refreshEnrollments()
    } catch (error) {
      console.error("Reject payment failed", error)
      toast({ variant: "destructive", title: "Unable to reject", description: "Please try again." })
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!canViewEnrollment) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>You need enrollment view or manage permissions to access this area.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Pending Approvals" description="Review and act on enrollments awaiting approval" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav
            onRefresh={refreshEnrollments}
            isRefreshing={manualRefreshing || isRefreshing}
            bulkAction={
              <Button asChild className={`gap-2 ${pillButtonStyles.primary}`}>
                <Link href="/dashboard/enrollment/departments">Open/Close by Major &amp; Courses</Link>
              </Button>
            }
          />

          <div className="flex flex-1 flex-col gap-6">
            {loadError && (
              <Alert variant="destructive">
                <AlertTitle>Unable to load data</AlertTitle>
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            )}

            {/* Advisor approval requests */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Enrollment Requests — Awaiting Advisor Approval</CardTitle>
                  <p className="text-sm text-muted-foreground">Students who submitted enrollment requests pending advisor sign-off.</p>
                </div>
                <Badge variant="outline" className="border-border text-foreground">
                  {pendingAdvisorApprovals.length} pending
                </Badge>
              </CardHeader>
              <CardContent>
                {pendingAdvisorApprovals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No advisor approval requests.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-4">Student</th>
                          <th className="py-2 pr-4">Course</th>
                          <th className="py-2 pr-4">Balance</th>
                          <th className="py-2 pr-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pendingAdvisorApprovals.map((enr) => (
                          <tr key={enr.id} className="transition-colors hover:bg-secondary/20">
                            <td className="py-3 pr-4">
                              <div className="font-semibold text-foreground">
                                {enr.student.firstName} {enr.student.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">{enr.student.email}</div>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="font-semibold text-foreground">{enr.courseTitle}</div>
                              <div className="text-xs text-muted-foreground">{enr.courseCode ?? enr.displayId}</div>
                            </td>
                            <td className="py-3 pr-4 text-sm text-foreground">
                              <span className={enr.student.balance < 0 ? "text-red-600" : "text-green-600"}>
                                ${Number(enr.student.balance ?? 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className={pillButtonStyles.dangerOutline}
                                onClick={async () => {
                                  try {
                                    await advisorRejectEnrollment(enr.id)
                                    toast({ title: "Enrollment rejected", description: "Student notified." })
                                    refreshEnrollments()
                                  } catch (err) {
                                    toast({ variant: "destructive", title: "Reject failed", description: err instanceof Error ? err.message : "Please try again." })
                                  }
                                }}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className={pillButtonStyles.positive}
                                onClick={async () => {
                                  try {
                                    await advisorApproveEnrollment(enr.id)
                                    toast({ title: "Enrollment approved", description: "Student enrolled." })
                                    refreshEnrollments()
                                  } catch (err) {
                                    toast({ variant: "destructive", title: "Approve failed", description: err instanceof Error ? err.message : "Please try again." })
                                  }
                                }}
                              >
                                Approve
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment approval requests */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Enrollment Requests — Awaiting Payment Confirmation</CardTitle>
                  <p className="text-sm text-muted-foreground">Approve or reject enrollments awaiting payment confirmation.</p>
                </div>
                <Badge variant="outline" className="border-border text-foreground">
                  {pendingApprovals.length} pending
                </Badge>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending payment approvals.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-4">Student</th>
                          <th className="py-2 pr-4">Course</th>
                          <th className="py-2 pr-4">Payment status</th>
                          <th className="py-2 pr-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pendingApprovals.map((enr) => (
                          <tr key={enr.id} className="transition-colors hover:bg-secondary/20">
                            <td className="py-3 pr-4">
                              <div className="font-semibold text-foreground">
                                {enr.student.firstName} {enr.student.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">{enr.student.email}</div>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="font-semibold text-foreground">{enr.courseTitle}</div>
                              <div className="text-xs text-muted-foreground">{enr.displayId}</div>
                            </td>
                            <td className="py-3 pr-4 text-sm text-foreground">
                              {enr.student.balance > 0
                                ? `Balance due: $${enr.student.balance.toFixed(2)}`
                                : "Payment cleared"}
                            </td>
                            <td className="py-3 pr-4 text-right space-x-2">
                              <Button size="sm" variant="outline" className={pillButtonStyles.dangerOutline} onClick={() => handleRejectPayment(enr.id)}>
                                Reject
                              </Button>
                              <Button size="sm" className={pillButtonStyles.positive} onClick={() => handleApprovePayment(enr.id)}>
                                Approve
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

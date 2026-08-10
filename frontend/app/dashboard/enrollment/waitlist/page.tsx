"use client"

import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Clock, LockOpen, Trash2, Users } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import { pillButtonStyles } from "@/components/enrollment/shared"
import { useCourses } from "@/hooks/enrollment/use-courses"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  deleteEnrollmentRequest,
  fetchEnrollments,
  promoteWaitlistEnrollment,
  type EnrollmentRecord,
} from "@/lib/enrollment-api"

export default function EnrollmentWaitlistPage() {
  const { toast } = useToast()
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const canManageEnrollment = hasPermission("enrollment:manage") && user?.role !== "professor"
  const canViewEnrollment = canManageEnrollment || hasPermission("enrollment:view") || user?.role === "professor"
  const enabled = !authLoading && canViewEnrollment

  const { courses } = useCourses({ enabled, refreshKey: refreshVersion })

  const [waitlisted, setWaitlisted] = useState<EnrollmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [manualRefreshing, setManualRefreshing] = useState(false)
  const [actionPending, setActionPending] = useState<Record<string, boolean>>({})

  const loadWaitlist = async () => {
    setLoadError(null)
    try {
      const page = await fetchEnrollments({ status: "waitlisted", pageSize: 200 })
      setWaitlisted(page.items)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load waitlist")
    }
  }

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    loadWaitlist().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refreshVersion])

  const handleRefresh = async () => {
    setManualRefreshing(true)
    try {
      await loadWaitlist()
    } catch {
      toast({ title: "Refresh failed", description: "Unable to refresh the waitlist.", variant: "destructive" })
    } finally {
      setManualRefreshing(false)
    }
  }

  const groupedByCourse = useMemo(() => {
    const groups = new Map<string, EnrollmentRecord[]>()
    waitlisted.forEach((enr) => {
      const bucket = groups.get(enr.courseId) ?? []
      bucket.push(enr)
      groups.set(enr.courseId, bucket)
    })
    // FIFO order within each course, oldest request first
    groups.forEach((list) => list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
    return Array.from(groups.entries()).map(([courseId, entries]) => {
      const course = courses.find((c) => c.id === courseId)
      const enrolledCount = (course as (typeof course & { enrolledCount?: number }))?.enrolledCount ?? 0
      const capacity = course?.capacity ?? 0
      const openSeats = Math.max(0, capacity - enrolledCount)
      return {
        courseId,
        courseTitle: entries[0]?.courseTitle ?? course?.title ?? courseId,
        courseCode: course?.code ?? course?.displayId ?? courseId,
        capacity,
        enrolledCount,
        openSeats,
        entries,
      }
    })
  }, [courses, waitlisted])

  const handlePromote = async (enrollment: EnrollmentRecord) => {
    setActionPending((prev) => ({ ...prev, [enrollment.id]: true }))
    try {
      await promoteWaitlistEnrollment(enrollment.id)
      toast({ title: "Student promoted", description: `${enrollment.student.firstName} ${enrollment.student.lastName} moved off the waitlist.` })
      await loadWaitlist()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to promote",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setActionPending((prev) => ({ ...prev, [enrollment.id]: false }))
    }
  }

  const handleRemove = async (enrollment: EnrollmentRecord) => {
    setActionPending((prev) => ({ ...prev, [enrollment.id]: true }))
    try {
      await deleteEnrollmentRequest(enrollment.id)
      toast({ title: "Removed from waitlist" })
      await loadWaitlist()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to remove",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setActionPending((prev) => ({ ...prev, [enrollment.id]: false }))
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
      <DashboardHeader title="Waitlist" description="Students waiting for a seat, grouped by course" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav onRefresh={handleRefresh} isRefreshing={manualRefreshing} />

          {loadError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load waitlist</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-1 flex-col gap-4">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading waitlist…
              </div>
            ) : groupedByCourse.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="py-16 text-center text-sm text-muted-foreground">
                  No students are currently waitlisted.
                </CardContent>
              </Card>
            ) : (
              groupedByCourse.map((group) => (
                <Card key={group.courseId} className="border-border bg-card">
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4 text-primary" />
                        {group.courseTitle}
                        <span className="text-xs font-normal text-muted-foreground">{group.courseCode}</span>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {group.entries.length} waiting · {group.enrolledCount}/{group.capacity} seats filled
                      </p>
                    </div>
                    <Badge variant={group.openSeats > 0 ? "default" : "outline"} className="gap-1 w-fit">
                      <Users className="h-3 w-3" />
                      {group.openSeats > 0 ? `${group.openSeats} seat(s) open` : "Full"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.entries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 justify-center">#{index + 1}</Badge>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {entry.student.firstName} {entry.student.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.student.email} · waiting since {new Date(entry.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {canManageEnrollment ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className={pillButtonStyles.positive}
                              variant="outline"
                              disabled={actionPending[entry.id] || group.openSeats === 0}
                              title={group.openSeats === 0 ? "No open seats in this course" : undefined}
                              onClick={() => handlePromote(entry)}
                            >
                              {actionPending[entry.id] ? <Spinner className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                              Promote
                            </Button>
                            <Button
                              size="sm"
                              className={pillButtonStyles.dangerOutline}
                              variant="outline"
                              disabled={actionPending[entry.id]}
                              onClick={() => handleRemove(entry)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

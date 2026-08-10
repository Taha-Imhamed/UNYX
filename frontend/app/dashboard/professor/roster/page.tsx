"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { RosterList } from "@/components/enrollment/RosterList"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import { fetchEnrollments, type EnrollmentRecord } from "@/lib/enrollment-api"

const rosterStatusMeta = {
  active: { label: "Active", badge: "default" as const },
  pending: { label: "Pending", badge: "secondary" as const },
  pendingSupervisorApproval: { label: "Pending Supervisor Approval", badge: "outline" as const },
  pendingAdvisorApproval: { label: "Pending Advisor Approval", badge: "outline" as const },
  waitlisted: { label: "Waitlisted", badge: "outline" as const },
  completed: { label: "Completed", badge: "default" as const },
  cancelled: { label: "Cancelled", badge: "destructive" as const },
}

const PAGE_SIZE = 200

export default function ProfessorRosterPage() {
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse } = useProfessorCourseWorkspace()
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [selectedCourseId])

  useEffect(() => {
    if (!selectedCourseId) {
      setEnrollments([])
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    fetchEnrollments({ courseId: selectedCourseId, page, pageSize: PAGE_SIZE, signal: controller.signal })
      .then((payload) => {
        setEnrollments(payload.items)
        setTotalPages(Math.max(1, Math.ceil(payload.total / PAGE_SIZE)))
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load roster")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [selectedCourseId, page])

  const rosterRows = useMemo(
    () =>
      enrollments.map((enrollment) => ({
        id: enrollment.id,
        title: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        email: enrollment.student.email,
        status: enrollment.status,
        branch: (enrollment.branch as string | undefined) || selectedCourse?.branch || undefined,
        sectionId: enrollment.sectionId as string | undefined,
      })),
    [enrollments, selectedCourse?.branch],
  )

  return (
    <div className="space-y-6">
      <DashboardHeader title="Student Roster" description="Students enrolled in your courses" />
      <ProfessorTabNav />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Select course</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessorCourseSelect
            courses={courses}
            selectedCourseId={selectedCourseId}
            onChange={setSelectedCourseId}
            isLoading={isLoadingCourses}
          />
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Roster</CardTitle>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Page {page} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1 || isLoading}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages || isLoading}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading roster...</p>
          ) : rosterRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
          ) : (
            <RosterList rows={rosterRows} statusMeta={rosterStatusMeta} readOnly />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

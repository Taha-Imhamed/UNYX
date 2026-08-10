"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import { fetchEnrollments, type EnrollmentRecord } from "@/lib/enrollment-api"

function deriveGradeTotal(enrollment: EnrollmentRecord) {
  if (typeof enrollment.gradeTotal === "number") return enrollment.gradeTotal
  const parts = [enrollment.gradeMidterm, enrollment.gradeFinal, enrollment.gradeProject, enrollment.gradeParticipation].filter(
    (value): value is number => typeof value === "number",
  )
  if (parts.length === 0) return null
  return Number(parts.reduce((sum, value) => sum + value, 0).toFixed(2))
}

export default function ProfessorAnalyticsPage() {
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, workspace } = useProfessorCourseWorkspace()
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])

  useEffect(() => {
    if (!selectedCourseId) {
      setEnrollments([])
      return
    }
    const controller = new AbortController()
    fetchEnrollments({ courseId: selectedCourseId, page: 1, pageSize: 500, signal: controller.signal })
      .then((payload) => setEnrollments(payload.items))
      .catch(() => undefined)
    return () => controller.abort()
  }, [selectedCourseId])

  const attendanceRateByStudent = useMemo(() => {
    const sessions = workspace?.attendanceSessions ?? []
    const totals = new Map<string, { present: number; total: number }>()
    sessions.forEach((session) => {
      session.records.forEach((record) => {
        const current = totals.get(record.studentId) ?? { present: 0, total: 0 }
        const credit = record.status === "present" || record.status === "late" ? 1 : record.status === "excused" ? 0.5 : 0
        totals.set(record.studentId, { present: current.present + credit, total: current.total + 1 })
      })
    })
    return totals
  }, [workspace])

  const progressRows = useMemo(
    () =>
      enrollments.map((enrollment) => {
        const attendance = attendanceRateByStudent.get(enrollment.studentId)
        const grade = deriveGradeTotal(enrollment)
        const attendanceRate = attendance && attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0
        return { enrollment, attendanceRate, grade, isPassing: grade !== null ? grade >= 50 : false }
      }),
    [attendanceRateByStudent, enrollments],
  )

  const averageAttendance = progressRows.length
    ? Math.round(progressRows.reduce((sum, row) => sum + row.attendanceRate, 0) / progressRows.length)
    : 0

  return (
    <div className="space-y-6">
      <DashboardHeader title="Analytics" description="Attendance and engagement analytics" />
      <ProfessorTabNav />

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Select course</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessorCourseSelect courses={courses} selectedCourseId={selectedCourseId} onChange={setSelectedCourseId} isLoading={isLoadingCourses} />
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Attendance analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/25 p-4">
              <p className="text-sm text-muted-foreground">Sessions tracked</p>
              <p className="text-2xl font-semibold">{workspace?.attendanceSessions.length ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/25 p-4">
              <p className="text-sm text-muted-foreground">Average attendance</p>
              <p className="text-2xl font-semibold">{averageAttendance}%</p>
            </div>
          </div>
          {progressRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Attendance analytics appear after roster and sessions exist.</p>
          ) : (
            progressRows.map((row) => (
              <div key={row.enrollment.id} className="rounded-xl border border-border bg-secondary/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{row.enrollment.student.firstName} {row.enrollment.student.lastName}</p>
                  <Badge variant={row.attendanceRate >= 75 ? "default" : row.attendanceRate > 0 ? "secondary" : "destructive"}>
                    {row.attendanceRate}%
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Grade {row.grade ?? "Not graded"} • {row.isPassing ? "Pass" : row.grade === null ? "Pending" : "Fail"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

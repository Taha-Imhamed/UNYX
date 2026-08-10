"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import { fetchEnrollments, type EnrollmentRecord } from "@/lib/enrollment-api"
import { fetchQuestions, type Question } from "@/lib/questions-api"

function deriveGradeTotal(enrollment: EnrollmentRecord) {
  if (typeof enrollment.gradeTotal === "number") return enrollment.gradeTotal
  const parts = [enrollment.gradeMidterm, enrollment.gradeFinal, enrollment.gradeProject, enrollment.gradeParticipation].filter(
    (value): value is number => typeof value === "number",
  )
  if (parts.length === 0) return null
  return Number(parts.reduce((sum, value) => sum + value, 0).toFixed(2))
}

export default function ProfessorReportsPage() {
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, workspace } = useProfessorCourseWorkspace()
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [questions, setQuestions] = useState<Question[]>([])

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

  useEffect(() => {
    const controller = new AbortController()
    fetchQuestions(controller.signal)
      .then((items) => setQuestions(items))
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

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

  const gradedRows = progressRows.filter((row) => row.grade !== null)
  const passCount = gradedRows.filter((row) => row.isPassing).length
  const failCount = gradedRows.filter((row) => !row.isPassing).length
  const averageGrade = gradedRows.length
    ? Number((gradedRows.reduce((sum, row) => sum + (row.grade ?? 0), 0) / gradedRows.length).toFixed(1))
    : 0
  const courseQuestions = questions.filter((q) => q.courseId === selectedCourseId)
  const answeredQuestionCount = courseQuestions.filter((question) => question.reply).length

  return (
    <div className="space-y-6">
      <DashboardHeader title="Pass/Fail Report" description="Pass/fail counts and course engagement" />
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
          <CardTitle>Pass/fail and engagement report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/25 p-4">
              <p className="text-sm text-muted-foreground">Pass count</p>
              <p className="text-2xl font-semibold">{passCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/25 p-4">
              <p className="text-sm text-muted-foreground">Fail count</p>
              <p className="text-2xl font-semibold">{failCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/25 p-4">
              <p className="text-sm text-muted-foreground">Average grade</p>
              <p className="text-2xl font-semibold">{averageGrade}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/25 p-4">
              <p className="text-sm text-muted-foreground">Questions answered</p>
              <p className="text-2xl font-semibold">{answeredQuestionCount}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-secondary/25 p-4">
            <p className="text-sm text-muted-foreground">Engagement report</p>
            <p className="mt-2 text-sm">
              {workspace?.assignments.length ?? 0} assignments • {workspace?.quizzes.length ?? 0} quizzes • {workspace?.messages.length ?? 0} messages • {workspace?.announcements.length ?? 0} announcements
            </p>
          </div>
          {progressRows.map((row) => (
            <div key={row.enrollment.id} className="rounded-xl border border-border bg-secondary/25 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{row.enrollment.student.firstName} {row.enrollment.student.lastName}</p>
                <Badge variant={row.isPassing ? "default" : row.grade === null ? "outline" : "destructive"}>
                  {row.grade === null ? "Pending" : row.isPassing ? "Pass" : "Fail"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Grade {row.grade ?? "Not graded"} • Attendance {row.attendanceRate}% • Email {row.enrollment.student.email}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle2, Circle } from "lucide-react"
import { useStudentEnrollments, useStudentProfile } from "@/hooks/use-student-portal"
import { fetchAcademicStructure, fetchCourses, type AcademicMajor } from "@/lib/enrollment-api"
import { fetchMyTransferCredits } from "@/lib/registrar-api"
import type { Course, TransferCredit } from "@shared/types"
import { StudentFeatureGate } from "@/components/student-feature-gate"

const PASSING_STATUSES = new Set(["active", "completed"])

export default function DegreeAuditPage() {
  return (
    <StudentFeatureGate featureKey="degree-audit">
      <DegreeAuditPageInner />
    </StudentFeatureGate>
  )
}

function DegreeAuditPageInner() {
  const { profile } = useStudentProfile()
  const { enrollments, isLoading: enrollmentsLoading } = useStudentEnrollments()
  const [major, setMajor] = useState<AcademicMajor | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [transferCredits, setTransferCredits] = useState<TransferCredit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    const controller = new AbortController()
    setIsLoading(true)
    Promise.all([
      fetchAcademicStructure(controller.signal),
      fetchCourses({ openOnly: false, limit: 500, signal: controller.signal }),
      fetchMyTransferCredits(controller.signal),
    ])
      .then(([structure, allCourses, credits]) => {
        const matchedMajor =
          structure.majors.find((m) => m.id === profile.programId) ??
          structure.majors.find((m) => m.name === profile.major) ??
          null
        setMajor(matchedMajor)
        setCourses(allCourses)
        setTransferCredits(credits)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load degree requirements")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [profile])

  const completedCourseIds = useMemo(() => {
    const ids = new Set<string>()
    enrollments.forEach((enrollment) => {
      if (PASSING_STATUSES.has(enrollment.status)) ids.add(enrollment.courseId)
    })
    return ids
  }, [enrollments])

  const requiredCourses = useMemo(() => {
    if (!major) return []
    const courseMap = new Map(courses.map((course) => [course.id, course]))
    return major.courseIds
      .map((id) => courseMap.get(id))
      .filter((course): course is Course => Boolean(course))
  }, [major, courses])

  const completedRequired = requiredCourses.filter((course) => completedCourseIds.has(course.id))
  const remainingRequired = requiredCourses.filter((course) => !completedCourseIds.has(course.id))
  const totalCreditsRequired = requiredCourses.reduce((sum, course) => sum + (course.creditHours ?? 0), 0)
  const approvedTransferCredits = transferCredits.filter((credit) => credit.status === "approved")
  const transferCreditHours = approvedTransferCredits.reduce((sum, credit) => sum + (credit.creditHours ?? 0), 0)
  const totalCreditsEarned = completedRequired.reduce((sum, course) => sum + (course.creditHours ?? 0), 0) + transferCreditHours
  const progressPercent = requiredCourses.length > 0 ? Math.round((completedRequired.length / requiredCourses.length) * 100) : 0

  const loading = isLoading || enrollmentsLoading

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Degree Audit</p>
        <h1 className="text-2xl font-bold text-foreground">Graduation progress</h1>
        <p className="text-sm text-muted-foreground">
          {major ? `${major.name} • ${major.years} year program` : "Track your progress toward your degree requirements."}
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Loading
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && !major && (
        <Card className="border border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              We couldn't match your program to a defined major requirements list yet. Contact your advisor to have your program linked.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && major && (
        <>
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle>Overall progress</CardTitle>
              <CardDescription>
                {completedRequired.length} of {requiredCourses.length} required courses completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="text-lg font-semibold text-foreground">{progressPercent}%</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Courses done</p>
                  <p className="text-lg font-semibold text-foreground">{completedRequired.length}/{requiredCourses.length}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Credits earned</p>
                  <p className="text-lg font-semibold text-foreground">{totalCreditsEarned}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Credits required</p>
                  <p className="text-lg font-semibold text-foreground">{totalCreditsRequired}</p>
                </div>
              </div>
              {transferCreditHours > 0 && (
                <p className="text-xs text-muted-foreground">
                  Includes {transferCreditHours} transfer credit{transferCreditHours === 1 ? "" : "s"} applied from {approvedTransferCredits.length} approved course{approvedTransferCredits.length === 1 ? "" : "s"}.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle>Remaining requirements</CardTitle>
              <CardDescription>Courses you still need to complete for your degree.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {remainingRequired.length === 0 ? (
                <p className="text-sm text-muted-foreground">All required courses complete. Nice work.</p>
              ) : (
                remainingRequired.map((course) => (
                  <div key={course.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{course.code} — {course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.creditHours ?? 0} credits</p>
                      </div>
                    </div>
                    <Badge variant="outline">Not taken</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle>Completed requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {completedRequired.length === 0 ? (
                <p className="text-sm text-muted-foreground">No required courses completed yet.</p>
              ) : (
                completedRequired.map((course) => (
                  <div key={course.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{course.code} — {course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.creditHours ?? 0} credits</p>
                      </div>
                    </div>
                    <Badge>Complete</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

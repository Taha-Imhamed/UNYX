"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { ScheduleGrid } from "@/components/enrollment/ScheduleGrid"
import { useToast } from "@/hooks/use-toast"
import {
  useAvailableCourses,
  useEnrollmentWindow,
  useEnrollInCourse,
  useStudentEnrollments,
  useStudentFinancials,
  useStudentProfile,
} from "@/hooks/use-student-portal"
import { previewStudentSchedule } from "@/lib/students-api"
import { cancelSelfEnrollment } from "@/lib/students-api"
import { fetchWaitlistPosition } from "@/lib/enrollment-api"
import { deriveStudentYearLevel } from "@/lib/academic-terms"
import { CalendarClock, CheckCircle2, GraduationCap, Lock, Trash2, XCircle } from "lucide-react"
import type { CourseAvailability, CourseScheduleEntry, Enrollment, EnrollmentStatus, Student } from "@shared/types"
import { StudentFeatureGate } from "@/components/student-feature-gate"

function deriveAcademicYear(student: Pick<Student, "yearLevel" | "currentYear" | "currentSemester"> | null | undefined, enrollmentDate?: string | null) {
  const yearLevel = deriveStudentYearLevel(student)
  if (yearLevel) return { year: yearLevel, label: `Year ${yearLevel}` }

  if (enrollmentDate) {
    const start = new Date(enrollmentDate)
    if (!Number.isNaN(start.getTime())) {
      const now = new Date()
      const years = Math.max(1, now.getFullYear() - start.getFullYear() + 1)
      return { year: years, label: `Year ${years}` }
    }
  }

  return { year: null, label: "Year not set" }
}

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return "Dates TBA"
  if (!start) return `Until ${end}`
  if (!end) return `From ${start}`
  return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`
}

function WaitlistPositionNote({ enrollmentId }: { enrollmentId: string }) {
  const [position, setPosition] = useState<number | null>(null)
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchWaitlistPosition(enrollmentId, controller.signal)
      .then((data) => {
        setPosition(data.position)
        setTotal(data.totalWaitlisted)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPosition(null)
          setTotal(null)
        }
      })
    return () => controller.abort()
  }, [enrollmentId])

  if (position === null) return null
  return (
    <p className="text-xs text-muted-foreground">
      Waitlist position {position} of {total}
    </p>
  )
}

export default function StudentEnrollPage() {
  return (
    <StudentFeatureGate featureKey="enroll">
      <StudentEnrollPageInner />
    </StudentFeatureGate>
  )
}

function StudentEnrollPageInner() {
  const { toast } = useToast()
  const { profile } = useStudentProfile()
  const { financials } = useStudentFinancials()
  const { enrollmentWindow, isLoading: enrollmentWindowLoading } = useEnrollmentWindow()
  const { enrollments, isLoading: enrollmentsLoading, error: enrollmentsError, reload: reloadEnrollments } = useStudentEnrollments()
  const { courses, isLoading: coursesLoading, error: coursesError, reload: reloadCourses } = useAvailableCourses(Boolean(profile))
  const { enroll, error: enrollError } = useEnrollInCourse()

  const [planSelection, setPlanSelection] = useState<string[]>([])
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [planResult, setPlanResult] = useState<{
    sessions: Array<
      CourseScheduleEntry & {
        courseId: string
        courseTitle: string
        courseCode?: string
        status: EnrollmentStatus | "proposed"
        source: "existing" | "proposed"
      }
    >
    conflicts: Array<{ day: string; courseIds: string[]; range: string }>
  } | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<{ success?: string; error?: string }>({})
  const [submittingAll, setSubmittingAll] = useState(false)
  const previewAbortRef = useRef<AbortController | null>(null)
  const lastPreviewId = useRef(0)
  const MAX_COURSES_PER_TERM = 5

  const yearInfo = useMemo(() => deriveAcademicYear(profile, profile?.enrollmentDate), [profile])

  const balance = Number(financials?.balance ?? profile?.balance ?? 0)
  const isFullyPaid = Number.isFinite(balance) ? balance <= 0 : false
  const registrationOpen = enrollmentWindow?.enrollmentOpen !== false
  const isFirstYear = yearInfo.year === 1
  const canManageEnrollment = registrationOpen && !isFirstYear
  const enrollmentBlockedReason = isFirstYear
    ? "First-year enrollment is assigned automatically by the registrar."
    : !registrationOpen
      ? enrollmentWindow?.enrollmentMessage || "Enrollment is closed."
      : null

  const [courseSearch, setCourseSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  const departmentOptions = useMemo(() => {
    const set = new Set<string>()
    courses.forEach((course) => {
      if (course.department) set.add(course.department)
    })
    return Array.from(set).sort()
  }, [courses])

  const availableCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase()
    return courses.filter((course) => {
      if (departmentFilter !== "all" && course.department !== departmentFilter) return false
      if (!q) return true
      return (
        course.title.toLowerCase().includes(q) ||
        course.code.toLowerCase().includes(q) ||
        (course.professorName ?? "").toLowerCase().includes(q)
      )
    })
  }, [courses, courseSearch, departmentFilter])

  // Look up in all courses (not just year-filtered) so selected items stay visible
  const selectedCourses = useMemo(
    () =>
      planSelection
        .map((id) => (courses as CourseAvailability[]).find((c) => c.id === id))
        .filter(Boolean) as CourseAvailability[],
    [courses, planSelection],
  )

  const submittedEnrollments = useMemo(
    () =>
      enrollments.filter((enrollment) =>
        ["pending", "pending_approval", "pendingAdvisorApproval", "pendingSupervisorApproval", "active", "rejected", "cancelled", "waitlisted"].includes(enrollment.status),
      ),
    [enrollments],
  )

  const calendarSessions = useMemo(() => {
    const activeEnrollments = enrollments.filter((enr) =>
      ["active", "pending", "pendingSupervisorApproval", "pendingAdvisorApproval", "pending_approval", "waitlisted"].includes(enr.status),
    )

    const existing = activeEnrollments.flatMap((enr) => {
      if (!Array.isArray(enr.courseSchedule)) return []
      return enr.courseSchedule.map((slot, idx) => ({
        ...slot,
        id: `${enr.id}-${idx}`,
        courseId: enr.courseId,
        courseTitle: enr.courseTitle,
        courseCode: enr.courseCode ?? enr.displayId ?? enr.courseId,
        status: enr.status,
      }))
    })

    const preview = (planResult?.sessions ?? []).map((slot, idx) => ({
      ...slot,
      id: `preview-${slot.courseId}-${idx}`,
      courseCode: slot.courseCode ?? slot.courseId,
    }))

    return [...existing, ...preview]
  }, [enrollments, planResult])

  const runPlanPreview = useCallback(async (selection: string[]) => {
    if (!profile?.id) return
    if (selection.length === 0) {
      setPlanResult(null)
      setPlanError(null)
      return
    }
    setPlanLoading(true)
    setPlanError(null)
    const controller = new AbortController()
    previewAbortRef.current?.abort()
    previewAbortRef.current = controller
    const requestId = ++lastPreviewId.current
    try {
      const result = await previewStudentSchedule(selection, profile.id, controller.signal)
      if (requestId !== lastPreviewId.current) return
      setPlanResult(result)
    } catch (error) {
      if (requestId !== lastPreviewId.current) return
      setPlanError(error instanceof Error ? error.message : "Unable to preview schedule.")
    } finally {
      if (requestId === lastPreviewId.current) setPlanLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    void runPlanPreview(planSelection)
  }, [planSelection, runPlanPreview])

  const toggleCourse = useCallback((courseId: string) => {
    if (!canManageEnrollment) {
      toast({
        variant: "destructive",
        title: "Enrollment locked",
        description: enrollmentBlockedReason ?? "Enrollment is not available.",
      })
      return
    }

    setPlanSelection((prev) => {
      const exists = prev.includes(courseId)
      if (!exists && prev.length >= MAX_COURSES_PER_TERM) {
        toast({
          variant: "destructive",
          title: "Limit reached",
          description: `You can select up to ${MAX_COURSES_PER_TERM} classes.`,
        })
        return prev
      }
      return exists ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    })
  }, [canManageEnrollment, enrollmentBlockedReason, toast])

  const removeSelectedCourse = useCallback((courseId: string) => {
    setPlanSelection((prev) => prev.filter((id) => id !== courseId))
  }, [])

  const handleCancelEnrollment = useCallback(async (enrollmentId: string) => {
    setCancellingId(enrollmentId)
    try {
      await cancelSelfEnrollment(enrollmentId)
      reloadEnrollments()
      reloadCourses()
      toast({ title: "Request cancelled" })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Cancel failed",
        description: err instanceof Error ? err.message : "Unable to cancel request",
      })
    } finally {
      setCancellingId(null)
    }
  }, [reloadCourses, reloadEnrollments, toast])

  const handleSubmitAll = useCallback(async () => {
    if (!canManageEnrollment) {
      setSubmitStatus({ error: enrollmentBlockedReason ?? "Enrollment is not available." })
      return
    }
    if (!planSelection.length) return

    setSubmittingAll(true)
    setSubmitStatus({})
    const failures: string[] = []

    for (const courseId of planSelection) {
      // eslint-disable-next-line no-await-in-loop
      const result = await enroll(courseId)
      if (!result.success) failures.push(`${courseId}: ${result.error ?? "Unable to submit"}`)
    }

    reloadEnrollments()
    reloadCourses()
    setSubmittingAll(false)

    if (failures.length) {
      setSubmitStatus({ error: failures.join("; ") })
      return
    }

    setSubmitStatus({
      success: "Saved and sent to advisor.",
    })
    setPlanSelection([])
    setPlanResult(null)
  }, [canManageEnrollment, enrollmentBlockedReason, enroll, isFullyPaid, planSelection, reloadCourses, reloadEnrollments])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Enrollment Renewal</p>
            <h1 className="text-2xl font-bold text-foreground">Select classes and send to advisor</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-border text-foreground">
              <GraduationCap className="mr-1 h-3.5 w-3.5" /> {yearInfo.label}
            </Badge>
            <Badge variant={isFullyPaid ? "secondary" : "destructive"} className="border-border">
              {isFullyPaid ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Lock className="mr-1 h-3.5 w-3.5" />}
              {isFullyPaid ? "Fully paid" : `Outstanding: $${balance.toFixed(2)}`}
            </Badge>
            <Badge variant={registrationOpen ? "secondary" : "outline"} className="border-border text-foreground">
              {enrollmentWindowLoading ? "Checking..." : registrationOpen ? "Open" : "Closed"}
            </Badge>
          </div>
        </div>

        {submitStatus.success ? (
          <Alert>
            <AlertTitle>Done</AlertTitle>
            <AlertDescription>{submitStatus.success}</AlertDescription>
          </Alert>
        ) : null}

        {submitStatus.error ? (
          <Alert variant="destructive">
            <AlertTitle>Submit failed</AlertTitle>
            <AlertDescription>{submitStatus.error}</AlertDescription>
          </Alert>
        ) : null}

        {enrollmentBlockedReason ? (
          <Alert variant="destructive">
            <AlertTitle>Enrollment unavailable</AlertTitle>
            <AlertDescription>{enrollmentBlockedReason}</AlertDescription>
          </Alert>
        ) : null}

        {!isFullyPaid && !enrollmentBlockedReason ? (
          <Alert>
            <AlertTitle>Billing reminder</AlertTitle>
            <AlertDescription>
              Tuition is tracked separately from class requests. You can still select classes and send them to your advisor.
            </AlertDescription>
          </Alert>
        ) : null}

        {enrollmentsError ? (
          <Alert variant="destructive">
            <AlertTitle>Enrollment load failed</AlertTitle>
            <AlertDescription>{enrollmentsError}</AlertDescription>
          </Alert>
        ) : null}

        {coursesError || enrollError || planError ? (
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{coursesError || enrollError || planError}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle>Available Classes</CardTitle>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Search by title, code, or professor..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="sm:max-w-xs"
              />
              {departmentOptions.length > 0 && (
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All departments</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner className="h-5 w-5" />
              </div>
            ) : availableCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes available now.</p>
            ) : (
              <ScrollArea className="h-[520px] pr-4">
                <div className="space-y-3">
                  {availableCourses.map((course) => {
                    const selected = planSelection.includes(course.id)
                    const seats = course.availableSeats ?? 0
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => toggleCourse(course.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{course.code} - {course.title}</p>
                            <p className="text-sm text-muted-foreground">{course.professorName}</p>
                            <p className="text-sm text-muted-foreground">{formatDateRange(course.startDate, course.endDate)}</p>
                          </div>
                          <Badge variant={selected ? "secondary" : "outline"}>
                            {selected ? "Selected" : `${seats} seats`}
                          </Badge>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle>Selected Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{selectedCourses.length} selected</Badge>
              <Badge variant="outline">Max {MAX_COURSES_PER_TERM}</Badge>
            </div>

            {selectedCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Choose classes from the left side.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedCourses.map((course) => (
                  <div key={course.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{course.code} - {course.title}</p>
                        <p className="text-sm text-muted-foreground">{course.professorName}</p>
                        <p className="text-sm text-muted-foreground">{course.branch || course.location || "Main campus"}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeSelectedCourse(course.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleSubmitAll}
              disabled={!canManageEnrollment || submittingAll || selectedCourses.length === 0}
              className="w-full"
            >
              {submittingAll ? <Spinner className="h-4 w-4" /> : "Save Selection And Send To Advisor"}
            </Button>

            <div className="space-y-3 pt-2">
              <p className="text-sm font-semibold text-foreground">Submitted Classes</p>
              {submittedEnrollments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No submitted classes yet.
                </div>
              ) : (
                submittedEnrollments.map((enrollment) => {
                  const canCancel = enrollment.status === "pendingAdvisorApproval" || enrollment.status === "pending_approval" || enrollment.status === "pending"
                  const advisorName = (enrollment as Enrollment & { advisorName?: string }).advisorName
                  return (
                    <div key={enrollment.id} className="rounded-2xl border border-border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">{enrollment.courseTitle}</p>
                          <p className="text-sm text-muted-foreground">{enrollment.professorName || enrollment.courseCode}</p>
                          {advisorName && (
                            <p className="text-xs text-muted-foreground">Advisor: {advisorName}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge
                            variant={
                              enrollment.status === "active"
                                ? "secondary"
                                : enrollment.status === "rejected" || enrollment.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {enrollment.status === "active"
                              ? "Approved"
                              : enrollment.status === "pendingAdvisorApproval"
                                ? "Pending Advisor"
                                : enrollment.status === "pending_approval"
                                  ? "Pending Payment"
                                  : enrollment.status === "waitlisted"
                                    ? "Waitlisted"
                                    : enrollment.status}
                          </Badge>
                          {enrollment.status === "waitlisted" && (
                            <StudentFeatureGate featureKey="waitlist-status">
                              <WaitlistPositionNote enrollmentId={enrollment.id} />
                            </StudentFeatureGate>
                          )}
                          {canCancel && (
                            <StudentFeatureGate featureKey="drop-withdraw">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={cancellingId === enrollment.id}
                                onClick={() => handleCancelEnrollment(enrollment.id)}
                              >
                                {cancellingId === enrollment.id ? (
                                  <Spinner className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                Cancel
                              </Button>
                            </StudentFeatureGate>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <StudentFeatureGate featureKey="schedule-conflict">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Calendar</CardTitle>
            <Badge variant="outline">
              <CalendarClock className="mr-1 h-3.5 w-3.5" />
              {planLoading || enrollmentsLoading ? "Updating" : "Live Preview"}
            </Badge>
          </CardHeader>
          <CardContent>
            {planLoading || enrollmentsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner className="h-5 w-5" />
              </div>
            ) : (
              <ScheduleGrid sessions={calendarSessions} readOnly />
            )}
          </CardContent>
        </Card>
      </StudentFeatureGate>
    </div>
  )
}

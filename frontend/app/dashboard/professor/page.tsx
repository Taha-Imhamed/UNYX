"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock3, MapPin } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { useAuth } from "@/lib/auth-context"
import { fetchQuestions, type Question } from "@/lib/questions-api"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import type { Course, CourseScheduleEntry } from "@shared/types"

type UpcomingCourseSession = CourseScheduleEntry & {
  courseId: string
  courseCode: string
  courseTitle: string
  professorName: string
  startAt: Date
  endAt: Date
}

function formatShortDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function formatClock(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function getNextSessionOccurrence(slot: CourseScheduleEntry, fromDate: Date) {
  const dayOrder = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const
  const targetDay = dayOrder.indexOf(slot.day)
  const start = new Date(fromDate)
  const end = new Date(fromDate)
  const [startHour = 0, startMinute = 0] = slot.startTime.split(":").map((part) => Number(part))
  const [endHour = 0, endMinute = 0] = slot.endTime.split(":").map((part) => Number(part))

  start.setDate(fromDate.getDate() + ((targetDay - fromDate.getDay() + 7) % 7))
  start.setHours(startHour, startMinute, 0, 0)

  if (start.getTime() <= fromDate.getTime()) {
    start.setDate(start.getDate() + 7)
  }

  end.setTime(start.getTime())
  end.setHours(endHour, endMinute, 0, 0)

  return { startAt: start, endAt: end }
}

function buildUpcomingSessions(courses: Course[], fromDate: Date) {
  const sessions: UpcomingCourseSession[] = []
  courses.forEach((course) => {
    course.schedule?.forEach((slot) => {
      const occurrence = getNextSessionOccurrence(slot, fromDate)
      sessions.push({
        ...slot,
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        professorName: course.professorName,
        startAt: occurrence.startAt,
        endAt: occurrence.endAt,
      })
    })
  })
  return sessions.sort((left, right) => left.startAt.getTime() - right.startAt.getTime())
}

function buildTodaySessions(courses: Course[], fromDate: Date) {
  const dayOrder = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const
  const today = dayOrder[fromDate.getDay()]
  const sessions: UpcomingCourseSession[] = []
  courses.forEach((course) => {
    course.schedule?.forEach((slot) => {
      if (slot.day !== today) return
      const startAt = new Date(fromDate)
      const endAt = new Date(fromDate)
      const [startHour = 0, startMinute = 0] = slot.startTime.split(":").map((part) => Number(part))
      const [endHour = 0, endMinute = 0] = slot.endTime.split(":").map((part) => Number(part))
      startAt.setHours(startHour, startMinute, 0, 0)
      endAt.setHours(endHour, endMinute, 0, 0)
      sessions.push({
        ...slot,
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        professorName: course.professorName,
        startAt,
        endAt,
      })
    })
  })
  return sessions.sort((left, right) => left.startAt.getTime() - right.startAt.getTime())
}

function StatCard({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <Card className="border border-border bg-card/92">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

export default function ProfessorDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse, isLoadingWorkspace, workspace } =
    useProfessorCourseWorkspace({ includeSchedule: true })
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  useEffect(() => {
    if (!user) return
    const controller = new AbortController()
    fetchQuestions(controller.signal)
      .then((items) => setQuestions(items))
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load questions")
      })
    return () => controller.abort()
  }, [refreshVersion, user])

  const upcomingSessions = useMemo(() => buildUpcomingSessions(courses, new Date()).slice(0, 6), [courses])
  const nextClass = upcomingSessions[0] ?? null
  const todaySessions = useMemo(() => buildTodaySessions(courses, new Date()), [courses])
  const courseQuestions = useMemo(() => questions.filter((q) => q.courseId === selectedCourseId), [questions, selectedCourseId])

  if (!user) return null
  const isProfessor = user.role === "professor"
  const isAdminLike = user.role === "admin" || user.role === "super-admin" || user.role === "supervisor"
  if (!isProfessor && !isAdminLike) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Restricted</AlertTitle>
        <AlertDescription>This view is only for professor, admin, or supervisor accounts.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Teaching dashboard" description="Your assigned courses at a glance" />
      <ProfessorTabNav />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Professor Portal</p>
          <h1 className="text-3xl font-bold text-foreground">Class overview</h1>
        </div>
        <Badge className="border border-border bg-accent text-accent-foreground">Role: {isProfessor ? "Professor" : "Admin"}</Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Assigned Courses" value={courses.length} detail="All active classes under you" />
        <StatCard title="Today's Classes" value={todaySessions.length} detail={todaySessions[0] ? `First starts ${formatClock(todaySessions[0].startAt)}` : "No classes today"} />
        <StatCard title="Open Questions" value={courseQuestions.filter((question) => !question.reply).length} detail="Students still waiting for a reply" />
        <StatCard
          title="Next Class"
          value={nextClass ? nextClass.courseCode : "None"}
          detail={nextClass ? `${formatShortDate(nextClass.startAt.toISOString())} in ${nextClass.location}` : "No scheduled sessions found"}
        />
      </div>

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Manage assigned courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfessorCourseSelect courses={courses} selectedCourseId={selectedCourseId} onChange={setSelectedCourseId} isLoading={isLoadingCourses} />
          {!selectedCourse && !isLoadingCourses && (
            <p className="text-sm text-muted-foreground">
              {courses.length === 0 ? "No assigned courses yet." : "Select a course above to see its details."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-border bg-card/92">
          <CardHeader>
            <CardTitle>Today and next up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextClass ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-sky-700">Next class</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{nextClass.courseCode} • {nextClass.courseTitle}</p>
                    <p className="mt-1 text-sm text-slate-700">{formatShortDate(nextClass.startAt.toISOString())}</p>
                  </div>
                  <Badge className="border border-sky-200 bg-white text-sky-700">{nextClass.day}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-700">
                  <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{formatClock(nextClass.startAt)} - {formatClock(nextClass.endAt)}</span>
                  <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{nextClass.location || "Room not set"}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                No upcoming classes are scheduled yet.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Today</p>
                <div className="mt-3 space-y-3">
                  {todaySessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No classes scheduled today.</p>
                  ) : (
                    todaySessions.slice(0, 4).map((session) => (
                      <div key={`${session.courseId}-${session.startAt.toISOString()}`} className="rounded-lg border border-border bg-background/80 p-3">
                        <p className="font-medium text-foreground">{session.courseCode} • {session.courseTitle}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatClock(session.startAt)} - {formatClock(session.endAt)} • {session.location}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">This week</p>
                <div className="mt-3 space-y-3">
                  {upcomingSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No scheduled sessions found.</p>
                  ) : (
                    upcomingSessions.slice(0, 4).map((session) => (
                      <div key={`${session.courseId}-${session.startAt.toISOString()}-week`} className="rounded-lg border border-border bg-background/80 p-3">
                        <p className="font-medium text-foreground">{session.courseCode} • {session.courseTitle}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(session.startAt.toISOString())}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/92">
          <CardHeader>
            <CardTitle>Quick command center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/professor/schedule")}>Open schedule</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/professor/gradebook")}>Open gradebook</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/professor/questions")}>Answer questions</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/professor/mock-classes")}>Plan mock-up class</Button>
            </div>
            {selectedCourse ? (
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Selected course</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{selectedCourse.code} • {selectedCourse.title}</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>Department: {selectedCourse.department || selectedCourse.branch || "Not set"}</p>
                  <p>Primary room: {selectedCourse.schedule?.[0]?.location ?? selectedCourse.location ?? "Not set"}</p>
                  <p>Workspace: {isLoadingWorkspace ? "Loading..." : workspace ? "Ready" : "Setting up..."}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a course to unlock schedule, grading, and mock-up planning.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

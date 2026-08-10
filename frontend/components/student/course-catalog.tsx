"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { CourseAvailability } from "@shared/types"
import { CalendarClock, Clock3, Users } from "lucide-react"

interface CourseCatalogProps {
  courses: CourseAvailability[]
  onEnroll: (courseId: string) => void
  enrollingId?: string | null
}

export function CourseCatalog({ courses, onEnroll, enrollingId }: CourseCatalogProps) {
  return (
    <Card className="border border-border bg-card" id="courses">
      <CardHeader>
        <CardTitle className="text-foreground">Available Courses</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => {
          const seats = course.availableSeats ?? Math.max(0, (course.capacity ?? 0) - (course.enrolledCount ?? 0))
          const isFull = seats <= 0
          const deadline = course.deadline ? new Date(course.deadline) : null
          const deadlinePassed = deadline ? deadline.getTime() <= Date.now() : false
          const opensAt = course.enrollmentOpensAt ? new Date(course.enrollmentOpensAt) : null
          const closesAt = course.enrollmentClosesAt ? new Date(course.enrollmentClosesAt) : null
          const beforeWindow = opensAt ? Date.now() < opensAt.getTime() : false
          const afterWindow = closesAt ? Date.now() > closesAt.getTime() : false
          const enrollmentClosedFlag = course.enrollmentOpen === false
          const blocked = isFull || deadlinePassed || enrollmentClosedFlag || beforeWindow || afterWindow
          const fill = course.capacity ? Math.min(100, ((course.enrolledCount ?? 0) / course.capacity) * 100) : 0
          const statusLabel = (() => {
            if (enrollmentClosedFlag) return "Enrollment hidden"
            if (beforeWindow) return "Enrollment not opened"
            if (afterWindow || deadlinePassed) return "Enrollment closed"
            if (isFull) return "Course full"
            return "Open for enrollment"
          })()
          return (
            <div key={course.id} className="rounded-xl border border-border bg-card/80 p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.code} • {course.professorName} • {course.branch || course.location || "Main branch"}
                  </p>
                </div>
                <Badge variant="outline" className="border-border text-foreground">
                  ${course.price.toFixed(2)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-4 w-4 text-primary" />{course.capacity} capacity</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4 text-primary" />{seats} seats left</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {deadline ? deadline.toLocaleDateString() : "No deadline"}
                </span>
              </div>
              <Progress value={fill} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{statusLabel}</span>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => onEnroll(course.id)}
                  disabled={blocked || enrollingId === course.id}
                >
                  {enrollingId === course.id ? "Submitting..." : "Enroll"}
                </Button>
              </div>
            </div>
          )
        })}
        {courses.length === 0 && <p className="text-sm text-muted-foreground">No courses are available at the moment.</p>}
      </CardContent>
    </Card>
  )
}

"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { useAvailableCourses, useEnrollInCourse, useStudentProfile } from "@/hooks/use-student-portal"
import { StudentFeatureGate } from "@/components/student-feature-gate"

export default function DepartmentCoursesPage() {
  return (
    <StudentFeatureGate featureKey="course-catalog">
      <DepartmentCoursesPageInner />
    </StudentFeatureGate>
  )
}

function DepartmentCoursesPageInner() {
  const { toast } = useToast()
  const { profile } = useStudentProfile()
  const { courses, isLoading, error } = useAvailableCourses(Boolean(profile))
  const { enroll, isSubmitting } = useEnrollInCourse()
  const [search, setSearch] = useState("")

  const departmentCourses = useMemo(() => {
    if (!profile) return []
    return courses.filter((course) => {
      const matchesDepartment =
        (course.department && (course.department === profile.faculty || course.department === profile.program)) ||
        (course.eligiblePrograms?.length && profile.program && course.eligiblePrograms.includes(profile.program)) ||
        (course.eligibleFaculties?.length && profile.faculty && course.eligibleFaculties.includes(profile.faculty))
      return Boolean(matchesDepartment)
    })
  }, [courses, profile])

  const filtered = departmentCourses.filter((course) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return course.title.toLowerCase().includes(q) || course.code.toLowerCase().includes(q)
  })

  const handleEnroll = async (courseId: string) => {
    try {
      await enroll(courseId)
      toast({ title: "Enrollment submitted", description: "Check My Courses for status." })
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to enroll", description: err instanceof Error ? err.message : "Please try again." })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Department Courses</p>
        <h1 className="text-2xl font-bold text-foreground">Courses in your department</h1>
        <p className="text-sm text-muted-foreground">
          {profile ? `Scoped to ${profile.faculty || profile.program || "your program"}.` : "Loading your program..."}
        </p>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search by title or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription>{filtered.length} course(s) available in your department.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Loading
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!isLoading && !error && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No department courses found. Try the full course catalog on the Enroll page.</p>
          )}
          {filtered.map((course) => (
            <div key={course.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {course.code} — {course.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {course.creditHours ?? "—"} credits • {course.department ?? "General"} • ${course.price}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{course.enrollmentOpen === false ? "Closed" : "Open"}</Badge>
                <Button size="sm" disabled={isSubmitting || course.enrollmentOpen === false} onClick={() => handleEnroll(course.id)}>
                  Enroll
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

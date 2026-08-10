"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { useEnrollInCourse, useStudentEnrollments } from "@/hooks/use-student-portal"

export default function EnrollmentRenewalPage() {
  const { toast } = useToast()
  const { enrollments, isLoading, error, reload } = useStudentEnrollments()
  const { enroll, isSubmitting, currentCourseId } = useEnrollInCourse()

  const renewable = useMemo(
    () => enrollments.filter((enrollment) => enrollment.status === "completed" || enrollment.status === "cancelled"),
    [enrollments],
  )
  const active = useMemo(
    () => enrollments.filter((enrollment) => enrollment.status === "active" || enrollment.status === "pending"),
    [enrollments],
  )

  const handleRenew = async (courseId: string) => {
    try {
      await enroll(courseId)
      toast({ title: "Renewal submitted", description: "Your re-enrollment request has been sent." })
      reload()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to renew", description: err instanceof Error ? err.message : "Please try again." })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Enrollment Renewal</p>
        <h1 className="text-2xl font-bold text-foreground">Renew or continue enrollment</h1>
        <p className="text-sm text-muted-foreground">Re-enroll in courses you've completed before, or continue an in-progress course into the next term.</p>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Currently active</CardTitle>
          <CardDescription>Courses you don't need to renew — they're still in progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Loading
            </div>
          )}
          {!isLoading && active.length === 0 && <p className="text-sm text-muted-foreground">No active enrollments.</p>}
          {active.map((enrollment) => (
            <div key={enrollment.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-semibold text-foreground">{enrollment.courseTitle}</p>
              <Badge variant="outline">{enrollment.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Eligible for renewal</CardTitle>
          <CardDescription>Completed or cancelled courses you can re-enroll in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!isLoading && renewable.length === 0 && (
            <p className="text-sm text-muted-foreground">No courses eligible for renewal right now.</p>
          )}
          {renewable.map((enrollment) => (
            <div key={enrollment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{enrollment.courseTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {enrollment.courseCode} • Previously {enrollment.status}
                </p>
              </div>
              <Button
                size="sm"
                disabled={isSubmitting && currentCourseId === enrollment.courseId}
                onClick={() => handleRenew(enrollment.courseId)}
              >
                {isSubmitting && currentCourseId === enrollment.courseId ? <Spinner className="h-4 w-4" /> : "Renew"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

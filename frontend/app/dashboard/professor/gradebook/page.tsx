"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { GradeBreakdown } from "@/components/student/grade-breakdown"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import { fetchEnrollments, updateEnrollmentGrades, type EnrollmentRecord } from "@/lib/enrollment-api"
import { useToast } from "@/hooks/use-toast"

export default function ProfessorGradebookPage() {
  const { toast } = useToast()
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse, publishMarks } = useProfessorCourseWorkspace()
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [isLoadingRoster, setIsLoadingRoster] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGradeEnrollmentId, setSelectedGradeEnrollmentId] = useState("")
  const [savingGrades, setSavingGrades] = useState<Record<string, boolean>>({})
  const [gradeErrors, setGradeErrors] = useState<Record<string, string | null>>({})
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    if (!selectedCourseId) {
      setEnrollments([])
      return
    }
    const controller = new AbortController()
    setIsLoadingRoster(true)
    fetchEnrollments({ courseId: selectedCourseId, page: 1, pageSize: 500, signal: controller.signal })
      .then((payload) => setEnrollments(payload.items))
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load roster")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingRoster(false)
      })
    return () => controller.abort()
  }, [selectedCourseId])

  useEffect(() => {
    if (enrollments.length === 0) {
      setSelectedGradeEnrollmentId("")
      return
    }
    setSelectedGradeEnrollmentId((prev) => (prev && enrollments.some((e) => e.id === prev) ? prev : enrollments[0].id))
  }, [enrollments])

  const selectedGradeEnrollment = useMemo(
    () => enrollments.find((e) => e.id === selectedGradeEnrollmentId) ?? null,
    [enrollments, selectedGradeEnrollmentId],
  )

  const handleSaveGrades = async (enrollmentId: string, payload: Parameters<typeof updateEnrollmentGrades>[1]) => {
    setSavingGrades((prev) => ({ ...prev, [enrollmentId]: true }))
    setGradeErrors((prev) => ({ ...prev, [enrollmentId]: null }))
    try {
      const updated = await updateEnrollmentGrades(enrollmentId, payload)
      setEnrollments((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)))
      toast({ title: "Grades saved", description: "Student grades updated successfully." })
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save grades"
      setGradeErrors((prev) => ({ ...prev, [enrollmentId]: message }))
      toast({ variant: "destructive", title: "Save failed", description: message })
    } finally {
      setSavingGrades((prev) => ({ ...prev, [enrollmentId]: false }))
    }
  }

  const handlePublishMarks = async () => {
    if (!selectedCourse) return
    setIsPublishing(true)
    try {
      await publishMarks({
        title: `Marks published for ${selectedCourse.code}`,
        message: `Marks are available now for ${selectedCourse.title}.`,
      })
      toast({ title: "Marks published", description: "Students were notified." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to publish marks")
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Gradebook" description="Edit grades and publish marks" />
      <ProfessorTabNav />

      {error && <p className="text-sm text-destructive">{error}</p>}

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
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Grade submissions and publish marks</CardTitle>
            <Button onClick={handlePublishMarks} disabled={isPublishing || enrollments.length === 0}>
              {isPublishing ? "Publishing..." : "Publish marks"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingRoster ? (
            <p className="text-sm text-muted-foreground">Loading roster...</p>
          ) : enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students to grade for this course yet.</p>
          ) : (
            <>
              <div className="flex w-full flex-wrap items-center gap-2 text-sm">
                <Select value={selectedGradeEnrollmentId} onValueChange={setSelectedGradeEnrollmentId}>
                  <SelectTrigger className="w-full border-border bg-secondary/70 sm:w-80">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments.map((enrollment) => (
                      <SelectItem key={enrollment.id} value={enrollment.id}>
                        {enrollment.student.firstName} {enrollment.student.lastName} ({enrollment.student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => {
                      if (!selectedGradeEnrollment) return
                      const idx = enrollments.indexOf(selectedGradeEnrollment)
                      if (idx > 0) setSelectedGradeEnrollmentId(enrollments[idx - 1].id)
                    }}
                    disabled={!selectedGradeEnrollment || enrollments.indexOf(selectedGradeEnrollment) <= 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => {
                      if (!selectedGradeEnrollment) return
                      const idx = enrollments.indexOf(selectedGradeEnrollment)
                      if (idx < enrollments.length - 1) setSelectedGradeEnrollmentId(enrollments[idx + 1].id)
                    }}
                    disabled={!selectedGradeEnrollment || enrollments.indexOf(selectedGradeEnrollment) >= enrollments.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {selectedGradeEnrollment && selectedCourse && (
                <GradeBreakdown
                  key={selectedGradeEnrollment.id}
                  enrollment={{
                    ...selectedGradeEnrollment,
                    courseTitle: selectedGradeEnrollment.courseTitle || selectedCourse.title,
                    courseCode: selectedGradeEnrollment.courseCode || selectedCourse.code,
                    courseSchedule: selectedGradeEnrollment.courseSchedule || selectedCourse.schedule || [],
                  } as any}
                  readOnly={false}
                  saving={!!savingGrades[selectedGradeEnrollment.id]}
                  error={gradeErrors[selectedGradeEnrollment.id] ?? null}
                  onSave={(input) => handleSaveGrades(selectedGradeEnrollment.id, input)}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

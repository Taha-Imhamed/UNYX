"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Course } from "@/lib/enrollment-api"

export function ProfessorCourseSelect({
  courses,
  selectedCourseId,
  onChange,
  isLoading,
}: {
  courses: Course[]
  selectedCourseId: string
  onChange: (id: string) => void
  isLoading?: boolean
}) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading courses...</p>
  if (courses.length === 0) return <p className="text-sm text-muted-foreground">No assigned courses yet.</p>

  return (
    <Select value={selectedCourseId} onValueChange={onChange}>
      <SelectTrigger className="w-full border-border bg-secondary/70 sm:w-96">
        <SelectValue placeholder="Select a course" />
      </SelectTrigger>
      <SelectContent>
        {courses.map((course) => (
          <SelectItem key={course.id} value={course.id}>
            {course.code} - {course.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

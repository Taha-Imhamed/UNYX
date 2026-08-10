"use client"

import { useCallback, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { updateCourseRequest } from "@/lib/enrollment-api"
import { useToast } from "@/hooks/use-toast"
import type { Course } from "@shared/types"

/**
 * Single source of truth for flipping a course's enrollmentOpen flag.
 * Used by the courses table row toggle, the schedule page's close-enrollment
 * dialog, and anywhere else that needs to open/close one course — so there's
 * one loading state, one error path, and one toast instead of three copies.
 */
export function useCourseEnrollmentToggle(setCourses: Dispatch<SetStateAction<Course[]>>) {
  const { toast } = useToast()
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null)

  const setEnrollmentOpen = useCallback(
    async (course: Course, nextOpen: boolean, note?: string | null) => {
      setPendingCourseId(course.id)
      try {
        const updated = await updateCourseRequest(course.id, {
          enrollmentOpen: nextOpen,
          enrollmentStatusNote: nextOpen ? null : (note?.trim() || null),
        })
        setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        toast({
          title: nextOpen ? "Enrollment opened" : "Enrollment closed",
          description: nextOpen ? `${updated.code} is open for students.` : "Enrollment is hidden until you reopen it.",
        })
        return updated
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Unable to update enrollment",
          description: error instanceof Error ? error.message : "Unknown error",
        })
        throw error
      } finally {
        setPendingCourseId(null)
      }
    },
    [setCourses, toast],
  )

  return {
    setEnrollmentOpen,
    isToggling: useCallback((courseId: string) => pendingCourseId === courseId, [pendingCourseId]),
  }
}

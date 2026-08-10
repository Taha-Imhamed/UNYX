import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchCourses } from "@/lib/enrollment-api"
import type { Course } from "@/lib/enrollment-api"

interface UseMyCoursesOptions {
  includeSchedule?: boolean
}

/**
 * Single source of truth for "which courses does the current professor teach".
 * Filters server-side by professorId (auth.professorId) instead of fetching the
 * entire institution's catalog and matching client-side.
 */
export function useMyCourses(options: UseMyCoursesOptions = {}) {
  const { user } = useAuth()
  const { includeSchedule } = options
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setCourses([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const isProfessor = user.role === "professor"
    setIsLoading(true)
    setError(null)

    fetchCourses({
      signal: controller.signal,
      scope: "admin",
      includeSchedule,
      mine: isProfessor,
    })
      .then((result) => {
        if (controller.signal.aborted) return
        setCourses(result)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Failed to load courses")
        setCourses([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [user, includeSchedule])

  return { courses, isLoading, error }
}

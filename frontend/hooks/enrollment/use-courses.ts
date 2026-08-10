"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchCourses } from "@/lib/enrollment-api"
import type { Course } from "@shared/types"

/**
 * Fetches the full course catalogue. Mirrors the `fetchCourses(signal)` call that
 * used to live inside the monolithic enrollment page's `loadInitial` Promise.all.
 */
export function useCourses(options?: { enabled?: boolean; refreshKey?: unknown }) {
  const enabled = options?.enabled ?? true
  const refreshKey = options?.refreshKey
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    fetchCourses(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setCourses(data)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load courses.")
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })
    return () => controller.abort()
  }, [enabled, refreshKey])

  const refresh = useCallback(async () => {
    try {
      const data = await fetchCourses()
      setCourses(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load courses.")
      throw err
    }
  }, [])

  return { courses, setCourses, isLoading, error, setError, refresh }
}

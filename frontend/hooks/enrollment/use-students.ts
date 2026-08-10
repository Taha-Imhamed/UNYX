"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchStudents } from "@/lib/enrollment-api"
import type { Student } from "@shared/types"

export function useStudents(options?: { enabled?: boolean; refreshKey?: unknown }) {
  const enabled = options?.enabled ?? true
  const refreshKey = options?.refreshKey
  const [students, setStudents] = useState<Student[]>([])
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
    fetchStudents(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setStudents(data)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load students.")
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
      const data = await fetchStudents()
      setStudents(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load students.")
      throw err
    }
  }, [])

  return { students, setStudents, isLoading, error, refresh }
}

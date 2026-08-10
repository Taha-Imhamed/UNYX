"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchAcademicStructure, type AcademicStructure } from "@/lib/enrollment-api"

export function useAcademicStructure(options?: { enabled?: boolean; refreshKey?: unknown }) {
  const enabled = options?.enabled ?? true
  const refreshKey = options?.refreshKey
  const [academicStructure, setAcademicStructure] = useState<AcademicStructure | null>(null)
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
    fetchAcademicStructure(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setAcademicStructure(data)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load academic structure.")
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
      const data = await fetchAcademicStructure()
      setAcademicStructure(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load academic structure.")
      throw err
    }
  }, [])

  return { academicStructure, setAcademicStructure, isLoading, error, refresh }
}

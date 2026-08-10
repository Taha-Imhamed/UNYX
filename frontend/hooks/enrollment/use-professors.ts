"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchProfessors } from "@/lib/enrollment-api"
import type { Professor } from "@shared/types"

export function useProfessors(options?: { enabled?: boolean; refreshKey?: unknown }) {
  const enabled = options?.enabled ?? true
  const refreshKey = options?.refreshKey
  const [professors, setProfessors] = useState<Professor[]>([])
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
    fetchProfessors(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setProfessors(data)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load professors.")
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
      const data = await fetchProfessors()
      setProfessors(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load professors.")
      throw err
    }
  }, [])

  return { professors, setProfessors, isLoading, error, refresh }
}

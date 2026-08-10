"use client"

import { useEffect, useState } from "react"
import { fetchFinanceRequests } from "@/lib/finance-api"
import { subscribeToFinanceRequestChanges } from "@/lib/finance-request-events"
import type { FinanceRequest } from "@shared/types"

export function useProfessorFinanceRequests() {
  const [financeRequests, setFinanceRequests] = useState<FinanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    fetchFinanceRequests(controller.signal)
      .then((items) => setFinanceRequests(items))
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    return subscribeToFinanceRequestChanges(() => {
      void fetchFinanceRequests()
        .then((items) => setFinanceRequests(items))
        .catch(() => undefined)
    })
  }, [])

  return { financeRequests, isLoading }
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  fetchEnrollments,
  fetchEnrollmentSummary,
  type EnrollmentRecord,
  type EnrollmentSummary,
} from "@/lib/enrollment-api"
import {
  blockedEnrollmentIdsGlobal,
  debugEnrollmentLog,
  filterPendingAllowed,
} from "@/components/enrollment/shared"

export const ENROLLMENT_PAGE_SIZE = 50

/**
 * Owns the paginated pending-enrollment list, the summary counters, and the
 * session-persisted "blocked" enrollment id set. Behaviour is transplanted
 * verbatim from the previous monolithic enrollment page.
 */
export function useEnrollments(options?: { enabled?: boolean; refreshKey?: unknown }) {
  const enabled = options?.enabled ?? true
  const refreshKey = options?.refreshKey

  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [summary, setSummary] = useState<EnrollmentSummary | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: ENROLLMENT_PAGE_SIZE })

  const enrollmentRequestVersion = useRef(0)
  const blockedEnrollmentIds = useRef<Set<string>>(new Set(blockedEnrollmentIdsGlobal))

  const persistBlocked = useCallback(() => {
    blockedEnrollmentIdsGlobal.clear()
    blockedEnrollmentIds.current.forEach((id) => blockedEnrollmentIdsGlobal.add(id))
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "blocked_enrollment_ids",
          JSON.stringify(Array.from(blockedEnrollmentIds.current)),
        )
      }
    } catch (error) {
      console.warn("Unable to persist blocked enrollment ids", error)
    }
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.sessionStorage.getItem("blocked_enrollment_ids")
        if (stored) {
          const parsed = JSON.parse(stored) as string[]
          if (Array.isArray(parsed)) {
            parsed.forEach((id) => blockedEnrollmentIds.current.add(id))
            persistBlocked()
          }
        }
      }
    } catch (error) {
      console.warn("Unable to restore blocked enrollment ids", error)
    }
  }, [persistBlocked])

  const loadInitial = useCallback(() => {
    enrollmentRequestVersion.current += 1
    const requestVersion = enrollmentRequestVersion.current
    const controller = new AbortController()
    setIsLoading(true)
    setLoadError(null)
    debugEnrollmentLog("initial-load:start", {
      requestVersion,
      page: 1,
      pageSize: ENROLLMENT_PAGE_SIZE,
      pendingOnly: true,
      ids: [],
    })
    Promise.all([
      fetchEnrollments({ page: 1, pageSize: ENROLLMENT_PAGE_SIZE, pendingOnly: true, signal: controller.signal }),
      fetchEnrollmentSummary(controller.signal),
    ])
      .then(([enrollmentPage, summaryData]) => {
        if (controller.signal.aborted || requestVersion !== enrollmentRequestVersion.current) return
        const pendingItems = filterPendingAllowed(enrollmentPage.items, blockedEnrollmentIds.current)
        debugEnrollmentLog("initial-load:resolve", {
          requestVersion,
          page: enrollmentPage.page,
          pageSize: enrollmentPage.pageSize,
          pendingOnly: true,
          ids: pendingItems.map((item) => item.id),
        })
        setEnrollments(pendingItems)
        setPagination({ page: enrollmentPage.page, total: enrollmentPage.total, pageSize: enrollmentPage.pageSize })
        setSummary(summaryData)
      })
      .catch((error) => {
        if (controller.signal.aborted || requestVersion !== enrollmentRequestVersion.current) return
        setLoadError(error instanceof Error ? error.message : "Unable to load enrollments.")
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          debugEnrollmentLog("initial-load:complete", {
            requestVersion,
            page: 1,
            pageSize: ENROLLMENT_PAGE_SIZE,
            pendingOnly: true,
          })
          setIsLoading(false)
        }
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }
    const abort = loadInitial()
    return () => abort?.()
  }, [enabled, loadInitial, refreshKey])

  const refresh = useCallback(async () => {
    enrollmentRequestVersion.current += 1
    const requestVersion = enrollmentRequestVersion.current
    setIsRefreshing(true)
    debugEnrollmentLog("manual-refresh:start", {
      requestVersion,
      page: 1,
      pageSize: pagination.pageSize,
      pendingOnly: true,
      ids: [],
    })
    try {
      const [nextPage, summaryData] = await Promise.all([
        fetchEnrollments({ page: 1, pageSize: pagination.pageSize, pendingOnly: true }),
        fetchEnrollmentSummary(),
      ])
      if (requestVersion !== enrollmentRequestVersion.current) return
      const pendingItems = filterPendingAllowed(nextPage.items, blockedEnrollmentIds.current)
      debugEnrollmentLog("manual-refresh:resolve", {
        requestVersion,
        page: nextPage.page,
        pageSize: nextPage.pageSize,
        pendingOnly: true,
        ids: pendingItems.map((item) => item.id),
      })
      setEnrollments(pendingItems)
      setPagination({ page: nextPage.page, total: nextPage.total, pageSize: nextPage.pageSize })
      setSummary(summaryData)
    } finally {
      debugEnrollmentLog("manual-refresh:complete", {
        requestVersion,
        page: 1,
        pageSize: pagination.pageSize,
        pendingOnly: true,
      })
      setIsRefreshing(false)
    }
  }, [pagination.pageSize])

  const refetchCurrentPage = useCallback(async () => {
    enrollmentRequestVersion.current += 1
    const requestVersion = enrollmentRequestVersion.current
    setIsRefreshing(true)
    debugEnrollmentLog("page-refresh:start", {
      requestVersion,
      page: pagination.page,
      pageSize: pagination.pageSize,
      pendingOnly: true,
    })
    try {
      const nextPage = await fetchEnrollments({
        page: pagination.page,
        pageSize: pagination.pageSize,
        pendingOnly: true,
      })
      if (requestVersion !== enrollmentRequestVersion.current) return
      const pendingItems = filterPendingAllowed(nextPage.items, blockedEnrollmentIds.current)
      debugEnrollmentLog("page-refresh:resolve", {
        requestVersion,
        page: nextPage.page,
        pageSize: nextPage.pageSize,
        pendingOnly: true,
        ids: pendingItems.map((item) => item.id),
      })
      setEnrollments(pendingItems)
      setPagination({ page: nextPage.page, total: nextPage.total, pageSize: nextPage.pageSize })
    } finally {
      debugEnrollmentLog("page-refresh:complete", {
        requestVersion,
        page: pagination.page,
        pageSize: pagination.pageSize,
        pendingOnly: true,
      })
      setIsRefreshing(false)
    }
  }, [pagination.page, pagination.pageSize])

  const hasMoreRows = enrollments.length < pagination.total

  const loadNextPage = useCallback(async () => {
    if (isPageLoading || !hasMoreRows) return
    setIsPageLoading(true)
    const requestVersion = enrollmentRequestVersion.current
    debugEnrollmentLog("load-more:start", {
      requestVersion,
      page: pagination.page + 1,
      pageSize: pagination.pageSize,
      pendingOnly: true,
    })
    try {
      const nextPage = await fetchEnrollments({
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
        pendingOnly: true,
      })
      if (requestVersion !== enrollmentRequestVersion.current) return
      const pendingItems = filterPendingAllowed(nextPage.items, blockedEnrollmentIds.current)
      debugEnrollmentLog("load-more:resolve", {
        requestVersion,
        page: nextPage.page,
        pageSize: nextPage.pageSize,
        pendingOnly: true,
        ids: pendingItems.map((item) => item.id),
      })
      setEnrollments((prev) => [...prev, ...pendingItems])
      setPagination({ page: nextPage.page, total: nextPage.total, pageSize: nextPage.pageSize })
    } finally {
      debugEnrollmentLog("load-more:complete", {
        requestVersion,
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
        pendingOnly: true,
      })
      setIsPageLoading(false)
    }
  }, [isPageLoading, hasMoreRows, pagination.page, pagination.pageSize])

  const syncSummary = useCallback(async () => {
    const data = await fetchEnrollmentSummary()
    setSummary(data)
  }, [])

  return {
    enrollments,
    setEnrollments,
    summary,
    setSummary,
    isLoading,
    setIsLoading,
    isRefreshing,
    isPageLoading,
    loadError,
    setLoadError,
    pagination,
    hasMoreRows,
    blockedEnrollmentIds,
    persistBlocked,
    enrollmentRequestVersion,
    refresh,
    refetchCurrentPage,
    loadNextPage,
    syncSummary,
  }
}

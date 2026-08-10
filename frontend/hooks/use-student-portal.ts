"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  fetchAcademicStructure,
  fetchAvailableCourses,
  fetchStudentEnrollments,
  fetchStudentFinancialSnapshot,
  fetchStudentHints,
  fetchStudentMe,
  fetchStudentGrades,
  fetchStudentTranscript,
  submitEnrollmentRequest,
} from "@/lib/students-api"
import { useAuth } from "@/lib/auth-context"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import type {
  CourseAvailability,
  Enrollment,
  EnrollmentWithCourse,
  Student,
  StudentFinancialSnapshot,
  StudentHintsResponse,
  StudentTranscript,
} from "@shared/types"

interface AsyncState<T> {
  data: T
  isLoading: boolean
  error: string | null
}

function createAsyncState<T>(initial: T): AsyncState<T> {
  return { data: initial, isLoading: true, error: null }
}

const STUDENT_PROFILE_STORAGE_KEY = "unyt_student_profile"
const LEGACY_STUDENT_PROFILE_STORAGE_KEY = "ar_company_student_profile"
const STUDENT_GRADES_STORAGE_PREFIX = "unyt_student_grades_"
const STUDENT_ENROLLMENTS_STORAGE_PREFIX = "unyt_student_enrollments_"
const STUDENT_FINANCIALS_STORAGE_PREFIX = "unyt_student_financials_"
const STUDENT_PORTAL_CACHE_TTL_MS = 30_000

type CacheEntry<T> = {
  data: T
  timestamp: number
}

const studentProfileCache = new Map<string, CacheEntry<Student>>()
const studentProfileInflight = new Map<string, Promise<Student>>()
const enrollmentWindowCache = new Map<string, CacheEntry<{ enrollmentOpen: boolean; enrollmentMessage?: string | null }>>()
const enrollmentWindowInflight = new Map<string, Promise<{ enrollmentOpen: boolean; enrollmentMessage?: string | null }>>()
const studentFinancialsCache = new Map<string, CacheEntry<StudentFinancialSnapshot>>()
const studentFinancialsInflight = new Map<string, Promise<StudentFinancialSnapshot>>()
const studentEnrollmentsCache = new Map<string, CacheEntry<Enrollment[]>>()
const studentEnrollmentsInflight = new Map<string, Promise<Enrollment[]>>()
const studentGradesCache = new Map<string, CacheEntry<EnrollmentWithCourse[]>>()
const studentGradesInflight = new Map<string, Promise<EnrollmentWithCourse[]>>()
const studentTranscriptCache = new Map<string, CacheEntry<StudentTranscript>>()
const studentTranscriptInflight = new Map<string, Promise<StudentTranscript>>()

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > STUDENT_PORTAL_CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function writeCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() })
}

function clearCacheKey<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  cache.delete(key)
}

export function useStudentProfile() {
  const { user } = useAuth()
  const cacheKey = user?.studentId || user?.id || "anonymous"
  const cachedProfile = user ? readCache(studentProfileCache, cacheKey) ?? null : null
  const [state, setState] = useState<AsyncState<Student | null>>({
    data: cachedProfile,
    isLoading: !cachedProfile,
    error: null,
  })
  const { version: refreshVersion } = useFocusVisibilityRefresh()

  // Seed from localStorage/sessionStorage if available to show immediately
  useEffect(() => {
    if (typeof window === "undefined") return
    if (state.data) return
    try {
      const cached =
        localStorage.getItem(STUDENT_PROFILE_STORAGE_KEY) ??
        sessionStorage.getItem(STUDENT_PROFILE_STORAGE_KEY) ??
        localStorage.getItem(LEGACY_STUDENT_PROFILE_STORAGE_KEY) ??
        sessionStorage.getItem(LEGACY_STUDENT_PROFILE_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as Student
        setState({ data: parsed, isLoading: true, error: null })
      }
    } catch (error) {
      console.warn("Unable to read cached student profile", error)
    }
  }, [state.data])

  const load = useCallback((signal?: AbortSignal, options?: { force?: boolean }) => {
    const key = user?.studentId || user?.id || "anonymous"
    const cached = options?.force ? null : readCache(studentProfileCache, key)
    if (cached) {
      setState({ data: cached, isLoading: false, error: null })
      return Promise.resolve()
    }

    setState((prev) => ({ ...prev, isLoading: prev.data ? false : true, error: null }))

    const existing = options?.force ? null : studentProfileInflight.get(key)
    const request =
      existing ??
      fetchStudentMe(signal).finally(() => {
        studentProfileInflight.delete(key)
      })

    if (!existing) {
      studentProfileInflight.set(key, request)
    }

    return request
      .then((student) => {
        writeCache(studentProfileCache, key, student)
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(STUDENT_PROFILE_STORAGE_KEY, JSON.stringify(student))
            localStorage.setItem(LEGACY_STUDENT_PROFILE_STORAGE_KEY, JSON.stringify(student))
          }
        } catch (error) {
          console.warn("Unable to cache student profile", error)
        }
        setState({ data: student, isLoading: false, error: null })
      })
      .catch((err) => {
        if (signal?.aborted) return
        setState({ data: null, isLoading: false, error: err instanceof Error ? err.message : "Unable to load profile" })
      })
  }, [user?.id, user?.studentId])

  useEffect(() => {
    if (!user) return
    const mounted = { current: true }
    void load(undefined, { force: refreshVersion > 0 })
    return () => {
      // do not abort in-flight profile request; allow it to finish and populate cache/localStorage
      mounted.current = false
    }
  }, [user, load, refreshVersion])

  useEffect(() => {
    if (user || state.data !== null) return
    if (state.isLoading) {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [user, state.data, state.isLoading])

  return { profile: state.data, isLoading: state.isLoading, error: state.error, reload: load }
}

export function useEnrollmentWindow() {
  const [state, setState] = useState<
    AsyncState<{ enrollmentOpen: boolean; enrollmentMessage?: string | null } | null>
  >({
    data: readCache(enrollmentWindowCache, "global") ?? null,
    isLoading: !readCache(enrollmentWindowCache, "global"),
    error: null,
  })
  const { version: refreshVersion } = useFocusVisibilityRefresh()

  useEffect(() => {
    const controller = new AbortController()
    const cached = refreshVersion > 0 ? null : readCache(enrollmentWindowCache, "global")
    if (cached) {
      setState({ data: cached, isLoading: false, error: null })
      return () => controller.abort()
    }

    setState((prev) => ({ ...prev, isLoading: prev.data ? false : true, error: null }))
    const existing = refreshVersion > 0 ? null : enrollmentWindowInflight.get("global")
    const request =
      existing ??
      fetchAcademicStructure(controller.signal)
        .then((structure) => ({
          enrollmentOpen: structure.enrollmentOpen !== false,
          enrollmentMessage: structure.enrollmentMessage,
        }))
        .finally(() => {
          enrollmentWindowInflight.delete("global")
        })

    if (!existing) {
      enrollmentWindowInflight.set("global", request)
    }

    request
      .then((structure) => {
        writeCache(enrollmentWindowCache, "global", structure)
        setState({
          data: structure,
          isLoading: false,
          error: null,
        })
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setState({
          data: null,
          isLoading: false,
          error: err instanceof Error ? err.message : "Unable to load enrollment status",
        })
      })
    return () => controller.abort()
  }, [refreshVersion])

  return {
    enrollmentWindow: state.data,
    isLoading: state.isLoading,
    error: state.error,
  }
}

export function useStudentFinancials() {
  const { user } = useAuth()
  const studentId = user?.studentId || user?.id
  const cachedFinancials = studentId ? readCache(studentFinancialsCache, studentId) ?? null : null
  const [state, setState] = useState<AsyncState<StudentFinancialSnapshot | null>>({
    data: cachedFinancials,
    isLoading: !cachedFinancials,
    error: null,
  })
  const { version: refreshVersion } = useFocusVisibilityRefresh()

  useEffect(() => {
    if (!studentId) {
      setState({ data: null, isLoading: false, error: null })
      return
    }

    // Seed from localStorage so previous financial snapshot shows instantly
    if (typeof window !== 'undefined' && !state.data) {
      try {
        const raw = localStorage.getItem(`${STUDENT_FINANCIALS_STORAGE_PREFIX}${studentId}`)
        if (raw) {
          const parsed = JSON.parse(raw) as StudentFinancialSnapshot
          setState({ data: parsed, isLoading: true, error: null })
        }
      } catch (err) {
        /* ignore */
      }
    }

    const cached = refreshVersion > 0 ? null : readCache(studentFinancialsCache, studentId)
    if (cached) {
      setState({ data: cached, isLoading: false, error: null })
      return
    }

    const mounted = { current: true }
    setState((prev) => ({ ...prev, isLoading: prev.data ? false : true, error: null }))
    const existing = refreshVersion > 0 ? null : studentFinancialsInflight.get(studentId)
    const request =
      existing ??
      fetchStudentFinancialSnapshot(studentId).finally(() => {
        studentFinancialsInflight.delete(studentId)
      })

    if (!existing) {
      studentFinancialsInflight.set(studentId, request)
    }

    request
      .then((snapshot) => {
        writeCache(studentFinancialsCache, studentId, snapshot)
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`${STUDENT_FINANCIALS_STORAGE_PREFIX}${studentId}`, JSON.stringify(snapshot))
          }
        } catch (err) {
          /* ignore */
        }
        if (mounted.current) {
          setState({ data: snapshot, isLoading: false, error: null })
        }
      })
      .catch((err) => {
        if (mounted.current) {
          setState({ data: null, isLoading: false, error: err instanceof Error ? err.message : "Unable to load balance" })
        }
      })
    return () => {
      // deliberately do not abort the request on unmount — allow it to finish and populate cache
      mounted.current = false
    }
  }, [studentId, refreshVersion])

  return { financials: state.data, isLoading: state.isLoading, error: state.error }
}

export function useStudentEnrollments() {
  const { user } = useAuth()
  const studentId = user?.studentId || user?.id
  const cachedEnrollments = studentId ? readCache(studentEnrollmentsCache, studentId) ?? [] : []
  const [state, setState] = useState<AsyncState<Enrollment[]>>({
    data: cachedEnrollments,
    isLoading: cachedEnrollments.length === 0,
    error: null,
  })
  const { version, refresh } = useFocusVisibilityRefresh()
  const lastVersionRequested = useRef<number | null>(null)

  useEffect(() => {
    if (!studentId) {
      setState({ data: [], isLoading: false, error: null })
      return
    }
    if (lastVersionRequested.current === version) return
    lastVersionRequested.current = version

    // seed from localStorage so previous enrollments show immediately
    if (typeof window !== 'undefined' && state.data.length === 0) {
      try {
        const raw = localStorage.getItem(`${STUDENT_ENROLLMENTS_STORAGE_PREFIX}${studentId}`)
        if (raw) {
          const parsed = JSON.parse(raw) as Enrollment[]
          setState({ data: parsed, isLoading: true, error: null })
        }
      } catch (err) {
        /* ignore */
      }
    }

    const cached = version > 0 ? null : readCache(studentEnrollmentsCache, studentId)
    if (cached) {
      setState({ data: cached, isLoading: false, error: null })
      return
    }

    const mounted = { current: true }
    let interval: ReturnType<typeof setInterval> | null = null
    setState((prev) => ({ ...prev, isLoading: prev.data.length === 0, error: null }))

    const loadEnrollments = () => {
      const existing = version > 0 ? null : studentEnrollmentsInflight.get(studentId)
      const request =
        existing ??
        fetchStudentEnrollments(studentId).finally(() => {
          studentEnrollmentsInflight.delete(studentId)
        })

      if (!existing) {
        studentEnrollmentsInflight.set(studentId, request)
      }

      request
        .then((enrollments) => {
          writeCache(studentEnrollmentsCache, studentId, enrollments)
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem(`${STUDENT_ENROLLMENTS_STORAGE_PREFIX}${studentId}`, JSON.stringify(enrollments))
            }
          } catch (err) {
            /* ignore */
          }
          if (mounted.current) {
            setState({ data: enrollments, isLoading: false, error: null })
          }
        })
        .catch((err) => {
          if (!mounted.current) return
          setState((prev) => ({
            data: prev.data,
            isLoading: false,
            error: err instanceof Error ? err.message : "Unable to load enrollments",
          }))
        })
    }

    loadEnrollments()
    interval = setInterval(loadEnrollments, 15000)

    const onLiveUpdate = () => {
      loadEnrollments()
    }
    if (typeof window !== "undefined") {
      window.addEventListener("unyt:live-update", onLiveUpdate)
    }

    return () => {
      mounted.current = false
      if (interval) clearInterval(interval)
      if (typeof window !== "undefined") {
        window.removeEventListener("unyt:live-update", onLiveUpdate)
      }
    }
  }, [studentId, version])

  const groupedBySemester = useMemo(() => {
    return state.data.reduce<Record<string, Enrollment[]>>((acc, enrollment) => {
      const semester = enrollment.semester || "Ungrouped"
      if (!acc[semester]) acc[semester] = []
      acc[semester].push(enrollment)
      return acc
    }, {})
  }, [state.data])

  return {
    enrollments: state.data,
    groupedBySemester,
    isLoading: state.isLoading,
    error: state.error,
    reload: refresh,
  }
}

export function useAvailableCourses(enabled = true) {
  const { user } = useAuth()
  const [state, setState] = useState<AsyncState<CourseAvailability[]>>(createAsyncState<CourseAvailability[]>([]))
  const { version, refresh } = useFocusVisibilityRefresh()
  const lastVersionRequested = useRef<number | null>(null)

  const reload = useCallback(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!enabled) {
      setState({ data: [], isLoading: false, error: null })
      return
    }
    if (lastVersionRequested.current === version) return
    lastVersionRequested.current = version
    const controller = new AbortController()
    let interval: ReturnType<typeof setInterval> | null = null
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    const courseFetchOptions = { limit: 100, openOnly: true, includeSchedule: false }

    const loadCourses = () =>
      fetchAvailableCourses(courseFetchOptions, controller.signal)
        .then((courses) => {
          setState({ data: courses, isLoading: false, error: null })
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setState((prev) => ({
              data: prev.data,
              isLoading: false,
              error: err instanceof Error ? err.message : "Unable to load courses",
            }))
          }
        })

    void loadCourses()
    interval = setInterval(() => {
      void loadCourses()
    }, 15000)

    const onLiveUpdate = () => {
      void loadCourses()
    }
    if (typeof window !== "undefined") {
      window.addEventListener("unyt:live-update", onLiveUpdate)
    }

    return () => {
      controller.abort()
      if (interval) clearInterval(interval)
      if (typeof window !== "undefined") {
        window.removeEventListener("unyt:live-update", onLiveUpdate)
      }
    }
  }, [enabled, version, user?.id, user?.studentId])

  return { courses: state.data, isLoading: state.isLoading, error: state.error, reload }
}

export function useEnrollInCourse() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastEnrollment, setLastEnrollment] = useState<Enrollment | null>(null)
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null)

  const enroll = useCallback(async (courseId: string, couponCode?: string | null) => {
    setIsSubmitting(true)
    setCurrentCourseId(courseId)
    setError(null)
    try {
      const enrollment = await submitEnrollmentRequest({ courseId, couponCode })
      const studentId = user?.studentId || user?.id
      if (studentId) {
        clearCacheKey(studentEnrollmentsCache, studentId)
        clearCacheKey(studentFinancialsCache, studentId)
      }
      clearCacheKey(enrollmentWindowCache, "global")
      setLastEnrollment(enrollment)
      return { success: true as const, enrollment }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to submit enrollment request'
      setError(message)
      return { success: false as const, error: message }
    } finally {
      setIsSubmitting(false)
      setCurrentCourseId(null)
    }
  }, [user?.id, user?.studentId])

  return { enroll, isSubmitting, error, lastEnrollment, currentCourseId }
}

export function useStudentGrades() {
  const { user } = useAuth()
  const studentId = user?.studentId || user?.id
  const cachedGrades = studentId ? readCache(studentGradesCache, studentId) ?? [] : []
  const [state, setState] = useState<AsyncState<EnrollmentWithCourse[]>>({
    data: cachedGrades,
    isLoading: cachedGrades.length === 0,
    error: null,
  })
  const { version } = useFocusVisibilityRefresh()

  useEffect(() => {
    if (!studentId) {
      setState({ data: [], isLoading: false, error: null })
      return
    }

    // seed from localStorage for instant display
    if (typeof window !== 'undefined' && state.data.length === 0) {
      try {
        const raw = localStorage.getItem(`${STUDENT_GRADES_STORAGE_PREFIX}${studentId}`)
        if (raw) {
          const parsed = JSON.parse(raw) as EnrollmentWithCourse[]
          setState({ data: parsed, isLoading: true, error: null })
        }
      } catch (err) {
        /* ignore */
      }
    }

    const cached = version > 0 ? null : readCache(studentGradesCache, studentId)
    if (cached) {
      setState({ data: cached, isLoading: false, error: null })
      return
    }

    const mounted = { current: true }
    setState((prev) => ({ ...prev, isLoading: prev.data.length === 0, error: null }))
    const existing = version > 0 ? null : studentGradesInflight.get(studentId)
    const request =
      existing ??
      fetchStudentGrades(studentId).finally(() => {
        studentGradesInflight.delete(studentId)
      })

    if (!existing) {
      studentGradesInflight.set(studentId, request)
    }

    request
      .then((items) => {
        writeCache(studentGradesCache, studentId, items)
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`${STUDENT_GRADES_STORAGE_PREFIX}${studentId}`, JSON.stringify(items))
          }
        } catch (err) {
          /* ignore */
        }
        if (mounted.current) {
          setState({ data: items, isLoading: false, error: null })
        }
      })
      .catch((err) => {
        // Normalize abort/timeout errors so the UI doesn't display raw abort messages
        const msg = err instanceof Error ? err.message ?? '' : ''
        const isAbort = msg.toLowerCase().includes('aborted') || msg.toLowerCase().includes('request timed out') || (err as any)?.name === 'AbortError'
        if (isAbort) return
        if (mounted.current) {
          setState({ data: [], isLoading: false, error: err instanceof Error ? err.message : "Unable to load grades" })
        }
      })
    return () => {
      // do not abort; allow fetch to finish and populate cache/localStorage
      mounted.current = false
    }
  }, [studentId, version])

  // Listen for live-update events and refresh grades when relevant
  useEffect(() => {
    if (!studentId) return
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail as { type?: string; studentId?: string }
        if (!detail) return
        if (detail.type === 'grades' && detail.studentId && detail.studentId !== studentId) return
        // clear cache and force a refetch (no signal to avoid leaking aborts from other sources)
        clearCacheKey(studentGradesCache, studentId)
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
        fetchStudentGrades(studentId)
          .then((items) => {
            writeCache(studentGradesCache, studentId, items)
            setState({ data: items, isLoading: false, error: null })
          })
          .catch((err) => {
            const msg = err instanceof Error ? err.message ?? '' : ''
            const isAbort = msg.toLowerCase().includes('aborted') || msg.toLowerCase().includes('request timed out') || (err as any)?.name === 'AbortError'
            if (isAbort) return
            setState({ data: [], isLoading: false, error: err instanceof Error ? err.message : 'Unable to load grades' })
          })
      } catch (err) {
        /* ignore malformed events */
      }
    }

    window.addEventListener('unyt:live-update', handler as EventListener)
    return () => window.removeEventListener('unyt:live-update', handler as EventListener)
  }, [studentId])

  return { grades: state.data, isLoading: state.isLoading, error: state.error }
}

export function useStudentTranscript() {
  const { user } = useAuth()
  const studentId = user?.studentId || user?.id
  const cachedTranscript = studentId ? readCache(studentTranscriptCache, studentId) ?? null : null
  const [state, setState] = useState<AsyncState<StudentTranscript | null>>({
    data: cachedTranscript,
    isLoading: !cachedTranscript,
    error: null,
  })
  const { version } = useFocusVisibilityRefresh()

  useEffect(() => {
    if (!studentId) {
      setState({ data: null, isLoading: false, error: null })
      return
    }

    const cached = version > 0 ? null : readCache(studentTranscriptCache, studentId)
    if (cached) {
      setState({ data: cached, isLoading: false, error: null })
      return
    }

    const mounted = { current: true }
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    const existing = version > 0 ? null : studentTranscriptInflight.get(studentId)
    const request =
      existing ??
      fetchStudentTranscript(studentId).finally(() => {
        studentTranscriptInflight.delete(studentId)
      })

    if (!existing) {
      studentTranscriptInflight.set(studentId, request)
    }

    request
      .then((transcript) => {
        writeCache(studentTranscriptCache, studentId, transcript)
        if (mounted.current) {
          setState({ data: transcript, isLoading: false, error: null })
        }
      })
      .catch((err) => {
        if (mounted.current) {
          setState({ data: null, isLoading: false, error: err instanceof Error ? err.message : 'Unable to load transcript' })
        }
      })

    return () => {
      mounted.current = false
    }
  }, [studentId, version])

  return { transcript: state.data, isLoading: state.isLoading, error: state.error }
}

export function useStudentHints() {
  const [state, setState] = useState<AsyncState<StudentHintsResponse>>(createAsyncState<StudentHintsResponse>({
    field: "general",
    hints: [],
  }))

  useEffect(() => {
    const controller = new AbortController()
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchStudentHints(controller.signal)
      .then((data) => {
        setState({ data, isLoading: false, error: null })
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setState((prev) => ({
            data: prev.data,
            isLoading: false,
            error: err instanceof Error ? err.message : "Unable to load hints",
          }))
        }
      })
    return () => controller.abort()
  }, [])

  return { hints: state.data, isLoading: state.isLoading, error: state.error, reload: () => undefined }
}

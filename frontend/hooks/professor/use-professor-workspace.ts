"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useMyCourses } from "@/hooks/enrollment/use-my-courses"
import {
  createProfessorWorkspaceItem,
  deleteProfessorWorkspaceItem,
  fetchProfessorWorkspace,
  publishCourseMarks,
  updateProfessorWorkspaceItem,
  type ProfessorWorkspace,
  type WorkspaceSectionKey,
} from "@/lib/professor-workspace-api"

const SELECTED_COURSE_KEY = "professor:selected-course-id"

/**
 * Shared course-selection + workspace state for every professor sub-page.
 * Selected course persists to localStorage so it carries over when navigating
 * between Materials, Quizzes, Gradebook, etc.
 */
export function useProfessorCourseWorkspace(options: { includeSchedule?: boolean } = {}) {
  const { includeSchedule = true } = options
  const { courses, isLoading: isLoadingCourses, error: coursesError } = useMyCourses({ includeSchedule })
  const [selectedCourseId, setSelectedCourseIdState] = useState("")
  const [workspace, setWorkspace] = useState<ProfessorWorkspace | null>(null)
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(SELECTED_COURSE_KEY)
    if (stored) setSelectedCourseIdState(stored)
  }, [])

  useEffect(() => {
    if (courses.length === 0) return
    setSelectedCourseIdState((prev) => (prev && courses.some((course) => course.id === prev) ? prev : courses[0].id))
  }, [courses])

  const setSelectedCourseId = useCallback((id: string) => {
    setSelectedCourseIdState(id)
    if (typeof window !== "undefined") window.localStorage.setItem(SELECTED_COURSE_KEY, id)
  }, [])

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  )

  useEffect(() => {
    if (!selectedCourseId) {
      setWorkspace(null)
      return
    }
    const controller = new AbortController()
    setIsLoadingWorkspace(true)
    fetchProfessorWorkspace(selectedCourseId, controller.signal)
      .then((data) => setWorkspace(data))
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load workspace")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingWorkspace(false)
      })
    return () => controller.abort()
  }, [selectedCourseId])

  const refreshWorkspace = useCallback(() => {
    if (!selectedCourseId) return Promise.resolve()
    return fetchProfessorWorkspace(selectedCourseId).then((data) => setWorkspace(data))
  }, [selectedCourseId])

  const createItem = useCallback(
    async <T extends Record<string, unknown>>(section: WorkspaceSectionKey, payload: T) => {
      if (!selectedCourseId) throw new Error("Select a course first")
      const saved = await createProfessorWorkspaceItem(selectedCourseId, section, payload)
      setWorkspace(saved)
      return saved
    },
    [selectedCourseId],
  )

  const updateItem = useCallback(
    async <T extends Record<string, unknown>>(section: WorkspaceSectionKey, itemId: string, payload: T) => {
      if (!selectedCourseId) throw new Error("Select a course first")
      const saved = await updateProfessorWorkspaceItem(selectedCourseId, section, itemId, payload)
      setWorkspace(saved)
      return saved
    },
    [selectedCourseId],
  )

  const removeItem = useCallback(
    async (section: WorkspaceSectionKey, itemId: string) => {
      if (!selectedCourseId) throw new Error("Select a course first")
      const saved = await deleteProfessorWorkspaceItem(selectedCourseId, section, itemId)
      setWorkspace(saved)
      return saved
    },
    [selectedCourseId],
  )

  const publishMarks = useCallback(
    async (payload?: { title?: string; message?: string }) => {
      if (!selectedCourseId) throw new Error("Select a course first")
      const saved = await publishCourseMarks(selectedCourseId, payload)
      setWorkspace(saved)
      return saved
    },
    [selectedCourseId],
  )

  return {
    courses,
    isLoadingCourses,
    coursesError,
    selectedCourseId,
    setSelectedCourseId,
    selectedCourse,
    workspace,
    isLoadingWorkspace,
    error,
    refreshWorkspace,
    createItem,
    updateItem,
    removeItem,
    publishMarks,
  }
}

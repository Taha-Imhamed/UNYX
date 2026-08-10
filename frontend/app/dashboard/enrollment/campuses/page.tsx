"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Building2, MapPin, Plus, School, Trash2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import { NamedEntityListEditor } from "@/components/enrollment/NamedEntityListEditor"
import { EMPTY_CAMPUSES, EMPTY_DEPARTMENTS, EMPTY_MAJORS, pillButtonStyles } from "@/components/enrollment/shared"
import { useAcademicStructure } from "@/hooks/enrollment/use-academic-structure"
import { useCourses } from "@/hooks/enrollment/use-courses"
import { useAuth } from "@/lib/auth-context"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import {
  createCourseRequest,
  updateAcademicStructure,
  type AcademicCampus,
  type AcademicDepartment,
  type AcademicMajor,
} from "@/lib/enrollment-api"

export default function EnrollmentCampusesPage() {
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const canManageEnrollment = hasPermission("enrollment:manage") && user?.role !== "professor"
  const canViewEnrollment = canManageEnrollment || hasPermission("enrollment:view") || user?.role === "professor"
  const enabled = !authLoading && canViewEnrollment

  const {
    academicStructure,
    setAcademicStructure,
    isLoading: structureLoading,
    refresh: refreshStructure,
  } = useAcademicStructure({ enabled, refreshKey: refreshVersion })
  const { courses, setCourses, refresh: refreshCourses } = useCourses({ enabled, refreshKey: refreshVersion })

  const [structureSaving, setStructureSaving] = useState(false)
  const [structureError, setStructureError] = useState<string | null>(null)
  const [newCampusName, setNewCampusName] = useState("")
  const [selectedCampusId, setSelectedCampusId] = useState("")
  const [quickCampusClassName, setQuickCampusClassName] = useState("")
  const [quickCampusSaving, setQuickCampusSaving] = useState(false)
  const [quickCampusError, setQuickCampusError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [campusDeleteState, setCampusDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)

  const majors = academicStructure?.majors ?? EMPTY_MAJORS
  const departments = academicStructure?.departments ?? EMPTY_DEPARTMENTS
  const campuses = academicStructure?.campuses ?? EMPTY_CAMPUSES

  const selectedCampus = useMemo(() => {
    if (campuses.length === 0) return null
    return campuses.find((campus) => campus.id === selectedCampusId) ?? campuses[0] ?? null
  }, [campuses, selectedCampusId])

  const selectedCampusClasses = useMemo(() => {
    if (!selectedCampus) return []
    return courses.filter((course) => (course.branch ?? "") === selectedCampus.name)
  }, [courses, selectedCampus])

  const campusDeleteCourseCount = useMemo(() => {
    if (!campusDeleteState.targetId) return 0
    const campus = campuses.find((entry) => entry.id === campusDeleteState.targetId)
    if (!campus) return 0
    return courses.filter((course) => (course.branch ?? "") === campus.name).length
  }, [campusDeleteState.targetId, campuses, courses])

  useEffect(() => {
    if (campuses.length === 0) {
      setSelectedCampusId("")
      return
    }
    setSelectedCampusId((current) => {
      if (current && campuses.some((campus) => campus.id === current)) {
        return current
      }
      return campuses[0]?.id ?? ""
    })
  }, [campuses])

  const saveAcademicCatalog = useCallback(
    async (nextDepartments: AcademicDepartment[], nextCampuses: AcademicCampus[], nextMajors: AcademicMajor[]) => {
      if (!academicStructure) return
      setStructureSaving(true)
      setStructureError(null)
      try {
        const updated = await updateAcademicStructure({
          departments: nextDepartments,
          campuses: nextCampuses,
          majors: nextMajors,
          enrollmentOpen: academicStructure.enrollmentOpen,
          enrollmentMessage: academicStructure.enrollmentMessage,
        })
        setAcademicStructure(updated)
      } catch (error) {
        setStructureError(error instanceof Error ? error.message : "Unable to save academic structure")
      } finally {
        setStructureSaving(false)
      }
    },
    [academicStructure, setAcademicStructure],
  )

  const addCampus = async () => {
    if (!academicStructure) return
    const name = newCampusName.trim()
    if (!name) return
    const id = `campus-${name.toLowerCase().replace(/\s+/g, "-")}`
    if (campuses.some((entry) => entry.id === id || entry.name.toLowerCase() === name.toLowerCase())) {
      setStructureError("Campus already exists")
      return
    }
    const nextCampuses = [...campuses, { id, name }]
    await saveAcademicCatalog(departments, nextCampuses, majors)
    setNewCampusName("")
  }

  const requestRemoveCampus = (campusId: string, campusName: string) => {
    setCampusDeleteState({ open: true, targetId: campusId, targetLabel: campusName, loading: false, error: null })
  }

  const confirmRemoveCampus = async () => {
    if (!academicStructure || !campusDeleteState.targetId) return
    const campusId = campusDeleteState.targetId
    setCampusDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const nextCampuses = campuses.filter((entry) => entry.id !== campusId)
      await saveAcademicCatalog(departments, nextCampuses, majors)
      if (selectedCampusId === campusId) {
        setSelectedCampusId(nextCampuses[0]?.id ?? "")
        setQuickCampusClassName("")
        setQuickCampusError(null)
      }
      setCampusDeleteState(emptyConfirmDeleteState)
    } catch (error) {
      setCampusDeleteState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to remove campus",
      }))
    }
  }

  const createQuickCampusClass = async () => {
    if (!selectedCampus) return
    const title = quickCampusClassName.trim()
    if (!title) {
      setQuickCampusError("Class name is required")
      return
    }
    setQuickCampusSaving(true)
    setQuickCampusError(null)
    try {
      const created = await createCourseRequest({
        title,
        branch: selectedCampus.name,
      })
      setCourses((current) => [created, ...current])
      setQuickCampusClassName("")
    } catch (error) {
      setQuickCampusError(error instanceof Error ? error.message : "Unable to add class")
    } finally {
      setQuickCampusSaving(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refreshStructure(), refreshCourses()])
    } catch {
      // hooks record their own error state
    } finally {
      setIsRefreshing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!canViewEnrollment) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>You need enrollment view or manage permissions to access this area.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Campuses" description="Manage campuses and their assigned classes" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav onRefresh={handleRefresh} isRefreshing={isRefreshing} />

          <div className="flex flex-1 flex-col gap-6">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-sky-700" />
                    Campus Directory
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Create the campuses that classes can be assigned to later.</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <Input
                    value={newCampusName}
                    onChange={(event) => setNewCampusName(event.target.value)}
                    placeholder="Add campus name"
                  />
                  <Button className={`gap-2 ${pillButtonStyles.primary}`} onClick={addCampus} disabled={structureSaving}>
                    <Plus className="h-4 w-4" />
                    Add campus
                  </Button>
                </div>
                <div className="space-y-2">
                  {structureLoading && campuses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading campuses…</p>
                  ) : campuses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No campuses yet.</p>
                  ) : (
                    campuses.map((campus) => (
                      <div
                        key={campus.id}
                        onClick={() => setSelectedCampusId(campus.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            setSelectedCampusId(campus.id)
                          }
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition ${selectedCampus?.id === campus.id ? "border-sky-300 bg-sky-50 shadow-sm" : "border-sky-100 bg-white/90 hover:border-sky-200 hover:bg-sky-50/60"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{campus.name}</p>
                            <p className="text-xs text-muted-foreground">{campus.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`gap-1.5 ${pillButtonStyles.dangerOutline}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              requestRemoveCampus(campus.id, campus.name)
                            }}
                            disabled={structureSaving}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {selectedCampus ? (
                  <div className="space-y-3 rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-sky-700" />
                        <p className="text-sm font-semibold text-foreground">{selectedCampus.name}</p>
                        <p className="text-xs text-muted-foreground">Click a campus, type a class name, and save it.</p>
                      </div>
                      <Badge variant="outline" className="w-fit bg-white/70 text-sky-700">{selectedCampusClasses.length} classes</Badge>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <Input
                        value={quickCampusClassName}
                        onChange={(event) => setQuickCampusClassName(event.target.value)}
                        placeholder="Type class name"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault()
                            void createQuickCampusClass()
                          }
                        }}
                      />
                      <Button className={`gap-2 ${pillButtonStyles.primary}`} onClick={createQuickCampusClass} disabled={quickCampusSaving || structureSaving}>
                        {quickCampusSaving ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {quickCampusSaving ? "Saving..." : "Add class"}
                      </Button>
                    </div>
                    {quickCampusError ? <p className="text-xs text-destructive">{quickCampusError}</p> : null}
                    <div className="space-y-2">
                      {selectedCampusClasses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No classes on this campus yet.</p>
                      ) : (
                        selectedCampusClasses.slice(0, 5).map((course) => (
                          <div key={course.id} className="flex items-center justify-between rounded-md border border-sky-100 bg-white/90 px-3 py-2 text-sm">
                            <span className="font-medium text-foreground">{course.title}</span>
                            <span className="text-xs text-muted-foreground">{course.code}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {structureError ? <Alert variant="destructive">{structureError}</Alert> : null}
          </div>
        </div>
      </div>

      <ConfirmDeleteAlert
        state={campusDeleteState}
        onOpenChange={(open) => {
          if (!open) setCampusDeleteState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmRemoveCampus}
        title="Delete campus"
        description={`Removing ${campusDeleteState.targetLabel || "this campus"} cannot be undone.`}
        confirmLabel="Delete campus"
        blockedCount={campusDeleteCourseCount}
        blockedMessage={`${campusDeleteCourseCount} course${campusDeleteCourseCount === 1 ? "" : "s"} still list ${campusDeleteState.targetLabel || "this campus"} as their campus. Reassign or remove them first.`}
      />
    </div>
  )
}

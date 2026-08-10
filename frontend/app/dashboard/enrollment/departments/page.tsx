"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { BookMarked, Building2, Filter, GraduationCap, Lock, LockOpen, Save, Trash2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { BulkCourseDialog } from "@/components/enrollment/BulkCourseDialog"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import { NamedEntityListEditor } from "@/components/enrollment/NamedEntityListEditor"
import {
  EMPTY_CAMPUSES,
  EMPTY_DEPARTMENTS,
  EMPTY_MAJORS,
  isEnrollmentWindowOpen,
  normalizeId,
  pillButtonStyles,
} from "@/components/enrollment/shared"
import { useAcademicStructure } from "@/hooks/enrollment/use-academic-structure"
import { useCourses } from "@/hooks/enrollment/use-courses"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  updateAcademicStructure,
  updateEnrollmentGlobalToggle,
  type AcademicCampus,
  type AcademicDepartment,
  type AcademicMajor,
} from "@/lib/enrollment-api"
import type { Course } from "@shared/types"

export default function EnrollmentDepartmentsPage() {
  const { toast } = useToast()
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const canManageEnrollment = hasPermission("enrollment:manage") && user?.role !== "professor"
  const canViewEnrollment = canManageEnrollment || hasPermission("enrollment:view") || user?.role === "professor"
  const enabled = !authLoading && canViewEnrollment

  const {
    academicStructure,
    setAcademicStructure,
    refresh: refreshStructure,
  } = useAcademicStructure({ enabled, refreshKey: refreshVersion })
  const { courses, setCourses, refresh: refreshCourses } = useCourses({ enabled, refreshKey: refreshVersion })

  const [structureSaving, setStructureSaving] = useState(false)
  const [structureError, setStructureError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [baseCoursesDialogOpen, setBaseCoursesDialogOpen] = useState(false)
  const [baseCoursesDepartmentId, setBaseCoursesDepartmentId] = useState("")
  const [baseCoursesMajorId, setBaseCoursesMajorId] = useState("")
  const [baseCourseIdsDraft, setBaseCourseIdsDraft] = useState<string[]>([])
  const [baseCoursesSaving, setBaseCoursesSaving] = useState(false)
  const [baseCoursesError, setBaseCoursesError] = useState<string | null>(null)
  const [editingMajorId, setEditingMajorId] = useState<string>("")
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [departmentDeleteState, setDepartmentDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)
  const [majorDeleteState, setMajorDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)
  const [majorForm, setMajorForm] = useState({
    id: "",
    name: "",
    departmentId: "",
    years: "4",
    subjectsText: "",
    courseIds: [] as string[],
  })

  const majors = academicStructure?.majors ?? EMPTY_MAJORS
  const departments = academicStructure?.departments ?? EMPTY_DEPARTMENTS
  const campuses = academicStructure?.campuses ?? EMPTY_CAMPUSES

  const openEnrollmentByMajor = useMemo(() => {
    if (academicStructure?.enrollmentOpen === false) return []
    const now = Date.now()
    return majors
      .map((major) => {
        const linkedCourses = (major.courseIds ?? [])
          .map((courseId) => courses.find((course) => course.id === courseId))
          .filter((course): course is Course => Boolean(course))
          .filter((course) => course.enrollmentOpen !== false && isEnrollmentWindowOpen(course, now))

        return {
          major,
          courses: linkedCourses,
        }
      })
      .filter((entry) => entry.courses.length > 0)
  }, [academicStructure?.enrollmentOpen, courses, majors])

  const baseCoursesMajors = useMemo(
    () => majors.filter((major) => !baseCoursesDepartmentId || major.departmentId === baseCoursesDepartmentId),
    [baseCoursesDepartmentId, majors],
  )

  const departmentDeleteImpact = useMemo(() => {
    if (!departmentDeleteState.targetId) return { majorCount: 0, courseCount: 0 }
    const departmentId = departmentDeleteState.targetId
    const majorCount = majors.filter((major) => major.departmentId === departmentId).length
    const courseCount = courses.filter((course) => normalizeId(String(course.department ?? "")) === normalizeId(departmentId)).length
    return { majorCount, courseCount }
  }, [courses, departmentDeleteState.targetId, majors])

  const selectedBaseCoursesMajor = useMemo(
    () => majors.find((major) => major.id === baseCoursesMajorId) ?? null,
    [baseCoursesMajorId, majors],
  )

  const baseCoursesCandidates = useMemo(() => {
    if (!selectedBaseCoursesMajor) return []
    const linkedIds = new Set(selectedBaseCoursesMajor.courseIds ?? [])
    const departmentMatches = courses.filter((course) => normalizeId(String(course.department ?? "")) === normalizeId(selectedBaseCoursesMajor.departmentId))
    const linkedCourses = courses.filter((course) => linkedIds.has(course.id))
    const merged = [...linkedCourses, ...departmentMatches]
    const seen = new Set<string>()
    return merged.filter((course) => {
      if (seen.has(course.id)) return false
      seen.add(course.id)
      return true
    })
  }, [courses, selectedBaseCoursesMajor])

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

  const saveGlobalEnrollmentToggle = useCallback(
    async (nextOpen: boolean) => {
      if (!academicStructure) return
      setStructureSaving(true)
      setStructureError(null)
      try {
        const updated = await updateEnrollmentGlobalToggle({
          enrollmentOpen: nextOpen,
          enrollmentMessage: academicStructure.enrollmentMessage,
        })
        setAcademicStructure(updated)
        toast({ title: nextOpen ? "Enrollment opened" : "Enrollment closed" })
      } catch (error) {
        setStructureError(error instanceof Error ? error.message : "Unable to update enrollment toggle")
      } finally {
        setStructureSaving(false)
      }
    },
    [academicStructure, setAcademicStructure, toast],
  )

  useEffect(() => {
    const sameCourseIds = (a: string[], b: string[]) =>
      a.length === b.length && a.every((value, index) => value === b[index])

    if (!editingMajorId) {
      setMajorForm((prev) => {
        const next = {
          id: "",
          name: "",
          departmentId: departments[0]?.id ?? "",
          years: "4",
          subjectsText: "",
          courseIds: [],
        }
        if (
          prev.id === next.id &&
          prev.name === next.name &&
          prev.departmentId === next.departmentId &&
          prev.years === next.years &&
          prev.subjectsText === next.subjectsText &&
          sameCourseIds(prev.courseIds, next.courseIds)
        ) {
          return prev
        }
        return next
      })
      return
    }
    const major = majors.find((entry) => entry.id === editingMajorId)
    if (!major) return
    setMajorForm((prev) => {
      const next = {
        id: major.id,
        name: major.name,
        departmentId: major.departmentId,
        years: String(major.years || 4),
        subjectsText: (major.subjects ?? []).join("\n"),
        courseIds: major.courseIds ?? [],
      }
      if (
        prev.id === next.id &&
        prev.name === next.name &&
        prev.departmentId === next.departmentId &&
        prev.years === next.years &&
        prev.subjectsText === next.subjectsText &&
        sameCourseIds(prev.courseIds, next.courseIds)
      ) {
        return prev
      }
      return next
    })
  }, [editingMajorId, departments, majors])

  useEffect(() => {
    if (!baseCoursesDialogOpen) return
    const nextDepartmentId = baseCoursesDepartmentId && departments.some((department) => department.id === baseCoursesDepartmentId)
      ? baseCoursesDepartmentId
      : departments[0]?.id ?? ""
    if (nextDepartmentId !== baseCoursesDepartmentId) {
      setBaseCoursesDepartmentId(nextDepartmentId)
      return
    }

    const filteredMajors = majors.filter((major) => !nextDepartmentId || major.departmentId === nextDepartmentId)
    const nextMajorId = baseCoursesMajorId && filteredMajors.some((major) => major.id === baseCoursesMajorId)
      ? baseCoursesMajorId
      : filteredMajors[0]?.id ?? ""
    if (nextMajorId !== baseCoursesMajorId) {
      setBaseCoursesMajorId(nextMajorId)
      return
    }

    const activeMajor = majors.find((major) => major.id === nextMajorId)
    const nextBaseIds = activeMajor?.baseCourseIds ?? []
    setBaseCourseIdsDraft((current) => {
      if (current.length === nextBaseIds.length && current.every((value, index) => value === nextBaseIds[index])) {
        return current
      }
      return nextBaseIds
    })
  }, [baseCoursesDepartmentId, baseCoursesDialogOpen, baseCoursesMajorId, departments, majors])

  const addDepartment = async () => {
    if (!academicStructure) return
    const name = newDepartmentName.trim()
    if (!name) return
    const id = `dept-${name.toLowerCase().replace(/\s+/g, "-")}`
    if (departments.some((entry) => entry.id === id || entry.name.toLowerCase() === name.toLowerCase())) {
      setStructureError("Department already exists")
      return
    }
    const nextDepartments = [...departments, { id, name }]
    await saveAcademicCatalog(nextDepartments, campuses, majors)
    setNewDepartmentName("")
  }

  const requestRemoveDepartment = (departmentId: string, departmentName: string) => {
    setDepartmentDeleteState({ open: true, targetId: departmentId, targetLabel: departmentName, loading: false, error: null })
  }

  const confirmRemoveDepartment = async () => {
    if (!academicStructure || !departmentDeleteState.targetId) return
    const departmentId = departmentDeleteState.targetId
    setDepartmentDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const nextDepartments = departments.filter((entry) => entry.id !== departmentId)
      const nextMajors = majors.filter((entry) => entry.departmentId !== departmentId)
      if (editingMajorId && nextMajors.every((entry) => entry.id !== editingMajorId)) {
        setEditingMajorId("")
      }
      await saveAcademicCatalog(nextDepartments, campuses, nextMajors)
      setDepartmentDeleteState(emptyConfirmDeleteState)
    } catch (error) {
      setDepartmentDeleteState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to remove department",
      }))
    }
  }

  const saveMajor = async () => {
    if (!academicStructure) return
    const name = majorForm.name.trim()
    if (!name || !majorForm.departmentId) {
      setStructureError("Major name and department are required")
      return
    }
    const id = (majorForm.id || `major-${name.toLowerCase().replace(/\s+/g, "-")}`).trim().toLowerCase()
    const subjects = majorForm.subjectsText
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean)
    const yearsValue = Math.max(1, Number(majorForm.years) || 4)

    const nextMajor: AcademicMajor = {
      id,
      name,
      departmentId: majorForm.departmentId,
      years: yearsValue,
      subjects,
      courseIds: majorForm.courseIds,
      baseCourseIds: majors.find((entry) => entry.id === id)?.baseCourseIds ?? [],
    }

    const hasExisting = majors.some((entry) => entry.id === id)
    const nextMajors = hasExisting
      ? majors.map((entry) => (entry.id === id ? nextMajor : entry))
      : [...majors, nextMajor]
    await saveAcademicCatalog(departments, campuses, nextMajors)
    setEditingMajorId(id)
  }

  const requestRemoveMajor = (majorId: string, majorName: string) => {
    setMajorDeleteState({ open: true, targetId: majorId, targetLabel: majorName, loading: false, error: null })
  }

  const confirmRemoveMajor = async () => {
    if (!academicStructure || !majorDeleteState.targetId) return
    const majorId = majorDeleteState.targetId
    setMajorDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const nextMajors = majors.filter((entry) => entry.id !== majorId)
      await saveAcademicCatalog(departments, campuses, nextMajors)
      if (editingMajorId === majorId) {
        setEditingMajorId("")
      }
      setMajorDeleteState(emptyConfirmDeleteState)
    } catch (error) {
      setMajorDeleteState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to remove major",
      }))
    }
  }

  const saveBaseCourses = async () => {
    if (!academicStructure) return
    if (!baseCoursesMajorId) {
      setBaseCoursesError("Pick major first")
      return
    }

    const major = majors.find((entry) => entry.id === baseCoursesMajorId)
    if (!major) {
      setBaseCoursesError("Major not found")
      return
    }

    setBaseCoursesSaving(true)
    setBaseCoursesError(null)
    try {
      const nextMajors = majors.map((entry) =>
        entry.id === major.id
          ? { ...entry, baseCourseIds: Array.from(new Set(baseCourseIdsDraft)) }
          : entry,
      )
      await saveAcademicCatalog(departments, campuses, nextMajors)
      setBaseCoursesDialogOpen(false)
      toast({ title: "Base courses saved", description: `Year 1 students in ${major.name} will get these classes automatically.` })
    } catch (error) {
      setBaseCoursesError(error instanceof Error ? error.message : "Unable to save base courses")
    } finally {
      setBaseCoursesSaving(false)
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
      <DashboardHeader title="Departments" description="Manage academic departments and majors" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            bulkAction={
              <Button onClick={() => setBulkDialogOpen(true)} className={`gap-2 ${pillButtonStyles.primary}`}>
                <Filter className="h-4 w-4" />
                Open/Close by Major &amp; Courses
              </Button>
            }
          />

          <div className="flex flex-1 flex-col gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">1 · Enrollment control</p>
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg">Enrollment Access Control</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Turn enrollment on/off everywhere, or open/close specific majors and courses. To manage a single
                    course instead, use the Courses page.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className={`gap-2 ${
                      academicStructure?.enrollmentOpen === false ? pillButtonStyles.positive : pillButtonStyles.danger
                    }`}
                    onClick={() => saveGlobalEnrollmentToggle(!(academicStructure?.enrollmentOpen ?? true))}
                    disabled={!academicStructure || structureSaving}
                  >
                    {academicStructure?.enrollmentOpen === false ? (
                      <>
                        <LockOpen className="h-4 w-4" />
                        Open Enrollment
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Close Enrollment
                      </>
                    )}
                  </Button>
                  <Button onClick={() => setBulkDialogOpen(true)} className={`gap-2 ${pillButtonStyles.primary}`}>
                    <Filter className="h-4 w-4" />
                    Open/Close by Major &amp; Courses
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50/70 p-3 text-sm text-slate-700">
                  {academicStructure?.enrollmentOpen === false ? (
                    <Lock className="h-4 w-4 text-rose-600" />
                  ) : (
                    <LockOpen className="h-4 w-4 text-emerald-600" />
                  )}
                  <span className="font-semibold text-foreground">Status: </span>
                  <span className="text-foreground">{academicStructure?.enrollmentOpen === false ? "Closed" : "Open"}</span>
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">First-year auto-enrollment</p>
                      <p className="text-xs text-slate-500">A separate setting: pick which classes year-1 students get automatically.</p>
                    </div>
                    <Button
                      className={`gap-2 ${pillButtonStyles.neutral}`}
                      variant="outline"
                      onClick={() => {
                        setBaseCoursesError(null)
                        setBaseCoursesDialogOpen(true)
                      }}
                    >
                      <BookMarked className="h-4 w-4" />
                      Base Courses
                    </Button>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Classes open now</p>
                      <p className="text-xs text-slate-500">Shows DB-saved classes linked to majors and currently open for enrollment.</p>
                    </div>
                    <Badge variant="outline">{openEnrollmentByMajor.reduce((sum, entry) => sum + entry.courses.length, 0)} classes</Badge>
                  </div>
                  {openEnrollmentByMajor.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No major-linked classes are open right now.</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {openEnrollmentByMajor.map(({ major, courses: majorCourses }) => (
                        <div key={major.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge>{major.name}</Badge>
                            <span className="text-xs text-slate-500">{majorCourses.length} open</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {majorCourses.map((course) => (
                              <div key={course.id} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                                <span className="font-medium">{course.displayId || course.code}</span>
                                {" · "}
                                <span>{course.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Dialog
                  open={baseCoursesDialogOpen}
                  onOpenChange={(open) => {
                    setBaseCoursesDialogOpen(open)
                    if (!open) {
                      setBaseCoursesError(null)
                      setBaseCoursesSaving(false)
                    }
                  }}
                >
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Base Courses</DialogTitle>
                      <DialogDescription>Select department, major, then classes to auto-assign for first-year students.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select
                          value={baseCoursesDepartmentId}
                          onValueChange={(value) => {
                            setBaseCoursesDepartmentId(value)
                            setBaseCoursesMajorId("")
                            setBaseCourseIdsDraft([])
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((department) => (
                              <SelectItem key={department.id} value={department.id}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Major</Label>
                        <Select
                          value={baseCoursesMajorId}
                          onValueChange={(value) => {
                            setBaseCoursesMajorId(value)
                            const major = majors.find((entry) => entry.id === value)
                            setBaseCourseIdsDraft(major?.baseCourseIds ?? [])
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select major" />
                          </SelectTrigger>
                          <SelectContent>
                            {baseCoursesMajors.map((major) => (
                              <SelectItem key={major.id} value={major.id}>
                                {major.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Classes</Label>
                        <div className="text-xs text-muted-foreground">Selected: {baseCourseIdsDraft.length}</div>
                      </div>
                      <div className="max-h-72 overflow-auto rounded border p-2">
                        {!selectedBaseCoursesMajor ? (
                          <p className="text-sm text-muted-foreground">Pick a major first.</p>
                        ) : baseCoursesCandidates.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No linked classes for this major yet. Link courses to the major first.</p>
                        ) : (
                          baseCoursesCandidates.map((course) => {
                            const checked = baseCourseIdsDraft.includes(course.id)
                            return (
                              <label key={course.id} className="flex items-center justify-between gap-3 rounded-md py-2">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{course.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {course.code || course.displayId || course.id}
                                    {course.sectionId ? ` • Section ${course.sectionId}` : ""}
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={baseCoursesSaving}
                                  onChange={(event) => {
                                    if (event.target.checked) {
                                      setBaseCourseIdsDraft((current) => Array.from(new Set([...current, course.id])))
                                      return
                                    }
                                    setBaseCourseIdsDraft((current) => current.filter((id) => id !== course.id))
                                  }}
                                />
                              </label>
                            )
                          })
                        )}
                      </div>
                      {selectedBaseCoursesMajor?.baseCourseIds?.length ? (
                        <p className="text-xs text-muted-foreground">
                          Saved now: {selectedBaseCoursesMajor.baseCourseIds.length} base course(s).
                        </p>
                      ) : null}
                    </div>

                    {baseCoursesError ? <p className="text-sm text-destructive">{baseCoursesError}</p> : null}

                    <DialogFooter>
                      <Button variant="outline" className={pillButtonStyles.neutral} onClick={() => setBaseCoursesDialogOpen(false)} disabled={baseCoursesSaving}>
                        Cancel
                      </Button>
                      <Button className={`gap-2 ${pillButtonStyles.primary}`} onClick={saveBaseCourses} disabled={baseCoursesSaving || !baseCoursesMajorId}>
                        {baseCoursesSaving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        {baseCoursesSaving ? "Saving..." : "Save Base Courses"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <BulkCourseDialog
                  open={bulkDialogOpen}
                  onOpenChange={setBulkDialogOpen}
                  courses={courses}
                  setCourses={setCourses}
                  academicStructure={academicStructure}
                  setAcademicStructure={setAcademicStructure}
                />
              </CardContent>
            </Card>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">2 · Academic structure</p>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-sky-700" />
                    Departments
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Add or remove departments. Removing one also removes its majors.</p>
                </CardHeader>
                <CardContent>
                  <NamedEntityListEditor
                    items={departments}
                    newName={newDepartmentName}
                    onNewNameChange={setNewDepartmentName}
                    onAdd={addDepartment}
                    onRemove={(department) => requestRemoveDepartment(department.id, department.name)}
                    saving={structureSaving}
                    addPlaceholder="Add department name"
                    emptyLabel="No departments yet."
                  />
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4 text-sky-700" />
                    Majors
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Define majors, their department, and which courses belong to them.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Choose major to edit</Label>
                    <Select value={editingMajorId || "new"} onValueChange={(value) => setEditingMajorId(value === "new" ? "" : value)}>
                      <SelectTrigger className="bg-sky-50">
                        <SelectValue placeholder="Create new major" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Create new major</SelectItem>
                        {majors.map((major) => (
                          <SelectItem key={major.id} value={major.id}>
                            {major.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label>Major Name</Label>
                      <Input value={majorForm.name} onChange={(event) => setMajorForm((prev) => ({ ...prev, name: event.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select value={majorForm.departmentId} onValueChange={(value) => setMajorForm((prev) => ({ ...prev, departmentId: value }))}>
                          <SelectTrigger className="bg-sky-50">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((department) => (
                              <SelectItem key={department.id} value={department.id}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Years</Label>
                        <Input
                          type="number"
                          min={1}
                          value={majorForm.years}
                          onChange={(event) => setMajorForm((prev) => ({ ...prev, years: event.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Subjects / Courses</Label>
                      <Textarea
                        value={majorForm.subjectsText}
                        onChange={(event) => setMajorForm((prev) => ({ ...prev, subjectsText: event.target.value }))}
                        placeholder="Write subjects, one per line"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Linked course sections</Label>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (!value) return
                          setMajorForm((prev) => ({
                            ...prev,
                            courseIds: prev.courseIds.includes(value) ? prev.courseIds : [...prev.courseIds, value],
                          }))
                        }}
                      >
                        <SelectTrigger className="bg-sky-50">
                          <SelectValue placeholder="Add course to this major" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.code} — {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2">
                        {majorForm.courseIds.map((courseId) => {
                          const course = courses.find((entry) => entry.id === courseId)
                          return (
                            <Badge key={courseId} variant="outline" className="gap-2">
                              {course?.code ?? courseId}
                              <button
                                type="button"
                                onClick={() => setMajorForm((prev) => ({ ...prev, courseIds: prev.courseIds.filter((id) => id !== courseId) }))}
                              >
                                x
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className={`gap-2 ${pillButtonStyles.primary}`} onClick={saveMajor} disabled={structureSaving}>
                        <Save className="h-4 w-4" />
                        Save Major
                      </Button>
                      {editingMajorId ? (
                        <Button
                          className={`gap-2 ${pillButtonStyles.danger}`}
                          onClick={() => {
                            const major = majors.find((entry) => entry.id === editingMajorId)
                            requestRemoveMajor(editingMajorId, major?.name ?? "")
                          }}
                          disabled={structureSaving}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove Major
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {structureError ? <Alert variant="destructive">{structureError}</Alert> : null}
          </div>
        </div>
      </div>

      <ConfirmDeleteAlert
        state={departmentDeleteState}
        onOpenChange={(open) => {
          if (!open) setDepartmentDeleteState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmRemoveDepartment}
        title="Delete department"
        description={
          departmentDeleteImpact.majorCount === 0 && departmentDeleteImpact.courseCount === 0
            ? `Removing ${departmentDeleteState.targetLabel || "this department"} cannot be undone.`
            : [
                `Removing ${departmentDeleteState.targetLabel || "this department"} cannot be undone.`,
                departmentDeleteImpact.majorCount > 0
                  ? `${departmentDeleteImpact.majorCount} major${departmentDeleteImpact.majorCount === 1 ? "" : "s"} under it will be deleted too.`
                  : null,
                departmentDeleteImpact.courseCount > 0
                  ? `${departmentDeleteImpact.courseCount} course${departmentDeleteImpact.courseCount === 1 ? "" : "s"} still list this department and will be left without one — they are not deleted.`
                  : null,
              ]
                .filter(Boolean)
                .join(" ")
        }
        confirmLabel="Delete department"
      />

      <ConfirmDeleteAlert
        state={majorDeleteState}
        onOpenChange={(open) => {
          if (!open) setMajorDeleteState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmRemoveMajor}
        title="Delete major"
        description={`Removing ${majorDeleteState.targetLabel || "this major"} cannot be undone.`}
        confirmLabel="Delete major"
      />
    </div>
  )
}

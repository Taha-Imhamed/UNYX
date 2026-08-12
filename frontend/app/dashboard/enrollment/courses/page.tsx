"use client"

import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Copy,
  Edit2,
  Filter,
  Lock,
  LockOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Unlock,
  Upload,
  User,
  X,
} from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { CourseDeleteAlert, type CourseDeleteState } from "@/components/enrollment/CourseDeleteAlert"
import { CourseEditDialog, emptyCourseForm, type CourseFormState } from "@/components/enrollment/CourseEditDialog"
import { CourseImportDialog } from "@/components/enrollment/CourseImportDialog"
import { SemesterRolloverDialog } from "@/components/enrollment/SemesterRolloverDialog"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import {
  EMPTY_CAMPUSES,
  EMPTY_DEPARTMENTS,
  EMPTY_MAJORS,
  currencyFormatter,
  dateFormatter,
  filterPendingAllowed,
  formatEligibleYearLabels,
  formatEnrollmentClosedReason,
  getEligibleYearValues,
  getEnrollmentClosedReason,
  isEnrollmentActuallyOpen,
  isEnrollmentWindowOpen,
  pillButtonStyles,
} from "@/components/enrollment/shared"
import { useAcademicStructure } from "@/hooks/enrollment/use-academic-structure"
import { useCourseEnrollmentToggle } from "@/hooks/enrollment/use-course-enrollment-toggle"
import { useCourses } from "@/hooks/enrollment/use-courses"
import { useEnrollments } from "@/hooks/enrollment/use-enrollments"
import { useProfessors } from "@/hooks/enrollment/use-professors"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  bulkUpdateCoursesRequest,
  createCourseRequest,
  deleteCourseRequest,
  fetchDeletedCourses,
  fetchSemesters,
  restoreDeletedCourseRequest,
  updateCourseRequest,
  type DeletedCourseEntry,
} from "@/lib/enrollment-api"
import type { Course, Semester } from "@shared/types"

export default function EnrollmentCoursesPage() {
  const { toast } = useToast()
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const canManageEnrollment = hasPermission("enrollment:manage") && user?.role !== "professor"
  const canViewEnrollment = canManageEnrollment || hasPermission("enrollment:view") || user?.role === "professor"
  const enabled = !authLoading && canViewEnrollment
  const role = user?.role

  const { courses, setCourses, error: coursesError, refresh: refreshCourses } = useCourses({
    enabled,
    refreshKey: refreshVersion,
  })
  const { professors, refresh: refreshProfessors } = useProfessors({ enabled, refreshKey: refreshVersion })
  const { academicStructure, refresh: refreshStructure } = useAcademicStructure({ enabled, refreshKey: refreshVersion })
  const {
    enrollments,
    setEnrollments,
    blockedEnrollmentIds,
    syncSummary,
    refresh: refreshEnrollmentList,
  } = useEnrollments({ enabled, refreshKey: refreshVersion })
  const { setEnrollmentOpen, isToggling } = useCourseEnrollmentToggle(setCourses)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [bulkRowActionSaving, setBulkRowActionSaving] = useState(false)
  const [bulkCloseConfirmOpen, setBulkCloseConfirmOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [rolloverDialogOpen, setRolloverDialogOpen] = useState(false)
  const [deletedCourses, setDeletedCourses] = useState<DeletedCourseEntry[]>([])
  const [deletedCoursesOpen, setDeletedCoursesOpen] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [courseSearch, setCourseSearch] = useState("")
  const [courseProfessorFilter, setCourseProfessorFilter] = useState<string>("all")
  const [courseCampusFilter, setCourseCampusFilter] = useState<string>("all")
  const [courseEnrollmentFilter, setCourseEnrollmentFilter] = useState<"all" | "open" | "closed">("all")

  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [courseDialogMode, setCourseDialogMode] = useState<"create" | "edit">("create")
  const [courseEditTarget, setCourseEditTarget] = useState<Course | null>(null)
  const [selectedCourseTemplateId, setSelectedCourseTemplateId] = useState("")
  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourseForm)
  const [professorDepartment, setProfessorDepartment] = useState("all")
  const [courseSaving, setCourseSaving] = useState(false)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [courseDeleteState, setCourseDeleteState] = useState<CourseDeleteState>({
    open: false,
    course: null,
    loading: false,
    error: null,
  })
  const [semesters, setSemesters] = useState<Semester[]>([])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    fetchSemesters(controller.signal)
      .then(setSemesters)
      .catch(() => {
        if (!controller.signal.aborted) setSemesters([])
      })
    return () => controller.abort()
  }, [enabled, refreshVersion])

  const majors = academicStructure?.majors ?? EMPTY_MAJORS
  const departments = academicStructure?.departments ?? EMPTY_DEPARTMENTS
  const campuses = academicStructure?.campuses ?? EMPTY_CAMPUSES

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (courseProfessorFilter !== "all" && course.professorId !== courseProfessorFilter) return false
      if (courseCampusFilter !== "all" && (course.branch ?? "") !== courseCampusFilter) return false
      if (courseEnrollmentFilter === "open" && !isEnrollmentActuallyOpen(course)) return false
      if (courseEnrollmentFilter === "closed" && isEnrollmentActuallyOpen(course)) return false
      const q = courseSearch.trim().toLowerCase()
      if (!q) return true
      return (
        (course.title || "").toLowerCase().includes(q) ||
        (course.code || "").toLowerCase().includes(q) ||
        (course.professorName || "").toLowerCase().includes(q)
      )
    })
  }, [courses, courseProfessorFilter, courseCampusFilter, courseEnrollmentFilter, courseSearch])

  const myCourses = useMemo(() => {
    if (user?.role !== "professor") return [] as Course[]
    return courses.filter((c) => c.professorId === user?.id)
  }, [courses, user?.id, user?.role])

  const selectedCoursesEnrollmentImpact = useMemo(() => {
    return selectedCourseIds.reduce((sum, id) => {
      const course = courses.find((c) => c.id === id) as (Course & { enrolledCount?: number }) | undefined
      return sum + (course?.enrolledCount ?? 0)
    }, 0)
  }, [courses, selectedCourseIds])

  const filteredProfessors = useMemo(() => {
    if (professorDepartment === "all") return professors
    return professors.filter((p) => p.department === professorDepartment)
  }, [professorDepartment, professors])

  const departmentCourses = useMemo(() => {
    if (!courseForm.departmentId) return courses
    return courses.filter((course) => course.department === courseForm.departmentId)
  }, [courseForm.departmentId, courses])

  const courseOptions = useMemo(() => {
    const seen = new Set<string>()
    return departmentCourses.filter((course) => {
      const key = `${course.title}|${course.code}`.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [departmentCourses])

  const selectedCourseDepartment = useMemo(
    () => departments.find((entry) => entry.id === courseForm.departmentId) ?? null,
    [courseForm.departmentId, departments],
  )

  const courseDeleteEnrollments = courseDeleteState.course
    ? enrollments.filter((item) => item.courseId === courseDeleteState.course?.id).length
    : 0

  const resetCourseForm = (overrides?: Partial<CourseFormState>) =>
    setCourseForm({ ...emptyCourseForm, ...overrides })

  const openCreateCourseDialog = (campusName?: string) => {
    setCourseDialogMode("create")
    setCourseEditTarget(null)
    setCourseError(null)
    setSelectedCourseTemplateId("")
    resetCourseForm({ professorId: professors[0]?.id ?? "", branch: campusName ?? "" })
    setProfessorDepartment("all")
    setCourseDialogOpen(true)
  }

  const openEditCourseDialog = (course: Course) => {
    setCourseDialogMode("edit")
    setCourseEditTarget(course)
    setCourseError(null)
    setSelectedCourseTemplateId(course.id)
    resetCourseForm({
      title: course.title,
      code: course.code,
      professorId: course.professorId,
      capacity: String(course.capacity),
      startDate: course.startDate.slice(0, 10),
      endDate: course.endDate.slice(0, 10),
      price: String(course.price),
      departmentId: course.department ?? "",
      sectionId: course.sectionId ?? "",
      branch: course.branch ?? "",
      location: course.location ?? "",
      courseType: course.courseType === "common" ? "common" : "major",
      enrollmentOpen: course.enrollmentOpen !== false,
      enrollmentStatusNote: course.enrollmentStatusNote ?? "",
      enrollmentOpenAt: (course.enrollmentOpenAt || course.enrollmentOpensAt || "").slice(0, 16),
      enrollmentCloseAt: (course.enrollmentCloseAt || course.enrollmentClosesAt || "").slice(0, 16),
      eligibleYears: getEligibleYearValues(course.eligibleSemesters),
      eligiblePrograms: Array.isArray(course.eligiblePrograms) ? (course.eligiblePrograms as string[]) : [],
      prerequisiteCourseIds: Array.isArray(course.prerequisiteCourseIds) ? (course.prerequisiteCourseIds as string[]) : [],
      semesterId: course.semesterId ?? "",
    })
    const prof = professors.find((p) => p.id === course.professorId)
    setProfessorDepartment(prof?.department ?? "all")
    setCourseDialogOpen(true)
  }

  const openDuplicateCourseDialog = (course: Course) => {
    setCourseDialogMode("create")
    setCourseEditTarget(null)
    setCourseError(null)
    setSelectedCourseTemplateId("")
    resetCourseForm({
      title: `${course.title} (Copy)`,
      code: "",
      professorId: course.professorId,
      capacity: String(course.capacity),
      startDate: "",
      endDate: "",
      price: String(course.price),
      departmentId: course.department ?? "",
      sectionId: course.sectionId ?? "",
      branch: course.branch ?? "",
      location: course.location ?? "",
      courseType: course.courseType === "common" ? "common" : "major",
      enrollmentOpen: true,
      enrollmentStatusNote: "",
      enrollmentOpenAt: "",
      enrollmentCloseAt: "",
      eligibleYears: getEligibleYearValues(course.eligibleSemesters),
      eligiblePrograms: Array.isArray(course.eligiblePrograms) ? (course.eligiblePrograms as string[]) : [],
      prerequisiteCourseIds: Array.isArray(course.prerequisiteCourseIds) ? (course.prerequisiteCourseIds as string[]) : [],
    })
    const prof = professors.find((p) => p.id === course.professorId)
    setProfessorDepartment(prof?.department ?? "all")
    setCourseDialogOpen(true)
  }

  const closeCourseDialog = () => {
    setCourseDialogOpen(false)
    setCourseEditTarget(null)
    setCourseError(null)
    setSelectedCourseTemplateId("")
    setProfessorDepartment("all")
    resetCourseForm()
  }

  const openCourseDeleteDialog = (course: Course) => {
    setCourseDeleteState({ open: true, course, loading: false, error: null })
  }

  const resetCourseDeleteState = () => setCourseDeleteState({ open: false, course: null, loading: false, error: null })

  useEffect(() => {
    if (!courseDialogOpen) return
    const activeDepartment = departments.find((entry) => entry.id === courseForm.departmentId) ?? null
    if (activeDepartment) {
      setProfessorDepartment(activeDepartment.name)
    } else if (courseForm.departmentId) {
      setProfessorDepartment("all")
    }
  }, [courseDialogOpen, courseForm.departmentId, departments])

  useEffect(() => {
    if (!courseDialogOpen) return
    // When department changes, keep a valid professor selection
    if (filteredProfessors.length > 0) {
      const existsInFiltered = filteredProfessors.some((p) => p.id === courseForm.professorId)
      if (!existsInFiltered) {
        setCourseForm((prev) => ({ ...prev, professorId: filteredProfessors[0]?.id ?? "" }))
      }
    } else {
      setCourseForm((prev) => ({ ...prev, professorId: "" }))
    }
  }, [filteredProfessors, courseDialogOpen, courseForm.professorId])

  useEffect(() => {
    const activeTemplate = courses.find((course) => course.id === selectedCourseTemplateId) ?? null
    if (!activeTemplate || !courseDialogOpen || courseDialogMode !== "create") return
    setCourseForm((prev) => ({
      ...prev,
      title: activeTemplate.title,
      code: activeTemplate.code,
      departmentId: activeTemplate.department ?? prev.departmentId,
      sectionId: activeTemplate.sectionId ?? prev.sectionId,
      branch: activeTemplate.branch ?? prev.branch,
      location: activeTemplate.location ?? prev.location,
      courseType: activeTemplate.courseType === "common" ? "common" : prev.courseType,
      eligibleYears: getEligibleYearValues(activeTemplate.eligibleSemesters),
      semesterId: activeTemplate.semesterId ?? prev.semesterId,
    }))
  }, [courseDialogMode, courseDialogOpen, courses, selectedCourseTemplateId])

  const handleCourseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!courseForm.title || !courseForm.professorId || !courseForm.departmentId || !courseForm.branch) {
      setCourseError("Provide department, course title, campus, and professor")
      return
    }
    setCourseSaving(true)
    setCourseError(null)
    try {
      const selectedDepartment = departments.find((entry) => entry.id === courseForm.departmentId)
      const eligiblePrograms = Array.isArray(courseForm.eligiblePrograms) ? courseForm.eligiblePrograms : []
      const payload = {
        title: courseForm.title,
        code: courseForm.code || `CRS-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        professorId: courseForm.professorId,
        capacity: Number(courseForm.capacity) || 20,
        startDate: courseForm.startDate,
        endDate: courseForm.endDate,
        price: Number(courseForm.price) || 0,
        department: selectedDepartment?.id || undefined,
        sectionId: courseForm.sectionId.trim() || undefined,
        branch: courseForm.branch.trim() || undefined,
        location: courseForm.location.trim() || undefined,
        courseType: courseForm.courseType,
        enrollmentOpen: courseForm.enrollmentOpen,
        enrollmentStatusNote: courseForm.enrollmentStatusNote?.trim() || null,
        enrollmentOpenAt: courseForm.enrollmentOpenAt || null,
        enrollmentCloseAt: courseForm.enrollmentCloseAt || null,
        eligibleSemesters: courseForm.eligibleYears.map((year) => `year ${year}`),
        eligiblePrograms: eligiblePrograms.length > 0 ? eligiblePrograms : undefined,
        prerequisiteCourseIds: courseForm.prerequisiteCourseIds.length > 0 ? courseForm.prerequisiteCourseIds : undefined,
        semesterId: courseForm.semesterId || null,
      }
      if (courseDialogMode === "create") {
        const created = await createCourseRequest(payload)
        setCourses((prev) => [...prev, created])
        toast({ title: "Course created" })
      } else if (courseDialogMode === "edit" && courseEditTarget) {
        const updated = await updateCourseRequest(courseEditTarget.id, payload)
        setCourses((prev) => prev.map((course) => (course.id === updated.id ? updated : course)))
        setEnrollments((prev) =>
          filterPendingAllowed(
            prev.map((enrollment) =>
              enrollment.courseId === updated.id
                ? {
                    ...enrollment,
                    courseTitle: updated.title,
                    professorId: updated.professorId,
                    professorName: updated.professorName,
                  }
                : enrollment,
            ),
            blockedEnrollmentIds.current,
          ),
        )
        toast({ title: "Course updated" })
      }
      await syncSummary()
      closeCourseDialog()
    } catch (error) {
      setCourseError(error instanceof Error ? error.message : "Unable to save course")
    } finally {
      setCourseSaving(false)
    }
  }

  const loadDeletedCourses = async () => {
    try {
      const data = await fetchDeletedCourses()
      setDeletedCourses(data)
    } catch {
      // Non-critical: silently skip, the panel just stays empty.
    }
  }

  useEffect(() => {
    if (!canManageEnrollment) return
    loadDeletedCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageEnrollment, refreshVersion])

  const handleDeleteCourse = async () => {
    if (!courseDeleteState.course) return
    setCourseDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const removed = await deleteCourseRequest(courseDeleteState.course.id)
      setCourses((prev) => prev.filter((course) => course.id !== removed.id))
      toast({ title: "Course removed", description: "You can restore it from Recently deleted for 48 hours." })
      resetCourseDeleteState()
      await syncSummary()
      await loadDeletedCourses()
    } catch (error) {
      setCourseDeleteState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to delete course",
      }))
    }
  }

  const handleRestoreCourse = async (entry: DeletedCourseEntry) => {
    setRestoringId(entry.id)
    try {
      const resp = await restoreDeletedCourseRequest(entry.id)
      setCourses((prev) => [...prev, resp.course])
      setDeletedCourses((prev) => prev.filter((d) => d.id !== entry.id))
      toast({ title: "Course restored", description: `${resp.enrollmentsRestored} enrollment(s) restored too.` })
      await syncSummary()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to restore",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setRestoringId(null)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refreshCourses(), refreshProfessors(), refreshStructure(), refreshEnrollmentList(), loadDeletedCourses()])
    } catch {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh enrollments from the server.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleBulkRowAction = async (action: "open" | "close") => {
    if (selectedCourseIds.length === 0) return
    setBulkRowActionSaving(true)
    try {
      const resp = await bulkUpdateCoursesRequest({ courseIds: selectedCourseIds, action })
      const updated = resp.updated ?? []
      if (updated.length > 0) {
        setCourses((prev) => prev.map((c) => updated.find((u) => u.id === c.id) ?? c))
      }
      toast({
        title: action === "open" ? "Enrollment opened" : "Enrollment closed",
        description: `${updated.length} course(s) updated`,
      })
      setSelectedCourseIds([])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Bulk update failed",
        description: error instanceof Error ? error.message : "Unable to update selected courses",
      })
    } finally {
      setBulkRowActionSaving(false)
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
      <DashboardHeader title="Courses" description="Manage course catalog, schedules, and capacity" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            bulkAction={
              <Button asChild className={`gap-2 ${pillButtonStyles.primary}`}>
                <Link href="/dashboard/enrollment/departments">
                  <Filter className="h-4 w-4" />
                  Open/Close by Major &amp; Courses
                </Link>
              </Button>
            }
          />

          <div className="flex flex-1 flex-col gap-6">
            {coursesError ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to load data</AlertTitle>
                <AlertDescription>{coursesError}</AlertDescription>
              </Alert>
            ) : null}

            {role === "professor" ? (
              <Card className="overflow-hidden border-sky-100 bg-[linear-gradient(180deg,#fafdff_0%,#ffffff_18%)] shadow-[0_20px_60px_rgba(14,116,144,0.08)]">
                <CardHeader className="flex flex-col gap-4 border-b border-sky-100/80 bg-white/90 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900">My Classes</CardTitle>
                    <p className="text-sm text-slate-600">Classes assigned to you.</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white/95 shadow-sm">
                    <div className="border-b border-sky-100 bg-sky-50/70 px-6 py-4">
                      <p className="text-base font-semibold text-slate-900">My Courses</p>
                      <p className="text-sm text-slate-600">Only courses you teach are shown here.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <Table className="min-w-[680px] table-fixed">
                        <TableHeader>
                          <TableRow className="bg-white">
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Course</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">ID</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Campus</TableHead>
                            <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Tuition</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myCourses.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                                No courses assigned to you.
                              </TableCell>
                            </TableRow>
                          ) : (
                            myCourses.map((course) => (
                              <TableRow key={course.id} className="border-slate-100 align-top transition-colors hover:bg-sky-50/40">
                                <TableCell className="px-4 py-3 align-top">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900">{course.title}</span>
                                    <span className="text-xs text-muted-foreground">{course.code}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 align-top">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-sm text-slate-700">{course.displayId || course.id}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 align-top">
                                  <div className="flex flex-col text-xs text-slate-700">
                                    <span className="font-medium">{course.startDate ? dateFormatter.format(new Date(course.startDate)) : '—'}</span>
                                    <span className="text-slate-500">to {course.endDate ? dateFormatter.format(new Date(course.endDate)) : '—'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-xs text-slate-700 align-top">{course.branch || 'No campus set'}</TableCell>
                                <TableCell className="px-4 py-3 align-top text-right">
                                  <div className="font-semibold text-slate-900">{currencyFormatter.format(course.price)}</div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-sky-100 bg-[linear-gradient(180deg,#fafdff_0%,#ffffff_18%)] shadow-[0_20px_60px_rgba(14,116,144,0.08)]">
                <CardHeader className="flex flex-col gap-4 border-b border-sky-100/80 bg-white/90 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900">Course Catalogue</CardTitle>
                    <p className="text-sm text-slate-600">Edit, organize, and review course setup in a cleaner workspace.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canManageEnrollment && (
                      <>
                        <Button
                          variant="outline"
                          className={`h-11 gap-2 px-5 ${pillButtonStyles.neutral}`}
                          onClick={() => setRolloverDialogOpen(true)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Roll Forward Semester
                        </Button>
                        <Button
                          variant="outline"
                          className={`h-11 gap-2 px-5 ${pillButtonStyles.neutral}`}
                          onClick={() => setImportDialogOpen(true)}
                        >
                          <Upload className="h-4 w-4" />
                          Import CSV
                        </Button>
                        <Button
                          className={`h-11 gap-2 px-5 ${pillButtonStyles.primary}`}
                          onClick={() => openCreateCourseDialog()}
                        >
                          <Plus className="h-4 w-4" />
                          New Course
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-4 rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-sm">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Total courses</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">{courses.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <Unlock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Open now</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">
                          {courses.filter((course) => isEnrollmentActuallyOpen(course)).length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-white/90 p-5 shadow-sm">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Closed</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">
                          {courses.filter((course) => !isEnrollmentActuallyOpen(course)).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {canManageEnrollment && deletedCourses.length > 0 ? (
                    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 shadow-sm">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-6 py-3 text-left"
                        onClick={() => setDeletedCoursesOpen((prev) => !prev)}
                      >
                        <span className="text-sm font-semibold text-amber-900">
                          Recently deleted ({deletedCourses.length}) — restorable for 48 hours
                        </span>
                        <span className="text-xs text-amber-700">{deletedCoursesOpen ? "Hide" : "Show"}</span>
                      </button>
                      {deletedCoursesOpen ? (
                        <div className="space-y-2 border-t border-amber-200 px-6 py-4">
                          {deletedCourses.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-white p-3 md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-foreground">{entry.course.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.course.code} · deleted {new Date(entry.deletedAt).toLocaleString()}
                                  {entry.deletedByName ? ` by ${entry.deletedByName}` : ""}
                                  {entry.enrollments.length > 0 ? ` · ${entry.enrollments.length} enrollment(s) will be restored` : ""}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                className={pillButtonStyles.positive}
                                variant="outline"
                                disabled={restoringId === entry.id}
                                onClick={() => handleRestoreCourse(entry)}
                              >
                                {restoringId === entry.id ? <Spinner className="h-3.5 w-3.5" /> : "Restore"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white/95 shadow-sm">
                    <div className="border-b border-sky-100 bg-sky-50/70 px-6 py-4">
                      <p className="text-base font-semibold text-slate-900">All Courses</p>
                      <p className="text-sm text-slate-600">Each row is spaced out and easier to scan and manage.</p>
                    </div>
                    <div className="px-6 py-4 border-b border-sky-100 bg-white/90">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="grid w-full gap-3 md:grid-cols-4">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              className="pl-9"
                              placeholder="Search courses by title, code, or professor"
                              value={courseSearch}
                              onChange={(e) => setCourseSearch(e.target.value)}
                            />
                          </div>
                          <Select value={courseProfessorFilter} onValueChange={(v) => setCourseProfessorFilter(v)}>
                            <SelectTrigger className="w-full">
                              <span className="flex min-w-0 items-center gap-2">
                                <User className="h-4 w-4 shrink-0 text-slate-400" />
                                <SelectValue placeholder="All professors" />
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All professors</SelectItem>
                              {professors.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={courseCampusFilter} onValueChange={setCourseCampusFilter}>
                            <SelectTrigger className="w-full">
                              <span className="flex min-w-0 items-center gap-2">
                                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                                <SelectValue placeholder="All campuses" />
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All campuses</SelectItem>
                              {campuses.map((campus) => (
                                <SelectItem key={campus.id} value={campus.name}>{campus.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={courseEnrollmentFilter} onValueChange={(v) => setCourseEnrollmentFilter(v as any)}>
                            <SelectTrigger className="w-full">
                              <span className="flex min-w-0 items-center gap-2">
                                <Filter className="h-4 w-4 shrink-0 text-slate-400" />
                                <SelectValue />
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className={`gap-2 ${pillButtonStyles.neutral}`}
                            onClick={() => { setCourseSearch(""); setCourseProfessorFilter("all"); setCourseCampusFilter("all"); setCourseEnrollmentFilter("all") }}
                          >
                            <X className="h-4 w-4" />
                            Clear
                          </Button>
                        </div>
                      </div>
                    </div>
                    {canManageEnrollment && selectedCourseIds.length > 0 ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 bg-primary/5 px-6 py-3">
                        <span className="text-sm font-medium text-foreground">
                          {selectedCourseIds.length} course{selectedCourseIds.length === 1 ? "" : "s"} selected
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className={pillButtonStyles.positive}
                            variant="outline"
                            disabled={bulkRowActionSaving}
                            onClick={() => handleBulkRowAction("open")}
                          >
                            {bulkRowActionSaving ? <Spinner className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                            Open selected
                          </Button>
                          <Button
                            size="sm"
                            className={pillButtonStyles.danger}
                            disabled={bulkRowActionSaving}
                            onClick={() => {
                              if (selectedCoursesEnrollmentImpact > 0) {
                                setBulkCloseConfirmOpen(true)
                                return
                              }
                              void handleBulkRowAction("close")
                            }}
                          >
                            {bulkRowActionSaving ? <Spinner className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                            Close selected
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedCourseIds([])}>
                            Clear
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    <div className="overflow-x-auto">
                      <Table className="min-w-[860px] table-fixed">
                        <TableHeader>
                          <TableRow className="bg-white">
                            {canManageEnrollment ? (
                              <TableHead className="w-10 px-4 py-3">
                                <input
                                  type="checkbox"
                                  aria-label="Select all visible courses"
                                  checked={filteredCourses.length > 0 && filteredCourses.every((c) => selectedCourseIds.includes(c.id))}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCourseIds(Array.from(new Set([...selectedCourseIds, ...filteredCourses.map((c) => c.id)])))
                                    } else {
                                      const visibleIds = new Set(filteredCourses.map((c) => c.id))
                                      setSelectedCourseIds((prev) => prev.filter((id) => !visibleIds.has(id)))
                                    }
                                  }}
                                />
                              </TableHead>
                            ) : null}
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Course</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">ID</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Professor</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Campus</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tuition</TableHead>
                            <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCourses.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={canManageEnrollment ? 8 : 7} className="py-16 text-center text-sm text-muted-foreground">
                                No courses available yet. Create a course to begin scheduling enrollments.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredCourses.map((course) => (
                              <TableRow key={course.id} className="border-slate-100 align-top transition-colors hover:bg-sky-50/40">
                                {canManageEnrollment ? (
                                  <TableCell className="px-4 py-3 align-top">
                                    <input
                                      type="checkbox"
                                      aria-label={`Select ${course.title}`}
                                      checked={selectedCourseIds.includes(course.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedCourseIds((prev) => [...prev, course.id])
                                        } else {
                                          setSelectedCourseIds((prev) => prev.filter((id) => id !== course.id))
                                        }
                                      }}
                                    />
                                  </TableCell>
                                ) : null}
                                <TableCell className="px-4 py-3 align-top">
                                  <div className="flex flex-col">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-semibold text-slate-900">{course.title}</span>
                                      <Badge
                                        className="rounded-full px-3"
                                        variant={isEnrollmentActuallyOpen(course) ? "default" : "destructive"}
                                        title={formatEnrollmentClosedReason(getEnrollmentClosedReason(course))}
                                      >
                                        {isEnrollmentActuallyOpen(course)
                                          ? "Open"
                                          : formatEnrollmentClosedReason(getEnrollmentClosedReason(course))}
                                      </Badge>
                                      {formatEligibleYearLabels(course.eligibleSemesters).map((label) => (
                                        <Badge key={`${course.id}-${label}`} variant="outline" className="rounded-full px-3">
                                          {label}
                                        </Badge>
                                      ))}
                                      {Array.isArray(course.prerequisiteCourseIds) && course.prerequisiteCourseIds.length > 0 ? (
                                        <Badge
                                          variant="outline"
                                          className="rounded-full px-3"
                                          title={course.prerequisiteCourseIds
                                            .map((id) => courses.find((c) => c.id === id)?.code ?? id)
                                            .join(", ")}
                                        >
                                          {course.prerequisiteCourseIds.length} prereq{course.prerequisiteCourseIds.length === 1 ? "" : "s"}
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {[course.code, course.sectionId ? `Section ${course.sectionId}` : null].filter(Boolean).join(" • ")}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 align-top">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-sm text-slate-700">{course.displayId || course.id}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                      onClick={() => navigator.clipboard?.writeText(course.id)}
                                      title="Copy course ID"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-xs text-slate-700 align-top">{course.professorName}</TableCell>
                                <TableCell className="px-4 py-3 text-xs text-slate-700 align-top">{course.branch || "No campus set"}</TableCell>
                                <TableCell className="px-4 py-3 align-top">
                                  <div className="flex flex-col text-xs text-slate-700">
                                    <span className="font-medium">{dateFormatter.format(new Date(course.startDate))}</span>
                                    <span className="text-slate-500">
                                      to {dateFormatter.format(new Date(course.endDate))}
                                    </span>
                                    <span className="mt-1 text-xs text-slate-500">
                                      {[course.branch, course.location].filter(Boolean).join(" • ") || "No location set"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 align-top">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900">{currencyFormatter.format(course.price)}</span>
                                    <span className="text-xs text-slate-500">Capacity {course.capacity}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 align-top">
                                  <div className="flex justify-end gap-2 items-center">
                                    <Button
                                      size="sm"
                                      className={`gap-1.5 ${
                                        isEnrollmentActuallyOpen(course) ? pillButtonStyles.danger : pillButtonStyles.positive
                                      }`}
                                      disabled={isToggling(course.id)}
                                      onClick={() => {
                                        void setEnrollmentOpen(course, !isEnrollmentActuallyOpen(course), course.enrollmentStatusNote)
                                      }}
                                    >
                                      {isToggling(course.id) ? (
                                        <Spinner className="h-3.5 w-3.5" />
                                      ) : isEnrollmentActuallyOpen(course) ? (
                                        <>
                                          <Lock className="h-3.5 w-3.5" />
                                          Close
                                        </>
                                      ) : (
                                        <>
                                          <LockOpen className="h-3.5 w-3.5" />
                                          Open
                                        </>
                                      )}
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={`gap-1.5 ${pillButtonStyles.neutral}`}
                                      disabled={isToggling(course.id)}
                                      title={isToggling(course.id) ? "Wait for the enrollment update to finish" : undefined}
                                      onClick={() => openEditCourseDialog(course)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                      Edit
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className={`h-8 w-8 ${pillButtonStyles.neutral}`}
                                      onClick={() => openDuplicateCourseDialog(course)}
                                      title="Duplicate course"
                                    >
                                      <Copy className="h-4 w-4" />
                                      <span className="sr-only">Duplicate</span>
                                    </Button>

                                    <Button
                                      size="icon"
                                      className={`h-8 w-8 ${pillButtonStyles.danger}`}
                                      disabled={isToggling(course.id)}
                                      onClick={() => openCourseDeleteDialog(course)}
                                      title={isToggling(course.id) ? "Wait for the enrollment update to finish" : "Delete course"}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <CourseImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} setCourses={setCourses} />

      <SemesterRolloverDialog
        open={rolloverDialogOpen}
        onOpenChange={setRolloverDialogOpen}
        sourceCourses={filteredCourses}
        setCourses={setCourses}
      />

      <CourseDeleteAlert
        state={courseDeleteState}
        onOpenChange={(open) => {
          if (!open) {
            resetCourseDeleteState()
          }
        }}
        courseDeleteEnrollments={courseDeleteEnrollments}
        onConfirm={handleDeleteCourse}
      />

      <CourseEditDialog
        open={courseDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCourseDialog()
          } else {
            setCourseDialogOpen(true)
          }
        }}
        mode={courseDialogMode}
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        selectedCourseTemplateId={selectedCourseTemplateId}
        setSelectedCourseTemplateId={setSelectedCourseTemplateId}
        courseOptions={courseOptions}
        selectedCourseDepartment={selectedCourseDepartment}
        filteredProfessors={filteredProfessors}
        departments={departments}
        campuses={campuses}
        majors={majors}
        semesters={semesters}
        courseSaving={courseSaving}
        courseError={courseError}
        onSubmit={handleCourseSubmit}
        onCancel={closeCourseDialog}
      />

      <AlertDialog open={bulkCloseConfirmOpen} onOpenChange={setBulkCloseConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" />
              Close enrollment for {selectedCourseIds.length} course{selectedCourseIds.length === 1 ? "" : "s"}
            </AlertDialogTitle>
            <AlertDialogDescription className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
              <span>
                {selectedCoursesEnrollmentImpact} active enrollment{selectedCoursesEnrollmentImpact === 1 ? "" : "s"}{" "}
                across these courses will lose access to enroll or re-enroll while closed.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={pillButtonStyles.neutral}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={pillButtonStyles.danger}
              onClick={() => {
                setBulkCloseConfirmOpen(false)
                void handleBulkRowAction("close")
              }}
            >
              Close enrollment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

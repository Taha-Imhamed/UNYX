"use client"

import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ArrowUpRight, BookOpen, Edit2, Plus, Trash2, TrendingUp } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import {
  EnrollmentCreateDialog,
  emptyEnrollmentCreateForm,
  type EnrollmentCreateForm,
} from "@/components/enrollment/EnrollmentCreateDialog"
import {
  EnrollmentDeleteAlert,
  type EnrollmentDeleteState,
} from "@/components/enrollment/EnrollmentDeleteAlert"
import { EnrollmentEditSheet, type EnrollmentEditForm } from "@/components/enrollment/EnrollmentEditSheet"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import { ScheduleGrid } from "@/components/enrollment/ScheduleGrid"
import {
  currencyFormatter,
  dateFormatter,
  filterPendingAllowed,
  getCouponPercent,
  getInitials,
  pendingStatuses,
  pillButtonStyles,
  statusMeta,
} from "@/components/enrollment/shared"
import { useAcademicStructure } from "@/hooks/enrollment/use-academic-structure"
import { useCouponDiscounts } from "@/hooks/enrollment/use-coupon-discounts"
import { useCourses } from "@/hooks/enrollment/use-courses"
import { useEnrollments } from "@/hooks/enrollment/use-enrollments"
import { useStudents } from "@/hooks/enrollment/use-students"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  createEnrollmentRequest,
  deleteEnrollmentRequest,
  fetchStudentEnrollments,
  updateEnrollmentRequest,
  type EnrollmentRecord,
} from "@/lib/enrollment-api"
import type { EnrollmentStatus } from "@shared/types"

export default function EnrollmentRecordsPage() {
  const { toast } = useToast()
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const canManageEnrollment = hasPermission("enrollment:manage") && user?.role !== "professor"
  const canViewEnrollment = canManageEnrollment || hasPermission("enrollment:view") || user?.role === "professor"
  const enabled = !authLoading && canViewEnrollment
  const role = user?.role
  const hideTuition = role === "professor" || role === "student"

  const {
    enrollments,
    setEnrollments,
    summary,
    isRefreshing,
    loadError,
    blockedEnrollmentIds,
    persistBlocked,
    refresh: refreshEnrollmentList,
    syncSummary,
  } = useEnrollments({ enabled, refreshKey: refreshVersion })
  const { courses, refresh: refreshCourses } = useCourses({ enabled, refreshKey: refreshVersion })
  const { students, setStudents, refresh: refreshStudents } = useStudents({ enabled, refreshKey: refreshVersion })
  const { couponDiscounts, refresh: refreshCoupons } = useCouponDiscounts({ enabled, refreshKey: refreshVersion })
  const { academicStructure, refresh: refreshStructure } = useAcademicStructure({ enabled, refreshKey: refreshVersion })

  const [manualRefreshing, setManualRefreshing] = useState(false)
  const [studentManagerSearch, setStudentManagerSearch] = useState("")
  const [managedStudentId, setManagedStudentId] = useState("")
  const [managedStudentEnrollments, setManagedStudentEnrollments] = useState<EnrollmentRecord[]>([])
  const [managedStudentLoading, setManagedStudentLoading] = useState(false)
  const [managedStudentError, setManagedStudentError] = useState<string | null>(null)

  const [editState, setEditState] = useState<{ open: boolean; record: EnrollmentRecord | null }>({
    open: false,
    record: null,
  })
  const [editForm, setEditForm] = useState<EnrollmentEditForm>({
    courseId: "",
    status: "pending" as EnrollmentStatus,
    startDate: "",
    endDate: "",
    price: "",
    professorId: "",
    couponCode: "",
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<EnrollmentCreateForm>(emptyEnrollmentCreateForm)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [deleteState, setDeleteState] = useState<EnrollmentDeleteState>({
    open: false,
    record: null,
    loading: false,
    error: null,
  })

  const normalizedStudentManagerSearch = useMemo(
    () => studentManagerSearch.trim().toLowerCase(),
    [studentManagerSearch],
  )

  useEffect(() => {
    if (students.length === 0) {
      setManagedStudentId("")
      return
    }
    setManagedStudentId((current) => {
      if (current && students.some((student) => student.id === current)) {
        return current
      }
      return students[0]?.id ?? ""
    })
  }, [students])

  useEffect(() => {
    if (!managedStudentId) {
      setManagedStudentEnrollments([])
      setManagedStudentError(null)
      return
    }
    const controller = new AbortController()
    setManagedStudentLoading(true)
    setManagedStudentError(null)
    fetchStudentEnrollments(managedStudentId, controller.signal)
      .then((items) => setManagedStudentEnrollments(items))
      .catch((error) => {
        if (controller.signal.aborted) return
        setManagedStudentError(error instanceof Error ? error.message : "Unable to load student enrollments")
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setManagedStudentLoading(false)
        }
      })
    return () => controller.abort()
  }, [managedStudentId])

  const managedStudents = useMemo(() => {
    const enrollmentCounts = new Map<string, number>()
    enrollments.forEach((item) => {
      enrollmentCounts.set(item.student.id, (enrollmentCounts.get(item.student.id) ?? 0) + 1)
    })
    return [...students]
      .filter((student) => {
        if (!normalizedStudentManagerSearch) return true
        const haystack = [
          student.firstName,
          student.lastName,
          student.email,
          student.displayId,
          student.program,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return haystack.includes(normalizedStudentManagerSearch)
      })
      .sort((a, b) => {
        const countDiff = (enrollmentCounts.get(b.id) ?? 0) - (enrollmentCounts.get(a.id) ?? 0)
        if (countDiff !== 0) return countDiff
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      })
  }, [students, enrollments, normalizedStudentManagerSearch])

  const managedStudent = useMemo(
    () => students.find((student) => student.id === managedStudentId) ?? null,
    [students, managedStudentId],
  )

  const managedStudentSchedule = useMemo(() => {
    return managedStudentEnrollments
      .filter((enrollment) => enrollment.status !== "cancelled" && enrollment.status !== "dropped" && enrollment.status !== "rejected")
      .flatMap((enrollment) => {
        const matchingCourse = courses.find((course) => course.id === enrollment.courseId)
        return (matchingCourse?.schedule ?? []).map((slot) => ({
          ...slot,
          courseId: enrollment.courseId,
          courseTitle: enrollment.courseTitle,
          courseCode: matchingCourse?.code,
          professorName: enrollment.professorName,
          sectionId: matchingCourse?.sectionId,
          branch: matchingCourse?.branch,
          location: slot.location || matchingCourse?.location,
          status: enrollment.status,
          source: "existing" as const,
        }))
      })
  }, [managedStudentEnrollments, courses])

  // ----- pricing derivations (identical to the previous monolithic page) -----
  const selectedCreateCourse = useMemo(() => {
    if (!createForm.courseId) return null
    return courses.find((course) => course.id === createForm.courseId) ?? null
  }, [courses, createForm.courseId])

  const createCouponPercent = getCouponPercent(createForm.couponCode, couponDiscounts)
  const createBasePrice = selectedCreateCourse?.price ?? 0
  const createDiscountAmount = createCouponPercent ? Number((createBasePrice * createCouponPercent).toFixed(2)) : 0
  const createOverridePriceRaw = createForm.price ? Number(createForm.price) : null
  const createOverridePrice =
    createOverridePriceRaw !== null && Number.isFinite(createOverridePriceRaw)
      ? Number(createOverridePriceRaw.toFixed(2))
      : null
  const createFinalPrice = createCouponPercent
    ? Number((createBasePrice - createDiscountAmount).toFixed(2))
    : createOverridePrice ?? createBasePrice

  const selectedEditCourse = useMemo(() => {
    if (!editForm.courseId) return null
    return courses.find((course) => course.id === editForm.courseId) ?? null
  }, [courses, editForm.courseId])

  const editCouponPercent = getCouponPercent(editForm.couponCode, couponDiscounts)
  const editBasePrice = selectedEditCourse?.price ?? editState.record?.basePrice ?? editState.record?.price ?? 0
  const editDiscountAmount = editCouponPercent ? Number((editBasePrice * editCouponPercent).toFixed(2)) : 0
  const editOverridePriceRaw = editForm.price ? Number(editForm.price) : null
  const editOverridePrice =
    editOverridePriceRaw !== null && Number.isFinite(editOverridePriceRaw)
      ? Number(editOverridePriceRaw.toFixed(2))
      : null
  const editFinalPrice = editCouponPercent
    ? Number((editBasePrice - editDiscountAmount).toFixed(2))
    : editOverridePrice ?? editState.record?.price ?? editBasePrice

  const fallbackTuitionPipeline = useMemo(
    () => enrollments.reduce((sum, record) => (record.status === "cancelled" ? sum : sum + record.price), 0),
    [enrollments],
  )
  const tuitionPipeline = summary?.tuitionPipeline ?? fallbackTuitionPipeline
  const totalEnrollments = summary?.total ?? enrollments.length

  const fallbackActiveStudents = useMemo(
    () => enrollments.filter((item) => item.status === "active").length,
    [enrollments],
  )
  const activeStudents = summary?.activeStudents ?? fallbackActiveStudents

  const globalEnrollmentOpen = academicStructure?.enrollmentOpen !== false

  // ----- actions -----
  function openEditor(record: EnrollmentRecord) {
    setEditState({ open: true, record })
    setEditError(null)
    setEditForm({
      courseId: record.courseId,
      status: record.status,
      startDate: record.startDate.slice(0, 10),
      endDate: record.endDate.slice(0, 10),
      price: String(record.price),
      professorId: record.professorId,
      couponCode: record.couponCode ?? "",
    })
  }

  function openDeleteDialog(record: EnrollmentRecord) {
    setDeleteState({ open: true, record, loading: false, error: null })
  }

  const resetDeleteState = () => setDeleteState({ open: false, record: null, loading: false, error: null })

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editState.record) return
    setSavingEdit(true)
    setEditError(null)
    try {
      const rawCouponInput = editForm.couponCode.trim()
      const couponPercent = getCouponPercent(editForm.couponCode, couponDiscounts)
      if (rawCouponInput && !couponPercent) {
        throw new Error("Coupon code is not valid")
      }

      const previousCoupon = editState.record.couponCode ?? ""
      const couponChanged = rawCouponInput.toLowerCase() !== previousCoupon.toLowerCase()

      const payload = {
        courseId: editForm.courseId,
        status: editForm.status,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        price: couponPercent ? undefined : editForm.price ? Number(editForm.price) : undefined,
        professorId: editForm.professorId,
        couponCode: couponChanged ? (rawCouponInput ? rawCouponInput.toLowerCase() : "") : undefined,
      }
      const updated = await updateEnrollmentRequest(editState.record.id, payload)
      setEnrollments((prev) => {
        const next = prev.map((item) => (item.id === updated.id ? updated : item))
        if (!pendingStatuses.has(updated.status as EnrollmentStatus)) {
          blockedEnrollmentIds.current.add(updated.id)
          persistBlocked()
          return next.filter((item) => item.id !== updated.id)
        }
        return filterPendingAllowed(next, blockedEnrollmentIds.current)
      })
      setManagedStudentEnrollments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setEditState({ open: false, record: null })
      syncSummary().catch(() =>
        toast({
          title: "Summary refresh failed",
          description: "Latest enrollment metrics could not be loaded.",
          variant: "destructive",
        }),
      )
      toast({ title: "Enrollment updated" })
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Unable to update enrollment")
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteEnrollment = async () => {
    if (!deleteState.record) return
    setDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const removed = await deleteEnrollmentRequest(deleteState.record.id)
      blockedEnrollmentIds.current.add(removed.id)
      persistBlocked()
      setEnrollments((prev) => prev.filter((item) => item.id !== removed.id))
      setManagedStudentEnrollments((prev) => prev.filter((item) => item.id !== removed.id))
      setStudents((prev) =>
        prev.map((student) =>
          student.id === removed.student.id ? { ...student, balance: removed.student.balance } : student,
        ),
      )
      toast({
        title: "Enrollment removed",
        description: `${removed.student.firstName} ${removed.student.lastName} was unenrolled and their balance updated.`,
      })
      await syncSummary().catch(() =>
        toast({
          title: "Summary refresh failed",
          description: "Latest enrollment metrics could not be loaded.",
          variant: "destructive",
        }),
      )
      resetDeleteState()
    } catch (error) {
      setDeleteState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to delete enrollment",
      }))
    }
  }

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.studentId || !createForm.courseId) {
      setCreateError("Select both student and course")
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const rawCouponInput = createForm.couponCode.trim()
      const couponPercent = getCouponPercent(createForm.couponCode, couponDiscounts)
      if (rawCouponInput && !couponPercent) {
        throw new Error("Coupon code is not valid")
      }

      const payload = {
        studentId: createForm.studentId,
        courseId: createForm.courseId,
        status: createForm.status,
        startDate: createForm.startDate || undefined,
        endDate: createForm.endDate || undefined,
        price: couponPercent ? undefined : createForm.price ? Number(createForm.price) : undefined,
        couponCode: rawCouponInput ? rawCouponInput.toLowerCase() : undefined,
      }
      const created = await createEnrollmentRequest(payload)
      setEnrollments((prev) => {
        const next = [created, ...prev]
        return filterPendingAllowed(next, blockedEnrollmentIds.current)
      })
      if (created.studentId === managedStudentId) {
        setManagedStudentEnrollments((prev) => [created, ...prev])
      }
      setStudents((prev) =>
        prev.map((student) =>
          student.id === created.student.id ? { ...student, balance: created.student.balance } : student,
        ),
      )
      setCreateOpen(false)
      await syncSummary().catch(() =>
        toast({
          title: "Summary refresh failed",
          description: "Latest enrollment metrics could not be loaded.",
          variant: "destructive",
        }),
      )
      toast({ title: "Enrollment created" })
      setCreateForm(emptyEnrollmentCreateForm)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create enrollment")
    } finally {
      setCreating(false)
    }
  }

  const handleRefresh = async () => {
    if (!canViewEnrollment) return
    setManualRefreshing(true)
    try {
      await Promise.all([
        refreshEnrollmentList(),
        refreshStudents(),
        refreshCourses(),
        refreshCoupons(),
        refreshStructure(),
      ])
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh enrollments from the server.",
        variant: "destructive",
      })
    } finally {
      setManualRefreshing(false)
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
      <DashboardHeader title="Enrollments" description="Manage student placements and tuition tracking" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav
            onRefresh={handleRefresh}
            isRefreshing={manualRefreshing || isRefreshing}
            bulkAction={
              <Button asChild className={`gap-2 ${pillButtonStyles.primary}`}>
                <Link href="/dashboard/enrollment/departments">Open/Close by Major &amp; Courses</Link>
              </Button>
            }
          />

          <div className="flex flex-1 flex-col gap-6">
            {loadError && (
              <Alert variant="destructive">
                <AlertTitle>Unable to load data</AlertTitle>
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border bg-card">
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Enrollments</p>
                    <p className="text-3xl font-semibold text-foreground">{totalEnrollments}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <BookOpen className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Students</p>
                    <p className="text-3xl font-semibold text-foreground">{activeStudents}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
              {!hideTuition && (
                <Card className="border-border bg-card">
                  <CardContent className="flex items-center justify-between gap-4 p-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Tuition Pipeline</p>
                      <p className="text-3xl font-semibold text-foreground">
                        {currencyFormatter.format(tuitionPipeline)}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                      <ArrowUpRight className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">Student Enrollment Manager</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Search for a student, review their current schedule, edit assigned enrollments, and add more courses.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="student-manager-search">Search student</Label>
                      <Input
                        id="student-manager-search"
                        placeholder="Search by name, email, ID, or program"
                        value={studentManagerSearch}
                        onChange={(event) => setStudentManagerSearch(event.target.value)}
                        className="h-11 rounded-xl border-sky-100 bg-sky-50"
                      />
                    </div>
                    <div className="grid gap-2 rounded-xl border border-border/70 bg-secondary/10 p-3 md:grid-cols-2 xl:grid-cols-3">
                      {managedStudents.slice(0, 6).map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setManagedStudentId(student.id)}
                          className={`rounded-xl border p-3 text-left transition ${
                            managedStudentId === student.id
                              ? "border-sky-300 bg-sky-50 shadow-sm"
                              : "border-border/60 bg-white hover:border-sky-200 hover:bg-sky-50/50"
                          }`}
                        >
                          <p className="font-medium text-foreground">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                          <p className="text-xs text-muted-foreground">{student.displayId || student.program || "Student record"}</p>
                        </button>
                      ))}
                      {managedStudents.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/70 bg-white/80 p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                          No students match your search.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                    {managedStudent ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={managedStudent.photo || "/placeholder.svg"} alt={managedStudent.firstName} />
                            <AvatarFallback>{getInitials(managedStudent.firstName, managedStudent.lastName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">
                              {managedStudent.firstName} {managedStudent.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{managedStudent.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {managedStudent.displayId || "No student ID"} {managedStudent.program ? `• ${managedStudent.program}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border border-white/70 bg-white/80 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Assigned courses</p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">{managedStudentEnrollments.length}</p>
                          </div>
                          <div className="rounded-lg border border-white/70 bg-white/80 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Weekly sessions</p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">{managedStudentSchedule.length}</p>
                          </div>
                        </div>
                        <Button
                          className={`w-full gap-2 ${pillButtonStyles.primary}`}
                          onClick={() => {
                            setCreateError(null)
                            setCreateForm((prev) => ({
                              ...prev,
                              studentId: managedStudent.id,
                              courseId: prev.courseId || courses[0]?.id || "",
                              price: prev.courseId ? prev.price : String(courses[0]?.price ?? ""),
                            }))
                            setCreateOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Assign course to this student
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Select a student to manage enrollments.</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  <Card className="border-border bg-card/60 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Assigned Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {managedStudentLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ) : managedStudentError ? (
                        <Alert variant="destructive">{managedStudentError}</Alert>
                      ) : managedStudentEnrollments.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/70 bg-secondary/10 py-10 text-center text-sm text-muted-foreground">
                          This student does not have assigned courses yet.
                        </div>
                      ) : (
                        managedStudentEnrollments.map((record) => {
                          const matchingCourse = courses.find((course) => course.id === record.courseId)
                          return (
                            <div key={record.id} className="rounded-xl border border-border/70 bg-white/90 p-4">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-foreground">{record.courseTitle}</p>
                                    <Badge variant={statusMeta[record.status].badge}>{statusMeta[record.status].label}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {[matchingCourse?.code, record.professorName, matchingCourse?.sectionId ? `Section ${matchingCourse.sectionId}` : ""]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {dateFormatter.format(new Date(record.startDate))} to {dateFormatter.format(new Date(record.endDate))}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`gap-2 ${pillButtonStyles.neutral}`}
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      openEditor(record)
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    className={`gap-2 ${pillButtonStyles.danger}`}
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      openDeleteDialog(record)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card/60 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Student Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {managedStudentLoading ? (
                        <Skeleton className="h-[560px] w-full" />
                      ) : managedStudentSchedule.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/70 bg-secondary/10 py-10 text-center text-sm text-muted-foreground">
                          No schedule is available for the selected student yet.
                        </div>
                      ) : (
                        <ScheduleGrid sessions={managedStudentSchedule as any} conflicts={[]} readOnly height={620} />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EnrollmentEditSheet
        editState={editState}
        setEditState={setEditState}
        editForm={editForm}
        setEditForm={setEditForm}
        courses={courses}
        hideTuition={hideTuition}
        editCouponPercent={editCouponPercent}
        editDiscountAmount={editDiscountAmount}
        editFinalPrice={editFinalPrice}
        savingEdit={savingEdit}
        editError={editError}
        onSubmit={handleEditSubmit}
      />

      <EnrollmentDeleteAlert
        state={deleteState}
        onOpenChange={(open) => {
          if (!open) {
            resetDeleteState()
          }
        }}
        onConfirm={handleDeleteEnrollment}
      />

      <EnrollmentCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        createForm={createForm}
        setCreateForm={setCreateForm}
        students={students}
        courses={courses}
        hideTuition={hideTuition}
        globalEnrollmentOpen={globalEnrollmentOpen}
        createCouponPercent={createCouponPercent}
        createDiscountAmount={createDiscountAmount}
        createFinalPrice={createFinalPrice}
        createError={createError}
        creating={creating}
        onSubmit={handleCreateSubmit}
      />
    </div>
  )
}

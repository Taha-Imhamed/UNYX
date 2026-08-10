"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
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
import { AlertTriangle, Building2, CalendarDays, Download, Edit2, Lightbulb, Lock, LockOpen, MapPin, Plus, Users } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { CourseScheduleEditorDialog } from "@/components/enrollment/CourseScheduleEditorDialog"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import { ScheduleGrid } from "@/components/enrollment/ScheduleGrid"
import {
  formatEnrollmentClosedReason,
  getEnrollmentClosedReason,
  isEnrollmentActuallyOpen,
  pillButtonStyles,
  scheduleDays,
} from "@/components/enrollment/shared"
import { useCourseEnrollmentToggle } from "@/hooks/enrollment/use-course-enrollment-toggle"
import { useCourses } from "@/hooks/enrollment/use-courses"
import { useProfessors } from "@/hooks/enrollment/use-professors"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  downloadAdminScheduleReport,
  fetchAdminAvailableRooms,
  fetchAdminScheduleAtTime,
  updateAdminScheduleRoom,
  updateCourseRequest,
  updateCourseScheduleRequest,
  type AdminScheduleSlotItem,
} from "@/lib/enrollment-api"
import type { CourseScheduleEntry } from "@shared/types"

export default function EnrollmentSchedulePage() {
  const { toast } = useToast()
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const canManageEnrollment = hasPermission("enrollment:manage") && user?.role !== "professor"
  const canViewEnrollment = canManageEnrollment || hasPermission("enrollment:view") || user?.role === "professor"
  const canViewScheduleDetails = hasPermission("ADMIN_VIEW_SCHEDULE") || hasPermission("MANAGE_RESOURCES")
  const canManageScheduleResources = hasPermission("MANAGE_RESOURCES")
  const canDownloadScheduleReport = canViewScheduleDetails && hasPermission("reports:export")
  const scheduleReadOnly = !canManageEnrollment
  const enabled = !authLoading && canViewEnrollment

  const { courses, setCourses, refresh: refreshCourses } = useCourses({ enabled, refreshKey: refreshVersion })
  const { professors, refresh: refreshProfessors } = useProfessors({ enabled, refreshKey: refreshVersion })
  const { setEnrollmentOpen } = useCourseEnrollmentToggle(setCourses)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [scheduleCourseId, setScheduleCourseId] = useState("")
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [closeNote, setCloseNote] = useState("")
  const [closingEnrollment, setClosingEnrollment] = useState(false)

  const [adminScheduleOpen, setAdminScheduleOpen] = useState(false)
  const [adminScheduleLoading, setAdminScheduleLoading] = useState(false)
  const [adminScheduleItems, setAdminScheduleItems] = useState<AdminScheduleSlotItem[]>([])
  const [adminScheduleSlot, setAdminScheduleSlot] = useState<{ day: CourseScheduleEntry["day"]; startTime: string; endTime?: string } | null>(null)
  const [adminRoomSuggestions, setAdminRoomSuggestions] = useState<Record<string, string[]>>({})
  const [adminRoomLoading, setAdminRoomLoading] = useState<Record<string, boolean>>({})
  const [adminRoomErrors, setAdminRoomErrors] = useState<Record<string, string | null>>({})
  const [adminRoomUpdating, setAdminRoomUpdating] = useState<Record<string, boolean>>({})
  const [scheduleReportDownloading, setScheduleReportDownloading] = useState(false)

  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false)
  const [scheduleDraft, setScheduleDraft] = useState<CourseScheduleEntry[]>([])
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleProfessorId, setScheduleProfessorId] = useState<string>("")
  const [scheduleProfessorDepartment, setScheduleProfessorDepartment] = useState<string>("all")

  const [placementOpen, setPlacementOpen] = useState(false)
  const [placementDay, setPlacementDay] = useState<CourseScheduleEntry["day"]>("monday")
  const [placementCourseId, setPlacementCourseId] = useState("")
  const [placementStart, setPlacementStart] = useState("09:00")
  const [placementEnd, setPlacementEnd] = useState("10:00")
  const [placementLocation, setPlacementLocation] = useState("")
  const [placementDepartment, setPlacementDepartment] = useState("")
  const [placementBranch, setPlacementBranch] = useState("")
  const [placementSaving, setPlacementSaving] = useState(false)

  useEffect(() => {
    if (courses.length === 0) return
    const preferred = courses.find((course) => (course.schedule?.length ?? 0) > 0) ?? courses[0]
    setScheduleCourseId((current) => {
      const stillExists = current && courses.some((course) => course.id === current)
      return stillExists ? current : preferred?.id ?? ""
    })
  }, [courses])

  useEffect(() => {
    if (!placementCourseId && courses.length > 0) {
      setPlacementCourseId(courses[0].id)
    }
  }, [courses, placementCourseId])

  const scheduleCourse = useMemo(() => {
    if (scheduleCourseId) return courses.find((course) => course.id === scheduleCourseId) ?? null
    return courses[0] ?? null
  }, [courses, scheduleCourseId])

  useEffect(() => {
    setCloseNote(scheduleCourse?.enrollmentStatusNote ?? "")
  }, [scheduleCourse?.id, scheduleCourse?.enrollmentStatusNote])

  const scheduleSlots = scheduleCourse?.schedule ?? []

  useEffect(() => {
    if (scheduleCourse && Array.isArray(scheduleCourse.schedule)) {
      setScheduleDraft(scheduleCourse.schedule.length > 0 ? [...scheduleCourse.schedule] : [])
    } else {
      setScheduleDraft([])
    }
  }, [scheduleCourse])

  useEffect(() => {
    setScheduleProfessorId(scheduleCourse?.professorId ?? "")
    const prof = professors.find((p) => p.id === scheduleCourse?.professorId)
    setScheduleProfessorDepartment(prof?.department ?? "all")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleCourse?.professorId])

  const professorDepartments = useMemo(() => {
    const unique = new Set<string>()
    professors.forEach((p) => {
      if (p.department) unique.add(p.department)
    })
    return ["all", ...Array.from(unique)]
  }, [professors])

  const filteredScheduleProfessors = useMemo(() => {
    if (scheduleProfessorDepartment === "all") return professors
    return professors.filter((p) => p.department === scheduleProfessorDepartment)
  }, [professors, scheduleProfessorDepartment])

  useEffect(() => {
    if (filteredScheduleProfessors.length === 0) {
      setScheduleProfessorId("")
      return
    }
    const exists = filteredScheduleProfessors.some((p) => p.id === scheduleProfessorId)
    if (!exists) {
      setScheduleProfessorId(filteredScheduleProfessors[0].id)
    }
  }, [filteredScheduleProfessors, scheduleProfessorId])

  const courseColorMap = useMemo(() => {
    const palette = ["#2563eb", "#7c3aed", "#16a34a", "#f97316", "#0891b2", "#dc2626", "#a16207", "#be185d"]
    const map = new Map<string, string>()
    courses.forEach((course, idx) => {
      map.set(course.id, palette[idx % palette.length])
    })
    return map
  }, [courses])

  const allScheduleSessions = useMemo(
    () =>
      courses.flatMap((course) =>
        (course.schedule ?? []).map((slot, idx) => ({
          ...slot,
          id: `${course.id}-${idx}`,
          courseId: course.id,
          courseTitle: course.title,
          courseCode: course.code,
          location: slot.location ?? course.location ?? course.branch,
          professorId: course.professorId,
          professorName: course.professorName,
          color: courseColorMap.get(course.id) ?? "#2563eb",
        })),
      ),
    [courses, courseColorMap],
  )

  const toMinutes = useCallback((time: string) => {
    const [h, m] = time.split(":")
    const hours = Number(h)
    const minutes = Number(m ?? 0)
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return NaN
    return hours * 60 + minutes
  }, [])

  const scheduleGridSessions = useMemo(
    () =>
      scheduleSlots.map((slot, idx) => ({
        ...slot,
        id: `${scheduleCourse?.id ?? "course"}-${idx}`,
        courseId: scheduleCourse?.id ?? `course-${idx}`,
        courseTitle: scheduleCourse?.title,
        courseCode: scheduleCourse?.code,
        branch: slot.branch ?? scheduleCourse?.branch ?? scheduleCourse?.location,
        location: slot.location,
        professorName: scheduleCourse?.professorName,
      })),
    [
      scheduleCourse?.branch,
      scheduleCourse?.code,
      scheduleCourse?.id,
      scheduleCourse?.location,
      scheduleCourse?.professorName,
      scheduleCourse?.title,
      scheduleSlots,
    ],
  )

  const scheduleGridConflicts = useMemo(() => {
    const byDay = new Map<CourseScheduleEntry["day"], typeof scheduleGridSessions>()
    scheduleGridSessions.forEach((session) => {
      const bucket = byDay.get(session.day) ?? []
      bucket.push(session)
      byDay.set(session.day, bucket)
    })
    const map = new Map<CourseScheduleEntry["day"], Set<string>>()
    byDay.forEach((sessions, day) => {
      const sorted = sessions
        .map((session) => ({
          session,
          id: session.courseId ?? session.id ?? `${session.day}-${session.startTime}-${session.endTime}`,
          start: toMinutes(session.startTime),
          end: toMinutes(session.endTime),
        }))
        .sort((a, b) => a.start - b.start)

      for (let i = 0; i < sorted.length - 1; i += 1) {
        const current = sorted[i]
        for (let j = i + 1; j < sorted.length; j += 1) {
          const next = sorted[j]
          if (next.start < current.end) {
            const bucket = map.get(day) ?? new Set<string>()
            bucket.add(current.id)
            bucket.add(next.id)
            map.set(day, bucket)
          } else {
            break
          }
        }
      }
    })

    return Array.from(map.entries())
      .filter(([, ids]) => ids.size > 0)
      .map(([day, ids]) => ({ day, courseIds: Array.from(ids) }))
  }, [scheduleGridSessions, toMinutes])

  const allScheduleGridSessions = useMemo(
    () =>
      allScheduleSessions.map((session, idx) => ({
        ...session,
        id: session.id ?? `${session.courseId ?? "session"}-${idx}`,
      })),
    [allScheduleSessions],
  )

  const allScheduleGridConflicts = useMemo(() => {
    const normalizeRoom = (value?: string | null) => value?.trim().toLowerCase() ?? ""
    const byDay = new Map<CourseScheduleEntry["day"], typeof allScheduleGridSessions>()
    allScheduleGridSessions.forEach((session) => {
      const bucket = byDay.get(session.day) ?? []
      bucket.push(session)
      byDay.set(session.day, bucket)
    })
    const map = new Map<CourseScheduleEntry["day"], Set<string>>()
    byDay.forEach((sessions, day) => {
      const sorted = sessions
        .map((session) => ({
          session,
          id: session.courseId ?? session.id ?? `${session.day}-${session.startTime}-${session.endTime}`,
          start: toMinutes(session.startTime),
          end: toMinutes(session.endTime),
        }))
        .sort((a, b) => a.start - b.start)

      for (let i = 0; i < sorted.length - 1; i += 1) {
        const current = sorted[i]
        for (let j = i + 1; j < sorted.length; j += 1) {
          const next = sorted[j]
          if (next.start < current.end) {
            const currentRoom = normalizeRoom(current.session.location)
            const nextRoom = normalizeRoom(next.session.location)
            const sameRoom = currentRoom.length > 0 && currentRoom === nextRoom
            const sameProfessor =
              Boolean(current.session.professorId) &&
              current.session.professorId === next.session.professorId
            if (sameRoom || sameProfessor) {
              const bucket = map.get(day) ?? new Set<string>()
              bucket.add(current.id)
              bucket.add(next.id)
              map.set(day, bucket)
            }
          } else {
            break
          }
        }
      }
    })

    return Array.from(map.entries())
      .filter(([, ids]) => ids.size > 0)
      .map(([day, ids]) => ({ day, courseIds: Array.from(ids) }))
  }, [allScheduleGridSessions, toMinutes])

  const totalConflictCount = useMemo(
    () => allScheduleGridConflicts.reduce((sum, entry) => sum + entry.courseIds.length, 0),
    [allScheduleGridConflicts],
  )

  const invalidScheduleIndexes = useMemo(() => {
    const invalid = new Set<number>()
    scheduleDraft.forEach((slot, index) => {
      const start = toMinutes(slot.startTime)
      const end = toMinutes(slot.endTime)
      if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
        invalid.add(index)
      }
    })
    return invalid
  }, [scheduleDraft, toMinutes])

  const hasInvalidSchedule = invalidScheduleIndexes.size > 0

  const openAdminScheduleSlot = useCallback(async (session: { day: CourseScheduleEntry["day"]; startTime: string; endTime?: string }) => {
    if (!canViewScheduleDetails) {
      toast({
        variant: "destructive",
        title: "Schedule access required",
        description: "You need ADMIN_VIEW_SCHEDULE or MANAGE_RESOURCES to inspect detailed schedule conflicts.",
      })
      return
    }

    const slotEnd = session.endTime || session.startTime
    setAdminScheduleSlot({ day: session.day, startTime: session.startTime, endTime: slotEnd })
    setAdminScheduleOpen(true)
    setAdminScheduleLoading(true)
    setAdminRoomSuggestions({})
    setAdminRoomLoading({})
    setAdminRoomErrors({})
    setAdminRoomUpdating({})
    try {
      const items = await fetchAdminScheduleAtTime({
        day: session.day,
        startTime: session.startTime,
        endTime: slotEnd !== session.startTime ? slotEnd : undefined,
      })
      setAdminScheduleItems(items)
    } catch (error) {
      setAdminScheduleItems([])
      toast({
        variant: "destructive",
        title: "Unable to load schedule",
        description: error instanceof Error ? error.message : "Failed to load schedule at selected time.",
      })
    } finally {
      setAdminScheduleLoading(false)
    }
  }, [canViewScheduleDetails, toast])

  const handleQuickSuggest = useCallback(async (item: AdminScheduleSlotItem) => {
    const key = `${item.courseId}-${item.startTime}`
    setAdminRoomLoading((prev) => ({ ...prev, [key]: true }))
    setAdminRoomErrors((prev) => ({ ...prev, [key]: null }))
    try {
      const targetCourse = courses.find((c) => c.id === item.courseId)
      const rooms = await fetchAdminAvailableRooms({
        day: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
        campus: item.campus || undefined,
        minCapacity: targetCourse?.capacity || undefined,
      })
      setAdminRoomSuggestions((prev) => ({ ...prev, [key]: rooms }))
    } catch (error) {
      setAdminRoomSuggestions((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setAdminRoomErrors((prev) => ({
        ...prev,
        [key]: error instanceof Error ? error.message : "Unable to fetch rooms for this slot.",
      }))
      toast({
        variant: "destructive",
        title: "Unable to fetch rooms",
        description: error instanceof Error ? error.message : "Unable to fetch rooms for this slot.",
      })
    } finally {
      setAdminRoomLoading((prev) => ({ ...prev, [key]: false }))
    }
  }, [courses, toast])

  const handleApplySuggestedRoom = useCallback(async (item: AdminScheduleSlotItem, nextRoom: string) => {
    if (!canManageScheduleResources) {
      toast({
        variant: "destructive",
        title: "Resource management required",
        description: "You need MANAGE_RESOURCES to apply a suggested room.",
      })
      return
    }

    const suggestKey = `${item.courseId}-${item.startTime}`
    const updateKey = `${suggestKey}-${nextRoom}`
    setAdminRoomUpdating((prev) => ({ ...prev, [updateKey]: true }))
    try {
      const previousRoom = item.room ?? ""
      await updateAdminScheduleRoom({
        day: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
        courseId: item.courseId,
        oldRoom: previousRoom,
        newRoom: nextRoom,
      })

      setAdminScheduleItems((prev) =>
        prev.map((entry) =>
          entry.courseId === item.courseId &&
          entry.day === item.day &&
          entry.startTime === item.startTime &&
          entry.endTime === item.endTime
            ? { ...entry, room: nextRoom }
            : entry,
        ),
      )

      setCourses((prev) =>
        prev.map((course) => {
          if (course.id !== item.courseId) {
            return course
          }

          const schedule = Array.isArray(course.schedule) ? course.schedule : []
          const expectedRoom = previousRoom.trim().toLowerCase()
          let replaced = false

          const nextSchedule = schedule.map((slot) => {
            if (replaced) return slot
            if (slot.day !== item.day || slot.startTime !== item.startTime || slot.endTime !== item.endTime) {
              return slot
            }

            const currentRoom = (slot.location ?? course.location ?? course.branch ?? "").trim().toLowerCase()
            if (expectedRoom && currentRoom && currentRoom !== expectedRoom) {
              return slot
            }

            replaced = true
            return { ...slot, location: nextRoom }
          })

          if (!replaced) {
            const fallbackIndex = nextSchedule.findIndex(
              (slot) => slot.day === item.day && slot.startTime === item.startTime && slot.endTime === item.endTime,
            )
            if (fallbackIndex >= 0) {
              nextSchedule[fallbackIndex] = { ...nextSchedule[fallbackIndex], location: nextRoom }
              replaced = true
            }
          }

          return replaced ? { ...course, schedule: nextSchedule } : course
        }),
      )

      setAdminRoomSuggestions((prev) => ({
        ...prev,
        [suggestKey]: [nextRoom, ...(prev[suggestKey] ?? []).filter((room) => room !== nextRoom)],
      }))

      toast({
        title: "Room updated",
        description: `${item.courseTitle} moved from ${previousRoom || "TBA"} to ${nextRoom}.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to update room",
        description: error instanceof Error ? error.message : "Failed to apply the suggested room.",
      })
    } finally {
      setAdminRoomUpdating((prev) => ({ ...prev, [updateKey]: false }))
    }
  }, [canManageScheduleResources, setCourses, toast])

  const adminScheduleConflicts = useMemo(() => {
    const roomConflicts = new Set<string>()
    const professorConflicts = new Set<string>()
    const normalizeRoom = (r?: string | null) => r?.trim().toLowerCase() ?? ""
    for (let i = 0; i < adminScheduleItems.length; i++) {
      for (let j = i + 1; j < adminScheduleItems.length; j++) {
        const a = adminScheduleItems[i]
        const b = adminScheduleItems[j]
        const ra = normalizeRoom(a.room)
        const rb = normalizeRoom(b.room)
        if (ra && ra === rb) {
          roomConflicts.add(a.courseId)
          roomConflicts.add(b.courseId)
        }
        if (a.professorId && a.professorId === b.professorId) {
          professorConflicts.add(a.courseId)
          professorConflicts.add(b.courseId)
        }
      }
    }
    return { roomConflicts, professorConflicts }
  }, [adminScheduleItems])

  const downloadScheduleCSV = useCallback(async () => {
    if (!canDownloadScheduleReport) {
      toast({
        variant: "destructive",
        title: "Export access required",
        description: "You need schedule access and reports:export to download this report.",
      })
      return
    }

    if (allScheduleSessions.length === 0) {
      toast({ variant: "destructive", title: "Nothing to export", description: "No schedule data available." })
      return
    }

    setScheduleReportDownloading(true)
    try {
      const { blob, filename } = await downloadAdminScheduleReport()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      toast({ title: "Report downloaded", description: "CSV schedule report saved." })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to download report",
        description: error instanceof Error ? error.message : "Failed to download the schedule report.",
      })
    } finally {
      setScheduleReportDownloading(false)
    }
  }, [allScheduleSessions.length, canDownloadScheduleReport, toast])

  const openScheduleEditor = () => {
    if (scheduleReadOnly) {
      toast({
        variant: "destructive",
        title: "View only",
        description: "You need enrollment management access to edit schedules.",
      })
      return
    }
    setScheduleError(null)
    setScheduleDraft(
      scheduleSlots.length > 0
        ? [...scheduleSlots]
        : [
            {
              day: "monday",
              startTime: "09:00",
              endTime: "10:00",
              location: "",
              branch: scheduleCourse?.branch ?? "",
            },
          ],
    )
    const prof = professors.find((p) => p.id === scheduleCourse?.professorId)
    setScheduleProfessorDepartment(prof?.department ?? "all")
    setScheduleEditorOpen(true)
  }

  const saveSchedule = async () => {
    if (scheduleReadOnly) {
      toast({
        variant: "destructive",
        title: "View only",
        description: "You need enrollment management access to save schedules.",
      })
      return
    }
    if (!scheduleCourse) return
    if (hasInvalidSchedule) {
      setScheduleError("Fix invalid time ranges before saving (start must be before end).")
      return
    }
    setSavingSchedule(true)
    setScheduleError(null)
    try {
      let updatedCourse = scheduleCourse
      if (scheduleProfessorId && scheduleProfessorId !== scheduleCourse.professorId) {
        updatedCourse = await updateCourseRequest(scheduleCourse.id, { professorId: scheduleProfessorId })
      }
      const updatedScheduleCourse = await updateCourseScheduleRequest(scheduleCourse.id, scheduleDraft)
      const merged = {
        ...updatedScheduleCourse,
        professorId: updatedCourse.professorId,
        professorName: updatedCourse.professorName,
      }
      setCourses((prev) => prev.map((c) => (c.id === merged.id ? { ...c, ...merged, schedule: merged.schedule ?? [] } : c)))
      setScheduleEditorOpen(false)
      setScheduleDraft([])
      toast({ title: "Schedule updated", description: `${merged.code} ${merged.title}` })
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : "Unable to save schedule")
    } finally {
      setSavingSchedule(false)
    }
  }

  const handleToggleEnrollmentOpen = async (nextOpen: boolean) => {
    if (!scheduleCourse) return
    if (scheduleReadOnly) {
      toast({
        variant: "destructive",
        title: "View only",
        description: "You need enrollment management access to update enrollment availability.",
      })
      return
    }
    setClosingEnrollment(true)
    try {
      await setEnrollmentOpen(scheduleCourse, nextOpen, closeNote)
      setCloseDialogOpen(false)
    } catch {
      // toast already shown by useCourseEnrollmentToggle
    } finally {
      setClosingEnrollment(false)
    }
  }

  const handleSaveEnrollmentNote = async () => {
    if (!scheduleCourse) return
    if (scheduleReadOnly) {
      toast({
        variant: "destructive",
        title: "View only",
        description: "You need enrollment management access to update enrollment notes.",
      })
      return
    }
    setClosingEnrollment(true)
    try {
      const note = closeNote.trim()
      const updated = await updateCourseRequest(scheduleCourse.id, {
        enrollmentOpen: scheduleCourse.enrollmentOpen,
        enrollmentStatusNote: note || null,
      })
      setCourses((prev) =>
        prev.map((course) =>
          course.id === updated.id
            ? { ...course, enrollmentStatusNote: updated.enrollmentStatusNote, enrollmentOpen: updated.enrollmentOpen }
            : course,
        ),
      )
      setCloseDialogOpen(false)
      toast({ title: "Enrollment note updated" })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to update note",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setClosingEnrollment(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refreshCourses(), refreshProfessors()])
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh enrollments from the server.",
        variant: "destructive",
      })
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
      <DashboardHeader title="Schedules" description="Weekly course schedule and room planning" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            bulkAction={
              <Button asChild className={`gap-2 ${pillButtonStyles.primary}`}>
                <Link href="/dashboard/enrollment/departments">Open/Close by Major &amp; Courses</Link>
              </Button>
            }
          />

          <div className="flex flex-1 flex-col gap-6">
            {courses.length === 0 ? (
              <Alert>
                <AlertTitle>No courses available</AlertTitle>
                <AlertDescription>Create a course to view schedules and rosters.</AlertDescription>
              </Alert>
            ) : (
              <>
                <Card className="border-border bg-card">
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>University schedule preview</CardTitle>
                        {totalConflictCount > 0 ? (
                          <Badge variant="destructive" className="gap-1 text-[11px]">
                            <AlertTriangle className="h-3 w-3" />
                            {totalConflictCount} conflict{totalConflictCount === 1 ? "" : "s"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">All published course sessions this week with conflicts highlighted.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`gap-2 ${pillButtonStyles.neutral}`}
                        onClick={downloadScheduleCSV}
                        disabled={allScheduleSessions.length === 0 || scheduleReportDownloading || !canDownloadScheduleReport}
                        title={!canDownloadScheduleReport ? "You need schedule access and reports:export to download this report" : undefined}
                      >
                        {scheduleReportDownloading ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                        Download Report
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`gap-2 ${pillButtonStyles.primary}`}
                        disabled={scheduleReadOnly || courses.length === 0}
                        title={scheduleReadOnly ? "Enrollment managers or supervisors can add sessions" : undefined}
                        onClick={() => {
                          if (scheduleReadOnly) {
                            toast({
                              variant: "destructive",
                              title: "View only",
                              description: "You need enrollment management access to add sessions.",
                            })
                            return
                          }
                          setPlacementDay(scheduleDays[0])
                          setPlacementCourseId(courses[0]?.id ?? "")
                          setPlacementOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add session
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {allScheduleSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No schedules published yet.</p>
                    ) : (
                      <ScheduleGrid
                        sessions={allScheduleGridSessions}
                        conflicts={allScheduleGridConflicts}
                        readOnly
                        height={520}
                        onTimeSlotClick={(session) => openAdminScheduleSlot({ day: session.day, startTime: session.startTime, endTime: session.endTime })}
                      />
                    )}
                    {!canViewScheduleDetails && allScheduleSessions.length > 0 ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Detailed schedule drill-down requires ADMIN_VIEW_SCHEDULE or MANAGE_RESOURCES.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>

                <Dialog open={adminScheduleOpen} onOpenChange={setAdminScheduleOpen}>
                  <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        Classes at {adminScheduleSlot?.day ?? ""} {adminScheduleSlot?.startTime ?? ""}{adminScheduleSlot?.endTime && adminScheduleSlot.endTime !== adminScheduleSlot.startTime ? `–${adminScheduleSlot.endTime}` : ""}
                        {adminScheduleItems.length > 0 && (adminScheduleConflicts.roomConflicts.size > 0 || adminScheduleConflicts.professorConflicts.size > 0) && (
                          <Badge variant="destructive" className="ml-2 gap-1 text-[11px]">
                            <AlertTriangle className="h-3 w-3" />
                            {adminScheduleConflicts.roomConflicts.size > 0 && adminScheduleConflicts.professorConflicts.size > 0
                              ? "Room & Professor Conflicts"
                              : adminScheduleConflicts.roomConflicts.size > 0
                                ? "Room Conflict"
                                : "Professor Conflict"}
                          </Badge>
                        )}
                      </DialogTitle>
                      <DialogDescription>
                        All active classes whose time range overlaps the selected slot. Conflict badges show why the slot is marked red.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      {adminScheduleLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Spinner className="h-4 w-4" />
                          Loading classes...
                        </div>
                      ) : adminScheduleItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active classes at this time.</p>
                      ) : (
                        <div className="space-y-3">
                          {adminScheduleItems.map((item) => {
                            const hasRoomConflict = adminScheduleConflicts.roomConflicts.has(item.courseId)
                            const hasProfConflict = adminScheduleConflicts.professorConflicts.has(item.courseId)
                            const suggestKey = `${item.courseId}-${item.startTime}`
                            const suggestions = adminRoomSuggestions[suggestKey]
                            const loadingSuggestion = adminRoomLoading[suggestKey]
                            const suggestionError = adminRoomErrors[suggestKey]
                            return (
                              <div
                                key={`${item.courseId}-${item.startTime}-${item.day}`}
                                className={`rounded-lg border p-4 transition-all ${
                                  hasRoomConflict || hasProfConflict
                                    ? "border-destructive/50 bg-destructive/5 shadow-[0_0_0_1px_rgba(239,68,68,0.15)]"
                                    : "border-border bg-secondary/30"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">{item.courseTitle}</p>
                                    <p className="text-xs text-muted-foreground">{item.courseCode ?? ""}</p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge variant="secondary" className="text-[10px]">{item.campus ?? "Main Campus"}</Badge>
                                    {hasRoomConflict && (
                                      <Badge variant="destructive" className="gap-1 text-[10px] animate-in fade-in">
                                        <Building2 className="h-3 w-3" /> Same Room
                                      </Badge>
                                    )}
                                    {hasProfConflict && (
                                      <Badge className="gap-1 text-[10px] bg-amber-500 hover:bg-amber-600 text-white animate-in fade-in">
                                        <Users className="h-3 w-3" /> Same Professor
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                                  <span>Professor: {item.professorName ?? "TBA"}</span>
                                  <span>Room: {item.room ?? "TBA"}</span>
                                  <span>Time: {item.startTime}–{item.endTime}</span>
                                </div>
                                {(hasRoomConflict || hasProfConflict) && (
                                  <div className="mt-3 pt-3 border-t border-border/50">
                                    {!suggestions && (
                                      <div className="space-y-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className={`gap-1.5 text-xs h-7 ${pillButtonStyles.neutral}`}
                                          disabled={loadingSuggestion}
                                          onClick={() => handleQuickSuggest(item)}
                                        >
                                          {loadingSuggestion ? (
                                            <Spinner className="h-3 w-3" />
                                          ) : (
                                            <Lightbulb className="h-3 w-3 text-amber-500" />
                                          )}
                                          Quick Suggest Room
                                        </Button>
                                        {suggestionError ? (
                                          <p className="text-xs text-destructive">{suggestionError}</p>
                                        ) : null}
                                      </div>
                                    )}
                                    {suggestions && (
                                      <div className="space-y-1.5">
                                        <p className="text-xs font-medium text-foreground flex items-center gap-1">
                                          <MapPin className="h-3 w-3 text-emerald-500" />
                                          Available rooms on {item.campus ?? "campus"}:
                                        </p>
                                        {suggestions.length === 0 ? (
                                          <div className="rounded-md border border-dashed border-amber-200 bg-amber-50/80 px-3 py-2">
                                            <p className="text-xs font-medium text-amber-900">No Rooms Available</p>
                                            <p className="mt-1 text-xs text-amber-800/80">
                                              All rooms at {item.campus ?? "this campus"} are fully booked for this slot. Suggest changing the time.
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="flex flex-wrap gap-1.5">
                                            {suggestions.slice(0, 8).map((room) => (
                                              canManageScheduleResources ? (
                                                <button
                                                  key={room}
                                                  type="button"
                                                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                                                  disabled={adminRoomUpdating[`${suggestKey}-${room}`]}
                                                  onClick={() => handleApplySuggestedRoom(item, room)}
                                                >
                                                  {adminRoomUpdating[`${suggestKey}-${room}`] ? <Spinner className="h-3 w-3" /> : null}
                                                  <span>{room}</span>
                                                </button>
                                              ) : (
                                                <Badge key={room} variant="outline" className="text-[11px] bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
                                                  {room}
                                                </Badge>
                                              )
                                            ))}
                                            {suggestions.length > 8 && (
                                              <span className="text-[11px] text-muted-foreground">+{suggestions.length - 8} more</span>
                                            )}
                                          </div>
                                        )}
                                        {canManageScheduleResources ? (
                                          <p className="text-[11px] text-muted-foreground">Select a suggested room to apply it and log the change.</p>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={placementOpen} onOpenChange={setPlacementOpen}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add session</DialogTitle>
                      <DialogDescription>Place a class into the weekly schedule.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid gap-1">
                        <Label>Day</Label>
                        <Select value={placementDay} onValueChange={(value) => setPlacementDay(value as CourseScheduleEntry["day"])}>
                          <SelectTrigger className="bg-secondary border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {scheduleDays.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>Course</Label>
                        <Select value={placementCourseId} onValueChange={setPlacementCourseId}>
                          <SelectTrigger className="bg-secondary border-border">
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.code} — {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                          <Label>Start</Label>
                          <Input value={placementStart} onChange={(e) => setPlacementStart(e.target.value)} placeholder="09:00" />
                        </div>
                        <div className="grid gap-1">
                          <Label>End</Label>
                          <Input value={placementEnd} onChange={(e) => setPlacementEnd(e.target.value)} placeholder="10:00" />
                        </div>
                      </div>
                      <div className="grid gap-1">
                        <Label>Location</Label>
                        <Input value={placementLocation} onChange={(e) => setPlacementLocation(e.target.value)} placeholder="Room / building" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                          <Label>Department</Label>
                          <Input value={placementDepartment} onChange={(e) => setPlacementDepartment(e.target.value)} placeholder="e.g. CS" />
                        </div>
                        <div className="grid gap-1">
                          <Label>Branch</Label>
                          <Input value={placementBranch} onChange={(e) => setPlacementBranch(e.target.value)} placeholder="e.g. B1" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" className={pillButtonStyles.neutral} onClick={() => setPlacementOpen(false)}>Cancel</Button>
                      <Button
                        className={pillButtonStyles.primary}
                        onClick={async () => {
                          if (scheduleReadOnly) {
                            toast({
                              variant: "destructive",
                              title: "View only",
                              description: "You need enrollment management access to add sessions.",
                            })
                            return
                          }
                          if (!placementCourseId) {
                            toast({ variant: "destructive", title: "Select a course" })
                            return
                          }
                          const startMinutes = Number(placementStart.split(":")[0]) * 60 + Number(placementStart.split(":")[1] || 0)
                          const endMinutes = Number(placementEnd.split(":")[0]) * 60 + Number(placementEnd.split(":")[1] || 0)
                          if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || startMinutes >= endMinutes) {
                            toast({ variant: "destructive", title: "Invalid time", description: "Start must be before end." })
                            return
                          }
                          const targetCourse = courses.find((c) => c.id === placementCourseId)
                          if (!targetCourse) {
                            toast({ variant: "destructive", title: "Course not found" })
                            return
                          }
                          setPlacementSaving(true)
                          try {
                            const nextSchedule = [
                              ...(targetCourse.schedule ?? []),
                              {
                                day: placementDay,
                                startTime: placementStart,
                                endTime: placementEnd,
                                location: placementLocation,
                                department: placementDepartment || undefined,
                                branch: placementBranch || undefined,
                              },
                            ]
                            const updated = await updateCourseScheduleRequest(targetCourse.id, nextSchedule)
                            setCourses((prev) => prev.map((c) => (c.id === updated.id ? { ...c, schedule: updated.schedule ?? [] } : c)))
                            setPlacementOpen(false)
                            setPlacementSaving(false)
                            toast({ title: "Session added", description: `${targetCourse.code} on ${placementDay}` })
                          } catch (error) {
                            setPlacementSaving(false)
                            toast({
                              variant: "destructive",
                              title: "Unable to add session",
                              description: error instanceof Error ? error.message : "Unknown error",
                            })
                          }
                        }}
                        disabled={placementSaving || scheduleReadOnly}
                      >
                        {placementSaving ? "Saving…" : "Add session"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Card className="border-border bg-card">
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-lg">Schedule oversight</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        View weekly times, rosters, and approval state.
                        {scheduleReadOnly ? " Editing is disabled without enrollment management access." : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 w-full md:w-auto">
                      <div className="w-full md:w-80">
                        <Label htmlFor="schedule-course">Course</Label>
                        <Select
                          value={scheduleCourse?.id ?? ""}
                          onValueChange={(value) => setScheduleCourseId(value)}
                        >
                          <SelectTrigger id="schedule-course" className="bg-secondary border-border">
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.code} — {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        className={`gap-2 ${pillButtonStyles.neutral}`}
                        onClick={openScheduleEditor}
                        disabled={!scheduleCourse || scheduleReadOnly || closingEnrollment}
                        title={
                          scheduleReadOnly
                            ? "Enrollment managers or supervisors can edit schedules"
                            : closingEnrollment
                              ? "Wait for the enrollment update to finish"
                              : undefined
                        }
                      >
                        <Edit2 className="h-4 w-4" /> Edit schedule
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-4">
                    <Card className="border-sky-100 bg-sky-50/80">
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sessions this week</p>
                          <p className="text-2xl font-semibold text-foreground">{scheduleSlots.length}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-sky-100 bg-sky-50/80 flex flex-col">
                      <CardContent className="p-4 space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Enrollment status</p>
                          <Badge variant={scheduleCourse && isEnrollmentActuallyOpen(scheduleCourse) ? "default" : "destructive"}>
                            {scheduleCourse
                              ? isEnrollmentActuallyOpen(scheduleCourse)
                                ? "Open"
                                : formatEnrollmentClosedReason(getEnrollmentClosedReason(scheduleCourse))
                              : "Open"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {scheduleCourse?.enrollmentStatusNote?.trim()
                            ? scheduleCourse.enrollmentStatusNote
                            : "No note set"}
                        </p>
                      </CardContent>
                      <div className="p-3 pt-0">
                        <Button
                          size="sm"
                          className={`w-full gap-2 ${
                            scheduleCourse?.enrollmentOpen === false ? pillButtonStyles.positive : pillButtonStyles.danger
                          }`}
                          onClick={() => {
                            if (scheduleReadOnly) {
                              toast({
                                variant: "destructive",
                                title: "View only",
                                description: "You need enrollment management access to update enrollment availability.",
                              })
                              return
                            }
                            setCloseNote(scheduleCourse?.enrollmentStatusNote ?? "")
                            setCloseDialogOpen(true)
                          }}
                          disabled={!scheduleCourse || scheduleReadOnly}
                        >
                          {scheduleCourse?.enrollmentOpen === false ? (
                            <>
                              <LockOpen className="h-4 w-4" />
                              Open enrollment
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              Close enrollment
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Weekly schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scheduleSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No schedule published for this course.</p>
                    ) : (
                      <ScheduleGrid
                        sessions={scheduleGridSessions}
                        conflicts={scheduleGridConflicts}
                        readOnly={scheduleReadOnly}
                        height={520}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Roster panel removed for admin view; roster visibility reserved for student portal */}

                <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {scheduleCourse?.enrollmentOpen === false ? "Open enrollment" : "Close enrollment"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {scheduleCourse?.enrollmentOpen === false
                          ? "Students will be allowed to enroll in this course again."
                          : "Students will be blocked from enrolling. Add a note so they know when to check back."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="close-note">Enrollment note</Label>
                      <Textarea
                        id="close-note"
                        value={closeNote}
                        onChange={(event) => setCloseNote(event.target.value)}
                        placeholder="Example: Reopens on 12/06/2026 after curriculum update"
                        disabled={closingEnrollment}
                      />
                      <p className="text-xs text-muted-foreground">
                        This note is shown in the error message when students try to enroll.
                      </p>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={closingEnrollment}>Cancel</AlertDialogCancel>
                      {scheduleCourse?.enrollmentOpen === false ? (
                        <>
                          <Button variant="outline" className={pillButtonStyles.neutral} disabled={closingEnrollment} onClick={handleSaveEnrollmentNote}>
                            {closingEnrollment ? "Saving..." : "Save note"}
                          </Button>
                          <Button
                            className={pillButtonStyles.positive}
                            disabled={closingEnrollment || !scheduleCourse}
                            onClick={() => handleToggleEnrollmentOpen(true)}
                          >
                            {closingEnrollment ? "Saving..." : "Open enrollment"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          className={pillButtonStyles.danger}
                          disabled={closingEnrollment || !scheduleCourse}
                          onClick={() => handleToggleEnrollmentOpen(false)}
                        >
                          {closingEnrollment ? "Saving..." : "Close enrollment"}
                        </Button>
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>

      <CourseScheduleEditorDialog
        open={scheduleEditorOpen}
        onOpenChange={setScheduleEditorOpen}
        scheduleCourse={scheduleCourse}
        scheduleDraft={scheduleDraft}
        setScheduleDraft={setScheduleDraft}
        professorDepartments={professorDepartments}
        filteredScheduleProfessors={filteredScheduleProfessors}
        scheduleProfessorDepartment={scheduleProfessorDepartment}
        setScheduleProfessorDepartment={setScheduleProfessorDepartment}
        scheduleProfessorId={scheduleProfessorId}
        setScheduleProfessorId={setScheduleProfessorId}
        savingSchedule={savingSchedule}
        scheduleError={scheduleError}
        onSave={saveSchedule}
        toMinutes={toMinutes}
      />
    </div>
  )
}

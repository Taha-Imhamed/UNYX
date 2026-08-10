"use client"

import { useEffect, useMemo, useState } from "react"
import type { Dispatch, FormEvent, SetStateAction } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ChevronsUpDown, Check } from "lucide-react"
import {
  currencyFormatter,
  getEligibleYearValues,
  isEnrollmentWindowOpen,
  scheduleDays,
  statusMeta,
} from "@/components/enrollment/shared"
import { previewEnrollmentSchedule } from "@/lib/enrollment-api"
import type { Course, CourseScheduleEntry, Enrollment, EnrollmentStatus, Student } from "@shared/types"

export interface EnrollmentCreateForm {
  studentId: string
  courseId: string
  status: EnrollmentStatus
  startDate: string
  endDate: string
  price: string
  couponCode: string
}

export const emptyEnrollmentCreateForm: EnrollmentCreateForm = {
  studentId: "",
  courseId: "",
  status: "pending",
  startDate: "",
  endDate: "",
  price: "",
  couponCode: "",
}

type SchedulePreview = {
  sessions: Array<
    CourseScheduleEntry & {
      courseId: string
      courseTitle: string
      courseCode?: string
      status: Enrollment["status"] | "proposed"
      source: "existing" | "proposed"
      professorName?: string
      branch?: string
      location?: string
      sectionId?: string
    }
  >
  conflicts: Array<{ day: string; courseIds: string[]; range: string }>
}

interface EnrollmentCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  createForm: EnrollmentCreateForm
  setCreateForm: Dispatch<SetStateAction<EnrollmentCreateForm>>
  students: Student[]
  courses: Course[]
  hideTuition: boolean
  globalEnrollmentOpen: boolean
  createCouponPercent: number | null
  createDiscountAmount: number
  createFinalPrice: number
  createError: string | null
  creating: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function EnrollmentCreateDialog({
  open,
  onOpenChange,
  createForm,
  setCreateForm,
  students,
  courses,
  hideTuition,
  globalEnrollmentOpen,
  createCouponPercent,
  createDiscountAmount,
  createFinalPrice,
  createError,
  creating,
  onSubmit,
}: EnrollmentCreateDialogProps) {
  const [studentPickerOpen, setStudentPickerOpen] = useState(false)
  const [coursePickerOpen, setCoursePickerOpen] = useState(false)
  const [schedulePreview, setSchedulePreview] = useState<SchedulePreview | null>(null)
  const [schedulePreviewLoading, setSchedulePreviewLoading] = useState(false)
  const [schedulePreviewError, setSchedulePreviewError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStudentPickerOpen(false)
    }
  }, [open])

  useEffect(() => {
    if (!open || !createForm.studentId || !createForm.courseId) {
      setSchedulePreview(null)
      setSchedulePreviewError(null)
      return
    }
    setSchedulePreviewLoading(true)
    setSchedulePreviewError(null)
    previewEnrollmentSchedule(createForm.studentId, [createForm.courseId])
      .then((data) => setSchedulePreview(data))
      .catch((error) => setSchedulePreviewError(error instanceof Error ? error.message : "Unable to preview schedule"))
      .finally(() => setSchedulePreviewLoading(false))
  }, [open, createForm.studentId, createForm.courseId])

  const selectedStudent = useMemo(() => {
    if (!createForm.studentId) return null
    return students.find((student) => student.id === createForm.studentId) ?? null
  }, [createForm.studentId, students])

  const selectedCreateCourse = useMemo(() => {
    if (!createForm.courseId) return null
    return courses.find((course) => course.id === createForm.courseId) ?? null
  }, [courses, createForm.courseId])

  const createCoursesFiltered = useMemo(() => {
    // show courses relevant to the selected student (by program/major/year) when possible
    return courses.filter((course) => {
      if (!selectedStudent) return true
      const prog = (selectedStudent.program || "").toLowerCase()
      const major = (selectedStudent.major || "").toLowerCase()
      const year = String(selectedStudent.currentYear ?? "")
      const eligible = (course.eligiblePrograms || []).map((e) => String(e).toLowerCase())
      const eligibleYears = getEligibleYearValues(course.eligibleSemesters)
      const courseDept = (course.department || "").toLowerCase()
      if (eligibleYears.length > 0 && year && !eligibleYears.includes(year)) return false
      if (eligible.length > 0) {
        if (eligible.includes(prog) || eligible.includes(major) || eligible.includes(year)) return true
        return false
      }
      // fallback: match by department or allow
      if (courseDept && (courseDept === (selectedStudent.faculty || "").toLowerCase())) return true
      return true
    })
  }, [courses, selectedStudent])

  const selectedCreateCourseWindowOpen = selectedCreateCourse ? isEnrollmentWindowOpen(selectedCreateCourse) : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[92%] max-h-[92vh] overflow-y-auto bg-white p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle>Create enrollment</DialogTitle>
          <DialogDescription>Select a student and course to assign them.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {!globalEnrollmentOpen ? (
            <Alert>
              <AlertTitle>Global enrollment is closed</AlertTitle>
              <AlertDescription>
                Students cannot self-enroll right now. Admin staff can still place students manually if needed.
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student</Label>
              <Popover open={studentPickerOpen} onOpenChange={setStudentPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={studentPickerOpen}
                    className="bg-white/90 justify-between w-full"
                  >
                    {selectedStudent ? (
                      <span className="truncate">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </span>
                    ) : (
                      "Select student"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 max-h-64 overflow-y-auto" align="start">
                  <Command>
                    <CommandInput placeholder="Search students..." />
                    <CommandList className="max-h-56 overflow-y-auto">
                      <CommandEmpty>No students found.</CommandEmpty>
                      <CommandGroup>
                        {students.map((student) => {
                          const fullName = `${student.firstName} ${student.lastName}`
                          const email = student.email ?? ""
                          return (
                            <CommandItem
                              key={student.id}
                              value={`${fullName} ${email}`}
                              onSelect={() => {
                                setCreateForm((prev) => ({ ...prev, studentId: student.id }))
                                setStudentPickerOpen(false)
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${createForm.studentId === student.id ? "opacity-100" : "opacity-0"}`}
                              />
                              <div className="flex flex-1 items-center justify-between gap-2">
                                <span className="truncate">{fullName}</span>
                                <span className="text-xs text-muted-foreground truncate">{email}</span>
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseId">Course</Label>
              <Popover open={coursePickerOpen} onOpenChange={setCoursePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={coursePickerOpen}
                    className="justify-between w-full bg-white/90"
                  >
                    {selectedCreateCourse ? (
                      <span className="truncate">{selectedCreateCourse.code} • {selectedCreateCourse.sectionId ?? ""} • {selectedCreateCourse.professorName}</span>
                    ) : (
                      "Select course"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 max-h-72 overflow-y-auto" align="start">
                  <Command>
                    <CommandInput placeholder="Search courses..." />
                    <CommandList className="max-h-64 overflow-y-auto">
                      <CommandEmpty>No courses found.</CommandEmpty>
                      <CommandGroup>
                        {createCoursesFiltered.map((course) => {
                          const fullLabel = `${course.code} • ${course.title} • ${course.professorName} ${course.sectionId ? `• Section ${course.sectionId}` : ""}`
                          const courseOpen = isEnrollmentWindowOpen(course)
                          return (
                            <CommandItem
                              key={course.id}
                              value={course.id}
                              onSelect={() => {
                                setCreateForm((prev) => ({ ...prev, courseId: course.id, price: String(course.price) }))
                                setCoursePickerOpen(false)
                              }}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium">{fullLabel}</span>
                                <span className="text-xs text-muted-foreground">
                                  {course.schedule?.length ? `${course.schedule.length} sessions` : "No schedule"}
                                  {!courseOpen ? " — enrollment closed" : ""}
                                </span>
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="createStart">Start date</Label>
              <Input
                id="createStart"
                type="date"
                value={createForm.startDate}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, startDate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createEnd">End date</Label>
              <Input
                id="createEnd"
                type="date"
                value={createForm.endDate}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, endDate: event.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="createStatus">Status</Label>
              <Select
                value={createForm.status}
                onValueChange={(value: EnrollmentStatus) => setCreateForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="createStatus" className="bg-white/90">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(statusMeta).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusMeta[status as EnrollmentStatus].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!hideTuition && (
              <div className="space-y-2">
                <Label htmlFor="createPrice">Tuition override</Label>
                <Input
                  id="createPrice"
                  type="number"
                  min={0}
                  value={createForm.price}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, price: event.target.value }))}
                  placeholder="Optional"
                  disabled={Boolean(createCouponPercent)}
                />
              </div>
            )}
            {!hideTuition && (
              <div className="space-y-2">
                <Label htmlFor="createCoupon">Coupon</Label>
                <Input
                  id="createCoupon"
                  value={createForm.couponCode}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, couponCode: event.target.value }))}
                  placeholder="Enter coupon code (optional)"
                />
                <p className="text-xs text-muted-foreground">
                  {createCouponPercent
                    ? `Applying ${Math.round((createCouponPercent ?? 0) * 100)}% discount.`
                    : "Coupons are limited to predefined codes."}
                </p>
              </div>
            )}
          </div>
          {selectedCreateCourse ? (
            <div className="rounded-lg border border-border/60 bg-white/90 p-3 text-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">
                    {selectedCreateCourse.code} {selectedCreateCourse.sectionId ? `• Section ${selectedCreateCourse.sectionId}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {[selectedCreateCourse.professorName, selectedCreateCourse.branch, selectedCreateCourse.location].filter(Boolean).join(" • ")}
                  </p>
                </div>
                <Badge variant={selectedCreateCourseWindowOpen && selectedCreateCourse.enrollmentOpen !== false ? "default" : "destructive"}>
                  {selectedCreateCourseWindowOpen && selectedCreateCourse.enrollmentOpen !== false ? "Enrollment open" : "Enrollment closed"}
                </Badge>
              </div>
              {selectedCreateCourse.enrollmentStatusNote ? (
                <p className="text-xs text-muted-foreground">{selectedCreateCourse.enrollmentStatusNote}</p>
              ) : null}
            </div>
          ) : null}
          {!hideTuition && (
            <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Final tuition</span>
                <span className="font-semibold text-foreground">{currencyFormatter.format(createFinalPrice)}</span>
              </div>
              {createCouponPercent ? (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Discount</span>
                  <span>
                    -{currencyFormatter.format(createDiscountAmount)} ({Math.round((createCouponPercent ?? 0) * 100)}%)
                  </span>
                </div>
              ) : null}
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Schedule preview</Label>
              {schedulePreviewLoading ? <Spinner className="h-4 w-4" /> : null}
            </div>
            {schedulePreviewError ? (
              <Alert variant="destructive">{schedulePreviewError}</Alert>
            ) : schedulePreview && schedulePreview.sessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {scheduleDays.map((day) => {
                  const slots = schedulePreview.sessions.filter((slot) => slot.day === day)
                  return (
                    <div key={day} className="rounded-lg border border-border bg-white/90 p-3">
                      <p className="text-xs uppercase text-muted-foreground">{day}</p>
                      {slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground mt-2">—</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {slots.map((slot, idx) => {
                            const conflict = schedulePreview.conflicts.some((entry) => entry.day === slot.day && entry.courseIds.includes(slot.courseId))
                            return (
                              <div
                                key={`${day}-${idx}`}
                                className={`rounded-md border px-3 py-2 text-xs ${conflict ? "border-destructive/70 bg-destructive/10" : "border-border bg-card/70"}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-foreground">{slot.startTime}–{slot.endTime}</span>
                                  {conflict ? <Badge variant="destructive" className="h-5 px-2 text-[10px]">Conflict</Badge> : null}
                                </div>
                                <div className="text-muted-foreground">{slot.courseCode} {slot.sectionId ? `• ${slot.sectionId}` : ""}</div>
                                <div className="text-muted-foreground">{slot.professorName}</div>
                                <div className="text-muted-foreground text-[11px]">{slot.location || slot.branch || "Location TBD"}</div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a student and section to preview conflicts.</p>
            )}
          </div>
          {createError && <Alert variant="destructive">{createError}</Alert>}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? <Spinner className="h-4 w-4" /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

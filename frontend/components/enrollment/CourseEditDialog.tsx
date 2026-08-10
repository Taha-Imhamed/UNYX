"use client"

import type { Dispatch, FormEvent, SetStateAction } from "react"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { BookOpen, Check, X } from "lucide-react"
import { pillButtonStyles } from "@/components/enrollment/shared"
import type { AcademicCampus, AcademicDepartment, AcademicMajor } from "@/lib/enrollment-api"
import type { Course, Professor } from "@shared/types"

export interface CourseFormState {
  title: string
  code: string
  professorId: string
  capacity: string
  startDate: string
  endDate: string
  price: string
  departmentId: string
  sectionId: string
  branch: string
  location: string
  courseType: "major" | "common"
  enrollmentOpen: boolean
  enrollmentStatusNote: string
  enrollmentOpenAt: string
  enrollmentCloseAt: string
  eligibleYears: string[]
  eligiblePrograms: string[]
  prerequisiteCourseIds: string[]
}

export const emptyCourseForm: CourseFormState = {
  title: "",
  code: "",
  professorId: "",
  capacity: "",
  startDate: "",
  endDate: "",
  price: "",
  departmentId: "",
  sectionId: "",
  branch: "",
  location: "",
  courseType: "major",
  enrollmentOpen: true,
  enrollmentStatusNote: "",
  enrollmentOpenAt: "",
  enrollmentCloseAt: "",
  eligibleYears: [],
  eligiblePrograms: [],
  prerequisiteCourseIds: [],
}

interface CourseEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  courseForm: CourseFormState
  setCourseForm: Dispatch<SetStateAction<CourseFormState>>
  selectedCourseTemplateId: string
  setSelectedCourseTemplateId: (value: string) => void
  courseOptions: Course[]
  selectedCourseDepartment: AcademicDepartment | null
  filteredProfessors: Professor[]
  departments: AcademicDepartment[]
  campuses: AcademicCampus[]
  majors: AcademicMajor[]
  courseSaving: boolean
  courseError: string | null
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function CourseEditDialog({
  open,
  onOpenChange,
  mode,
  courseForm,
  setCourseForm,
  selectedCourseTemplateId,
  setSelectedCourseTemplateId,
  courseOptions,
  selectedCourseDepartment,
  filteredProfessors,
  departments,
  campuses,
  majors,
  courseSaving,
  courseError,
  onSubmit,
  onCancel,
}: CourseEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#f8fcff_0%,#ffffff_18%)] p-0 shadow-[0_28px_80px_rgba(15,23,42,0.18)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DialogHeader className="border-b border-sky-100 bg-white/90 px-8 py-7 text-left">
          <DialogTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <BookOpen className="h-6 w-6 text-sky-700" />
            {mode === "create" ? "Create course" : "Edit course"}
          </DialogTitle>
          <DialogDescription className="max-w-2xl text-sm leading-6 text-slate-600">
            {mode === "create"
              ? "Define a new academic course for upcoming enrollment cycles."
              : "Update course details without affecting existing student records."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 px-8 py-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900">Course identity</p>
              <p className="text-sm text-slate-500">Set the main academic details first.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseDepartment" className="text-sm font-medium text-slate-700">Department</Label>
                <Select
                  value={courseForm.departmentId}
                  onValueChange={(value) => {
                    setCourseForm((prev) => ({ ...prev, departmentId: value }))
                    setSelectedCourseTemplateId("")
                  }}
                >
                  <SelectTrigger id="courseDepartment" className="h-12 w-full rounded-xl border-slate-200 bg-white text-slate-800">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Create departments first
                      </SelectItem>
                    ) : (
                      departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseTemplate" className="text-sm font-medium text-slate-700">Course</Label>
                <Select
                  value={selectedCourseTemplateId}
                  onValueChange={(value) => setSelectedCourseTemplateId(value)}
                  disabled={!courseForm.departmentId || courseOptions.length === 0}
                >
                  <SelectTrigger id="courseTemplate" className="h-12 w-full rounded-xl border-slate-200 bg-white text-slate-800">
                    <SelectValue placeholder={courseForm.departmentId ? "Select an existing course" : "Pick a department first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOptions.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No courses available for this department
                      </SelectItem>
                    ) : (
                      courseOptions.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} — {course.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle" className="text-sm font-medium text-slate-700">Course title</Label>
                  <Input
                    id="courseTitle"
                    value={courseForm.title}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseCode" className="text-sm font-medium text-slate-700">Course code</Label>
                  <Input
                    id="courseCode"
                    value={courseForm.code}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, code: event.target.value }))}
                    placeholder="Auto-generated if empty"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="courseSection" className="text-sm font-medium text-slate-700">Section</Label>
                  <Input
                    id="courseSection"
                    value={courseForm.sectionId}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, sectionId: event.target.value }))}
                    placeholder="A, B1, Evening"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseType" className="text-sm font-medium text-slate-700">Course type</Label>
                  <Select
                    value={courseForm.courseType}
                    onValueChange={(value) => setCourseForm((prev) => ({ ...prev, courseType: value as "major" | "common" }))}
                  >
                    <SelectTrigger id="courseType" className="h-12 w-full rounded-xl border-slate-200 bg-white text-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="major">Major course</SelectItem>
                      <SelectItem value="common">Common course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseBranch" className="text-sm font-medium text-slate-700">Campus</Label>
                  <Select
                    value={courseForm.branch}
                    onValueChange={(value) => setCourseForm((prev) => ({ ...prev, branch: value }))}
                    disabled={campuses.length === 0}
                  >
                    <SelectTrigger id="courseBranch" className="h-12 w-full rounded-xl border-slate-200 bg-white text-slate-800">
                      <SelectValue placeholder={campuses.length === 0 ? "Create campuses first" : "Select campus"} />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Create campuses first
                        </SelectItem>
                      ) : (
                        campuses.map((campus) => (
                          <SelectItem key={campus.id} value={campus.name}>
                            {campus.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseLocation" className="text-sm font-medium text-slate-700">Location</Label>
                  <Input
                    id="courseLocation"
                    value={courseForm.location}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, location: event.target.value }))}
                    placeholder="Room 204"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900">Faculty and schedule setup</p>
              <p className="text-sm text-slate-500">Choose the professor, dates, and capacity in one place.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Professors are filtered by {selectedCourseDepartment?.name ?? "the selected department"}.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseProfessor" className="text-sm font-medium text-slate-700">Professor</Label>
                  <Select
                    value={courseForm.professorId}
                    onValueChange={(value) => setCourseForm((prev) => ({ ...prev, professorId: value }))}
                    disabled={filteredProfessors.length === 0}
                  >
                    <SelectTrigger id="courseProfessor" className="h-12 w-full rounded-xl border-slate-200 bg-white text-slate-800">
                      <SelectValue placeholder="Select professor" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProfessors.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No professors in this department
                        </SelectItem>
                      ) : (
                        filteredProfessors.map((professor) => (
                          <SelectItem key={professor.id} value={professor.id}>
                            {professor.firstName} {professor.lastName}
                            {professor.department ? ` - ${professor.department}` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="courseCapacity" className="text-sm font-medium text-slate-700">Capacity</Label>
                <Input
                  id="courseCapacity"
                  type="number"
                  min={1}
                  value={courseForm.capacity}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, capacity: event.target.value }))}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseStart" className="text-sm font-medium text-slate-700">Start date</Label>
                <Input
                  id="courseStart"
                  type="date"
                  value={courseForm.startDate}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, startDate: event.target.value }))}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseEnd" className="text-sm font-medium text-slate-700">End date</Label>
                <Input
                  id="courseEnd"
                  type="date"
                  value={courseForm.endDate}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, endDate: event.target.value }))}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coursePrice" className="text-sm font-medium text-slate-700">Tuition</Label>
              <Input
                id="coursePrice"
                type="number"
                min={0}
                value={courseForm.price}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, price: event.target.value }))}
                className="h-12 rounded-xl border-slate-200 bg-slate-50"
              />
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-slate-700">Allowed student years</Label>
                <p className="text-xs text-slate-500">Only selected years can enroll in this course. Leave empty to allow all years.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["1", "2", "3", "4", "5", "6"].map((year) => {
                  const checked = courseForm.eligibleYears.includes(year)
                  return (
                    <label key={year} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setCourseForm((prev) => ({
                            ...prev,
                            eligibleYears: event.target.checked
                              ? Array.from(new Set([...prev.eligibleYears, year])).sort()
                              : prev.eligibleYears.filter((value) => value !== year),
                          }))
                        }}
                      />
                      <span>{`Year ${year}`}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-slate-700">Eligible majors</Label>
                <p className="text-xs text-slate-500">Only students in selected majors can see and enroll in this course. Leave empty to allow all majors.</p>
              </div>
              {majors.length === 0 ? (
                <p className="text-xs text-muted-foreground">No majors configured yet. Add majors in the Departments tab first.</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {majors.map((major) => {
                    const dept = departments.find((d) => d.id === major.departmentId)
                    const eligiblePrograms = Array.isArray(courseForm.eligiblePrograms) ? courseForm.eligiblePrograms : []
                    const checked = eligiblePrograms.includes(major.name)
                    return (
                      <label key={major.id} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setCourseForm((prev) => ({
                              ...prev,
                              eligiblePrograms: event.target.checked
                                ? Array.from(new Set([...(Array.isArray(prev.eligiblePrograms) ? prev.eligiblePrograms : []), major.name]))
                                : (Array.isArray(prev.eligiblePrograms) ? prev.eligiblePrograms : []).filter((value) => value !== major.name),
                            }))
                          }}
                        />
                        <span>{major.name}{dept ? ` (${dept.name})` : ""}</span>
                      </label>
                    )
                  })}
                </div>
              )}
              {(Array.isArray(courseForm.eligiblePrograms) ? courseForm.eligiblePrograms : []).length > 0 && (
                <p className="text-xs text-slate-500">
                  Selected: {(Array.isArray(courseForm.eligiblePrograms) ? courseForm.eligiblePrograms : []).join(", ")}
                  {" · "}
                  <button type="button" className="text-blue-600 underline" onClick={() => setCourseForm((prev) => ({ ...prev, eligiblePrograms: [] }))}>
                    Clear all
                  </button>
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-slate-700">Prerequisites</Label>
                <p className="text-xs text-slate-500">
                  Courses a student must have completed first. Enforced when students self-enroll and when
                  promoting from the waitlist.
                </p>
              </div>
              {courseOptions.filter((c) => !(mode === "edit" && c.id === selectedCourseTemplateId)).length === 0 ? (
                <p className="text-xs text-muted-foreground">No other courses available to select as prerequisites yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {courseOptions
                    .filter((c) => !(mode === "edit" && c.id === selectedCourseTemplateId))
                    .map((option) => {
                      const prereqs = Array.isArray(courseForm.prerequisiteCourseIds) ? courseForm.prerequisiteCourseIds : []
                      const checked = prereqs.includes(option.id)
                      return (
                        <label key={option.id} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setCourseForm((prev) => {
                                const current = Array.isArray(prev.prerequisiteCourseIds) ? prev.prerequisiteCourseIds : []
                                return {
                                  ...prev,
                                  prerequisiteCourseIds: event.target.checked
                                    ? Array.from(new Set([...current, option.id]))
                                    : current.filter((id) => id !== option.id),
                                }
                              })
                            }}
                          />
                          <span>{option.code || option.displayId} — {option.title}</span>
                        </label>
                      )
                    })}
                </div>
              )}
              {(Array.isArray(courseForm.prerequisiteCourseIds) ? courseForm.prerequisiteCourseIds : []).length > 0 && (
                <p className="text-xs text-slate-500">
                  <button type="button" className="text-blue-600 underline" onClick={() => setCourseForm((prev) => ({ ...prev, prerequisiteCourseIds: [] }))}>
                    Clear all
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-[linear-gradient(135deg,#eff8ff_0%,#f8fbff_100%)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">Enrollment visibility</p>
                <p className="text-sm text-slate-600">Control whether this class appears open for registration.</p>
              </div>
              <Badge variant={courseForm.enrollmentOpen ? "default" : "destructive"}>
                {courseForm.enrollmentOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className={courseForm.enrollmentOpen ? pillButtonStyles.positive : pillButtonStyles.neutral}
                onClick={() => setCourseForm((prev) => ({ ...prev, enrollmentOpen: true }))}
              >
                Open
              </Button>
              <Button
                type="button"
                variant="outline"
                className={!courseForm.enrollmentOpen ? pillButtonStyles.danger : pillButtonStyles.neutral}
                onClick={() => setCourseForm((prev) => ({ ...prev, enrollmentOpen: false }))}
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courseEnrollmentOpenAt" className="text-sm font-medium text-slate-700">Open from</Label>
                <Input
                  id="courseEnrollmentOpenAt"
                  type="datetime-local"
                  value={courseForm.enrollmentOpenAt}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, enrollmentOpenAt: event.target.value }))}
                  className="h-12 rounded-xl border-slate-200 bg-white/80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseEnrollmentCloseAt" className="text-sm font-medium text-slate-700">Close at</Label>
                <Input
                  id="courseEnrollmentCloseAt"
                  type="datetime-local"
                  value={courseForm.enrollmentCloseAt}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, enrollmentCloseAt: event.target.value }))}
                  className="h-12 rounded-xl border-slate-200 bg-white/80"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseEnrollmentNote" className="text-sm font-medium text-slate-700">Enrollment note</Label>
              <Textarea
                id="courseEnrollmentNote"
                value={courseForm.enrollmentStatusNote}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, enrollmentStatusNote: event.target.value }))}
                placeholder="Shown to students when enrollment is closed or temporarily unavailable."
                className="min-h-28 rounded-xl border-slate-200 bg-white/80"
              />
            </div>
          </div>
          {courseError && <Alert variant="destructive">{courseError}</Alert>}
          <DialogFooter className="border-t border-sky-100 bg-white/90 px-8 py-5">
            <Button variant="outline" type="button" onClick={onCancel} className={`h-12 gap-2 px-5 ${pillButtonStyles.neutral}`}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={courseSaving} className={`h-12 gap-2 px-6 ${pillButtonStyles.primary}`}>
              {courseSaving ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {courseSaving ? "Saving…" : mode === "create" ? "Create course" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { ScheduleGrid } from "@/components/enrollment/ScheduleGrid"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import { updateCourseScheduleRequest } from "@/lib/enrollment-api"
import type { CourseScheduleEntry } from "@shared/types"

const days: CourseScheduleEntry["day"][] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function ProfessorSchedulePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse } = useProfessorCourseWorkspace({
    includeSchedule: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false)
  const [scheduleDraft, setScheduleDraft] = useState<CourseScheduleEntry[]>([])
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [courseSchedules, setCourseSchedules] = useState<Record<string, CourseScheduleEntry[]>>({})

  const courseSchedule = courseSchedules[selectedCourse?.id ?? ""] ?? selectedCourse?.schedule ?? []
  const scheduleSessions = courseSchedule.map((slot, idx) => ({
    ...slot,
    id: `${selectedCourse?.id ?? "course"}-${idx}`,
    courseId: selectedCourse?.id ?? `course-${idx}`,
    courseTitle: selectedCourse?.title,
    courseCode: selectedCourse?.code,
    branch: slot.branch ?? selectedCourse?.branch ?? selectedCourse?.location,
    location: slot.location,
    professorName: selectedCourse?.professorName,
  }))

  const canEditSelectedCourse =
    !!selectedCourse &&
    (user?.role === "admin" ||
      user?.role === "super-admin" ||
      user?.role === "supervisor" ||
      (user?.role === "professor" && selectedCourse.professorId === user?.professorId))

  const openScheduleEditor = () => {
    if (!canEditSelectedCourse) {
      setError("You can only edit your own classes. Contact an administrator for changes.")
      return
    }
    setScheduleDraft(
      courseSchedule.length > 0 ? [...courseSchedule] : [{ day: "monday", startTime: "09:00", endTime: "10:00", location: "" }],
    )
    setScheduleEditorOpen(true)
  }

  const updateDraftSlot = (index: number, updates: Partial<CourseScheduleEntry>) => {
    setScheduleDraft((prev) => prev.map((slot, idx) => (idx === index ? { ...slot, ...updates } : slot)))
  }

  const addDraftSlot = () => {
    setScheduleDraft((prev) => [...prev, { day: "monday", startTime: "09:00", endTime: "10:00", location: "" }])
  }

  const removeDraftSlot = (index: number) => {
    setScheduleDraft((prev) => prev.filter((_, idx) => idx !== index))
  }

  const saveSchedule = async () => {
    if (!selectedCourse || !canEditSelectedCourse) return
    const originalSchedule = selectedCourse.schedule ?? []
    const locationChanged = scheduleDraft.some((slot, idx) => (originalSchedule[idx]?.location ?? "") !== (slot.location ?? ""))
    if (locationChanged && !(user?.role === "admin" || user?.role === "super-admin" || user?.role === "supervisor")) {
      setError("Location changes require supervisor/admin approval. Please request an update.")
      return
    }
    setSavingSchedule(true)
    try {
      const updated = await updateCourseScheduleRequest(selectedCourse.id, scheduleDraft)
      setCourseSchedules((prev) => ({ ...prev, [selectedCourse.id]: updated.schedule ?? [] }))
      setScheduleEditorOpen(false)
      toast({ title: "Schedule saved", description: "Course timetable updated." })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save schedule")
    } finally {
      setSavingSchedule(false)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Schedule" description="Weekly timetable for your assigned courses" />
      <ProfessorTabNav />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Select course</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessorCourseSelect
            courses={courses}
            selectedCourseId={selectedCourseId}
            onChange={setSelectedCourseId}
            isLoading={isLoadingCourses}
          />
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Weekly timetable</CardTitle>
          <Button variant="outline" size="sm" onClick={openScheduleEditor} disabled={!selectedCourse}>
            Edit schedule
          </Button>
        </CardHeader>
        <CardContent>
          {courseSchedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedule has been published for this course yet.</p>
          ) : (
            <ScheduleGrid sessions={scheduleSessions} readOnly height={520} />
          )}
        </CardContent>
      </Card>

      <Dialog open={scheduleEditorOpen} onOpenChange={setScheduleEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit schedule</DialogTitle>
            <DialogDescription>Update weekly sessions for {selectedCourse?.code} - {selectedCourse?.title}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {scheduleDraft.map((slot, index) => (
              <div key={`${slot.day}-${index}`} className="grid grid-cols-1 items-end gap-2 rounded-lg border border-border bg-card/80 p-3 md:grid-cols-5">
                <div>
                  <Label>Day</Label>
                  <Select value={slot.day} onValueChange={(value) => updateDraftSlot(index, { day: value as CourseScheduleEntry["day"] })}>
                    <SelectTrigger className="border-border bg-secondary/70"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start</Label>
                  <Input value={slot.startTime} onChange={(e) => updateDraftSlot(index, { startTime: e.target.value })} placeholder="09:00" />
                </div>
                <div>
                  <Label>End</Label>
                  <Input value={slot.endTime} onChange={(e) => updateDraftSlot(index, { endTime: e.target.value })} placeholder="10:00" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={slot.location} onChange={(e) => updateDraftSlot(index, { location: e.target.value })} placeholder="Room" />
                </div>
                <div className="flex items-center justify-end">
                  <Button variant="ghost" size="sm" onClick={() => removeDraftSlot(index)} disabled={scheduleDraft.length <= 1}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={addDraftSlot}>Add session</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveSchedule} disabled={savingSchedule || !selectedCourse}>
              {savingSchedule ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Save schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

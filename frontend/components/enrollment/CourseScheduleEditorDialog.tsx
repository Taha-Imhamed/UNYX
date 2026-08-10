"use client"

import { useCallback, useMemo, useState } from "react"
import type { Dispatch, DragEvent, KeyboardEvent, SetStateAction } from "react"
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
import { ArrowDown, ArrowUp, Check, Plus } from "lucide-react"
import { pillButtonStyles, scheduleDays } from "@/components/enrollment/shared"
import type { Course, CourseScheduleEntry, Professor } from "@shared/types"

interface CourseScheduleEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleCourse: Course | null
  scheduleDraft: CourseScheduleEntry[]
  setScheduleDraft: Dispatch<SetStateAction<CourseScheduleEntry[]>>
  professorDepartments: string[]
  filteredScheduleProfessors: Professor[]
  scheduleProfessorDepartment: string
  setScheduleProfessorDepartment: (value: string) => void
  scheduleProfessorId: string
  setScheduleProfessorId: (value: string) => void
  savingSchedule: boolean
  scheduleError: string | null
  onSave: () => void
  toMinutes: (time: string) => number
}

export function CourseScheduleEditorDialog({
  open,
  onOpenChange,
  scheduleCourse,
  scheduleDraft,
  setScheduleDraft,
  professorDepartments,
  filteredScheduleProfessors,
  scheduleProfessorDepartment,
  setScheduleProfessorDepartment,
  scheduleProfessorId,
  setScheduleProfessorId,
  savingSchedule,
  scheduleError,
  onSave,
  toMinutes,
}: CourseScheduleEditorDialogProps) {
  const [draggedScheduleIndex, setDraggedScheduleIndex] = useState<number | null>(null)

  const scheduleDraftByDay = useMemo(
    () =>
      scheduleDays.map((day) => ({
        day,
        slots: scheduleDraft
          .map((slot, index) => ({ slot, index }))
          .filter(({ slot }) => slot.day === day),
      })),
    [scheduleDraft],
  )

  const scheduleDraftConflicts = useMemo(() => {
    const byDay = new Map<string, Array<{ slot: CourseScheduleEntry; index: number }>>()
    scheduleDraft.forEach((slot, index) => {
      const bucket = byDay.get(slot.day) ?? []
      bucket.push({ slot, index })
      byDay.set(slot.day, bucket)
    })

    const conflicts = new Set<number>()
    byDay.forEach((slots) => {
      const sorted = slots
        .map(({ slot, index }) => ({ slot, index, start: toMinutes(slot.startTime), end: toMinutes(slot.endTime) }))
        .sort((a, b) => a.start - b.start)

      for (let i = 0; i < sorted.length - 1; i += 1) {
        const current = sorted[i]
        for (let j = i + 1; j < sorted.length; j += 1) {
          const next = sorted[j]
          if (next.start < current.end) {
            conflicts.add(current.index)
            conflicts.add(next.index)
          } else {
            break
          }
        }
      }
    })

    return conflicts
  }, [scheduleDraft, toMinutes])

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

  const moveSlot = useCallback(
    (fromIndex: number, toIndex: number | null, newDay: CourseScheduleEntry["day"]) => {
      setScheduleDraft((prev) => {
        if (fromIndex < 0 || fromIndex >= prev.length) return prev
        const next = [...prev]
        const [item] = next.splice(fromIndex, 1)
        if (!item) return prev
        const updated = { ...item, day: newDay }

        if (toIndex === null) {
          const dayIndices = next.reduce<number[]>((acc, slot, idx) => (slot.day === newDay ? [...acc, idx] : acc), [])
          const insertionIndex = dayIndices.length > 0 ? dayIndices[dayIndices.length - 1] + 1 : next.length
          next.splice(insertionIndex, 0, updated)
          return next
        }

        const boundedIndex = Math.min(Math.max(toIndex, 0), next.length)
        const insertionIndex = fromIndex < toIndex ? Math.max(0, boundedIndex - 1) : boundedIndex
        next.splice(insertionIndex, 0, updated)
        return next
      })
      setDraggedScheduleIndex(null)
    },
    [setScheduleDraft],
  )

  const moveSlotWithinDay = (index: number, direction: "up" | "down") => {
    const current = scheduleDraft[index]
    if (!current) return
    const day = current.day
    const dayIndices = scheduleDraft.reduce<number[]>((acc, slot, idx) => (slot.day === day ? [...acc, idx] : acc), [])
    const position = dayIndices.indexOf(index)
    if (position === -1) return
    const targetPos = direction === "up" ? position - 1 : position + 1
    if (targetPos < 0 || targetPos >= dayIndices.length) return
    const targetIndex = dayIndices[targetPos]
    moveSlot(index, targetIndex, day)
  }

  const handleSlotDragStart = (index: number) => (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("text/plain", String(index))
    setDraggedScheduleIndex(index)
  }

  const handleSlotDropOnDay = (day: CourseScheduleEntry["day"]) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const raw = event.dataTransfer.getData("text/plain")
    const index = Number(raw)
    if (Number.isNaN(index)) return
    const current = scheduleDraft[index]
    if (!current) return
    if (current.day === day && scheduleDraftByDay.find((entry) => entry.day === day)?.slots.length === 1) {
      setDraggedScheduleIndex(null)
      return
    }
    moveSlot(index, null, day)
  }

  const handleSlotDropOnSlot = (targetIndex: number, day: CourseScheduleEntry["day"]) =>
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const raw = event.dataTransfer.getData("text/plain")
      const fromIndex = Number(raw)
      if (Number.isNaN(fromIndex)) return
      if (fromIndex === targetIndex && scheduleDraft[fromIndex]?.day === day) {
        setDraggedScheduleIndex(null)
        return
      }
      moveSlot(fromIndex, targetIndex, day)
    }

  const handleSlotDragOver = (event: DragEvent<HTMLDivElement>) => event.preventDefault()

  const handleSlotDragEnd = () => setDraggedScheduleIndex(null)

  const handleSlotKeyDown = (
    index: number,
    slotPosition: number,
    totalSlots: number,
  ) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return
    if (event.key === "ArrowUp") {
      event.preventDefault()
      if (slotPosition > 0) moveSlotWithinDay(index, "up")
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      if (slotPosition < totalSlots - 1) moveSlotWithinDay(index, "down")
    }
  }

  const updateDraftSlot = (index: number, updates: Partial<CourseScheduleEntry>) => {
    setScheduleDraft((prev) => prev.map((slot, idx) => (idx === index ? { ...slot, ...updates } : slot)))
  }

  const addDraftSlot = () => {
    setScheduleDraft((prev) => [
      ...prev,
      { day: "monday", startTime: "09:00", endTime: "10:00", location: "", branch: scheduleCourse?.branch ?? "" },
    ])
  }

  const removeDraftSlot = (index: number) => {
    setScheduleDraft((prev) => prev.filter((_, idx) => idx !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] md:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Edit course schedule</DialogTitle>
          <DialogDescription>Adjust weekly sessions for {scheduleCourse?.code} — {scheduleCourse?.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Drag sessions between days</p>
              <div className="flex items-center gap-3 text-xs">
                {hasInvalidSchedule ? <span className="text-destructive">Fix invalid time ranges</span> : null}
                {scheduleDraftConflicts.size > 0 ? (
                  <span className="text-destructive">{scheduleDraftConflicts.size} conflict{scheduleDraftConflicts.size === 1 ? "" : "s"} detected</span>
                ) : null}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {scheduleDraftByDay.map(({ day, slots }) => (
                <div
                  key={day}
                  className="rounded-md border border-border bg-card/70 p-3"
                  onDragOver={handleSlotDragOver}
                  onDrop={handleSlotDropOnDay(day)}
                >
                  <p className="text-xs uppercase text-muted-foreground">{day}</p>
                  <div className="mt-2 space-y-2 min-h-[48px]">
                    {slots.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Drop here</p>
                    ) : (
                      slots.map(({ slot, index }, slotPosition) => (
                        <div
                          key={`${day}-${index}`}
                          draggable
                          onDragStart={handleSlotDragStart(index)}
                          onDragEnd={handleSlotDragEnd}
                          onDrop={handleSlotDropOnSlot(index, day)}
                          onDragOver={handleSlotDragOver}
                          onKeyDown={handleSlotKeyDown(index, slotPosition, slots.length)}
                          tabIndex={0}
                          className={`rounded-md border px-3 py-2 text-sm shadow-sm transition ${
                            scheduleDraftConflicts.has(index) || invalidScheduleIndexes.has(index)
                              ? "border-destructive/70 bg-destructive/10"
                              : "border-border bg-secondary/20"
                          } ${draggedScheduleIndex === index ? "opacity-60" : ""}`}
                          title={
                            invalidScheduleIndexes.has(index)
                              ? "Start time must be before end time"
                              : scheduleDraftConflicts.has(index)
                                ? "Overlaps with another session"
                                : undefined
                          }
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-foreground">
                              {slot.startTime}–{slot.endTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  moveSlotWithinDay(index, "up")
                                }}
                                disabled={slotPosition === 0}
                                aria-label="Move session up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  moveSlotWithinDay(index, "down")
                                }}
                                disabled={slotPosition === slots.length - 1}
                                aria-label="Move session down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              {invalidScheduleIndexes.has(index) ? (
                                <Badge variant="destructive" className="h-5 px-2 text-[10px]">Invalid</Badge>
                              ) : null}
                              {scheduleDraftConflicts.has(index) ? (
                                <Badge variant="destructive" className="h-5 px-2 text-[10px]">Conflict</Badge>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {slot.location || "Location TBD"}
                            {slot.branch ? ` • ${slot.branch}` : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Label>Professor department</Label>
                <Select value={scheduleProfessorDepartment} onValueChange={setScheduleProfessorDepartment}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {professorDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned professor</Label>
                <Select
                  value={scheduleProfessorId}
                  onValueChange={setScheduleProfessorId}
                  disabled={filteredScheduleProfessors.length === 0}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder={filteredScheduleProfessors.length === 0 ? "No professors available" : "Select professor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredScheduleProfessors.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No professors available
                      </SelectItem>
                    ) : (
                      filteredScheduleProfessors.map((professor) => (
                        <SelectItem key={professor.id} value={professor.id}>
                          {professor.firstName} {professor.lastName}{professor.department ? ` — ${professor.department}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {scheduleCourse?.branch ? (
                <p className="text-sm text-muted-foreground self-end">
                  Course branch: {scheduleCourse.branch}. Set per-session overrides below if needed.
                </p>
              ) : null}
            </div>

            {scheduleDraft.map((slot, index) => (
              <div
                key={`${slot.day}-${index}`}
                className="grid grid-cols-1 items-end gap-2 rounded-lg border border-border p-3 md:grid-cols-7"
              >
                <div className="md:col-span-1">
                  <Label>Day</Label>
                  <Select
                    value={slot.day}
                    onValueChange={(value) => updateDraftSlot(index, { day: value as CourseScheduleEntry["day"] })}
                  >
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
                <div>
                  <Label>Start</Label>
                  <Input
                    type="time"
                    step={300}
                    value={slot.startTime}
                    onChange={(e) => updateDraftSlot(index, { startTime: e.target.value })}
                    placeholder="09:00"
                  />
                </div>
                <div>
                  <Label>End</Label>
                  <Input
                    type="time"
                    step={300}
                    value={slot.endTime}
                    onChange={(e) => updateDraftSlot(index, { endTime: e.target.value })}
                    placeholder="10:00"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Location</Label>
                  <Input
                    value={slot.location}
                    onChange={(e) => updateDraftSlot(index, { location: e.target.value })}
                    placeholder="Room"
                  />
                </div>
                <div>
                  <Label>Branch / Campus</Label>
                  <Input
                    value={slot.branch ?? ""}
                    onChange={(e) => updateDraftSlot(index, { branch: e.target.value })}
                    placeholder="Branch or campus code"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={pillButtonStyles.dangerOutline}
                    onClick={() => removeDraftSlot(index)}
                    disabled={scheduleDraft.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
                {invalidScheduleIndexes.has(index) ? (
                  <p className="md:col-span-7 text-xs text-destructive">Start time must be before end time.</p>
                ) : null}
              </div>
            ))}
            <Button variant="outline" className={`gap-2 ${pillButtonStyles.neutral}`} onClick={addDraftSlot}>
              <Plus className="h-4 w-4" /> Add session
            </Button>
            {scheduleError && <p className="text-sm text-destructive">{scheduleError}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className={pillButtonStyles.neutral} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={savingSchedule || !scheduleCourse || hasInvalidSchedule} className={`gap-2 ${pillButtonStyles.primary}`}>
            {savingSchedule ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            Save schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

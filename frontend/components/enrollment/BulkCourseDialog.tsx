"use client"

import { useEffect, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
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
import { AlertTriangle, Check, Info } from "lucide-react"
import { pillButtonStyles } from "@/components/enrollment/shared"
import { useToast } from "@/hooks/use-toast"
import { bulkUpdateCoursesRequest, type AcademicStructure } from "@/lib/enrollment-api"
import type { Course } from "@shared/types"

interface BulkCourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courses: Course[]
  setCourses: Dispatch<SetStateAction<Course[]>>
  academicStructure: AcademicStructure | null
  setAcademicStructure: Dispatch<SetStateAction<AcademicStructure | null>>
}

export function BulkCourseDialog({
  open,
  onOpenChange,
  courses,
  setCourses,
  academicStructure,
  setAcademicStructure,
}: BulkCourseDialogProps) {
  const { toast } = useToast()
  const [bulkStart, setBulkStart] = useState<string>("")
  const [bulkEnd, setBulkEnd] = useState<string>("")
  const [selectedMajorId, setSelectedMajorId] = useState<string>("all")
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkAction, setBulkAction] = useState<"open" | "close">("open")
  const [bulkCloseNote, setBulkCloseNote] = useState<string>("")
  const [bulkProgress, setBulkProgress] = useState<Record<string, "idle" | "success" | "failed">>({})
  const [bulkErrorsMap, setBulkErrorsMap] = useState<Record<string, string>>({})
  const [bulkSelectAll, setBulkSelectAll] = useState(false)

  const bulkVisibleCourseIds = useMemo(() => {
    if (selectedMajorId !== "all") {
      const major = academicStructure?.majors.find((entry) => entry.id === selectedMajorId)
      return major?.courseIds?.length ? major.courseIds : []
    }
    return courses.map((course) => course.id)
  }, [academicStructure?.majors, courses, selectedMajorId])

  const affectedStudentCount = useMemo(() => {
    const targets = selectedCourseIds.length ? selectedCourseIds : bulkVisibleCourseIds
    return targets.reduce((sum, id) => {
      const course = courses.find((c) => c.id === id) as (Course & { enrolledCount?: number }) | undefined
      return sum + (course?.enrolledCount ?? 0)
    }, 0)
  }, [bulkVisibleCourseIds, courses, selectedCourseIds])

  useEffect(() => {
    if (!open) return
    const nextAllSelected =
      bulkVisibleCourseIds.length > 0 && bulkVisibleCourseIds.every((courseId) => selectedCourseIds.includes(courseId))
    if (bulkSelectAll !== nextAllSelected) {
      setBulkSelectAll(nextAllSelected)
    }
  }, [open, bulkSelectAll, bulkVisibleCourseIds, selectedCourseIds])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSelectedCourseIds([])
          setSelectedMajorId("all")
          setBulkStart("")
          setBulkEnd("")
          setBulkError(null)
          setBulkCloseNote("")
          setBulkSelectAll(false)
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Open enrollment for selected courses</DialogTitle>
          <DialogDescription>Select a major, choose courses, pick start and end times, then save.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3">
            <Label>Action</Label>
            <div className="flex gap-3 items-center mt-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="bulkAction" checked={bulkAction === "open"} onChange={() => setBulkAction("open")} />
                <span className="text-sm">Open enrollment</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="bulkAction" checked={bulkAction === "close"} onChange={() => setBulkAction("close")} />
                <span className="text-sm">Close enrollment</span>
              </label>
            </div>
          </div>
          <div className="col-span-1">
            <Label>Major</Label>
            <Select value={selectedMajorId} onValueChange={(v) => { setSelectedMajorId(v); setSelectedCourseIds([]); setBulkSelectAll(false) }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select major" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All majors</SelectItem>
                {academicStructure?.majors.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">Choose a major to list its courses on the right. Leave blank to show all courses.</p>
          </div>

          <div className="col-span-2">
            <Label>Courses</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="bulk-select-all"
                  type="checkbox"
                  checked={bulkSelectAll}
                  disabled={bulkSaving || bulkVisibleCourseIds.length === 0}
                  onChange={(e) => {
                    const select = e.target.checked
                    setBulkSelectAll(select)
                    setSelectedCourseIds(select ? bulkVisibleCourseIds : [])
                  }}
                />
                <label htmlFor="bulk-select-all" className="text-sm">Select all</label>
              </div>
              <div className="text-xs text-muted-foreground">Selected: {selectedCourseIds.length}</div>
            </div>

            {bulkSaving ? (
              <div className="flex items-center gap-2 rounded border border-dashed p-2 text-sm text-muted-foreground">
                <Spinner size="sm" />
                Saving {selectedCourseIds.length || bulkVisibleCourseIds.length} course(s)…
              </div>
            ) : null}

            <div className="max-h-56 overflow-auto rounded border p-2">
              {bulkVisibleCourseIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No courses linked to this major.</p>
              ) : (
                bulkVisibleCourseIds.map((cid) => {
                  const course = courses.find((c) => c.id === cid)
                  if (!course) return null
                  const checked = selectedCourseIds.includes(cid)
                  const status = bulkProgress[cid] ?? "idle"
                  const err = bulkErrorsMap[cid]
                  return (
                    <div key={cid} className="flex items-center justify-between gap-2 py-1">
                      <div>
                        <div className="font-medium text-sm">{course.title}</div>
                        <div className="text-xs text-muted-foreground">{course.displayId || course.id}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {status === "success" ? <Check className="text-green-600" /> : status === "failed" ? <div className="text-destructive text-sm">Failed</div> : null}
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={bulkSaving}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedCourseIds((s) => Array.from(new Set([...s, cid])))
                            else setSelectedCourseIds((s) => s.filter((x) => x !== cid))
                            setBulkSelectAll(false)
                          }}
                        />
                      </div>
                      {err ? <div className="text-xs text-destructive">{err}</div> : null}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {bulkAction === "open" ? (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <Label>Opens at</Label>
              <Input type="datetime-local" value={bulkStart} onChange={(e) => setBulkStart(e.target.value)} />
            </div>
            <div>
              <Label>Closes at</Label>
              <Input type="datetime-local" value={bulkEnd} onChange={(e) => setBulkEnd(e.target.value)} />
            </div>
            <p className="col-span-2 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              This sets a date window in addition to each course's manual open/close switch. If a course was closed
              manually on the Courses page, it stays closed here until that switch is flipped back on too — even
              inside this window.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <Label>Close note (optional)</Label>
            <Textarea value={bulkCloseNote} onChange={(e) => setBulkCloseNote(e.target.value)} className="mt-1" />
            <p className="mt-2 text-xs text-muted-foreground">Provide a note explaining why enrollment is being closed.</p>
          </div>
        )}

        {bulkAction === "close" && affectedStudentCount > 0 ? (
          <p className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {affectedStudentCount} active enrollment{affectedStudentCount === 1 ? "" : "s"} across the selected
            courses will lose access to enroll or re-enroll while closed.
          </p>
        ) : null}

        {bulkError ? <p className="mt-3 text-sm text-destructive">{bulkError}</p> : null}

        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" className={pillButtonStyles.neutral} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              className={bulkAction === "open" ? pillButtonStyles.positive : pillButtonStyles.danger}
              onClick={async () => {
                if (bulkSaving) return
                const targets = selectedCourseIds.length ? selectedCourseIds : bulkVisibleCourseIds
                if (!targets || targets.length === 0) {
                  setBulkError("No courses selected")
                  return
                }
                setBulkSaving(true)
                setBulkError(null)
                setBulkErrorsMap({})
                try {
                  const startIso = bulkStart ? new Date(bulkStart).toISOString() : null
                  const endIso = bulkEnd ? new Date(bulkEnd).toISOString() : null
                  const payload: any = { courseIds: targets, action: bulkAction }
                  if (selectedMajorId !== "all") {
                    payload.majorId = selectedMajorId
                  }
                  if (bulkAction === "open") {
                    payload.openAt = startIso
                    payload.closeAt = endIso
                  } else {
                    payload.note = bulkCloseNote || null
                  }
                  const resp = await bulkUpdateCoursesRequest(payload)
                  const updated = resp.updated ?? []
                  const notFound = resp.notFound ?? []
                  // mark successes
                  const successMap: Record<string, "success" | "failed"> = {}
                  updated.forEach((c) => { successMap[c.id] = "success" })
                  notFound.forEach((id) => { successMap[id] = "failed"; setBulkErrorsMap((m) => ({ ...m, [id]: "Not found" })) })
                  // any target not present in updated or notFound => mark failed
                  targets.forEach((id) => {
                    if (!successMap[id]) {
                      successMap[id] = "failed"
                      setBulkErrorsMap((m) => ({ ...m, [id]: "Update failed" }))
                    }
                  })
                  setBulkProgress((s) => ({ ...s, ...Object.fromEntries(Object.entries(successMap)) }))
                  // update courses list with updated docs
                  if (updated.length > 0) {
                    setCourses((prev) => prev.map((c) => {
                      const found = updated.find((u) => u.id === c.id)
                      return found ? found : c
                    }))
                  }
                  if (selectedMajorId !== "all") {
                    setAcademicStructure((prev) => {
                      if (!prev) return prev
                      return {
                        ...prev,
                        majors: prev.majors.map((major) =>
                          major.id === selectedMajorId
                            ? { ...major, courseIds: Array.from(new Set([...(major.courseIds ?? []), ...targets])) }
                            : major,
                        ),
                      }
                    })
                  }
                  toast({ title: bulkAction === "open" ? "Enrollment opened" : "Enrollment closed", description: `${updated.length} course(s) updated` })
                  onOpenChange(false)
                } catch (err) {
                  setBulkError(err instanceof Error ? err.message : String(err))
                } finally {
                  setBulkSaving(false)
                }
              }}
              disabled={bulkSaving}
            >
              {bulkSaving ? "Saving…" : bulkAction === "open" ? "Save Enrollment Window" : "Close Enrollment for Selected"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useMemo, useState } from "react"
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
import { Spinner } from "@/components/ui/spinner"
import { AlertTriangle, Check, RefreshCw } from "lucide-react"
import { pillButtonStyles } from "@/components/enrollment/shared"
import { useToast } from "@/hooks/use-toast"
import { bulkImportCoursesRequest, type BulkImportCourseRow } from "@/lib/enrollment-api"
import type { Course } from "@shared/types"

interface SemesterRolloverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceCourses: Course[]
  setCourses: Dispatch<SetStateAction<Course[]>>
}

export function SemesterRolloverDialog({ open, onOpenChange, sourceCourses, setCourses }: SemesterRolloverDialogProps) {
  const { toast } = useToast()
  const [newStartDate, setNewStartDate] = useState("")
  const [durationDays, setDurationDays] = useState("120")
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: Array<{ row: number; title: string; error: string }> } | null>(null)

  const selectedCourses = useMemo(() => sourceCourses, [sourceCourses])

  const handleRollover = async () => {
    if (!newStartDate) {
      toast({ variant: "destructive", title: "Pick a start date first" })
      return
    }
    const start = new Date(newStartDate)
    if (Number.isNaN(start.getTime())) {
      toast({ variant: "destructive", title: "Invalid start date" })
      return
    }
    const duration = Number(durationDays) || 120
    const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000)

    setImporting(true)
    setResult(null)
    try {
      const rows: BulkImportCourseRow[] = selectedCourses.map((course) => ({
        title: course.title,
        professorId: course.professorId,
        capacity: course.capacity,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        price: course.price,
        department: course.department,
        branch: course.branch,
        location: course.location,
        sectionId: course.sectionId,
        creditHours: course.creditHours,
        courseType: course.courseType === "common" ? "common" : "major",
      }))
      const resp = await bulkImportCoursesRequest(rows)
      setResult({ created: resp.created.length, failed: resp.failed })
      if (resp.created.length > 0) {
        setCourses((prev) => [...prev, ...resp.created])
        toast({ title: `${resp.created.length} course(s) rolled forward` })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Rollover failed",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setNewStartDate("")
    setDurationDays("120")
    setResult(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Roll semester forward
          </DialogTitle>
          <DialogDescription>
            Duplicates {selectedCourses.length} course(s) currently shown on this page (respecting your active
            filters) with a new date range. Professor, capacity, price, department, campus, and location carry
            over — enrollments, schedules, and enrollment-open state do not.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>New start date</Label>
            <Input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Duration (days)</Label>
            <Input type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
          </div>

          {selectedCourses.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              No courses match the current filters — adjust the Courses page filters first.
            </p>
          ) : null}

          {result ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-emerald-700">
                <Check className="h-4 w-4" />
                {result.created} course(s) created.
              </p>
              {result.failed.length > 0 ? (
                <div className="max-h-32 overflow-auto rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                  {result.failed.map((f) => (
                    <p key={f.row}>{f.title || "untitled"}: {f.error}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" className={pillButtonStyles.neutral} onClick={() => onOpenChange(false)}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result ? (
            <Button
              className={`gap-2 ${pillButtonStyles.primary}`}
              onClick={handleRollover}
              disabled={importing || selectedCourses.length === 0}
            >
              {importing ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              Roll forward {selectedCourses.length} course(s)
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

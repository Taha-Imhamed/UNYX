"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { CourseScheduleEntry, EnrollmentWithCourse } from "@shared/types"

function formatSchedule(schedule?: CourseScheduleEntry[]) {
  if (!schedule || schedule.length === 0) return "No schedule provided"
  return schedule
    .map((s) => `${s.day.slice(0, 3)} ${s.startTime}-${s.endTime}${s.location ? ` @ ${s.location}` : ""}`)
    .join(" • ")
}

function letterColor(letter: string | null | undefined) {
  if (!letter) return "border-border text-foreground"
  if (["A", "A-"].includes(letter)) return "bg-emerald-500/15 text-emerald-700 border-emerald-200"
  if (["B", "B-"].includes(letter)) return "bg-green-500/15 text-green-800 border-green-200"
  if (["C", "C-"].includes(letter)) return "bg-amber-400/20 text-amber-900 border-amber-300"
  if (["D", "D-"].includes(letter)) return "bg-orange-500/15 text-orange-800 border-orange-200"
  return "bg-destructive/10 text-destructive border-destructive/30"
}

export interface GradeBreakdownProps {
  enrollment: EnrollmentWithCourse
  readOnly?: boolean
  saving?: boolean
  error?: string | null
  onSave?: (input: {
    gradeMidterm?: number | null
    gradeFinal?: number | null
    gradeProject?: number | null
    gradeParticipation?: number | null
    gradeTotal?: number | null
    letterGrade?: string | null
    grade?: string | null
    status?: EnrollmentWithCourse["status"]
  }) => Promise<void> | void
}

export function GradeBreakdown({ enrollment, readOnly = true, saving, error, onSave }: GradeBreakdownProps) {
  const [draft, setDraft] = useState({
    gradeMidterm: enrollment.gradeMidterm ?? null,
    gradeFinal: enrollment.gradeFinal ?? null,
    gradeProject: enrollment.gradeProject ?? null,
    gradeParticipation: enrollment.gradeParticipation ?? null,
    gradeTotal: enrollment.gradeTotal ?? null,
    letterGrade: enrollment.letterGrade ?? null,
    grade: enrollment.grade ?? null,
    status: enrollment.status,
  })

  // Keep local draft in sync when enrollment updates from the server
  useEffect(() => {
    setDraft({
      gradeMidterm: enrollment.gradeMidterm ?? null,
      gradeFinal: enrollment.gradeFinal ?? null,
      gradeProject: enrollment.gradeProject ?? null,
      gradeParticipation: enrollment.gradeParticipation ?? null,
      gradeTotal: enrollment.gradeTotal ?? null,
      letterGrade: enrollment.letterGrade ?? null,
      grade: enrollment.grade ?? null,
      status: enrollment.status,
    })
  }, [
    enrollment.gradeMidterm,
    enrollment.gradeFinal,
    enrollment.gradeProject,
    enrollment.gradeParticipation,
    enrollment.gradeTotal,
    enrollment.letterGrade,
    enrollment.grade,
    enrollment.status,
  ])

  const letterBadge = useMemo(() => draft.letterGrade ?? enrollment.letterGrade ?? null, [draft.letterGrade, enrollment.letterGrade])

  const handleNumber = (key: keyof typeof draft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value === "" ? null : Number(value) }))
  }

  const handleSave = async () => {
    if (!onSave) return
    const parts = [draft.gradeMidterm, draft.gradeFinal, draft.gradeProject, draft.gradeParticipation].filter(
      (v) => v !== null && v !== undefined,
    ) as number[]
    const derivedTotal = parts.length > 0 ? Number(parts.reduce((acc, v) => acc + v, 0).toFixed(2)) : null
    const totalToSend = derivedTotal ?? draft.gradeTotal ?? null
    const payload = { ...draft, gradeTotal: totalToSend }
    await onSave(payload)
  }

  return (
    <Card className="p-4 border border-border bg-card space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{enrollment.courseCode ?? enrollment.courseTitle}</p>
          <p className="text-xs text-muted-foreground">
            {enrollment.courseTitle} • {enrollment.professorName}
          </p>
          <p className="text-xs text-muted-foreground">{formatSchedule(enrollment.courseSchedule)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {enrollment.sectionId && (
            <Badge variant="outline" className="border-border">Section {enrollment.sectionId}</Badge>
          )}
          <Badge variant="outline" className="border-border">{enrollment.status}</Badge>
          <Badge variant="outline" className={`border ${letterColor(letterBadge)}`}>
            {letterBadge ?? "Ungraded"}
          </Badge>
        </div>
      </div>

      {readOnly ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
          <span>Midterm: {enrollment.gradeMidterm ?? "—"}</span>
          <span>Final: {enrollment.gradeFinal ?? "—"}</span>
          <span>Project: {enrollment.gradeProject ?? "—"}</span>
          <span>Participation: {enrollment.gradeParticipation ?? "—"}</span>
          <span>Total: {enrollment.gradeTotal ?? "—"}</span>
          <span>Letter: {enrollment.letterGrade ?? "—"}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="space-y-1">
            <Label className="text-xs">Midterm</Label>
            <Input type="number" value={draft.gradeMidterm ?? ""} onChange={(e) => handleNumber("gradeMidterm", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Final</Label>
            <Input type="number" value={draft.gradeFinal ?? ""} onChange={(e) => handleNumber("gradeFinal", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Project</Label>
            <Input type="number" value={draft.gradeProject ?? ""} onChange={(e) => handleNumber("gradeProject", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Participation</Label>
            <Input type="number" value={draft.gradeParticipation ?? ""} onChange={(e) => handleNumber("gradeParticipation", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Total</Label>
            <Input type="number" value={draft.gradeTotal ?? ""} onChange={(e) => handleNumber("gradeTotal", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Letter</Label>
            <Input value={draft.letterGrade ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, letterGrade: e.target.value || null }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Input value={draft.status} onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as EnrollmentWithCourse["status"] }))} />
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      )}

      {error && readOnly && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Card>
  )
}

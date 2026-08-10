"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { fetchEnrollments, updateEnrollmentGrades } from "@/lib/enrollment-api"
import type { EnrollmentRecord } from "@/lib/enrollment-api"
import { fetchGradeChangeRequests, createGradeChangeRequest } from "@/lib/grade-change-requests-api"
import type { GradeChangeRequest } from "@/lib/grade-change-requests-api"
import { useToast } from "@/hooks/use-toast"
import { useMyCourses } from "@/hooks/enrollment/use-my-courses"

type GradeField = "gradeMidterm" | "gradeFinal" | "gradeProject" | "gradeParticipation"

const GRADE_MIN = 0
const GRADE_MAX = 100

interface GradeParts {
  gradeMidterm: string
  gradeFinal: string
  gradeProject: string
  gradeParticipation: string
  gradeTotal: number
}

const emptyGradeParts: GradeParts = {
  gradeMidterm: "",
  gradeFinal: "",
  gradeProject: "",
  gradeParticipation: "",
  gradeTotal: 0,
}

export default function GradeSubmissionPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { courses } = useMyCourses({ includeSchedule: true })
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [students, setStudents] = useState<EnrollmentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [gradeParts, setGradeParts] = useState<Record<string, GradeParts>>({})

  useEffect(() => {
    setSelectedCourseId((prev) => (prev && courses.some((c) => c.id === prev) ? prev : courses[0]?.id ?? ""))
  }, [courses])

  useEffect(() => {
    if (!selectedCourseId) {
      setStudents([])
      return
    }
    setLoading(true)
    const controller = new AbortController()
    fetchEnrollments({ courseId: selectedCourseId, page: 1, pageSize: 200, signal: controller.signal })
      .then((payload) => setStudents(payload.items))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [selectedCourseId])

  useEffect(() => {
    const next: Record<string, GradeParts> = {}
    students.forEach((s) => {
      const mid = s.gradeMidterm ?? null
      const fin = s.gradeFinal ?? null
      const proj = s.gradeProject ?? null
      const part = s.gradeParticipation ?? null
      const total = [mid, fin, proj, part]
        .map((v) => (typeof v === 'number' ? v : v ? Number(v) : 0))
        .reduce((a, b) => a + b, 0)
      next[s.id] = {
        gradeMidterm: mid !== null && mid !== undefined ? String(mid) : "",
        gradeFinal: fin !== null && fin !== undefined ? String(fin) : "",
        gradeProject: proj !== null && proj !== undefined ? String(proj) : "",
        gradeParticipation: part !== null && part !== undefined ? String(part) : "",
        gradeTotal: Number.isFinite(total) ? Number(total.toFixed(2)) : 0,
      }
    })
    setGradeParts(next)
  }, [students])

  const handleChangePart = (enrollmentId: string, field: GradeField, value: string) => {
    setGradeParts((prev) => {
      const existing = prev[enrollmentId] ?? emptyGradeParts
      const updated: GradeParts = { ...existing, [field]: value }
      const parts = [updated.gradeMidterm, updated.gradeFinal, updated.gradeProject, updated.gradeParticipation].map((v) => {
        const n = Number(v)
        return Number.isFinite(n) ? n : 0
      })
      updated.gradeTotal = Number(parts.reduce((a, b) => a + b, 0).toFixed(2))
      return { ...prev, [enrollmentId]: updated }
    })
  }

  const saveGrade = async (enrollmentId: string) => {
    const parts = gradeParts[enrollmentId]
    if (!parts) return

    const fields: GradeField[] = ["gradeMidterm", "gradeFinal", "gradeProject", "gradeParticipation"]
    for (const field of fields) {
      const raw = parts[field]
      if (raw === "") continue
      const n = Number(raw)
      if (!Number.isFinite(n) || n < GRADE_MIN || n > GRADE_MAX) {
        toast({
          variant: "destructive",
          title: "Invalid grade",
          description: `Each grade part must be a number between ${GRADE_MIN} and ${GRADE_MAX}.`,
        })
        return
      }
    }

    const payload: Parameters<typeof updateEnrollmentGrades>[1] = {
      gradeMidterm: parts.gradeMidterm === '' ? null : Number(parts.gradeMidterm),
      gradeFinal: parts.gradeFinal === '' ? null : Number(parts.gradeFinal),
      gradeProject: parts.gradeProject === '' ? null : Number(parts.gradeProject),
      gradeParticipation: parts.gradeParticipation === '' ? null : Number(parts.gradeParticipation),
      gradeTotal: Number.isFinite(parts.gradeTotal) ? parts.gradeTotal : null,
    }
    setSaving((s) => ({ ...s, [enrollmentId]: true }))
    try {
      const updated = await updateEnrollmentGrades(enrollmentId, payload)
      setStudents((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
      setGradeParts((prev) => ({ ...prev, [enrollmentId]: {
        gradeMidterm: updated.gradeMidterm !== null && updated.gradeMidterm !== undefined ? String(updated.gradeMidterm) : "",
        gradeFinal: updated.gradeFinal !== null && updated.gradeFinal !== undefined ? String(updated.gradeFinal) : "",
        gradeProject: updated.gradeProject !== null && updated.gradeProject !== undefined ? String(updated.gradeProject) : "",
        gradeParticipation: updated.gradeParticipation !== null && updated.gradeParticipation !== undefined ? String(updated.gradeParticipation) : "",
        gradeTotal: updated.gradeTotal ?? 0,
      }}))
      toast({ title: "Grade saved" })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to save grade",
        description: e instanceof Error ? e.message : "Please try again.",
      })
    } finally {
      setSaving((s) => ({ ...s, [enrollmentId]: false }))
    }
  }

  // Grade change request flows
  const [showRequestFor, setShowRequestFor] = useState<Record<string, boolean>>({})
  const [requestNote, setRequestNote] = useState<Record<string, string>>({})
  const [requestFile, setRequestFile] = useState<Record<string, File | null>>({})
  const [requestParts, setRequestParts] = useState<Record<string, Partial<Record<GradeField, string>>>>({})
  const [myRequests, setMyRequests] = useState<GradeChangeRequest[]>([])

  useEffect(() => {
    if (!user) return
    const controller = new AbortController()
    fetchGradeChangeRequests(controller.signal)
      .then((all) => setMyRequests(all))
      .catch(() => setMyRequests([]))
    return () => controller.abort()
  }, [user])

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const submitRequest = async (enrollmentId: string) => {
    const enrollment = students.find((s) => s.id === enrollmentId)
    if (!enrollment || !user) return
    const parts = requestParts[enrollmentId] ?? {}
    const reason = (requestNote[enrollmentId] ?? '').trim()
    if (!reason) {
      toast({ variant: "destructive", title: "Reason required", description: "Explain why the grade needs to change." })
      return
    }

    const newGrades: Record<GradeField, number | null> = {
      gradeMidterm: parts.gradeMidterm === undefined || parts.gradeMidterm === '' ? null : Number(parts.gradeMidterm),
      gradeFinal: parts.gradeFinal === undefined || parts.gradeFinal === '' ? null : Number(parts.gradeFinal),
      gradeProject: parts.gradeProject === undefined || parts.gradeProject === '' ? null : Number(parts.gradeProject),
      gradeParticipation: parts.gradeParticipation === undefined || parts.gradeParticipation === '' ? null : Number(parts.gradeParticipation),
    }

    for (const value of Object.values(newGrades)) {
      if (value !== null && (!Number.isFinite(value) || value < GRADE_MIN || value > GRADE_MAX)) {
        toast({
          variant: "destructive",
          title: "Invalid grade",
          description: `Each grade part must be a number between ${GRADE_MIN} and ${GRADE_MAX}.`,
        })
        return
      }
    }

    let proofBase64: string | undefined
    let proofFilename: string | undefined
    const file = requestFile[enrollmentId]
    if (file) {
      try {
        proofBase64 = await toBase64(file)
        proofFilename = file.name
      } catch (e) {
        // ignore, proof is optional
      }
    }

    try {
      const created = await createGradeChangeRequest({
        enrollmentId,
        newGrades,
        reason,
        proofBase64,
        proofFilename,
      })
      setMyRequests((prev) => [created, ...prev])
      setShowRequestFor((s) => ({ ...s, [enrollmentId]: false }))
      toast({ title: "Grade change request submitted" })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to submit request",
        description: e instanceof Error ? e.message : "Please try again.",
      })
    }
  }

  const selectedCourse = useMemo(() => courses.find((c) => c.id === selectedCourseId) ?? null, [courses, selectedCourseId])

  const hasPendingRequest = (enrollmentId: string) =>
    myRequests.some((r) => r.enrollmentId === enrollmentId && r.status === "pending")

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Grade Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground">Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="mt-1 block w-full rounded-md border bg-input p-2"
            >
              <option value="">-- select course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
            {selectedCourse && <p className="mt-2 text-sm text-muted-foreground">Assigned: {selectedCourse.professorName}</p>}
          </div>

          <div className="space-y-3">
            {loading && <p>Loading students…</p>}
            {!loading && students.length === 0 && <p>No students enrolled.</p>}
            {!loading && students.map((enrollment) => (
              <div
                key={enrollment.id}
                className="w-full rounded-md border border-border bg-card/50 p-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
                  <div className="sm:col-span-2">
                    <div className="font-medium">{enrollment.student.firstName} {enrollment.student.lastName}</div>
                    <div className="text-sm text-muted-foreground">{enrollment.student.email}</div>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block mb-1 text-xs text-muted-foreground">Midterm (0-100)</label>
                    <Input
                      aria-label="Midterm score, 0 to 100"
                      type="number"
                      min={GRADE_MIN}
                      max={GRADE_MAX}
                      value={gradeParts[enrollment.id]?.gradeMidterm ?? ""}
                      onChange={(e) => handleChangePart(enrollment.id, 'gradeMidterm', e.target.value)}
                      placeholder="0-100"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block mb-1 text-xs text-muted-foreground">Project (0-100)</label>
                    <Input
                      aria-label="Project score, 0 to 100"
                      type="number"
                      min={GRADE_MIN}
                      max={GRADE_MAX}
                      value={gradeParts[enrollment.id]?.gradeProject ?? ""}
                      onChange={(e) => handleChangePart(enrollment.id, 'gradeProject', e.target.value)}
                      placeholder="0-100"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block mb-1 text-xs text-muted-foreground">Final (0-100)</label>
                    <Input
                      aria-label="Final score, 0 to 100"
                      type="number"
                      min={GRADE_MIN}
                      max={GRADE_MAX}
                      value={gradeParts[enrollment.id]?.gradeFinal ?? ""}
                      onChange={(e) => handleChangePart(enrollment.id, 'gradeFinal', e.target.value)}
                      placeholder="0-100"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block mb-1 text-xs text-muted-foreground">Attendance (0-100)</label>
                    <Input
                      aria-label="Attendance / participation score, 0 to 100"
                      type="number"
                      min={GRADE_MIN}
                      max={GRADE_MAX}
                      value={gradeParts[enrollment.id]?.gradeParticipation ?? ""}
                      onChange={(e) => handleChangePart(enrollment.id, 'gradeParticipation', e.target.value)}
                      placeholder="0-100"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-center">
                    <div className="text-sm font-semibold">{String(gradeParts[enrollment.id]?.gradeTotal ?? '')}</div>
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-end">
                    <Button
                      size="sm"
                      onClick={() => saveGrade(enrollment.id)}
                      disabled={saving[enrollment.id] || hasPendingRequest(enrollment.id)}
                      title={hasPendingRequest(enrollment.id) ? "A grade change request is pending review for this student" : undefined}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                {hasPendingRequest(enrollment.id) && (
                  <p className="mt-2 text-xs text-amber-600">
                    A grade change request is pending review for this student. Direct saves are disabled until it's reviewed.
                  </p>
                )}

                <div className="mt-2">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setShowRequestFor((s) => ({ ...s, [enrollment.id]: !s[enrollment.id] }))}>Request Change</Button>
                  </div>

                  {showRequestFor[enrollment.id] && (
                    <div className="mt-3 border-t pt-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <Input type="number" min={GRADE_MIN} max={GRADE_MAX} placeholder="Midterm (0-100)" value={requestParts[enrollment.id]?.gradeMidterm ?? ''} onChange={(e) => setRequestParts((p) => ({ ...p, [enrollment.id]: { ...(p[enrollment.id] ?? {}), gradeMidterm: e.target.value } }))} />
                        <Input type="number" min={GRADE_MIN} max={GRADE_MAX} placeholder="Project (0-100)" value={requestParts[enrollment.id]?.gradeProject ?? ''} onChange={(e) => setRequestParts((p) => ({ ...p, [enrollment.id]: { ...(p[enrollment.id] ?? {}), gradeProject: e.target.value } }))} />
                        <Input type="number" min={GRADE_MIN} max={GRADE_MAX} placeholder="Final (0-100)" value={requestParts[enrollment.id]?.gradeFinal ?? ''} onChange={(e) => setRequestParts((p) => ({ ...p, [enrollment.id]: { ...(p[enrollment.id] ?? {}), gradeFinal: e.target.value } }))} />
                        <Input type="number" min={GRADE_MIN} max={GRADE_MAX} placeholder="Attendance (0-100)" value={requestParts[enrollment.id]?.gradeParticipation ?? ''} onChange={(e) => setRequestParts((p) => ({ ...p, [enrollment.id]: { ...(p[enrollment.id] ?? {}), gradeParticipation: e.target.value } }))} />
                      </div>
                      <div>
                        <textarea className="w-full rounded-md border p-2" placeholder="Why change the grade?" value={requestNote[enrollment.id] ?? ''} onChange={(e) => setRequestNote((n) => ({ ...n, [enrollment.id]: e.target.value }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="file" onChange={(e) => setRequestFile((f) => ({ ...f, [enrollment.id]: e.target.files?.[0] ?? null }))} />
                        <Button size="sm" onClick={() => submitRequest(enrollment.id)}>Submit Request</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Professor's own requests summary */}
          <div className="mt-4">
            <h3 className="text-sm font-medium">My Grade Requests</h3>
            <div className="mt-2 space-y-2">
              {myRequests.length === 0 && <div className="text-sm text-muted-foreground">No requests submitted.</div>}
              {myRequests.map((r) => (
                <div key={r.id} className="p-2 border rounded-sm">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{r.studentName} — {r.courseCode}</div>
                      <div className="text-sm text-muted-foreground">{r.reason}</div>
                    </div>
                    <div className="text-sm">{r.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

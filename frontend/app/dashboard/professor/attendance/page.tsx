"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { useToast } from "@/hooks/use-toast"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import { fetchEnrollments, type EnrollmentRecord } from "@/lib/enrollment-api"
import type { AttendanceRecord } from "@/lib/professor-workspace-api"

type AttendanceDraftMap = Record<string, { status: AttendanceRecord["status"]; note: string }>

export default function ProfessorAttendancePage() {
  const { toast } = useToast()
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse, workspace, createItem, updateItem, removeItem } =
    useProfessorCourseWorkspace()
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", sessionDate: "", notes: "" })
  const [drafts, setDrafts] = useState<AttendanceDraftMap>({})

  useEffect(() => {
    if (!selectedCourseId) {
      setEnrollments([])
      return
    }
    const controller = new AbortController()
    fetchEnrollments({ courseId: selectedCourseId, page: 1, pageSize: 500, signal: controller.signal })
      .then((payload) => setEnrollments(payload.items))
      .catch(() => undefined)
    return () => controller.abort()
  }, [selectedCourseId])

  useEffect(() => {
    setDrafts((prev) => {
      const next: AttendanceDraftMap = {}
      enrollments.forEach((enrollment) => {
        next[enrollment.studentId] = prev[enrollment.studentId] ?? { status: "present", note: "" }
      })
      return next
    })
  }, [enrollments])

  const resetForm = () => {
    setForm({ title: "", sessionDate: "", notes: "" })
    setEditingId(null)
    setDrafts((prev) => {
      const next: AttendanceDraftMap = {}
      enrollments.forEach((enrollment) => {
        next[enrollment.studentId] = prev[enrollment.studentId] ?? { status: "present", note: "" }
      })
      return next
    })
  }

  const handleSubmit = async () => {
    if (!selectedCourse) return
    setIsSaving(true)
    try {
      const payload = {
        title: form.title,
        sessionDate: form.sessionDate,
        notes: form.notes,
        records: enrollments.map((enrollment) => ({
          studentId: enrollment.studentId,
          studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          status: drafts[enrollment.studentId]?.status ?? "present",
          note: drafts[enrollment.studentId]?.note ?? "",
        })),
      }
      if (editingId) {
        await updateItem("attendanceSessions", editingId, payload)
      } else {
        await createItem("attendanceSessions", payload)
      }
      resetForm()
      toast({ title: editingId ? "Attendance updated" : "Attendance saved", description: "Session stored with real data." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save attendance")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      await removeItem("attendanceSessions", itemId)
      toast({ title: "Deleted", description: "Saved change to dashboard." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete item")
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Attendance" description="Take attendance and review saved sessions" />
      <ProfessorTabNav />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Select course</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessorCourseSelect courses={courses} selectedCourseId={selectedCourseId} onChange={setSelectedCourseId} isLoading={isLoadingCourses} />
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Manage attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Session title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            <Input type="datetime-local" value={form.sessionDate} onChange={(e) => setForm((prev) => ({ ...prev, sessionDate: e.target.value }))} />
          </div>
          <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
          <div className="space-y-3">
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roster yet for attendance.</p>
            ) : (
              enrollments.map((enrollment) => (
                <div key={enrollment.studentId} className="grid gap-3 rounded-xl border border-border bg-secondary/25 p-3 md:grid-cols-[1.2fr_0.7fr_1fr]">
                  <div>
                    <p className="font-medium">{enrollment.student.firstName} {enrollment.student.lastName}</p>
                    <p className="text-xs text-muted-foreground">{enrollment.student.email}</p>
                  </div>
                  <Select
                    value={drafts[enrollment.studentId]?.status ?? "present"}
                    onValueChange={(value) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [enrollment.studentId]: { status: value as AttendanceRecord["status"], note: prev[enrollment.studentId]?.note ?? "" },
                      }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="excused">Excused</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Note"
                    value={drafts[enrollment.studentId]?.note ?? ""}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [enrollment.studentId]: { status: prev[enrollment.studentId]?.status ?? "present", note: e.target.value },
                      }))
                    }
                  />
                </div>
              ))
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} disabled={isSaving || enrollments.length === 0}>
              {editingId ? "Update attendance" : "Save attendance"}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancel edit</Button>}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Saved attendance sessions</CardTitle>
          <Badge variant="outline">{workspace?.attendanceSessions.length ?? 0}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {(workspace?.attendanceSessions.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance sessions yet.</p>
          ) : (
            workspace?.attendanceSessions.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-secondary/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant="outline">{new Date(item.sessionDate).toLocaleDateString()}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.records.length} student records</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(item.id)
                      setForm({ title: item.title, sessionDate: item.sessionDate.slice(0, 16), notes: item.notes ?? "" })
                      const nextDrafts: AttendanceDraftMap = {}
                      item.records.forEach((record) => {
                        nextDrafts[record.studentId] = { status: record.status, note: record.note ?? "" }
                      })
                      setDrafts((prev) => ({ ...prev, ...nextDrafts }))
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"
import { useToast } from "@/hooks/use-toast"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import type { OfficeHour } from "@/lib/professor-workspace-api"

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

export default function ProfessorOfficeHoursPage() {
  const { toast } = useToast()
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse, workspace, createItem, updateItem, removeItem } =
    useProfessorCourseWorkspace()
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    startsAt: "",
    endsAt: "",
    location: "",
    meetingLink: "",
    notes: "",
    status: "scheduled" as OfficeHour["status"],
  })
  const [deleteState, setDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)

  const resetForm = () => {
    setForm({ title: "", startsAt: "", endsAt: "", location: "", meetingLink: "", notes: "", status: "scheduled" })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!selectedCourse) return
    setIsSaving(true)
    try {
      if (editingId) {
        await updateItem("officeHours", editingId, form)
      } else {
        await createItem("officeHours", form)
      }
      resetForm()
      toast({ title: editingId ? "Office hour updated" : "Office hour scheduled", description: "Saved successfully." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save office hour")
    } finally {
      setIsSaving(false)
    }
  }

  const requestDelete = (item: OfficeHour) => {
    const label = item.title || formatDate(item.startsAt)
    setDeleteState({ open: true, targetId: item.id, targetLabel: label, loading: false, error: null })
  }

  const confirmDelete = async () => {
    if (!deleteState.targetId) return
    setDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await removeItem("officeHours", deleteState.targetId)
      toast({ title: "Deleted", description: "Saved change to dashboard." })
      setDeleteState(emptyConfirmDeleteState)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete item"
      setError(message)
      setDeleteState((prev) => ({ ...prev, loading: false, error: message }))
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Office Hours" description="Schedule and manage office hours" />
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
          <CardTitle>Schedule office hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Session title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))} />
            <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))} />
          </div>
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
          <Input placeholder="Meeting link" value={form.meetingLink} onChange={(e) => setForm((prev) => ({ ...prev, meetingLink: e.target.value }))} />
          <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
          <div className="flex flex-wrap gap-2">
            <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as OfficeHour["status"] }))}>
              <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {editingId ? "Save office hour" : "Schedule office hour"}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancel edit</Button>}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Office hours</CardTitle>
          <Badge variant="outline">{workspace?.officeHours.length ?? 0}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {(workspace?.officeHours.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No office hours scheduled yet.</p>
          ) : (
            workspace?.officeHours.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-secondary/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant={item.status === "scheduled" ? "default" : "outline"}>{item.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDate(item.startsAt)} - {formatDate(item.endsAt)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.location || item.meetingLink || "No location/link"}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(item.id)
                      setForm({
                        title: item.title,
                        startsAt: item.startsAt.slice(0, 16),
                        endsAt: item.endsAt.slice(0, 16),
                        location: item.location ?? "",
                        meetingLink: item.meetingLink ?? "",
                        notes: item.notes ?? "",
                        status: item.status,
                      })
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => requestDelete(item)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteAlert
        state={deleteState}
        onOpenChange={(open) => {
          if (!open) setDeleteState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmDelete}
        title="Delete office hours slot"
        description={`Removing ${deleteState.targetLabel || "this office hours slot"} cannot be undone.`}
        confirmLabel="Delete office hours slot"
      />
    </div>
  )
}

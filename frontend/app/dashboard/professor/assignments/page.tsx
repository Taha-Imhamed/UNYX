"use client"

import { useState } from "react"
import { NotebookPen } from "lucide-react"
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
import type { ProfessorAssignment } from "@/lib/professor-workspace-api"

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

export default function ProfessorAssignmentsPage() {
  const { toast } = useToast()
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse, workspace, createItem, updateItem, removeItem } =
    useProfessorCourseWorkspace()
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxPoints: "",
    status: "draft" as ProfessorAssignment["status"],
  })
  const [deleteState, setDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)

  const resetForm = () => {
    setForm({ title: "", description: "", dueDate: "", maxPoints: "", status: "draft" })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!selectedCourse) return
    setIsSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        maxPoints: form.maxPoints,
        status: form.status,
      }
      if (editingId) {
        await updateItem("assignments", editingId, payload)
      } else {
        await createItem("assignments", payload)
      }
      resetForm()
      toast({ title: editingId ? "Assignment updated" : "Assignment created", description: "Saved successfully." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save assignment")
    } finally {
      setIsSaving(false)
    }
  }

  const requestDelete = (item: { id: string; title: string }) => {
    setDeleteState({ open: true, targetId: item.id, targetLabel: item.title, loading: false, error: null })
  }

  const confirmDelete = async () => {
    if (!deleteState.targetId) return
    setDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await removeItem("assignments", deleteState.targetId)
      toast({ title: "Deleted", description: "Saved change to dashboard." })
      setDeleteState(emptyConfirmDeleteState)
    } catch (err) {
      setDeleteState((prev) => ({ ...prev, loading: false, error: err instanceof Error ? err.message : "Unable to delete item" }))
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Assignments" description="Create and manage course assignments" />
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
          <CardTitle>Create assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Assignment title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          <Textarea placeholder="Assignment description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          <div className="grid gap-4 md:grid-cols-3">
            <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
            <Input placeholder="Max points" value={form.maxPoints} onChange={(e) => setForm((prev) => ({ ...prev, maxPoints: e.target.value }))} />
            <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as ProfessorAssignment["status"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} disabled={isSaving}>
              <NotebookPen className="mr-2 h-4 w-4" />
              {editingId ? "Save assignment" : "Create assignment"}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancel edit</Button>}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assignments</CardTitle>
          <Badge variant="outline">{workspace?.assignments.length ?? 0}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {(workspace?.assignments.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet.</p>
          ) : (
            workspace?.assignments.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-secondary/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant={item.status === "published" ? "default" : item.status === "closed" ? "secondary" : "outline"}>{item.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.description || "No description"}</p>
                <p className="mt-2 text-xs text-muted-foreground">Deadline {formatDate(item.dueDate)} • {item.maxPoints ?? 0} pts</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(item.id)
                      setForm({
                        title: item.title,
                        description: item.description ?? "",
                        dueDate: item.dueDate ? item.dueDate.slice(0, 16) : "",
                        maxPoints: item.maxPoints ? String(item.maxPoints) : "",
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
        title="Delete assignment"
        description={`Removing ${deleteState.targetLabel || "this assignment"} cannot be undone.`}
        confirmLabel="Delete assignment"
      />
    </div>
  )
}

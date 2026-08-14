"use client"

import { useState } from "react"
import { Megaphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"
import { useToast } from "@/hooks/use-toast"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

export default function ProfessorAnnouncementsPage() {
  const { toast } = useToast()
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse, workspace, createItem, updateItem, removeItem } =
    useProfessorCourseWorkspace()
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", body: "", pinned: false })
  const [deleteState, setDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)

  const resetForm = () => {
    setForm({ title: "", body: "", pinned: false })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!selectedCourse) return
    setIsSaving(true)
    try {
      if (editingId) {
        await updateItem("announcements", editingId, form)
      } else {
        await createItem("announcements", form)
      }
      resetForm()
      toast({ title: editingId ? "Announcement updated" : "Announcement posted", description: "Students were notified." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save announcement")
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
      await removeItem("announcements", deleteState.targetId)
      toast({ title: "Deleted", description: "Saved change to dashboard." })
      setDeleteState(emptyConfirmDeleteState)
    } catch (err) {
      setDeleteState((prev) => ({ ...prev, loading: false, error: err instanceof Error ? err.message : "Unable to delete item" }))
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Announcements" description="Post announcements to your courses" />
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
          <CardTitle>Post announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Announcement title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          <Textarea placeholder="Announcement body" value={form.body} onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))} />
          <div className="flex items-center gap-2">
            <input
              id="announcement-pinned"
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm((prev) => ({ ...prev, pinned: e.target.checked }))}
            />
            <Label htmlFor="announcement-pinned">Pin announcement</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} disabled={isSaving}>
              <Megaphone className="mr-2 h-4 w-4" />
              {editingId ? "Save announcement" : "Post announcement"}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancel edit</Button>}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Announcements</CardTitle>
          <Badge variant="outline">{workspace?.announcements.length ?? 0}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {(workspace?.announcements.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            workspace?.announcements.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-secondary/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant={item.pinned ? "default" : "outline"}>{item.pinned ? "Pinned" : "Normal"}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">Posted {formatDate(item.publishedAt)}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(item.id)
                      setForm({ title: item.title, body: item.body, pinned: item.pinned })
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
        title="Delete announcement"
        description={`Removing ${deleteState.targetLabel || "this announcement"} cannot be undone.`}
        confirmLabel="Delete announcement"
      />
    </div>
  )
}

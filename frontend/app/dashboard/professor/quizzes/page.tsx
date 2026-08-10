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
import { useToast } from "@/hooks/use-toast"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import type { ProfessorQuiz } from "@/lib/professor-workspace-api"

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

export default function ProfessorQuizzesPage() {
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
    totalPoints: "",
    questionCount: "",
    durationMinutes: "",
    status: "draft" as ProfessorQuiz["status"],
  })

  const resetForm = () => {
    setForm({ title: "", description: "", dueDate: "", totalPoints: "", questionCount: "", durationMinutes: "", status: "draft" })
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
        totalPoints: form.totalPoints,
        questionCount: form.questionCount,
        durationMinutes: form.durationMinutes,
        status: form.status,
      }
      if (editingId) {
        await updateItem("quizzes", editingId, payload)
      } else {
        await createItem("quizzes", payload)
      }
      resetForm()
      toast({ title: editingId ? "Quiz updated" : "Quiz created", description: "Saved successfully." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save quiz")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      await removeItem("quizzes", itemId)
      toast({ title: "Deleted", description: "Saved change to dashboard." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete item")
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Quizzes" description="Create and manage course quizzes" />
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
          <CardTitle>Create quizzes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Quiz title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          <Textarea placeholder="Quiz description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          <div className="grid gap-4 md:grid-cols-4">
            <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
            <Input placeholder="Total points" value={form.totalPoints} onChange={(e) => setForm((prev) => ({ ...prev, totalPoints: e.target.value }))} />
            <Input placeholder="Questions" value={form.questionCount} onChange={(e) => setForm((prev) => ({ ...prev, questionCount: e.target.value }))} />
            <Input placeholder="Minutes" value={form.durationMinutes} onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: e.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as ProfessorQuiz["status"] }))}>
              <SelectTrigger className="w-full md:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {editingId ? "Save quiz" : "Create quiz"}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancel edit</Button>}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quizzes</CardTitle>
          <Badge variant="outline">{workspace?.quizzes.length ?? 0}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {(workspace?.quizzes.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No quizzes yet.</p>
          ) : (
            workspace?.quizzes.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-secondary/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant={item.status === "published" ? "default" : item.status === "closed" ? "secondary" : "outline"}>{item.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.description || "No description"}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Deadline {formatDate(item.dueDate)} • {item.questionCount ?? 0} questions • {item.totalPoints ?? 0} pts
                </p>
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
                        totalPoints: item.totalPoints ? String(item.totalPoints) : "",
                        questionCount: item.questionCount ? String(item.questionCount) : "",
                        durationMinutes: item.durationMinutes ? String(item.durationMinutes) : "",
                        status: item.status,
                      })
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

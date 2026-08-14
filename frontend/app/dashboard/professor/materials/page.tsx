"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"
import { useToast } from "@/hooks/use-toast"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import type { ProfessorMaterial } from "@/lib/professor-workspace-api"

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

function materialCategoryTone(category: string) {
  switch (category) {
    case "syllabus":
      return "default" as const
    case "slides":
      return "secondary" as const
    case "pdf":
      return "outline" as const
    default:
      return "outline" as const
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

export default function ProfessorMaterialsPage() {
  const { toast } = useToast()
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse, workspace, isLoadingWorkspace, createItem, updateItem, removeItem } =
    useProfessorCourseWorkspace()
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [materialFile, setMaterialFile] = useState<File | null>(null)
  const [materialInputKey, setMaterialInputKey] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteState, setDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)
  const [form, setForm] = useState({ title: "", category: "syllabus" as ProfessorMaterial["category"], description: "" })

  const resetForm = () => {
    setForm({ title: "", category: "syllabus", description: "" })
    setMaterialFile(null)
    setEditingId(null)
    setMaterialInputKey((value) => value + 1)
  }

  const handleSubmit = async () => {
    if (!selectedCourse) return
    setIsSaving(true)
    try {
      const existing = workspace?.materials.find((item) => item.id === editingId) ?? null
      let fileUrl: string | undefined
      let fileName: string | undefined
      let mimeType: string | undefined
      let size: number | undefined

      if (materialFile) {
        fileUrl = await readFileAsDataUrl(materialFile)
        fileName = materialFile.name
        mimeType = materialFile.type
        size = materialFile.size
      }

      const payload = {
        title: form.title || materialFile?.name || "Untitled file",
        category: form.category,
        description: form.description,
        fileUrl: fileUrl ?? existing?.fileUrl ?? undefined,
        fileName: fileName ?? existing?.fileName ?? undefined,
        mimeType: mimeType ?? existing?.mimeType ?? undefined,
        size: size ?? existing?.size ?? undefined,
      }

      if (editingId) {
        await updateItem("materials", editingId, payload)
      } else {
        await createItem("materials", payload)
      }
      resetForm()
      toast({ title: editingId ? "Material updated" : "Material uploaded", description: "Saved to professor dashboard." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save material")
    } finally {
      setIsSaving(false)
    }
  }

  const requestDelete = (item: ProfessorMaterial) => {
    setDeleteState({ open: true, targetId: item.id, targetLabel: item.title || item.fileName || "", loading: false, error: null })
  }

  const confirmDelete = async () => {
    if (!deleteState.targetId) return
    setDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await removeItem("materials", deleteState.targetId)
      toast({ title: "Deleted", description: "Saved change to dashboard." })
      setDeleteState(emptyConfirmDeleteState)
    } catch (err) {
      setDeleteState((prev) => ({ ...prev, loading: false, error: err instanceof Error ? err.message : "Unable to delete item" }))
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Materials" description="Upload and manage course materials" />
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border bg-card/92">
          <CardHeader>
            <CardTitle>Upload syllabus, slides, PDFs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.category} onValueChange={(value) => setForm((prev) => ({ ...prev, category: value as ProfessorMaterial["category"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="syllabus">Syllabus</SelectItem>
                    <SelectItem value="slides">Lecture slides</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input key={materialInputKey} type="file" onChange={(e) => setMaterialFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSubmit} disabled={isSaving || !selectedCourse}>
                <Upload className="mr-2 h-4 w-4" />
                {editingId ? "Save changes" : "Upload"}
              </Button>
              {editingId && <Button variant="outline" onClick={resetForm}>Cancel edit</Button>}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/92">
          <CardHeader>
            <CardTitle>Saved files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingWorkspace ? (
              <p className="text-sm text-muted-foreground">Loading saved files...</p>
            ) : (workspace?.materials.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
            ) : (
              workspace?.materials.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-secondary/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.fileName || "No file name"} • {item.category}</p>
                    </div>
                    <Badge variant={materialCategoryTone(item.category)}>{item.category}</Badge>
                  </div>
                  {item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">Saved {formatDate(item.updatedAt)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.fileUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={item.fileUrl} download={item.fileName || item.title}>Open file</a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(item.id)
                        setForm({ title: item.title, category: item.category, description: item.description ?? "" })
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
      </div>

      <ConfirmDeleteAlert
        state={deleteState}
        onOpenChange={(open) => {
          if (!open) setDeleteState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmDelete}
        title="Delete material"
        description={`Removing ${deleteState.targetLabel || "this material"} cannot be undone.`}
        confirmLabel="Delete material"
      />
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"

export interface ResourceField {
  key: string
  label: string
  type: "text" | "textarea" | "number" | "datetime-local" | "select" | "string-array"
  options?: { value: string; label: string }[]
  required?: boolean
  placeholder?: string
}

interface ResourceRecord {
  id: string
  [key: string]: unknown
}

interface ResourceApi<T> {
  list: (signal?: AbortSignal) => Promise<T[]>
  create: (payload: Record<string, unknown>) => Promise<T>
  update: (id: string, payload: Record<string, unknown>) => Promise<T>
  remove: (id: string) => Promise<void>
}

interface ResourceManagerProps<T extends ResourceRecord> {
  title: string
  description: string
  api: ResourceApi<T>
  fields: ResourceField[]
  titleKey: string
  statusKey?: string
  metaKeys: string[]
  emptyLabel: string
}

function buildEmptyForm(fields: ResourceField[]) {
  const form: Record<string, string> = {}
  fields.forEach((field) => {
    form[field.key] = field.type === "select" ? field.options?.[0]?.value ?? "" : ""
  })
  return form
}

function formatFieldValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—"
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString()
  }
  return String(value)
}

function toFormValue(value: unknown, type: ResourceField["type"]) {
  if (value === null || value === undefined) return ""
  if (type === "string-array" && Array.isArray(value)) return value.join(", ")
  if (type === "datetime-local" && typeof value === "string") return value.slice(0, 16)
  return String(value)
}

function toPayloadValue(raw: string, type: ResourceField["type"]) {
  switch (type) {
    case "number":
      return raw === "" ? undefined : Number(raw)
    case "string-array":
      return raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    default:
      return raw
  }
}

export function ResourceManager<T extends ResourceRecord>({
  title,
  description,
  api,
  fields,
  titleKey,
  statusKey,
  metaKeys,
  emptyLabel,
}: ResourceManagerProps<T>) {
  const { toast } = useToast()
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>(() => buildEmptyForm(fields))
  const [deleteState, setDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    api
      .list(controller.signal)
      .then((data) => setItems(data))
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : `Unable to load ${title.toLowerCase()}`)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetForm = () => {
    setForm(buildEmptyForm(fields))
    setEditingId(null)
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      fields.forEach((field) => {
        payload[field.key] = toPayloadValue(form[field.key] ?? "", field.type)
      })
      if (editingId) {
        const updated = await api.update(editingId, payload)
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        toast({ title: "Saved", description: `${title} record updated.` })
      } else {
        const created = await api.create(payload)
        setItems((prev) => [created, ...prev])
        toast({ title: "Created", description: `${title} record added.` })
      }
      resetForm()
    } catch (err) {
      toast({ variant: "destructive", title: "Save failed", description: err instanceof Error ? err.message : "Unknown error" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (item: T) => {
    const next: Record<string, string> = {}
    fields.forEach((field) => {
      next[field.key] = toFormValue(item[field.key], field.type)
    })
    setForm(next)
    setEditingId(item.id)
  }

  const requestDelete = (item: T) => {
    setDeleteState({
      open: true,
      targetId: item.id,
      targetLabel: formatFieldValue(item[titleKey]),
      loading: false,
      error: null,
    })
  }

  const confirmDelete = async () => {
    if (!deleteState.targetId) return
    setDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await api.remove(deleteState.targetId)
      setItems((prev) => prev.filter((item) => item.id !== deleteState.targetId))
      toast({ title: "Deleted" })
      setDeleteState(emptyConfirmDeleteState)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      toast({ variant: "destructive", title: "Delete failed", description: message })
      setDeleteState((prev) => ({ ...prev, loading: false, error: message }))
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>{editingId ? `Edit ${title.toLowerCase()}` : `New ${title.toLowerCase()}`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`${title}-${field.key}`}>{field.label}{field.required ? " *" : ""}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={`${title}-${field.key}`}
                  value={form[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              ) : field.type === "select" ? (
                <Select value={form[field.key] ?? ""} onValueChange={(value) => setForm((prev) => ({ ...prev, [field.key]: value }))}>
                  <SelectTrigger id={`${title}-${field.key}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`${title}-${field.key}`}
                  type={field.type === "number" ? "number" : field.type === "datetime-local" ? "datetime-local" : "text"}
                  value={form[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Save changes" : "Create"}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancel edit</Button>}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline">{items.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-secondary/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{formatFieldValue(item[titleKey])}</p>
                  {statusKey && <Badge variant="outline">{formatFieldValue(item[statusKey])}</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {metaKeys.map((key) => formatFieldValue(item[key])).join(" • ")}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => requestDelete(item)}>Delete</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteAlert
        state={deleteState}
        onOpenChange={(open) => { if (!open) setDeleteState(emptyConfirmDeleteState) }}
        onConfirm={confirmDelete}
        title={`Delete ${title.toLowerCase()}`}
        description={`Removing ${deleteState.targetLabel || "this item"} cannot be undone.`}
        confirmLabel={`Delete ${title.toLowerCase()}`}
      />
    </div>
  )
}

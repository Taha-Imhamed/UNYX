"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { CalendarRange, Plus, Trash2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import { pillButtonStyles } from "@/components/enrollment/shared"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { createSemester, deleteSemester, fetchSemesters, updateSemester } from "@/lib/enrollment-api"
import type { Semester, SemesterStatus } from "@shared/types"

const statusVariant: Record<SemesterStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  upcoming: "secondary",
  closed: "outline",
}

const emptyForm = { label: "", academicYear: "", startDate: "", endDate: "" }

export default function EnrollmentSemestersPage() {
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const canManageEnrollment = hasPermission("enrollment:manage") && user?.role !== "professor"
  const canViewEnrollment = canManageEnrollment || hasPermission("enrollment:view") || user?.role === "professor"

  const [semesters, setSemesters] = useState<Semester[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteState, setDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)

  const load = () => {
    setIsLoading(true)
    fetchSemesters()
      .then(setSemesters)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load semesters"))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    if (!authLoading && canViewEnrollment) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canViewEnrollment])

  const handleCreate = async () => {
    if (!form.label.trim() || !form.academicYear.trim() || !form.startDate || !form.endDate) {
      toast({ variant: "destructive", title: "Missing fields", description: "Label, academic year, start date, and end date are required." })
      return
    }
    setIsSubmitting(true)
    try {
      await createSemester({
        label: form.label.trim(),
        academicYear: form.academicYear.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
      })
      toast({ title: "Semester created" })
      setForm(emptyForm)
      load()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to create semester", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (semester: Semester, status: SemesterStatus) => {
    try {
      await updateSemester(semester.id, { status })
      load()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to update semester", description: err instanceof Error ? err.message : "Please try again." })
    }
  }

  const requestDelete = (semester: Semester) => {
    setDeleteState({ open: true, targetId: semester.id, targetLabel: semester.label, loading: false, error: null })
  }

  const confirmDelete = async () => {
    if (!deleteState.targetId) return
    setDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await deleteSemester(deleteState.targetId)
      setDeleteState(emptyConfirmDeleteState)
      load()
    } catch (err) {
      setDeleteState((prev) => ({ ...prev, loading: false, error: err instanceof Error ? err.message : "Unable to delete semester" }))
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!canViewEnrollment) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>You need enrollment view or manage permissions to access this area.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Semesters" description="Manage academic terms that courses and enrollments are linked to" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav onRefresh={load} isRefreshing={isLoading} />

          {canManageEnrollment && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-sky-700" />
                  Add semester
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="label">Label</Label>
                    <Input id="label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Fall 2026" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="academicYear">Academic year</Label>
                    <Input id="academicYear" value={form.academicYear} onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))} placeholder="2026-2027" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">Start date</Label>
                    <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate">End date</Label>
                    <Input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                  </div>
                  <div className="flex items-end">
                    <Button className={`w-full gap-2 ${pillButtonStyles.primary}`} onClick={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarRange className="h-5 w-5 text-sky-700" />
                Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {error && <p className="text-sm text-destructive">{error}</p>}
              {isLoading && semesters.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" /> Loading
                </div>
              )}
              {!isLoading && semesters.length === 0 && <p className="text-sm text-muted-foreground">No semesters yet.</p>}
              {semesters.map((semester) => (
                <div key={semester.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{semester.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {semester.academicYear} • {new Date(semester.startDate).toLocaleDateString()} – {new Date(semester.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageEnrollment ? (
                      <select
                        className="flex h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm"
                        value={semester.status}
                        onChange={(e) => handleStatusChange(semester, e.target.value as SemesterStatus)}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                      </select>
                    ) : (
                      <Badge variant={statusVariant[semester.status]}>{semester.status}</Badge>
                    )}
                    {canManageEnrollment && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`gap-1.5 ${pillButtonStyles.dangerOutline}`}
                        onClick={() => requestDelete(semester)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDeleteAlert
        state={deleteState}
        onOpenChange={(open) => {
          if (!open) setDeleteState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmDelete}
        title="Delete semester"
        description={`Removing ${deleteState.targetLabel || "this semester"} cannot be undone.`}
        confirmLabel="Delete semester"
      />
    </div>
  )
}

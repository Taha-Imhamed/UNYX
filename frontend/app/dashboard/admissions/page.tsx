"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Trash2, UserRound } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  createInterviewSchedule,
  deleteInterviewSchedule,
  fetchInterviewSchedules,
  updateInterviewSchedule,
} from "@/lib/admissions-api"
import type { InterviewSchedule } from "@shared/types"

const statusOptions: InterviewSchedule["status"][] = ["scheduled", "completed", "rescheduled", "cancelled"]

const statusVariant: Record<InterviewSchedule["status"], "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "default",
  completed: "secondary",
  rescheduled: "outline",
  cancelled: "destructive",
}

function canAccessAdmissions(role?: string) {
  return role === "admin" || role === "super-admin" || role === "supervisor" || role === "admissions" || role === "student-affairs" || role === "it-admin"
}

export default function AdmissionsDashboardPage() {
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const canView = canAccessAdmissions(user?.role)

  const [items, setItems] = useState<InterviewSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState<Record<string, boolean>>({})
  const [deleteState, setDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)

  const [applicantName, setApplicantName] = useState("")
  const [program, setProgram] = useState("")
  const [interviewer, setInterviewer] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = async () => {
    setLoadError(null)
    try {
      const data = await fetchInterviewSchedules()
      setItems(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load interview schedules")
    }
  }

  useEffect(() => {
    if (authLoading || !canView) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    load().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canView])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting || !applicantName.trim() || !program.trim() || !interviewer.trim()) return
    setIsSubmitting(true)
    try {
      await createInterviewSchedule({
        applicantName: applicantName.trim(),
        program: program.trim(),
        interviewer: interviewer.trim(),
        scheduledAt: scheduledAt || undefined,
      })
      toast({ title: "Interview scheduled" })
      setApplicantName("")
      setProgram("")
      setInterviewer("")
      setScheduledAt("")
      await load()
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to schedule", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (item: InterviewSchedule, status: InterviewSchedule["status"]) => {
    setActionPending((prev) => ({ ...prev, [item.id]: true }))
    try {
      await updateInterviewSchedule(item.id, { status })
      toast({ title: "Status updated" })
      await load()
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to update", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setActionPending((prev) => ({ ...prev, [item.id]: false }))
    }
  }

  const requestDelete = (item: InterviewSchedule) => {
    setDeleteState({ open: true, targetId: item.id, targetLabel: item.applicantName, loading: false, error: null })
  }

  const confirmDelete = async () => {
    if (!deleteState.targetId) return
    const id = deleteState.targetId
    setDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    setActionPending((prev) => ({ ...prev, [id]: true }))
    try {
      await deleteInterviewSchedule(id)
      toast({ title: "Interview removed" })
      setDeleteState(emptyConfirmDeleteState)
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again."
      toast({ variant: "destructive", title: "Unable to remove", description: message })
      setDeleteState((prev) => ({ ...prev, loading: false, error: message }))
    } finally {
      setActionPending((prev) => ({ ...prev, [id]: false }))
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>You need admissions access to view this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Admissions" description="Schedule and track applicant interviews" />
      <div className="flex-1 space-y-4 p-6 pt-4 md:pt-6">
        {loadError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load interview schedules</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Schedule an interview</CardTitle>
            <CardDescription>Add a new applicant interview slot.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="applicantName">Applicant name</Label>
                <Input id="applicantName" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Input id="program" value={program} onChange={(e) => setProgram(e.target.value)} placeholder="Computer Science" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interviewer">Interviewer</Label>
                <Input id="interviewer" value={interviewer} onChange={(e) => setInterviewer(e.target.value)} placeholder="Dr. Hassan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Date &amp; time</Label>
                <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner className="h-4 w-4" /> : "Schedule interview"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading interviews…
          </div>
        ) : items.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">No interviews scheduled yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="border-border bg-card">
                <CardHeader className="flex flex-col gap-2 pb-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserRound className="h-4 w-4 text-primary" />
                      {item.applicantName}
                      <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {item.program} · with {item.interviewer} · {new Date(item.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {statusOptions
                      .filter((option) => option !== item.status)
                      .map((option) => (
                        <Button
                          key={option}
                          size="sm"
                          variant="outline"
                          disabled={actionPending[item.id]}
                          onClick={() => handleStatusChange(item, option)}
                        >
                          Mark {option}
                        </Button>
                      ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={actionPending[item.id]}
                      onClick={() => requestDelete(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                {item.notes && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-foreground">{item.notes}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteAlert
        state={deleteState}
        onOpenChange={(open) => {
          if (!open) setDeleteState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmDelete}
        title="Delete interview schedule"
        description={`Removing ${deleteState.targetLabel || "this interview schedule"} cannot be undone.`}
        confirmLabel="Delete interview schedule"
      />
    </div>
  )
}

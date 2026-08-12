"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { cancelAppointment, fetchMyAppointments, requestAppointment } from "@/lib/advising-api"
import { fetchProfessors } from "@/lib/enrollment-api"
import type { AdvisingAppointment, Professor } from "@shared/types"
import { StudentFeatureGate } from "@/components/student-feature-gate"

const statusVariant: Record<AdvisingAppointment["status"], "default" | "secondary" | "outline" | "destructive"> = {
  requested: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
}

export default function AdvisingPage() {
  return (
    <StudentFeatureGate featureKey="advisor-contact">
      <AdvisingPageInner />
    </StudentFeatureGate>
  )
}

function AdvisingPageInner() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<AdvisingAppointment[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [advisorId, setAdvisorId] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const load = useCallback(() => {
    const controller = new AbortController()
    setIsLoading(true)
    Promise.all([fetchMyAppointments(controller.signal), fetchProfessors(controller.signal)])
      .then(([appointmentData, professorData]) => {
        setAppointments(appointmentData)
        setProfessors(professorData)
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load advising data")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => load(), [load])

  const selectedProfessor = useMemo(() => professors.find((p) => p.id === advisorId), [professors, advisorId])

  const handleSubmit = async () => {
    if (!advisorId || !scheduledAt || !selectedProfessor) return
    setIsSubmitting(true)
    try {
      await requestAppointment({
        advisorId,
        advisorName: `${selectedProfessor.firstName} ${selectedProfessor.lastName}`,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes: notes.trim() || null,
      })
      toast({ title: "Appointment requested", description: "Your advisor will confirm the time." })
      setAdvisorId("")
      setScheduledAt("")
      setNotes("")
      load()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to request appointment", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      await cancelAppointment(id)
      toast({ title: "Appointment cancelled" })
      load()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to cancel", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Academic Advising</p>
        <h1 className="text-2xl font-bold text-foreground">Book time with your advisor</h1>
        <p className="text-sm text-muted-foreground">Request an appointment and track its status.</p>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Request an appointment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="advisor">Advisor</Label>
              <select
                id="advisor"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={advisorId}
                onChange={(e) => setAdvisorId(e.target.value)}
              >
                <option value="">Select advisor</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Preferred time</Label>
              <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What do you want to discuss?" />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting || !advisorId || !scheduledAt}>
            {isSubmitting ? <Spinner className="h-4 w-4" /> : "Request appointment"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Your appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Loading
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!isLoading && appointments.length === 0 && <p className="text-sm text-muted-foreground">No appointments yet.</p>}
          {appointments.map((appt) => (
            <div key={appt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{appt.advisorName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(appt.scheduledAt).toLocaleString()} • {appt.durationMinutes} min
                </p>
                {appt.notes && <p className="text-xs text-muted-foreground">{appt.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[appt.status]}>{appt.status}</Badge>
                {(appt.status === "requested" || appt.status === "confirmed") && (
                  <Button size="sm" variant="ghost" disabled={cancellingId === appt.id} onClick={() => handleCancel(appt.id)}>
                    {cancellingId === appt.id ? <Spinner className="h-4 w-4" /> : "Cancel"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

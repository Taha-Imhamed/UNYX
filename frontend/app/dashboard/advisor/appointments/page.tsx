"use client"

import { useEffect, useState } from "react"
import { DashboardRouteGuard } from "@/components/dashboard-route-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { fetchAdvisorAppointments, updateAppointmentStatus } from "@/lib/advising-api"
import type { AdvisingAppointment } from "@shared/types"

const statusVariant: Record<AdvisingAppointment["status"], "default" | "secondary" | "outline" | "destructive"> = {
  requested: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
}

export default function AdvisorAppointmentsPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<AdvisingAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    const controller = new AbortController()
    setIsLoading(true)
    fetchAdvisorAppointments(controller.signal)
      .then(setItems)
      .catch(() => {
        if (!controller.signal.aborted) setItems([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }

  useEffect(() => load(), [])

  const handleStatus = async (id: string, status: AdvisingAppointment["status"]) => {
    setBusyId(id)
    try {
      await updateAppointmentStatus(id, status)
      toast({ title: "Appointment updated" })
      load()
    } catch (err) {
      toast({ variant: "destructive", title: "Update failed", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardRouteGuard allowedRoles={["advisor", "admin", "super-admin", "supervisor", "student-affairs"]} redirectTo="/dashboard">
      <div className="flex h-full flex-col">
        <DashboardHeader title="Advising Appointments" description="Confirm, complete, or cancel student appointment requests" />
        <div className="flex-1 space-y-4 p-6 pt-4 md:pt-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Loading
            </div>
          )}
          {!isLoading && items.length === 0 && <p className="text-sm text-muted-foreground">No appointments yet.</p>}
          {items.map((appt) => {
            const busy = busyId === appt.id
            return (
              <Card key={appt.id} className="border border-border bg-card">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{appt.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(appt.scheduledAt).toLocaleString()} • {appt.durationMinutes} min
                    </p>
                    {appt.notes && <p className="text-xs text-muted-foreground">{appt.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[appt.status]}>{appt.status}</Badge>
                    {appt.status === "requested" && (
                      <Button size="sm" disabled={busy} onClick={() => handleStatus(appt.id, "confirmed")}>
                        {busy ? <Spinner className="h-4 w-4" /> : "Confirm"}
                      </Button>
                    )}
                    {appt.status === "confirmed" && (
                      <Button size="sm" disabled={busy} onClick={() => handleStatus(appt.id, "completed")}>
                        {busy ? <Spinner className="h-4 w-4" /> : "Mark completed"}
                      </Button>
                    )}
                    {(appt.status === "requested" || appt.status === "confirmed") && (
                      <Button size="sm" variant="destructive" disabled={busy} onClick={() => handleStatus(appt.id, "cancelled")}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardRouteGuard>
  )
}

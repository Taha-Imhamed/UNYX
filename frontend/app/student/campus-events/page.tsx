"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { cancelEventRsvp, fetchCampusEvents, fetchEventRsvpStatus, rsvpToEvent } from "@/lib/campus-api"
import type { CampusEvent } from "@shared/types"
import { StudentFeatureGate } from "@/components/student-feature-gate"

const categoryLabel: Record<string, string> = {
  academic: "Academic",
  social: "Social",
  sports: "Sports",
  career: "Career",
  other: "Other",
}

export default function CampusEventsPage() {
  return (
    <StudentFeatureGate featureKey="campus-events">
      <CampusEventsPageInner />
    </StudentFeatureGate>
  )
}

function CampusEventsPageInner() {
  const { toast } = useToast()
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [rsvpStatus, setRsvpStatus] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const load = useCallback(() => {
    const controller = new AbortController()
    setIsLoading(true)
    fetchCampusEvents(controller.signal)
      .then(async (items) => {
        setEvents(items)
        const statuses = await Promise.all(
          items.map((event) =>
            fetchEventRsvpStatus(event.id, controller.signal)
              .then((res) => [event.id, res.rsvped] as const)
              .catch(() => [event.id, false] as const),
          ),
        )
        setRsvpStatus(Object.fromEntries(statuses))
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load events")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => load(), [load])

  const handleToggleRsvp = async (event: CampusEvent) => {
    setPendingId(event.id)
    try {
      if (rsvpStatus[event.id]) {
        await cancelEventRsvp(event.id)
        toast({ title: "RSVP cancelled" })
      } else {
        await rsvpToEvent(event.id)
        toast({ title: "You're on the list", description: `RSVP confirmed for ${event.title}.` })
      }
      load()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to update RSVP", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Campus Events</p>
        <h1 className="text-2xl font-bold text-foreground">What's happening on campus</h1>
        <p className="text-sm text-muted-foreground">Browse upcoming events and RSVP to save your spot.</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Loading
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!isLoading && !error && events.length === 0 && (
        <p className="text-sm text-muted-foreground">No events scheduled right now. Check back soon.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => {
          const full = typeof event.capacity === "number" && event.rsvpCount >= event.capacity
          const going = Boolean(rsvpStatus[event.id])
          return (
            <Card key={event.id} className="border border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{event.title}</CardTitle>
                  <Badge variant="outline">{categoryLabel[event.category] ?? event.category}</Badge>
                </div>
                <CardDescription>
                  {new Date(event.startAt).toLocaleString()} • {event.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {event.rsvpCount} going{typeof event.capacity === "number" ? ` / ${event.capacity} spots` : ""}
                  </p>
                  <Button
                    size="sm"
                    variant={going ? "outline" : "default"}
                    disabled={pendingId === event.id || (!going && full)}
                    onClick={() => handleToggleRsvp(event)}
                  >
                    {pendingId === event.id ? <Spinner className="h-4 w-4" /> : going ? "Cancel RSVP" : full ? "Full" : "RSVP"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

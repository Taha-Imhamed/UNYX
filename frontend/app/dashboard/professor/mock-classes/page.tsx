"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, CalendarPlus2, CheckCircle2, TriangleAlert } from "lucide-react"
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
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import {
  checkMockClassAvailability,
  createMockClassBooking,
  fetchMockClassPlanner,
  type MockClassAvailabilityResult,
  type MockClassPlanner,
} from "@/lib/professor-workspace-api"

function formatShortDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export default function ProfessorMockClassesPage() {
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse } = useProfessorCourseWorkspace()
  const [error, setError] = useState<string | null>(null)
  const [planner, setPlanner] = useState<MockClassPlanner | null>(null)
  const [isLoadingPlanner, setIsLoadingPlanner] = useState(false)
  const [availability, setAvailability] = useState<MockClassAvailabilityResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ roomName: "", startAt: "", endAt: "", purpose: "", notes: "" })

  useEffect(() => {
    if (!selectedCourseId) {
      setPlanner(null)
      return
    }
    const controller = new AbortController()
    setIsLoadingPlanner(true)
    fetchMockClassPlanner(selectedCourseId, controller.signal)
      .then((data) => {
        setPlanner(data)
        setForm((prev) => ({ ...prev, roomName: prev.roomName || data.rooms[0] || "" }))
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load mock-up class planner")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingPlanner(false)
      })
    return () => controller.abort()
  }, [selectedCourseId])

  useEffect(() => {
    if (!selectedCourse) return
    setForm((prev) => ({ ...prev, purpose: prev.purpose || `Mock-up class for ${selectedCourse.code} ${selectedCourse.title}` }))
  }, [selectedCourse])

  useEffect(() => {
    setAvailability(null)
  }, [form.roomName, form.startAt, form.endAt])

  const upcomingBookings = useMemo(
    () =>
      (planner?.bookings ?? [])
        .filter((booking) => new Date(booking.endAt).getTime() >= Date.now())
        .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
        .slice(0, 8),
    [planner],
  )

  const handleCheckAvailability = async () => {
    if (!selectedCourse) return
    if (!form.roomName || !form.startAt || !form.endAt) {
      setError("Select a room, start time, and end time for the mock-up class.")
      return
    }
    setIsChecking(true)
    try {
      const result = await checkMockClassAvailability(selectedCourse.id, {
        roomName: form.roomName,
        startAt: form.startAt,
        endAt: form.endAt,
      })
      setAvailability(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check room availability")
    } finally {
      setIsChecking(false)
    }
  }

  const handleCreateBooking = async () => {
    if (!selectedCourse) return
    setIsSaving(true)
    try {
      const result = await createMockClassBooking(selectedCourse.id, {
        roomName: form.roomName,
        startAt: form.startAt,
        endAt: form.endAt,
        purpose: form.purpose,
        notes: form.notes || null,
      })
      setPlanner(result.planner)
      setAvailability({ available: true, conflicts: [] })
      setForm((prev) => ({
        roomName: result.planner.rooms.includes(prev.roomName) ? prev.roomName : result.planner.rooms[0] || "",
        startAt: "",
        endAt: "",
        purpose: selectedCourse ? `Mock-up class for ${selectedCourse.code} ${selectedCourse.title}` : "",
        notes: "",
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create mock-up class booking")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Mock-up Classes" description="Book extra sessions and check room availability" />
      <ProfessorTabNav />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Select course</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessorCourseSelect
            courses={courses}
            selectedCourseId={selectedCourseId}
            onChange={setSelectedCourseId}
            isLoading={isLoadingCourses}
          />
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Mock-up class planner</CardTitle>
            <p className="text-sm text-muted-foreground">Pick a room and time, then verify if another course or professor already took it.</p>
          </div>
          <Badge variant="outline">{upcomingBookings.length} upcoming bookings</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select value={form.roomName} onValueChange={(value) => setForm((prev) => ({ ...prev, roomName: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                    <SelectContent>
                      {(planner?.rooms ?? []).map((room) => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Input value={form.purpose} onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm((prev) => ({ ...prev, startAt: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm((prev) => ({ ...prev, endAt: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Optional note for this extra class" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleCheckAvailability} disabled={isChecking || !selectedCourse || isLoadingPlanner}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {isChecking ? "Checking..." : "Check availability"}
                </Button>
                <Button onClick={handleCreateBooking} disabled={isSaving || !selectedCourse || availability?.available !== true}>
                  <CalendarPlus2 className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Book mock-up class"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {availability ? (
                <div className={`rounded-xl border p-4 ${availability.available ? "border-emerald-200 bg-emerald-50/80" : "border-amber-200 bg-amber-50/80"}`}>
                  <div className="flex items-center gap-2">
                    {availability.available ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <TriangleAlert className="h-4 w-4 text-amber-700" />}
                    <p className="font-medium text-foreground">
                      {availability.available ? "This slot is available." : "This slot conflicts with existing teaching or bookings."}
                    </p>
                  </div>
                  {availability.conflicts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {availability.conflicts.map((conflict, index) => (
                        <div key={`${conflict.type}-${index}`} className="rounded-lg border border-white/70 bg-white/70 p-3 text-sm text-slate-700">
                          {conflict.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                  Check availability first to confirm the room is free across all professors and scheduled classes.
                </div>
              )}

              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-sm font-medium text-foreground">Upcoming mock-up class bookings</p>
                <div className="mt-3 space-y-3">
                  {isLoadingPlanner ? (
                    <p className="text-sm text-muted-foreground">Loading planner...</p>
                  ) : upcomingBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No mock-up classes booked yet.</p>
                  ) : (
                    upcomingBookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg border border-border bg-background/80 p-3">
                        <p className="font-medium text-foreground">{booking.roomName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(booking.startAt)} - {formatShortDate(booking.endAt)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{booking.professorName || booking.bookedBy} • {booking.courseTitle || booking.purpose}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

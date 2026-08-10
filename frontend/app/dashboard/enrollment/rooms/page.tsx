"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { DoorOpen, Plus, Users } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import { pillButtonStyles } from "@/components/enrollment/shared"
import { useAcademicStructure } from "@/hooks/enrollment/use-academic-structure"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { createRoomRequest, deleteRoomRequest, fetchRooms, updateRoomRequest, type RoomRecord } from "@/lib/enrollment-api"

export default function EnrollmentRoomsPage() {
  const { toast } = useToast()
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const canManageResources = hasPermission("MANAGE_RESOURCES")
  const canViewSchedule = hasPermission("ADMIN_VIEW_SCHEDULE") || canManageResources
  const enabled = !authLoading && canViewSchedule

  const { academicStructure } = useAcademicStructure({ enabled, refreshKey: refreshVersion })
  const campuses = academicStructure?.campuses ?? []

  const [rooms, setRooms] = useState<RoomRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [manualRefreshing, setManualRefreshing] = useState(false)

  const [newName, setNewName] = useState("")
  const [newCampus, setNewCampus] = useState("")
  const [newCapacity, setNewCapacity] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCapacity, setEditCapacity] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  const [roomDeleteState, setRoomDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)

  const loadRooms = async () => {
    setLoadError(null)
    try {
      const data = await fetchRooms()
      setRooms(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load rooms")
    }
  }

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    loadRooms().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refreshVersion])

  const handleRefresh = async () => {
    setManualRefreshing(true)
    try {
      await loadRooms()
    } catch {
      toast({ title: "Refresh failed", description: "Unable to refresh rooms.", variant: "destructive" })
    } finally {
      setManualRefreshing(false)
    }
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) {
      setCreateError("Room name is required")
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const created = await createRoomRequest({
        name,
        campus: newCampus || null,
        capacity: Number(newCapacity) || 0,
      })
      setRooms((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName("")
      setNewCampus("")
      setNewCapacity("")
      toast({ title: "Room added" })
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to add room")
    } finally {
      setCreating(false)
    }
  }

  const startEditCapacity = (room: RoomRecord) => {
    setEditingId(room.id)
    setEditCapacity(String(room.capacity))
  }

  const saveEditCapacity = async (room: RoomRecord) => {
    setEditSaving(true)
    try {
      const updated = await updateRoomRequest(room.id, { capacity: Number(editCapacity) || 0 })
      setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setEditingId(null)
      toast({ title: "Capacity updated" })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to update capacity",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setEditSaving(false)
    }
  }

  const requestRemoveRoom = (roomId: string, roomName: string) => {
    setRoomDeleteState({ open: true, targetId: roomId, targetLabel: roomName, loading: false, error: null })
  }

  const confirmRemoveRoom = async () => {
    if (!roomDeleteState.targetId) return
    setRoomDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await deleteRoomRequest(roomDeleteState.targetId)
      setRooms((prev) => prev.filter((r) => r.id !== roomDeleteState.targetId))
      setRoomDeleteState(emptyConfirmDeleteState)
      toast({ title: "Room removed" })
    } catch (error) {
      setRoomDeleteState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to remove room",
      }))
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!canViewSchedule) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>You need ADMIN_VIEW_SCHEDULE or MANAGE_RESOURCES to access this area.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Rooms" description="Canonical room list with capacity, used for schedule conflict checks and room suggestions" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav onRefresh={handleRefresh} isRefreshing={manualRefreshing} />

          {loadError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load rooms</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          ) : null}

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DoorOpen className="h-4 w-4 text-primary" />
                Room Directory
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Rooms registered here get capacity-aware suggestions on the Schedule page. Rooms referenced only as
                free text on a course's location still work, but won't be filtered by capacity until added here.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManageResources ? (
                <div className="grid gap-2 md:grid-cols-4">
                  <Input placeholder="Room name (e.g. B1-204)" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={newCampus}
                    onChange={(e) => setNewCampus(e.target.value)}
                  >
                    <option value="">No campus</option>
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.name}>{campus.name}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Capacity"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                  />
                  <Button className={`gap-2 ${pillButtonStyles.primary}`} onClick={handleCreate} disabled={creating}>
                    {creating ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    Add room
                  </Button>
                </div>
              ) : null}
              {createError ? <p className="text-sm text-destructive">{createError}</p> : null}

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Loading rooms…
                </div>
              ) : rooms.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No rooms registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{room.name}</p>
                        <p className="text-xs text-muted-foreground">{room.campus || "No campus set"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {editingId === room.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              className="w-24"
                              value={editCapacity}
                              onChange={(e) => setEditCapacity(e.target.value)}
                            />
                            <Button size="sm" className={pillButtonStyles.primary} disabled={editSaving} onClick={() => saveEditCapacity(room)}>
                              {editSaving ? <Spinner className="h-3.5 w-3.5" /> : "Save"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-primary/5 disabled:cursor-default"
                            onClick={() => canManageResources && startEditCapacity(room)}
                            disabled={!canManageResources}
                          >
                            <Users className="h-3 w-3" />
                            {room.capacity} seats
                          </button>
                        )}
                        {canManageResources ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className={pillButtonStyles.dangerOutline}
                            onClick={() => requestRemoveRoom(room.id, room.name)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDeleteAlert
        state={roomDeleteState}
        onOpenChange={(open) => {
          if (!open) setRoomDeleteState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmRemoveRoom}
        title="Delete room"
        description={`Removing ${roomDeleteState.targetLabel || "this room"} cannot be undone. Courses that reference it as free text are unaffected.`}
        confirmLabel="Delete room"
      />
    </div>
  )
}

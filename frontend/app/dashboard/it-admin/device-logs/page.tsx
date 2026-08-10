"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/hooks/use-toast"
import { deviceLogsApi } from "@/lib/ops-api"
import type { DeviceLog } from "@shared/types"

export default function DeviceLogsPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<DeviceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    deviceLogsApi
      .list(controller.signal)
      .then((data) => setItems(data))
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load device logs")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await deviceLogsApi.remove(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      toast({ title: "Deleted" })
    } catch (err) {
      toast({ variant: "destructive", title: "Delete failed", description: err instanceof Error ? err.message : "Unknown error" })
    }
  }

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      item.deviceName.toLowerCase().includes(q) ||
      item.eventType.toLowerCase().includes(q) ||
      (item.ipAddress ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <DashboardHeader title="Device Logs" description="Read-only device event audit trail" />

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Search</CardTitle>
          <Input
            placeholder="Search device, event type, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Device Logs</CardTitle>
          <Badge variant="outline">{filtered.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No device log entries.</p>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-secondary/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.deviceName}</p>
                  <Badge variant="outline">{item.eventType}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.ipAddress ?? "No IP recorded"} • {new Date(item.createdAt).toLocaleString()}
                </p>
                {item.details && <p className="mt-1 text-sm text-muted-foreground">{item.details}</p>}
                <div className="mt-3">
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

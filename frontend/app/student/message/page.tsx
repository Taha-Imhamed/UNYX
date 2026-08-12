"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/auth-context"
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications-api"
import type { UserNotification } from "@shared/types"
import { StudentFeatureGate } from "@/components/student-feature-gate"

export default function StudentMessagePage() {
  return (
    <StudentFeatureGate featureKey="message">
      <StudentMessagePageInner />
    </StudentFeatureGate>
  )
}

function StudentMessagePageInner() {
  const { user } = useAuth()
  const [items, setItems] = useState<UserNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    if (!user?.id) return
    setIsLoading(true)
    fetchNotifications(user.id)
      .then((data) => setItems(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load messages"))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const unreadCount = items.filter((item) => !item.read).length

  const handleMarkRead = async (id: string) => {
    if (!user?.id) return
    try {
      await markNotificationRead(user.id, id)
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))
    } catch {
      // non-critical, ignore
    }
  }

  const handleMarkAllRead = async () => {
    if (!user?.id) return
    try {
      await markAllNotificationsRead(user.id)
      setItems((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch {
      // non-critical, ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Messages</p>
          <h1 className="text-2xl font-bold text-foreground">Your notifications</h1>
          <p className="text-sm text-muted-foreground">Updates from professors, finance, and the university.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all read ({unreadCount})
          </Button>
        )}
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>Grade postings, announcements, payment confirmations, and account alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Loading
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!isLoading && !error && items.length === 0 && (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border p-3 ${item.read ? "border-border bg-muted/20" : "border-primary/40 bg-primary/5"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                </div>
                {!item.read && <Badge variant="default">New</Badge>}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {item.actor ?? "System"} • {new Date(item.createdAt).toLocaleString()}
                </span>
                {!item.read && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleMarkRead(item.id)}>
                    Mark read
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

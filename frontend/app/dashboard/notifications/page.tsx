"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import type { UserNotification } from "@shared/types"

export default function NotificationsPage() {
  const { user, fetchUserNotifications, markNotificationRead, markAllNotificationsRead } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const entries = await fetchUserNotifications(user.id)
      setNotifications(entries)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])
  const visibleNotifications = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [notifications, filter],
  )

  const handleMarkRead = async (id: string) => {
    if (!user) return
    setBusyId(id)
    try {
      const ok = await markNotificationRead(user.id, id)
      if (ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      } else {
        toast({ variant: "destructive", title: "Unable to mark as read" })
      }
    } finally {
      setBusyId(null)
    }
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    setMarkingAll(true)
    try {
      const ok = await markAllNotificationsRead(user.id)
      if (ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      } else {
        toast({ variant: "destructive", title: "Unable to mark all as read" })
      }
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-4">
      <Card className="bg-card border-border w-full max-w-2xl mx-auto">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              All Notifications
              {unreadCount > 0 && <Badge variant="secondary">{unreadCount} unread</Badge>}
            </CardTitle>
            <CardDescription>Review all your platform notifications</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" variant="outline" disabled={markingAll || unreadCount === 0} onClick={handleMarkAllRead}>
              {markingAll ? "Marking..." : "Mark all read"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Loading notifications...</div>
          ) : visibleNotifications.length === 0 ? (
            <div className="text-muted-foreground">
              {filter === "unread" ? "No unread notifications." : "No notifications found."}
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {visibleNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg border p-3 ${n.read ? "border-border/60 bg-secondary/20" : "border-primary/40 bg-primary/5"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {n.createdAt ? format(new Date(n.createdAt), "MMM d, HH:mm") : "Just now"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Actor: {n.actor ?? "system"}</span>
                      <div className="flex items-center gap-2">
                        <span>Status: {n.read ? "Read" : "Unread"}</span>
                        {!n.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            disabled={busyId === n.id}
                            onClick={() => handleMarkRead(n.id)}
                          >
                            {busyId === n.id ? "Marking..." : "Mark read"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

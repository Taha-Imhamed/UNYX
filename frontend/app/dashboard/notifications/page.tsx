"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import type { UserNotification } from "@shared/types"

export default function NotificationsPage() {
  const { user, fetchUserNotifications } = useAuth()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        if (user) {
          const entries = await fetchUserNotifications(user.id)
          if (active) setNotifications(entries)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [user, fetchUserNotifications])

  return (
    <div className="flex flex-col h-full p-4">
      <Card className="bg-card border-border w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Review all your platform notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-muted-foreground">No notifications found.</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {n.createdAt ? format(new Date(n.createdAt), "MMM d, HH:mm") : "Just now"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Actor: {n.actor ?? "system"}</span>
                      <span>Status: {n.read ? "Read" : "Unread"}</span>
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

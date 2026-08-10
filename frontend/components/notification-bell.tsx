"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications-api"
import type { UserNotification } from "@shared/types"

export function NotificationBell({ inboxHref = "/student/message" }: { inboxHref?: string }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<UserNotification[]>([])

  const load = useCallback(() => {
    if (!user?.id) return () => {}
    const controller = new AbortController()
    fetchNotifications(user.id, controller.signal)
      .then(setNotifications)
      .catch(() => {
        if (!controller.signal.aborted) setNotifications([])
      })
    return () => controller.abort()
  }, [user?.id])

  useEffect(() => {
    const cancel = load()
    const interval = setInterval(load, 30000)
    return () => {
      cancel()
      clearInterval(interval)
    }
  }, [load])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])
  const recent = useMemo(() => notifications.slice(0, 6), [notifications])

  const handleMarkRead = async (id: string) => {
    if (!user?.id) return
    await markNotificationRead(user.id, id)
    load()
  }

  const handleMarkAll = async () => {
    if (!user?.id) return
    await markAllNotificationsRead(user.id)
    load()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-7 w-7 rounded-md border border-slate-600 bg-white/5 text-slate-100 hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button className="text-xs font-normal text-primary hover:underline" onClick={handleMarkAll}>
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet.</div>
        ) : (
          recent.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-0.5 whitespace-normal"
              onSelect={(e) => {
                e.preventDefault()
                if (!n.read) handleMarkRead(n.id)
              }}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <p className="text-sm font-medium">{n.title}</p>
                {!n.read && <Badge className="h-1.5 w-1.5 rounded-full p-0" />}
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={inboxHref} className="text-center text-sm text-primary">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

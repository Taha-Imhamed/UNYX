"use client"

import { useEffect, useState } from "react"
import { DashboardRouteGuard } from "@/components/dashboard-route-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Monitor,
  Smartphone,
  RefreshCw,
  LogOut,
  MessageSquare,
  Bell,
  FileSearch,
  Navigation,
  ShieldAlert,
  Wifi,
  Radio,
  Clock,
  MapPin,
  Globe,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  fetchIotSessions,
  forceReauthIotSession,
  messageIotSession,
  navigateIotSession,
  notifyIotSession,
  openRecordIotSession,
  refreshIotSession,
  timeoutIotSession,
  type IotSession,
} from "@/lib/iot-api"

function isMobileDevice(device: string) {
  return /mobile|tablet|phone/i.test(device)
}

// Mirrors the real sidebar tree (components/admin-sidebar.tsx) at a glance — enough for an
// admin to jump a connected user straight to the section they need help with.
const NAV_TREE: { section: string; items: { label: string; path: string }[] }[] = [
  { section: "Dashboard", items: [{ label: "Dashboard", path: "/dashboard" }] },
  {
    section: "Academic Management",
    items: [
      { label: "Students", path: "/dashboard/students" },
      { label: "Enrollment", path: "/dashboard/enrollment" },
      { label: "Classes", path: "/dashboard/enrollment/courses" },
      { label: "Campuses", path: "/dashboard/enrollment/campuses" },
      { label: "Rooms", path: "/dashboard/enrollment/rooms" },
      { label: "Waitlist", path: "/dashboard/enrollment/waitlist" },
      { label: "Professors", path: "/dashboard/professors" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Finance", path: "/dashboard/finance" },
      { label: "Applications", path: "/dashboard/applications" },
      { label: "News", path: "/dashboard/news" },
      { label: "Feedback", path: "/dashboard/feedback" },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "Audit", path: "/dashboard/audit" },
      { label: "Users", path: "/dashboard/users" },
      { label: "Settings", path: "/dashboard/settings" },
    ],
  },
]

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 5) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

type DialogKind = "message" | "notification" | "open-record" | null

function SessionCard({ session, onChanged }: { session: IotSession; onChanged: () => void }) {
  const { toast } = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [dialogKind, setDialogKind] = useState<DialogKind>(null)
  const [textValue, setTextValue] = useState("")
  const [titleValue, setTitleValue] = useState("")
  const [navigateOpen, setNavigateOpen] = useState(false)
  const mobile = isMobileDevice(session.device)

  const run = async (key: string, action: () => Promise<unknown>, successTitle: string, successDescription?: string) => {
    setBusy(key)
    try {
      await action()
      toast({ title: successTitle, description: successDescription })
      onChanged()
    } catch (error) {
      toast({ variant: "destructive", title: `Unable to ${key}`, description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setBusy(null)
    }
  }

  const handleNavigate = (path: string) => {
    setNavigateOpen(false)
    run("navigate", () => navigateIotSession(session.connectionId, path), "Navigate sent", `${session.username} is being sent to ${path}.`)
  }

  const openDialog = (kind: DialogKind) => {
    setTextValue("")
    setTitleValue("")
    setDialogKind(kind)
  }

  const handleDialogSubmit = async () => {
    if (dialogKind === "message") {
      if (!textValue.trim()) return
      await run("message", () => messageIotSession(session.connectionId, textValue.trim()), "Message sent", `Shown on ${session.username}'s screen.`)
    } else if (dialogKind === "notification") {
      if (!titleValue.trim()) return
      await run(
        "notification",
        () => notifyIotSession(session.connectionId, titleValue.trim(), textValue.trim() || undefined),
        "Notification sent",
      )
    } else if (dialogKind === "open-record") {
      if (!textValue.trim().startsWith("/")) {
        toast({ variant: "destructive", title: "Invalid path", description: "Path must start with /" })
        return
      }
      await run("open-record", () => openRecordIotSession(session.connectionId, textValue.trim()), "Record opened", `Opened on ${session.username}'s screen.`)
    }
    setDialogKind(null)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          {mobile ? <Smartphone className="h-6 w-6 text-primary" /> : <Monitor className="h-6 w-6 text-primary" />}
          <div>
            <CardTitle className="text-base">{session.username}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {session.role} · {session.os} · {session.browser}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Wifi className="h-3 w-3 text-emerald-500" /> Online
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-xs">
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Current page:</span>
            <span className="truncate font-mono">{session.currentPath || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Last activity:</span>
            <span>{timeAgo(session.lastActivityAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Connected since:</span>
            <span>{new Date(session.connectedAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          <Popover open={navigateOpen} onOpenChange={setNavigateOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant={navigateOpen ? "default" : "outline"} disabled={busy !== null} className="gap-1.5">
                <Navigation className="h-3.5 w-3.5" /> Navigate
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" side="right" className="w-64 p-2">
              <p className="mb-1.5 px-1 text-xs font-semibold text-foreground">Send {session.username} to…</p>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {NAV_TREE.map((group) => (
                  <div key={group.section}>
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{group.section}</p>
                    <div className="mt-0.5 space-y-0.5">
                      {group.items.map((item) => (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => handleNavigate(item.path)}
                          className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-secondary/60"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={busy !== null} className="gap-1.5">
                {busy ? <Spinner className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}
                Remote Control
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Remote Control</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2" onClick={() => openDialog("message")}>
                <MessageSquare className="h-4 w-4" /> Send Message
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => openDialog("notification")}>
                <Bell className="h-4 w-4" /> Send Notification
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => openDialog("open-record")}>
                <FileSearch className="h-4 w-4" /> Open Record
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => run("refresh", () => refreshIotSession(session.connectionId), "Refresh sent", `${session.username}'s page will reload.`)}
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-amber-600 focus:text-amber-600"
                onClick={() =>
                  run("force-reauth", () => forceReauthIotSession(session.connectionId), "Re-authentication forced", `${session.username} must sign in again.`)
                }
              >
                <ShieldAlert className="h-4 w-4" /> Force Re-authentication
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-red-600 focus:text-red-600"
                onClick={() => run("timeout", () => timeoutIotSession(session.connectionId), "Session ended", `${session.username} has been logged out.`)}
              >
                <LogOut className="h-4 w-4" /> End Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      <Dialog open={dialogKind !== null} onOpenChange={(open) => !open && setDialogKind(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogKind === "message" && `Message ${session.username}`}
              {dialogKind === "notification" && `Notify ${session.username}`}
              {dialogKind === "open-record" && `Open a record on ${session.username}'s screen`}
            </DialogTitle>
          </DialogHeader>

          {dialogKind === "notification" && (
            <div className="space-y-2">
              <Label htmlFor="notif-title">Title</Label>
              <Input id="notif-title" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} placeholder="Notification title" />
            </div>
          )}

          {dialogKind === "open-record" ? (
            <div className="space-y-2">
              <Label htmlFor="record-path">Path</Label>
              <Input id="record-path" value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="/dashboard/students/STU-1001" />
            </div>
          ) : (
            <div className="space-y-2">
              {dialogKind === "notification" && <Label htmlFor="notif-body">Body (optional)</Label>}
              <Textarea
                id="notif-body"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={dialogKind === "message" ? "This will appear as a full-screen message on their device." : "Optional details"}
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleDialogSubmit} disabled={busy !== null} className="gap-2">
              {busy ? <Spinner className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function IotConnectorsPageInner() {
  const [sessions, setSessions] = useState<IotSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setError(null)
    fetchIotSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load sessions"))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <DashboardHeader title="IoT Connectors" description="Live connected sessions — follow, navigate, message, or end any active device." />
      <div className="space-y-4 p-6 pt-4 md:pt-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load sessions</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading sessions…
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">No devices connected right now.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard key={session.connectionId} session={session} onChanged={load} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function IotConnectorsPage() {
  return (
    <DashboardRouteGuard allowedRoles={["super-admin"]}>
      <IotConnectorsPageInner />
    </DashboardRouteGuard>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { DashboardRouteGuard } from "@/components/dashboard-route-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Server, Users, Database, ShieldCheck, Cpu, MemoryStick, Globe } from "lucide-react"
import { apiFetch, authHeaders, API_BASE_URL } from "@/lib/api-client"

interface OverviewData {
  system: {
    status: string
    uptime: string
    version: string
    environment: string
    nodeVersion: string
    cpuUsagePercent: number
    cpuCores: number
    ramUsedBytes: number
    ramTotalBytes: number
    ramUsagePercent: number
    responseTimeMsAvg: number | null
    requestsPerMinute: number
  }
  users: {
    total: number
    active: number
    suspended: number
    onlineNow: number
    activeToday: number
    newThisMonth: number
    failedLoginAttemptsRecent: number
    byRole: { role: string; count: number }[]
  }
  database: {
    size: string
    tableCount: number
    activeConnections: number
    largestTables: { table_name: string; size: string }[]
  }
  security: {
    httpsEnabled: boolean
    jwtSessionTimeout: string
    loginRateLimit: string
    passwordHashing: string
  }
}

interface LiveEvent {
  id: string
  type: "login-success" | "login-fail" | "request"
  timestamp: string
  method: string
  path: string
  status?: number
  durationMs?: number
  ip: string
  browser: string
  os: string
  device: string
  username?: string | null
  role?: string | null
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 MB"
  const mb = bytes / (1024 * 1024)
  if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(0)} MB`
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Server; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${tone ?? ""}`}>{value}</p>
        </div>
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </CardContent>
    </Card>
  )
}

function eventBadgeVariant(event: LiveEvent): "default" | "destructive" | "secondary" {
  if (event.type === "login-fail") return "destructive"
  if (event.type === "login-success") return "default"
  if (event.status && event.status >= 400) return "destructive"
  return "secondary"
}

function eventLabel(event: LiveEvent) {
  if (event.type === "login-success") return "Login success"
  if (event.type === "login-fail") return "Login failed"
  return `${event.method} ${event.status ?? ""}`
}

function ServerPanel() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<LiveEvent[]>([])
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await apiFetch<OverviewData>("/server-monitor/overview")
        if (!cancelled) setOverview(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load overview")
      }
    }
    load()
    const interval = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    apiFetch<LiveEvent[]>("/server-monitor/logs?limit=100")
      .then(setEvents)
      .catch(() => {})

    const controller = new AbortController()
    abortRef.current = controller

    async function connect() {
      try {
        const response = await fetch(`${API_BASE_URL}/server-monitor/stream`, {
          headers: { ...authHeaders() },
          signal: controller.signal,
        })
        if (!response.ok || !response.body) return
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const chunks = buffer.split("\n\n")
          buffer = chunks.pop() ?? ""
          for (const chunk of chunks) {
            const line = chunk.split("\n").find((l) => l.startsWith("data: "))
            if (!line) continue
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed?.type === "connected") continue
              setEvents((prev) => [parsed as LiveEvent, ...prev].slice(0, 200))
            } catch {
              // ignore malformed chunk
            }
          }
        }
      } catch {
        // stream closed or aborted
      }
    }
    connect()
    return () => controller.abort()
  }, [])

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Server className="h-4 w-4" /> System Overview
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Status"
            value={overview ? "Online" : "..."}
            icon={Activity}
            tone={overview ? "text-emerald-500" : ""}
          />
          <StatCard label="Uptime" value={overview?.system.uptime ?? "..."} icon={Server} />
          <StatCard label="Environment" value={overview?.system.environment ?? "..."} icon={Globe} />
          <StatCard label="Version" value={overview?.system.version ?? "..."} icon={Server} />
          <StatCard label="CPU Usage" value={overview ? `${overview.system.cpuUsagePercent}%` : "..."} icon={Cpu} />
          <StatCard
            label="RAM Usage"
            value={overview ? `${formatBytes(overview.system.ramUsedBytes)} / ${formatBytes(overview.system.ramTotalBytes)}` : "..."}
            icon={MemoryStick}
          />
          <StatCard label="Avg Response Time" value={overview?.system.responseTimeMsAvg ? `${overview.system.responseTimeMsAvg} ms` : "n/a"} icon={Activity} />
          <StatCard label="Requests / min" value={overview?.system.requestsPerMinute ?? "..."} icon={Activity} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Users className="h-4 w-4" /> Users
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Users" value={overview?.users.total ?? "..."} icon={Users} />
          <StatCard label="Online Now" value={overview?.users.onlineNow ?? "..."} icon={Users} tone="text-emerald-500" />
          <StatCard label="Active Today" value={overview?.users.activeToday ?? "..."} icon={Users} />
          <StatCard label="New This Month" value={overview?.users.newThisMonth ?? "..."} icon={Users} />
          <StatCard label="Suspended" value={overview?.users.suspended ?? "..."} icon={Users} />
          <StatCard label="Failed Logins (recent)" value={overview?.users.failedLoginAttemptsRecent ?? "..."} icon={ShieldCheck} tone="text-amber-500" />
        </div>
        {overview && overview.users.byRole.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Users by Role</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {overview.users.byRole.map((r) => (
                <Badge key={r.role} variant="secondary">
                  {r.role}: {r.count}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Database className="h-4 w-4" /> Database
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Database Size" value={overview?.database.size ?? "..."} icon={Database} />
          <StatCard label="Tables" value={overview?.database.tableCount ?? "..."} icon={Database} />
          <StatCard label="Active Connections" value={overview?.database.activeConnections ?? "..."} icon={Database} />
        </div>
        {overview && overview.database.largestTables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Largest Tables</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {overview.database.largestTables.map((t) => (
                <Badge key={t.table_name} variant="outline">
                  {t.table_name}: {t.size}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Security
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="HTTPS" value={overview?.security.httpsEnabled ? "Enabled" : "Disabled"} icon={ShieldCheck} />
          <StatCard label="Session Timeout" value={overview?.security.jwtSessionTimeout ?? "..."} icon={ShieldCheck} />
          <StatCard label="Login Rate Limit" value={overview?.security.loginRateLimit ?? "..."} icon={ShieldCheck} />
          <StatCard label="Password Hashing" value={overview?.security.passwordHashing ?? "..."} icon={ShieldCheck} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Activity className="h-4 w-4" /> Live Traffic &amp; Login Log
        </h2>
        <Card>
          <CardContent className="max-h-[520px] overflow-y-auto p-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Event</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Path</th>
                  <th className="px-3 py-2 text-left">IP</th>
                  <th className="px-3 py-2 text-left">Device</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={eventBadgeVariant(event)}>{eventLabel(event)}</Badge>
                    </td>
                    <td className="px-3 py-2">{event.username ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{event.path}</td>
                    <td className="px-3 py-2 font-mono text-xs">{event.ip}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {event.browser} · {event.os} · {event.device}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      Waiting for live traffic…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default function ServerMonitorPage() {
  return (
    <DashboardRouteGuard allowedRoles={["super-admin"]}>
      <DashboardHeader title="Server" description="Live system health, users, database and traffic monitoring" />
      <div className="p-6">
        <ServerPanel />
      </div>
    </DashboardRouteGuard>
  )
}

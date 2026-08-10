"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Shield, Activity, Clock, Filter, Users, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { fetchAuditLog, type AuditLogEntryRecord } from "@/lib/enrollment-api"

const KNOWN_ENTITY_TYPES = ["course", "enrollment"]

export default function AuditLogPage() {
  const { isAdmin: isPrivileged, isLoading } = useAuth()
  const router = useRouter()

  const [entries, setEntries] = useState<AuditLogEntryRecord[]>([])
  const [entriesLoading, setEntriesLoading] = useState(true)
  const [entriesError, setEntriesError] = useState<string | null>(null)

  const [entityTypeFilter, setEntityTypeFilter] = useState("all")
  const [actorFilter, setActorFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (!isLoading && !isPrivileged) {
      router.push("/dashboard")
    }
  }, [isLoading, isPrivileged, router])

  const loadEntries = () => {
    if (isLoading || !isPrivileged) return () => {}
    let cancelled = false
    setEntriesLoading(true)
    setEntriesError(null)
    fetchAuditLog({
      limit: 100,
      entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
      actor: actorFilter.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((data) => {
        if (cancelled) return
        setEntries(data)
      })
      .catch((error) => {
        if (cancelled) return
        setEntriesError(error instanceof Error ? error.message : "Unable to load audit log")
      })
      .finally(() => {
        if (!cancelled) setEntriesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }

  useEffect(() => {
    const cancel = loadEntries()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isPrivileged, entityTypeFilter, actorFilter, startDate, endDate])

  const clearFilters = () => {
    setEntityTypeFilter("all")
    setActorFilter("")
    setStartDate("")
    setEndDate("")
  }

  const hasActiveFilters = entityTypeFilter !== "all" || actorFilter.trim() !== "" || startDate !== "" || endDate !== ""

  const totals = useMemo(() => {
    const actors = new Map<string, number>()
    entries.forEach((entry) => {
      const actor = entry.actorUsername ?? entry.actorUserId ?? "system"
      actors.set(actor, (actors.get(actor) ?? 0) + 1)
    })
    const mostActive = Array.from(actors.entries()).sort((a, b) => b[1] - a[1])[0]
    const latest = entries.reduce<Date | null>((acc, entry) => {
      const ts = new Date(entry.createdAt)
      if (Number.isNaN(ts.getTime())) return acc
      if (!acc || ts > acc) return ts
      return acc
    }, null)
    return {
      total: entries.length,
      uniqueActors: actors.size,
      mostActive: mostActive ? { actor: mostActive[0], count: mostActive[1] } : null,
      latest,
    }
  }, [entries])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading audit log...</div>
      </div>
    )
  }

  if (!isPrivileged) {
    return null
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Audit Log" description="Complete activity trail for admins and supervisors" />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Alert className="border-primary/20 bg-primary/5 dashboard-soft-hover">
          <Shield className="h-4 w-4 text-primary" />
          <AlertTitle className="text-foreground">Privileged access</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Admins and supervisors can review every privileged change recorded in the system.
          </AlertDescription>
        </Alert>

        {entriesError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load audit log</AlertTitle>
            <AlertDescription>{entriesError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-card border-border dashboard-soft-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Events
              </CardTitle>
              <CardDescription>Most recent audit entries loaded</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{totals.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border dashboard-soft-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Actors
              </CardTitle>
              <CardDescription>Unique privileged users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{totals.uniqueActors}</p>
              {totals.mostActive && (
                <p className="text-xs text-muted-foreground mt-1">
                  Most active: {totals.mostActive.actor} ({totals.mostActive.count})
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border dashboard-soft-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Latest
              </CardTitle>
              <CardDescription>Most recent recorded event</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">
                {totals.latest ? totals.latest.toLocaleString() : "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border dashboard-soft-hover">
          <CardHeader>
            <CardTitle>Activity Stream</CardTitle>
            <CardDescription>Chronological feed of admin and supervisor actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="w-40">
                  <span className="flex min-w-0 items-center gap-2">
                    <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entity types</SelectItem>
                  {KNOWN_ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="w-40"
                placeholder="Actor username"
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
              />
              <Input
                type="date"
                className="w-40"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="From date"
              />
              <Input
                type="date"
                className="w-40"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="To date"
              />
              {hasActiveFilters ? (
                <Button variant="outline" size="sm" className="gap-2" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              ) : null}
            </div>
            <ScrollArea className="h-[28rem] rounded-lg border border-border/60 bg-background/70 p-1">
              {entriesLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Loading events…
                </div>
              ) : entries.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  No audit events recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {entries.map((entry) => {
                    const eventTime = new Date(entry.createdAt)
                    const actorLabel = entry.actorUsername ?? entry.actorUserId ?? "system"
                    return (
                      <div
                        key={entry.id}
                        className="flex flex-col gap-2 px-4 py-3 transition-colors duration-200 hover:bg-secondary/20 md:flex-row md:items-center md:gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{entry.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {[entry.entityType, entry.entityId].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:justify-end">
                          <Badge variant="outline">{actorLabel}</Badge>
                          <Separator orientation="vertical" className="h-4" />
                          <span>{Number.isNaN(eventTime.getTime()) ? entry.createdAt : eventTime.toLocaleString()}</span>
                          <Separator orientation="vertical" className="h-4" />
                          <Badge variant="secondary">{entry.id}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

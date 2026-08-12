"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardRouteGuard } from "@/components/dashboard-route-guard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlayCircle, RotateCw, CheckCircle2, XCircle, CircleDashed, Loader2 } from "lucide-react"
import { systemDiagnosticsApi, type DiagnosticCheckMeta, type DiagnosticResult } from "@/lib/system-diagnostics-api"
import { useToast } from "@/hooks/use-toast"

type RunState = "idle" | "running" | "pass" | "fail"

interface CheckRow extends DiagnosticCheckMeta {
  state: RunState
  code?: number
  message?: string
  durationMs?: number
}

function StatusBadge({ row }: { row: CheckRow }) {
  if (row.state === "running") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </Badge>
    )
  }
  if (row.state === "pass") {
    return (
      <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" variant="outline">
        <CheckCircle2 className="h-3 w-3" />
        {row.code}
      </Badge>
    )
  }
  if (row.state === "fail") {
    return (
      <Badge className="gap-1 border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400" variant="outline">
        <XCircle className="h-3 w-3" />
        {row.code}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1 text-muted-foreground">
      <CircleDashed className="h-3 w-3" />
      Idle
    </Badge>
  )
}

function SystemTestPageInner() {
  const { toast } = useToast()
  const [rows, setRows] = useState<CheckRow[]>([])
  const [isLoadingChecks, setIsLoadingChecks] = useState(true)
  const [isRunningAll, setIsRunningAll] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoadingChecks(true)
    systemDiagnosticsApi
      .list()
      .then((checks) => {
        if (!active) return
        setRows(checks.map((check) => ({ ...check, state: "idle" as RunState })))
      })
      .catch((error) => {
        console.error("Failed to load diagnostic checks", error)
        toast({
          variant: "destructive",
          title: "Unable to load tests",
          description: error instanceof Error ? error.message : "Unknown error",
        })
      })
      .finally(() => {
        if (active) setIsLoadingChecks(false)
      })
    return () => {
      active = false
    }
  }, [toast])

  const applyResult = useCallback((result: DiagnosticResult) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === result.id
          ? { ...row, state: result.status, code: result.code, message: result.message, durationMs: result.durationMs }
          : row,
      ),
    )
  }, [])

  const runSingle = useCallback(
    async (id: string) => {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, state: "running" } : row)))
      try {
        const result = await systemDiagnosticsApi.runOne(id)
        applyResult(result)
      } catch (error) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === id
              ? { ...row, state: "fail", code: 500, message: error instanceof Error ? error.message : "Unknown error" }
              : row,
          ),
        )
      }
    },
    [applyResult],
  )

  const runAll = useCallback(async () => {
    setIsRunningAll(true)
    setRows((prev) => prev.map((row) => ({ ...row, state: "running" })))
    for (const row of rows) {
      await runSingle(row.id)
    }
    setIsRunningAll(false)
  }, [rows, runSingle])

  const grouped = useMemo(() => {
    const map = new Map<string, CheckRow[]>()
    for (const row of rows) {
      const list = map.get(row.group) ?? []
      list.push(row)
      map.set(row.group, list)
    }
    return Array.from(map.entries())
  }, [rows])

  const summary = useMemo(() => {
    const passed = rows.filter((r) => r.state === "pass").length
    const failed = rows.filter((r) => r.state === "fail").length
    const pending = rows.filter((r) => r.state === "idle" || r.state === "running").length
    return { passed, failed, pending, total: rows.length }
  }, [rows])

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="System Test" description="Run backend and database connection checks, one by one or all at once" />

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <Card className="overflow-hidden border-border bg-card">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">Diagnostics</CardTitle>
              <CardDescription>
                {summary.total === 0
                  ? "Loading checks..."
                  : `${summary.passed} passed · ${summary.failed} failed · ${summary.pending} pending of ${summary.total}`}
              </CardDescription>
            </div>
            <Button onClick={runAll} disabled={isLoadingChecks || isRunningAll || rows.length === 0} className="gap-2">
              {isRunningAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              {isRunningAll ? "Running all..." : "Run all tests"}
            </Button>
          </CardHeader>
        </Card>

        {isLoadingChecks && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading test list...
          </div>
        )}

        {grouped.map(([group, groupRows]) => (
          <Card key={group} className="overflow-hidden border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">{group}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {groupRows.map((row, idx) => (
                <div key={row.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{row.label}</p>
                      {row.message && (
                        <p className="truncate text-xs text-muted-foreground">
                          {row.message}
                          {typeof row.durationMs === "number" ? ` · ${row.durationMs}ms` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge row={row} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={row.state === "running" || isRunningAll}
                        onClick={() => runSingle(row.id)}
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        Run
                      </Button>
                    </div>
                  </div>
                  {idx < groupRows.length - 1 && <div className="h-px bg-border" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function SystemTestPage() {
  return (
    <DashboardRouteGuard allowedRoles={["super-admin"]}>
      <SystemTestPageInner />
    </DashboardRouteGuard>
  )
}

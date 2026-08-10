import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export type RosterRow = {
  id: string
  title: string
  subtitle?: string
  email?: string
  status: string
  badges?: string[]
  branch?: string
  sectionId?: string
}

export type RosterActions = {
  approve?: (row: RosterRow) => void
  reject?: (row: RosterRow) => void
  request?: (row: RosterRow) => void
  loadingId?: string | null
  disabled?: boolean
}

export type StatusMeta = Record<string, { label: string; badge: "default" | "secondary" | "outline" | "destructive" }>

interface RosterListProps {
  rows: RosterRow[]
  statusMeta: StatusMeta
  actions?: RosterActions
  readOnly?: boolean
  emptyLabel?: string
}

export function RosterList({ rows, statusMeta, actions, readOnly, emptyLabel }: RosterListProps) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel ?? "No roster data."}</p>
  }

  return (
    <div className="grid gap-3">
      {rows.map((row) => {
        const meta = statusMeta[row.status] ?? { label: row.status, badge: "outline" as const }
        const loading = actions?.loadingId === row.id
        return (
          <div
            key={row.id}
            className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-semibold text-foreground">{row.title}</p>
              {row.subtitle && <p className="text-xs text-muted-foreground">{row.subtitle}</p>}
              {row.email && <p className="text-[11px] text-muted-foreground">{row.email}</p>}
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant={meta.badge} className="capitalize">
                  {meta.label}
                </Badge>
                {row.sectionId && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0">
                    Section {row.sectionId}
                  </Badge>
                )}
                {row.branch && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0">
                    {row.branch}
                  </Badge>
                )}
                {row.badges?.map((badge) => (
                  <Badge key={badge} variant="outline" className="text-[10px] px-2 py-0">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
            {!readOnly && actions && (
              <div className="flex items-center gap-2">
                {row.status === "pendingAdvisorApproval" && actions.approve && (
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1"
                    disabled={actions.disabled || loading}
                    onClick={() => actions.approve?.(row)}
                  >
                    {loading ? <Spinner className="h-4 w-4" /> : null} Approve
                  </Button>
                )}
                {row.status === "pendingAdvisorApproval" && actions.reject && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    disabled={actions.disabled || loading}
                    onClick={() => actions.reject?.(row)}
                  >
                    {loading ? <Spinner className="h-4 w-4" /> : null} Reject
                  </Button>
                )}
                {row.status === "pendingSupervisorApproval" && actions.request && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1"
                    disabled={actions.disabled || loading}
                    onClick={() => actions.request?.(row)}
                  >
                    {loading ? <Spinner className="h-4 w-4" /> : null} Send to advisor
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

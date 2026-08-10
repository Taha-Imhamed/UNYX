import React, { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { ScheduleDay } from "@shared/types"

export type ScheduleSession = {
  id?: string
  day: ScheduleDay
  startTime: string
  endTime: string
  courseId?: string
  courseTitle?: string
  courseCode?: string
  sectionId?: string
  branch?: string
  location?: string
  campus?: string
  professorId?: string
  professorName?: string
  status?: string
  gradeLabel?: string
}

export type ScheduleConflict = {
  day: ScheduleDay
  courseIds: string[]
  range?: string
}

interface ScheduleGridProps {
  sessions: ScheduleSession[]
  conflicts?: ScheduleConflict[]
  height?: number
  readOnly?: boolean
  onSessionClick?: (session: ScheduleSession) => void
  onTimeSlotClick?: (session: ScheduleSession) => void
  badgeRenderer?: (session: ScheduleSession) => React.ReactNode
}

const weekDays: ScheduleDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

function toMinutes(time: string) {
  const [h, m] = time.split(":").map((part) => Number(part))
  return h * 60 + (m || 0)
}

export function ScheduleGrid({ sessions, conflicts, height, readOnly, onSessionClick, onTimeSlotClick, badgeRenderer }: ScheduleGridProps) {
  const conflictSet = useMemo(() => {
    const set = new Set<string>()
    conflicts?.forEach((conflict) => {
      conflict.courseIds.forEach((id) => set.add(`${conflict.day}-${id}`))
    })
    return set
  }, [conflicts])

  const conflictMap = useMemo(() => {
    const map = new Map<string, ScheduleConflict>()
    conflicts?.forEach((conflict) => {
      conflict.courseIds.forEach((id) => map.set(`${conflict.day}-${id}`, conflict))
    })
    return map
  }, [conflicts])

  const courseTitleById = useMemo(() => {
    const m = new Map<string, string>()
    sessions.forEach((s) => {
      if (s.courseId) m.set(s.courseId, s.courseTitle || s.courseCode || s.courseId)
      else if (s.id) m.set(s.id, s.courseTitle || s.courseCode || s.id)
    })
    return m
  }, [sessions])

  const bounds = useMemo(() => {
    if (!sessions.length) return { start: 8 * 60, end: 18 * 60 }
    const starts = sessions.map((s) => toMinutes(s.startTime))
    const ends = sessions.map((s) => toMinutes(s.endTime))
    const minStart = Math.min(...starts, 8 * 60)
    const maxEnd = Math.max(...ends, 18 * 60)
    return { start: Math.min(minStart, 8 * 60), end: Math.max(maxEnd, 18 * 60) }
  }, [sessions])

  const timeMarkers = useMemo(() => {
    const markers: { label: string; minutes: number }[] = []
    const step = 60
    const span = Math.max(step, bounds.end - bounds.start)
    const count = Math.ceil(span / step) + 1
    for (let i = 0; i < count; i += 1) {
      const minutes = bounds.start + i * step
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      markers.push({ label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, minutes })
    }
    return markers
  }, [bounds])

  const scheduleHeight = useMemo(() => {
    if (height) return height
    const span = Math.max(180, bounds.end - bounds.start)
    const pxPerMinute = 0.8
    return Math.min(1000, Math.max(420, span * pxPerMinute))
  }, [bounds, height])

  const daySessions = useMemo(() => {
    return weekDays.map((day) => sessions.filter((s) => s.day === day))
  }, [sessions])

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-3">
      <div className="grid" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
        <div className="text-[11px] text-muted-foreground text-right pr-2">Time</div>
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[11px] font-semibold text-foreground uppercase">{day.slice(0, 3)}</div>
        ))}
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
        <div className="relative" style={{ height: `${scheduleHeight}px` }}>
          {timeMarkers.map((marker) => {
            const top = ((marker.minutes - bounds.start) / (bounds.end - bounds.start)) * scheduleHeight
            return (
              <div key={marker.label} className="absolute left-0 right-0" style={{ top }}>
                <span className="text-[11px] text-muted-foreground pr-2 block text-right">{marker.label}</span>
                <div className="h-px bg-border/60 ml-auto" style={{ width: "14px" }} />
              </div>
            )
          })}
        </div>

        {daySessions.map((slots, dayIdx) => (
          <div
            key={weekDays[dayIdx]}
            className="relative rounded-md border border-border bg-background/60 overflow-hidden"
            style={{ height: `${scheduleHeight}px` }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
                backgroundSize: "100% 40px",
              }}
            />
            {slots.map((session, idx) => {
              const start = toMinutes(session.startTime)
              const end = toMinutes(session.endTime)
              const top = ((start - bounds.start) / (bounds.end - bounds.start)) * scheduleHeight
              const heightPx = Math.max(28, ((end - start) / (bounds.end - bounds.start)) * scheduleHeight)
              const conflict = conflictSet.has(`${session.day}-${session.courseId ?? session.id ?? idx}`)
              const status = session.status ?? "existing"
              const isProposed = status === "proposed"
              const location = session.location || session.branch || "Room TBA"
              const interactive = Boolean(onTimeSlotClick) || (!readOnly && isProposed && onSessionClick)
              return (
                <div
                  key={`${session.courseId || session.id || idx}-${idx}`}
                  className={cn(
                    "absolute left-1 right-1 rounded-md border shadow-sm text-xs text-foreground transition-all duration-300",
                    isProposed ? "bg-primary/15 border-primary/60" : "bg-emerald-500/15 border-emerald-600/70",
                    conflict ? "ring-2 ring-destructive" : "",
                    interactive ? "cursor-pointer" : "",
                  )}
                  style={{ top, height: heightPx }}
                  title={`${(session.courseCode ?? session.courseTitle) || "Class"}\n${session.day} ${session.startTime}-${session.endTime}\n${location}\n${session.professorName ?? ""}`}
                  onClick={() => {
                    if (onTimeSlotClick) {
                      onTimeSlotClick(session)
                      return
                    }
                    if (!readOnly && isProposed && onSessionClick) onSessionClick(session)
                  }}
                >
                  <div className="flex items-center justify-between gap-2 px-2 pt-2">
                    <span className="font-semibold leading-tight truncate">{session.courseCode ?? session.courseTitle}</span>
                    {session.sectionId && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 border-border">
                        {session.sectionId}
                      </Badge>
                    )}
                  </div>
                  <div className="px-2 text-[11px] text-muted-foreground truncate">
                    {session.startTime}–{session.endTime} @ {location}
                  </div>
                  <div className="flex items-center gap-2 px-2 pb-2 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="h-5 px-2 text-[10px] border-border">
                      {isProposed ? "Proposed" : "Existing"}
                    </Badge>
                    {conflict && (
                      <div className="ml-2 flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent sideOffset={6}>
                            {(() => {
                              const c = conflictMap.get(`${session.day}-${session.courseId ?? session.id ?? idx}`)
                              if (!c) return "Conflict"
                              const others = c.courseIds.filter((cid) => cid !== (session.courseId ?? session.id))
                              const otherNames = others.map((o) => courseTitleById.get(o) || o)
                              return (
                                <div className="max-w-xs text-xs text-background">
                                  <div className="font-semibold">Conflict with:</div>
                                  <div className="mt-1">{otherNames.join(", ") || c.courseIds.join(", ")}</div>
                                </div>
                              )
                            })()}
                          </TooltipContent>
                        </Tooltip>

                        {!readOnly && onSessionClick && (
                          <button
                            onClick={() => onSessionClick(session)}
                            className="text-[11px] px-2 py-1 rounded bg-red-50 text-destructive border border-destructive/40"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    )}
                    {badgeRenderer ? badgeRenderer(session) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

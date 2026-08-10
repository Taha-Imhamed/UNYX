"use client"

import { useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScheduleGrid } from "@/components/enrollment/ScheduleGrid"
import { useStudentEnrollments } from "@/hooks/use-student-portal"

export default function StudentSchedulePage() {
  const { enrollments, reload } = useStudentEnrollments()

  const allowedStatuses = useMemo(() => new Set(["active"]), [])
  const activeEnrollments = useMemo(() => {
    const active = enrollments.filter((enr) => allowedStatuses.has(enr.status))
    const uniqueByCourse = new Map<string, (typeof active)[number]>()
    active.forEach((enr) => {
      if (!uniqueByCourse.has(enr.courseId)) {
        uniqueByCourse.set(enr.courseId, enr)
      }
    })
    return Array.from(uniqueByCourse.values())
  }, [allowedStatuses, enrollments])

  useEffect(() => {
    const id = setInterval(() => reload?.(), 3000)
    return () => clearInterval(id)
  }, [reload])

  const sessions = useMemo(() => {
    const sessionList = activeEnrollments
      .flatMap((enr) => {
        if (!Array.isArray(enr.courseSchedule)) return []
        const branch = enr.courseBranch?.trim().toLowerCase() || null
        const scopedSlots = branch
          ? enr.courseSchedule.filter((slot) => {
              if (!slot.branch) return true
              return slot.branch.trim().toLowerCase() === branch
            })
          : enr.courseSchedule
        const slots = scopedSlots.length > 0 ? scopedSlots : enr.courseSchedule
        return slots.map((slot, idx) => ({
          ...slot,
          courseId: enr.courseId,
          courseTitle: enr.courseTitle,
          courseCode: enr.courseCode ?? enr.displayId ?? enr.courseId,
          professorName: enr.professorName,
          status: enr.status,
          id: `${enr.id}-${idx}`,
        }))
      })
    return sessionList
  }, [activeEnrollments])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Schedule</p>
        <h1 className="text-2xl font-bold text-foreground">Your timetable</h1>
        <p className="text-sm text-muted-foreground">Only your active courses are displayed below.</p>
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Weekly view</p>
              <p className="text-xs text-muted-foreground">Auto-updates with enrollment changes.</p>
            </div>
            <Badge variant="outline" className="border-border text-foreground">{activeEnrollments.length} courses</Badge>
          </div>
          <ScheduleGrid sessions={sessions as any} readOnly />
        </CardContent>
      </Card>
    </div>
  )
}

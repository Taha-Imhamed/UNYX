"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { Enrollment } from "@shared/types"
import { Calendar, Clock3, GraduationCap, ShieldCheck } from "lucide-react"

interface CoursesTableProps {
  enrollments: Enrollment[]
  isLoading?: boolean
  error?: string | null
}

export function CoursesTable({ enrollments, isLoading, error }: CoursesTableProps) {
  return (
    <Card className="border border-border bg-card" id="enrollments">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Enrolled Courses
        </CardTitle>
        <Badge variant="outline" className="border-border text-foreground">
          {enrollments.length} total
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10"><Spinner className="h-5 w-5" /></div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enrollments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Course</th>
                  <th className="py-2 pr-4">Professor</th>
                  <th className="py-2 pr-4">Schedule</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Tuition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-foreground">{enrollment.courseTitle}</div>
                      <div className="text-xs text-muted-foreground">{enrollment.displayId}</div>
                    </td>
                    <td className="py-3 pr-4 text-foreground">{enrollment.professorName}</td>
                    <td className="py-3 pr-4 text-foreground">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-4 w-4 text-primary" />{new Date(enrollment.startDate).toLocaleDateString()} - {new Date(enrollment.endDate).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusPill status={enrollment.status} />
                    </td>
                    <td className="py-3 pr-4 text-right text-foreground font-semibold">${enrollment.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusPill({ status }: { status: Enrollment["status"] }) {
  const styles: Record<string, string> = {
    active: "bg-success/15 text-success border-success/30",
    pending: "bg-warning/15 text-warning border-warning/30",
    pending_approval: "bg-warning/15 text-warning border-warning/30",
    pendingSupervisorApproval: "bg-warning/15 text-warning border-warning/30",
    pendingAdvisorApproval: "bg-warning/15 text-warning border-warning/30",
    waitlisted: "bg-secondary text-foreground border-border",
    completed: "bg-primary/15 text-primary border-primary/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
    dropped: "bg-muted text-foreground border-border",
  }
  const labelMap: Record<string, string> = {
    pending_approval: "Pending payment",
    pendingSupervisorApproval: "Pending review",
    pendingAdvisorApproval: "Pending advisor approval",
    cancelled: "Cancelled",
    rejected: "Rejected",
    dropped: "Dropped",
  }
  const style = styles[status] ?? "bg-secondary text-foreground border-border"
  const icon = status === "completed" ? <ShieldCheck className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${style}`}>
      {icon}
      {labelMap[status] ?? status}
    </span>
  )
}

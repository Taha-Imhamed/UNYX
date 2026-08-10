"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Enrollment } from "@shared/types"
import { BookOpen, Star } from "lucide-react"

interface GradesTableProps {
  enrollments: Enrollment[]
}

export function GradesTable({ enrollments }: GradesTableProps) {
  const graded = enrollments.filter((enr) => enr.grade || enr.status === "completed")

  return (
    <Card className="border border-border bg-card" id="grades">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Star className="h-5 w-5 text-primary" />
          Grades (read-only)
        </CardTitle>
        <Badge variant="secondary" className="text-foreground">
          {graded.length} records
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {graded.length === 0 ? (
          <p className="text-sm text-muted-foreground">No grades available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-border/60 rounded-xl overflow-hidden">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Course</th>
                  <th className="text-left px-4 py-2 font-semibold">Professor</th>
                  <th className="text-left px-4 py-2 font-semibold">Status</th>
                  <th className="text-left px-4 py-2 font-semibold">Grade</th>
                </tr>
              </thead>
              <tbody>
                {graded.map((enrollment) => (
                  <tr key={enrollment.id} className="border-t border-border/60 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-foreground font-semibold">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span>{enrollment.courseTitle}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{enrollment.displayId}</div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{enrollment.professorName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{enrollment.status}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-foreground border-border">
                        {enrollment.grade ?? "Pending"}
                      </Badge>
                    </td>
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

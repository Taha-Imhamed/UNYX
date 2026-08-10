"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Trash2 } from "lucide-react"
import { useStudentEnrollments } from "@/hooks/use-student-portal"
import { StudentFeatureGate } from "@/components/student-feature-gate"

interface HypotheticalCourse {
  id: string
  label: string
  grade: string
}

function percentToGpa(percent: number) {
  return Math.max(0, Math.min(4, percent / 25))
}

export default function GpaCalculatorPage() {
  return (
    <StudentFeatureGate featureKey="gpa-calculator">
      <GpaCalculatorPageInner />
    </StudentFeatureGate>
  )
}

function GpaCalculatorPageInner() {
  const { enrollments, isLoading } = useStudentEnrollments()
  const [hypothetical, setHypothetical] = useState<HypotheticalCourse[]>([])
  const [newLabel, setNewLabel] = useState("")
  const [newGrade, setNewGrade] = useState("")

  const gradedCourses = useMemo(
    () =>
      enrollments
        .filter((enr) => typeof enr.gradeTotal === "number" && !Number.isNaN(enr.gradeTotal))
        .map((enr) => ({ id: enr.id, label: enr.courseTitle, percent: enr.gradeTotal as number })),
    [enrollments],
  )

  const currentGpa = useMemo(() => {
    if (gradedCourses.length === 0) return null
    const avg = gradedCourses.reduce((sum, c) => sum + c.percent, 0) / gradedCourses.length
    return percentToGpa(avg)
  }, [gradedCourses])

  const projectedGpa = useMemo(() => {
    const validHypothetical = hypothetical
      .map((h) => ({ ...h, percent: Number(h.grade) }))
      .filter((h) => Number.isFinite(h.percent) && h.percent >= 0 && h.percent <= 100)
    const all = [...gradedCourses.map((c) => c.percent), ...validHypothetical.map((h) => h.percent)]
    if (all.length === 0) return null
    const avg = all.reduce((sum, p) => sum + p, 0) / all.length
    return percentToGpa(avg)
  }, [gradedCourses, hypothetical])

  const addHypothetical = () => {
    if (!newLabel.trim() || !newGrade.trim()) return
    const percent = Number(newGrade)
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return
    setHypothetical((prev) => [...prev, { id: `H-${Date.now()}`, label: newLabel.trim(), grade: newGrade.trim() }])
    setNewLabel("")
    setNewGrade("")
  }

  const removeHypothetical = (id: string) => {
    setHypothetical((prev) => prev.filter((h) => h.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">GPA Calculator</p>
        <h1 className="text-2xl font-bold text-foreground">What-if GPA planner</h1>
        <p className="text-sm text-muted-foreground">See how future grades would affect your overall GPA.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle>Current GPA</CardTitle>
            <CardDescription>Based on {gradedCourses.length} graded course(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading
              </div>
            ) : (
              <p className="text-4xl font-bold text-foreground">{currentGpa !== null ? currentGpa.toFixed(2) : "N/A"}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle>Projected GPA</CardTitle>
            <CardDescription>Including {hypothetical.length} hypothetical course(s) below</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">{projectedGpa !== null ? projectedGpa.toFixed(2) : "N/A"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Add a hypothetical course</CardTitle>
          <CardDescription>Enter an expected grade (0-100) for a course you haven't finished yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="courseLabel">Course name</Label>
              <Input id="courseLabel" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Data Structures" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseGrade">Expected grade (%)</Label>
              <Input id="courseGrade" type="number" min="0" max="100" value={newGrade} onChange={(e) => setNewGrade(e.target.value)} placeholder="e.g. 85" />
            </div>
            <div className="flex items-end">
              <Button onClick={addHypothetical} className="w-full sm:w-auto">
                Add
              </Button>
            </div>
          </div>

          {hypothetical.length > 0 && (
            <div className="space-y-2">
              {hypothetical.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.label}</p>
                    <p className="text-xs text-muted-foreground">Expected: {h.grade}%</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeHypothetical(h.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Your graded courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {gradedCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No graded courses yet.</p>
          ) : (
            gradedCourses.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-sm text-foreground">{c.label}</p>
                <Badge variant="outline">{c.percent}%</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

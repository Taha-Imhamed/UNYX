"use client"

import { useMemo, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, BarChart3, TrendingDown, TrendingUp } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import { EMPTY_CAMPUSES, EMPTY_DEPARTMENTS } from "@/components/enrollment/shared"
import { useAcademicStructure } from "@/hooks/enrollment/use-academic-structure"
import { useCourses } from "@/hooks/enrollment/use-courses"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { useAuth } from "@/lib/auth-context"
import type { Course } from "@shared/types"

const UNDERFILLED_THRESHOLD = 0.3
const OVERFULL_THRESHOLD = 0.95

function getCourseFillRatio(course: Course & { enrolledCount?: number }) {
  const capacity = course.capacity ?? 0
  if (capacity <= 0) return 0
  return Math.min(1, (course.enrolledCount ?? 0) / capacity)
}

export default function EnrollmentUtilizationPage() {
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const canManageEnrollment = hasPermission("enrollment:manage") && user?.role !== "professor"
  const canViewEnrollment = canManageEnrollment || hasPermission("enrollment:view") || user?.role === "professor"
  const enabled = !authLoading && canViewEnrollment

  const { courses, isLoading: coursesLoading, error: coursesError } = useCourses({ enabled, refreshKey: refreshVersion })
  const { academicStructure } = useAcademicStructure({ enabled, refreshKey: refreshVersion })
  const departments = academicStructure?.departments ?? EMPTY_DEPARTMENTS
  const campuses = academicStructure?.campuses ?? EMPTY_CAMPUSES

  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [campusFilter, setCampusFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"fill_desc" | "fill_asc">("fill_desc")

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (departmentFilter !== "all" && (course.department ?? "") !== departmentFilter) return false
      if (campusFilter !== "all" && (course.branch ?? "") !== campusFilter) return false
      return true
    })
  }, [courses, departmentFilter, campusFilter])

  const sortedCourses = useMemo(() => {
    const list = [...filteredCourses]
    list.sort((a, b) => {
      const ratioA = getCourseFillRatio(a)
      const ratioB = getCourseFillRatio(b)
      return sortBy === "fill_desc" ? ratioB - ratioA : ratioA - ratioB
    })
    return list
  }, [filteredCourses, sortBy])

  const stats = useMemo(() => {
    const totalCapacity = filteredCourses.reduce((sum, c) => sum + (c.capacity ?? 0), 0)
    const totalEnrolled = filteredCourses.reduce((sum, c) => sum + ((c as Course & { enrolledCount?: number }).enrolledCount ?? 0), 0)
    const underfilled = filteredCourses.filter((c) => (c.capacity ?? 0) > 0 && getCourseFillRatio(c as Course & { enrolledCount?: number }) < UNDERFILLED_THRESHOLD)
    const overfull = filteredCourses.filter((c) => getCourseFillRatio(c as Course & { enrolledCount?: number }) >= OVERFULL_THRESHOLD)
    return {
      totalCapacity,
      totalEnrolled,
      overallFillRate: totalCapacity > 0 ? totalEnrolled / totalCapacity : 0,
      underfilledCount: underfilled.length,
      overfullCount: overfull.length,
    }
  }, [filteredCourses])

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!canViewEnrollment) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>You need enrollment view or manage permissions to access this area.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Seat Utilization" description="How full each course is, aggregated by department and campus" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav />

          {coursesError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load data</AlertTitle>
              <AlertDescription>{coursesError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-sky-100">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Overall fill rate</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-900">{Math.round(stats.overallFillRate * 100)}%</p>
                  <p className="text-xs text-slate-500">{stats.totalEnrolled}/{stats.totalCapacity} seats</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-rose-100">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Near/at capacity</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.overfullCount}</p>
                  <p className="text-xs text-slate-500">≥ {Math.round(OVERFULL_THRESHOLD * 100)}% full</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-100">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Underfilled</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.underfilledCount}</p>
                  <p className="text-xs text-slate-500">&lt; {Math.round(UNDERFILLED_THRESHOLD * 100)}% full</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Courses shown</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-900">{filteredCourses.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-base">Courses by fill rate</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={campusFilter} onValueChange={setCampusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All campuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All campuses</SelectItem>
                    {campuses.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fill_desc">Fullest first</SelectItem>
                    <SelectItem value="fill_asc">Emptiest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Loading courses…
                </div>
              ) : sortedCourses.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No courses match these filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Campus</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Fill</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedCourses.map((course) => {
                        const enrolledCount = (course as Course & { enrolledCount?: number }).enrolledCount ?? 0
                        const capacity = course.capacity ?? 0
                        const ratio = getCourseFillRatio(course as Course & { enrolledCount?: number })
                        const isOverfull = ratio >= OVERFULL_THRESHOLD
                        const isUnderfilled = capacity > 0 && ratio < UNDERFILLED_THRESHOLD
                        return (
                          <TableRow key={course.id}>
                            <TableCell>
                              <p className="font-medium text-foreground">{course.title}</p>
                              <p className="text-xs text-muted-foreground">{course.code}</p>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{course.branch || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{enrolledCount}/{capacity}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className={`h-full ${isOverfull ? "bg-rose-500" : isUnderfilled ? "bg-amber-400" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.round(ratio * 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{Math.round(ratio * 100)}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {isOverfull ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Full
                                </Badge>
                              ) : isUnderfilled ? (
                                <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700">
                                  <TrendingDown className="h-3 w-3" />
                                  Underfilled
                                </Badge>
                              ) : (
                                <Badge variant="outline">Healthy</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

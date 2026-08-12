"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminKpiCard } from "@/components/admin-kpi-card"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  ArrowDownAZ,
  ArrowUpDown,
  Award,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSearch,
  GraduationCap,
  RefreshCcw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react"

interface DepartmentRow {
  department: string
  courseCount: number
  professorCount: number
  enrollmentCount: number
  completedCount: number
  passRate: number | null
  averageGrade: number | null
}

interface AcademicOverview {
  totalStudents: number
  totalProfessors: number
  totalCourses: number
  totalEnrollments: number
  departments: DepartmentRow[]
}

interface FacultyPerformanceRow {
  professorId: string
  professorName: string
  department: string
  status: string
  courseCount: number
  studentCount: number
  averageGrade: number | null
}

interface GradeChangeRequestRow {
  id: string
  courseCode?: string | null
  courseTitle?: string | null
  studentName: string
  professorName: string
  reason: string
  status: string
}

interface GraduationApprovalRow {
  id: string
  studentId: string
  program: string
  approvedBy: string
  status: string
  remarks?: string | null
}

interface ApprovalsInbox {
  gradeChangeRequests: GradeChangeRequestRow[]
  graduationApprovals: GraduationApprovalRow[]
  totalPending: number
}

const quickActions = [
  { label: "Faculty directory", href: "/dashboard/professors", icon: Users },
  { label: "Student records", href: "/dashboard/students", icon: GraduationCap },
  { label: "Reports", href: "/dashboard/report", icon: FileSearch },
  { label: "Finance / budget", href: "/dashboard/finance", icon: Wallet },
  { label: "Audit logs", href: "/dashboard/audit", icon: ShieldCheck },
]

type FacultySortKey = "professorName" | "studentCount" | "courseCount" | "averageGrade"

function passRateTone(rate: number | null) {
  if (rate === null) return "bg-[#eef2fc] text-[#2f56c8]"
  if (rate >= 75) return "bg-[#e6f6ee] text-[#1f9d61]"
  if (rate >= 50) return "bg-[#fdf5e7] text-[#a5761a]"
  return "bg-[#fdecec] text-[#d15656]"
}

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function DeanDashboardPage() {
  const [overview, setOverview] = useState<AcademicOverview | null>(null)
  const [faculty, setFaculty] = useState<FacultyPerformanceRow[]>([])
  const [approvals, setApprovals] = useState<ApprovalsInbox | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [deptSearch, setDeptSearch] = useState("")
  const [facultySearch, setFacultySearch] = useState("")
  const [facultyStatusFilter, setFacultyStatusFilter] = useState<string>("all")
  const [facultySort, setFacultySort] = useState<{ key: FacultySortKey; dir: "asc" | "desc" }>({ key: "studentCount", dir: "desc" })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function loadAll(signal?: AbortSignal, silent = false) {
    if (silent) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)
    try {
      const [overviewRes, facultyRes, approvalsRes] = await Promise.all([
        apiFetch<AcademicOverview>("/dean/academic-overview", { signal }),
        apiFetch<FacultyPerformanceRow[]>("/dean/faculty-performance", { signal }),
        apiFetch<ApprovalsInbox>("/dean/approvals", { signal }),
      ])
      setOverview(overviewRes)
      setFaculty(facultyRes)
      setApprovals(approvalsRes)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dean workspace data")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    loadAll(controller.signal)
    return () => controller.abort()
  }, [])

  async function reviewGradeChange(id: string, status: "approved" | "rejected") {
    setActingId(id)
    try {
      await apiFetch(`/dean/approvals/grade-change/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
      await loadAll(undefined, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review grade change request")
    } finally {
      setActingId(null)
    }
  }

  async function reviewGraduation(id: string, status: "approved" | "rejected") {
    setActingId(id)
    try {
      await apiFetch(`/dean/approvals/graduation/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
      await loadAll(undefined, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review graduation approval")
    } finally {
      setActingId(null)
    }
  }

  const filteredDepartments = useMemo(() => {
    const q = deptSearch.trim().toLowerCase()
    const rows = overview?.departments ?? []
    if (!q) return rows
    return rows.filter((row) => row.department.toLowerCase().includes(q))
  }, [overview, deptSearch])

  const facultyStatuses = useMemo(() => {
    return Array.from(new Set(faculty.map((row) => row.status))).sort()
  }, [faculty])

  const filteredFaculty = useMemo(() => {
    const q = facultySearch.trim().toLowerCase()
    let rows = faculty
    if (q) {
      rows = rows.filter(
        (row) => row.professorName.toLowerCase().includes(q) || row.department.toLowerCase().includes(q),
      )
    }
    if (facultyStatusFilter !== "all") {
      rows = rows.filter((row) => row.status === facultyStatusFilter)
    }
    const sorted = [...rows].sort((a, b) => {
      const { key, dir } = facultySort
      const av = a[key]
      const bv = b[key]
      const mult = dir === "asc" ? 1 : -1
      if (av === null) return 1
      if (bv === null) return -1
      if (typeof av === "string" || typeof bv === "string") {
        return String(av).localeCompare(String(bv)) * mult
      }
      return ((av as number) - (bv as number)) * mult
    })
    return sorted
  }, [faculty, facultySearch, facultyStatusFilter, facultySort])

  function toggleFacultySort(key: FacultySortKey) {
    setFacultySort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }))
  }

  if (isLoading) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="h-5 w-5" />
      </div>
    )
  }

  const pendingCount = approvals?.totalPending ?? 0

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(247,251,255,0.92)_100%)] p-4 pb-10 shadow-[0_18px_48px_-30px_rgba(44,83,130,0.34)] md:p-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[#7382a3]">Role Workspace</p>
            <h1 className="text-[24px] font-extrabold text-[#16224a]">Dean Dashboard</h1>
            <p className="mt-1 text-sm text-[#69769a]">Cross-department oversight, faculty performance, and pending approvals — all in one place.</p>
          </div>
          <div className="flex items-center gap-2.5">
            {lastUpdated && (
              <span className="hidden text-[11px] text-[#8592b3] sm:inline">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              onClick={() => loadAll(undefined, true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-[11px] border border-[#dde3f0] bg-white px-3.5 py-2 text-[13px] font-bold text-[#2b3a63] transition-colors hover:border-[#2f56c8] hover:bg-[#eef2fc] disabled:opacity-60"
            >
              <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </button>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6e0f7] bg-[#eef2fc] px-3.5 py-2 text-[13px] font-bold text-[#2f56c8]">
              <span className="h-2 w-2 rounded-full bg-[#2f56c8]" />
              Dean
            </span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load dean workspace</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminKpiCard label="Total Students" value={overview?.totalStudents ?? 0} icon={GraduationCap} caption="across all departments" href="/dashboard/students" />
          <AdminKpiCard label="Total Faculty" value={overview?.totalProfessors ?? 0} icon={Users} caption="active + on leave" href="/dashboard/professors" />
          <AdminKpiCard label="Departments" value={overview?.departments.length ?? 0} icon={Building2} caption="tracked units" />
          <AdminKpiCard
            label="Pending Approvals"
            value={pendingCount}
            icon={CheckCircle2}
            deltaLabel={pendingCount === 0 ? "All clear" : "Action needed"}
            deltaTone={pendingCount === 0 ? "positive" : "neutral"}
            caption={pendingCount === 0 ? "nothing to review" : "grade + graduation"}
          />
        </div>

        {/* Quick access */}
        <div className="rounded-[16px] border border-[#e5eaf4] bg-white p-[18px] shadow-[0_4px_18px_rgba(30,45,90,0.05)]">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList className="h-[16px] w-[16px] text-[#2f56c8]" />
            <h2 className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-[#16224a]">Quick access</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-2 rounded-[12px] border border-[#dde5f4] bg-[#f7f9fe] p-3 text-[13px] font-semibold text-[#2b3a63] transition-colors hover:border-[#2f56c8] hover:bg-[#eef2fc]"
              >
                <action.icon className="h-[16px] w-[16px] shrink-0 text-[#2f56c8]" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <Tabs defaultValue="departments" className="w-full">
          <TabsList className="h-auto w-full flex-wrap gap-1 sm:w-fit">
            <TabsTrigger value="departments" className="px-4 py-2">Departments</TabsTrigger>
            <TabsTrigger value="faculty" className="px-4 py-2 whitespace-nowrap">Faculty performance</TabsTrigger>
            <TabsTrigger value="approvals" className="px-4 py-2">
              Approvals
              {pendingCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d15656] px-1 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Departments tab */}
          <TabsContent value="departments" className="mt-4">
            <Card className="border-[#e5eaf4] shadow-[0_4px_18px_rgba(30,45,90,0.05)]">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Department comparison</CardTitle>
                  <CardDescription>Enrollment, faculty load, and pass-rate by department.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8592b3]" />
                    <Input
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                      placeholder="Search department..."
                      className="h-8 w-[190px] pl-8 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      downloadCsv(
                        "department-comparison.csv",
                        filteredDepartments.map((row) => ({
                          department: row.department,
                          courses: row.courseCount,
                          faculty: row.professorCount,
                          enrollments: row.enrollmentCount,
                          averageGrade: row.averageGrade ?? "",
                          passRate: row.passRate ?? "",
                        })),
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#dde3f0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2b3a63] hover:border-[#2f56c8] hover:bg-[#eef2fc]"
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-4">Department</th>
                      <th className="py-2 pr-4">Courses</th>
                      <th className="py-2 pr-4">Faculty</th>
                      <th className="py-2 pr-4">Enrollments</th>
                      <th className="py-2 pr-4">Avg grade</th>
                      <th className="py-2 pr-4">Pass rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((row) => (
                      <tr key={row.department} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium">{row.department}</td>
                        <td className="py-2.5 pr-4">{row.courseCount}</td>
                        <td className="py-2.5 pr-4">{row.professorCount}</td>
                        <td className="py-2.5 pr-4">{row.enrollmentCount}</td>
                        <td className="py-2.5 pr-4">{row.averageGrade ?? "—"}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            {row.passRate !== null && <Progress value={row.passRate} className="h-1.5 w-20" />}
                            <span className={cn("rounded-full px-2 py-[2px] text-[11px] font-bold", passRateTone(row.passRate))}>
                              {row.passRate !== null ? `${row.passRate}%` : "No data yet"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDepartments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          {deptSearch ? "No departments match your search." : "No department data available."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Faculty tab */}
          <TabsContent value="faculty" className="mt-4">
            <Card className="border-[#e5eaf4] shadow-[0_4px_18px_rgba(30,45,90,0.05)]">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Faculty performance</CardTitle>
                  <CardDescription>Teaching load and average grades given, per professor. Click a column to sort.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 rounded-md border border-[#dde3f0] bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setFacultyStatusFilter("all")}
                      className={cn(
                        "rounded px-2 py-1 text-[11px] font-semibold capitalize transition-colors",
                        facultyStatusFilter === "all" ? "bg-[#eef2fc] text-[#2f56c8]" : "text-[#69769a] hover:text-[#2f56c8]",
                      )}
                    >
                      All
                    </button>
                    {facultyStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFacultyStatusFilter(status)}
                        className={cn(
                          "rounded px-2 py-1 text-[11px] font-semibold capitalize transition-colors",
                          facultyStatusFilter === status ? "bg-[#eef2fc] text-[#2f56c8]" : "text-[#69769a] hover:text-[#2f56c8]",
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8592b3]" />
                    <Input
                      value={facultySearch}
                      onChange={(e) => setFacultySearch(e.target.value)}
                      placeholder="Search faculty or department..."
                      className="h-8 w-[220px] pl-8 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => toggleFacultySort("professorName")} className="inline-flex items-center gap-1 hover:text-[#2f56c8]">
                          Professor <ArrowDownAZ className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="py-2 pr-4">Department</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => toggleFacultySort("courseCount")} className="inline-flex items-center gap-1 hover:text-[#2f56c8]">
                          Courses <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => toggleFacultySort("studentCount")} className="inline-flex items-center gap-1 hover:text-[#2f56c8]">
                          Students <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="py-2 pr-4">
                        <button type="button" onClick={() => toggleFacultySort("averageGrade")} className="inline-flex items-center gap-1 hover:text-[#2f56c8]">
                          Avg grade given <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFaculty.map((row) => (
                      <tr key={row.professorId} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium">{row.professorName}</td>
                        <td className="py-2.5 pr-4">{row.department}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="outline" className="capitalize">{row.status}</Badge>
                        </td>
                        <td className="py-2.5 pr-4">{row.courseCount}</td>
                        <td className="py-2.5 pr-4">{row.studentCount}</td>
                        <td className="py-2.5 pr-4">{row.averageGrade ?? "—"}</td>
                      </tr>
                    ))}
                    {filteredFaculty.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          {facultySearch ? "No faculty match your search." : "No faculty records available."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals tab */}
          <TabsContent value="approvals" className="mt-4 space-y-4">
            <Card className="border-[#e5eaf4] shadow-[0_4px_18px_rgba(30,45,90,0.05)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-[18px] w-[18px] text-[#2f56c8]" /> Grade change requests
                </CardTitle>
                <CardDescription>Escalated grade changes awaiting dean sign-off.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {approvals?.gradeChangeRequests.map((request) => (
                  <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e5eaf4] bg-[#f7f9fe] p-3.5">
                    <div>
                      <p className="text-sm font-bold text-[#16224a]">{request.courseCode ?? request.courseTitle ?? request.id}</p>
                      <p className="text-xs text-[#69769a]">{request.studentName} · requested by {request.professorName}</p>
                      <p className="text-xs text-[#69769a]">{request.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={actingId === request.id}
                        onClick={() => reviewGradeChange(request.id, "approved")}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={actingId === request.id}
                        onClick={() => reviewGradeChange(request.id, "rejected")}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
                {(!approvals || approvals.gradeChangeRequests.length === 0) && (
                  <p className="py-2 text-sm text-muted-foreground">No pending grade change requests.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#e5eaf4] shadow-[0_4px_18px_rgba(30,45,90,0.05)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-[18px] w-[18px] text-[#2f56c8]" /> Graduation approvals
                </CardTitle>
                <CardDescription>Final graduation sign-off queue.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {approvals?.graduationApprovals.map((approval) => (
                  <div key={approval.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e5eaf4] bg-[#f7f9fe] p-3.5">
                    <div>
                      <p className="text-sm font-bold text-[#16224a]">{approval.program}</p>
                      <p className="text-xs text-[#69769a]">Student {approval.studentId} · submitted by {approval.approvedBy}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={actingId === approval.id}
                        onClick={() => reviewGraduation(approval.id, "approved")}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={actingId === approval.id}
                        onClick={() => reviewGraduation(approval.id, "rejected")}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
                {(!approvals || approvals.graduationApprovals.length === 0) && (
                  <p className="py-2 text-sm text-muted-foreground">No pending graduation approvals.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

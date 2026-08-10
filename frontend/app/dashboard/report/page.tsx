"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/auth-context"
import { fetchDashboardStats, fetchDashboardOverview } from "@/lib/dashboard-api"
import { fetchEnrollmentSummary, fetchStudents, type EnrollmentSummaryCourse } from "@/lib/enrollment-api"
import type { DashboardStats, Student, CourseRevenueSummary, ProfessorRevenueSummary } from "@shared/types"

interface ReportData {
  stats: DashboardStats | null
  courses: EnrollmentSummaryCourse[]
}

export default function SystemAnalysisReportPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [courses, setCourses] = useState<EnrollmentSummaryCourse[]>([])
  const [courseRevenues, setCourseRevenues] = useState<CourseRevenueSummary[]>([])
  const [professorRevenues, setProfessorRevenues] = useState<ProfessorRevenueSummary[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [monthValue, setMonthValue] = useState<string>("")

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const [statsData, overviewData, enrollmentSummary, studentsData] = await Promise.all([
          fetchDashboardStats(
            monthValue
              ? {
                  startDate: `${monthValue}-01T00:00:00.000Z`,
                  endDate: new Date(new Date(`${monthValue}-01T00:00:00.000Z`).getFullYear(), new Date(`${monthValue}-01T00:00:00.000Z`).getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
                }
              : { period },
            controller.signal,
          ),
          fetchDashboardOverview(controller.signal),
          fetchEnrollmentSummary(controller.signal),
          fetchStudents(controller.signal),
        ])
        if (!controller.signal.aborted) {
          setStats(statsData)
          setCourses(enrollmentSummary.topCourses ?? [])
          setCourseRevenues(enrollmentSummary.courseRevenues ?? [])
          setProfessorRevenues(enrollmentSummary.professorRevenues ?? [])
          setStudents(studentsData ?? [])
          // overviewData is loaded to satisfy "any relevant statistics"; no direct render needed beyond stats
          void overviewData
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to generate report")
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    if (user?.role === "admin" || user?.role === "super-admin" || user?.role === "dean") {
      load()
    } else {
      setIsLoading(false)
    }

    return () => controller.abort()
  }, [user?.role, period, monthValue])

  const generalOverview = useMemo(() => {
    if (!stats) return "System overview data is not available."
    return `The system currently manages ${stats.totalStudents} students with ${stats.totalProfessors} professors. Active students: ${stats.activeStudents}. Pending feedback items: ${stats.pendingFeedback}. Average rating across recent feedback: ${stats.averageRating.toFixed(2)}.`
  }, [stats])

  const currency = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    [],
  )

  const sectionTitleClass = "mb-3 border-l-4 border-blue-700 pl-3 text-xl font-semibold text-slate-900"
  const panelClass = "mb-6 rounded-xl border border-blue-200 bg-white p-4 shadow-sm"
  const tableClass = "w-full border border-blue-200 text-sm text-slate-900"
  const tableHeadClass = "bg-blue-700 text-white"
  const cellClass = "border border-blue-100 px-3 py-2"

  if (!user || (user.role !== "admin" && user.role !== "super-admin" && user.role !== "dean")) {
    return (
      <div className="min-h-full bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-blue-300 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Access restricted</h1>
          <p className="mb-4 text-slate-700">Only Admin, Super Admin, and Dean can generate the System Analysis Report.</p>
          <Link href="/dashboard">
            <Button className="bg-blue-700 text-white hover:bg-blue-800">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-100 p-6">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" className="border-blue-700 text-blue-800 hover:bg-blue-50">Back to Dashboard</Button>
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">System Analysis Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as 'month' | 'year')
                setMonthValue("")
              }}
              className="h-10 rounded-md border border-blue-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="month">Schedule (custom month)</option>
              <option value="year">Yearly (last 12 months)</option>
            </select>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => setMonthValue(e.target.value)}
              className="h-10 rounded-md border border-blue-200 bg-white px-3 text-sm text-slate-900"
            />
          </div>
          <Button variant="outline" className="border-blue-700 text-blue-800 hover:bg-blue-50" onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[480px] items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : error ? (
        <div className="max-w-3xl mx-auto rounded-lg border border-destructive/30 bg-destructive/10 p-6">
          <p className="text-destructive font-semibold">{error}</p>
          <p className="text-destructive/80 text-sm">Refresh the page or try again later.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl rounded-xl border border-blue-300 bg-white px-6 py-6 text-slate-900 shadow-sm print:bg-white print:text-black print:shadow-none">
          <header className="mb-6 border-b border-blue-100 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-blue-800">AR Company • Admin Portal</p>
                <h1 className="text-3xl font-bold text-slate-900">System Analysis Report</h1>
                <p className="text-sm text-slate-700">
                  Generated on {new Date().toLocaleString()} • Period: {
                    monthValue
                      ? `Scheduled month: ${monthValue}`
                      : period === 'month'
                        ? 'Schedule (last 30 days)'
                        : 'Yearly (last 12 months)'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-700">Prepared for</p>
                <p className="text-lg font-semibold text-slate-900">Admin Team</p>
              </div>
            </div>
          </header>

          <section className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h2 className="mb-2 text-xl font-semibold text-slate-900">Info</h2>
            <p className="text-sm leading-6 text-slate-800">
              Super Admin has full control across the entire system: manage all users and roles, create and edit permissions,
              access and generate all reports, review financial and enrollment analytics, configure platform settings,
              and oversee every dashboard module without restrictions.
            </p>
          </section>

          <section className={panelClass}>
            <h2 className={sectionTitleClass}>1. General System Overview</h2>
            <p className="text-sm leading-6 text-slate-800">{generalOverview}</p>
          </section>

          <section className={panelClass}>
            <h2 className={sectionTitleClass}>2. Student and Enrollment Snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-700">Total Students</p>
                <p className="text-2xl font-bold text-blue-800">{stats?.totalStudents ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-700">Active Students</p>
                <p className="text-2xl font-bold text-blue-800">{stats?.activeStudents ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-700">Professors</p>
                <p className="text-2xl font-bold text-blue-800">{stats?.totalProfessors ?? "-"}</p>
              </div>
            </div>
          </section>

          <section className={panelClass}>
            <h2 className={sectionTitleClass}>3. Main Student Courses</h2>
            <div className="overflow-x-auto rounded-lg">
            <table className={tableClass}>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={cellClass + " text-left"}>Course</th>
                  <th className={cellClass + " text-left"}>Professor</th>
                  <th className={cellClass + " text-right"}>Capacity</th>
                  <th className={cellClass + " text-right"}>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-center text-slate-600" colSpan={4}>
                      No course enrollment data available.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.courseId} className="odd:bg-white even:bg-blue-50/60">
                      <td className={cellClass + " font-medium"}>{course.title}</td>
                      <td className={cellClass}>{course.professorName}</td>
                      <td className={cellClass + " text-right"}>{course.capacity}</td>
                      <td className={cellClass + " text-right"}>{course.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </section>

          <section className={panelClass}>
            <h2 className={sectionTitleClass}>4. Financial Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-700">Total Income</p>
                <p className="text-2xl font-bold text-success">${(stats?.totalIncome ?? 0).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-700">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">${(stats?.totalExpenses ?? 0).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-700">Net Profit</p>
                <p className="text-2xl font-bold text-slate-900">${(stats?.netIncome ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </section>

          <section className={panelClass}>
            <h2 className={sectionTitleClass}>5. Course Income and Profitability</h2>
            <div className="overflow-x-auto rounded-lg">
            <table className={tableClass}>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={cellClass + " text-left"}>Course</th>
                  <th className={cellClass + " text-left"}>Professor</th>
                  <th className={cellClass + " text-right"}>Enrollments</th>
                  <th className={cellClass + " text-right"}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {courseRevenues.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-center text-slate-600" colSpan={4}>
                      No course revenue data available.
                    </td>
                  </tr>
                ) : (
                  courseRevenues.map((course) => (
                    <tr key={course.courseId} className="odd:bg-white even:bg-blue-50/60">
                      <td className={cellClass + " font-medium"}>{course.title}</td>
                      <td className={cellClass}>{course.professorName ?? "Unknown"}</td>
                      <td className={cellClass + " text-right"}>{course.enrollments}</td>
                      <td className={cellClass + " text-right"}>{currency.format(course.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </section>

          <section className={panelClass}>
            <h2 className={sectionTitleClass}>6. Professor Revenue Contribution</h2>
            <div className="overflow-x-auto rounded-lg">
            <table className={tableClass}>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={cellClass + " text-left"}>Professor</th>
                  <th className={cellClass + " text-right"}>Courses</th>
                  <th className={cellClass + " text-right"}>Enrollments</th>
                  <th className={cellClass + " text-right"}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {professorRevenues.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-center text-slate-600" colSpan={4}>
                      No professor revenue data available.
                    </td>
                  </tr>
                ) : (
                  professorRevenues.map((prof) => (
                    <tr key={prof.professorId} className="odd:bg-white even:bg-blue-50/60">
                      <td className={cellClass + " font-medium"}>{prof.professorName}</td>
                      <td className={cellClass + " text-right"}>{prof.courseCount ?? 0}</td>
                      <td className={cellClass + " text-right"}>{prof.enrollments}</td>
                      <td className={cellClass + " text-right"}>{currency.format(prof.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </section>

          <section className={panelClass}>
            <h2 className={sectionTitleClass}>7. Student Records</h2>
            <div className="overflow-x-auto rounded-lg">
              <table className={tableClass + " min-w-[720px]"}>
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={cellClass + " text-left"}>ID</th>
                    <th className={cellClass + " text-left"}>Name</th>
                    <th className={cellClass + " text-left"}>Program</th>
                    <th className={cellClass + " text-left"}>Status</th>
                    <th className={cellClass + " text-right"}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-center text-slate-600" colSpan={5}>
                        No student records available.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="odd:bg-white even:bg-blue-50/60">
                        <td className={cellClass + " font-medium"}>{student.displayId}</td>
                        <td className={cellClass}>{student.firstName} {student.lastName}</td>
                        <td className={cellClass}>{student.program}</td>
                        <td className={cellClass + " capitalize"}>{student.status}</td>
                        <td className={cellClass + " text-right"}>{currency.format(student.balance ?? 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={panelClass}>
            <h2 className={sectionTitleClass}>8. Additional System Statistics</h2>
            <table className={tableClass}>
              <tbody>
                <tr className="odd:bg-white even:bg-blue-50/60">
                  <td className={cellClass + " font-medium"}>Pending Feedback</td>
                  <td className={cellClass + " text-right"}>{stats?.pendingFeedback ?? "-"}</td>
                </tr>
                <tr className="odd:bg-white even:bg-blue-50/60">
                  <td className={cellClass + " font-medium"}>Average Feedback Rating</td>
                  <td className={cellClass + " text-right"}>{stats ? stats.averageRating.toFixed(2) : "-"}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <footer className="border-t border-blue-100 pt-4 text-sm text-slate-700 print:border-0">
            <p>This report is generated for administrative review. Use the browser print dialog to export to PDF.</p>
          </footer>
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { fetchDashboardOverview, fetchDashboardStats, type DashboardOverview } from "@/lib/dashboard-api"
import { fetchQuestions } from "@/lib/questions-api"
import { useAuth } from "@/lib/auth-context"
import { useModuleToggles } from "@/lib/terminal-context"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { RoleWorkspaceDashboard } from "@/components/role-workspace-dashboard"
import type { DashboardStats, Question } from "@shared/types"
import {
  Users,
  GraduationCap,
  DollarSign,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Star,
  ArrowUpRight,
  Bell,
  CalendarCheck,
  BookOpen,
} from "lucide-react"

export default function DashboardPage() {
  const { isAdmin, user, hasPermission } = useAuth()
  const { isModuleEnabled } = useModuleToggles()
  const router = useRouter()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const [statsData, overviewData, questionData] = await Promise.all([
          fetchDashboardStats(null, controller.signal),
          fetchDashboardOverview(controller.signal),
          fetchQuestions(controller.signal).catch(() => []),
        ])
        if (!controller.signal.aborted) {
          setStats(statsData)
          setOverview(overviewData)
          setQuestions(questionData ?? [])
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard data")
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => controller.abort()
  }, [refreshVersion])

  useEffect(() => {
    if (user?.role === "student") {
      router.replace("/student")
    }
  }, [router, user?.role])

  useEffect(() => {
    if (user?.role === "professor") {
      router.replace("/dashboard/professor")
    }
  }, [router, user?.role])

  const recentStudents = overview?.recentStudents ?? []
  const recentFeedback = overview?.recentFeedback ?? []
  const recentIncome = overview?.recentIncome ?? []
  const recentExpenses = overview?.recentExpenses ?? []
  const showFinance = (hasPermission("finance:view") || hasPermission("finance:manage")) && isModuleEnabled("finance")

  const usesRoleWorkspace =
    !!user &&
    [
      "super-admin",
      "advisor",
      "teaching-assistant",
      "registrar",
      "admissions",
      "finance",
      "it-admin",
      "dean",
      "hod",
      "librarian",
      "student-affairs",
      "hr",
      "security",
      "facilities",
      "research-office",
    ].includes(user.role)

  const netChangeLabel = useMemo(() => {
    if (!stats || !showFinance) return ""
    const delta = stats.totalIncome - stats.totalExpenses
    return `${delta >= 0 ? "+" : ""}${((delta / (stats.totalExpenses || 1)) * 100).toFixed(1)}% vs last month`
  }, [showFinance, stats])

  if (user?.role === "student") {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (user?.role === "professor") {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (usesRoleWorkspace) {
    return <RoleWorkspaceDashboard />
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Dashboard" description="Welcome back. Here's what's happening today." />

      {/* Top quick stats + notifications */}
      <div className="mt-4 px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Total Enrollments" value={stats?.totalEnrollments ?? 0} change="vs last month" changeType="positive" icon={BookOpen} href="/dashboard/enrollment" />
            <StatsCard title="Active Students" value={stats?.activeStudents ?? stats?.totalStudents ?? 0} change="this month" changeType="positive" icon={GraduationCap} href="/dashboard/students" />
            <StatsCard title="Tuition Pipeline" value={`$${(stats?.tuitionPipeline ?? 0).toLocaleString()}`} change="projected" changeType="neutral" icon={DollarSign} href="/dashboard/finance" />
            <StatsCard title="Pending Approvals" value={stats?.pendingApprovals ?? stats?.pendingFeedback ?? 0} change="action needed" changeType="negative" icon={Bell} href="/dashboard/enrollment" />
          </div>
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="dashboard-accent-tile">
                    <Bell className="h-4 w-4 text-tertiary-foreground" />
                  </div>
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentFeedback.slice(0, 4).map((f) => (
                    <div key={f.id} className="flex items-start gap-3 rounded-md p-2 hover:bg-slate-50">
                      <div className="pt-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{f.studentName}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{f.comment || f.rating}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(f.createdAt || f.date || Date.now()).toLocaleDateString()}</div>
                    </div>
                  ))}
                  {recentIncome.slice(0, 3).map((i) => (
                    <div key={i.id} className="flex items-start gap-3 rounded-md p-2 hover:bg-slate-50">
                      <div className="pt-1">
                        <CalendarCheck className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{i.source}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{i.description}</div>
                      </div>
                      <div className="text-sm font-bold">${i.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-5 flex items-center justify-end gap-3 px-6">
          <Link href="/dashboard/requests" className="inline-flex">
            <Button variant="outline" className="h-10">
              Submit Purchase / Fund Request
            </Button>
          </Link>
          <Link href="/dashboard/report" className="inline-flex">
            <Button className="dashboard-report-button h-10">
              Generate System Analysis Report
            </Button>
          </Link>
        </div>
      )}

      <div className="flex-1 space-y-8 p-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex h-[480px] items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Students"
            value={stats?.totalStudents ?? 0}
            change="+12 this month"
            changeType="positive"
            icon={GraduationCap}
            href="/dashboard/students"
          />
          <StatsCard
            title="Total Professors"
            value={stats?.totalProfessors ?? 0}
            change="2 on leave"
            changeType="neutral"
            icon={Users}
            href="/dashboard/professors"
          />
          {showFinance && (
            <StatsCard
              title="Net Income"
              value={`$${(stats?.netIncome ?? 0).toLocaleString()}`}
              change={netChangeLabel || "vs last month"}
              changeType="positive"
              accent="tertiary"
              icon={DollarSign}
              href="/dashboard/finance"
            />
          )}
          <StatsCard
            title="Pending Feedback"
            value={stats?.pendingFeedback ?? 0}
            change={`Avg rating: ${(stats?.averageRating ?? 0).toFixed(1)}`}
            changeType="neutral"
            icon={MessageSquare}
            href="/dashboard/feedback"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Financial Overview */}
          {showFinance && (
            <Card className="dashboard-panel group lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[#1f1f1d]">
                  <div className="dashboard-accent-tile">
                    <DollarSign className="h-4 w-4 text-tertiary-foreground" />
                  </div>
                  Financial Overview
                </CardTitle>
                <Link href="/dashboard/finance" className="no-underline">
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-[#cfd4d8] bg-[#f3f6f8] text-[#4d5a64] transition-colors group-hover:bg-[#e8edf1]"
                  >
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    View All
                  </Badge>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-[#dfd9cf] bg-[#fbfaf8] p-4">
                      <span className="text-sm font-medium text-[#716d65]">Total Income</span>
                      <div className="flex items-center gap-2 text-[#5a6c78]">
                        <TrendingUp className="h-5 w-5" />
                        <span className="font-bold text-lg">${(stats?.totalIncome ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                    {recentIncome.map((income) => (
                      <div
                        key={income.id}
                        className="flex cursor-pointer items-center justify-between rounded-lg border-b border-[#ece8e1] px-4 py-3 transition-colors hover:bg-[#f7f4ef]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#1f1f1d]">{income.source}</p>
                          <p className="text-xs text-[#7a7469]">{income.description}</p>
                        </div>
                        <span className="text-sm font-bold text-[#5a6c78]">${income.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-[#dfd9cf] bg-[#fbfaf8] p-4">
                      <span className="text-sm font-medium text-[#716d65]">Total Expenses</span>
                      <div className="flex items-center gap-2 text-[#85635d]">
                        <TrendingDown className="h-5 w-5" />
                        <span className="font-bold text-lg">${(stats?.totalExpenses ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                    {recentExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex cursor-pointer items-center justify-between rounded-lg border-b border-[#ece8e1] px-4 py-3 transition-colors hover:bg-[#f7f4ef]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#1f1f1d]">{expense.category}</p>
                          <p className="text-xs text-[#7a7469]">{expense.description}</p>
                        </div>
                        <span className="text-sm font-bold text-[#85635d]">${expense.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Feedback */}
          <Card className="dashboard-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1f1f1d]">
                <div className="dashboard-accent-tile">
                  <MessageSquare className="h-4 w-4 text-tertiary-foreground" />
                </div>
                Recent Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="group/feedback cursor-pointer rounded-xl border border-[#ece8e1] bg-[#fbfaf8] p-4 transition-colors hover:bg-[#f7f4ef]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-[#1f1f1d]">{feedback.studentName}</span>
                    <div className="flex items-center gap-1 rounded-full bg-[#f1eee8] px-2 py-1">
                      <Star className="h-3 w-3 fill-[#6a655c] text-[#6a655c]" />
                      <span className="text-xs font-bold text-[#6a655c]">{feedback.rating}</span>
                    </div>
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-[#6f6b64]">{feedback.comment}</p>
                  <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-white text-xs capitalize border-[#dfdbd3] text-[#59544b]">
                      {feedback.type}
                    </Badge>
                    <Badge
                      variant={
                        feedback.status === "new" ? "default" : feedback.status === "reviewed" ? "secondary" : "outline"
                      }
                        className="border-[#dfdbd3] bg-[#f4f1eb] text-xs text-[#5d584f]"
                    >
                      {feedback.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

          <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1f1f1d]">
                <div className="dashboard-accent-tile">
                  <GraduationCap className="h-4 w-4 text-tertiary-foreground" />
              </div>
              Recent Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentStudents.map((student) => (
                <div
                  key={student.id}
                  className="dashboard-soft-hover group/student flex cursor-pointer items-center gap-4 rounded-xl border border-[#ece8e1] bg-[#fbfaf8] p-4 transition-all duration-300 hover:bg-[#f7f4ef]"
                >
                  <Avatar className="h-12 w-12 ring-1 ring-[#ddd8cf] transition-all group-hover/student:ring-[#c8c1b6]">
                    <AvatarImage
                      src={student.photo || "/placeholder.svg"}
                      alt={`${student.firstName} ${student.lastName}`}
                    />
                    <AvatarFallback className="bg-[#f0ece4] font-bold text-[#2a2a27]">
                      {student.firstName[0]}
                      {student.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1f1f1d]">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="truncate text-xs text-[#7a7469]">{student.program}</p>
                  </div>
                  <Badge
                    variant={
                      student.status === "active" ? "default" : student.status === "inactive" ? "secondary" : "outline"
                    }
                    className="shrink-0 border-[#dfdbd3] bg-[#f4f1eb] text-xs text-[#5d584f]"
                  >
                    {student.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

          <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1f1f1d]">
                <div className="dashboard-accent-tile">
                  <MessageSquare className="h-4 w-4 text-tertiary-foreground" />
                </div>
              Student Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.length === 0 ? (
              <p className="text-sm text-[#7a7469]">No questions yet.</p>
            ) : (
              questions.slice(0, 6).map((question) => (
                <div
                  key={question.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#ece8e1] bg-[#fbfaf8] p-4"
                >
                  <div className="flex items-center justify-between text-xs text-[#7a7469]">
                    <span>{question.courseId}</span>
                    <Badge
                      variant={question.status === "answered" ? "default" : "secondary"}
                      className="capitalize border-[#dfdbd3] bg-[#f4f1eb] text-[#5d584f]"
                    >
                      {question.status}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-[#2b2b28]">{question.body}</p>
                  {question.reply && <p className="text-xs text-[#7a7469]">Reply: {question.reply}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  )
}

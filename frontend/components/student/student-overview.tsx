"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/stats-card"
import useLiveSync from "@/hooks/use-live-sync"
import { useEnrollmentWindow, useStudentHints, useStudentProfile, useStudentEnrollments, useStudentFinancials } from "@/hooks/use-student-portal"
import { useAuth } from "@/lib/auth-context"
import { fetchNews } from "@/lib/news-api"
import { deriveStudentYearLevel } from "@/lib/academic-terms"
import type { NewsItem, UserNotification } from "@shared/types"
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  DollarSign,
  FileText,
  GraduationCap,
  LifeBuoy,
  Lock,
  Megaphone,
  Sparkles,
  Wallet,
} from "lucide-react"

function Sparkline({ values }: { values: number[] }) {
  if (!values || values.length === 0) return null
  const w = 120
  const h = 36
  const max = Math.max(...values, 1)
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w
      const y = h - (v / max) * h
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.9} />
      <polyline points={points} fill="none" stroke="var(--muted)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.25} />
    </svg>
  )
}

function deriveAcademicYear(student: Parameters<typeof deriveStudentYearLevel>[0], enrollmentDate?: string | null) {
  const yearLevel = deriveStudentYearLevel(student)
  if (yearLevel) return `Year ${yearLevel}`

  if (enrollmentDate) {
    const start = new Date(enrollmentDate)
    if (!Number.isNaN(start.getTime())) {
      const years = Math.max(1, new Date().getFullYear() - start.getFullYear() + 1)
      return `Year ${years}`
    }
  }

  return "Year not set"
}

export function StudentOverviewPage() {
  const { user, fetchUserNotifications } = useAuth()
  useLiveSync()
  const { profile } = useStudentProfile()
  const { enrollments } = useStudentEnrollments()
  const { financials, isLoading: financialsLoading } = useStudentFinancials()
  const { enrollmentWindow } = useEnrollmentWindow()
  useStudentHints()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [announcements, setAnnouncements] = useState<NewsItem[]>([])

  const active = enrollments.filter((enr) =>
    ["active", "pending", "pendingSupervisorApproval", "pendingAdvisorApproval", "waitlisted"].includes(enr.status),
  )
  const completed = enrollments.filter((enr) => enr.status === "completed")
  const balance = financials?.balance ?? 0
  const assignmentSubmissions = enrollments.filter(
    (enr) =>
      (enr.gradeProject !== null && enr.gradeProject !== undefined) ||
      (enr.gradeFinal !== null && enr.gradeFinal !== undefined) ||
      (enr.gradeMidterm !== null && enr.gradeMidterm !== undefined),
  ).length
  const gradedTotals = enrollments
    .map((enr) => enr.gradeTotal)
    .filter((val): val is number => typeof val === "number" && !Number.isNaN(val))

  const gpa = useMemo(() => {
    if (gradedTotals.length === 0) return null
    const avgPercent = gradedTotals.reduce((sum, val) => sum + val, 0) / gradedTotals.length
    return Math.max(0, Math.min(4, avgPercent / 25)).toFixed(2)
  }, [gradedTotals])

  const balanceStatus = financials?.balance ?? profile?.balance ?? 0
  const fullyPaid = Number(balanceStatus) <= 0
  const enrollmentOpen = enrollmentWindow ? enrollmentWindow.enrollmentOpen !== false : null
  const academicYear = deriveAcademicYear(profile, profile?.enrollmentDate)
  const firstYear = academicYear.toLowerCase().includes("year 1")
  const spotlightMessage = firstYear
    ? "Your first-year classes are coordinated by the registrar. Use the portal to stay ahead on billing, announcements, and academic updates."
    : enrollmentOpen === null
      ? "Checking registration status. Your dashboard still gives you a clean view of grades, billing, and campus news."
      : enrollmentOpen
        ? "Registration is open. Shape your semester, review your balance, and keep an eye on the newest university updates."
        : "Registration is currently closed, but your dashboard still gives you a clean view of grades, billing, and campus news."

  const quickActions = [
    {
      title: "Enrollment planner",
      description: firstYear
        ? "Review foundation courses and registrar guidance for your first academic year."
        : "Curate your next term with eligibility-aware planning and scheduling tools.",
      href: "/student/enroll",
      icon: GraduationCap,
      cta: firstYear ? "Review plan" : "Open planner",
    },
    {
      title: "Academic progress",
      description: "Follow grades, timetable details, and transcript-ready performance in one place.",
      href: "/student/grades",
      icon: FileText,
      cta: "View progress",
    },
    {
      title: "Billing center",
      description: fullyPaid
        ? "Your account looks clear. Keep receipts and payment history close."
        : "Resolve outstanding balances and stay ready for academic actions.",
      href: "/student/billing",
      icon: Wallet,
      cta: "Open billing",
    },
  ]

  useEffect(() => {
    const controller = new AbortController()
    fetchNews(controller.signal)
      .then((items) => setAnnouncements(items.slice(0, 5)))
      .catch(() => setAnnouncements([]))

    if (user?.id) {
      fetchUserNotifications(user.id)
        .then((items) => setNotifications(items.slice(0, 5)))
        .catch(() => setNotifications([]))
    }

    return () => controller.abort()
  }, [fetchUserNotifications, user?.id])

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] px-5 py-6 text-[var(--foreground)] shadow-[0_24px_40px_-26px_rgba(148,163,184,0.45),0_4px_6px_-1px_rgba(0,0,0,0.06)] md:px-6 md:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),transparent_24%),radial-gradient(circle_at_84%_20%,rgba(79,70,229,0.08),transparent_18%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.07),transparent_24%)]" />
        <div className="relative grid gap-5 xl:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
              <Sparkles className="h-3 w-3" />
              Student Dashboard
            </div>
            <div className="space-y-2.5">
              <h1 className="max-w-3xl text-[2.45rem] font-semibold leading-[0.98] tracking-[-0.04em] md:text-[3.35rem]">
                Welcome back{profile ? `, ${profile.firstName}` : ""}.
              </h1>
              <p className="max-w-2xl text-[14px] leading-5 text-slate-600">{spotlightMessage}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700">
                Role: Student
              </Badge>
              <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700">
                {academicYear}
              </Badge>
              <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700">
                {profile?.program || "Program pending"}
              </Badge>
              <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700">
                {enrollmentOpen === null ? "Checking registration…" : enrollmentOpen ? "Registration open" : "Registration closed"}
              </Badge>
              <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700">
                {fullyPaid ? "Finance clear" : `Outstanding: $${Number(balanceStatus).toFixed(2)}`}
              </Badge>
              {firstYear && (
                <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700">
                  <Lock className="mr-1 h-3 w-3" /> Auto-assigned first-year classes
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/student/enroll">
                <Button className="h-9 min-w-[150px] rounded-md border border-[var(--primary)] bg-[var(--primary)] px-4 text-[13px] text-[var(--student-white)] shadow-[0_14px_28px_-20px_rgba(79,70,229,0.48)] hover:bg-[var(--primary)]">
                  {firstYear ? "Review Course Plan" : "Plan This Semester"}
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/student/grades">
                <Button variant="outline" className="h-9 min-w-[112px] rounded-md border-[var(--student-action-accent-blue)] bg-[var(--student-action-accent-blue)] px-4 text-[13px] text-[var(--student-white)] hover:border-[var(--student-action-accent-blue)] hover:bg-[var(--student-action-accent-blue)] hover:text-[var(--student-white)]">
                  View Grades
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-rows-[auto_auto]">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.16),0_4px_6px_-1px_rgba(0,0,0,0.08)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Current Snapshot</p>
              <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[2.2rem] font-semibold leading-none text-slate-900">{active.length}</p>
                  <p className="text-xs text-slate-500">active or pending courses</p>
                </div>
                <div>
                  <p className="text-[2.2rem] font-semibold leading-none text-slate-900">{notifications.length}</p>
                  <p className="text-xs text-slate-500">recent notifications</p>
                </div>
                <div>
                  <p className="text-[2.2rem] font-semibold leading-none text-slate-900">{gpa ?? "N/A"}</p>
                  <p className="text-xs text-slate-500">current GPA estimate</p>
                </div>
                <div>
                  <p className="text-[2.2rem] font-semibold leading-none text-slate-900">{announcements.length}</p>
                  <p className="text-xs text-slate-500">fresh announcements</p>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--foreground)] shadow-[0_12px_28px_-20px_rgba(15,23,42,0.16),0_4px_6px_-1px_rgba(0,0,0,0.08)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Today&apos;s Focus</p>
              <p className="mt-2.5 text-[1.35rem] font-semibold leading-6 text-slate-900">
                {fullyPaid ? "You are financially clear for academic activity." : "Clear your balance to unlock full enrollment actions."}
              </p>
              <p className="mt-2 text-[13px] leading-5 text-slate-600">
                {fullyPaid
                  ? "Use this week to review grades, confirm your schedule, and stay on top of announcements."
                  : `Your current outstanding balance is $${Number(balanceStatus).toFixed(2)}. Visiting billing first will keep the rest of your workflow smooth.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.45fr_0.95fr]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard title="Active / Pending" value={active.length} change={`${enrollments.length} total courses`} changeType="neutral" icon={BookOpen} />
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_10px_24px_-18px_rgba(79,70,229,0.18)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Progress</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{completed.length} completed</p>
                <p className="mt-1 text-xs text-slate-500">of {enrollments.length} courses</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <Sparkline values={gradedTotals.slice(-8)} />
            </div>
          </div>
          <StatsCard
            title="Balance"
            value={`$${balance.toFixed(2)}`}
            change={financialsLoading ? "Refreshing finance data..." : fullyPaid ? "Account in good standing" : "Payment action recommended"}
            changeType={balance > 0 ? "negative" : "positive"}
            icon={DollarSign}
            accent="tertiary"
          />
          <StatsCard title="Academic Year" value={academicYear} change={profile?.program || "Program pending"} changeType="neutral" icon={GraduationCap} />
        </div>

        <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-[0_12px_28px_-20px_rgba(15,23,42,0.16),0_4px_6px_-1px_rgba(0,0,0,0.08)]">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Momentum</p>
                <h2 className="mt-2 text-[1.35rem] font-semibold text-foreground">Your academic pulse</h2>
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[var(--student-subtle-neutral-blue)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
                {gpa ? `${gpa} GPA` : "Building"}
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--student-subtle-neutral-blue)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Assignment submissions</p>
                  <p className="text-xs text-muted-foreground">Detected from your graded coursework</p>
                </div>
                <p className="text-2xl font-semibold text-foreground">{assignmentSubmissions}</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--student-subtle-neutral-blue)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Announcements live</p>
                  <p className="text-xs text-muted-foreground">University updates published recently</p>
                </div>
                <p className="text-2xl font-semibold text-foreground">{announcements.length}</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--student-subtle-neutral-blue)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Notifications waiting</p>
                  <p className="text-xs text-muted-foreground">Latest personal updates in your portal</p>
                </div>
                <p className="text-2xl font-semibold text-foreground">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.href} className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-[0_12px_28px_-20px_rgba(15,23,42,0.16),0_4px_6px_-1px_rgba(0,0,0,0.08)]">
              <CardContent className="flex min-h-[250px] flex-col p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700">
                  <action.icon className="h-4.5 w-4.5" />
                </div>
                <div className="mt-4 min-h-[108px] space-y-2">
                  <p className="text-[1.05rem] font-semibold text-foreground">{action.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{action.description}</p>
                </div>
                <Link href={action.href} className="mt-auto block pt-5">
                  <Button variant="outline" className="w-full justify-between rounded-full border-indigo-200 bg-[var(--card)] text-indigo-700 hover:border-[var(--primary)] hover:bg-indigo-50 hover:text-indigo-800">
                    {action.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-[30px] border border-[var(--border)] bg-[var(--card)] shadow-[0_12px_28px_-20px_rgba(15,23,42,0.16),0_4px_6px_-1px_rgba(0,0,0,0.08)]">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Inbox</p>
                <p className="mt-1 text-xl font-semibold text-foreground">Recent notifications</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
                <Bell className="h-5 w-5" />
              </div>
            </div>
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--student-subtle-neutral-blue)] p-5 text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--student-subtle-neutral-blue)] p-4">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">{item.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border border-[var(--border)] bg-[var(--card)] shadow-[0_12px_28px_-20px_rgba(15,23,42,0.16),0_4px_6px_-1px_rgba(0,0,0,0.08)]">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Newsroom</p>
                <p className="mt-1 text-xl font-semibold text-foreground">Latest announcements</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
                <Megaphone className="h-5 w-5" />
              </div>
            </div>
            {announcements.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--student-subtle-neutral-blue)] p:5 text-sm text-muted-foreground">
                No announcements published.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--student-subtle-neutral-blue)] p-4">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">{item.body}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="grid gap-2 pt-1 sm:grid-cols-2">
              <Link href="/student/grades">
                <Button variant="outline" className="w-full justify-center rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  <FileText className="mr-2 h-4 w-4" />
                  Transcript
                </Button>
              </Link>
              <Link href="/student/support">
                <Button className="w-full justify-center rounded-full border border-[var(--primary)] bg-[var(--primary)] text-[var(--student-white)] hover:bg-[var(--primary)]">
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

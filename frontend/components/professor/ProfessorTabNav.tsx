"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeHelp,
  BarChart3,
  CalendarClock,
  CalendarPlus2,
  ClipboardList,
  Clock3,
  FileText,
  History,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  NotebookPen,
  Presentation,
  Send,
  WalletCards,
} from "lucide-react"

interface ProfessorTab {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

const TABS: ProfessorTab[] = [
  { href: "/dashboard/professor", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/professor/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/dashboard/professor/assignments", label: "Assignments", icon: NotebookPen },
  { href: "/dashboard/professor/roster", label: "Roster", icon: ClipboardList },
  { href: "/dashboard/professor/mock-classes", label: "Mock-up Classes", icon: CalendarPlus2 },
  { href: "/dashboard/professor/finance-requests", label: "Finance Requests", icon: WalletCards },
  { href: "/dashboard/professor/materials", label: "Materials", icon: FileText },
  { href: "/dashboard/professor/quizzes", label: "Quizzes", icon: BadgeHelp },
  { href: "/dashboard/professor/gradebook", label: "Gradebook", icon: Presentation },
  { href: "/dashboard/professor/grade-submission", label: "Grade Submission", icon: Presentation },
  { href: "/dashboard/professor/messages", label: "Messages", icon: Send },
  { href: "/dashboard/professor/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/professor/office-hours", label: "Office Hours", icon: Clock3 },
  { href: "/dashboard/professor/questions", label: "Student Questions", icon: MessageSquare },
  { href: "/dashboard/professor/students-requests", label: "Student Requests", icon: ClipboardList },
  { href: "/dashboard/professor/attendance", label: "Attendance", icon: CalendarClock },
  { href: "/dashboard/professor/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/professor/reports", label: "Pass/Fail Report", icon: History },
]

export function ProfessorTabNav() {
  const pathname = usePathname()

  return (
    <div role="tablist" className="bg-muted text-muted-foreground flex w-full flex-wrap items-center gap-1 rounded-xl p-1.5">
      {TABS.map((tab) => {
        const active = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            data-state={active ? "active" : "inactive"}
            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-ring ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

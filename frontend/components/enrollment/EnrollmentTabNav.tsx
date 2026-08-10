"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { pillButtonStyles } from "@/components/enrollment/shared"
import { useModuleToggles } from "@/lib/terminal-context"
import {
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  DoorOpen,
  GraduationCap,
  Landmark,
  ListFilter,
  MapPin,
  UserSquare2,
} from "lucide-react"

interface EnrollmentTab {
  href: string
  label: string
  icon: typeof GraduationCap
  featureKey?: readonly [string, string]
}

const TABS: EnrollmentTab[] = [
  { href: "/dashboard/enrollment/enrollments", label: "Enrollments", icon: GraduationCap },
  { href: "/dashboard/enrollment/schedule", label: "Schedules", icon: CalendarClock },
  { href: "/dashboard/enrollment/courses", label: "Courses", icon: Landmark },
  { href: "/dashboard/enrollment/departments", label: "Departments", icon: Building2 },
  { href: "/dashboard/enrollment/campuses", label: "Campuses", icon: MapPin },
  { href: "/dashboard/enrollment/rooms", label: "Rooms", icon: DoorOpen, featureKey: ["enrollment", "rooms"] },
  { href: "/dashboard/enrollment/students", label: "Students", icon: UserSquare2 },
  { href: "/dashboard/enrollment/approvals", label: "Pending approvals", icon: CheckCircle2 },
  { href: "/dashboard/enrollment/waitlist", label: "Waitlist", icon: Clock, featureKey: ["enrollment", "waitlist"] },
  { href: "/dashboard/enrollment/utilization", label: "Utilization", icon: BarChart3, featureKey: ["enrollment", "utilization"] },
]

interface EnrollmentTabNavProps {
  /** Handler for the "Refresh Data" button. When omitted the button is hidden. */
  onRefresh?: () => void
  isRefreshing?: boolean
  /**
   * Rendered in place of the "Open/Close by Major & Courses" button. Routes that
   * own the bulk dialog pass a Button that opens it; other routes pass a Link.
   */
  bulkAction?: ReactNode
}

export function EnrollmentTabNav({ onRefresh, isRefreshing = false, bulkAction }: EnrollmentTabNavProps) {
  const pathname = usePathname()
  const { isFeatureEnabled } = useModuleToggles()

  const visibleTabs = TABS.filter((tab) => !tab.featureKey || isFeatureEnabled(tab.featureKey[0], tab.featureKey[1]))

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="tablist"
        className="bg-muted text-muted-foreground flex w-full flex-wrap items-center justify-center gap-1 rounded-xl p-1.5"
      >
        {visibleTabs.map((tab) => {
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
      {onRefresh || bulkAction ? (
        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          {onRefresh ? (
            <Button className={`gap-2 ${pillButtonStyles.primary}`} onClick={onRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Spinner className="h-4 w-4" /> : <ListFilter className="h-4 w-4" />}
              Refresh Data
            </Button>
          ) : null}
          {bulkAction}
        </div>
      ) : null}
    </div>
  )
}

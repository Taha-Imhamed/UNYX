"use client"

import Link from "next/link"
import { DashboardRouteGuard } from "@/components/dashboard-route-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles } from "lucide-react"

interface FeatureLink {
  label: string
  description: string
  href: string
  tabHint?: string
}

interface FeatureGroup {
  title: string
  items: FeatureLink[]
}

const GROUPS: FeatureGroup[] = [
  {
    title: "Finance",
    items: [
      { label: "Ledger view", description: "Every debit/credit ever posted to a student balance.", href: "/dashboard/finance", tabHint: "Ledger tab" },
      { label: "Financial holds", description: "See who's blocked from registration for unpaid balance, release holds.", href: "/dashboard/finance", tabHint: "Holds tab" },
      { label: "Payment reconciliation", description: "Payments grouped by method (cash/card/transfer), pending/rejected counts.", href: "/dashboard/finance", tabHint: "Reports tab" },
      { label: "Outstanding balance report", description: "Unpaid students by department, aging buckets (current/30/60/90+ days).", href: "/dashboard/finance", tabHint: "Reports tab" },
      { label: "Late fee assessment", description: "One-click charge a late fee to every overdue invoice past the grace period.", href: "/dashboard/finance", tabHint: "Reports tab" },
      { label: "Net income trend chart", description: "12-month income vs. expenses line chart.", href: "/dashboard/finance", tabHint: "Reports tab" },
      { label: "Accounting export (CSV)", description: "Download all payment transactions, QuickBooks-importable.", href: "/dashboard/finance", tabHint: "Reports tab" },
    ],
  },
  {
    title: "Terminal",
    items: [
      { label: "Role-first view", description: "Terminal now opens on a role list with live user counts instead of a flat module list.", href: "/dashboard/terminal" },
      { label: "Per-user feature overrides", description: "Search one person, open or close a feature just for them, independent of the role-wide setting.", href: "/dashboard/terminal", tabHint: "Open a role → Override section" },
    ],
  },
  {
    title: "Registrar workflows (real side effects, not just status labels)",
    items: [
      { label: "Enrollment override", description: "Approving now actually activates the enrollment, bypassing prereq/schedule/window checks.", href: "/dashboard/registrar" },
      { label: "Graduation approval", description: "Approving now flips the student's status to graduated.", href: "/dashboard/registrar" },
      { label: "Transfer credit → degree audit", description: "Approved transfer credits now count toward a student's credits-earned total.", href: "/student/degree-audit" },
      { label: "Transcript request queue", description: "Real admin queue with status transitions, replacing the placeholder page.", href: "/dashboard/registrar" },
    ],
  },
  {
    title: "Admissions",
    items: [
      { label: "Interview scheduling", description: "Real scheduling UI — create, reschedule, complete, cancel — replacing the placeholder page.", href: "/dashboard/admissions" },
    ],
  },
  {
    title: "Student Dashboard toggles",
    items: [
      { label: "Per-feature show/hide for students", description: "19 student-portal features individually toggleable Open/Locked/Hidden from Terminal.", href: "/dashboard/terminal", tabHint: "Student role" },
    ],
  },
  {
    title: "Professor toggles",
    items: [
      { label: "Per-feature show/hide for professors", description: "18 professor workspace pages individually toggleable from Terminal.", href: "/dashboard/terminal", tabHint: "Professor role" },
    ],
  },
]

export default function LastFeaturesPage() {
  return (
    <DashboardRouteGuard allowedRoles={["super-admin"]}>
      <DashboardHeader
        title="Last Features"
        description="Everything added recently, grouped by area. Click one to jump straight to it."
      />
      <div className="mt-4 flex items-center gap-2 px-1 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        {GROUPS.reduce((sum, g) => sum + g.items.length, 0)} recent additions
      </div>

      <div className="mt-4 space-y-6">
        {GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.items.map((item) => (
                <Link key={item.label} href={item.href}>
                  <Card className="h-full border-border bg-card transition hover:border-primary/40 hover:bg-secondary/20">
                    <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-semibold text-foreground">{item.label}</CardTitle>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      {item.tabHint && (
                        <Badge variant="outline" className="text-[10px]">{item.tabHint}</Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardRouteGuard>
  )
}

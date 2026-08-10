"use client"

import { DashboardRouteGuard } from "@/components/dashboard-route-guard"
import { StudentOverviewPage } from "@/components/student/student-overview"

export default function DashboardStudentPage() {
  return (
    <DashboardRouteGuard allowedRoles={["student"]} redirectTo="/dashboard">
      <StudentOverviewPage />
    </DashboardRouteGuard>
  )
}
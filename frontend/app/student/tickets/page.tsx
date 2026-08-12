"use client"

import { TicketsPage } from "@/components/tickets-page"
import { StudentFeatureGate } from "@/components/student-feature-gate"

export default function StudentTicketsPage() {
  return (
    <StudentFeatureGate featureKey="tickets">
      <TicketsPage title="Tickets" description="Open a ticket for IT, Admin, Finance, and other departments, and track replies here." />
    </StudentFeatureGate>
  )
}

"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { WalletCards } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { useProfessorFinanceRequests } from "@/hooks/professor/use-professor-finance-requests"
import type { FinanceRequest } from "@shared/types"

const statusVariant: Record<FinanceRequest["status"], "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  fulfilled: "outline",
  rejected: "destructive",
}

export default function ProfessorFinanceRequestsPage() {
  const router = useRouter()
  const { financeRequests, isLoading } = useProfessorFinanceRequests()
  const pendingFinanceRequests = useMemo(() => financeRequests.filter((request) => request.status === "pending"), [financeRequests])

  return (
    <div className="space-y-6">
      <DashboardHeader title="Finance Requests" description="Request equipment and budget from finance" />
      <ProfessorTabNav />

      <Card className="border border-[#d8e6f8] bg-[linear-gradient(135deg,#f9fcff_0%,#eef5ff_100%)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Finance requests</CardTitle>
            <p className="text-sm text-[#68809a]">Request equipment and budget from finance.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/dashboard/requests")}>
              <WalletCards className="mr-2 h-4 w-4" />
              Open request desk
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/professor/students-requests")}>
              Students Requests
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading finance requests...</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[#d8e6f8] bg-white/90 p-4">
                <p className="text-sm text-[#68809a]">Total requests</p>
                <p className="text-2xl font-semibold text-[#365f92]">{financeRequests.length}</p>
              </div>
              <div className="rounded-xl border border-[#d8e6f8] bg-white/90 p-4">
                <p className="text-sm text-[#68809a]">Pending review</p>
                <p className="text-2xl font-semibold text-[#365f92]">{pendingFinanceRequests.length}</p>
              </div>
              <div className="rounded-xl border border-[#d8e6f8] bg-white/90 p-4">
                <p className="text-sm text-[#68809a]">Latest update</p>
                <p className="text-sm font-medium text-[#365f92]">
                  {financeRequests[0] ? new Date(financeRequests[0].updatedAt).toLocaleDateString() : "No requests yet"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Your requests</CardTitle>
          <p className="text-sm text-muted-foreground">Most recent requests you've submitted to finance.</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading finance requests...</p>
          ) : financeRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No finance requests yet.</p>
          ) : (
            <div className="space-y-3">
              {financeRequests.map((r) => (
                <div key={r.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.title}</span>
                      <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">${r.amount.toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.itemName} — {r.justification}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Submitted {new Date(r.createdAt).toLocaleDateString()}</span>
                    {r.financeNotes && <span>Finance note: {r.financeNotes}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

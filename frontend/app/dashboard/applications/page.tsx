"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StatsCard } from "@/components/stats-card"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import type { Feedback } from "@shared/types"
import { CheckCircle, Filter, Mail, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type AdmissionsFeedback = Feedback & { category: string }

function parseApplicationDetails(item: AdmissionsFeedback) {
  const parts = item.comment.split("|").map((p) => p.trim())
  const pick = (prefix: string) =>
    parts.find((p) => p.toLowerCase().startsWith(prefix.toLowerCase()))?.replace(new RegExp(`^${prefix}:?\\s*`, "i"), "").trim()
  const email = parts.find((p) => p.toLowerCase().includes("@")) || item.subject || ""

  return {
    name: pick("Name") || item.studentName || "Applicant",
    program: pick("Program") || "—",
    level: pick("Level") || "—",
    phone: pick("Phone") || "",
    notes: pick("Notes") || "",
    email: email || "—",
  }
}

export default function ApplicationsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<AdmissionsFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<AdmissionsFeedback | null>(null)

  const isAllowed = user?.role === "admin" || user?.role === "super-admin" || user?.role === "supervisor"

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<AdmissionsFeedback[]>("/feedback")
      const filtered = data.filter(
        (item) =>
          item.category === "admissions" ||
          item.source === "public-admissions" ||
          item.type === "admission" ||
          (item.subject && item.subject.toLowerCase().includes("application")),
      )
      setItems(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load applications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAllowed) {
      load()
    }
  }, [isAllowed])

  const stats = useMemo(() => {
    const total = items.length
    const newCount = items.filter((item) => item.status === "new").length
    const reviewed = items.filter((item) => item.status === "reviewed").length
    const resolved = items.filter((item) => item.status === "resolved").length
    return { total, newCount, reviewed, resolved }
  }, [items])

  const updateStatus = async (id: string, status: Feedback["status"]) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
    try {
      await apiFetch<Feedback>(`/feedback/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status")
      await load()
    }
  }

  if (!isAllowed) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader title="New Applications" description="Public admission requests submitted from the landing page" />
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>Access restricted</AlertTitle>
            <AlertDescription>Only Admin and Supervisor accounts can view applications.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="New Applications" description="Public admission requests submitted from the landing page" />

      <div className="flex-1 p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load applications</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-4">
          <StatsCard title="Total" value={stats.total} icon={Mail} />
          <StatsCard title="New" value={stats.newCount} change="Awaiting review" changeType="neutral" icon={Filter} />
          <StatsCard title="In review" value={stats.reviewed} change="Marked reviewed" changeType="neutral" icon={RefreshCw} />
          <StatsCard title="Resolved" value={stats.resolved} change="Archived" changeType="positive" icon={CheckCircle} />
        </div>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle>Admissions Inbox</CardTitle>
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                {loading ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />} Refresh
              </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading applications
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[780px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const parsed = parseApplicationDetails(item)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold text-foreground">
                          {parsed.name}
                        </TableCell>
                        <TableCell>{parsed.program}</TableCell>
                        <TableCell>{parsed.level}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{parsed.email}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "new" ? "default" : item.status === "reviewed" ? "secondary" : "outline"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button size="sm" variant="outline" onClick={() => setViewing(item)}>
                                View
                              </Button>
                              {item.status !== "resolved" && (
                                <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, "resolved")}>
                                  Archive
                                </Button>
                              )}
                              {item.status === "new" && (
                                <Button size="sm" onClick={() => updateStatus(item.id, "reviewed")}>
                                  Mark reviewed
                                </Button>
                              )}
                              {item.status === "reviewed" && (
                                <Button size="sm" variant="secondary" onClick={() => updateStatus(item.id, "resolved")}>
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => setViewing(open ? viewing : null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Application details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              {(() => {
                const parsed = parseApplicationDetails(viewing)
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-foreground">{parsed.name}</p>
                        <p className="text-xs text-muted-foreground">{viewing.id}</p>
                      </div>
                      <Badge variant={viewing.status === "new" ? "default" : viewing.status === "reviewed" ? "secondary" : "outline"}>
                        {viewing.status}
                      </Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="font-medium text-foreground">{new Date(viewing.date).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Target role</p>
                        <p className="font-medium text-foreground">{viewing.targetRole ?? "admin"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Program</p>
                        <p className="font-medium text-foreground">{parsed.program}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Level</p>
                        <p className="font-medium text-foreground">{parsed.level}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground">{parsed.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium text-foreground">{parsed.phone || "—"}</p>
                      </div>
                    </div>
                    {parsed.notes && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Notes</p>
                        <p className="font-medium text-foreground whitespace-pre-wrap">{parsed.notes}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Full submission</p>
                      <div className="rounded-md border border-border/60 bg-secondary/20 p-3 text-sm whitespace-pre-wrap text-foreground">
                        {viewing.comment}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => updateStatus(viewing.id, "reviewed")}>
                        Mark reviewed
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(viewing.id, "resolved")}>
                        Resolve
                      </Button>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

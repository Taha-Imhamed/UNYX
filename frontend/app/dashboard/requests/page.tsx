"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { createFinanceRequest, deleteFinanceRequest, fetchFinanceRequests, updateFinanceRequest } from "@/lib/finance-api"
import { announceFinanceRequestsChanged, subscribeToFinanceRequestChanges } from "@/lib/finance-request-events"
import type { FinanceRequest } from "@shared/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Inbox, Landmark, Pencil, PlusCircle, Trash2 } from "lucide-react"
import { fetchEnrollments } from "@/lib/enrollment-api"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

type RequestFormValues = {
  requestType: FinanceRequest["requestType"]
  urgency: FinanceRequest["urgency"]
  title: string
  itemName: string
  amount: number
  department?: string | null
  vendorName?: string | null
  justification: string
  notes?: string | null
}

function extractRequestValues(formData: FormData): RequestFormValues {
  return {
    department: String(formData.get("department") || "") || null,
    requestType: String(formData.get("requestType")) as FinanceRequest["requestType"],
    title: String(formData.get("title") || ""),
    itemName: String(formData.get("itemName") || ""),
    amount: Number(formData.get("amount") || 0),
    urgency: String(formData.get("urgency") || "normal") as FinanceRequest["urgency"],
    justification: String(formData.get("justification") || ""),
    vendorName: String(formData.get("vendorName") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  }
}

function RequestForm({
  onSubmit,
  submitLabel,
  isSubmitting,
  initialValues,
}: {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  submitLabel: string
  isSubmitting?: boolean
  initialValues?: Partial<RequestFormValues>
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="requestType">Request type</Label>
          <Select name="requestType" defaultValue={initialValues?.requestType ?? "purchase"}>
            <SelectTrigger id="requestType"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="fund">Fund</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="urgency">Urgency</Label>
          <Select name="urgency" defaultValue={initialValues?.urgency ?? "normal"}>
            <SelectTrigger id="urgency"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={initialValues?.title ?? ""} placeholder="Lab projector replacement" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="itemName">Item / Purpose</Label>
          <Input id="itemName" name="itemName" defaultValue={initialValues?.itemName ?? ""} placeholder="Projector, travel, printing budget..." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" min={0} step="0.01" defaultValue={initialValues?.amount ?? ""} required />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input id="department" name="department" defaultValue={initialValues?.department ?? ""} placeholder="Computer Science" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendorName">Vendor / Source</Label>
          <Input id="vendorName" name="vendorName" defaultValue={initialValues?.vendorName ?? ""} placeholder="Optional vendor name" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="justification">Justification</Label>
        <Textarea id="justification" name="justification" defaultValue={initialValues?.justification ?? ""} rows={4} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Extra notes</Label>
        <Textarea id="notes" name="notes" defaultValue={initialValues?.notes ?? ""} rows={3} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  )
}

export default function RequestsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading, hasPermission } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })
  const [requests, setRequests] = useState<FinanceRequest[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingRequest, setEditingRequest] = useState<FinanceRequest | null>(null)
  const [editing, setEditing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canReviewRequests =
    !!user && (user.role === "admin" || user.role === "super-admin" || user.role === "supervisor" || hasPermission("finance:view") || hasPermission("finance:manage"))
  const canSubmitRequests = !!user && !canReviewRequests && user.role !== "student"

  const loadRequests = useCallback(async (signal?: AbortSignal) => {
    if (!user) return
    setPageLoading(true)
    setError(null)
    try {
      const data = await fetchFinanceRequests(signal)
      if (!signal?.aborted) {
        setRequests(data)
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : "Unable to load requests")
      }
    } finally {
      if (!signal?.aborted) setPageLoading(false)
    }
  }, [user])

  // grade-change requests for HOD / admin
  const [gradeRequests, setGradeRequests] = useState<any[]>([])
  const loadGradeRequests = useCallback(async () => {
    if (!canReviewRequests) return
    try {
      const res = await fetch('/api/grade-change-requests')
      if (!res.ok) return
      const json = await res.json()
      const all = json?.data
      // only show pending grade-change tickets in the admin inbox
      setGradeRequests(Array.isArray(all) ? all.filter((g: any) => g.status === 'pending') : [])
    } catch (e) {
      // ignore
    }
  }, [canReviewRequests])

  useEffect(() => {
    void loadGradeRequests()
  }, [loadGradeRequests, refreshVersion])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, router, user])

  useEffect(() => {
    const controller = new AbortController()
    void loadRequests(controller.signal)
    return () => controller.abort()
  }, [loadRequests, refreshVersion])

  useEffect(() => {
    return subscribeToFinanceRequestChanges(() => {
      void loadRequests()
    })
  }, [loadRequests])

  const pendingCount = useMemo(() => requests.filter((item) => item.status === "pending").length, [requests])
  const approvedCount = useMemo(() => requests.filter((item) => item.status === "approved" || item.status === "fulfilled").length, [requests])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    const formData = new FormData(event.currentTarget)
    try {
      const created = await createFinanceRequest(extractRequestValues(formData))
      setRequests((prev) => [created, ...prev])
      announceFinanceRequestsChanged()
      toast({ title: "Request submitted" })
      event.currentTarget.reset()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Request failed",
        description: err instanceof Error ? err.message : "Unable to send request",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingRequest) return
    setEditing(true)
    const formData = new FormData(event.currentTarget)
    try {
      const updated = await updateFinanceRequest(editingRequest.id, extractRequestValues(formData))
      setRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      announceFinanceRequestsChanged()
      setEditingRequest(null)
      toast({ title: "Request updated" })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Unable to update request",
      })
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async (request: FinanceRequest) => {
    if (deletingId) return
    setDeletingId(request.id)
    try {
      await deleteFinanceRequest(request.id)
      setRequests((prev) => prev.filter((item) => item.id !== request.id))
      announceFinanceRequestsChanged()
      toast({ title: "Request deleted" })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unable to delete request",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (!user) return null

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader
        title="Purchase & Fund Requests"
        description={
          canReviewRequests
            ? "Incoming department requests sent to admin and finance for review."
            : "Send purchase or funding requests directly to the finance department."
        }
      />

      <div className="flex-1 space-y-5 p-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load requests</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden border-[#d6e4f8] bg-gradient-to-br from-[#f4f9ff] via-white to-[#eef6ff]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-[#5a7393]">{canReviewRequests ? "Pending Inbox" : "Pending"}</p>
                <p className="text-2xl font-semibold text-[#244f84]">{pendingCount}</p>
              </div>
              <Inbox className="h-8 w-8 text-[#5f90cc]" />
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-[#d8eadb] bg-gradient-to-br from-[#f6fbf4] via-white to-[#eef7ec]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-[#5d7f64]">Approved / Fulfilled</p>
                <p className="text-2xl font-semibold text-[#21492a]">{approvedCount}</p>
              </div>
              <Landmark className="h-8 w-8 text-[#2f7c45]" />
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-[#eadfce] bg-gradient-to-br from-[#fff9f3] via-white to-[#f9f0e2]">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-[#7f6c52]">Total Requested</p>
                <p className="text-2xl font-semibold text-[#4d3820]">
                  {currencyFormatter.format(requests.reduce((sum, item) => sum + item.amount, 0))}
                </p>
              </div>
              <PlusCircle className="h-8 w-8 text-[#a06d2f]" />
            </CardContent>
          </Card>
        </div>

        <div className={`grid gap-5 ${canSubmitRequests ? "xl:grid-cols-[0.95fr_1.25fr]" : "xl:grid-cols-1"}`}>
          {canSubmitRequests && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>New request</CardTitle>
              </CardHeader>
              <CardContent>
                <RequestForm onSubmit={handleSubmit} submitLabel="Submit request" isSubmitting={submitting} />
              </CardContent>
            </Card>
          )}

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{canReviewRequests ? "Incoming request inbox" : "Your request history"}</CardTitle>
            </CardHeader>
            <CardContent>
              {pageLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Loading requests...</div>
              ) : (
                <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/40">
                      <TableHead>Request</TableHead>
                      {canReviewRequests && <TableHead>Requester</TableHead>}
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      {canReviewRequests && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{request.title}</span>
                            <span className="text-xs text-muted-foreground">{request.requestNumber}</span>
                          </div>
                        </TableCell>
                        {canReviewRequests && (
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{request.requesterName}</span>
                              <span className="text-xs capitalize text-muted-foreground">{request.requesterRole}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="capitalize">{request.requestType}</TableCell>
                        <TableCell>{currencyFormatter.format(request.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={request.status === "approved" || request.status === "fulfilled" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.updatedAt).toLocaleDateString()}</TableCell>
                        {canReviewRequests && (
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingRequest(request)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive" disabled={deletingId === request.id} onClick={() => void handleDelete(request)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {requests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canReviewRequests ? 7 : 5} className="py-8 text-center text-muted-foreground">
                          {canReviewRequests ? "No incoming requests yet." : "No requests submitted yet."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {/* Grade change requests (admins/hod) */}
                {canReviewRequests && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Grade change requests</h4>
                  {gradeRequests.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No grade requests.</div>
                  ) : (
                    <div className="space-y-2">
                      {gradeRequests.map((g) => (
                        <div key={g.id} className="p-3 border rounded-md flex justify-between items-start">
                          <div>
                            <div className="font-medium">{g.studentName} — {g.courseCode} {g.courseTitle}</div>
                            <div className="text-sm text-muted-foreground">Requested by: {g.professorName} — {new Date(g.createdAt).toLocaleString()}</div>
                            <div className="mt-1 text-sm">Reason: {g.reason}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-sm">Status: {g.status}</div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={async () => {
                                const res = await fetch(`/api/grade-change-requests/${g.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'approved' }),
                                })
                                if (res.ok) {
                                  // The backend applies the grade to the enrollment itself when status is "approved".
                                  await loadGradeRequests()
                                  await loadRequests()
                                  toast({ title: 'Grade request approved' })
                                }
                              }}>Approve</Button>
                              <Button size="sm" variant="outline" onClick={async () => {
                                const res = await fetch(`/api/grade-change-requests/${g.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'rejected' }),
                                })
                                if (res.ok) {
                                  await loadGradeRequests()
                                  toast({ title: 'Grade request rejected' })
                                }
                              }}>Reject</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
                </>) }
              </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit request</DialogTitle>
            <DialogDescription>Update the request before finance completes its review.</DialogDescription>
          </DialogHeader>
          {editingRequest && (
            <RequestForm
              onSubmit={handleEdit}
              submitLabel="Save changes"
              isSubmitting={editing}
              initialValues={{
                department: editingRequest.department ?? "",
                requestType: editingRequest.requestType,
                title: editingRequest.title,
                itemName: editingRequest.itemName,
                amount: editingRequest.amount,
                urgency: editingRequest.urgency,
                justification: editingRequest.justification,
                vendorName: editingRequest.vendorName ?? "",
                notes: editingRequest.notes ?? "",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardRouteGuard } from '@/components/dashboard-route-guard'
import { useToast } from '@/hooks/use-toast'
import type { GradeChangeRequest } from '@shared/types'

const statusVariant: Record<GradeChangeRequest['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
}

function GradesRequestsContent() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<GradeChangeRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | GradeChangeRequest['status']>('pending')
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    fetch('/api/grade-change-requests')
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || 'Failed to load grade requests')
        setRequests(json.data ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load grade requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!query) return true
      return (
        r.studentName?.toLowerCase().includes(query) ||
        r.courseCode?.toLowerCase().includes(query) ||
        r.courseTitle?.toLowerCase().includes(query) ||
        r.professorName?.toLowerCase().includes(query)
      )
    })
  }, [requests, statusFilter, search])

  const handleDecision = async (requestId: string, approve: boolean) => {
    const status = approve ? 'approved' : 'rejected'
    const responseNote = notes[requestId]?.trim()
    if (!approve && !responseNote) {
      toast({ variant: 'destructive', title: 'Rejection reason required', description: 'Add a note explaining why this request is rejected.' })
      return
    }
    setBusyId(requestId)
    try {
      const res = await fetch(`/api/grade-change-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, responseNote }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update grade request')
      setRequests((prev) => prev.map((p) => (p.id === json.data.id ? json.data : p)))
      toast({ title: approve ? 'Request approved' : 'Request rejected' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Unable to update request', description: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Grades Requests" description="Review grade change requests submitted by professors" />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Requests</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search student, course, professor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading…</div>}
          {error && <div className="text-destructive text-sm">{error}</div>}
          {!loading && !error && filtered.length === 0 && <div className="text-muted-foreground">No grade requests match.</div>}
          <div className="space-y-3">
            {filtered.map((r) => {
              const busy = busyId === r.id
              return (
                <div key={r.id} className="p-3 border rounded-md">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-medium">
                        {r.studentName} — {r.courseCode} {r.courseTitle}
                        <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Requested by: {r.professorName} — {new Date(r.createdAt).toLocaleString()}
                      </div>
                      <div className="mt-2 text-sm">Reason: {r.reason}</div>
                      {r.proofDataUrl && (
                        <div className="mt-2">
                          <a className="text-primary" href={r.proofDataUrl} target="_blank" rel="noreferrer">
                            View proof{r.proofFilename ? `: ${r.proofFilename}` : ''}
                          </a>
                        </div>
                      )}
                      {r.status !== 'pending' && r.responseNote && (
                        <div className="mt-2 text-sm text-muted-foreground">Response note: {r.responseNote}</div>
                      )}
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex w-full flex-col gap-2 sm:w-72">
                        <Textarea
                          placeholder="Response note (required for rejection)"
                          value={notes[r.id] ?? ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          className="min-h-[60px] text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busy} onClick={() => handleDecision(r.id, true)}>
                            {busy ? 'Saving...' : 'Approve'}
                          </Button>
                          <Button size="sm" variant="destructive" disabled={busy} onClick={() => handleDecision(r.id, false)}>
                            {busy ? 'Saving...' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function GradesRequestsAdminPage() {
  return (
    <DashboardRouteGuard allowedRoles={['admin', 'super-admin', 'supervisor']} redirectTo="/dashboard">
      <GradesRequestsContent />
    </DashboardRouteGuard>
  )
}

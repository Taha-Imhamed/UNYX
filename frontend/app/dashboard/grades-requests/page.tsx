"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'

type Ticket = any

export default function GradesRequestsAdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canReview = user?.role === 'hod' || user?.role === 'super-admin'

  useEffect(() => {
    if (!canReview) return
    setLoading(true)
    fetch('/api/grade-change-requests')
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || 'Failed to load grade requests')
        setTickets(json.data ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load grade requests'))
      .finally(() => setLoading(false))
  }, [canReview])

  if (!canReview) return <div>You don't have access to Grades Requests.</div>

  const handleDecision = async (ticketId: string, approve: boolean, note?: string) => {
    const status = approve ? 'approved' : 'rejected'
    try {
      const res = await fetch(`/api/grade-change-requests/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, responseNote: note }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update grade request')
      // The backend applies the grade to the enrollment itself when status is "approved" —
      // no separate client-side write needed here.
      setTickets((prev) => prev.map((p) => (p.id === json.data.id ? json.data : p)))
    } catch (err) {
      toast({ variant: 'destructive', title: 'Unable to update request', description: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Grades Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading…</div>}
          {error && <div className="text-destructive text-sm">{error}</div>}
          {!loading && !error && tickets.length === 0 && <div>No grade requests.</div>}
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="p-3 border rounded-md">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{t.studentName} — {t.courseCode} {t.courseTitle}</div>
                    <div className="text-sm text-muted-foreground">Requested by: {t.professorName} — {new Date(t.createdAt).toLocaleString()}</div>
                    <div className="mt-2 text-sm">Reason: {t.reason}</div>
                    {t.proofDataUrl && <div className="mt-2"><a className="text-primary" href={t.proofDataUrl} target="_blank" rel="noreferrer">View proof{t.proofFilename ? `: ${t.proofFilename}` : ''}</a></div>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-sm">Status: {t.status}</div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleDecision(t.id, true)}>Approve</Button>
                      <Button size="sm" onClick={() => handleDecision(t.id, false)}>Reject</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { LifeBuoy, Plus, Send, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  createTicket,
  fetchTicket,
  fetchTicketMeta,
  fetchTickets,
  replyToTicket,
  setTicketStatus,
  type TicketBuckets,
  type TicketMeta,
} from "@/lib/tickets-api"
import type { SupportTicket, TicketCategory, TicketDepartment, TicketReply, TicketStatus } from "@shared/types"
import { cn } from "@/lib/utils"

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  technical: "Technical",
  "account-access": "Account / Access",
  academic: "Academic",
  billing: "Billing",
  facility: "Facility",
  other: "Other",
}

const STATUS_OPTIONS: TicketStatus[] = ["open", "in-progress", "resolved", "closed"]

const statusVariant: Record<TicketStatus, "default" | "secondary" | "outline" | "destructive"> = {
  open: "outline",
  "in-progress": "secondary",
  resolved: "default",
  closed: "destructive",
}

function TicketRow({ ticket, onOpen }: { ticket: SupportTicket; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(ticket.id)}
      className="flex w-full flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary/40 hover:bg-secondary/20 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{ticket.subject}</span>
          <Badge variant={statusVariant[ticket.status]} className="shrink-0">
            {ticket.status}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {ticket.requesterName} · {CATEGORY_LABELS[ticket.category]} · {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 self-start sm:self-center">
        {ticket.department}
      </Badge>
    </button>
  )
}

function CreateTicketDialog({ meta, onCreated }: { meta: TicketMeta | null; onCreated: () => void }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [department, setDepartment] = useState<TicketDepartment | "">("")
  const [category, setCategory] = useState<TicketCategory | "">("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setDepartment("")
    setCategory("")
    setSubject("")
    setDescription("")
  }

  const handleSubmit = async () => {
    if (!department || !category || !subject.trim() || !description.trim()) {
      toast({ variant: "destructive", title: "Missing info", description: "Department, category, subject, and description are all required." })
      return
    }
    setSubmitting(true)
    try {
      await createTicket({ department, category, subject: subject.trim(), description: description.trim() })
      toast({ title: "Ticket opened", description: "The department has been notified." })
      reset()
      setOpen(false)
      onCreated()
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to open ticket", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="default" className="gap-2">
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Open a support ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticket-department">Department</Label>
              <select
                id="ticket-department"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={department}
                onChange={(e) => setDepartment(e.target.value as TicketDepartment)}
              >
                <option value="" disabled>
                  Select department
                </option>
                {(meta?.departments ?? []).map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-category">Category</Label>
              <select
                id="ticket-category"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
              >
                <option value="" disabled>
                  Select category
                </option>
                {(meta?.categories ?? Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input id="ticket-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TicketDetail({ ticketId, canManageStatus, onBack, onChanged }: { ticketId: string; canManageStatus: boolean; onBack: () => void; onChanged: () => void }) {
  const { toast } = useToast()
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [replies, setReplies] = useState<TicketReply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState("")
  const [sending, setSending] = useState(false)
  const [statusPending, setStatusPending] = useState(false)

  const load = () => {
    setIsLoading(true)
    setError(null)
    fetchTicket(ticketId)
      .then((data) => {
        setTicket(data.ticket)
        setReplies(data.replies)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load ticket"))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  const handleReply = async () => {
    if (!replyBody.trim()) return
    setSending(true)
    try {
      await replyToTicket(ticketId, replyBody.trim())
      setReplyBody("")
      load()
      onChanged()
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to send reply", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (status: TicketStatus) => {
    setStatusPending(true)
    try {
      await setTicketStatus(ticketId, status)
      load()
      onChanged()
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to update status", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setStatusPending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Loading ticket
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load ticket</AlertTitle>
        <AlertDescription>{error ?? "Ticket not found."}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
      </Button>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{ticket.subject}</CardTitle>
            <CardDescription>
              {ticket.requesterName} · {CATEGORY_LABELS[ticket.category]} · {ticket.department} · opened{" "}
              {new Date(ticket.createdAt).toLocaleString()}
            </CardDescription>
          </div>
          <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap break-words text-sm text-foreground">{ticket.description}</p>

          {canManageStatus && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="text-xs font-medium text-muted-foreground">Status:</span>
              {STATUS_OPTIONS.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={ticket.status === s ? "default" : "outline"}
                  disabled={statusPending || ticket.status === s}
                  onClick={() => handleStatusChange(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {replies.map((reply) => (
          <div key={reply.id} className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">
                {reply.authorName} <span className="font-normal text-muted-foreground">({reply.authorRole})</span>
              </span>
              <span className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{reply.body}</p>
          </div>
        ))}
        {replies.length === 0 && <p className="py-2 text-sm text-muted-foreground">No replies yet.</p>}
      </div>

      {ticket.status !== "closed" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="flex-1"
          />
          <Button onClick={handleReply} disabled={sending || !replyBody.trim()} className="gap-2 sm:self-end">
            {sending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            Reply
          </Button>
        </div>
      )}
    </div>
  )
}

export function TicketsPage({ title = "Tickets", description = "Open a ticket, or view tickets sent to you." }: { title?: string; description?: string }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin" || user?.role === "super-admin"

  const [meta, setMeta] = useState<TicketMeta | null>(null)
  const [buckets, setBuckets] = useState<TicketBuckets | null>(null)
  const [tab, setTab] = useState<"mine" | "assigned" | "all">("mine")
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setError(null)
    Promise.all([fetchTicketMeta(), fetchTickets()])
      .then(([metaData, bucketData]) => {
        setMeta(metaData)
        setBuckets(bucketData)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load tickets"))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (buckets?.assigned.length && tab === "mine" && buckets.mine.length === 0) {
      setTab("assigned")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buckets])

  const activeList = useMemo(() => {
    if (!buckets) return []
    if (tab === "assigned") return buckets.assigned
    if (tab === "all") return buckets.all
    return buckets.mine
  }, [buckets, tab])

  const canManageSelectedStatus = useMemo(() => {
    if (!selectedTicketId || !buckets) return false
    if (isAdmin) return true
    return buckets.assigned.some((t) => t.id === selectedTicketId)
  }, [selectedTicketId, buckets, isAdmin])

  if (selectedTicketId) {
    return (
      <div className="space-y-4 p-6">
        <TicketDetail
          ticketId={selectedTicketId}
          canManageStatus={canManageSelectedStatus}
          onBack={() => setSelectedTicketId(null)}
          onChanged={load}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-2">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LifeBuoy className="h-4 w-4" /> {title}
          </p>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <CreateTicketDialog meta={meta} onCreated={load} />
      </div>

      <div className="space-y-4 p-6 pt-2">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load tickets</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "mine" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/40",
            )}
          >
            My Tickets {buckets ? `(${buckets.mine.length})` : ""}
          </button>
          {buckets?.myDepartment && (
            <button
              type="button"
              onClick={() => setTab("assigned")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === "assigned" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/40",
              )}
            >
              Assigned to Me ({buckets.assigned.length})
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/40",
              )}
            >
              All Tickets ({buckets?.all.length ?? 0})
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading tickets…
          </div>
        ) : activeList.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">No tickets here yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeList.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} onOpen={setSelectedTicketId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

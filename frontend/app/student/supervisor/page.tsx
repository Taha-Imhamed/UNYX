"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { fetchProfessors } from "@/lib/professor-api"
import { fetchStudentMe } from "@/lib/students-api"
import { fetchMyAdvisingMessages, sendAdvisingMessage } from "@/lib/advising-api"
import type { AdvisingMessage, Professor, Student } from "@shared/types"
import { Mail, Phone, MapPin, UserRound, Send } from "lucide-react"
import { StudentFeatureGate } from "@/components/student-feature-gate"
import { useToast } from "@/hooks/use-toast"

function AdvisorMessageThread({ advisorId }: { advisorId: string }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<AdvisingMessage[]>([])
  const [draft, setDraft] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    const controller = new AbortController()
    setIsLoading(true)
    fetchMyAdvisingMessages(advisorId, controller.signal)
      .then(setMessages)
      .catch(() => {
        if (!controller.signal.aborted) setMessages([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [advisorId])

  useEffect(() => load(), [load])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" })
  }, [messages])

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    setIsSending(true)
    try {
      await sendAdvisingMessage({ advisorId, body: trimmed })
      setDraft("")
      load()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to send message", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-secondary/20 p-3">
      <p className="text-sm font-semibold text-foreground">Message your advisor</p>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Spinner className="h-3 w-3" /> Loading messages
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="text-xs text-muted-foreground">No messages yet. Say hello below.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
              msg.senderRole === "student" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
            <p className="mt-1 text-[10px] opacity-70">{new Date(msg.createdAt).toLocaleString()}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message..."
          rows={2}
          className="text-sm"
        />
        <Button size="icon" disabled={isSending || !draft.trim()} onClick={handleSend}>
          {isSending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

export default function SupervisorPage() {
  return (
    <StudentFeatureGate featureKey="advisor-contact">
      <SupervisorPageInner />
    </StudentFeatureGate>
  )
}

function SupervisorPageInner() {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    Promise.all([fetchStudentMe(controller.signal), fetchProfessors(controller.signal)])
      .then(([studentData, professorList]) => {
        setStudent(studentData)
        setProfessors(professorList)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load supervisor")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  const supervisor =
    student?.supervisorId && professors.find((p) => p.id === student.supervisorId)
      ? professors.find((p) => p.id === student.supervisorId)!
      : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Support & Guidance</p>
          <h1 className="text-2xl font-semibold text-foreground">Your Supervisor</h1>
        </div>
        {supervisor && <Badge variant="secondary" className="text-foreground">Assigned</Badge>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="h-4 w-4" /> Loading supervisor…</div>
      ) : error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : !supervisor ? (
        <Card className="border border-border bg-card">
          <CardContent className="py-4 space-y-2 text-sm text-muted-foreground">
            <div>No supervisor has been assigned to you yet.</div>
            <div>
              If you need assistance, please submit a support request and our Student Support Team will review it and route it to the appropriate staff (supervisor, admin, or finance).
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/student/support">Submit support request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-[#7b766d]" />
              <CardTitle className="text-foreground text-base">{supervisor.firstName} {supervisor.lastName}</CardTitle>
            </div>
            <Badge variant="outline" className="text-foreground border-border">{supervisor.department}</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#7b766d]" />{supervisor.email}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#7b766d]" />{supervisor.phone}</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#7b766d]" />{supervisor.specialization}</div>

            <AdvisorMessageThread advisorId={supervisor.id} />

            <div className="rounded-md border border-border bg-secondary/40 p-3 space-y-2">
              <div className="text-foreground font-semibold text-sm">Need support? Start here</div>
              <div className="text-xs text-muted-foreground">
                To get help quickly, submit a support request describing the issue, the course or student ID it relates to, and any steps or attachments that help explain the problem. Your supervisor will review the request and, if necessary, route it to admin, finance, or other teams.
              </div>
              <ul className="text-xs text-muted-foreground list-disc pl-5">
                <li>What to include: clear subject, short description, course code or student ID, and attachments (if any).</li>
                <li>Examples: billing questions, enrollment changes, advisor guidance, or technical issues.</li>
                <li>Response time: supervisors and support staff usually respond within 2 business days.</li>
              </ul>
              <div>
                <Button asChild size="sm">
                  <Link href="/student/support">Submit support request</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

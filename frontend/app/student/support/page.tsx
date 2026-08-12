"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createFeedback, fetchFeedback } from "@/lib/feedback-api"
import type { Feedback } from "@shared/types"
import { StudentFeatureGate } from "@/components/student-feature-gate"

const typeOptions: Feedback["type"][] = ["course", "professor", "facility", "general"]
const priorities: Array<NonNullable<Feedback["priority"]>> = ["low", "normal", "high"]

export default function StudentSupportPage() {
  return (
    <StudentFeatureGate featureKey="support">
      <StudentSupportPageInner />
    </StudentFeatureGate>
  )
}

function StudentSupportPageInner() {
  const { toast } = useToast()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<Feedback["type"]>("general")
  const [priority, setPriority] = useState<Feedback["priority"]>("normal")
  const [targetRole, setTargetRole] = useState<NonNullable<Feedback["targetRole"]>>("admin")
  const [courseId, setCourseId] = useState("")
  const [professorName, setProfessorName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [items, setItems] = useState<Feedback[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const loadFeedback = () => {
    setLoadingList(true)
    setListError(null)
    fetchFeedback()
      .then((data) => setItems(data))
      .catch((err) => setListError(err instanceof Error ? err.message : "Unable to load feedback"))
      .finally(() => setLoadingList(false))
  }

  useEffect(() => {
    loadFeedback()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    const trimmedMessage = message.trim()
    const trimmedSubject = subject.trim()
    if (!trimmedMessage) {
      toast({ variant: "destructive", title: "Message required", description: "Please include your request or feedback." })
      return
    }

    setIsSubmitting(true)
    try {
      await createFeedback({
        subject: trimmedSubject || undefined,
        comment: trimmedMessage,
        category: type,
        type,
        priority,
        courseId: courseId.trim() || undefined,
        professorName: professorName.trim() || undefined,
        rating,
        targetRole,
        source: "student-portal",
      })
      toast({ title: "Sent", description: "Your message has been sent to the university team." })
      setSubject("")
      setMessage("")
      setCourseId("")
      setProfessorName("")
      setRating(undefined)
      loadFeedback()
    } catch (err) {
      console.error("Feedback submit failed", err)
      toast({ variant: "destructive", title: "Unable to send", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Support</p>
        <h1 className="text-2xl font-bold text-foreground">Contact admin, supervisor, or professor</h1>
        <p className="text-sm text-muted-foreground">Submit feedback or a request. It routes to the selected role.</p>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Send a message</CardTitle>
          <CardDescription>Choose the audience and include course/professor details when relevant.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Topic</Label>
                <select
                  id="type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value as Feedback["type"])}
                >
                  {typeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Feedback["priority"])}
                >
                  {priorities.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetRole">Send to</Label>
                <select
                  id="targetRole"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as NonNullable<Feedback["targetRole"]>)}
                >
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseId">Course (optional)</Label>
                <Input
                  id="courseId"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  placeholder="Course code or ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professorName">Professor (optional)</Label>
                <Input
                  id="professorName"
                  value={professorName}
                  onChange={(e) => setProfessorName(e.target.value)}
                  placeholder="Professor name"
                />
              </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short subject"
              />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Rating (optional)</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => {
                const isActive = rating !== undefined && value <= rating
                return (
                  <button
                    key={value}
                    type="button"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                      isActive ? "border-warning bg-warning/10 text-warning" : "border-border text-muted-foreground"
                    }`}
                    onClick={() => setRating(rating === value ? undefined : value)}
                    aria-label={`${value} star rating`}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">Optional: rate your experience from 1 to 5 stars.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include details, context, and any steps taken."
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="h-4 w-4" /> : "Send message"}
              </Button>
              <p className="text-xs text-muted-foreground">Replies go to the university team (admin or supervisor).</p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Your requests</CardTitle>
          <CardDescription>Status of feedback you’ve sent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingList && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Loading
            </div>
          )}
          {listError && (
            <Alert variant="destructive">
              <AlertTitle>Unable to load feedback</AlertTitle>
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          )}
          {!loadingList && !listError && items.length === 0 && (
            <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
          )}
          {!loadingList && !listError && items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-foreground">{item.subject ?? item.type}</div>
                      <div className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</div>
                    </div>
                    <Badge variant="outline" className="border-border text-foreground">{item.status}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-foreground whitespace-pre-wrap break-words">{item.comment}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.type} • priority {item.priority ?? "normal"} • to {item.targetRole ?? "admin"}
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

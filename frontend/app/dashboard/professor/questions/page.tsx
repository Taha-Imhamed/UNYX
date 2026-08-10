"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import { fetchQuestions, replyToQuestion, type Question } from "@/lib/questions-api"

export default function ProfessorQuestionsPage() {
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId } = useProfessorCourseWorkspace()
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [isReplyingId, setIsReplyingId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    fetchQuestions(controller.signal)
      .then((items) => setQuestions(items))
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load questions")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  const courseQuestions = useMemo(() => questions.filter((q) => q.courseId === selectedCourseId), [questions, selectedCourseId])

  const handleReply = async (questionId: string) => {
    const text = replyDrafts[questionId]?.trim()
    if (!text) return
    setIsReplyingId(questionId)
    try {
      const updated = await replyToQuestion(questionId, text)
      setQuestions((prev) => prev.map((question) => (question.id === updated.id ? updated : question)))
      setReplyDrafts((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reply")
    } finally {
      setIsReplyingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Student Questions" description="Answer questions from your students" />
      <ProfessorTabNav />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Select course</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessorCourseSelect courses={courses} selectedCourseId={selectedCourseId} onChange={setSelectedCourseId} isLoading={isLoadingCourses} />
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Student questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading questions...</p>
          ) : courseQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions yet for this course.</p>
          ) : (
            courseQuestions.map((question) => (
              <div key={question.id} className="space-y-2 rounded-md border border-border bg-secondary/45 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{question.id}</span>
                  <span>{new Date(question.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground">{question.body}</p>
                {question.reply ? (
                  <div className="text-sm text-muted-foreground">Reply: {question.reply}</div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={`reply-${question.id}`}>Reply</Label>
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                      <Input
                        id={`reply-${question.id}`}
                        value={replyDrafts[question.id] ?? ""}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))}
                        placeholder="Type a response"
                        className="border-border bg-secondary/70"
                      />
                      <Button type="button" onClick={() => handleReply(question.id)} disabled={isReplyingId === question.id}>
                        {isReplyingId === question.id ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useStudentEnrollments } from "@/hooks/use-student-portal"
import { fetchMyReviews, submitReview } from "@/lib/course-reviews-api"
import type { CourseReview } from "@shared/types"

function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star`}>
          <Star className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  )
}

export default function CourseReviewsPage() {
  const { toast } = useToast()
  const { enrollments, isLoading: enrollmentsLoading } = useStudentEnrollments()
  const [reviews, setReviews] = useState<CourseReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, { rating: number; difficulty: number; comment: string }>>({})
  const [submittingCourseId, setSubmittingCourseId] = useState<string | null>(null)

  const load = useCallback(() => {
    const controller = new AbortController()
    setIsLoading(true)
    fetchMyReviews(controller.signal)
      .then(setReviews)
      .catch(() => {
        if (!controller.signal.aborted) setReviews([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => load(), [load])

  const reviewedCourseIds = useMemo(() => new Set(reviews.map((r) => r.courseId)), [reviews])
  const eligibleCourses = useMemo(() => {
    const seen = new Set<string>()
    return enrollments.filter((enr) => {
      if (seen.has(enr.courseId)) return false
      seen.add(enr.courseId)
      return true
    })
  }, [enrollments])

  const getDraft = (courseId: string) => drafts[courseId] ?? { rating: 5, difficulty: 3, comment: "" }
  const setDraft = (courseId: string, patch: Partial<{ rating: number; difficulty: number; comment: string }>) => {
    setDrafts((prev) => ({ ...prev, [courseId]: { ...getDraft(courseId), ...patch } }))
  }

  const handleSubmit = async (courseId: string, courseTitle: string, professorId?: string | null, professorName?: string | null) => {
    const draft = getDraft(courseId)
    setSubmittingCourseId(courseId)
    try {
      await submitReview({
        courseId,
        courseTitle,
        professorId,
        professorName,
        rating: draft.rating,
        difficulty: draft.difficulty,
        comment: draft.comment.trim() || null,
      })
      toast({ title: "Review submitted", description: "Thanks for your feedback." })
      load()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to submit review", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setSubmittingCourseId(null)
    }
  }

  const loading = isLoading || enrollmentsLoading

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Course & Professor Reviews</p>
        <h1 className="text-2xl font-bold text-foreground">Rate your courses</h1>
        <p className="text-sm text-muted-foreground">Share feedback on courses you've taken to help other students choose.</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Loading
        </div>
      )}

      {!loading && eligibleCourses.length === 0 && (
        <p className="text-sm text-muted-foreground">You don't have any enrolled courses to review yet.</p>
      )}

      <div className="space-y-4">
        {eligibleCourses.map((enrollment) => {
          const existingReview = reviews.find((r) => r.courseId === enrollment.courseId)
          const draft = getDraft(enrollment.courseId)
          const submitting = submittingCourseId === enrollment.courseId

          return (
            <Card key={enrollment.courseId} className="border border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{enrollment.courseTitle}</CardTitle>
                  {reviewedCourseIds.has(enrollment.courseId) && <Badge variant="outline">Reviewed</Badge>}
                </div>
                <CardDescription>{enrollment.courseCode} • {enrollment.professorName ?? "Unknown professor"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <StarPicker value={draft.rating} onChange={(v) => setDraft(enrollment.courseId, { rating: v })} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Difficulty (1 easy - 5 hard)</p>
                    <StarPicker value={draft.difficulty} onChange={(v) => setDraft(enrollment.courseId, { difficulty: v })} />
                  </div>
                </div>
                <Textarea
                  placeholder="What did you think of this course?"
                  value={draft.comment}
                  onChange={(e) => setDraft(enrollment.courseId, { comment: e.target.value })}
                />
                <Button
                  size="sm"
                  disabled={submitting}
                  onClick={() => handleSubmit(enrollment.courseId, enrollment.courseTitle, null, enrollment.professorName ?? null)}
                >
                  {submitting ? <Spinner className="h-4 w-4" /> : existingReview ? "Update review" : "Submit review"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

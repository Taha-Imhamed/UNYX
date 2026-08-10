import type { CourseReview, CourseReviewSummary } from "@shared/types"
import { apiFetch } from "./api-client"

export function fetchReviewSummaries(signal?: AbortSignal) {
  return apiFetch<CourseReviewSummary[]>("/course-reviews/summary", { signal })
}

export function fetchCourseReviews(courseId: string, signal?: AbortSignal) {
  return apiFetch<CourseReview[]>(`/course-reviews?courseId=${encodeURIComponent(courseId)}`, { signal })
}

export function fetchMyReviews(signal?: AbortSignal) {
  return apiFetch<CourseReview[]>("/course-reviews/mine", { signal })
}

export function submitReview(payload: {
  courseId: string
  courseTitle: string
  professorId?: string | null
  professorName?: string | null
  rating: number
  difficulty?: number | null
  comment?: string | null
}) {
  return apiFetch<CourseReview>("/course-reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function deleteReview(id: string) {
  return apiFetch<void>(`/course-reviews/${id}`, { method: "DELETE" })
}

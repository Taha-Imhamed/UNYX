import type { Feedback } from "@shared/types"
import { apiFetch } from "./api-client"

export type CreateFeedbackPayload = Pick<Feedback, "comment" | "subject" | "category" | "rating" | "type" | "priority" | "professorId" | "professorName" | "courseId" | "targetRole" | "source"> & {
  attachment?: string
  attachmentName?: string
}

/**
 * Create feedback (requires authenticated session; token must be in sessionStorage as set by login).
 */
export function createFeedback(payload: CreateFeedbackPayload, signal?: AbortSignal) {
  return apiFetch<Feedback>("/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  })
}

/**
 * List feedback for the current user (students see their own only).
 */
export function fetchFeedback(signal?: AbortSignal) {
  return apiFetch<Feedback[]>("/feedback", { signal })
}

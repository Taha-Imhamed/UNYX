import { apiFetch } from './api-client'

export interface GradeChangeRequest {
  id: string
  enrollmentId: string
  courseId: string
  courseCode?: string | null
  courseTitle?: string | null
  studentId: string
  studentName: string
  professorId: string
  professorName: string
  newGrades: Record<string, number | null>
  reason: string
  proofDataUrl?: string | null
  proofFilename?: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  responseNote?: string | null
}

export interface CreateGradeChangeRequestPayload {
  enrollmentId: string
  newGrades: Record<string, number | null>
  reason: string
  proofBase64?: string
  proofFilename?: string
}

export function fetchGradeChangeRequests(signal?: AbortSignal) {
  return apiFetch<GradeChangeRequest[]>('/grade-change-requests', { signal })
}

export function createGradeChangeRequest(payload: CreateGradeChangeRequestPayload) {
  return apiFetch<GradeChangeRequest>('/grade-change-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function reviewGradeChangeRequest(id: string, status: 'approved' | 'rejected', responseNote?: string) {
  return apiFetch<GradeChangeRequest>(`/grade-change-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, responseNote }),
  })
}

import type { Question } from '@shared/types'
import { apiFetch } from './api-client'

export type { Question } from '@shared/types'

export function fetchQuestions(signal?: AbortSignal) {
  return apiFetch<Question[]>(`/questions`, { signal })
}

export function submitQuestion(payload: { courseId: string; body: string }) {
  return apiFetch<Question>(`/questions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function replyToQuestion(id: string, reply: string) {
  return apiFetch<Question>(`/questions/${id}/reply`, {
    method: 'PUT',
    body: JSON.stringify({ reply }),
  })
}

import type { Professor } from '@shared/types'
import { apiFetch } from './api-client'

export function fetchProfessors(signal?: AbortSignal) {
  return apiFetch<Professor[]>(`/professors`, { signal })
}

export function createProfessor(payload: Omit<Professor, 'id'>) {
  return apiFetch<Professor>(`/professors`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProfessor(id: string, payload: Partial<Omit<Professor, 'id'>>) {
  return apiFetch<Professor>(`/professors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteProfessor(id: string) {
  return apiFetch<{ message: string }>(`/professors/${id}`, {
    method: 'DELETE',
  })
}

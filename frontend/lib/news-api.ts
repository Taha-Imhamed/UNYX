import type { NewsItem } from '@shared/types'
import { apiFetch } from './api-client'

export function fetchNews(signal?: AbortSignal) {
  return apiFetch<NewsItem[]>(`/news`, { signal })
}

export interface PublishNewsInput {
  title: string
  body: string
  createdBy: string
  expiresAt?: string | null
  imageUrl?: string | null
}

export function publishNews(input: PublishNewsInput) {
  return apiFetch<NewsItem>(`/news`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export interface UpdateNewsInput {
  title?: string
  body?: string
  expiresAt?: string | null
  imageUrl?: string | null
}

export function updateNews(id: string, input: UpdateNewsInput) {
  return apiFetch<NewsItem>(`/news/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteNews(id: string) {
  return apiFetch<{ id: string }>(`/news/${id}`, {
    method: 'DELETE',
  })
}

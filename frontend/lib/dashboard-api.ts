import type { DashboardStats, Student, Feedback, Income, Expense } from '@shared/types'
import { apiFetch } from './api-client'

export interface DashboardOverview {
  stats: DashboardStats
  recentStudents: Student[]
  recentFeedback: Feedback[]
  recentIncome: Income[]
  recentExpenses: Expense[]
}

export function fetchDashboardStats(
  options?: { period?: 'month' | 'year' | 'all'; startDate?: string; endDate?: string } | null,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams()
  if (options?.period && options.period !== 'all') {
    params.set('period', options.period)
  }
  if (options?.startDate) {
    params.set('startDate', options.startDate)
  }
  if (options?.endDate) {
    params.set('endDate', options.endDate)
  }
  const query = params.toString()
  return apiFetch<DashboardStats>(`/dashboard/stats${query ? `?${query}` : ''}`, { signal })
}

export function fetchDashboardOverview(signal?: AbortSignal) {
  return apiFetch<DashboardOverview>('/dashboard/overview', { signal })
}

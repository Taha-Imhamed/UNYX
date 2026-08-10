import { Router } from 'express'
import {
  studentsCollection,
  professorsCollection,
  incomeCollection,
  expensesCollection,
  feedbackCollection,
} from '../data/collections.js'
import type { DashboardStats } from '../../../shared/types/index.js'

export const dashboardRoutes: ReturnType<typeof Router> = Router()

type PeriodFilter = 'month' | 'year' | 'all'

function buildDateMatch(options: { period?: PeriodFilter; startDate?: string; endDate?: string }) {
  const { period, startDate, endDate } = options

  // Explicit date range wins if provided
  if (startDate || endDate) {
    const match: Record<string, { $gte?: string; $lte?: string }> = { date: {} }
    if (startDate) match.date.$gte = startDate
    if (endDate) match.date.$lte = endDate
    // Clean up empty date object
    if (!match.date.$gte && !match.date.$lte) return {}
    return match
  }

  if (period === 'month') {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 1)
    return { date: { $gte: cutoff.toISOString() } }
  }
  if (period === 'year') {
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 1)
    return { date: { $gte: cutoff.toISOString() } }
  }
  return {}
}

async function computeDashboardStats(options?: { period?: PeriodFilter; startDate?: string; endDate?: string }): Promise<DashboardStats> {
  const [studentsCol, professorsCol, incomeCol, expensesCol, feedbackCol] = await Promise.all([
    studentsCollection(),
    professorsCollection(),
    incomeCollection(),
    expensesCollection(),
    feedbackCollection(),
  ])

  const dateMatch = buildDateMatch({
    period: options?.period,
    startDate: options?.startDate,
    endDate: options?.endDate,
  })
  const incomePipeline: Array<Record<string, unknown>> = []
  const expensePipeline: Array<Record<string, unknown>> = []
  if (Object.keys(dateMatch).length > 0) {
    incomePipeline.push({ $match: dateMatch })
    expensePipeline.push({ $match: dateMatch })
  }
  incomePipeline.push({ $group: { _id: null, total: { $sum: '$amount' } } })
  expensePipeline.push({ $group: { _id: null, total: { $sum: '$amount' } } })

  const [totalStudents, activeStudents, totalProfessors, incomeAgg, expenseAgg, pendingFeedback, ratingAgg] =
    await Promise.all([
      studentsCol.countDocuments(),
      studentsCol.countDocuments({ status: 'active' }),
      professorsCol.countDocuments(),
      incomeCol.aggregate<{ total: number }>(incomePipeline).toArray(),
      expensesCol.aggregate<{ total: number }>(expensePipeline).toArray(),
      feedbackCol.countDocuments({ status: 'new' }),
      feedbackCol.aggregate<{ avg: number }>([{ $group: { _id: null, avg: { $avg: '$rating' } } }]).toArray(),
    ])

  return {
    totalStudents,
    activeStudents,
    totalProfessors,
    totalIncome: incomeAgg[0]?.total ?? 0,
    totalExpenses: expenseAgg[0]?.total ?? 0,
    netIncome: (incomeAgg[0]?.total ?? 0) - (expenseAgg[0]?.total ?? 0),
    pendingFeedback,
    averageRating: Number((ratingAgg[0]?.avg ?? 0).toFixed(2)),
  }
}

dashboardRoutes.get('/stats', async (req, res) => {
  try {
    const period = req.query?.period === 'month' || req.query?.period === 'year' ? (req.query.period as PeriodFilter) : 'all'
    const startDate = typeof req.query?.startDate === 'string' ? req.query.startDate : undefined
    const endDate = typeof req.query?.endDate === 'string' ? req.query.endDate : undefined
    const stats = await computeDashboardStats({ period, startDate, endDate })
    const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'super-admin' || req.auth?.role === 'supervisor'
    const safeStats: DashboardStats = isPrivileged
      ? stats
      : {
          ...stats,
          totalIncome: 0,
          totalExpenses: 0,
          netIncome: 0,
        }
    res.json({ success: true, data: safeStats })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' })
  }
})

dashboardRoutes.get('/overview', async (req, res) => {
  try {
    const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'super-admin' || req.auth?.role === 'supervisor'
    const [studentsCol, incomeCol, expensesCol, feedbackCol, stats] = await Promise.all([
      studentsCollection(),
      incomeCollection(),
      expensesCollection(),
      feedbackCollection(),
      computeDashboardStats(),
    ])

    const [recentStudents, recentFeedback, recentIncome, recentExpenses] = await Promise.all([
      studentsCol.find().sort({ enrollmentDate: -1 }).limit(4).toArray(),
      feedbackCol.find().sort({ date: -1 }).limit(3).toArray(),
      isPrivileged ? incomeCol.find().sort({ date: -1 }).limit(3).toArray() : Promise.resolve([]),
      isPrivileged ? expensesCol.find().sort({ date: -1 }).limit(3).toArray() : Promise.resolve([]),
    ])

    const safeStats: DashboardStats = isPrivileged
      ? stats
      : {
          ...stats,
          totalIncome: 0,
          totalExpenses: 0,
          netIncome: 0,
        }

    const overview = {
      stats: safeStats,
      recentStudents,
      recentFeedback,
      recentIncome,
      recentExpenses,
    }
    res.json({ success: true, data: overview })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard overview' })
  }
})

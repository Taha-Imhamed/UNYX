import { Router } from 'express'
import { paymentsCollection } from '../data/collections.js'
import { requirePermission } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const paymentRoutes: ReturnType<typeof Router> = Router()

// Payment history is admin-only because it can reveal other students' data.
paymentRoutes.get('/', requirePermission('finance:view'), async (req, res) => {
  try {
    const { studentId, limit, page } = req.query
    const collection = await paymentsCollection()

    const pageSize = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 100
    const pageNum = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1

    const filter: Record<string, unknown> = { deletedAt: { $exists: false } }
    if (typeof studentId === 'string' && studentId.trim()) {
      filter.studentId = studentId.trim()
    }

    const cursor = collection.find(filter as any).sort({ createdAt: -1 })
    const total = await cursor.count()
    const items = await cursor.skip((pageNum - 1) * pageSize).limit(pageSize).toArray()

    res.json({ success: true, data: { items, total, page: pageNum, pageSize } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch payments')
    res.status(500).json({ success: false, error: 'Failed to fetch payments' })
  }
})

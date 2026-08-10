import { Router } from 'express'
import type { Coupon } from '../../../shared/types/index.js'
import { couponsCollection } from '../data/collections.js'
import { requireAdmin } from '../middleware/auth.js'

const router: ReturnType<typeof Router> = Router()

// GET /api/coupons
router.get('/', async (_req, res) => {
  try {
    const couponsCol = await couponsCollection()
    const coupons = await couponsCol.find().sort({ createdAt: -1 }).toArray()
    res.json({ success: true, data: coupons })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch coupons' })
  }
})

// POST /api/coupons
router.post('/', requireAdmin, async (req, res) => {
  const { code, percent } = req.body ?? {}

  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ success: false, error: 'Coupon code is required' })
  }

  const normalised = code.trim().toLowerCase()
  const numericPercent = Number(percent)
  const percentValue =
    Number.isFinite(numericPercent) && numericPercent > 0 && numericPercent <= 1
      ? Number((numericPercent * 100).toFixed(2))
      : numericPercent

  if (!Number.isFinite(percentValue) || percentValue <= 0 || percentValue > 100) {
    return res.status(400).json({ success: false, error: 'Percent must be between 0 and 100' })
  }

  try {
    const couponsCol = await couponsCollection()
    await couponsCol.createIndex({ code: 1 }, { unique: true })

    const existing = await couponsCol.findOne({ code: normalised })
    if (existing) {
      return res.status(409).json({ success: false, error: 'Coupon already exists' })
    }

    const now = new Date().toISOString()
    const coupon: Coupon = { code: normalised, percent: percentValue, createdAt: now }

    await couponsCol.insertOne(coupon)
    return res.status(201).json({ success: true, data: coupon, message: 'Coupon created' })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create coupon' })
  }
})

export default router

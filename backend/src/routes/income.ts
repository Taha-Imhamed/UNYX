import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { incomeCollection } from '../data/collections.js'
import { requirePermission } from '../middleware/auth.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { logger } from '../lib/logger.js'
import type { Income } from '../../../shared/types/index.js'

export const incomeRoutes: ReturnType<typeof Router> = Router()
incomeRoutes.use(requirePermission('finance:view'))

function buildIncomeId() {
  return `INC-${randomUUID().slice(0, 8).toUpperCase()}`
}

const incomeSchema = z.object({
  source: z.string().trim().min(1),
  description: z.string().trim().min(1),
  amount: z.number(),
  date: z.string().trim().min(1),
  studentId: z.string().trim().optional(),
})

incomeRoutes.get('/', async (_req, res) => {
  try {
    const collection = await incomeCollection()
    const all = await collection.find().sort({ date: -1 }).toArray()
    res.json({ success: true, data: all })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch income records')
    res.status(500).json({ success: false, error: 'Failed to fetch income records' })
  }
})

incomeRoutes.get('/:id', async (req, res) => {
  try {
    const collection = await incomeCollection()
    const income = await collection.findOne({ id: req.params.id })
    if (!income) {
      return res.status(404).json({ success: false, error: 'Income record not found' })
    }
    res.json({ success: true, data: income })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch income record')
    res.status(500).json({ success: false, error: 'Failed to fetch income record' })
  }
})

incomeRoutes.post('/', async (req, res) => {
  try {
    if (!(req.auth?.effectivePermissions ?? []).includes('finance:manage')) {
      return res.status(403).json({ success: false, error: 'Finance manage permission required' })
    }
    const parsed = incomeSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' })
    }
    const { source, description, amount, date, studentId } = parsed.data

    const collection = await incomeCollection()
    const entry: Income = {
      id: buildIncomeId(),
      source,
      description,
      amount,
      date,
      studentId,
    }

    await collection.insertOne(entry)
    await writeAuditLog({
      action: 'income_created',
      entityType: 'income',
      entityId: entry.id,
      details: { source, amount },
      auth: req.auth,
    })
    res.status(201).json({ success: true, data: entry, message: 'Income created' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create income record')
    res.status(500).json({ success: false, error: 'Failed to create income record' })
  }
})

incomeRoutes.put('/:id', async (req, res) => {
  try {
    if (!(req.auth?.effectivePermissions ?? []).includes('finance:manage')) {
      return res.status(403).json({ success: false, error: 'Finance manage permission required' })
    }
    const collection = await incomeCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Income record not found' })
    }

    const parsed = incomeSchema.partial().safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' })
    }
    const updates: Partial<Income> = parsed.data

    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({
      action: 'income_updated',
      entityType: 'income',
      entityId: existing.id,
      details: { updatedFields: Object.keys(updates) },
      auth: req.auth,
    })
    res.json({ success: true, data: updated ?? { ...existing, ...updates }, message: 'Income updated' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update income record')
    res.status(500).json({ success: false, error: 'Failed to update income record' })
  }
})

incomeRoutes.delete('/:id', async (req, res) => {
  try {
    if (!(req.auth?.effectivePermissions ?? []).includes('finance:manage')) {
      return res.status(403).json({ success: false, error: 'Finance manage permission required' })
    }
    const collection = await incomeCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Income record not found' })
    }
    await writeAuditLog({
      action: 'income_deleted',
      entityType: 'income',
      entityId: req.params.id,
      details: {},
      auth: req.auth,
    })
    res.json({ success: true, message: 'Income deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete income record')
    res.status(500).json({ success: false, error: 'Failed to delete income record' })
  }
})

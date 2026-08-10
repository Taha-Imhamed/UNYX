import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { expensesCollection } from '../data/collections.js'
import { requirePermission } from '../middleware/auth.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { logger } from '../lib/logger.js'
import type { Expense } from '../../../shared/types/index.js'
import { z } from 'zod'

export const expenseRoutes: ReturnType<typeof Router> = Router()
expenseRoutes.use(requirePermission('finance:view'))

function buildExpenseId() {
  return `EXP-${randomUUID().slice(0, 8).toUpperCase()}`
}

const expenseSchema = z.object({
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  amount: z.number(),
  date: z.string().trim().min(1),
  approvedBy: z.string().trim().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
})

expenseRoutes.get('/', async (_req, res) => {
  try {
    const collection = await expensesCollection()
    const all = await collection.find().sort({ date: -1 }).toArray()
    res.json({ success: true, data: all })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch expenses')
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' })
  }
})

expenseRoutes.get('/:id', async (req, res) => {
  try {
    const collection = await expensesCollection()
    const expense = await collection.findOne({ id: req.params.id })
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' })
    }
    res.json({ success: true, data: expense })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch expense')
    res.status(500).json({ success: false, error: 'Failed to fetch expense' })
  }
})

expenseRoutes.post('/', async (req, res) => {
  try {
    if (!(req.auth?.effectivePermissions ?? []).includes('finance:manage')) {
      return res.status(403).json({ success: false, error: 'Finance manage permission required' })
    }
    const parsed = expenseSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' })
    }
    const { category, description, amount, date, approvedBy, status } = parsed.data

    const collection = await expensesCollection()
    const entry: Expense = {
      id: buildExpenseId(),
      category,
      description,
      amount,
      date,
      approvedBy: approvedBy ?? 'Admin',
      status: status ?? 'pending',
    }

    await collection.insertOne(entry)
    await writeAuditLog({
      action: 'expense_created',
      entityType: 'expense',
      entityId: entry.id,
      details: { category, amount, status: entry.status },
      auth: req.auth,
    })
    res.status(201).json({ success: true, data: entry, message: 'Expense created' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create expense')
    res.status(500).json({ success: false, error: 'Failed to create expense' })
  }
})

expenseRoutes.put('/:id', async (req, res) => {
  try {
    if (!(req.auth?.effectivePermissions ?? []).includes('finance:manage')) {
      return res.status(403).json({ success: false, error: 'Finance manage permission required' })
    }
    const collection = await expensesCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Expense not found' })
    }

    const parsed = expenseSchema.partial().safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' })
    }
    const updates: Partial<Expense> = parsed.data

    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({
      action: 'expense_updated',
      entityType: 'expense',
      entityId: existing.id,
      details: { updatedFields: Object.keys(updates) },
      auth: req.auth,
    })
    res.json({ success: true, data: updated ?? { ...existing, ...updates }, message: 'Expense updated' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update expense')
    res.status(500).json({ success: false, error: 'Failed to update expense' })
  }
})

expenseRoutes.delete('/:id', async (req, res) => {
  try {
    if (!(req.auth?.effectivePermissions ?? []).includes('finance:manage')) {
      return res.status(403).json({ success: false, error: 'Finance manage permission required' })
    }
    const collection = await expensesCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' })
    }
    await writeAuditLog({
      action: 'expense_deleted',
      entityType: 'expense',
      entityId: req.params.id,
      details: {},
      auth: req.auth,
    })
    res.json({ success: true, message: 'Expense deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete expense')
    res.status(500).json({ success: false, error: 'Failed to delete expense' })
  }
})

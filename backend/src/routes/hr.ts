import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { getCollection } from '../db/postgres.js'
import type { PayrollEntry, StaffRecord } from '../../../shared/types/index.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { logger } from '../lib/logger.js'

export const hrRoutes: ReturnType<typeof Router> = Router()

function canAccessHr(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor' || role === 'hr'
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

async function staffCollection() {
  return getCollection<StaffRecord>('staff_records')
}

async function payrollCollection() {
  return getCollection<PayrollEntry>('payroll_entries')
}

hrRoutes.get('/staff', async (req, res) => {
  try {
    if (!canAccessHr(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'HR access required' })
    }
    const collection = await staffCollection()
    const items = await collection.find().sort({ lastName: 1 }).limit(500).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch staff records')
    res.status(500).json({ success: false, error: 'Failed to fetch staff records' })
  }
})

hrRoutes.post('/staff', async (req, res) => {
  try {
    if (!canAccessHr(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'HR access required' })
    }
    const { firstName, lastName, email, department, position, employmentStatus, hireDate, salary, phone, notes } = req.body ?? {}
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, error: 'firstName, lastName, and email are required' })
    }
    const now = new Date().toISOString()
    const item: StaffRecord = {
      id: buildId('STF'),
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email),
      department: typeof department === 'string' ? department : null,
      position: typeof position === 'string' ? position : null,
      employmentStatus: employmentStatus === 'on-leave' || employmentStatus === 'terminated' ? employmentStatus : 'active',
      hireDate: typeof hireDate === 'string' ? hireDate : null,
      salary: Number.isFinite(Number(salary)) ? Number(salary) : null,
      phone: typeof phone === 'string' ? phone : null,
      notes: typeof notes === 'string' ? notes : null,
      createdAt: now,
      updatedAt: now,
    }
    const collection = await staffCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'hr_staff_created', entityType: 'staff_record', entityId: item.id, details: { department: item.department }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create staff record')
    res.status(500).json({ success: false, error: 'Failed to create staff record' })
  }
})

hrRoutes.put('/staff/:id', async (req, res) => {
  try {
    if (!canAccessHr(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'HR access required' })
    }
    const collection = await staffCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Staff record not found' })
    }
    const updates: Partial<StaffRecord> = { updatedAt: new Date().toISOString() }
    ;['firstName', 'lastName', 'email', 'department', 'position', 'employmentStatus', 'hireDate', 'salary', 'phone', 'notes'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'hr_staff_updated', entityType: 'staff_record', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update staff record')
    res.status(500).json({ success: false, error: 'Failed to update staff record' })
  }
})

hrRoutes.delete('/staff/:id', async (req, res) => {
  try {
    if (!canAccessHr(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'HR access required' })
    }
    const collection = await staffCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Staff record not found' })
    }
    await writeAuditLog({ action: 'hr_staff_deleted', entityType: 'staff_record', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Staff record deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete staff record')
    res.status(500).json({ success: false, error: 'Failed to delete staff record' })
  }
})

hrRoutes.get('/payroll', async (req, res) => {
  try {
    if (!canAccessHr(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'HR access required' })
    }
    const collection = await payrollCollection()
    const items = await collection.find().sort({ createdAt: -1 }).limit(500).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch payroll entries')
    res.status(500).json({ success: false, error: 'Failed to fetch payroll entries' })
  }
})

hrRoutes.post('/payroll', async (req, res) => {
  try {
    if (!canAccessHr(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'HR access required' })
    }
    const { staffId, staffName, payPeriod, amount, status, notes } = req.body ?? {}
    if (!staffId || !staffName || !payPeriod || !Number.isFinite(Number(amount))) {
      return res.status(400).json({ success: false, error: 'staffId, staffName, payPeriod, and amount are required' })
    }
    const item: PayrollEntry = {
      id: buildId('PAY'),
      staffId: String(staffId),
      staffName: String(staffName),
      payPeriod: String(payPeriod),
      amount: Number(amount),
      status: status === 'paid' ? 'paid' : 'pending',
      paidAt: status === 'paid' ? new Date().toISOString() : null,
      notes: typeof notes === 'string' ? notes : null,
      createdAt: new Date().toISOString(),
    }
    const collection = await payrollCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'hr_payroll_entry_created', entityType: 'payroll_entry', entityId: item.id, details: { staffId: item.staffId, amount: item.amount }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create payroll entry')
    res.status(500).json({ success: false, error: 'Failed to create payroll entry' })
  }
})

hrRoutes.put('/payroll/:id', async (req, res) => {
  try {
    if (!canAccessHr(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'HR access required' })
    }
    const collection = await payrollCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Payroll entry not found' })
    }
    const updates: Partial<PayrollEntry> = {}
    ;['payPeriod', 'amount', 'status', 'notes'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    if (updates.status === 'paid' && !existing.paidAt) {
      updates.paidAt = new Date().toISOString()
    }
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'hr_payroll_entry_updated', entityType: 'payroll_entry', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update payroll entry')
    res.status(500).json({ success: false, error: 'Failed to update payroll entry' })
  }
})

hrRoutes.delete('/payroll/:id', async (req, res) => {
  try {
    if (!canAccessHr(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'HR access required' })
    }
    const collection = await payrollCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Payroll entry not found' })
    }
    await writeAuditLog({ action: 'hr_payroll_entry_deleted', entityType: 'payroll_entry', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Payroll entry deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete payroll entry')
    res.status(500).json({ success: false, error: 'Failed to delete payroll entry' })
  }
})

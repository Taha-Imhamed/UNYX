import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { interviewSchedulesCollection, offerLettersCollection, scholarshipAwardsCollection } from '../data/collections.js'
import type { InterviewSchedule, OfferLetter, ScholarshipAward } from '../../../shared/types/index.js'
import { logger } from '../lib/logger.js'

export const admissionsRoutes: ReturnType<typeof Router> = Router()

function canAccessAdmissions(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor' || role === 'admissions' || role === 'student-affairs' || role === 'it-admin'
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function toIso(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : new Date().toISOString()
}

const scholarshipAwardSchema = z.object({
  studentId: z.string().trim().min(1),
  scholarshipName: z.string().trim().min(1),
  amount: z.number().finite().nonnegative().optional(),
  awardedBy: z.string().trim().min(1),
  awardedAt: z.string().trim().optional(),
  status: z.enum(['pending', 'awarded', 'revoked']).optional(),
  notes: z.string().trim().optional(),
})

const interviewScheduleSchema = z.object({
  applicantName: z.string().trim().min(1),
  program: z.string().trim().min(1),
  interviewer: z.string().trim().min(1),
  scheduledAt: z.string().trim().optional(),
  status: z.enum(['scheduled', 'completed', 'rescheduled', 'cancelled']).optional(),
  notes: z.string().trim().optional(),
})

const offerLetterSchema = z.object({
  applicantName: z.string().trim().min(1),
  program: z.string().trim().min(1),
  issuedAt: z.string().trim().optional(),
  status: z.enum(['draft', 'issued', 'accepted', 'declined', 'expired']).optional(),
  expirationDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

admissionsRoutes.get('/scholarship-awards/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await scholarshipAwardsCollection()
    const items = await collection.find({ studentId }).sort({ awardedAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch student scholarship awards')
    res.status(500).json({ success: false, error: 'Failed to fetch scholarship awards' })
  }
})

admissionsRoutes.get('/scholarship-awards', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const collection = await scholarshipAwardsCollection()
    const items = await collection.find().sort({ awardedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch scholarship awards')
    res.status(500).json({ success: false, error: 'Failed to fetch scholarship awards' })
  }
})

admissionsRoutes.post('/scholarship-awards', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const parsed = scholarshipAwardSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid scholarship award payload' })
    }
    const { studentId, scholarshipName, amount, awardedBy, awardedAt, status, notes } = parsed.data
    const item: ScholarshipAward = {
      id: buildId('SCH'),
      studentId,
      scholarshipName,
      amount: amount ?? 0,
      awardedBy,
      awardedAt: toIso(awardedAt),
      status: status ?? 'pending',
      notes: notes ?? null,
    }
    const collection = await scholarshipAwardsCollection()
    await collection.insertOne(item)
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create scholarship award')
    res.status(500).json({ success: false, error: 'Failed to create scholarship award' })
  }
})

admissionsRoutes.put('/scholarship-awards/:id', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const collection = await scholarshipAwardsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Scholarship award not found' })
    }
    const parsed = scholarshipAwardSchema.partial().safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid scholarship award payload' })
    }
    const updates: Partial<ScholarshipAward> = parsed.data
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update scholarship award')
    res.status(500).json({ success: false, error: 'Failed to update scholarship award' })
  }
})

admissionsRoutes.delete('/scholarship-awards/:id', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const collection = await scholarshipAwardsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Scholarship award not found' })
    }
    res.json({ success: true, message: 'Scholarship award deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete scholarship award')
    res.status(500).json({ success: false, error: 'Failed to delete scholarship award' })
  }
})

admissionsRoutes.get('/interview-schedules', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const collection = await interviewSchedulesCollection()
    const items = await collection.find().sort({ scheduledAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch interview schedules')
    res.status(500).json({ success: false, error: 'Failed to fetch interview schedules' })
  }
})

admissionsRoutes.post('/interview-schedules', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const parsed = interviewScheduleSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid interview schedule payload' })
    }
    const { applicantName, program, interviewer, scheduledAt, status, notes } = parsed.data
    const item: InterviewSchedule = {
      id: buildId('INTV'),
      applicantName,
      program,
      interviewer,
      scheduledAt: toIso(scheduledAt),
      status: status ?? 'scheduled',
      notes: notes ?? null,
    }
    const collection = await interviewSchedulesCollection()
    await collection.insertOne(item)
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create interview schedule')
    res.status(500).json({ success: false, error: 'Failed to create interview schedule' })
  }
})

admissionsRoutes.put('/interview-schedules/:id', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const collection = await interviewSchedulesCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Interview schedule not found' })
    }
    const parsed = interviewScheduleSchema.partial().safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid interview schedule payload' })
    }
    const updates: Partial<InterviewSchedule> = parsed.data
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update interview schedule')
    res.status(500).json({ success: false, error: 'Failed to update interview schedule' })
  }
})

admissionsRoutes.delete('/interview-schedules/:id', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const collection = await interviewSchedulesCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Interview schedule not found' })
    }
    res.json({ success: true, message: 'Interview schedule deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete interview schedule')
    res.status(500).json({ success: false, error: 'Failed to delete interview schedule' })
  }
})

admissionsRoutes.get('/offer-letters', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const collection = await offerLettersCollection()
    const items = await collection.find().sort({ issuedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch offer letters')
    res.status(500).json({ success: false, error: 'Failed to fetch offer letters' })
  }
})

admissionsRoutes.post('/offer-letters', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const parsed = offerLetterSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid offer letter payload' })
    }
    const { applicantName, program, issuedAt, status, expirationDate, notes } = parsed.data
    const item: OfferLetter = {
      id: buildId('OFR'),
      applicantName,
      program,
      issuedAt: toIso(issuedAt),
      status: status ?? 'draft',
      expirationDate: expirationDate ?? null,
      notes: notes ?? null,
    }
    const collection = await offerLettersCollection()
    await collection.insertOne(item)
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create offer letter')
    res.status(500).json({ success: false, error: 'Failed to create offer letter' })
  }
})

admissionsRoutes.put('/offer-letters/:id', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const collection = await offerLettersCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Offer letter not found' })
    }
    const parsed = offerLetterSchema.partial().safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid offer letter payload' })
    }
    const updates: Partial<OfferLetter> = parsed.data
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update offer letter')
    res.status(500).json({ success: false, error: 'Failed to update offer letter' })
  }
})

admissionsRoutes.delete('/offer-letters/:id', async (req, res) => {
  try {
    if (!canAccessAdmissions(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admissions access required' })
    }
    const collection = await offerLettersCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Offer letter not found' })
    }
    res.json({ success: true, message: 'Offer letter deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete offer letter')
    res.status(500).json({ success: false, error: 'Failed to delete offer letter' })
  }
})

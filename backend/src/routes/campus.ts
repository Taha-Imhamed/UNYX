import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { getCollection } from '../db/postgres.js'
import type { CampusEvent, CampusEventRsvp, HousingAssignment, MealPlan } from '../../../shared/types/index.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { logger } from '../lib/logger.js'

export const campusRoutes: ReturnType<typeof Router> = Router()

function canManageCampus(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor' || role === 'student-affairs'
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

async function eventsCollection() {
  return getCollection<CampusEvent>('campus_events')
}

async function rsvpsCollection() {
  return getCollection<CampusEventRsvp>('campus_event_rsvps')
}

async function housingCollection() {
  return getCollection<HousingAssignment>('housing_assignments')
}

async function mealPlansCollection() {
  return getCollection<MealPlan>('meal_plans')
}

// Events - readable by any authenticated user, mutable by staff
campusRoutes.get('/events', async (req, res) => {
  try {
    const collection = await eventsCollection()
    const items = await collection.find().sort({ startAt: 1 }).limit(500).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch campus events')
    res.status(500).json({ success: false, error: 'Failed to fetch campus events' })
  }
})

campusRoutes.post('/events', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const { title, description, category, location, startAt, endAt, capacity } = req.body ?? {}
    if (!title || !location || !startAt) {
      return res.status(400).json({ success: false, error: 'title, location, and startAt are required' })
    }
    const now = new Date().toISOString()
    const item: CampusEvent = {
      id: buildId('EVT'),
      title: String(title),
      description: typeof description === 'string' ? description : null,
      category: ['academic', 'social', 'sports', 'career', 'other'].includes(category) ? category : 'other',
      location: String(location),
      startAt: String(startAt),
      endAt: typeof endAt === 'string' ? endAt : null,
      capacity: Number.isFinite(Number(capacity)) ? Number(capacity) : null,
      rsvpCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    const collection = await eventsCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'campus_event_created', entityType: 'campus_event', entityId: item.id, details: { title: item.title }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create campus event')
    res.status(500).json({ success: false, error: 'Failed to create campus event' })
  }
})

campusRoutes.put('/events/:id', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const collection = await eventsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }
    const updates: Partial<CampusEvent> = { updatedAt: new Date().toISOString() }
    ;['title', 'description', 'category', 'location', 'startAt', 'endAt', 'capacity'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update campus event')
    res.status(500).json({ success: false, error: 'Failed to update campus event' })
  }
})

campusRoutes.delete('/events/:id', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const collection = await eventsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }
    await writeAuditLog({ action: 'campus_event_deleted', entityType: 'campus_event', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Event deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete campus event')
    res.status(500).json({ success: false, error: 'Failed to delete campus event' })
  }
})

// RSVPs - student self-service
campusRoutes.get('/events/:id/rsvp/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await rsvpsCollection()
    const existing = await collection.findOne({ eventId: req.params.id, studentId })
    res.json({ success: true, data: { rsvped: Boolean(existing) } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to check RSVP status')
    res.status(500).json({ success: false, error: 'Failed to check RSVP status' })
  }
})

campusRoutes.post('/events/:id/rsvp', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    const studentName = req.auth?.username || 'Student'
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const eventsCol = await eventsCollection()
    const event = await eventsCol.findOne({ id: req.params.id })
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }
    const rsvpsCol = await rsvpsCollection()
    const existing = await rsvpsCol.findOne({ eventId: event.id, studentId })
    if (existing) {
      return res.status(409).json({ success: false, error: 'Already RSVPed' })
    }
    if (typeof event.capacity === 'number' && event.rsvpCount >= event.capacity) {
      return res.status(409).json({ success: false, error: 'Event is at capacity' })
    }
    const rsvp: CampusEventRsvp = {
      id: buildId('RSVP'),
      eventId: event.id,
      studentId,
      studentName: String(studentName),
      createdAt: new Date().toISOString(),
    }
    await rsvpsCol.insertOne(rsvp)
    await eventsCol.updateOne({ id: event.id }, { $set: { rsvpCount: event.rsvpCount + 1 } })
    res.status(201).json({ success: true, data: rsvp })
  } catch (error) {
    logger.error({ err: error }, 'Failed to RSVP to event')
    res.status(500).json({ success: false, error: 'Failed to RSVP to event' })
  }
})

campusRoutes.delete('/events/:id/rsvp', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const eventsCol = await eventsCollection()
    const event = await eventsCol.findOne({ id: req.params.id })
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }
    const rsvpsCol = await rsvpsCollection()
    const result = await rsvpsCol.deleteOne({ eventId: event.id, studentId })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'RSVP not found' })
    }
    await eventsCol.updateOne({ id: event.id }, { $set: { rsvpCount: Math.max(0, event.rsvpCount - 1) } })
    res.json({ success: true, message: 'RSVP cancelled' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to cancel RSVP')
    res.status(500).json({ success: false, error: 'Failed to cancel RSVP' })
  }
})

// Housing - staff CRUD
campusRoutes.get('/housing', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const collection = await housingCollection()
    const items = await collection.find().sort({ updatedAt: -1 }).limit(500).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch housing assignments')
    res.status(500).json({ success: false, error: 'Failed to fetch housing assignments' })
  }
})

campusRoutes.get('/housing/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await housingCollection()
    const items = await collection.find({ studentId }).sort({ updatedAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch housing assignment')
    res.status(500).json({ success: false, error: 'Failed to fetch housing assignment' })
  }
})

campusRoutes.post('/housing', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const { studentId, studentName, buildingName, roomNumber, bedNumber, startDate, notes } = req.body ?? {}
    if (!studentId || !studentName || !buildingName || !roomNumber || !startDate) {
      return res.status(400).json({ success: false, error: 'studentId, studentName, buildingName, roomNumber, and startDate are required' })
    }
    const now = new Date().toISOString()
    const item: HousingAssignment = {
      id: buildId('HOU'),
      studentId: String(studentId),
      studentName: String(studentName),
      buildingName: String(buildingName),
      roomNumber: String(roomNumber),
      bedNumber: typeof bedNumber === 'string' ? bedNumber : null,
      status: 'active',
      startDate: String(startDate),
      endDate: null,
      notes: typeof notes === 'string' ? notes : null,
      createdAt: now,
      updatedAt: now,
    }
    const collection = await housingCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'housing_assignment_created', entityType: 'housing_assignment', entityId: item.id, details: { studentId: item.studentId }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create housing assignment')
    res.status(500).json({ success: false, error: 'Failed to create housing assignment' })
  }
})

campusRoutes.put('/housing/:id', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const collection = await housingCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Assignment not found' })
    }
    const updates: Partial<HousingAssignment> = { updatedAt: new Date().toISOString() }
    ;['buildingName', 'roomNumber', 'bedNumber', 'status', 'startDate', 'endDate', 'notes'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update housing assignment')
    res.status(500).json({ success: false, error: 'Failed to update housing assignment' })
  }
})

campusRoutes.delete('/housing/:id', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const collection = await housingCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Assignment not found' })
    }
    await writeAuditLog({ action: 'housing_assignment_deleted', entityType: 'housing_assignment', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Assignment deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete housing assignment')
    res.status(500).json({ success: false, error: 'Failed to delete housing assignment' })
  }
})

// Meal plans - staff CRUD
campusRoutes.get('/meal-plans', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const collection = await mealPlansCollection()
    const items = await collection.find().sort({ updatedAt: -1 }).limit(500).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch meal plans')
    res.status(500).json({ success: false, error: 'Failed to fetch meal plans' })
  }
})

campusRoutes.get('/meal-plans/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await mealPlansCollection()
    const items = await collection.find({ studentId }).sort({ updatedAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch meal plan')
    res.status(500).json({ success: false, error: 'Failed to fetch meal plan' })
  }
})

campusRoutes.post('/meal-plans', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const { studentId, studentName, planName, balance, startDate } = req.body ?? {}
    if (!studentId || !studentName || !planName || !startDate) {
      return res.status(400).json({ success: false, error: 'studentId, studentName, planName, and startDate are required' })
    }
    const now = new Date().toISOString()
    const item: MealPlan = {
      id: buildId('MEAL'),
      studentId: String(studentId),
      studentName: String(studentName),
      planName: String(planName),
      balance: Number.isFinite(Number(balance)) ? Number(balance) : 0,
      status: 'active',
      startDate: String(startDate),
      endDate: null,
      createdAt: now,
      updatedAt: now,
    }
    const collection = await mealPlansCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'meal_plan_created', entityType: 'meal_plan', entityId: item.id, details: { studentId: item.studentId }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create meal plan')
    res.status(500).json({ success: false, error: 'Failed to create meal plan' })
  }
})

campusRoutes.put('/meal-plans/:id', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const collection = await mealPlansCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Meal plan not found' })
    }
    const updates: Partial<MealPlan> = { updatedAt: new Date().toISOString() }
    ;['planName', 'balance', 'status', 'startDate', 'endDate'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update meal plan')
    res.status(500).json({ success: false, error: 'Failed to update meal plan' })
  }
})

campusRoutes.delete('/meal-plans/:id', async (req, res) => {
  try {
    if (!canManageCampus(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Student affairs access required' })
    }
    const collection = await mealPlansCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Meal plan not found' })
    }
    await writeAuditLog({ action: 'meal_plan_deleted', entityType: 'meal_plan', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Meal plan deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete meal plan')
    res.status(500).json({ success: false, error: 'Failed to delete meal plan' })
  }
})

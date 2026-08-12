import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { getCollection } from '../db/postgres.js'
import type { AdvisingAppointment, AdvisingMessage } from '../../../shared/types/index.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { logger } from '../lib/logger.js'

export const advisingRoutes: ReturnType<typeof Router> = Router()

function canManageAllAdvising(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor' || role === 'student-affairs'
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

async function appointmentsCollection() {
  return getCollection<AdvisingAppointment>('advising_appointments')
}

async function messagesCollection() {
  return getCollection<AdvisingMessage>('advising_messages')
}

// Staff view: all appointments. Advisor view: own appointments only.
advisingRoutes.get('/appointments', async (req, res) => {
  try {
    const collection = await appointmentsCollection()
    if (canManageAllAdvising(req.auth?.role)) {
      const items = await collection.find().sort({ scheduledAt: 1 }).limit(500).toArray()
      return res.json({ success: true, data: items })
    }
    if (req.auth?.role === 'advisor' && req.auth.professorId) {
      const items = await collection.find({ advisorId: req.auth.professorId }).sort({ scheduledAt: 1 }).toArray()
      return res.json({ success: true, data: items })
    }
    return res.status(403).json({ success: false, error: 'Advising access required' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch advising appointments')
    res.status(500).json({ success: false, error: 'Failed to fetch advising appointments' })
  }
})

advisingRoutes.get('/appointments/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await appointmentsCollection()
    const items = await collection.find({ studentId }).sort({ scheduledAt: 1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch student advising appointments')
    res.status(500).json({ success: false, error: 'Failed to fetch advising appointments' })
  }
})

advisingRoutes.post('/appointments/request', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    const studentName = req.auth?.username || 'Student'
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const { advisorId, advisorName, scheduledAt, durationMinutes, notes } = req.body ?? {}
    if (!advisorId || !advisorName || !scheduledAt) {
      return res.status(400).json({ success: false, error: 'advisorId, advisorName, and scheduledAt are required' })
    }
    const now = new Date().toISOString()
    const item: AdvisingAppointment = {
      id: buildId('ADV'),
      studentId: String(studentId),
      studentName: String(studentName),
      advisorId: String(advisorId),
      advisorName: String(advisorName),
      scheduledAt: String(scheduledAt),
      durationMinutes: Number.isFinite(Number(durationMinutes)) && Number(durationMinutes) > 0 ? Number(durationMinutes) : 30,
      status: 'requested',
      notes: typeof notes === 'string' ? notes : null,
      createdAt: now,
      updatedAt: now,
    }
    const collection = await appointmentsCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'advising_appointment_requested', entityType: 'advising_appointment', entityId: item.id, details: { studentId: item.studentId, advisorId: item.advisorId }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to request advising appointment')
    res.status(500).json({ success: false, error: 'Failed to request advising appointment' })
  }
})

advisingRoutes.put('/appointments/:id', async (req, res) => {
  try {
    const collection = await appointmentsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Appointment not found' })
    }

    const isStaff = canManageAllAdvising(req.auth?.role)
    const isOwningAdvisor = req.auth?.role === 'advisor' && req.auth.professorId === existing.advisorId
    const studentId = req.auth?.studentId || req.auth?.userId
    const isOwningStudent = req.auth?.role === 'student' && studentId === existing.studentId

    if (!isStaff && !isOwningAdvisor && !isOwningStudent) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this appointment' })
    }

    const updates: Partial<AdvisingAppointment> = { updatedAt: new Date().toISOString() }
    if (isStaff || isOwningAdvisor) {
      ['scheduledAt', 'durationMinutes', 'status', 'notes'].forEach((key) => {
        if (req.body?.[key] !== undefined) {
          updates[key] = req.body[key]
        }
      })
    } else if (isOwningStudent) {
      // Students may only cancel their own appointment
      if (req.body?.status !== 'cancelled') {
        return res.status(403).json({ success: false, error: 'Students may only cancel their own appointments' })
      }
      updates.status = 'cancelled'
    }

    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'advising_appointment_updated', entityType: 'advising_appointment', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update advising appointment')
    res.status(500).json({ success: false, error: 'Failed to update advising appointment' })
  }
})

// Student view: thread with a specific advisor.
advisingRoutes.get('/messages/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const advisorId = typeof req.query.advisorId === 'string' ? req.query.advisorId.trim() : ''
    if (!advisorId) {
      return res.status(400).json({ success: false, error: 'advisorId is required' })
    }
    const collection = await messagesCollection()
    const items = await collection.find({ studentId, advisorId }).sort({ createdAt: 1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch advising messages')
    res.status(500).json({ success: false, error: 'Failed to fetch advising messages' })
  }
})

// Advisor/staff view: thread with a specific student.
advisingRoutes.get('/messages', async (req, res) => {
  try {
    const studentId = typeof req.query.studentId === 'string' ? req.query.studentId.trim() : ''
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'studentId is required' })
    }
    const isStaff = canManageAllAdvising(req.auth?.role)
    const isAdvisor = req.auth?.role === 'advisor' && req.auth.professorId
    if (!isStaff && !isAdvisor) {
      return res.status(403).json({ success: false, error: 'Advising access required' })
    }
    const collection = await messagesCollection()
    const filter: Record<string, unknown> = { studentId }
    if (isAdvisor && !isStaff) filter.advisorId = req.auth!.professorId
    const items = await collection.find(filter as any).sort({ createdAt: 1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch advising messages')
    res.status(500).json({ success: false, error: 'Failed to fetch advising messages' })
  }
})

advisingRoutes.post('/messages', async (req, res) => {
  try {
    const { advisorId, body } = req.body ?? {}
    const trimmedBody = typeof body === 'string' ? body.trim() : ''
    if (!advisorId || !trimmedBody) {
      return res.status(400).json({ success: false, error: 'advisorId and body are required' })
    }

    const studentId = req.auth?.studentId || req.auth?.userId
    const isStudent = req.auth?.role === 'student' && studentId
    const isStaff = canManageAllAdvising(req.auth?.role)
    const isAdvisor = req.auth?.role === 'advisor' && req.auth.professorId

    let resolvedStudentId: string
    let senderRole: AdvisingMessage['senderRole']
    if (isStudent) {
      resolvedStudentId = String(studentId)
      senderRole = 'student'
    } else if (isStaff || isAdvisor) {
      const bodyStudentId = typeof req.body?.studentId === 'string' ? req.body.studentId.trim() : ''
      if (!bodyStudentId) {
        return res.status(400).json({ success: false, error: 'studentId is required' })
      }
      resolvedStudentId = bodyStudentId
      senderRole = 'advisor'
    } else {
      return res.status(403).json({ success: false, error: 'Advising access required' })
    }

    const item: AdvisingMessage = {
      id: buildId('MSG'),
      studentId: resolvedStudentId,
      advisorId: String(advisorId),
      senderRole,
      senderName: req.auth?.username || (senderRole === 'student' ? 'Student' : 'Advisor'),
      body: trimmedBody,
      readAt: null,
      createdAt: new Date().toISOString(),
    }
    const collection = await messagesCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'advising_message_sent', entityType: 'advising_message', entityId: item.id, details: { studentId: item.studentId, advisorId: item.advisorId }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to send advising message')
    res.status(500).json({ success: false, error: 'Failed to send advising message' })
  }
})

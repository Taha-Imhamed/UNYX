import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getCollection } from '../db/postgres.js'
import { coursesCollection, enrollmentsCollection, studentsCollection } from '../data/collections.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { logger } from '../lib/logger.js'

export const gradeChangeRequestRoutes: ReturnType<typeof Router> = Router()

const COLLECTION = 'grade_change_requests'

const createGradeChangeRequestSchema = z.object({
  enrollmentId: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  newGrades: z.record(z.string(), z.union([z.number(), z.null()])).optional(),
  proofBase64: z.string().max(3_000_000).optional(),
  proofFilename: z.string().trim().optional(),
})

const reviewGradeChangeRequestSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
  responseNote: z.string().trim().optional(),
})

interface GradeChangeRequest extends Record<string, unknown> {
  id: string
  enrollmentId: string
  courseId: string
  courseCode?: string | null
  courseTitle?: string | null
  studentId: string
  studentName: string
  professorId: string
  professorName: string
  newGrades: Record<string, number | null>
  reason: string
  proofDataUrl?: string | null
  proofFilename?: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  responseNote?: string | null
}

function isPrivilegedRole(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor'
}

// Professors only see their own requests; privileged roles see everything.
gradeChangeRequestRoutes.get('/', async (req, res) => {
  try {
    const collection = await getCollection<GradeChangeRequest>(COLLECTION)
    const privileged = isPrivilegedRole(req.auth?.role)

    if (!privileged) {
      const professorId = req.auth?.professorId ?? req.auth?.userId
      if (req.auth?.role !== 'professor' || !professorId) {
        return res.status(403).json({ success: false, error: 'Professor identity missing in token' })
      }
      const mine = await collection.find({ professorId }).toArray()
      return res.json({ success: true, data: mine })
    }

    const all = await collection.find().toArray()
    res.json({ success: true, data: all })
  } catch (error) {
    logger.error({ err: error }, 'Grade change request list failed')
    res.status(500).json({ success: false, error: 'Failed to fetch grade change requests' })
  }
})

gradeChangeRequestRoutes.post('/', async (req, res) => {
  try {
    if (req.auth?.role !== 'professor' || !(req.auth.professorId ?? req.auth.userId)) {
      return res.status(403).json({ success: false, error: 'Only professors can submit grade change requests' })
    }
    const professorId = req.auth.professorId ?? req.auth.userId

    const parsed = createGradeChangeRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid grade change request payload' })
    }
    const body = parsed.data
    const enrollmentId = body.enrollmentId
    const reason = body.reason

    const enrollmentsCol = await enrollmentsCollection()
    const enrollment = await enrollmentsCol.findOne({ id: enrollmentId })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    const coursesCol = await coursesCollection()
    const course = await coursesCol.findOne({ id: enrollment.courseId })
    if (!course || course.professorId !== professorId) {
      return res.status(403).json({ success: false, error: 'You can only request grade changes for your own courses' })
    }

    const studentsCol = await studentsCollection()
    const student = await studentsCol.findOne({ id: enrollment.studentId })
    const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : enrollment.studentId

    const newGrades = body.newGrades ?? {}
    const sanitizedGrades: Record<string, number | null> = {}
    for (const key of ['gradeMidterm', 'gradeFinal', 'gradeProject', 'gradeParticipation']) {
      const value = newGrades[key]
      sanitizedGrades[key] = typeof value === 'number' && Number.isFinite(value) ? value : null
    }

    let proofDataUrl: string | null = null
    let proofFilename: string | null = null
    if (body.proofBase64 && body.proofFilename) {
      proofDataUrl = body.proofBase64
      proofFilename = body.proofFilename
    }

    const item: GradeChangeRequest = {
      id: `GCR-${randomUUID().slice(0, 8).toUpperCase()}`,
      enrollmentId,
      courseId: course.id,
      courseCode: course.code ?? null,
      courseTitle: course.title ?? null,
      studentId: enrollment.studentId,
      studentName,
      professorId,
      professorName: req.auth.username ?? course.professorName ?? '',
      newGrades: sanitizedGrades,
      reason,
      proofDataUrl,
      proofFilename,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      responseNote: null,
    }

    const collection = await getCollection<GradeChangeRequest>(COLLECTION)
    await collection.insertOne(item)

    await writeAuditLog({
      action: 'grade_change_requested',
      entityType: 'enrollment',
      entityId: enrollmentId,
      details: { courseId: course.id, professorId, reason },
      auth: req.auth,
    })

    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Grade change request create failed')
    res.status(500).json({ success: false, error: 'Failed to submit grade change request' })
  }
})

gradeChangeRequestRoutes.patch('/:id', async (req, res) => {
  try {
    if (!isPrivilegedRole(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Admin or supervisor privileges required' })
    }

    const collection = await getCollection<GradeChangeRequest>(COLLECTION)
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Grade change request not found' })
    }

    const parsed = reviewGradeChangeRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'status must be approved, rejected, or pending' })
    }
    const status = parsed.data.status
    const responseNote = parsed.data.responseNote ?? existing.responseNote ?? null

    const updates: Partial<GradeChangeRequest> = {
      status,
      responseNote,
      reviewedBy: req.auth?.username ?? null,
      reviewedAt: new Date().toISOString(),
    }

    await collection.updateOne({ id: req.params.id }, { $set: updates })

    if (status === 'approved') {
      const enrollmentsCol = await enrollmentsCollection()
      const setFields: Record<string, number | null> = {}
      for (const [key, value] of Object.entries(existing.newGrades)) {
        if (value !== null) setFields[key] = value
      }
      if (Object.keys(setFields).length > 0) {
        await enrollmentsCol.updateOne({ id: existing.enrollmentId }, { $set: setFields })
      }
    }

    await writeAuditLog({
      action: 'grade_change_reviewed',
      entityType: 'enrollment',
      entityId: existing.enrollmentId,
      details: { requestId: existing.id, status, reviewedBy: req.auth?.username },
      auth: req.auth,
    })

    const updated = await collection.findOne({ id: req.params.id })
    res.json({ success: true, data: updated })
  } catch (error) {
    logger.error({ err: error }, 'Grade change request review failed')
    res.status(500).json({ success: false, error: 'Failed to update grade change request' })
  }
})

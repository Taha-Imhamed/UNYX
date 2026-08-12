import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import {
  coursesCollection,
  enrollmentOverridesCollection,
  enrollmentsCollection,
  graduationApprovalsCollection,
  studentsCollection,
  transcriptRequestsCollection,
  transferCreditsCollection,
} from '../data/collections.js'
import { getCollection } from '../db/postgres.js'
import type { Enrollment, EnrollmentOverride, GraduationApproval, TranscriptRequest, TransferCredit } from '../../../shared/types/index.js'
import { checkBalance, enrollmentActorPatch, writeAuditLog } from '../lib/academic-compliance.js'
import { createTuitionInvoiceForEnrollment } from './finance.js'
import { getSemesterById } from '../lib/academic-terms.js'
import { logger } from '../lib/logger.js'

export const registrarRoutes: ReturnType<typeof Router> = Router()

function canAccessRegistrar(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor' || role === 'registrar' || role === 'it-admin'
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function toIso(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : new Date().toISOString()
}

async function notifyStudent(studentId: string, title: string, body: string, actor?: string | null) {
  try {
    const usersCol = await getCollection<{ id: string; studentId?: string | null }>('users')
    const notificationsCol = await getCollection<any>('notifications')
    const linkedUsers = await usersCol.find({ studentId }).project({ id: 1 }).toArray()
    const targetUserIds = linkedUsers.length > 0 ? linkedUsers.map((user) => user.id) : [studentId]
    const createdAt = new Date().toISOString()
    await notificationsCol.insertMany(
      targetUserIds.map((userId) => ({
        id: `REG-NOTIF-${randomUUID().slice(0, 8).toUpperCase()}`,
        userId,
        title,
        body,
        createdAt,
        read: false,
        actor: actor?.trim() || 'system',
      })),
    )
  } catch (error) {
    logger.error({ err: error }, 'Failed to notify student')
  }
}

registrarRoutes.get('/enrollment-overrides', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await enrollmentOverridesCollection()
    const items = await collection.find().sort({ createdAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch enrollment overrides')
    res.status(500).json({ success: false, error: 'Failed to fetch enrollment overrides' })
  }
})

registrarRoutes.post('/enrollment-overrides', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const { studentId, courseId, reason, approvedBy, createdAt, status } = req.body ?? {}
    if (!studentId || !courseId || !reason || !approvedBy) {
      return res.status(400).json({ success: false, error: 'studentId, courseId, reason, and approvedBy are required' })
    }
    const item: EnrollmentOverride = {
      id: buildId('OVR'),
      studentId: String(studentId),
      courseId: String(courseId),
      reason: String(reason),
      approvedBy: String(approvedBy),
      createdAt: toIso(createdAt),
      status: status === 'approved' || status === 'rejected' || status === 'revoked' ? status : 'pending',
    }
    const collection = await enrollmentOverridesCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'registrar_enrollment_override_created', entityType: 'enrollment_override', entityId: item.id, details: { studentId: item.studentId, courseId: item.courseId }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create enrollment override')
    res.status(500).json({ success: false, error: 'Failed to create enrollment override' })
  }
})

// Registrar's own scope: finalize a student's pending course enrollment and auto-bill
// tuition through Finance, without granting registrar any finance:* permission. Narrower
// than canAccessRegistrar() — it:'s the person whose job this is, plus admin/super-admin
// oversight. it-admin and supervisor are intentionally excluded here.
function canRegisterStudents(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'registrar'
}

const PENDING_REGISTRATION_STATUSES = new Set(['pending', 'pending_approval', 'pendingAdvisorApproval', 'pendingSupervisorApproval'])

registrarRoutes.get('/pending-registrations', async (req, res) => {
  try {
    if (!canRegisterStudents(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const enrollmentsCol = await enrollmentsCollection()
    const all = await enrollmentsCol.find().sort({ createdAt: -1 }).toArray()
    const pending = all.filter((enrollment) => PENDING_REGISTRATION_STATUSES.has(enrollment.status))
    res.json({ success: true, data: pending })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch pending registrations')
    res.status(500).json({ success: false, error: 'Failed to fetch pending registrations' })
  }
})

registrarRoutes.post('/enrollments/:id/register', async (req, res) => {
  try {
    if (!canRegisterStudents(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }

    const enrollmentsCol = await enrollmentsCollection()
    const studentsCol = await studentsCollection()

    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }
    if (!PENDING_REGISTRATION_STATUSES.has(enrollment.status)) {
      return res.status(409).json({ success: false, error: 'Only pending enrollments can be registered' })
    }

    const student = await studentsCol.findOne({ id: enrollment.studentId })
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const registrarLabel = req.auth?.username ?? req.auth?.userId ?? 'registrar'
    const price = Number(enrollment.price ?? 0)

    if (price > 0) {
      const resolvedSemester = await getSemesterById(enrollment.semesterId)
      await createTuitionInvoiceForEnrollment({
        studentId: student.id,
        courseTitle: enrollment.courseTitle,
        price,
        semester: resolvedSemester?.label ?? enrollment.semester ?? null,
        semesterId: enrollment.semesterId ?? null,
        createdBy: registrarLabel,
      })
    }

    const updatedAt = new Date().toISOString()
    const clearance = await checkBalance(student.id, 0)

    await enrollmentsCol.updateOne(
      { id: enrollment.id },
      {
        $set: {
          status: 'active',
          updatedAt,
          tuitionCharged: price > 0,
          chargedAt: price > 0 ? updatedAt : enrollment.chargedAt ?? null,
          paymentVerified: clearance.cleared,
          paymentStatus: clearance.cleared ? 'paid' : 'payment_required',
          approvedByUserId: req.auth?.userId ?? null,
          approvedByName: req.auth?.username ?? null,
          approvedByRole: req.auth?.role ?? null,
          approvedAt: updatedAt,
          ...enrollmentActorPatch(req.auth),
          rejectedByUserId: null,
          rejectedByName: null,
          rejectedByRole: null,
          rejectedAt: null,
        },
      },
    )

    const updated = await enrollmentsCol.findOne({ id: enrollment.id })
    await notifyStudent(
      student.id,
      `Registration complete: ${enrollment.courseTitle}`,
      price > 0
        ? `You have been registered by the Registrar's Office. A tuition invoice of ${price} has been created — check Finance for your payment status.`
        : `You have been registered by the Registrar's Office.`,
      registrarLabel,
    )
    await writeAuditLog({
      action: 'registrar_student_registered',
      entityType: 'enrollment',
      entityId: enrollment.id,
      details: { studentId: student.id, courseId: enrollment.courseId, price, paymentStatus: updated?.paymentStatus },
      auth: req.auth,
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    logger.error({ err: error }, 'Failed to register student')
    res.status(500).json({ success: false, error: 'Failed to register student' })
  }
})

function buildEnrollmentId() {
  return `ENR-${randomUUID().slice(0, 8).toUpperCase()}`
}

// Activates the real enrollment an approved override refers to, bypassing the
// prereq/schedule-conflict/enrollment-window/balance gates that a normal self-enroll
// would enforce — that bypass is the entire point of an "override".
async function activateOverriddenEnrollment(override: EnrollmentOverride, req: import('express').Request) {
  const enrollmentsCol = await enrollmentsCollection()
  const existingEnrollment = await enrollmentsCol.findOne({ studentId: override.studentId, courseId: override.courseId })
  const updatedAt = new Date().toISOString()
  const actorPatch = enrollmentActorPatch(req.auth)

  if (existingEnrollment && existingEnrollment.status !== 'active') {
    await enrollmentsCol.updateOne(
      { id: existingEnrollment.id },
      {
        $set: {
          status: 'active',
          updatedAt,
          paymentVerified: true,
          paymentStatus: 'paid',
          approvedByUserId: req.auth?.userId ?? null,
          approvedByName: req.auth?.username ?? null,
          approvedByRole: req.auth?.role ?? null,
          approvedAt: updatedAt,
          ...actorPatch,
          rejectedByUserId: null,
          rejectedByName: null,
          rejectedByRole: null,
          rejectedAt: null,
        },
      },
    )
  } else if (!existingEnrollment) {
    const coursesCol = await coursesCollection()
    const course = await coursesCol.findOne({ id: override.courseId })
    if (!course) {
      throw new Error('Course not found for enrollment override')
    }
    const newEnrollment: Enrollment = {
      id: buildEnrollmentId(),
      displayId: buildEnrollmentId(),
      studentId: override.studentId,
      courseId: course.id,
      courseTitle: course.title,
      courseCode: course.code ?? null,
      professorId: course.professorId ?? '',
      professorName: course.professorName ?? '',
      campus: course.branch ?? course.location ?? null,
      status: 'active',
      startDate: course.startDate ?? updatedAt,
      endDate: course.endDate ?? updatedAt,
      price: Number(course.price ?? 0),
      createdAt: updatedAt,
      updatedAt,
      paymentVerified: true,
      paymentStatus: 'paid',
      approvedByUserId: req.auth?.userId ?? null,
      approvedByName: req.auth?.username ?? null,
      approvedByRole: req.auth?.role ?? null,
      approvedAt: updatedAt,
      ...actorPatch,
    }
    await enrollmentsCol.insertOne(newEnrollment)
  }
  // else: existing enrollment already active, nothing to do

  await notifyStudent(
    override.studentId,
    'Enrollment override approved',
    `Your enrollment override for this course has been approved and your enrollment is now active.`,
    req.auth?.username ?? req.auth?.userId ?? 'system',
  )
}

registrarRoutes.put('/enrollment-overrides/:id', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await enrollmentOverridesCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Enrollment override not found' })
    }
    const updates: Partial<EnrollmentOverride> = {}
    ;['studentId', 'courseId', 'reason', 'approvedBy', 'createdAt', 'status'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })

    const isNewlyApproved = updates.status === 'approved' && existing.status !== 'approved'
    if (isNewlyApproved) {
      try {
        await activateOverriddenEnrollment({ ...existing, ...updates }, req)
      } catch (activationError) {
        logger.error({ err: activationError }, 'Failed to activate enrollment for approved override')
        return res.status(500).json({
          success: false,
          error: activationError instanceof Error ? activationError.message : 'Failed to activate enrollment for this override',
        })
      }
    }

    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({
      action: isNewlyApproved ? 'registrar_enrollment_override_approved' : 'registrar_enrollment_override_updated',
      entityType: 'enrollment_override',
      entityId: existing.id,
      details: { updatedFields: Object.keys(updates) },
      auth: req.auth,
    })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update enrollment override')
    res.status(500).json({ success: false, error: 'Failed to update enrollment override' })
  }
})

registrarRoutes.delete('/enrollment-overrides/:id', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await enrollmentOverridesCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Enrollment override not found' })
    }
    await writeAuditLog({ action: 'registrar_enrollment_override_deleted', entityType: 'enrollment_override', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Enrollment override deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete enrollment override')
    res.status(500).json({ success: false, error: 'Failed to delete enrollment override' })
  }
})

// Student self-service: view their own approved (or pending) transfer credits, used by
// the degree-audit page to add external credit hours to the "credits earned" total.
registrarRoutes.get('/transfer-credits/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await transferCreditsCollection()
    const items = await collection.find({ studentId }).sort({ evaluatedAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch student transfer credits')
    res.status(500).json({ success: false, error: 'Failed to fetch transfer credits' })
  }
})

registrarRoutes.get('/transfer-credits', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await transferCreditsCollection()
    const items = await collection.find().sort({ evaluatedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch transfer credits')
    res.status(500).json({ success: false, error: 'Failed to fetch transfer credits' })
  }
})

registrarRoutes.post('/transfer-credits', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const { studentId, sourceInstitution, courseTitle, creditHours, evaluatedBy, evaluatedAt, status } = req.body ?? {}
    if (!studentId || !sourceInstitution || !courseTitle || !evaluatedBy) {
      return res.status(400).json({ success: false, error: 'studentId, sourceInstitution, courseTitle, and evaluatedBy are required' })
    }
    const item: TransferCredit = {
      id: buildId('TRN'),
      studentId: String(studentId),
      sourceInstitution: String(sourceInstitution),
      courseTitle: String(courseTitle),
      creditHours: Number.isFinite(Number(creditHours)) ? Number(creditHours) : 0,
      evaluatedBy: String(evaluatedBy),
      evaluatedAt: toIso(evaluatedAt),
      status: status === 'approved' || status === 'rejected' ? status : 'pending',
    }
    const collection = await transferCreditsCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'registrar_transfer_credit_created', entityType: 'transfer_credit', entityId: item.id, details: { studentId: item.studentId, creditHours: item.creditHours }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create transfer credit')
    res.status(500).json({ success: false, error: 'Failed to create transfer credit' })
  }
})

registrarRoutes.put('/transfer-credits/:id', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await transferCreditsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transfer credit not found' })
    }
    const updates: Partial<TransferCredit> = {}
    ;['studentId', 'sourceInstitution', 'courseTitle', 'creditHours', 'evaluatedBy', 'evaluatedAt', 'status'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'registrar_transfer_credit_updated', entityType: 'transfer_credit', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update transfer credit')
    res.status(500).json({ success: false, error: 'Failed to update transfer credit' })
  }
})

registrarRoutes.delete('/transfer-credits/:id', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await transferCreditsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Transfer credit not found' })
    }
    await writeAuditLog({ action: 'registrar_transfer_credit_deleted', entityType: 'transfer_credit', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Transfer credit deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete transfer credit')
    res.status(500).json({ success: false, error: 'Failed to delete transfer credit' })
  }
})

registrarRoutes.get('/transcript-requests', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await transcriptRequestsCollection()
    const items = await collection.find().sort({ requestedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch transcript requests')
    res.status(500).json({ success: false, error: 'Failed to fetch transcript requests' })
  }
})

registrarRoutes.post('/transcript-requests', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const { studentId, documentType, requestedAt, deliveryMethod, status, notes } = req.body ?? {}
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'studentId is required' })
    }
    const item: TranscriptRequest = {
      id: buildId('TSR'),
      studentId: String(studentId),
      documentType:
        documentType === 'enrollment-letter' || documentType === 'graduation-letter' || documentType === 'recommendation-letter' || documentType === 'other'
          ? documentType
          : 'transcript',
      requestedAt: toIso(requestedAt),
      deliveryMethod: deliveryMethod === 'email' || deliveryMethod === 'mail' ? deliveryMethod : 'pickup',
      status: status === 'processing' || status === 'ready' || status === 'delivered' || status === 'rejected' ? status : 'pending',
      notes: typeof notes === 'string' ? notes : null,
    }
    const collection = await transcriptRequestsCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'registrar_transcript_request_created', entityType: 'transcript_request', entityId: item.id, details: { studentId: item.studentId }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create transcript request')
    res.status(500).json({ success: false, error: 'Failed to create transcript request' })
  }
})

registrarRoutes.put('/transcript-requests/:id', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await transcriptRequestsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transcript request not found' })
    }
    const updates: Partial<TranscriptRequest> = {}
    ;['studentId', 'documentType', 'requestedAt', 'deliveryMethod', 'status', 'notes'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'registrar_transcript_request_updated', entityType: 'transcript_request', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update transcript request')
    res.status(500).json({ success: false, error: 'Failed to update transcript request' })
  }
})

const studentDocumentRequestSchema = {
  documentTypes: ['transcript', 'enrollment-letter', 'graduation-letter', 'recommendation-letter', 'other'] as const,
  deliveryMethods: ['pickup', 'email', 'mail'] as const,
}

// Student self-service: submit and track their own document requests (transcript,
// enrollment letter, etc.) without needing registrar staff permissions.
registrarRoutes.get('/transcript-requests/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await transcriptRequestsCollection()
    const items = await collection.find({ studentId }).sort({ requestedAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch student document requests')
    res.status(500).json({ success: false, error: 'Failed to fetch document requests' })
  }
})

registrarRoutes.post('/transcript-requests/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const { documentType, deliveryMethod, notes } = req.body ?? {}
    if (!studentDocumentRequestSchema.documentTypes.includes(documentType)) {
      return res.status(400).json({ success: false, error: 'A valid documentType is required' })
    }
    const item: TranscriptRequest = {
      id: buildId('TSR'),
      studentId,
      documentType,
      requestedAt: new Date().toISOString(),
      deliveryMethod: studentDocumentRequestSchema.deliveryMethods.includes(deliveryMethod) ? deliveryMethod : 'pickup',
      status: 'pending',
      notes: typeof notes === 'string' ? notes : null,
    }
    const collection = await transcriptRequestsCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'student_document_request_created', entityType: 'transcript_request', entityId: item.id, details: { documentType }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to submit document request')
    res.status(500).json({ success: false, error: 'Failed to submit document request' })
  }
})

registrarRoutes.delete('/transcript-requests/:id', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await transcriptRequestsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Transcript request not found' })
    }
    await writeAuditLog({ action: 'registrar_transcript_request_deleted', entityType: 'transcript_request', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Transcript request deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete transcript request')
    res.status(500).json({ success: false, error: 'Failed to delete transcript request' })
  }
})

registrarRoutes.get('/graduation-approvals', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await graduationApprovalsCollection()
    const items = await collection.find().sort({ approvedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch graduation approvals')
    res.status(500).json({ success: false, error: 'Failed to fetch graduation approvals' })
  }
})

registrarRoutes.post('/graduation-approvals', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const { studentId, program, approvedBy, approvedAt, status, remarks } = req.body ?? {}
    if (!studentId || !program || !approvedBy) {
      return res.status(400).json({ success: false, error: 'studentId, program, and approvedBy are required' })
    }
    const item: GraduationApproval = {
      id: buildId('GRA'),
      studentId: String(studentId),
      program: String(program),
      approvedBy: String(approvedBy),
      approvedAt: toIso(approvedAt),
      status: status === 'approved' || status === 'rejected' ? status : 'pending',
      remarks: typeof remarks === 'string' ? remarks : null,
    }
    const collection = await graduationApprovalsCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'registrar_graduation_approval_created', entityType: 'graduation_approval', entityId: item.id, details: { studentId: item.studentId, status: item.status }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create graduation approval')
    res.status(500).json({ success: false, error: 'Failed to create graduation approval' })
  }
})

registrarRoutes.put('/graduation-approvals/:id', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await graduationApprovalsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Graduation approval not found' })
    }
    const updates: Partial<GraduationApproval> = {}
    ;['studentId', 'program', 'approvedBy', 'approvedAt', 'status', 'remarks'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })

    const isNewlyApproved = updates.status === 'approved' && existing.status !== 'approved'
    let warning: string | undefined
    if (isNewlyApproved) {
      const studentsCol = await studentsCollection()
      const student = await studentsCol.findOne({ id: existing.studentId })
      if (student) {
        await studentsCol.updateOne({ id: student.id }, { $set: { status: 'graduated' } })
        await notifyStudent(
          existing.studentId,
          'Graduation approved',
          `Congratulations — your graduation for ${existing.program} has been approved.`,
          req.auth?.username ?? req.auth?.userId ?? 'system',
        )
      } else {
        warning = 'Student record not found; approval saved but student status was not updated.'
      }
    }

    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({
      action: isNewlyApproved ? 'registrar_graduation_approved' : 'registrar_graduation_approval_updated',
      entityType: 'graduation_approval',
      entityId: existing.id,
      details: { studentId: existing.studentId, program: existing.program, updatedFields: Object.keys(updates) },
      auth: req.auth,
    })
    res.json({ success: true, data: updated ?? { ...existing, ...updates }, ...(warning ? { warning } : {}) })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update graduation approval')
    res.status(500).json({ success: false, error: 'Failed to update graduation approval' })
  }
})

registrarRoutes.delete('/graduation-approvals/:id', async (req, res) => {
  try {
    if (!canAccessRegistrar(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Registrar access required' })
    }
    const collection = await graduationApprovalsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Graduation approval not found' })
    }
    await writeAuditLog({ action: 'registrar_graduation_approval_deleted', entityType: 'graduation_approval', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Graduation approval deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete graduation approval')
    res.status(500).json({ success: false, error: 'Failed to delete graduation approval' })
  }
})

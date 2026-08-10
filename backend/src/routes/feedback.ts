import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { Feedback, User, UserNotification } from '../../../shared/types/index.js'
import { getCollection } from '../db/postgres.js'
import { studentsCollection } from '../data/collections.js'

export const feedbackRoutes: ReturnType<typeof Router> = Router()

async function feedbackCollection() {
  return getCollection<Feedback>('feedback')
}

async function resolveStudentName(studentId: string | undefined, fallback?: string) {
  if (!studentId) return fallback ?? ''
  try {
    const student = await studentsCollection().then((col) => col.findOne({ id: studentId }))
    if (student?.firstName || student?.lastName) {
      return `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim()
    }
    return student?.displayId || fallback || ''
  } catch (error) {
    console.error('[feedback] failed to resolve student name', error)
    return fallback ?? ''
  }
}

feedbackRoutes.get('/', async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  try {
    const col = await feedbackCollection()
    const filter = req.auth?.role === 'student' && req.auth.studentId
      ? { studentId: req.auth.studentId }
      : {}
    const items = await col.find(filter as any).sort({ date: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load feedback' })
  }
})

feedbackRoutes.get('/:id', async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  try {
    const col = await feedbackCollection()
    const feedback = await col.findOne({ id: req.params.id })
    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' })
    }
    if (req.auth?.role === 'student' && req.auth.studentId && feedback.studentId !== req.auth.studentId) {
      return res.status(403).json({ success: false, error: 'Students can only view their own feedback' })
    }
    res.json({ success: true, data: feedback })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch feedback' })
  }
})

feedbackRoutes.post('/', async (req, res) => {
  try {
    const col = await feedbackCollection()
    const auth = req.auth
    const {
      subject,
      message,
      category,
      courseId,
      priority,
      context,
      professorId,
      professorName,
      type,
      rating,
      comment,
      studentId: bodyStudentId,
      studentName: bodyStudentName,
      source,
      targetRole,
      attachment,
      attachmentName,
    } = req.body || {}

    const studentId = auth?.studentId ?? bodyStudentId ?? auth?.userId ?? 'unknown-student'
    const resolvedStudentName = (bodyStudentName?.trim() || auth?.username || '').trim() || (await resolveStudentName(studentId, 'Student')) || 'Student'

    const normalizedType: Feedback['type'] =
      type && ['course', 'facility', 'professor', 'general'].includes(type)
        ? type
        : category === 'enrollment'
          ? 'course'
          : category === 'billing'
            ? 'facility'
            : 'general'

    const now = new Date().toISOString()

    const safeAttachment = typeof attachment === 'string' && attachment.length <= 1_000_000 ? attachment : undefined
    const safeAttachmentName = typeof attachmentName === 'string' && attachmentName.trim() ? attachmentName.trim() : undefined
    const safeTargetRole: Feedback['targetRole'] = targetRole === 'supervisor' ? 'supervisor' : 'admin'

    const safeRating = typeof rating === 'number' ? rating : undefined

    const newFeedback: Feedback = {
      id: `FB-${randomUUID().slice(0, 8).toUpperCase()}`,
      studentId,
      studentName: resolvedStudentName || 'Student',
      professorId,
      professorName,
      type: normalizedType,
      comment: (comment || message || subject || 'Student request').toString(),
      date: now,
      status: 'new',
      subject: subject || undefined,
      category: category || 'general',
      courseId: courseId || undefined,
      priority: (priority as Feedback['priority']) || 'normal',
      context: context || undefined,
      source: source || 'student-portal',
      targetRole: safeTargetRole,
      attachment: safeAttachment,
      attachmentName: safeAttachmentName,
    }

    if (safeRating !== undefined) {
      Object.assign(newFeedback, { rating: safeRating })
    }

    await col.insertOne(newFeedback)

    // Notify supervisors without duplicating the feedback record (CC-only visibility)
    if (safeTargetRole === 'admin' && source === 'public-admissions') {
      try {
        const usersCol = await getCollection<User>('users')
        const supervisors = await usersCol.find({ role: 'supervisor', status: 'active' }).toArray()
        if (supervisors.length > 0) {
          const notificationsCol = await getCollection<UserNotification>('notifications')
          const notificationTitle = subject ? `New application: ${subject}` : 'New public application received'
          const notificationBody = comment?.toString()?.slice(0, 240) || 'A new application was submitted.'
          const docs = supervisors.map((user) => ({
            id: `FB-NOTIF-${randomUUID().slice(0, 8).toUpperCase()}`,
            userId: user.id,
            title: notificationTitle,
            body: notificationBody,
            createdAt: now,
            read: false,
            actor: resolvedStudentName || 'Applicant',
          }))
          await notificationsCol.insertMany(docs)
        }
      } catch (notifyError) {
        console.error('Failed to notify supervisors about public application', notifyError)
      }
    }

    res.status(201).json({ success: true, data: newFeedback, message: 'Feedback created' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create feedback' })
  }
})

feedbackRoutes.put('/:id', async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  try {
    const col = await feedbackCollection()
    const existing = await col.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Feedback not found' })
    }
    const isOwner = req.auth?.role === 'student' && req.auth.studentId ? existing.studentId === req.auth.studentId : false
    const isPrivileged =
      req.auth?.role === 'admin' || req.auth?.role === 'super-admin' || Boolean(req.auth?.effectivePermissions?.includes('feedback:manage'))
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this feedback' })
    }

    const updates = { ...req.body }
    await col.updateOne({ id: req.params.id }, { $set: updates })
    const updated = await col.findOne({ id: req.params.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates }, message: 'Feedback updated' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update feedback' })
  }
})

feedbackRoutes.delete('/:id', async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  try {
    const col = await feedbackCollection()
    const existing = await col.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Feedback not found' })
    }
    const isOwner = req.auth?.role === 'student' && req.auth.studentId ? existing.studentId === req.auth.studentId : false
    const isPrivileged =
      req.auth?.role === 'admin' || req.auth?.role === 'super-admin' || Boolean(req.auth?.effectivePermissions?.includes('feedback:manage'))
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this feedback' })
    }
    await col.deleteOne({ id: req.params.id })
    res.json({ success: true, message: 'Feedback deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete feedback' })
  }
})

import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { coursesCollection, enrollmentsCollection, questionsCollection, studentsCollection } from '../data/collections.js'
import type { Question } from '../../../shared/types/index.js'

export const questionRoutes: ReturnType<typeof Router> = Router()

questionRoutes.get('/', async (req, res) => {
  try {
    const questionsCol = await questionsCollection()
    const filter: Record<string, unknown> = {}

    if (req.auth?.role === 'student') {
      const studentId = req.auth.studentId || req.auth.userId
      if (!studentId) {
        return res.status(403).json({ success: false, error: 'Student identity missing in token' })
      }
      filter.studentId = studentId
    } else if (req.auth?.role === 'professor') {
      const professorId = req.auth.professorId
      if (!professorId) {
        return res.status(403).json({ success: false, error: 'Professor identity missing in token' })
      }
      filter.professorId = professorId
    }

    const items = await questionsCol.find(filter as any).sort({ createdAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Questions list failed', error)
    res.status(500).json({ success: false, error: 'Failed to fetch questions' })
  }
})

questionRoutes.post('/', async (req, res) => {
  try {
    if (req.auth?.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Only students can submit questions' })
    }

    const studentId = req.auth.studentId || req.auth.userId
    if (!studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }

    const { courseId, body } = req.body as { courseId?: string; body?: string }

    if (!courseId || !body || !body.trim()) {
      return res.status(400).json({ success: false, error: 'courseId and body are required' })
    }

    const coursesCol = await coursesCollection()
    const enrollmentsCol = await enrollmentsCollection()
    const studentsCol = await studentsCollection()

    const course = await coursesCol.findOne({ id: courseId })
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    const enrollment = await enrollmentsCol.findOne({ courseId, studentId, status: { $nin: ['cancelled'] } })
    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'You must be enrolled in this course to ask a question' })
    }

    const student = await studentsCol.findOne({ id: studentId })
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const createdAt = new Date().toISOString()
    const question: Question = {
      id: `Q-${randomUUID().slice(0, 8).toUpperCase()}`,
      courseId,
      professorId: course.professorId,
      studentId,
      body: body.trim(),
      createdAt,
      status: 'open',
    }

    const questionsCol = await questionsCollection()
    await questionsCol.insertOne(question)

    res.status(201).json({ success: true, data: question })
  } catch (error) {
    console.error('Question create failed', error)
    res.status(500).json({ success: false, error: 'Failed to submit question' })
  }
})

questionRoutes.get('/professor', async (req, res) => {
  try {
    if (req.auth?.role !== 'professor') {
      return res.status(403).json({ success: false, error: 'Professor role required' })
    }
    const professorId = req.auth.professorId
    if (!professorId) {
      return res.status(403).json({ success: false, error: 'Professor identity missing in token' })
    }
    const questionsCol = await questionsCollection()
    const items = await questionsCol.find({ professorId }).sort({ createdAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Professor questions fetch failed', error)
    res.status(500).json({ success: false, error: 'Failed to fetch professor questions' })
  }
})

questionRoutes.get('/admin', async (req, res) => {
  try {
    if (req.auth?.role !== 'admin' && req.auth?.role !== 'super-admin' && req.auth?.role !== 'supervisor') {
      return res.status(403).json({ success: false, error: 'Admin or supervisor role required' })
    }
    const questionsCol = await questionsCollection()
    const items = await questionsCol.find().sort({ createdAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Admin questions fetch failed', error)
    res.status(500).json({ success: false, error: 'Failed to fetch questions' })
  }
})

questionRoutes.put('/:id/reply', async (req, res) => {
  try {
    const questionsCol = await questionsCollection()
    const existing = await questionsCol.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Question not found' })
    }

    const isAdmin = req.auth?.role === 'admin' || req.auth?.role === 'super-admin' || req.auth?.role === 'supervisor'
    const isProfessorOwner = req.auth?.role === 'professor' && req.auth.professorId && req.auth.professorId === existing.professorId

    if (!isAdmin && !isProfessorOwner) {
      return res.status(403).json({ success: false, error: 'Not authorized to reply to this question' })
    }

    const { reply } = req.body as { reply?: string }
    if (!reply || !reply.trim()) {
      return res.status(400).json({ success: false, error: 'Reply text is required' })
    }

    const repliedAt = new Date().toISOString()

    await questionsCol.updateOne(
      { id: existing.id },
      {
        $set: {
          reply: reply.trim(),
          status: 'answered',
          repliedAt,
        },
      },
    )

    const updated: Question = { ...existing, reply: reply.trim(), status: 'answered', repliedAt }
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Question reply failed', error)
    res.status(500).json({ success: false, error: 'Failed to reply to question' })
  }
})

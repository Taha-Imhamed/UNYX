import { Router } from 'express'
import { studentsCollection } from '../data/collections.js'
import hints from '../data/student-hints.js'

export const studentHintsRoutes: ReturnType<typeof Router> = Router()

function normalizeKey(value?: string) {
  if (!value) return ''
  return value.trim().toLowerCase()
}

studentHintsRoutes.get('/student/hints', async (req, res) => {
  try {
    const explicitField = normalizeKey(typeof req.query.field === 'string' ? req.query.field : undefined)
    const authStudentId = req.auth?.studentId ?? req.auth?.userId
    let field = explicitField

    if (!field && authStudentId) {
      const student = await studentsCollection().then((col) =>
        col.findOne({ id: authStudentId }, { projection: { programId: 1, program: 1, facultyId: 1, faculty: 1 } }),
      )
      field = normalizeKey(student?.programId) || normalizeKey(student?.program) || normalizeKey(student?.facultyId) || normalizeKey(student?.faculty)
    }

    const resolvedField = field && hints[field] ? field : 'general'
    const selectedHints = field && hints[field] ? hints[field] : hints.general

    return res.json({
      success: true,
      data: {
        field: resolvedField,
        hints: selectedHints,
      },
    })
  } catch (error) {
    console.error('Failed to resolve student hints', error)
    res.status(500).json({ success: false, error: 'Failed to load student hints' })
  }
})

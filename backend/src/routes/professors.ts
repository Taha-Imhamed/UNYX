import { Router } from 'express'
import { getCollection } from '../db/postgres.js'
import { coursesCollection, enrollmentsCollection } from '../data/collections.js'
import type { Professor } from '../../../shared/types/index.js'
import { requirePermission } from '../middleware/auth.js'
import { readPagination, UNPAGINATED_SAFETY_CAP } from '../lib/pagination.js'
import { logger } from '../lib/logger.js'

export const professorRoutes: ReturnType<typeof Router> = Router()

const COLLECTION = 'professors'
const MIN_SALARY = 0
const MAX_SALARY = 10_000_000

function parseSalary(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < MIN_SALARY || n > MAX_SALARY) return null
  return n
}

professorRoutes.get('/', async (req, res) => {
  try {
    const collection = await getCollection<Professor>(COLLECTION)
    const { isPaginated, page, pageSize } = readPagination(req)
    if (isPaginated) {
      const cursor = collection.find().sort({ id: 1 })
      const total = await cursor.count()
      const items = await cursor.skip((page - 1) * pageSize).limit(pageSize).toArray()
      return res.json({ success: true, data: { items, total, page, pageSize } })
    }
    const all = await collection.find().limit(UNPAGINATED_SAFETY_CAP).toArray()
    res.json({ success: true, data: all })
  } catch (error) {
    logger.error({ err: error }, 'Professor list failed')
    res.status(500).json({ success: false, error: 'Failed to fetch professors' })
  }
})

professorRoutes.get('/:id', async (req, res) => {
  try {
    const collection = await getCollection<Professor>(COLLECTION)
    const professor = await collection.findOne({ id: req.params.id })
    if (!professor) {
      return res.status(404).json({ success: false, error: 'Professor not found' })
    }
    res.json({ success: true, data: professor })
  } catch (error) {
    console.error('Professor fetch failed', error)
    res.status(500).json({ success: false, error: 'Failed to fetch professor' })
  }
})

professorRoutes.post('/', requirePermission('professors:create'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, department, salary, hireDate, specialization, status, photo } = req.body ?? {}

    if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'First name, last name, and email are required' })
    }

    const parsedSalary = salary === undefined ? 0 : parseSalary(salary)
    if (parsedSalary === null) {
      return res.status(400).json({ success: false, error: `Salary must be a number between ${MIN_SALARY} and ${MAX_SALARY}` })
    }

    const collection = await getCollection<Professor>(COLLECTION)
    const newProfessor: Professor = {
      id: `PROF${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: typeof phone === 'string' ? phone.trim() : '',
      photo: typeof photo === 'string' && photo.trim() ? photo.trim() : '/dashboard-red.jpg',
      department: typeof department === 'string' ? department.trim() : 'General',
      salary: parsedSalary,
      hireDate: typeof hireDate === 'string' && hireDate.trim() ? hireDate : new Date().toISOString(),
      specialization: typeof specialization === 'string' ? specialization.trim() : '',
      status: status === 'on-leave' || status === 'retired' ? status : 'active',
    }

    await collection.insertOne(newProfessor)
    res.status(201).json({ success: true, data: newProfessor, message: 'Professor created' })
  } catch (error) {
    console.error('Professor create failed', error)
    res.status(500).json({ success: false, error: 'Failed to create professor' })
  }
})

professorRoutes.put('/:id', requirePermission('professors:edit'), async (req, res) => {
  try {
    const collection = await getCollection<Professor>(COLLECTION)
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Professor not found' })
    }

    const updates: Partial<Professor> = {}
    const { firstName, lastName, email, phone, department, salary, hireDate, specialization, status, photo } = req.body ?? {}

    if (typeof firstName === 'string') updates.firstName = firstName.trim()
    if (typeof lastName === 'string') updates.lastName = lastName.trim()
    if (typeof email === 'string') updates.email = email.trim()
    if (typeof phone === 'string') updates.phone = phone.trim()
    if (typeof department === 'string') updates.department = department.trim()
    if (typeof specialization === 'string') updates.specialization = specialization.trim()
    if (typeof photo === 'string') updates.photo = photo.trim()
    if (status === 'active' || status === 'on-leave' || status === 'retired') updates.status = status
    if (salary !== undefined) {
      const parsedSalary = parseSalary(salary)
      if (parsedSalary === null) {
        return res.status(400).json({ success: false, error: `Salary must be a number between ${MIN_SALARY} and ${MAX_SALARY}` })
      }
      updates.salary = parsedSalary
    }
    if (typeof hireDate === 'string' && hireDate.trim()) updates.hireDate = hireDate

    await collection.updateOne({ id: req.params.id }, { $set: updates })
    const updated = await collection.findOne({ id: req.params.id })
    const resolved = updated ?? { ...existing, ...updates }
    const fullName = `${resolved.firstName ?? ''} ${resolved.lastName ?? ''}`.trim()

    if (fullName) {
      const [coursesCol, enrollmentsCol] = await Promise.all([coursesCollection(), enrollmentsCollection()])
      await Promise.all([
        coursesCol.updateMany({ professorId: resolved.id }, { $set: { professorName: fullName } }),
        enrollmentsCol.updateMany({ professorId: resolved.id }, { $set: { professorName: fullName } }),
      ])
    }

    res.json({ success: true, data: resolved, message: 'Professor updated' })
  } catch (error) {
    console.error('Professor update failed', error)
    res.status(500).json({ success: false, error: 'Failed to update professor' })
  }
})

professorRoutes.delete('/:id', requirePermission('professors:delete'), async (req, res) => {
  try {
    const collection = await getCollection<Professor>(COLLECTION)
    const professor = await collection.findOne({ id: req.params.id })
    if (!professor) {
      return res.status(404).json({ success: false, error: 'Professor not found' })
    }

    const [coursesCol, enrollmentsCol] = await Promise.all([coursesCollection(), enrollmentsCollection()])
    const [courseCount, enrollmentCount] = await Promise.all([
      coursesCol.countDocuments({ professorId: req.params.id }),
      enrollmentsCol.countDocuments({ professorId: req.params.id }),
    ])

    if (courseCount > 0 || enrollmentCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete professor: still assigned to ${courseCount} course(s) and ${enrollmentCount} enrollment(s). Reassign or remove these first.`,
      })
    }

    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Professor not found' })
    }
    res.json({ success: true, message: 'Professor deleted' })
  } catch (error) {
    console.error('Professor delete failed', error)
    res.status(500).json({ success: false, error: 'Failed to delete professor' })
  }
})

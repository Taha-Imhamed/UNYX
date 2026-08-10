import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import {
  studentsCollection,
  paymentsCollection,
  enrollmentsCollection,
  coursesCollection,
} from '../data/collections.js'
import { getCollection, runDbQuery } from '../db/postgres.js'
import type { Course, CourseScheduleEntry, Enrollment, PaymentMethod, PaymentTransaction, Student, StudentFinancialSnapshot } from '../../../shared/types/index.js'
import { assignBaseCoursesToFirstYearStudent } from '../lib/base-course-assignment.js'
import { appendFinancialLedgerEntry, ensureAcademicComplianceStorage } from '../lib/academic-compliance.js'
import { buildStudentTranscript, buildStudentTranscriptPdf, streamStudentTranscriptCsv } from '../lib/transcripts.js'
import { readPagination, UNPAGINATED_SAFETY_CAP } from '../lib/pagination.js'

export const studentRoutes: ReturnType<typeof Router> = Router()

const createStudentCoreSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  balance: z.coerce.number().finite().optional(),
})

function isPrivileged(auth: Request['auth']) {
  return (
    auth?.role === 'admin' ||
    auth?.role === 'super-admin' ||
    auth?.role === 'supervisor' ||
    Boolean(auth?.effectivePermissions?.includes('users:manage'))
  )
}

function isAcademicAdvisor(auth: Request['auth']) {
  return auth?.role === 'advisor' && Boolean(auth.professorId)
}

function isAssignedAcademicStaff(auth: Request['auth'], student: Student) {
  return Boolean(auth?.professorId && (auth.role === 'advisor' || auth.role === 'professor') && student.supervisorId === auth.professorId)
}

function isFinanceEditor(auth: Request['auth']) {
  return Boolean(
    auth &&
      !isPrivileged(auth) &&
      (auth.role === 'finance' ||
        auth.effectivePermissions?.includes('VIEW_FINANCIALS') ||
        auth.effectivePermissions?.includes('finance:manage') ||
        auth.effectivePermissions?.includes('finance:approve')),
  )
}

function assertStudentOwnership(req: Request, res: Response, studentId: string) {
  const tokenStudentId = req.auth?.studentId || req.auth?.userId
  if (req.auth?.role === 'student' && tokenStudentId && studentId !== tokenStudentId) {
    res.status(403).json({ success: false, error: 'Students can only access their own profile' })
    return false
  }
  if (req.auth?.role === 'student' && !tokenStudentId) {
    res.status(403).json({ success: false, error: 'Student identity missing in token' })
    return false
  }
  return true
}

function buildStudentId() {
  return `STU-${randomUUID().slice(0, 8).toUpperCase()}`
}

function buildTransactionId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

async function ensureFinancePaymentColumns() {
  await runDbQuery(`
    alter table public.payments
      add column if not exists invoice_id text null,
      add column if not exists finance_status text null,
      add column if not exists confirmed_at timestamptz null,
      add column if not exists confirmed_by text null,
      add column if not exists confirmation_note text null
  `)
}

function normalizeStudentDateOfBirth(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '2000-01-01'
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

const studentOptionalStringFields = [
  'middleName',
  'major',
  'programId',
  'faculty',
  'facultyId',
  'gender',
  'nationality',
  'nationalId',
  'passportNumber',
  'bloodType',
  'city',
  'postalCode',
  'emergencyContactName',
  'emergencyContactPhone',
  'motherName',
  'fatherName',
] as const

function applyOptionalStudentFields(target: Partial<Student> & Record<string, unknown>, source: Record<string, unknown>) {
  studentOptionalStringFields.forEach((field) => {
    if (source[field] !== undefined) {
      target[field] = normalizeOptionalString(source[field])
    }
  })
}

function normalizeCurrentSemester(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function toCamelCaseKey(value: string) {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function normalizeRowKeys<T extends Record<string, unknown>>(row: T) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [toCamelCaseKey(key), value]))
}

function deriveCurrentYear(student: Partial<Student> & Record<string, unknown>) {
  const directYear = Number(student.currentYear)
  if (Number.isFinite(directYear) && directYear > 0) {
    return Math.floor(directYear)
  }

  const semester = typeof student.currentSemester === 'string' ? student.currentSemester.trim() : ''
  if (!semester) return undefined

  const match = semester.match(/^(?:year\s*)?(\d+)$/i)
  if (!match) return undefined

  const derivedYear = Number(match[1])
  return Number.isFinite(derivedYear) && derivedYear > 0 ? Math.floor(derivedYear) : undefined
}

function formatCurrentSemesterFromYear(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return undefined
  return `Year ${Math.floor(parsed)}`
}

function serializeStudent(student: Student | (Partial<Student> & Record<string, unknown>)) {
  const currentYear = deriveCurrentYear(student)
  return {
    ...student,
    currentSemester:
      normalizeCurrentSemester(student.currentSemester) ??
      (currentYear ? `Year ${currentYear}` : undefined),
    currentYear: currentYear ?? null,
  } as Student & { currentYear: number | null; currentSemester?: string }
}

async function findOrCreateStudentRecord(studentId: string, auth?: Request['auth']): Promise<Student> {
  const collection = await studentsCollection()
  const existing = await collection.findOne({ id: studentId })
  if (existing) return existing

  const usersCol = await getCollection<any>('users')
  const userDoc = auth?.userId ? await usersCol.findOne({ id: auth.userId }) : null
  const now = new Date().toISOString()
  const generatedId = studentId || buildStudentId()
  const newStudent: Student = {
    id: generatedId,
    displayId: generatedId,
    firstName: auth?.username ?? userDoc?.username ?? 'Student',
    lastName: '',
    email: userDoc?.email ?? '',
    phone: '',
    photo: userDoc?.avatarUrl ?? '/placeholder-user.jpg',
    enrollmentDate: now,
    program: '',
    currentYear: null,
    status: 'active',
    address: '',
    dateOfBirth: normalizeStudentDateOfBirth(null),
    balance: 0,
  }
  await collection.insertOne(newStudent)
  // backfill user mapping if missing
  if (auth?.role === 'student' && auth.userId) {
    await usersCol.updateOne({ id: auth.userId }, { $set: { studentId: generatedId } })
  }
  return newStudent
}

studentRoutes.get('/', async (req, res) => {
  try {
    if (req.auth?.role === 'student') {
      return res.status(403).json({ success: false, error: 'Students cannot list other students' })
    }
    const collection = await studentsCollection()
    const { isPaginated, page, pageSize } = readPagination(req)
    // Advisor/professor scoping happens in-memory below, so pagination is applied
    // after scoping too — the safety cap only bounds the unpaginated default path.
    const baseCursor = collection.find({ deletedAt: { $exists: false } })
    const students = await (isPaginated ? baseCursor : baseCursor.limit(UNPAGINATED_SAFETY_CAP)).toArray()
    const scopedStudents = isAcademicAdvisor(req.auth) || (req.auth?.role === 'professor' && req.auth.professorId)
      ? students.filter((student) => isAssignedAcademicStaff(req.auth, student))
      : students

    if (isPaginated) {
      const total = scopedStudents.length
      const pageItems = scopedStudents.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
      return res.json({ success: true, data: { items: pageItems.map((student) => serializeStudent(student)), total, page, pageSize } })
    }

    res.json({ success: true, data: scopedStudents.map((student) => serializeStudent(student)) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' })
  }
})

studentRoutes.get('/me', async (req, res) => {
  try {
    const tokenStudentId = req.auth?.studentId || req.auth?.userId
    if (!tokenStudentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }

    const collection = await studentsCollection()
    const studentDoc = await collection.findOne({ id: tokenStudentId })
    const student = studentDoc ?? (await findOrCreateStudentRecord(tokenStudentId, req.auth))

    res.json({ success: true, data: serializeStudent(student) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch student' })
  }
})

studentRoutes.get('/self', async (req, res) => {
  try {
    const tokenStudentId = req.auth?.studentId || req.auth?.userId
    if (!tokenStudentId || req.auth?.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }

    const collection = await studentsCollection()
    const studentDoc = await collection.findOne({ id: tokenStudentId })
    const student = studentDoc ?? (await findOrCreateStudentRecord(tokenStudentId, req.auth))

    res.json({ success: true, data: serializeStudent(student) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch student' })
  }
})

studentRoutes.put('/self', async (req, res) => {
  try {
    const tokenStudentId = req.auth?.studentId || req.auth?.userId
    if (!tokenStudentId || req.auth?.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }

    const collection = await studentsCollection()
    const studentDoc = await collection.findOne({ id: tokenStudentId })
    const student = studentDoc ?? (await findOrCreateStudentRecord(tokenStudentId, req.auth))

    const updates: Partial<Student> = {}
    ;(['firstName', 'lastName', 'phone', 'address', 'photo', 'program', 'dateOfBirth'] as Array<keyof Student>).forEach((key) => {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    applyOptionalStudentFields(updates as Partial<Student> & Record<string, unknown>, req.body ?? {})

    const currentSemester = normalizeCurrentSemester(req.body.currentSemester) ?? formatCurrentSemesterFromYear(req.body.currentYear)
    if (currentSemester) {
      (updates as Partial<Student> & Record<string, unknown>).currentSemester = currentSemester
    }

    await collection.updateOne({ id: student.id }, { $set: updates })
    const updated = await collection.findOne({ id: student.id })
    const responseBody = updated ?? { ...student, ...updates }
    res.json({ success: true, data: serializeStudent(responseBody) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update student' })
  }
})

studentRoutes.get('/:id', async (req, res) => {
  try {
    if (!assertStudentOwnership(req, res, req.params.id)) return
    const collection = await studentsCollection()
    const student = await collection.findOne({ id: req.params.id })
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }
    if (!isPrivileged(req.auth) && !isFinanceEditor(req.auth) && !isAssignedAcademicStaff(req.auth, student)) {
      return res.status(403).json({ success: false, error: 'You can only view your assigned students' })
    }
    res.json({ success: true, data: serializeStudent(student) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch student' })
  }
})

studentRoutes.post('/', async (req, res) => {
  try {
    if (!isPrivileged(req.auth)) {
      return res.status(403).json({ success: false, error: 'Admin or supervisor privileges required' })
    }
    const parsedCore = createStudentCoreSchema.safeParse(req.body ?? {})
    if (!parsedCore.success) {
      return res.status(400).json({ success: false, error: parsedCore.error.issues[0]?.message ?? 'firstName, lastName, and a valid email are required' })
    }
    const { firstName, lastName, email, balance } = parsedCore.data
    const { phone, photo, enrollmentDate, program, status, address, dateOfBirth, supervisorId, supervisorName } = req.body ?? {}
    const currentYearRaw = req.body?.currentYear

    const collection = await studentsCollection()
    const id = buildStudentId()

    const newStudent: Student = {
      id,
      displayId: id,
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email),
      phone: typeof phone === 'string' ? phone : '',
      photo: typeof photo === 'string' ? photo : '/modern-university-campus-building-with-students-wa.jpg',
      enrollmentDate: typeof enrollmentDate === 'string' && enrollmentDate ? enrollmentDate : new Date().toISOString(),
      program: typeof program === 'string' ? program : '',
      currentSemester: formatCurrentSemesterFromYear(currentYearRaw),
      status: status === 'inactive' || status === 'graduated' ? status : 'active',
      address: typeof address === 'string' ? address : '',
      dateOfBirth: normalizeStudentDateOfBirth(dateOfBirth),
      balance: Number.isFinite(balance) ? Number(balance) : 0,
      supervisorId: typeof supervisorId === 'string' && supervisorId.trim() ? supervisorId.trim() : undefined,
      supervisorName: typeof supervisorName === 'string' && supervisorName.trim() ? supervisorName.trim() : undefined,
    }
    applyOptionalStudentFields(newStudent as Partial<Student> & Record<string, unknown>, req.body ?? {})

    await collection.insertOne(newStudent)
    await assignBaseCoursesToFirstYearStudent(newStudent)
    res.status(201).json({ success: true, data: serializeStudent(newStudent), message: 'Student created' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create student' })
  }
})

studentRoutes.put('/:id', async (req, res) => {
  try {
    const privileged = isPrivileged(req.auth)
    const financeEditor = isFinanceEditor(req.auth)
    const collection = await studentsCollection()
    const student = await collection.findOne({ id: req.params.id })
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const assignedAdvisor = isAcademicAdvisor(req.auth) && isAssignedAcademicStaff(req.auth, student)
    if (!privileged && !financeEditor && !assignedAdvisor) {
      return res.status(403).json({ success: false, error: 'Admin, advisor, or finance privileges required' })
    }

    const updates: Partial<Student> & Record<string, unknown> = {}
    if (privileged || assignedAdvisor) {
      const fields: Array<keyof Student> = ['firstName', 'lastName', 'email', 'phone', 'photo', 'enrollmentDate', 'program', 'status', 'address', 'dateOfBirth']
      fields.forEach((key) => {
        if (req.body[key] !== undefined) {
          updates[key] = key === 'dateOfBirth' ? normalizeStudentDateOfBirth(req.body[key]) : req.body[key]
        }
      })
      applyOptionalStudentFields(updates, req.body ?? {})

      if (req.body.currentYear !== undefined || req.body.currentSemester !== undefined) {
        const currentSemester = normalizeCurrentSemester(req.body.currentSemester) ?? formatCurrentSemesterFromYear(req.body.currentYear)
        if (!currentSemester) {
          return res.status(400).json({ success: false, error: 'Current year must be a positive number' })
        }
        updates.currentSemester = currentSemester
      }

      if (privileged && req.body.supervisorId !== undefined) {
        const supervisorId = typeof req.body.supervisorId === 'string' ? req.body.supervisorId.trim() : ''
        if (supervisorId) {
          updates.supervisorId = supervisorId
          if (typeof req.body.supervisorName === 'string' && req.body.supervisorName.trim()) {
            updates.supervisorName = req.body.supervisorName.trim()
          }
        } else {
          updates.supervisorId = undefined
          updates.supervisorName = undefined
        }
      } else if (privileged && req.body.supervisorName !== undefined) {
        updates.supervisorName =
          typeof req.body.supervisorName === 'string' && req.body.supervisorName.trim() ? req.body.supervisorName.trim() : undefined
      }
    }

    if (req.body.balance !== undefined) {
      const nextBalance = Number(req.body.balance)
      if (!Number.isFinite(nextBalance)) {
        return res.status(400).json({ success: false, error: 'Balance must be a number' })
      }
      updates.balance = nextBalance
    }

    if (!privileged && Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'Finance can only update student finance details' })
    }

    const unset: Record<string, unknown> = {}
    if (privileged && req.body.supervisorId !== undefined) {
      const supervisorId = typeof req.body.supervisorId === 'string' ? req.body.supervisorId.trim() : ''
      if (!supervisorId) {
        unset.supervisorId = true
        unset.supervisorName = true
      }
    }

    await collection.updateOne(
      { id: student.id },
      Object.keys(unset).length > 0 ? { $set: updates, $unset: unset } : { $set: updates },
    )
    const updated = await collection.findOne({ id: student.id })
    await assignBaseCoursesToFirstYearStudent((updated ?? { ...student, ...updates }) as Student)
    res.json({ success: true, data: serializeStudent(updated ?? { ...student, ...updates }), message: 'Student updated' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update student' })
  }
})

studentRoutes.delete('/:id', async (req, res) => {
  try {
    if (!isPrivileged(req.auth)) {
      return res.status(403).json({ success: false, error: 'Admin or supervisor privileges required' })
    }
    const collection = await studentsCollection()
    const student = await collection.findOne({ id: req.params.id })
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const enrollmentsCol = await enrollmentsCollection()
    const paymentsCol = await paymentsCollection()
    const usersCol = await getCollection<any>('users')

    const [studentEnrollments, studentPayments, userResult] = await Promise.all([
      enrollmentsCol.find({ studentId: req.params.id }).toArray(),
      paymentsCol.find({ studentId: req.params.id }).toArray(),
      usersCol.updateMany({ studentId: req.params.id }, { $set: { studentId: null } }),
    ])

    // Soft delete: mark records as deleted instead of removing them, so financial and
    // enrollment history survives an account deletion for audit purposes.
    const deletedAt = new Date().toISOString()
    await Promise.all([
      ...studentEnrollments.map((enrollment) => enrollmentsCol.updateOne({ id: enrollment.id }, { $set: { deletedAt } })),
      ...studentPayments.map((payment) => paymentsCol.updateOne({ id: payment.id }, { $set: { deletedAt } })),
    ])

    const updateResult = await collection.updateOne({ id: req.params.id }, { $set: { deletedAt } })
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    res.json({
      success: true,
      data: {
        id: req.params.id,
        enrollmentsRemoved: studentEnrollments.length,
        paymentsRemoved: studentPayments.length,
        usersUnlinked: userResult.modifiedCount ?? 0,
      },
      message: 'Student deleted',
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete student' })
  }
})

studentRoutes.get('/:id/balance', async (req, res) => {
  try {
    if (!assertStudentOwnership(req, res, req.params.id)) return
    const collection = await studentsCollection()
    const student = await collection.findOne({ id: req.params.id })
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }
    res.json({ success: true, data: { studentId: student.id, studentDisplayId: student.displayId, balance: student.balance ?? 0, updatedAt: new Date().toISOString() } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch balance' })
  }
})

studentRoutes.get('/:id/financial', async (req, res) => {
  try {
    if (!assertStudentOwnership(req, res, req.params.id)) return
    const studentsCol = await studentsCollection()
    const paymentsCol = await paymentsCollection()
    const enrollmentsCol = await enrollmentsCollection()

    const student = await studentsCol.findOne({ id: req.params.id })
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const transactions = await paymentsCol.find({ studentId: student.id }).sort({ createdAt: -1 }).toArray()
    const enrollments = await enrollmentsCol.find({ studentId: student.id }).toArray()

    const hasPayments = transactions.some((txn) => txn.source === 'payment')
    const paymentStatus: StudentFinancialSnapshot['paymentStatus'] =
      (student.balance ?? 0) <= 0 ? 'paid' : hasPayments ? 'partial' : 'unpaid'

    const snapshot: StudentFinancialSnapshot = {
      studentId: student.id,
      studentDisplayId: student.displayId,
      balance: student.balance ?? 0,
      updatedAt: transactions[0]?.createdAt ?? new Date().toISOString(),
      student: {
        id: student.id,
        displayId: student.displayId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        photo: student.photo,
        balance: student.balance ?? 0,
      },
      transactions,
      enrollments,
      paymentStatus,
    }

    res.json({ success: true, data: snapshot })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch financial snapshot' })
  }
})

studentRoutes.get('/:id/transactions', async (req, res) => {
  try {
    if (!assertStudentOwnership(req, res, req.params.id)) return
    const paymentsCol = await paymentsCollection()
    const history = await paymentsCol.find({ studentId: req.params.id }).sort({ createdAt: -1 }).toArray()
    res.json({ success: true, data: history })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' })
  }
})

studentRoutes.post('/:id/payments', async (req, res) => {
  const { amount, method, note, invoiceId } = req.body as {
    amount?: number
    method?: PaymentMethod
    note?: string
    invoiceId?: string
  }

  const canManageFinance = Boolean(req.auth?.effectivePermissions?.includes('finance:manage'))
  if (!assertStudentOwnership(req, res, req.params.id) && !isPrivileged(req.auth) && !canManageFinance) {
    return
  }

  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Payment amount must be a valid number greater than zero' })
  }

  const validMethods: PaymentMethod[] = ['cash', 'card', 'transfer']

  if (!method || !validMethods.includes(method)) {
    return res.status(400).json({ success: false, error: 'Payment method is invalid' })
  }

  try {
    await ensureFinancePaymentColumns()
    await ensureAcademicComplianceStorage()
    const studentsCol = await studentsCollection()
    const paymentsCol = await paymentsCollection()
    const student = await studentsCol.findOne({ id: req.params.id })
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const createdAt = new Date().toISOString()
    const newBalance = Math.max(0, Number((student.balance ?? 0) - amount))

    const transaction: PaymentTransaction = {
      id: buildTransactionId('TXN'),
      displayId: buildTransactionId('TXN'),
      studentId: student.id,
      amount: Number(amount.toFixed(2)),
      method,
      note: typeof note === 'string' ? note : undefined,
      createdAt,
      type: 'credit',
      source: 'payment',
      balanceAfter: newBalance,
      invoiceId: typeof invoiceId === 'string' && invoiceId.trim() ? invoiceId.trim() : null,
      financeStatus: canManageFinance ? 'confirmed' : 'pending',
      confirmedAt: canManageFinance ? createdAt : null,
      confirmedBy: canManageFinance ? (req.auth?.username ?? req.auth?.userId ?? 'finance') : null,
      confirmationNote: canManageFinance ? 'Recorded by finance dashboard' : null,
    }

    await paymentsCol.insertOne(transaction)
    await studentsCol.updateOne({ id: student.id }, { $set: { balance: newBalance } })
    await appendFinancialLedgerEntry({
      studentId: student.id,
      amount: transaction.amount,
      entryType: 'credit',
      source: transaction.source,
      note: transaction.note ?? 'Student payment recorded',
      paymentId: transaction.id,
      invoiceId: transaction.invoiceId ?? null,
      metadata: {
        method: transaction.method,
        balanceAfter: newBalance,
        financeStatus: transaction.financeStatus ?? null,
      },
      auth: req.auth,
    })
    if (newBalance <= 0) {
      const enrollmentsCol = await enrollmentsCollection()
      await enrollmentsCol.updateMany(
        {
          studentId: student.id,
          status: { $in: ['pending_approval', 'pendingAdvisorApproval'] },
        },
        {
          $set: {
            paymentStatus: 'paid',
            updatedAt: createdAt,
          },
        },
      )
    }

    res.status(201).json({ success: true, data: { transaction, balance: newBalance, updatedAt: createdAt } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record payment' })
  }
})

studentRoutes.post('/:id/schedule/preview', async (req, res) => {
  try {
    if (!assertStudentOwnership(req, res, req.params.id)) return

    const includeStatuses: Enrollment['status'][] = ['active', 'pending', 'pendingSupervisorApproval', 'pendingAdvisorApproval', 'pending_approval', 'waitlisted']
    const requestedCourseIds: string[] = Array.isArray(req.body?.courseIds)
      ? req.body.courseIds.filter((id: unknown): id is string => typeof id === 'string')
      : []

    const enrollmentsCol = await enrollmentsCollection()
    const coursesCol = await coursesCollection()

    const existingEnrollments = await enrollmentsCol.find({ studentId: req.params.id, status: { $in: includeStatuses } }).toArray()
    const existingCourseIds = Array.from(new Set(existingEnrollments.map((enr) => enr.courseId)))

    const allCourseIds = Array.from(new Set([...existingCourseIds, ...requestedCourseIds]))
    const courses = allCourseIds.length > 0 ? await coursesCol.find({ id: { $in: allCourseIds } }).toArray() : []
    const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c as Course]))

    const sessions: Array<
      CourseScheduleEntry & {
        courseId: string
        courseTitle: string
        courseCode?: string
        status: Enrollment['status'] | 'proposed'
        source: 'existing' | 'proposed'
      }
    > = []

    existingEnrollments.forEach((enr) => {
      const course = courseMap.get(enr.courseId)
      if (!course?.schedule) return
      course.schedule.forEach((slot) => {
        sessions.push({ ...slot, courseId: course.id, courseTitle: course.title, courseCode: course.code, status: enr.status, source: 'existing' })
      })
    })

    requestedCourseIds.forEach((courseId) => {
      const course = courseMap.get(courseId)
      if (!course?.schedule) return
      course.schedule.forEach((slot) => {
        sessions.push({ ...slot, courseId: course.id, courseTitle: course.title, courseCode: course.code, status: 'proposed', source: 'proposed' })
      })
    })

    const conflicts: Array<{ day: string; courseIds: string[]; range: string }> = []
    const byDay = sessions.reduce<Record<string, typeof sessions>>((acc, session) => {
      acc[session.day] = acc[session.day] ?? []
      acc[session.day].push(session)
      return acc
    }, {})

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map((part) => Number(part))
      return h * 60 + (m || 0)
    }

    const toLabel = (minutes: number) => {
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    Object.entries(byDay).forEach(([day, items]) => {
      const sorted = items
        .map((item) => ({
          ...item,
          start: toMinutes(item.startTime),
          end: toMinutes(item.endTime),
        }))
        .sort((a, b) => a.start - b.start)

      for (let i = 0; i < sorted.length - 1; i += 1) {
        const current = sorted[i]
        for (let j = i + 1; j < sorted.length; j += 1) {
          const next = sorted[j]
          if (next.start < current.end) {
            const range = `${toLabel(Math.min(current.start, next.start))}-${toLabel(Math.max(current.end, next.end))}`
            conflicts.push({ day, courseIds: [current.courseId, next.courseId], range })
          } else {
            break
          }
        }
      }
    })

    return res.json({ success: true, data: { sessions, conflicts } })
  } catch (error) {
    console.error('Failed to preview schedule', error)
    return res.status(500).json({ success: false, error: 'Failed to preview schedule' })
  }
})

studentRoutes.get('/:id/grades', async (req, res) => {
  try {
    if (!assertStudentOwnership(req, res, req.params.id)) return

    const { rows } = await runDbQuery<Record<string, unknown>>(
      `
        select
          e.*,
          c.code as "courseCode",
          c.section_id as "sectionId",
          c.schedule as "courseSchedule",
          coalesce(c.professor_name, e.professor_name) as "professorName"
        from public.enrollments e
        left join public.courses c on c.id = e.course_id
        where e.student_id = $1
        order by coalesce(e.updated_at, e.created_at, now()) desc, e.id asc
      `,
      [req.params.id],
    )

    const data = rows.map((row) => {
      const normalized = normalizeRowKeys(row) as Enrollment & {
        courseCode?: string
        sectionId?: string
        courseSchedule?: CourseScheduleEntry[]
        professorName?: string
      }

      return {
        ...normalized,
        courseCode: normalized.courseCode ?? normalized.displayId ?? normalized.courseId,
        courseSchedule: Array.isArray(normalized.courseSchedule) ? normalized.courseSchedule : [],
      }
    })

    res.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch student grades', error)
    res.status(500).json({ success: false, error: 'Failed to fetch student grades' })
  }
})

studentRoutes.get('/:id/transcript', async (req, res) => {
  try {
    if (!assertStudentOwnership(req, res, req.params.id)) return
    const transcript = await buildStudentTranscript(req.params.id)
    if (!transcript) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }
    res.json({ success: true, data: transcript })
  } catch (error) {
    console.error('Failed to fetch transcript', error)
    res.status(500).json({ success: false, error: 'Failed to fetch transcript' })
  }
})

studentRoutes.get('/:id/transcript.csv', async (req, res) => {
  try {
    if (!assertStudentOwnership(req, res, req.params.id)) return
    const transcript = await buildStudentTranscript(req.params.id)
    if (!transcript) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Disposition', `attachment; filename="transcript-${transcript.student.displayId}.csv"`)
    await streamStudentTranscriptCsv(res, transcript)
    res.end()
  } catch (error) {
    console.error('Failed to export transcript csv', error)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to export transcript csv' })
    } else {
      res.end()
    }
  }
})

studentRoutes.get('/:id/transcript.pdf', async (req, res) => {
  try {
    if (!assertStudentOwnership(req, res, req.params.id)) return
    const transcript = await buildStudentTranscript(req.params.id)
    if (!transcript) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const pdf = buildStudentTranscriptPdf(transcript)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Disposition', `attachment; filename="transcript-${transcript.student.displayId}.pdf"`)
    res.end(pdf)
  } catch (error) {
    console.error('Failed to export transcript pdf', error)
    res.status(500).json({ success: false, error: 'Failed to export transcript pdf' })
  }
})

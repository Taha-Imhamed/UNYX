import { randomUUID } from 'node:crypto'
import { coursesCollection, enrollmentsCollection, studentsCollection } from '../data/collections.js'
import { getCollection, runDbQuery } from '../db/postgres.js'
import type { Enrollment, EnrollmentStatus, Student, AcademicStructure, AcademicMajor } from '../../../shared/types/index.js'

const capacityHoldingStatuses: EnrollmentStatus[] = ['pending', 'pendingSupervisorApproval', 'pendingAdvisorApproval', 'pending_approval', 'active']
type AcademicStructureRecord = AcademicStructure & Record<string, unknown>
let autoAssignedBaseCourseColumnReady = false

function buildEnrollmentId() {
  return `ENR-${randomUUID().slice(0, 8).toUpperCase()}`
}

function normalizeIdLike(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

function deriveCurrentYear(student: Partial<Student> & Record<string, unknown>) {
  const directYear = Number(student.currentYear)
  if (Number.isFinite(directYear) && directYear > 0) return Math.floor(directYear)

  const semester = typeof student.currentSemester === 'string' ? student.currentSemester.trim() : ''
  if (!semester) return null

  const match = semester.match(/^(?:year\s*)?(\d+)$/i)
  if (!match) return null

  const parsed = Number(match[1])
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null
}

async function getAcademicStructure() {
  const collection = await getCollection<AcademicStructureRecord>('academic_structure')
  const structure = await collection.findOne({ id: 'global' })
  return (structure ?? null) as AcademicStructure | null
}

async function ensureAutoAssignedBaseCourseColumn() {
  if (autoAssignedBaseCourseColumnReady) return
  await runDbQuery(`
    alter table public.enrollments
      add column if not exists auto_assigned_base_course boolean null
  `)
  autoAssignedBaseCourseColumnReady = true
}

function matchStudentMajor(student: Student, structure: AcademicStructure | null): AcademicMajor | null {
  if (!structure?.majors?.length) return null

  const tokens = new Set(
    [
      normalizeIdLike(student.programId),
      normalizeIdLike(student.program),
      normalizeIdLike(student.major),
      normalizeIdLike(student.facultyId),
      normalizeIdLike(student.faculty),
    ].filter(Boolean),
  )

  if (tokens.size === 0) return null

  const directMatch =
    structure.majors.find((major) => {
      return tokens.has(normalizeIdLike(major.id)) || tokens.has(normalizeIdLike(major.name))
    }) ?? null
  if (directMatch) return directMatch

  const matchedDepartment =
    structure.departments?.find((department) => {
      return tokens.has(normalizeIdLike(department.id)) || tokens.has(normalizeIdLike(department.name))
    }) ?? null
  if (!matchedDepartment) return null

  const departmentMajors = structure.majors.filter(
    (major) => normalizeIdLike(major.departmentId) === normalizeIdLike(matchedDepartment.id),
  )
  return departmentMajors.length === 1 ? departmentMajors[0] : null
}

export async function assignBaseCoursesToFirstYearStudent(
  student: Student | null | undefined,
  options?: { previousBaseCourseIds?: string[]; pruneRemoved?: boolean },
) {
  await ensureAutoAssignedBaseCourseColumn()
  if (!student?.id) {
    return { assigned: 0, removed: 0, skipped: 0, matchedMajorId: null as string | null }
  }

  const currentYear = deriveCurrentYear(student as Student & Record<string, unknown>)
  if (currentYear !== 1) {
    return { assigned: 0, removed: 0, skipped: 0, matchedMajorId: null as string | null }
  }

  const structure = await getAcademicStructure()
  const matchedMajor = matchStudentMajor(student, structure)
  const baseCourseIds = Array.from(new Set((matchedMajor?.baseCourseIds ?? []).map((value) => String(value).trim()).filter(Boolean)))
  const previousBaseCourseIds = Array.from(new Set((options?.previousBaseCourseIds ?? []).map((value) => String(value).trim()).filter(Boolean)))
  const syncUniverseCourseIds = Array.from(new Set([...baseCourseIds, ...previousBaseCourseIds]))

  if (!matchedMajor || baseCourseIds.length === 0) {
    if (options?.pruneRemoved && previousBaseCourseIds.length > 0) {
      await pruneAutoAssignedBaseCourses(student, [], previousBaseCourseIds)
    }
    return { assigned: 0, removed: 0, skipped: 0, matchedMajorId: matchedMajor?.id ?? null }
  }

  const coursesCol = await coursesCollection()
  const enrollmentsCol = await enrollmentsCollection()
  const targetCourses = await coursesCol.find({ id: { $in: baseCourseIds } }).toArray()
  if (targetCourses.length === 0) {
    const removed = options?.pruneRemoved ? await pruneAutoAssignedBaseCourses(student, [], previousBaseCourseIds) : 0
    return { assigned: 0, removed, skipped: baseCourseIds.length, matchedMajorId: matchedMajor.id }
  }

  const existingEnrollments = await enrollmentsCol
    .find({
      studentId: student.id,
      status: { $nin: ['cancelled'] },
      $or: [
        { courseId: { $in: syncUniverseCourseIds.length > 0 ? syncUniverseCourseIds : targetCourses.map((course) => course.id) } },
        { autoAssignedBaseCourse: true },
      ],
    })
    .toArray()
  const enrolledCourseIds = new Set(existingEnrollments.map((entry) => entry.courseId))

  if (previousBaseCourseIds.length > 0) {
    const oldEnrollmentIds = existingEnrollments
      .filter((entry) => previousBaseCourseIds.includes(entry.courseId))
      .map((entry) => entry.id)
    if (oldEnrollmentIds.length > 0) {
      await enrollmentsCol.updateMany({ id: { $in: oldEnrollmentIds } }, { $set: { autoAssignedBaseCourse: true } })
      existingEnrollments.forEach((entry) => {
        if (previousBaseCourseIds.includes(entry.courseId)) {
          entry.autoAssignedBaseCourse = true
        }
      })
    }
  }

  let assigned = 0
  let removed = 0
  let skipped = 0

  for (const course of targetCourses) {
    if (enrolledCourseIds.has(course.id)) {
      const existingEnrollment = existingEnrollments.find((entry) => entry.courseId === course.id)
      if (existingEnrollment?.id && existingEnrollment.autoAssignedBaseCourse !== true) {
        await enrollmentsCol.updateOne({ id: existingEnrollment.id }, { $set: { autoAssignedBaseCourse: true } })
      }
      skipped += 1
      continue
    }

    const activeCount = await enrollmentsCol.countDocuments({ courseId: course.id, status: { $in: capacityHoldingStatuses } })
    const remainingSeats = Math.max(0, (course.capacity ?? 0) - activeCount)
    if (remainingSeats <= 0) {
      skipped += 1
      continue
    }

    const createdAt = new Date().toISOString()
    const paymentCleared = Number(student.balance ?? 0) <= 0
    const enrollment: Enrollment & {
      student: Pick<Student, 'id' | 'displayId' | 'firstName' | 'lastName' | 'email' | 'photo' | 'balance'>
    } = {
      id: buildEnrollmentId(),
      displayId: course.code ?? course.id,
      studentId: student.id,
      courseId: course.id,
      courseTitle: course.title,
      professorId: course.professorId,
      professorName: course.professorName,
      status: paymentCleared ? 'pendingAdvisorApproval' : 'pending_approval',
      startDate: course.startDate,
      endDate: course.endDate,
      price: Number(course.price) || 0,
      basePrice: Number(course.price) || 0,
      couponCode: undefined,
      discountPercent: 0,
      discountAmount: 0,
      createdAt,
      updatedAt: createdAt,
      grade: null,
      gradeMidterm: null,
      gradeFinal: null,
      gradeProject: null,
      gradeParticipation: null,
      gradeTotal: null,
      letterGrade: null,
      semester: course.startDate?.slice(0, 7) ?? null,
      tuitionCharged: false,
      chargedAt: null,
      paymentVerified: paymentCleared,
      paymentStatus: paymentCleared ? 'paid' : 'payment_required',
      student: { ...student, balance: student.balance ?? 0 },
      autoAssignedBaseCourse: true,
    }

    await enrollmentsCol.insertOne(enrollment)
    assigned += 1
  }

  if (options?.pruneRemoved) {
    removed = await pruneAutoAssignedBaseCourses(student, baseCourseIds, previousBaseCourseIds)
  }

  return { assigned, removed, skipped, matchedMajorId: matchedMajor.id }
}

async function pruneAutoAssignedBaseCourses(student: Student, desiredCourseIds: string[], previousBaseCourseIds: string[]) {
  await ensureAutoAssignedBaseCourseColumn()
  const staleCourseIds = previousBaseCourseIds.filter((courseId) => !desiredCourseIds.includes(courseId))
  if (staleCourseIds.length === 0) return 0

  const enrollmentsCol = await enrollmentsCollection()
  const staleEnrollments = await enrollmentsCol.find({
    studentId: student.id,
    courseId: { $in: staleCourseIds },
    autoAssignedBaseCourse: true,
    status: { $in: ['active', 'pending', 'pendingSupervisorApproval', 'pendingAdvisorApproval', 'pending_approval', 'waitlisted'] },
  }).toArray()

  let removed = 0

  for (const enrollment of staleEnrollments) {
    const hasGrades = enrollment.grade != null || enrollment.gradeMidterm != null || enrollment.gradeFinal != null || enrollment.gradeProject != null || enrollment.gradeParticipation != null || enrollment.gradeTotal != null
    if (hasGrades) continue

    await enrollmentsCol.deleteOne({ id: enrollment.id })
    removed += 1
  }

  return removed
}

export async function syncBaseCoursesForFirstYearStudentsByMajor(majorId: string, previousBaseCourseIds?: string[]) {
  await ensureAutoAssignedBaseCourseColumn()
  const studentsCol = await studentsCollection()
  const students = await studentsCol.find({}).toArray()
  const results: Array<{ assigned: number; removed: number; skipped: number; matchedMajorId: string | null }> = []

  for (const student of students) {
    const currentYear = deriveCurrentYear(student as Student & Record<string, unknown>)
    if (currentYear !== 1) continue

    const structure = await getAcademicStructure()
    const matchedMajor = matchStudentMajor(student, structure)
    if (!matchedMajor || matchedMajor.id !== majorId) continue

    const result = await assignBaseCoursesToFirstYearStudent(student, {
      previousBaseCourseIds,
      pruneRemoved: true,
    })
    results.push(result)
  }

  return {
    students: results.length,
    assigned: results.reduce((sum, item) => sum + item.assigned, 0),
    removed: results.reduce((sum, item) => sum + item.removed, 0),
  }
}

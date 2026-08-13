import { Router } from 'express'
import type { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { PoolClient } from 'pg'
import { sendMail } from '../lib/mailer.js'
import { roundToCents, subtractCurrency, multiplyCurrency, sumCents } from '../lib/currency.js'
import {
  coursesCollection,
  enrollmentsCollection,
  studentsCollection,
  professorsCollection,
  paymentsCollection,
  couponsCollection,
} from '../data/collections.js'
import type {
  Course,
  Enrollment,
  EnrollmentPaymentStatus,
  EnrollmentStatus,
  Student,
  PaymentTransaction,
  CourseScheduleEntry,
  CourseType,
  Permission,
  Semester,
} from '../../../shared/types/index.js'
import { requireAdmin } from '../middleware/auth.js'
import { getCollection, runDbQuery, runInTransaction } from '../db/postgres.js'
import { syncBaseCoursesForFirstYearStudentsByMajor } from '../lib/base-course-assignment.js'
import { listAllSemesters, invalidateSemesterCache, deriveStudentYearLevel } from '../lib/academic-terms.js'
import {
  appendFinancialLedgerEntry,
  checkBalance,
  enrollmentActorPatch,
  ensureAcademicComplianceStorage,
  recordGradeAudit,
  writeAuditLog,
} from '../lib/academic-compliance.js'

export const enrollmentRoutes: ReturnType<typeof Router> = Router()

const createEnrollmentSchema = z.object({
  studentId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  professorId: z.string().trim().optional(),
  status: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  price: z.coerce.number().finite().nonnegative().optional(),
  couponCode: z.string().trim().optional(),
})

function buildCourseId() {
  return `COURSE-${randomUUID().slice(0, 8).toUpperCase()}`
}

function buildCourseCode(title: string) {
  const base = title
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12)
  return `${base || 'CLASS'}-${randomUUID().slice(0, 4).toUpperCase()}`
}

function addCourseDuration(startDate: Date, days: number) {
  const next = new Date(startDate)
  next.setDate(next.getDate() + days)
  return next
}

function buildEnrollmentId() {
  return `ENR-${randomUUID().slice(0, 8).toUpperCase()}`
}

function buildTransactionId() {
  return `TXN-${randomUUID().slice(0, 8).toUpperCase()}`
}

const allowedStatuses: Set<EnrollmentStatus> = new Set([
  'pending',
  'pendingSupervisorApproval',
  'pendingAdvisorApproval',
  'pending_approval',
  'active',
  'waitlisted',
  'completed',
  'cancelled',
  'rejected',
  'dropped',
])

const scheduleRelevantStatuses: EnrollmentStatus[] = [
  'pending',
  'pendingSupervisorApproval',
  'pendingAdvisorApproval',
  'pending_approval',
  'active',
  'waitlisted',
]

const capacityHoldingStatuses: EnrollmentStatus[] = [
  'pending',
  'pendingSupervisorApproval',
  'pendingAdvisorApproval',
  'pending_approval',
  'active',
]

function hasPermission(auth: Request['auth'], ...permissions: Permission[]) {
  if (!auth) return false
  const effective = auth.effectivePermissions ?? []
  return permissions.some((perm) => effective.includes(perm))
}

type EnrollmentRejectionReason =
  | 'insufficient_travel_buffer'
  | 'financial_blocking'
  | 'resource_overlap'
  | 'schedule_overlap'

async function recordEnrollmentRejection(input: {
  reasonCode: EnrollmentRejectionReason
  reason: string
  studentId?: string | null
  courseId?: string | null
  enrollmentId?: string | null
  auth?: Request['auth']
  details?: Record<string, unknown>
}) {
  return writeAuditLog({
    action: 'enrollment_rejected',
    entityType: input.enrollmentId ? 'enrollment' : 'enrollment_attempt',
    entityId: input.enrollmentId ?? input.courseId ?? null,
    details: {
      reasonCode: input.reasonCode,
      reason: input.reason,
      studentId: input.studentId ?? null,
      courseId: input.courseId ?? null,
      enrollmentId: input.enrollmentId ?? null,
      ...(input.details ?? {}),
    },
    auth: input.auth,
  })
}

async function sendEnrollmentRejection(
  res: Response,
  status: number,
  input: Parameters<typeof recordEnrollmentRejection>[0],
) {
  await recordEnrollmentRejection(input)
  return res.status(status).json({ success: false, error: input.reason })
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map((part) => Number(part))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA
}

export function isTimeOverlapping(left: CourseScheduleEntry, right: CourseScheduleEntry, bufferMinutes: number) {
  if (left.day !== right.day) return null
  const leftStart = timeToMinutes(left.startTime)
  const leftEnd = timeToMinutes(left.endTime)
  const rightStart = timeToMinutes(right.startTime)
  const rightEnd = timeToMinutes(right.endTime)
  if (leftStart === null || leftEnd === null || rightStart === null || rightEnd === null) return null

  if (overlaps(leftStart, leftEnd, rightStart, rightEnd)) {
    return 'overlap'
  }

  if (rightStart >= leftEnd) {
    const gap = rightStart - leftEnd
    return gap < bufferMinutes ? 'travel' : null
  }

  if (leftStart >= rightEnd) {
    const gap = leftStart - rightEnd
    return gap < bufferMinutes ? 'travel' : null
  }

  return null
}

function schedulesOverlap(left?: CourseScheduleEntry[], right?: CourseScheduleEntry[]) {
  if (!left?.length || !right?.length) return false
  for (const leftEntry of left) {
    for (const rightEntry of right) {
      if (isTimeOverlapping(leftEntry, rightEntry, 0)) {
        return true
      }
    }
  }
  return false
}

function getCampusForDepartment(department?: string | null) {
  const normalized = (department ?? '').trim().toLowerCase()
  if (!normalized) return 'Main Campus'
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean)
  const tokenSet = new Set(tokens)
  if (
    tokenSet.has('architecture') ||
    tokenSet.has('engineering') ||
    tokenSet.has('cs') ||
    tokenSet.has('computer') ||
    normalized.includes('computer science')
  ) {
    return 'East Campus'
  }
  return 'Main Campus'
}

function getCourseCampus(course: Course) {
  return getCampusForDepartment(course.department)
}

async function hasStudentScheduleConflict(studentId: string, course: Course) {
  if (!course.schedule?.length) return null
  const enrollmentsCol = await enrollmentsCollection()
  const coursesCol = await coursesCollection()
  const targetSemesterId = course.semesterId ?? null
  const targetSemester = course.startDate?.slice(0, 7) ?? null

  const existingEnrollments = await enrollmentsCol.find({
    studentId,
    status: { $in: scheduleRelevantStatuses },
  }).toArray()

  const courseIds = existingEnrollments
    .map((enrollment) => enrollment.courseId)
    .filter((courseId) => courseId && courseId !== course.id)

  if (courseIds.length === 0) return null

  const existingCourses = await coursesCol.find({ id: { $in: courseIds } }).toArray()
  const courseById = new Map(existingCourses.map((existingCourse) => [existingCourse.id, existingCourse]))

  const targetCampus = getCourseCampus(course)

  for (const enrollment of existingEnrollments) {
    const existingCourse = courseById.get(enrollment.courseId)
    if (!existingCourse) continue
    const enrollmentSemesterId = enrollment.semesterId ?? existingCourse.semesterId ?? null
    if (targetSemesterId && enrollmentSemesterId) {
      if (enrollmentSemesterId !== targetSemesterId) continue
    } else {
      const enrollmentSemester = enrollment.semester ?? existingCourse.startDate?.slice(0, 7) ?? null
      if (targetSemester && enrollmentSemester && enrollmentSemester !== targetSemester) continue
    }
    const existingCampus = getCourseCampus(existingCourse)
    const bufferMinutes = targetCampus === existingCampus ? 10 : 20

    for (const leftEntry of course.schedule ?? []) {
      for (const rightEntry of existingCourse.schedule ?? []) {
        const reason = isTimeOverlapping(leftEntry, rightEntry, bufferMinutes)
        if (reason) {
          return {
            courseTitle: existingCourse.title,
            campus: existingCampus,
            reason,
          }
        }
      }
    }
  }

  return null
}

async function hasProfessorScheduleConflict(professorId: string, course: Course) {
  if (!course.schedule?.length) return false
  const coursesCol = await coursesCollection()
  const otherCourses = await coursesCol.find({ professorId, id: { $ne: course.id } }).toArray()
  return otherCourses.some((otherCourse) => schedulesOverlap(course.schedule, otherCourse.schedule))
}

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505'
}

export function normalizeEligibilityList(values: unknown): string[] | undefined {
  if (!Array.isArray(values)) return undefined
  const normalized = values
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter((value) => value.length > 0)
  return normalized.length > 0 ? normalized : undefined
}

function normalizeIdList(values: unknown): string[] | undefined {
  if (!Array.isArray(values)) return undefined
  const normalized = values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0)
  return normalized.length > 0 ? Array.from(new Set(normalized)) : undefined
}

function normalizeCreditHours(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : undefined
}

function numericGrade(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? Number(num.toFixed(2)) : null
}

function validateGradeComponent(label: string, score: number | null) {
  if (score === null) return null
  if (score < 0 || score > 100) {
    return `${label} must be between 0 and 100`
  }
  return null
}

function buildGradeSnapshot(enrollment: Partial<Enrollment>) {
  return {
    gradeMidterm: enrollment.gradeMidterm ?? null,
    gradeFinal: enrollment.gradeFinal ?? null,
    gradeProject: enrollment.gradeProject ?? null,
    gradeParticipation: enrollment.gradeParticipation ?? null,
    gradeTotal: enrollment.gradeTotal ?? null,
    letterGrade: enrollment.letterGrade ?? null,
    grade: enrollment.grade ?? null,
    isFinalized: enrollment.isFinalized ?? false,
  }
}

let enrollmentIndexesReady = false
async function ensureEnrollmentIndexes() {
  if (enrollmentIndexesReady) return
  try {
    await ensureAcademicComplianceStorage()
    const enrollmentsCol = await enrollmentsCollection()
    const coursesCol = await coursesCollection()
    await Promise.all([
      enrollmentsCol.createIndex({ courseId: 1, status: 1 }),
      enrollmentsCol.createIndex({ studentId: 1, status: 1 }),
      coursesCol.createIndex({ startDate: -1 }),
      coursesCol.createIndex({ enrollmentOpen: 1, enrollmentOpenAt: 1, enrollmentCloseAt: 1 }),
    ])
    enrollmentIndexesReady = true
  } catch (error) {
    console.error('Failed to ensure enrollment indexes', error)
  }
}

function computeLetter(score: number | null | undefined) {
  if (score === null || score === undefined || Number.isNaN(score)) return null
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 70) return 'B'
  if (score >= 50) return 'C'
  return 'F'
}

function getCourseSemester(course: Pick<Course, 'startDate'>) {
  return course.startDate?.slice(0, 7) ?? null
}

async function findMissingPrerequisites(studentId: string, course: Course) {
  const prerequisiteCourseIds = normalizeIdList(course.prerequisiteCourseIds) ?? []
  if (prerequisiteCourseIds.length === 0) {
    return [] as string[]
  }

  const enrollmentsCol = await enrollmentsCollection()
  const coursesCol = await coursesCollection()
  const completedEnrollments = await enrollmentsCol.find({
    studentId,
    courseId: { $in: prerequisiteCourseIds },
    status: { $in: ['active', 'completed'] },
    isFinalized: true,
  }).toArray()

  const completedCourseIds = new Set(
    completedEnrollments
      .filter((entry) => {
        const total = Number(entry.gradeTotal ?? NaN)
        return entry.letterGrade !== 'F' && (!Number.isFinite(total) || total >= 50)
      })
      .map((entry) => entry.courseId),
  )

  const missingIds = prerequisiteCourseIds.filter((courseId) => !completedCourseIds.has(courseId))
  if (missingIds.length === 0) return [] as string[]

  const prerequisiteCourses = await coursesCol.find({ id: { $in: missingIds } }).toArray()
  const titleById = new Map(prerequisiteCourses.map((item) => [item.id, item.title || item.code || item.id]))
  return missingIds.map((courseId) => titleById.get(courseId) ?? courseId)
}

async function readLockedCourse(client: PoolClient, courseId: string) {
  const { rows } = await client.query<{
    id: string
    displayId: string | null
    title: string
    code: string | null
    professorId: string | null
    professorName: string | null
    sectionId: string | null
    capacity: number | string | null
    startDate: string
    endDate: string
    price: number | string | null
    department: string | null
    branch: string | null
    location: string | null
    schedule: CourseScheduleEntry[] | null
    eligiblePrograms: string[] | null
    eligibleFaculties: string[] | null
    eligibleSemesters: string[] | null
    semesterId: string | null
    prerequisiteCourseIds: string[] | null
    creditHours: number | string | null
    courseType: CourseType | null
    enrollmentOpen: boolean | null
    enrollmentOpensAt: string | null
    enrollmentClosesAt: string | null
    enrollmentOpenAt: string | null
    enrollmentCloseAt: string | null
    enrollmentStatusNote: string | null
  }>(
    `
      select
        id,
        display_id as "displayId",
        title,
        code,
        professor_id as "professorId",
        professor_name as "professorName",
        section_id as "sectionId",
        capacity,
        start_date as "startDate",
        end_date as "endDate",
        price,
        department,
        branch,
        location,
        schedule,
        eligible_programs as "eligiblePrograms",
        eligible_faculties as "eligibleFaculties",
        eligible_semesters as "eligibleSemesters",
        semester_id as "semesterId",
        prerequisite_course_ids as "prerequisiteCourseIds",
        credit_hours as "creditHours",
        course_type as "courseType",
        enrollment_open as "enrollmentOpen",
        enrollment_opens_at as "enrollmentOpensAt",
        enrollment_closes_at as "enrollmentClosesAt",
        enrollment_open_at as "enrollmentOpenAt",
        enrollment_close_at as "enrollmentCloseAt",
        enrollment_status_note as "enrollmentStatusNote"
      from public.courses
      where id = $1
      for update
    `,
    [courseId],
  )

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    id: row.id,
    displayId: row.displayId ?? row.code ?? row.id,
    title: row.title,
    code: row.code ?? row.displayId ?? row.id,
    professorId: row.professorId ?? '',
    professorName: row.professorName ?? '',
    sectionId: row.sectionId ?? undefined,
    capacity: Number(row.capacity ?? 0) || 0,
    startDate: row.startDate,
    endDate: row.endDate,
    price: Number(row.price ?? 0) || 0,
    department: row.department ?? undefined,
    branch: row.branch ?? undefined,
    location: row.location ?? undefined,
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    eligiblePrograms: Array.isArray(row.eligiblePrograms) ? row.eligiblePrograms : undefined,
    eligibleFaculties: Array.isArray(row.eligibleFaculties) ? row.eligibleFaculties : undefined,
    eligibleSemesters: Array.isArray(row.eligibleSemesters) ? row.eligibleSemesters : undefined,
    prerequisiteCourseIds: Array.isArray(row.prerequisiteCourseIds) ? row.prerequisiteCourseIds : undefined,
    creditHours: Number(row.creditHours ?? 0) || undefined,
    courseType: row.courseType ?? undefined,
    enrollmentOpen: row.enrollmentOpen ?? undefined,
    enrollmentOpensAt: row.enrollmentOpensAt ?? null,
    enrollmentClosesAt: row.enrollmentClosesAt ?? null,
    enrollmentOpenAt: row.enrollmentOpenAt ?? null,
    enrollmentCloseAt: row.enrollmentCloseAt ?? null,
    enrollmentStatusNote: row.enrollmentStatusNote ?? null,
  } as Course
}

async function readLockedStudent(client: PoolClient, studentId: string) {
  const { rows } = await client.query<Student>(
    `
      select
        id,
        display_id as "displayId",
        first_name as "firstName",
        middle_name as "middleName",
        last_name as "lastName",
        email,
        phone,
        photo,
        enrollment_date as "enrollmentDate",
        program,
        major,
        program_id as "programId",
        faculty,
        faculty_id as "facultyId",
        gender,
        nationality,
        national_id as "nationalId",
        passport_number as "passportNumber",
        blood_type as "bloodType",
        city,
        postal_code as "postalCode",
        emergency_contact_name as "emergencyContactName",
        emergency_contact_phone as "emergencyContactPhone",
        mother_name as "motherName",
        father_name as "fatherName",
        current_semester as "currentSemester",
        status,
        address,
        date_of_birth as "dateOfBirth",
        balance,
        supervisor_id as "supervisorId",
        supervisor_name as "supervisorName"
      from public.students
      where id = $1
      for update
    `,
    [studentId],
  )
  return rows[0] ?? null
}

async function countCourseHeldSeats(client: PoolClient, courseId: string) {
  const { rows } = await client.query<{ count: string }>(
    `
      select count(*)::text as count
      from public.enrollments
      where course_id = $1
        and status = any($2::text[])
    `,
    [courseId, capacityHoldingStatuses],
  )
  return Number(rows[0]?.count ?? 0)
}

async function insertEnrollmentRow(client: PoolClient, enrollment: Enrollment) {
  await client.query(
    `
      insert into public.enrollments (
        id,
        display_id,
        student_id,
        course_id,
        course_title,
        professor_id,
        professor_name,
        campus,
        status,
        start_date,
        end_date,
        price,
        base_price,
        coupon_code,
        discount_percent,
        discount_amount,
        created_at,
        updated_at,
        grade,
        grade_midterm,
        grade_final,
        grade_project,
        grade_participation,
        grade_total,
        letter_grade,
        is_finalized,
        grade_updated_at,
        grades_finalized_at,
        grades_finalized_by,
        semester,
        semester_id,
        tuition_charged,
        charged_at,
        payment_verified,
        payment_status,
        approved_by_user_id,
        approved_by_name,
        approved_by_role,
        approved_at,
        updated_by_user_id,
        updated_by_name,
        updated_by_role,
        rejected_by_user_id,
        rejected_by_name,
        rejected_by_role,
        rejected_at,
        latest_advisor_message,
        latest_advisor_message_at,
        course_schedule,
        course_code,
        course_branch,
        student,
        auto_assigned_base_course
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49::jsonb, $50,
        $51, $52::jsonb, $53
      )
    `,
    [
      enrollment.id,
      enrollment.displayId,
      enrollment.studentId,
      enrollment.courseId,
      enrollment.courseTitle,
      enrollment.professorId,
      enrollment.professorName,
      enrollment.campus ?? null,
      enrollment.status,
      enrollment.startDate,
      enrollment.endDate,
      enrollment.price,
      enrollment.basePrice ?? null,
      enrollment.couponCode ?? null,
      enrollment.discountPercent ?? null,
      enrollment.discountAmount ?? null,
      enrollment.createdAt,
      enrollment.updatedAt,
      enrollment.grade ?? null,
      enrollment.gradeMidterm ?? null,
      enrollment.gradeFinal ?? null,
      enrollment.gradeProject ?? null,
      enrollment.gradeParticipation ?? null,
      enrollment.gradeTotal ?? null,
      enrollment.letterGrade ?? null,
      enrollment.isFinalized ?? false,
      enrollment.gradeUpdatedAt ?? null,
      enrollment.gradesFinalizedAt ?? null,
      enrollment.gradesFinalizedBy ?? null,
      enrollment.semester ?? null,
      enrollment.semesterId ?? null,
      enrollment.tuitionCharged ?? false,
      enrollment.chargedAt ?? null,
      enrollment.paymentVerified ?? false,
      enrollment.paymentStatus ?? null,
      enrollment.approvedByUserId ?? null,
      enrollment.approvedByName ?? null,
      enrollment.approvedByRole ?? null,
      enrollment.approvedAt ?? null,
      enrollment.updatedByUserId ?? null,
      enrollment.updatedByName ?? null,
      enrollment.updatedByRole ?? null,
      enrollment.rejectedByUserId ?? null,
      enrollment.rejectedByName ?? null,
      enrollment.rejectedByRole ?? null,
      enrollment.rejectedAt ?? null,
      enrollment.latestAdvisorMessage ?? null,
      enrollment.latestAdvisorMessageAt ?? null,
      JSON.stringify(enrollment.courseSchedule ?? []),
      enrollment.courseCode ?? null,
      enrollment.courseBranch ?? null,
      JSON.stringify(enrollment.student ?? null),
      enrollment.autoAssignedBaseCourse ?? null,
    ],
  )
}

async function createEnrollmentWithCapacityLock(options: {
  student: Student
  course: Course
  status: EnrollmentStatus
  price: number
  basePrice: number
  couponCode?: string
  discountPercent?: number
  discountAmount?: number
  auth?: Request['auth']
  canOverrideCapacity?: boolean
}) {
  return runInTransaction(async (client) => {
    const lockedStudent = await readLockedStudent(client, options.student.id)
    if (!lockedStudent) {
      throw new Error('Student not found')
    }

    const lockedCourse = await readLockedCourse(client, options.course.id)
    if (!lockedCourse) {
      throw new Error('Course not found')
    }
    const effectiveCourse: Course = {
      ...lockedCourse,
      professorId: options.course.professorId ?? lockedCourse.professorId,
      professorName: options.course.professorName ?? lockedCourse.professorName,
      startDate: options.course.startDate ?? lockedCourse.startDate,
      endDate: options.course.endDate ?? lockedCourse.endDate,
    }
    const semester = getCourseSemester(effectiveCourse)
    const semesterId = effectiveCourse.semesterId ?? null

    const { rows: duplicateRows } = await client.query<{ id: string }>(
      `
        select id
        from public.enrollments
        where student_id = $1
          and course_id = $2
          and (
            ($3::text is not null and semester_id = $3)
            or ($3::text is null and semester = $4)
          )
          and status not in ('cancelled', 'rejected', 'dropped')
        limit 1
      `,
      [lockedStudent.id, effectiveCourse.id, semesterId, semester],
    )
    if (duplicateRows.length > 0) {
      const error = new Error('Enrollment already exists for this student and course') as Error & { code?: string }
      error.code = '23505'
      throw error
    }

    const missingPrerequisites = await findMissingPrerequisites(lockedStudent.id, effectiveCourse)
    if (missingPrerequisites.length > 0) {
      throw new Error(`Missing prerequisite courses: ${missingPrerequisites.join(', ')}`)
    }

    const studentConflict = await hasStudentScheduleConflict(lockedStudent.id, effectiveCourse)
    if (studentConflict) {
      throw new Error(
        studentConflict.reason === 'travel'
          ? 'Insufficient travel time between classes.'
          : `Schedule Conflict: This class overlaps with ${studentConflict.courseTitle} located at ${studentConflict.campus}.`,
      )
    }

    const activeCount = await countCourseHeldSeats(client, lockedCourse.id)
    const remainingSeats = Math.max(0, (lockedCourse.capacity ?? 0) - activeCount)
    const requestedStatus = options.status
    const statusValue = remainingSeats <= 0 && !options.canOverrideCapacity && requestedStatus !== 'waitlisted'
      ? 'waitlisted'
      : requestedStatus

    const createdAt = new Date().toISOString()
    const paymentStatus = getEnrollmentPaymentStatus(lockedStudent)
    const actorPatch = enrollmentActorPatch(options.auth)
    const isApprovedStatus = statusValue === 'active' || statusValue === 'completed'
    const enrollment: Enrollment & { student: Student } = {
      id: buildEnrollmentId(),
      displayId: effectiveCourse.code ?? effectiveCourse.id,
      studentId: lockedStudent.id,
      courseId: effectiveCourse.id,
      courseTitle: effectiveCourse.title,
      professorId: effectiveCourse.professorId,
      professorName: effectiveCourse.professorName,
      campus: getCourseCampus(effectiveCourse),
      status: statusValue,
      startDate: effectiveCourse.startDate,
      endDate: effectiveCourse.endDate,
      price: options.price,
      basePrice: options.basePrice,
      couponCode: options.couponCode,
      discountPercent: options.discountPercent,
      discountAmount: options.discountAmount,
      createdAt,
      updatedAt: createdAt,
      grade: null,
      gradeMidterm: null,
      gradeFinal: null,
      gradeProject: null,
      gradeParticipation: null,
      gradeTotal: null,
      letterGrade: null,
      isFinalized: false,
      gradeUpdatedAt: null,
      gradesFinalizedAt: null,
      gradesFinalizedBy: null,
      semester,
      semesterId: effectiveCourse.semesterId ?? null,
      tuitionCharged: false,
      chargedAt: null,
      paymentVerified: statusValue === 'waitlisted' ? false : paymentStatus === 'paid',
      paymentStatus,
      approvedByUserId: isApprovedStatus ? actorPatch.updatedByUserId : null,
      approvedByName: isApprovedStatus ? actorPatch.updatedByName : null,
      approvedByRole: isApprovedStatus ? actorPatch.updatedByRole : null,
      approvedAt: isApprovedStatus ? createdAt : null,
      updatedByUserId: actorPatch.updatedByUserId,
      updatedByName: actorPatch.updatedByName,
      updatedByRole: actorPatch.updatedByRole,
      rejectedByUserId: null,
      rejectedByName: null,
      rejectedByRole: null,
      rejectedAt: null,
      latestAdvisorMessage: null,
      latestAdvisorMessageAt: null,
      courseSchedule: effectiveCourse.schedule ?? [],
      courseCode: effectiveCourse.code ?? effectiveCourse.displayId ?? effectiveCourse.id,
      courseBranch: effectiveCourse.branch ?? effectiveCourse.location ?? null,
      student: {
        id: lockedStudent.id,
        displayId: lockedStudent.displayId,
        firstName: lockedStudent.firstName,
        lastName: lockedStudent.lastName,
        email: lockedStudent.email,
        phone: lockedStudent.phone,
        photo: lockedStudent.photo,
        enrollmentDate: lockedStudent.enrollmentDate,
        program: lockedStudent.program,
        currentSemester: lockedStudent.currentSemester,
        status: lockedStudent.status,
        address: lockedStudent.address,
        dateOfBirth: lockedStudent.dateOfBirth,
        balance: lockedStudent.balance ?? 0,
      },
    }

    await insertEnrollmentRow(client, enrollment)

    return {
      enrollment,
      remainingSeats,
      waitlisted: statusValue === 'waitlisted',
    }
  })
}

function isProfessorOwner(enrollment: Enrollment, auth: Request['auth']) {
  return auth?.role === 'professor' && auth.professorId && enrollment.professorId === auth.professorId
}

async function isStudentSupervisor(enrollment: Enrollment, auth: Request['auth']) {
  if (!auth?.professorId) return false
  const studentsCol = await studentsCollection()
  const student = await studentsCol.findOne({ id: enrollment.studentId })
  return Boolean(student?.supervisorId && student.supervisorId === auth.professorId)
}

const validDays = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])

interface AcademicMajor {
  id: string
  name: string
  departmentId: string
  years: number
  subjects: string[]
  courseIds: string[]
  baseCourseIds?: string[]
}

interface AcademicDepartment {
  id: string
  name: string
}

interface AcademicCampus {
  id: string
  name: string
  classes?: AcademicClass[]
}

interface AcademicClass {
  id: string
  name: string
}

interface AcademicStructure extends Record<string, unknown> {
  id: 'global'
  enrollmentOpen: boolean
  enrollmentMessage: string | null
  departments: AcademicDepartment[]
  campuses: AcademicCampus[]
  majors: AcademicMajor[]
  updatedAt: string
}

const defaultAcademicStructure = (): AcademicStructure => ({
  id: 'global',
  enrollmentOpen: true,
  enrollmentMessage: null,
  departments: [],
  campuses: [],
  majors: [],
  updatedAt: new Date().toISOString(),
})

function normalizeIdLike(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

function normalizeArray(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0)
}

function normalizeRecordLike(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return null
    }
  }
  return null
}

function sanitizeAcademicStructure(payload: unknown, existing?: AcademicStructure): AcademicStructure {
  const source = (payload ?? {}) as Record<string, unknown>
  const now = new Date().toISOString()
  const departmentsRaw = Array.isArray(source.departments) ? source.departments : existing?.departments ?? []
  const campusesRaw = Array.isArray(source.campuses) ? source.campuses : existing?.campuses ?? []
  const majorsRaw = Array.isArray(source.majors) ? source.majors : existing?.majors ?? []

  const departments = departmentsRaw
    .map((item, index) => {
      const row = normalizeRecordLike(item)
      if (!row) return null
      const name = typeof row.name === 'string' ? row.name.trim() : ''
      if (!name) return null
      const id = normalizeIdLike(row.id) || `dept-${normalizeIdLike(name).replace(/\s+/g, '-') || index + 1}`
      return { id, name }
    })
    .filter(Boolean) as AcademicDepartment[]

  const departmentIds = new Set(departments.map((entry) => entry.id))
  const campuses = campusesRaw
    .map((item, index) => {
      const row = normalizeRecordLike(item)
      if (!row) return null
      const name = typeof row.name === 'string' ? row.name.trim() : ''
      if (!name) return null
      const id = normalizeIdLike(row.id) || `campus-${normalizeIdLike(name).replace(/\s+/g, '-') || index + 1}`

      // normalize optional classes nested under a campus
      const classesRaw = Array.isArray(row.classes) ? row.classes : []
      const classes = classesRaw
        .map((clsItem, clsIndex) => {
          const cls = normalizeRecordLike(clsItem)
          if (!cls) return null
          const clsName = typeof cls.name === 'string' ? cls.name.trim() : ''
          if (!clsName) return null
          const clsId = normalizeIdLike(cls.id) || `class-${normalizeIdLike(clsName).replace(/\s+/g, '-') || clsIndex + 1}`
          return { id: clsId, name: clsName }
        })
        .filter(Boolean) as AcademicClass[]

      return { id, name, classes }
    })
    .filter(Boolean) as (AcademicCampus & { classes?: AcademicClass[] })[]

  const majors = majorsRaw
    .map((item, index) => {
      const row = normalizeRecordLike(item)
      if (!row) return null
      const name = typeof row.name === 'string' ? row.name.trim() : ''
      if (!name) return null
      const id = normalizeIdLike(row.id) || `major-${normalizeIdLike(name).replace(/\s+/g, '-') || index + 1}`
      const departmentId = normalizeIdLike(row.departmentId)
      const yearsRaw = Number(row.years)
      const years = Number.isFinite(yearsRaw) && yearsRaw > 0 ? Math.round(yearsRaw) : 4
      const subjects = normalizeArray(row.subjects)
      const courseIds = normalizeArray(row.courseIds)
      const baseCourseIds = normalizeArray(row.baseCourseIds)
      return {
        id,
        name,
        departmentId: departmentIds.has(departmentId) ? departmentId : departments[0]?.id ?? '',
        years,
        subjects,
        courseIds,
        baseCourseIds,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .filter((entry) => Boolean(entry.departmentId))

  const enrollmentOpen = source.enrollmentOpen !== undefined
    ? Boolean(source.enrollmentOpen)
    : existing?.enrollmentOpen ?? true

  const enrollmentMessage = typeof source.enrollmentMessage === 'string'
    ? source.enrollmentMessage.trim() || null
    : existing?.enrollmentMessage ?? null

  return {
    id: 'global',
    enrollmentOpen,
    enrollmentMessage,
    departments,
    campuses,
    majors,
    updatedAt: now,
  }
}

async function academicStructureCollection() {
  return getCollection<AcademicStructure>('academic_structure')
}

async function getAcademicStructure() {
  const collection = await academicStructureCollection()
  const existing = await collection.findOne({ id: 'global' })
  if (existing) return existing
  const fallback = defaultAcademicStructure()
  await collection.insertOne(fallback)
  return fallback
}

function matchStudentMajor(student: Student | null | undefined, structure: AcademicStructure) {
  const tokens = new Set([
    normalizeIdLike(student?.programId),
    normalizeIdLike(student?.program),
    normalizeIdLike(student?.major),
  ].filter(Boolean))

  if (structure.majors.length === 0) return null

  const directMatch =
    structure.majors.find((major) => tokens.has(normalizeIdLike(major.id)) || tokens.has(normalizeIdLike(major.name))) ?? null
  if (directMatch) return directMatch

  const matchedDepartment = structure.departments.find(
    (department) =>
      tokens.has(normalizeIdLike(department.id)) ||
      tokens.has(normalizeIdLike(department.name)) ||
      tokens.has(normalizeIdLike(student?.facultyId)) ||
      tokens.has(normalizeIdLike(student?.faculty)),
  )
  if (!matchedDepartment) return null

  const departmentMajors = structure.majors.filter(
    (major) => normalizeIdLike(major.departmentId) === normalizeIdLike(matchedDepartment.id),
  )
  return departmentMajors.length === 1 ? departmentMajors[0] : null
}

function doesCourseMatchMajor(course: Course, student: Student | null | undefined, structure: AcademicStructure) {
  if (normalizeCourseType(course.courseType) === 'common') return true
  const matchedMajor = matchStudentMajor(student, structure)

  const eligiblePrograms = normalizeEligibilityList(course.eligiblePrograms) ?? []
  const eligibleFaculties = normalizeEligibilityList(course.eligibleFaculties) ?? []
  const eligibleSemesters = normalizeEligibilityList(course.eligibleSemesters) ?? []

  // No eligibility constraints means the course is open to all students
  if (eligiblePrograms.length === 0 && eligibleFaculties.length === 0 && eligibleSemesters.length === 0) {
    return true
  }

  const matchedDepartment = matchedMajor
    ? structure.departments.find((department) => normalizeIdLike(department.id) === normalizeIdLike(matchedMajor.departmentId))
    : null
  const majorTokens = new Set([
    normalizeIdLike(matchedMajor?.id),
    normalizeIdLike(matchedMajor?.name),
    normalizeIdLike(student?.programId),
    normalizeIdLike(student?.program),
    normalizeIdLike(student?.major),
  ].filter(Boolean))
  const facultyTokens = new Set([
    normalizeIdLike(student?.facultyId),
    normalizeIdLike(student?.faculty),
    normalizeIdLike(matchedMajor?.departmentId),
    normalizeIdLike(matchedDepartment?.name),
  ].filter(Boolean))
  const currentYear = student ? deriveStudentYearLevel(student) ?? null : null
  const semesterTokens = new Set([
    normalizeIdLike(student?.currentSemester),
    currentYear ? normalizeIdLike(String(currentYear)) : '',
    currentYear ? normalizeIdLike(`year ${currentYear}`) : '',
  ].filter(Boolean))

  const hasProgramMatch = eligiblePrograms.length > 0
    ? eligiblePrograms.some((value) => majorTokens.has(normalizeIdLike(value)))
    : true
  const hasFacultyMatch = eligibleFaculties.length > 0
    ? eligibleFaculties.some((value) => facultyTokens.has(normalizeIdLike(value)))
    : true
  const hasSemesterMatch = eligibleSemesters.length > 0
    ? eligibleSemesters.some((value) => semesterTokens.has(normalizeIdLike(value)))
    : true
  const hasCourseLink = matchedMajor?.courseIds.some((value) => normalizeIdLike(value) === normalizeIdLike(course.id)) ?? false
  const hasDepartmentMatch = matchedMajor
    ? normalizeIdLike(course.department) === normalizeIdLike(matchedMajor.departmentId)
    : false
  const hasStructuralMajorMatch = eligiblePrograms.length === 0 && eligibleFaculties.length === 0
    ? hasCourseLink || hasDepartmentMatch || matchedMajor === null
    : true

  if (hasCourseLink) {
    return true
  }

  return hasProgramMatch && hasFacultyMatch && hasSemesterMatch && hasStructuralMajorMatch
}

function isCourseConfiguredForStudents(course: Course, structure: AcademicStructure, student?: Student | null) {
  const eligiblePrograms = normalizeEligibilityList(course.eligiblePrograms) ?? []
  const eligibleFaculties = normalizeEligibilityList(course.eligibleFaculties) ?? []
  const eligibleSemesters = normalizeEligibilityList(course.eligibleSemesters) ?? []

  if (eligiblePrograms.length > 0 || eligibleFaculties.length > 0 || eligibleSemesters.length > 0) {
    return true
  }

  if (normalizeCourseType(course.courseType) === 'common') {
    return true
  }

  const matchedMajor = matchStudentMajor(student, structure)
  if (matchedMajor?.courseIds.some((value) => normalizeIdLike(value) === normalizeIdLike(course.id))) {
    return true
  }

  const linkedMajor = structure.majors.find((major) =>
    (major.courseIds ?? []).some((value) => normalizeIdLike(value) === normalizeIdLike(course.id)) ||
    (major.baseCourseIds ?? []).some((value) => normalizeIdLike(value) === normalizeIdLike(course.id)),
  )
  if (linkedMajor) {
    return true
  }

  return false
}

function isEnrollmentWindowOpen(course: Course, now = Date.now()) {
  const open = course.enrollmentOpenAt || course.enrollmentOpensAt
  const close = course.enrollmentCloseAt || course.enrollmentClosesAt
  const openTs = open ? new Date(open).getTime() : null
  const closeTs = close ? new Date(close).getTime() : null
  if (openTs && Number.isFinite(openTs) && now < openTs) return false
  if (closeTs && Number.isFinite(closeTs) && now > closeTs) return false
  return true
}

function isPaymentCleared(student: Student | null | undefined) {
  if (!student) return false
  if (student.balance === undefined || student.balance === null) return false
  const balance = Number(student.balance)
  if (!Number.isFinite(balance)) return false
  return balance <= 0
}

function getEnrollmentPaymentStatus(student: Student | null | undefined): EnrollmentPaymentStatus {
  return isPaymentCleared(student) ? 'paid' : 'payment_required'
}

export function normalizeCourseType(value: unknown): CourseType {
  return value === 'common' ? 'common' : 'major'
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
        id: `ENROLL-NOTIF-${randomUUID().slice(0, 8).toUpperCase()}`,
        userId,
        title,
        body,
        createdAt,
        read: false,
        actor: actor?.trim() || 'system',
      })),
    )
  } catch (error) {
    console.error('Failed to notify student', error)
  }
}

function normalizeSchedule(raw: unknown): Course['schedule'] | undefined {
  if (!Array.isArray(raw)) return undefined

  const entries = raw
    .map((entry) => {
      const day = typeof entry?.day === 'string' ? entry.day.toLowerCase() : ''
      const startTime = typeof entry?.startTime === 'string' ? entry.startTime.trim() : ''
      const endTime = typeof entry?.endTime === 'string' ? entry.endTime.trim() : ''
      const location = typeof entry?.location === 'string' ? entry.location.trim() : ''
      const department = typeof entry?.department === 'string' ? entry.department.trim() : undefined
      const branch = typeof entry?.branch === 'string' ? entry.branch.trim() : undefined
      if (!validDays.has(day) || !startTime || !endTime || !location) return null
      return { day: day as CourseScheduleEntry['day'], startTime, endTime, location, department, branch }
    })
    .filter(Boolean)

  return entries.length > 0 ? (entries as Course['schedule']) : undefined
}

async function assertCourseEditPermission(course: Course, auth: Request['auth']) {
  if (auth?.role === 'admin' || auth?.role === 'super-admin' || auth?.role === 'supervisor') return true
  if (auth?.role === 'professor' && auth.professorId && auth.professorId === course.professorId) return true
  return false
}

async function applyCoupon(basePrice: number, couponCode?: string) {
  if (!couponCode) return { price: basePrice, discountPercent: undefined, discountAmount: undefined, coupon: undefined }

  const normalised = couponCode.trim().toLowerCase()
  if (!normalised) return { price: basePrice, discountPercent: undefined, discountAmount: undefined, coupon: undefined }

  const couponsCol = await couponsCollection()
  const coupon = await couponsCol.findOne({ code: normalised })
  if (!coupon) {
    const error = new Error('Coupon code is not valid')
    error.name = 'InvalidCoupon'
    throw error
  }

  const percentDecimal = coupon.percent > 1 ? coupon.percent / 100 : coupon.percent
  const percent = Number(percentDecimal.toFixed(4))
  const discountAmount = multiplyCurrency(basePrice, percent)
  const price = subtractCurrency(basePrice, discountAmount)
  return { price, discountPercent: percent, discountAmount, coupon: normalised }
}

async function ensureStudent(studentId: string) {
  const studentsCol = await studentsCollection()
  const student = await studentsCol.findOne({ id: studentId })
  if (!student) {
    throw new Error('Student not found')
  }
  return { student, studentsCol }
}

async function adjustStudentBalance(options: {
  student: Student
  studentsCol: Awaited<ReturnType<typeof studentsCollection>>
  paymentsCol: Awaited<ReturnType<typeof paymentsCollection>>
  delta: number
  note: string
  source: PaymentTransaction['source']
  referenceId?: string
  enrollmentId?: string
  courseId?: string
  courseTitle?: string
  auth?: Request['auth']
}) {
  const { student, studentsCol, paymentsCol, delta, note, source, referenceId } = options
  const current = student.balance ?? 0
  const nextBalance = sumCents([current, delta])
  const createdAt = new Date().toISOString()
  const transactionId = buildTransactionId()
  const roundedAbsDelta = Math.abs(roundToCents(delta))

  const transaction: PaymentTransaction = {
    id: transactionId,
    displayId: transactionId,
    studentId: student.id,
    amount: roundedAbsDelta,
    method: 'internal',
    note,
    createdAt,
    type: delta >= 0 ? 'debit' : 'credit',
    source,
    referenceId,
    enrollmentId: options.enrollmentId,
    courseId: options.courseId,
    courseTitle: options.courseTitle,
    balanceAfter: nextBalance,
  }

  await paymentsCol.insertOne(transaction)
  await studentsCol.updateOne({ id: student.id }, { $set: { balance: nextBalance } })
  await appendFinancialLedgerEntry({
    studentId: student.id,
    amount: roundedAbsDelta,
    entryType: delta >= 0 ? 'debit' : 'credit',
    source,
    note,
    paymentId: transaction.id,
    enrollmentId: options.enrollmentId ?? null,
    metadata: {
      referenceId: referenceId ?? null,
      courseId: options.courseId ?? null,
      courseTitle: options.courseTitle ?? null,
      balanceAfter: nextBalance,
    },
    auth: options.auth,
  })

  return {
    balance: nextBalance,
    transaction,
  }
}

async function promoteWaitlistedEnrollment(courseId: string) {
  const coursesCol = await coursesCollection()
  const enrollmentsCol = await enrollmentsCollection()
  const studentsCol = await studentsCollection()

  const course = await coursesCol.findOne({ id: courseId })
  if (!course) return null

  const activeCount = await enrollmentsCol.countDocuments({ courseId, status: { $in: capacityHoldingStatuses } })
  const remainingSeats = Math.max(0, (course.capacity ?? 0) - activeCount)
  if (remainingSeats <= 0) return null

  const queuedCandidates = await enrollmentsCol
    .find({ courseId, status: 'waitlisted' })
    .sort({ createdAt: 1 })
    .toArray()

  for (const candidate of queuedCandidates) {
    const student = await studentsCol.findOne({ id: candidate.studentId })
    if (!student) continue

    const studentConflict = await hasStudentScheduleConflict(student.id, course)
    const missingPrerequisites = await findMissingPrerequisites(student.id, course)
    const now = new Date().toISOString()

    if (studentConflict || missingPrerequisites.length > 0) {
      await enrollmentsCol.updateOne(
        { id: candidate.id },
        {
          $set: {
            status: 'rejected',
            updatedAt: now,
            latestAdvisorMessage: studentConflict
              ? 'Waitlist promotion skipped because the student now has a schedule conflict.'
              : `Waitlist promotion skipped because prerequisites are missing: ${missingPrerequisites.join(', ')}`,
            latestAdvisorMessageAt: now,
            ...enrollmentActorPatch(undefined),
          },
        },
      )
      continue
    }

    const nextStatus: EnrollmentStatus = isPaymentCleared(student) ? 'pendingAdvisorApproval' : 'pending_approval'
    await enrollmentsCol.updateOne(
      { id: candidate.id },
      {
        $set: {
          status: nextStatus,
          updatedAt: now,
          paymentVerified: nextStatus === 'pendingAdvisorApproval',
          paymentStatus: nextStatus === 'pendingAdvisorApproval' ? 'paid' : 'payment_required',
          latestAdvisorMessage: nextStatus === 'pendingAdvisorApproval'
            ? 'A seat opened and your waitlisted enrollment is now pending advisor approval.'
            : 'A seat opened, but financial clearance is still required before activation.',
          latestAdvisorMessageAt: now,
          ...enrollmentActorPatch(undefined),
        },
      },
    )

    await notifyStudent(
      candidate.studentId,
      `Seat available: ${candidate.courseTitle}`,
      nextStatus === 'pendingAdvisorApproval'
        ? 'A seat opened up in your waitlisted course. Your enrollment is now pending advisor approval.'
        : 'A seat opened up in your waitlisted course, but payment clearance is still required before activation.',
      'system',
    )

    return await enrollmentsCol.findOne({ id: candidate.id })
  }

  return null
}

enrollmentRoutes.post('/:id/promote-waitlist', requireAdmin, async (req, res) => {
  try {
    const enrollmentsCol = await enrollmentsCollection()
    const coursesCol = await coursesCollection()
    const studentsCol = await studentsCollection()

    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }
    if (enrollment.status !== 'waitlisted') {
      return res.status(400).json({ success: false, error: 'Enrollment is not on the waitlist' })
    }

    const course = await coursesCol.findOne({ id: enrollment.courseId })
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    const activeCount = await enrollmentsCol.countDocuments({ courseId: course.id, status: { $in: capacityHoldingStatuses } })
    const remainingSeats = Math.max(0, (course.capacity ?? 0) - activeCount)
    if (remainingSeats <= 0) {
      return res.status(409).json({ success: false, error: 'No seats available in this course right now' })
    }

    const student = await studentsCol.findOne({ id: enrollment.studentId })
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const studentConflict = await hasStudentScheduleConflict(student.id, course)
    if (studentConflict) {
      return res.status(409).json({ success: false, error: 'Student now has a schedule conflict with this course' })
    }
    const missingPrerequisites = await findMissingPrerequisites(student.id, course)
    if (missingPrerequisites.length > 0) {
      return res.status(409).json({ success: false, error: `Missing prerequisites: ${missingPrerequisites.join(', ')}` })
    }

    const now = new Date().toISOString()
    const nextStatus: EnrollmentStatus = isPaymentCleared(student) ? 'pendingAdvisorApproval' : 'pending_approval'
    await enrollmentsCol.updateOne(
      { id: enrollment.id },
      {
        $set: {
          status: nextStatus,
          updatedAt: now,
          paymentVerified: nextStatus === 'pendingAdvisorApproval',
          paymentStatus: nextStatus === 'pendingAdvisorApproval' ? 'paid' : 'payment_required',
          latestAdvisorMessage: nextStatus === 'pendingAdvisorApproval'
            ? 'A seat opened and your waitlisted enrollment is now pending advisor approval.'
            : 'A seat opened, but financial clearance is still required before activation.',
          latestAdvisorMessageAt: now,
          ...enrollmentActorPatch(req.auth),
        },
      },
    )

    await notifyStudent(
      enrollment.studentId,
      `Seat available: ${enrollment.courseTitle}`,
      nextStatus === 'pendingAdvisorApproval'
        ? 'A seat opened up in your waitlisted course. Your enrollment is now pending advisor approval.'
        : 'A seat opened up in your waitlisted course, but payment clearance is still required before activation.',
      'system',
    )

    await writeAuditLog({
      action: 'enrollment_waitlist_promoted',
      entityType: 'enrollment',
      entityId: enrollment.id,
      details: { studentId: enrollment.studentId, courseId: enrollment.courseId, nextStatus },
      auth: req.auth,
    })

    const updated = await enrollmentsCol.findOne({ id: enrollment.id })
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to promote waitlisted enrollment', error)
    return res.status(500).json({ success: false, error: 'Failed to promote enrollment' })
  }
})

enrollmentRoutes.get('/meta/courses', async (req, res) => {
  try {
    await ensureEnrollmentIndexes()
    const coursesCol = await coursesCollection()
    const enrollmentsCol = await enrollmentsCollection()
    const studentsCol = await studentsCollection()

    const mineOnlyForLimit = String(req.query.mine ?? '').toLowerCase() === 'true'
    const limit = mineOnlyForLimit
      ? Math.min(500, Math.max(1, Number(req.query.limit ?? 200)))
      : Math.min(50, Math.max(8, Number(req.query.limit ?? 20)))
    const page = Math.max(1, Number(req.query.page ?? 1))
    const scopeParam = typeof req.query.scope === 'string' ? req.query.scope.trim().toLowerCase() : ''
    const explicitScope = scopeParam === 'admin' ? 'admin' : 'student'
    const isPrivilegedRole = req.auth ? ['admin', 'super-admin', 'supervisor', 'advisor'].includes(req.auth.role) : false
    const isAdminScope = explicitScope === 'admin' || isPrivilegedRole
    const openOnlyDefault = isAdminScope ? false : true
    const openOnly = typeof req.query.openOnly === 'string'
      ? String(req.query.openOnly).toLowerCase() === 'true'
      : openOnlyDefault
    const includeAllDatesParam = typeof req.query.includeAllDates === 'string'
      ? String(req.query.includeAllDates).toLowerCase() === 'true'
      : undefined
    const upcomingDaysRaw = Number(req.query.upcomingDays)
    const applyUpcomingDaysFilter =
      includeAllDatesParam !== true &&
      Number.isFinite(upcomingDaysRaw) &&
      upcomingDaysRaw > 0

    const now = new Date()
    const includeScheduleQuery = typeof req.query.includeSchedule === 'string'
      ? String(req.query.includeSchedule).toLowerCase() === 'true'
      : undefined
    const includeSchedule = includeScheduleQuery ?? isAdminScope
    const structure = await getAcademicStructure()
    if (!isAdminScope && structure.enrollmentOpen === false) {
      res.setHeader('X-Total-Count', '0')
      return res.json({ success: true, data: [] })
    }

    const authStudentId = req.auth?.studentId ?? req.auth?.userId
    const student =
      authStudentId &&
      (await studentsCol.findOne(
        { id: authStudentId },
        { projection: { program: 1, programId: 1, major: 1, faculty: 1, facultyId: 1, currentSemester: 1, currentYear: 1, yearLevel: 1 } },
      )) as any
    const normalize = (value?: string): string | undefined => (value?.trim().length ? value.trim().toLowerCase() : undefined)
    const programIdentifiers = Array.from(
      new Set([normalize(student?.programId), normalize(student?.program), normalize(student?.major)].filter(Boolean) as string[]),
    )
    const facultyIdentifiers = Array.from(
      new Set([normalize(student?.facultyId), normalize(student?.faculty)].filter(Boolean) as string[]),
    )
    const currentYear = student ? deriveStudentYearLevel(student) : undefined
    const semesterIdentifiers = Array.from(
      new Set(
        [
          normalize(student?.currentSemester),
          currentYear ? `year ${currentYear}` : undefined,
          currentYear ? String(currentYear) : undefined,
        ].filter(Boolean) as string[],
      ),
    )

    const query: Record<string, unknown> = {}
    if (openOnly) {
      query.enrollmentOpen = { $ne: false }
    }
    const mineOnly = String(req.query.mine ?? '').toLowerCase() === 'true'
    if (mineOnly) {
      if (req.auth?.role !== 'professor' || !req.auth.professorId) {
        res.setHeader('X-Total-Count', '0')
        return res.json({ success: true, data: [] })
      }
      query.professorId = req.auth.professorId
    }
    if (applyUpcomingDaysFilter) {
      const startFilter: Record<string, unknown> = { $gte: now.toISOString() }
      const until = new Date(now.getTime() + upcomingDaysRaw * 24 * 60 * 60 * 1000)
      startFilter.$lte = until.toISOString()
      query.startDate = startFilter
    }
    const shouldApplyDbEligibilityFilters = req.auth?.role !== 'student'
    if (shouldApplyDbEligibilityFilters) {
      const eligibilityClauses: Record<string, unknown>[] = []
      if (programIdentifiers.length > 0) {
        eligibilityClauses.push({
          $or: [
            { eligiblePrograms: { $exists: false } },
            { eligiblePrograms: { $size: 0 } },
            { eligiblePrograms: { $in: programIdentifiers } },
          ],
        })
      }
      if (facultyIdentifiers.length > 0) {
        eligibilityClauses.push({
          $or: [
            { eligibleFaculties: { $exists: false } },
            { eligibleFaculties: { $size: 0 } },
            { eligibleFaculties: { $in: facultyIdentifiers } },
          ],
        })
      }
      if (semesterIdentifiers.length > 0) {
        eligibilityClauses.push({
          $or: [
            { eligibleSemesters: { $exists: false } },
            { eligibleSemesters: { $size: 0 } },
            { eligibleSemesters: { $in: semesterIdentifiers } },
          ],
        })
      }
      if (eligibilityClauses.length > 0) {
        query.$and = [...((query.$and as any) ?? []), ...eligibilityClauses]
      }
    }

    const coursesCursor = coursesCol
      .find(query as any)
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
    const fetchedCourses = await coursesCursor.toArray()
    const courses = fetchedCourses.filter((course) => {
      if (!isAdminScope) {
        if (openOnly && !isEnrollmentWindowOpen(course as Course, now.getTime())) return false
        if (req.auth?.role === 'student' && !isCourseConfiguredForStudents(course as Course, structure, student as Student)) return false
        if (req.auth?.role === 'student' && !doesCourseMatchMajor(course as Course, student as Student, structure)) return false
      }
      return true
    })

    const total = courses.length

    const courseIds = courses.map((course) => course.id)
    const enrollmentCounts =
      courseIds.length > 0
        ? await enrollmentsCol
            .aggregate<{ _id: string; count: number }>([
              { $match: { courseId: { $in: courseIds }, status: { $nin: ['cancelled'] } } },
              { $group: { _id: '$courseId', count: { $sum: 1 } } },
            ])
            .toArray()
        : []
    const countMap = new Map(enrollmentCounts.map((c) => [c._id, c.count]))

    const hydrated = courses.map((course) => {
      const enrolledCount = countMap.get(course.id) ?? 0
      const availableSeats = Math.max(0, (course.capacity ?? 0) - enrolledCount)
      const base = includeSchedule ? course : { ...course }
      if (!includeSchedule) {
        (base as Course & { schedule?: CourseScheduleEntry[] }).schedule = undefined
      }
      return {
        ...base,
        courseType: normalizeCourseType(course.courseType),
        enrolledCount,
        availableSeats,
        semester: course.startDate?.slice(0, 7) ?? null,
        semesterId: course.semesterId ?? null,
        deadline: course.startDate,
      }
    })

    res.setHeader('X-Total-Count', String(total))
    res.json({ success: true, data: hydrated })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch courses' })
  }
})

enrollmentRoutes.post('/meta/courses/bulk-import', requireAdmin, async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.courses) ? req.body.courses : []
    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'courses array is required' })
    }
    if (rows.length > 500) {
      return res.status(400).json({ success: false, error: 'Import is limited to 500 rows at a time' })
    }

    const coursesCol = await coursesCollection()
    const profCol = await professorsCollection()
    const allProfessors = await profCol.find({}).toArray()
    const professorByNameOrEmail = new Map<string, typeof allProfessors[number]>()
    allProfessors.forEach((prof) => {
      professorByNameOrEmail.set(`${prof.firstName} ${prof.lastName}`.toLowerCase().trim(), prof)
      if (prof.email) professorByNameOrEmail.set(prof.email.toLowerCase().trim(), prof)
    })

    const created: Course[] = []
    const failed: Array<{ row: number; title: string; error: string }> = []

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] ?? {}
      const normalizedTitle = typeof row.title === 'string' ? row.title.trim() : ''
      if (!normalizedTitle) {
        failed.push({ row: index + 1, title: String(row.title ?? ''), error: 'title is required' })
        continue
      }

      let professor = null as (typeof allProfessors[number] | null)
      const professorKey = typeof row.professor === 'string' ? row.professor.toLowerCase().trim() : ''
      if (row.professorId && typeof row.professorId === 'string') {
        professor = allProfessors.find((p) => p.id === row.professorId) ?? null
      } else if (professorKey) {
        professor = professorByNameOrEmail.get(professorKey) ?? null
      }
      if (!professor) {
        professor = allProfessors[0] ?? null
      }
      if (!professor) {
        failed.push({ row: index + 1, title: normalizedTitle, error: 'No professor found to assign' })
        continue
      }

      const parsedStartDate = row.startDate ? new Date(String(row.startDate)) : new Date()
      const normalizedStartDate = Number.isNaN(parsedStartDate.getTime()) ? new Date() : parsedStartDate
      const parsedEndDate = row.endDate ? new Date(String(row.endDate)) : addCourseDuration(normalizedStartDate, 120)
      const normalizedEndDate = Number.isNaN(parsedEndDate.getTime()) ? addCourseDuration(normalizedStartDate, 120) : parsedEndDate
      const normalizedCode = typeof row.code === 'string' && row.code.trim() ? row.code.trim() : buildCourseCode(normalizedTitle)
      const normalizedCapacity = row.capacity !== undefined ? Number(row.capacity) : 20
      const normalizedPrice = row.price !== undefined ? Number(row.price) : 0

      const course: Course = {
        id: buildCourseId(),
        displayId: normalizedCode,
        title: normalizedTitle,
        code: normalizedCode,
        professorId: professor.id,
        professorName: `${professor.firstName} ${professor.lastName}`,
        sectionId: typeof row.sectionId === 'string' && row.sectionId.trim() ? row.sectionId.trim() : undefined,
        capacity: Number.isFinite(normalizedCapacity) && normalizedCapacity >= 0 ? normalizedCapacity : 20,
        startDate: normalizedStartDate.toISOString(),
        endDate: normalizedEndDate.toISOString(),
        price: Number.isFinite(normalizedPrice) && normalizedPrice >= 0 ? normalizedPrice : 0,
        department: typeof row.department === 'string' && row.department.trim() ? row.department.trim() : undefined,
        branch: typeof row.branch === 'string' && row.branch.trim() ? row.branch.trim() : undefined,
        location: typeof row.location === 'string' && row.location.trim() ? row.location.trim() : undefined,
        schedule: [],
        enrollmentOpen: true,
        enrollmentOpensAt: null,
        enrollmentClosesAt: null,
        enrollmentOpenAt: null,
        enrollmentCloseAt: null,
        enrollmentStatusNote: null,
        eligiblePrograms: undefined,
        eligibleFaculties: undefined,
        eligibleSemesters: undefined,
        prerequisiteCourseIds: undefined,
        creditHours: normalizeCreditHours(row.creditHours),
        courseType: normalizeCourseType(row.courseType),
      }

      try {
        await coursesCol.insertOne(course)
        created.push(course)
      } catch (error) {
        failed.push({ row: index + 1, title: normalizedTitle, error: error instanceof Error ? error.message : 'Insert failed' })
      }
    }

    if (created.length > 0) {
      await writeAuditLog({
        action: 'course_bulk_imported',
        entityType: 'course',
        entityId: null,
        details: {
          createdCount: created.length,
          failedCount: failed.length,
          courseIds: created.map((c) => c.id),
        },
        auth: req.auth,
      })
    }

    return res.status(created.length > 0 ? 201 : 400).json({ success: true, data: { created, failed } })
  } catch (error) {
    console.error('Failed to bulk import courses', error)
    return res.status(500).json({ success: false, error: 'Failed to bulk import courses' })
  }
})

enrollmentRoutes.post('/meta/courses', requireAdmin, async (req, res) => {
  try {
    const { title, code, professorId, capacity, startDate, endDate, price, enrollmentOpen, enrollmentOpensAt, enrollmentClosesAt, enrollmentOpenAt, enrollmentCloseAt, department, branch, schedule, sectionId, location, enrollmentStatusNote, eligiblePrograms, eligibleFaculties, eligibleSemesters, semesterId, prerequisiteCourseIds, creditHours, courseType } = req.body ?? {}
    const normalizedTitle = typeof title === 'string' ? title.trim() : ''
    if (!normalizedTitle) {
      return res.status(400).json({ success: false, error: 'title is required' })
    }

    const profCol = await professorsCollection()
    const professor = professorId
      ? await profCol.findOne({ id: professorId })
      : (await profCol.find({}).sort({ firstName: 1, lastName: 1 }).limit(1).toArray())[0] ?? null
    if (!professor) {
      return res.status(404).json({ success: false, error: 'Professor not found' })
    }

    const parsedStartDate = startDate ? new Date(String(startDate)) : new Date()
    const normalizedStartDate = Number.isNaN(parsedStartDate.getTime()) ? new Date() : parsedStartDate
    const parsedEndDate = endDate ? new Date(String(endDate)) : addCourseDuration(normalizedStartDate, 120)
    const normalizedEndDate = Number.isNaN(parsedEndDate.getTime()) ? addCourseDuration(normalizedStartDate, 120) : parsedEndDate
    const normalizedCode = typeof code === 'string' && code.trim() ? code.trim() : buildCourseCode(normalizedTitle)
    const normalizedCapacity = capacity !== undefined ? Number(capacity) : 20
    const normalizedPrice = price !== undefined ? Number(price) : 0

    const normalizedEligiblePrograms = normalizeEligibilityList(eligiblePrograms)
    const normalizedEligibleFaculties = normalizeEligibilityList(eligibleFaculties)
    const normalizedEligibleSemesters = normalizeEligibilityList(eligibleSemesters)
    const normalizedPrerequisiteCourseIds = normalizeIdList(prerequisiteCourseIds)
    const normalizedCreditHours = normalizeCreditHours(creditHours)

    const course: Course = {
      id: buildCourseId(),
      displayId: normalizedCode,
      title: normalizedTitle,
      code: normalizedCode,
      professorId: professor.id,
      professorName: `${professor.firstName} ${professor.lastName}`,
      sectionId: typeof sectionId === 'string' && sectionId.trim() ? sectionId.trim() : undefined,
      capacity: Number.isFinite(normalizedCapacity) && normalizedCapacity >= 0 ? normalizedCapacity : 20,
      startDate: normalizedStartDate.toISOString(),
      endDate: normalizedEndDate.toISOString(),
      price: Number.isFinite(normalizedPrice) && normalizedPrice >= 0 ? normalizedPrice : 0,
      department: typeof department === 'string' && department.trim() ? department.trim() : undefined,
      branch: typeof branch === 'string' && branch.trim() ? branch.trim() : undefined,
      location: typeof location === 'string' && location.trim() ? location.trim() : undefined,
      schedule: normalizeSchedule(schedule),
      enrollmentOpen: enrollmentOpen !== undefined ? Boolean(enrollmentOpen) : true,
      enrollmentOpensAt: enrollmentOpensAt ? String(enrollmentOpensAt) : null,
      enrollmentClosesAt: enrollmentClosesAt ? String(enrollmentClosesAt) : null,
      enrollmentOpenAt: enrollmentOpenAt ? String(enrollmentOpenAt) : enrollmentOpensAt ? String(enrollmentOpensAt) : null,
      enrollmentCloseAt: enrollmentCloseAt ? String(enrollmentCloseAt) : enrollmentClosesAt ? String(enrollmentClosesAt) : null,
      enrollmentStatusNote: typeof enrollmentStatusNote === 'string' ? enrollmentStatusNote.trim() || null : null,
      eligiblePrograms: normalizedEligiblePrograms,
      eligibleFaculties: normalizedEligibleFaculties,
      eligibleSemesters: normalizedEligibleSemesters,
      semesterId: typeof semesterId === 'string' && semesterId.trim() ? semesterId.trim() : null,
      prerequisiteCourseIds: normalizedPrerequisiteCourseIds,
      creditHours: normalizedCreditHours,
      courseType: normalizeCourseType(courseType),
    }

    const coursesCol = await coursesCollection()
    await coursesCol.insertOne(course)

    await writeAuditLog({
      action: 'course_created',
      entityType: 'course',
      entityId: course.id,
      details: {
        courseTitle: course.title,
        courseCode: course.code,
        professorId: course.professorId,
        department: course.department ?? null,
      },
      auth: req.auth,
    })

    res.status(201).json({ success: true, data: course })
  } catch (error) {
    console.error('Failed to create course', error)
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to create course' })
  }
})

enrollmentRoutes.get('/meta/academic-structure', async (req, res) => {
  try {
    const structure = await getAcademicStructure()
    return res.json({ success: true, data: structure })
  } catch (error) {
    console.error('Failed to fetch academic structure', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch academic structure' })
  }
})

enrollmentRoutes.put('/meta/academic-structure', requireAdmin, async (req, res) => {
  try {
    const collection = await academicStructureCollection()
    const existing = await getAcademicStructure()
    const next = sanitizeAcademicStructure(req.body, existing)
    await collection.updateOne({ id: 'global' }, { $set: next }, { upsert: true })
    for (const nextMajor of next.majors) {
      const previousMajor = existing.majors.find((major) => major.id === nextMajor.id)
      const previousBaseCourseIds = previousMajor?.baseCourseIds ?? []
      const nextBaseCourseIds = nextMajor.baseCourseIds ?? []
      const sameBaseCourses =
        previousBaseCourseIds.length === nextBaseCourseIds.length &&
        previousBaseCourseIds.every((value, index) => value === nextBaseCourseIds[index])
      if (!sameBaseCourses) {
        await syncBaseCoursesForFirstYearStudentsByMajor(nextMajor.id, previousBaseCourseIds)
      }
    }
    return res.json({ success: true, data: next })
  } catch (error) {
    console.error('Failed to update academic structure', error)
    return res.status(500).json({ success: false, error: 'Failed to update academic structure' })
  }
})

enrollmentRoutes.patch('/meta/enrollment-toggle', requireAdmin, async (req, res) => {
  try {
    const { enrollmentOpen, enrollmentMessage } = req.body ?? {}
    if (typeof enrollmentOpen !== 'boolean') {
      return res.status(400).json({ success: false, error: 'enrollmentOpen boolean is required' })
    }
    const collection = await academicStructureCollection()
    const existing = await getAcademicStructure()
    const updated = sanitizeAcademicStructure(
      {
        ...existing,
        enrollmentOpen,
        enrollmentMessage: typeof enrollmentMessage === 'string' ? enrollmentMessage.trim() || null : existing.enrollmentMessage,
      },
      existing,
    )
    await collection.updateOne({ id: 'global' }, { $set: updated }, { upsert: true })
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to toggle enrollment', error)
    return res.status(500).json({ success: false, error: 'Failed to update enrollment toggle' })
  }
})

enrollmentRoutes.put('/meta/courses/:id', requireAdmin, async (req, res) => {
  try {
    const coursesCol = await coursesCollection()
    const existing = await coursesCol.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    const updates: Partial<Course> = {}
    ;(['title', 'code', 'professorId', 'capacity', 'startDate', 'endDate', 'price', 'enrollmentOpen', 'enrollmentOpensAt', 'enrollmentClosesAt', 'enrollmentOpenAt', 'enrollmentCloseAt', 'department', 'branch', 'sectionId', 'location', 'enrollmentStatusNote'] as Array<keyof Course>).forEach((key) => {
      if (req.body[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        updates[key] = req.body[key]
      }
    })
    if (req.body?.courseType !== undefined) {
      updates.courseType = normalizeCourseType(req.body.courseType)
    }

    if (req.body.schedule !== undefined) {
      updates.schedule = normalizeSchedule(req.body.schedule) ?? []
    }

    if (updates.professorId) {
      const profCol = await professorsCollection()
      const professor = await profCol.findOne({ id: updates.professorId })
      if (!professor) {
        return res.status(404).json({ success: false, error: 'Professor not found' })
      }
      updates.professorName = `${professor.firstName} ${professor.lastName}`
    }

    const eligibleProgramsUpdate = normalizeEligibilityList(req.body?.eligiblePrograms)
    if (eligibleProgramsUpdate !== undefined) {
      updates.eligiblePrograms = eligibleProgramsUpdate
    }
    const eligibleFacultiesUpdate = normalizeEligibilityList(req.body?.eligibleFaculties)
    if (eligibleFacultiesUpdate !== undefined) {
      updates.eligibleFaculties = eligibleFacultiesUpdate
    }
    const eligibleSemestersUpdate = normalizeEligibilityList(req.body?.eligibleSemesters)
    if (eligibleSemestersUpdate !== undefined) {
      updates.eligibleSemesters = eligibleSemestersUpdate
    }
    if (req.body?.semesterId !== undefined) {
      const semesterIdValue = req.body.semesterId
      updates.semesterId = typeof semesterIdValue === 'string' && semesterIdValue.trim() ? semesterIdValue.trim() : null
    }
    const prerequisiteCourseIdsUpdate = normalizeIdList(req.body?.prerequisiteCourseIds)
    if (prerequisiteCourseIdsUpdate !== undefined) {
      updates.prerequisiteCourseIds = prerequisiteCourseIdsUpdate
    }
    const creditHoursUpdate = normalizeCreditHours(req.body?.creditHours)
    if (creditHoursUpdate !== undefined) {
      updates.creditHours = creditHoursUpdate
    }

    if (updates.code && !updates.displayId) {
      updates.displayId = updates.code
    }

    await coursesCol.updateOne({ id: existing.id }, { $set: updates })
    const updated = await coursesCol.findOne({ id: existing.id })
    const resolved = updated ?? { ...existing, ...updates }

    // Keep denormalized enrollment fields in sync when course details change.
    const enrollmentsCol = await enrollmentsCollection()
    const courseCode = resolved.code ?? resolved.displayId ?? resolved.id
    await enrollmentsCol.updateMany(
      { courseId: resolved.id },
      {
        $set: {
          courseTitle: resolved.title,
          professorId: resolved.professorId,
          professorName: resolved.professorName,
          startDate: resolved.startDate,
          endDate: resolved.endDate,
          courseCode,
        },
      },
    )

    await writeAuditLog({
      action: 'course_updated',
      entityType: 'course',
      entityId: resolved.id,
      details: {
        courseTitle: resolved.title,
        courseCode,
        changedFields: Object.keys(updates),
      },
      auth: req.auth,
    })

    res.json({ success: true, data: resolved })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update course' })
  }
})

// Bulk update multiple courses (open/close enrollment windows)
enrollmentRoutes.post('/meta/courses/bulk-update', requireAdmin, async (req, res) => {
  try {
    const { courseIds, action, openAt, closeAt, note, majorId } = req.body ?? {}
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ success: false, error: 'courseIds array is required' })
    }
    if (action !== 'open' && action !== 'close') {
      return res.status(400).json({ success: false, error: "action must be 'open' or 'close'" })
    }

    const coursesCol = await coursesCollection()
    // find existing courses
    const existing = await coursesCol.find({ id: { $in: courseIds } }).toArray()
    const existingIds = new Set(existing.map((c) => c.id))
    const notFound = courseIds.filter((id) => !existingIds.has(id))
    let selectedMajor: AcademicMajor | null = null
    let selectedDepartment: AcademicDepartment | null = null
    let structure: AcademicStructure | null = null

    if (typeof majorId === 'string' && majorId.trim() && majorId !== 'all') {
      structure = await getAcademicStructure()
      selectedMajor = structure.majors.find((major) => major.id === majorId.trim()) ?? null
      if (!selectedMajor) {
        return res.status(404).json({ success: false, error: 'Selected major not found' })
      }
      selectedDepartment =
        structure.departments.find((department) => normalizeIdLike(department.id) === normalizeIdLike(selectedMajor?.departmentId)) ?? null
    }

    const updates: Record<string, unknown> = {}
    if (action === 'open') {
      updates.enrollmentOpen = true
      updates.enrollmentOpenAt = openAt ?? null
      updates.enrollmentCloseAt = closeAt ?? null
      if (updates.enrollmentOpenAt === undefined) updates.enrollmentOpenAt = null
      if (updates.enrollmentCloseAt === undefined) updates.enrollmentCloseAt = null
    } else {
      updates.enrollmentOpen = false
      updates.enrollmentOpenAt = null
      updates.enrollmentCloseAt = null
      updates.enrollmentStatusNote = typeof note === 'string' ? note.trim() || null : null
    }

    if (existing.length > 0) {
      if (selectedMajor && action === 'open') {
        for (const course of existing) {
          const mergedEligiblePrograms = Array.from(
            new Set([...(normalizeEligibilityList(course.eligiblePrograms) ?? []), normalizeIdLike(selectedMajor.name)].filter(Boolean)),
          )
          const nextCourseUpdates: Record<string, unknown> = {
            ...updates,
            eligiblePrograms: mergedEligiblePrograms.length > 0 ? mergedEligiblePrograms : undefined,
          }
          if (!normalizeIdLike(course.department) && selectedDepartment) {
            nextCourseUpdates.department = selectedDepartment.id
          }
          await coursesCol.updateOne({ id: course.id }, { $set: nextCourseUpdates as Partial<Course> })
        }
      } else {
        await coursesCol.updateMany({ id: { $in: existing.map((c) => c.id) } }, { $set: updates })
      }
    }

    if (selectedMajor && structure) {
      const mergedCourseIds = Array.from(new Set([...(selectedMajor.courseIds ?? []), ...existing.map((course) => course.id)]))
      const nextMajors = structure.majors.map((major) =>
        major.id === selectedMajor?.id
          ? {
              ...major,
              courseIds: mergedCourseIds,
            }
          : major,
      )
      const collection = await academicStructureCollection()
      await collection.updateOne(
        { id: 'global' },
        { $set: { ...structure, majors: nextMajors, updatedAt: new Date().toISOString() } },
        { upsert: true },
      )
    }

    const updated = existing.length > 0 ? await coursesCol.find({ id: { $in: existing.map((c) => c.id) } }).toArray() : []

    // Optionally update denormalized enrollment entries (not modifying enrollments here)

    if (updated.length > 0) {
      await writeAuditLog({
        action: action === 'open' ? 'course_bulk_opened' : 'course_bulk_closed',
        entityType: 'course',
        entityId: null,
        details: {
          courseIds: updated.map((course) => course.id),
          notFound,
          majorId: selectedMajor?.id ?? null,
          note: action === 'close' ? (typeof note === 'string' ? note.trim() || null : null) : null,
        },
        auth: req.auth,
      })
    }

    return res.json({ success: true, data: { updated, notFound } })
  } catch (error) {
    console.error('Failed to bulk update courses', error)
    return res.status(500).json({ success: false, error: 'Failed to bulk update courses' })
  }
})

enrollmentRoutes.get('/meta/audit-log', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 100)))
    const entityType = typeof req.query.entityType === 'string' ? req.query.entityType.trim() : ''
    const action = typeof req.query.action === 'string' ? req.query.action.trim() : ''
    const actor = typeof req.query.actor === 'string' ? req.query.actor.trim() : ''
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate.trim() : ''
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate.trim() : ''
    type AuditLogRow = {
      id: string
      action: string
      actorUserId: string | null
      actorUsername: string | null
      entityType: string | null
      entityId: string | null
      details: Record<string, unknown>
      createdAt: string
    }
    const collection = await getCollection<AuditLogRow>('audit_logs')
    const query: Record<string, unknown> = {}
    if (entityType) query.entityType = entityType
    if (action) query.action = action
    if (actor) query.actorUsername = actor
    const createdAtFilter: Record<string, string> = {}
    if (startDate) {
      const parsed = new Date(startDate)
      if (!Number.isNaN(parsed.getTime())) createdAtFilter.$gte = parsed.toISOString()
    }
    if (endDate) {
      const parsed = new Date(endDate)
      if (!Number.isNaN(parsed.getTime())) createdAtFilter.$lte = parsed.toISOString()
    }
    if (Object.keys(createdAtFilter).length > 0) query.createdAt = createdAtFilter
    const entries = await collection.find(query as any).sort({ createdAt: -1 }).limit(limit).toArray()
    return res.json({ success: true, data: entries })
  } catch (error) {
    console.error('Failed to fetch audit log', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch audit log' })
  }
})

enrollmentRoutes.put('/meta/courses/:id/schedule', async (req, res) => {
  try {
    const coursesCol = await coursesCollection()
    const course = await coursesCol.findOne({ id: req.params.id })
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    const allowed = await assertCourseEditPermission(course, req.auth)
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this course schedule' })
    }

    const schedule = normalizeSchedule(req.body?.schedule)
    await coursesCol.updateOne({ id: course.id }, { $set: { schedule: schedule ?? [] } })
    const updated = await coursesCol.findOne({ id: course.id })
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to update course schedule', error)
    return res.status(500).json({ success: false, error: 'Failed to update course schedule' })
  }
})

enrollmentRoutes.post('/schedule/preview', async (req, res) => {
  try {
    const role = req.auth?.role
    const tokenStudentId = req.auth?.studentId
    const isPrivileged = role === 'admin' || role === 'super-admin' || role === 'supervisor'
    const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId.trim() : ''
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'studentId is required' })
    }
    const isSelfUser = (role === 'student' || role === 'user') && tokenStudentId && tokenStudentId === studentId
    if (!isPrivileged && !isSelfUser) {
      return res.status(403).json({ success: false, error: 'Not authorized to preview schedules for this student' })
    }

    const proposedRaw = Array.isArray(req.body?.proposedSectionIds) ? req.body.proposedSectionIds : req.body?.sectionIds
    const sectionIds: string[] = Array.isArray(proposedRaw)
      ? proposedRaw.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : []

    const includeStatuses: Enrollment['status'][] = ['active', 'pending', 'pendingSupervisorApproval', 'pendingAdvisorApproval', 'pending_approval', 'waitlisted']
    const enrollmentsCol = await enrollmentsCollection()
    const coursesCol = await coursesCollection()

    const existingEnrollments = await enrollmentsCol.find({ studentId, status: { $in: includeStatuses } }).toArray()
    const existingCourseIds = Array.from(new Set(existingEnrollments.map((enr) => enr.courseId)))

    const allCourseIds = Array.from(new Set([...existingCourseIds, ...sectionIds]))
    const courses = allCourseIds.length > 0 ? await coursesCol.find({ id: { $in: allCourseIds } }).toArray() : []
    const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c as Course]))

    const sessions: Array<
      CourseScheduleEntry & {
        courseId: string
        courseTitle: string
        courseCode?: string
        status: Enrollment['status'] | 'proposed'
        source: 'existing' | 'proposed'
        professorName?: string
        branch?: string
        location?: string
        sectionId?: string
      }
    > = []

    existingEnrollments.forEach((enr) => {
      const course = courseMap.get(enr.courseId)
      if (!course?.schedule) return
      course.schedule.forEach((slot) => {
        sessions.push({
          ...slot,
          courseId: course.id,
          courseTitle: course.title,
          courseCode: course.code,
          sectionId: course.sectionId,
          professorName: course.professorName,
          branch: course.branch,
          location: course.branch ?? course.department ?? slot.location,
          status: enr.status,
          source: 'existing',
        })
      })
    })

    sectionIds.forEach((courseId) => {
      const course = courseMap.get(courseId)
      if (!course?.schedule) return
      course.schedule.forEach((slot) => {
        sessions.push({
          ...slot,
          courseId: course.id,
          courseTitle: course.title,
          courseCode: course.code,
          sectionId: course.sectionId,
          professorName: course.professorName,
          branch: course.branch,
          location: course.branch ?? course.department ?? slot.location,
          status: 'proposed',
          source: 'proposed',
        })
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
    console.error('Failed to preview enrollment schedule', error)
    return res.status(500).json({ success: false, error: 'Failed to preview schedule' })
  }
})


type DeletedCourseRecord = {
  id: string
  course: Course
  enrollments: Enrollment[]
  deletedAt: string
  deletedByUserId: string | null
  deletedByName: string | null
}

async function ensureDeletedCoursesStorage() {
  await runDbQuery(`
    create table if not exists public.deleted_courses (
      id text primary key,
      course jsonb not null,
      enrollments jsonb not null default '[]'::jsonb,
      deleted_at timestamptz not null default now(),
      deleted_by_user_id text null,
      deleted_by_name text null
    )
  `)
  await runDbQuery(`create index if not exists idx_deleted_courses_deleted_at on public.deleted_courses (deleted_at desc)`)
}

async function deletedCoursesCollection() {
  await ensureDeletedCoursesStorage()
  return getCollection<DeletedCourseRecord>('deleted_courses')
}

const SOFT_DELETE_RETENTION_MS = 48 * 60 * 60 * 1000 // 48 hours

enrollmentRoutes.delete('/meta/courses/:id', requireAdmin, async (req, res) => {
  try {
    const coursesCol = await coursesCollection()
    const enrollmentsCol = await enrollmentsCollection()
    const courseId = req.params.id

    const course = await coursesCol.findOne({ id: courseId })
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    const enrollments = await enrollmentsCol.find({ courseId }).toArray()

    const archiveCol = await deletedCoursesCollection()
    await archiveCol.insertOne({
      id: courseId,
      course,
      enrollments,
      deletedAt: new Date().toISOString(),
      deletedByUserId: req.auth?.userId ?? null,
      deletedByName: req.auth?.username ?? null,
    })

    if (enrollments.length > 0) {
      await Promise.all(enrollments.map((enrollment) => enrollmentsCol.deleteOne({ id: enrollment.id })))
    }
    const result = await coursesCol.deleteOne({ id: courseId })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    await writeAuditLog({
      action: 'course_deleted',
      entityType: 'course',
      entityId: courseId,
      details: {
        courseTitle: course.title,
        courseCode: course.code ?? course.displayId ?? null,
        professorId: course.professorId ?? null,
        enrollmentsRemoved: enrollments.length,
        removedEnrollmentIds: enrollments.map((enrollment) => enrollment.id),
        restorableUntil: new Date(Date.now() + SOFT_DELETE_RETENTION_MS).toISOString(),
      },
      auth: req.auth,
    })

    res.json({ success: true, data: { id: courseId, enrollmentsRemoved: enrollments.length } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete course' })
  }
})

enrollmentRoutes.get('/meta/courses/deleted', requireAdmin, async (req, res) => {
  try {
    const archiveCol = await deletedCoursesCollection()
    const cutoff = new Date(Date.now() - SOFT_DELETE_RETENTION_MS).toISOString()
    const entries = await archiveCol.find({ deletedAt: { $gte: cutoff } } as any).sort({ deletedAt: -1 }).toArray()
    return res.json({ success: true, data: entries })
  } catch (error) {
    console.error('Failed to fetch deleted courses', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch deleted courses' })
  }
})

enrollmentRoutes.post('/meta/courses/deleted/:id/restore', requireAdmin, async (req, res) => {
  try {
    const archiveCol = await deletedCoursesCollection()
    const entry = await archiveCol.findOne({ id: req.params.id })
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Deleted course not found or the recovery window has expired' })
    }

    const cutoff = Date.now() - SOFT_DELETE_RETENTION_MS
    if (new Date(entry.deletedAt).getTime() < cutoff) {
      return res.status(410).json({ success: false, error: 'Recovery window has expired for this course' })
    }

    const coursesCol = await coursesCollection()
    const existing = await coursesCol.findOne({ id: entry.course.id })
    if (existing) {
      return res.status(409).json({ success: false, error: 'A course with this id already exists again' })
    }

    await coursesCol.insertOne(entry.course)
    if (entry.enrollments.length > 0) {
      const enrollmentsCol = await enrollmentsCollection()
      await Promise.all(entry.enrollments.map((enrollment) => enrollmentsCol.insertOne(enrollment)))
    }
    await archiveCol.deleteOne({ id: entry.id })

    await writeAuditLog({
      action: 'course_restored',
      entityType: 'course',
      entityId: entry.course.id,
      details: {
        courseTitle: entry.course.title,
        enrollmentsRestored: entry.enrollments.length,
      },
      auth: req.auth,
    })

    return res.json({ success: true, data: { course: entry.course, enrollmentsRestored: entry.enrollments.length } })
  } catch (error) {
    console.error('Failed to restore course', error)
    return res.status(500).json({ success: false, error: 'Failed to restore course' })
  }
})

enrollmentRoutes.get('/meta/summary', async (req, res) => {
  try {
    if (req.auth?.role === 'student') {
      return res.status(403).json({ success: false, error: 'Not authorized to view enrollment summary' })
    }
    const enrollmentsCol = await enrollmentsCollection()
    const coursesCol = await coursesCollection()
    const studentsCol = await studentsCollection()
    const professorsCol = await professorsCollection()

    const [statusBuckets, totalEnrollments, courseCounts, activeStudentsCount, pipelineSum, courseRevenueAgg, professorRevenueAgg] = await Promise.all([
      enrollmentsCol
        .aggregate<{ _id: EnrollmentStatus; count: number }>([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .toArray(),
      enrollmentsCol.countDocuments(),
      enrollmentsCol
        .aggregate<{ _id: string; count: number }>([
          { $group: { _id: '$courseId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ])
        .toArray(),
      studentsCol.countDocuments({ status: 'active' }),
      enrollmentsCol
        .aggregate<{ total: number }>([
          { $match: { status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$price' } } },
        ])
        .toArray(),
      enrollmentsCol
        .aggregate<{ _id: string; revenue: number; enrollments: number; professorId?: string }>([
          { $match: { status: { $ne: 'cancelled' } } },
          {
            $group: {
              _id: '$courseId',
              revenue: { $sum: '$price' },
              enrollments: { $sum: 1 },
              professorId: { $first: '$professorId' },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
      enrollmentsCol
        .aggregate<{ _id: string; revenue: number; enrollments: number; courses: number }>([
          { $match: { status: { $ne: 'cancelled' } } },
          {
            $group: {
              _id: '$professorId',
              revenue: { $sum: '$price' },
              enrollments: { $sum: 1 },
              courses: { $addToSet: '$courseId' },
            },
          },
          { $project: { revenue: 1, enrollments: 1, courses: { $size: '$courses' } } },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
    ])

    const statusCounts = statusBuckets.reduce<Record<EnrollmentStatus, number>>((acc, bucket) => {
      acc[bucket._id] = bucket.count
      return acc
    }, { active: 0, pending: 0, pendingSupervisorApproval: 0, pendingAdvisorApproval: 0, pending_approval: 0, waitlisted: 0, completed: 0, cancelled: 0, rejected: 0, dropped: 0 })

    const courseMap = new Map<string, Course>()
    const professorMap = new Map<string, { id: string; firstName: string; lastName: string }>()
    const courseDocs = await coursesCol
      .find<Pick<Course, 'id' | 'title' | 'professorName' | 'capacity' | 'professorId'>>({
        id: { $in: Array.from(new Set([...courseCounts.map((c) => c._id), ...courseRevenueAgg.map((c) => c._id)])) },
      })
      .project({ id: 1, title: 1, professorName: 1, capacity: 1, professorId: 1 })
      .toArray()
    courseDocs.forEach((c) => courseMap.set(c.id, c as Course))

    const professorDocs = (await professorsCol
      .find({
        id: {
          $in: Array.from(
            new Set([
              ...courseRevenueAgg.map((c) => c.professorId).filter(Boolean) as string[],
              ...professorRevenueAgg.map((p) => p._id).filter(Boolean),
            ]),
          ),
        },
      })
      .project({ id: 1, firstName: 1, lastName: 1 })
      .toArray()) as Array<{ id: string; firstName: string; lastName: string }>
    professorDocs.forEach((p) => professorMap.set(p.id, p))

    const topCourses = courseCounts.map((c) => {
      const course = courseMap.get(c._id)
      return {
        courseId: c._id,
        title: course?.title ?? 'Unknown',
        professorName: course?.professorName ?? 'Unknown',
        capacity: course?.capacity ?? 0,
        count: c.count,
      }
    })

    const courseRevenues = courseRevenueAgg.map((c) => {
      const course = courseMap.get(c._id)
      const professor = c.professorId ? professorMap.get(c.professorId) : undefined
      return {
        courseId: c._id,
        title: course?.title ?? 'Unknown',
        professorId: c.professorId,
        professorName: professor ? `${professor.firstName} ${professor.lastName}` : course?.professorName ?? 'Unknown',
        enrollments: c.enrollments,
        revenue: c.revenue,
      }
    })

    const professorRevenues = professorRevenueAgg
      .filter((p) => p._id)
      .map((p) => {
        const professor = professorMap.get(p._id) ?? professorDocs.find((doc) => doc.id === p._id)
        const name = professor ? `${professor.firstName} ${professor.lastName}` : 'Unknown'
        return {
          professorId: p._id,
          professorName: name,
          revenue: p.revenue,
          enrollments: p.enrollments,
          courseCount: p.courses,
        }
      })

    res.json({
      success: true,
      data: {
        total: totalEnrollments,
        statusCounts,
        activeStudents: activeStudentsCount,
        tuitionPipeline: pipelineSum[0]?.total ?? 0,
        topCourses,
        courseRevenues,
        professorRevenues,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch enrollment summary' })
  }
})

enrollmentRoutes.get('/', async (req, res) => {
  try {
    const { studentId, courseId, page, pageSize } = req.query
    const enrollmentsCol = await enrollmentsCollection()
    const studentsCol = await studentsCollection()
    const coursesCol = await coursesCollection()

    const filter: Record<string, unknown> = { deletedAt: { $exists: false } }
    const tokenStudentId = req.auth?.studentId || req.auth?.userId
    const rawStatus = Array.isArray(req.query.status)
      ? req.query.status
      : typeof req.query.status === 'string'
        ? [req.query.status]
        : []
    const pendingOnly = String(req.query.pendingOnly ?? '').toLowerCase() === 'true'

    if (pendingOnly && rawStatus.length === 0) {
      rawStatus.push('pending', 'pendingSupervisorApproval', 'pendingAdvisorApproval', 'pending_approval')
    }

    const normalizedStatuses = rawStatus
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value && allowedStatuses.has(value as EnrollmentStatus)) as EnrollmentStatus[]
    if (normalizedStatuses.length === 1) {
      filter.status = normalizedStatuses[0]
    } else if (normalizedStatuses.length > 1) {
      filter.status = { $in: normalizedStatuses }
    }

    if (req.auth?.role === 'student') {
      if (!tokenStudentId) {
        return res.status(403).json({ success: false, error: 'Student identity missing in token' })
      }
      if (typeof studentId === 'string' && studentId.trim() && studentId.trim() !== tokenStudentId) {
        return res.status(403).json({ success: false, error: 'Students can only view their own enrollments' })
      }
      filter.studentId = tokenStudentId
    } else if (typeof studentId === 'string' && studentId.trim()) {
      filter.studentId = studentId.trim()
    }

    const courseIdValue = typeof courseId === 'string' ? courseId.trim() : ''
    const secondaryRoles = req.auth?.secondaryRoles ?? []
    const hasAdvisorAccess = req.auth?.role === 'advisor' || secondaryRoles.includes('advisor')
    if (req.auth?.role === 'professor' && !hasAdvisorAccess) {
      const professorId = req.auth.professorId
      if (!professorId) {
        return res.status(403).json({ success: false, error: 'Professor identity missing in token' })
      }
      filter.professorId = professorId
      if (courseIdValue) {
        filter.courseId = courseIdValue
      }
    } else if (courseIdValue) {
      filter.courseId = courseIdValue
    }

    const currentPage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1
    const currentPageSize = Number.isFinite(Number(pageSize)) && Number(pageSize) > 0 ? Number(pageSize) : 50

    const cursor = enrollmentsCol.find(filter as any).sort({ createdAt: -1 })
    const total = await cursor.count()
    const items = await cursor
      .skip((currentPage - 1) * currentPageSize)
      .limit(currentPageSize)
      .toArray()

    const studentIds = Array.from(new Set(items.map((item) => item.studentId)))
    const courseIds = Array.from(new Set(items.map((item) => item.courseId)))
    const studentDocs = await studentsCol
      .find({ id: { $in: studentIds } })
      .project({ id: 1, displayId: 1, firstName: 1, lastName: 1, email: 1, photo: 1, balance: 1 })
      .toArray()
    const studentMap = new Map(studentDocs.map((s) => [s.id, s as Student]))
    const courseDocs = await coursesCol
      .find({ id: { $in: courseIds } })
      .project({ id: 1, code: 1, displayId: 1, schedule: 1, branch: 1, location: 1 })
      .toArray()
    const courseMap = new Map(courseDocs.map((c) => [c.id, c as Course]))

    const hydrated = items.map((item) => {
      const course = courseMap.get(item.courseId)
      return {
        ...item,
        campus: item.campus ?? (course ? getCourseCampus(course) : 'Main Campus'),
        courseSchedule: course?.schedule ?? item.courseSchedule ?? [],
        courseCode: course?.code ?? item.displayId ?? item.courseId,
        courseBranch: course?.branch ?? course?.location ?? null,
        student:
          item.student ??
          (() => {
            const found = studentMap.get(item.studentId)
            return found
              ? {
                  id: found.id,
                  displayId: found.displayId,
                  firstName: found.firstName,
                  lastName: found.lastName,
                  email: found.email,
                  photo: found.photo,
                  balance: found.balance ?? 0,
                }
              : {
                  id: item.studentId,
                  displayId: item.studentId,
                  firstName: 'Unknown',
                  lastName: '',
                  email: '',
                  photo: '',
                  balance: 0,
                }
          })(),
      }
    })

    res.json({ success: true, data: { items: hydrated, total, page: currentPage, pageSize: currentPageSize } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch enrollments' })
  }
})

enrollmentRoutes.post('/self', async (req, res) => {
  const tokenStudentId = req.auth?.studentId || req.auth?.userId

  if (req.auth?.role !== 'student') {
    return res.status(403).json({ success: false, error: 'Student role required for self-enrollment' })
  }

  if (!tokenStudentId) {
    return res.status(403).json({ success: false, error: 'Student identity missing in token' })
  }

  const selfEnrollSchema = z.object({ courseId: z.string().trim().min(1), couponCode: z.string().trim().optional() })
  const parsedSelfBody = selfEnrollSchema.safeParse(req.body ?? {})
  if (!parsedSelfBody.success) {
    return res.status(400).json({ success: false, error: parsedSelfBody.error.issues[0]?.message ?? 'Course is required' })
  }
  const { courseId, couponCode } = parsedSelfBody.data

  try {
    await ensureEnrollmentIndexes()
    const coursesCol = await coursesCollection()
    const enrollmentsCol = await enrollmentsCollection()
    const accessProfile = req.auth?.accessProfile ?? {}
    const canEnrollAnytime = Boolean(accessProfile.allowEnrollmentAnytime)
    const canEnrollWhenClosed = canEnrollAnytime || Boolean(accessProfile.allowEnrollmentWhenClosed)
    const canEnrollOverCapacity =
      Boolean(accessProfile.allowEnrollmentOverCapacity) ||
      hasPermission(req.auth, 'override_capacity', 'enrollment:override-capacity')

    const { student } = await ensureStudent(tokenStudentId)
    const structure = await getAcademicStructure()
    if (structure.enrollmentOpen === false && !canEnrollWhenClosed) {
      return res.status(403).json({
        success: false,
        error: structure.enrollmentMessage || 'Enrollment is currently closed by administration',
      })
    }
    const course = await coursesCol.findOne({ id: courseId })
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    if (!isCourseConfiguredForStudents(course, structure, student)) {
      return res.status(403).json({ success: false, error: 'This class is not available for student enrollment' })
    }

    if (!doesCourseMatchMajor(course, student, structure)) {
      return res.status(403).json({ success: false, error: 'This class is not available for your major' })
    }

    const missingPrerequisites = await findMissingPrerequisites(student.id, course)
    if (missingPrerequisites.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Missing prerequisite courses: ${missingPrerequisites.join(', ')}`,
      })
    }

    const studentConflict = await hasStudentScheduleConflict(student.id, course)
    if (studentConflict) {
      const reason = studentConflict.reason === 'travel'
        ? 'Insufficient travel time between classes.'
        : `Schedule Conflict: This class overlaps with ${studentConflict.courseTitle} located at ${studentConflict.campus}.`
      return sendEnrollmentRejection(res, 409, {
        reasonCode: studentConflict.reason === 'travel' ? 'insufficient_travel_buffer' : 'schedule_overlap',
        reason,
        studentId: student.id,
        courseId: course.id,
        auth: req.auth,
        details: {
          conflictingCourseTitle: studentConflict.courseTitle,
          conflictingCampus: studentConflict.campus,
        },
      })
    }

    if (course.professorId && (await hasProfessorScheduleConflict(course.professorId, course))) {
      return sendEnrollmentRejection(res, 409, {
        reasonCode: 'resource_overlap',
        reason: 'Schedule conflict detected for this professor',
        studentId: student.id,
        courseId: course.id,
        auth: req.auth,
        details: {
          resourceType: 'professor',
          professorId: course.professorId,
        },
      })
    }

    const now = new Date()
    const opensAt = course.enrollmentOpensAt ? new Date(course.enrollmentOpensAt) : null
    const closesAt = course.enrollmentClosesAt ? new Date(course.enrollmentClosesAt) : null
    if (course.enrollmentOpen === false && !canEnrollWhenClosed) {
      const detail = course.enrollmentStatusNote ? `Enrollment is currently hidden for this course: ${course.enrollmentStatusNote}` : 'Enrollment is currently hidden for this course'
      return res.status(403).json({ success: false, error: detail })
    }
    // If enrollment is explicitly open, ignore future opensAt. Otherwise enforce window.
    if (course.enrollmentOpen !== true && opensAt && now.getTime() < opensAt.getTime() && !canEnrollAnytime) {
      return res.status(403).json({ success: false, error: 'Enrollment has not opened yet for this course' })
    }
    if (closesAt && course.enrollmentOpen !== true && now.getTime() > closesAt.getTime() && !canEnrollAnytime) {
      return res.status(403).json({ success: false, error: 'Enrollment window has closed for this course' })
    }

    const existing = await enrollmentsCol.findOne({
      courseId: course.id,
      studentId: student.id,
      ...(course.semesterId ? { semesterId: course.semesterId } : { semester: getCourseSemester(course) }),
      status: { $nin: ['cancelled', 'rejected', 'dropped'] },
    })
    if (existing) {
      return res.status(409).json({ success: false, error: 'You are already enrolled or pending for this course' })
    }

    const maxActiveCourses = 5
    const currentActiveCount = await enrollmentsCol.countDocuments({
      studentId: student.id,
      status: { $in: scheduleRelevantStatuses },
    })

    if (currentActiveCount >= maxActiveCourses) {
      return res.status(400).json({
        success: false,
        error: `You already have ${currentActiveCount} active or pending courses. The limit is ${maxActiveCourses}.`,
      })
    }

    const couponResult = await applyCoupon(course.price, couponCode)
    const paymentStatus = getEnrollmentPaymentStatus(student)
    const requestedStatus: EnrollmentStatus = paymentStatus === 'paid' ? 'pendingAdvisorApproval' : 'pending_approval'
    let created
    try {
      created = await createEnrollmentWithCapacityLock({
        student,
        course,
        status: requestedStatus,
        price: couponResult.price,
        basePrice: course.price,
        couponCode: couponResult.coupon,
        discountPercent: couponResult.discountPercent,
        discountAmount: couponResult.discountAmount,
        auth: req.auth,
        canOverrideCapacity: canEnrollOverCapacity,
      })
    } catch (error) {
      if (isUniqueViolation(error)) {
        return res.status(409).json({ success: false, error: 'You are already enrolled or pending for this course' })
      }
      throw error
    }

    const enrollment = created.enrollment

    await notifyStudent(
      student.id,
      created.waitlisted ? `Waitlist confirmed: ${course.title}` : `Enrollment request submitted: ${course.title}`,
      created.waitlisted
        ? 'The course is currently full. Your request has been placed on the waitlist.'
        : paymentStatus === 'paid'
        ? 'Your request is pending advisor approval.'
        : 'Your enrollment cannot be approved until payment is completed.',
      `${student.firstName} ${student.lastName}`,
    )

    await writeAuditLog({
      action: created.waitlisted ? 'enrollment_waitlisted' : 'enrollment_created',
      entityType: 'enrollment',
      entityId: enrollment.id,
      details: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        semester: enrollment.semester,
        status: enrollment.status,
        price: enrollment.price,
      },
      auth: req.auth,
    })

    res.status(201).json({
      success: true,
      data: {
        ...enrollment,
        availableSeats: created.waitlisted ? 0 : Math.max(created.remainingSeats - 1, 0),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Coupon code is not valid') {
      return res.status(400).json({ success: false, error: error.message })
    }
    if (error instanceof Error && error.message === 'Student not found') {
      return res.status(404).json({ success: false, error: 'Student profile missing. Please sign in again or contact an administrator.' })
    }
    if (error instanceof Error && (
      error.message.startsWith('Missing prerequisite courses:') ||
      error.message.startsWith('Schedule Conflict:') ||
      error.message === 'Insufficient travel time between classes.'
    )) {
      if (error.message.startsWith('Schedule Conflict:') || error.message === 'Insufficient travel time between classes.') {
        await recordEnrollmentRejection({
          reasonCode: error.message === 'Insufficient travel time between classes.' ? 'insufficient_travel_buffer' : 'schedule_overlap',
          reason: error.message,
          studentId: tokenStudentId,
          courseId,
          auth: req.auth,
        })
      }
      return res.status(409).json({ success: false, error: error.message })
    }
    res.status(500).json({ success: false, error: 'Failed to submit enrollment request' })
  }
})

enrollmentRoutes.delete('/self/:id', async (req, res) => {
  const tokenStudentId = req.auth?.studentId || req.auth?.userId
  if (req.auth?.role !== 'student') {
    return res.status(403).json({ success: false, error: 'Student role required' })
  }
  if (!tokenStudentId) {
    return res.status(403).json({ success: false, error: 'Student identity missing in token' })
  }
  try {
    const enrollmentsCol = await enrollmentsCollection()
    const studentsCol = await studentsCollection()
    const paymentsCol = await paymentsCollection()

    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    // Verify the enrollment belongs to the requesting student
    const { student } = await ensureStudent(tokenStudentId)
    if (enrollment.studentId !== student.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to cancel this enrollment' })
    }

    const cancellableStatuses = ['pending', 'pendingAdvisorApproval', 'pending_approval', 'pendingSupervisorApproval', 'waitlisted']
    if (!cancellableStatuses.includes(enrollment.status)) {
      return res.status(400).json({ success: false, error: `Cannot cancel an enrollment with status "${enrollment.status}"` })
    }

    await enrollmentsCol.updateOne({ id: enrollment.id }, { $set: { status: 'cancelled', updatedAt: new Date().toISOString(), ...enrollmentActorPatch(req.auth) } })

    // Refund balance if a price was charged
    if (enrollment.tuitionCharged && enrollment.price && enrollment.price > 0) {
      await adjustStudentBalance({
        student,
        studentsCol,
        paymentsCol,
        delta: -Math.abs(enrollment.price),
        note: `Self-cancellation refund for ${enrollment.courseTitle}`,
        source: 'enrollment',
        referenceId: enrollment.id,
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        courseTitle: enrollment.courseTitle,
        auth: req.auth,
      })
    }

    await promoteWaitlistedEnrollment(enrollment.courseId)
    await writeAuditLog({
      action: 'enrollment_cancelled',
      entityType: 'enrollment',
      entityId: enrollment.id,
      details: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        cancelledByRole: req.auth?.role ?? null,
      },
      auth: req.auth,
    })

    res.json({ success: true, data: { ...enrollment, status: 'cancelled' } })
  } catch (error) {
    console.error('Self-cancel enrollment failed', error)
    res.status(500).json({ success: false, error: 'Failed to cancel enrollment' })
  }
})

enrollmentRoutes.post('/:id/approve-payment', async (req, res) => {
  try {
    const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'supervisor' || req.auth?.role === 'advisor'
    if (!isPrivileged) {
      return res.status(403).json({ success: false, error: 'Admin, supervisor, or advisor required' })
    }
    const enrollmentsCol = await enrollmentsCollection()
    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }
    if (enrollment.status !== 'pending_approval') {
      return res.status(409).json({ success: false, error: 'Only pending approval enrollments can be approved' })
    }
    const studentsCol = await studentsCollection()
    const student = await studentsCol.findOne({ id: enrollment.studentId })
    if (!isPaymentCleared(student)) {
      return res.status(409).json({ success: false, error: 'Payment is still pending for this student' })
    }
    const approvedAt = new Date().toISOString()
    await enrollmentsCol.updateOne(
      { id: enrollment.id },
      {
        $set: {
          status: 'pendingAdvisorApproval',
          paymentVerified: true,
          paymentStatus: 'paid',
          approvedByUserId: req.auth?.userId ?? null,
          approvedByName: req.auth?.username ?? null,
          approvedAt,
          ...enrollmentActorPatch(req.auth),
        },
      },
    )
    const updated = await enrollmentsCol.findOne({ id: enrollment.id })
    await notifyStudent(
      enrollment.studentId,
      `Payment verified: ${enrollment.courseTitle}`,
      'Your payment has been verified. Your enrollment is now pending advisor approval.',
      req.auth?.username ?? req.auth?.userId ?? 'system',
    )
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to approve enrollment (payment)', error)
    return res.status(500).json({ success: false, error: 'Failed to approve enrollment' })
  }
})

enrollmentRoutes.post('/:id/reject-payment', async (req, res) => {
  try {
    const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'supervisor' || req.auth?.role === 'advisor'
    if (!isPrivileged) {
      return res.status(403).json({ success: false, error: 'Admin, supervisor, or advisor required' })
    }
    const enrollmentsCol = await enrollmentsCollection()
    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }
    if (enrollment.status !== 'pending_approval') {
      return res.status(409).json({ success: false, error: 'Only pending approval enrollments can be rejected' })
    }
    await enrollmentsCol.updateOne(
      { id: enrollment.id },
      {
        $set: {
          status: 'rejected',
          paymentVerified: false,
          paymentStatus: 'payment_required',
          approvedByUserId: req.auth?.userId ?? null,
          approvedByName: req.auth?.username ?? null,
          approvedAt: new Date().toISOString(),
          ...enrollmentActorPatch(req.auth),
        },
      },
    )
    const updated = await enrollmentsCol.findOne({ id: enrollment.id })
    await notifyStudent(
      enrollment.studentId,
      `Enrollment rejected: ${enrollment.courseTitle}`,
      'Payment was not verified. Please review your balance and try again.',
      req.auth?.username ?? req.auth?.userId ?? 'system',
    )
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to reject enrollment (payment)', error)
    return res.status(500).json({ success: false, error: 'Failed to reject enrollment' })
  }
})

enrollmentRoutes.post('/:id/request-advisor-approval', async (req, res) => {
  try {
    const enrollmentsCol = await enrollmentsCollection()
    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    if (enrollment.status !== 'pendingSupervisorApproval') {
      return res.status(409).json({ success: false, error: 'Only supervisor-pending enrollments can be sent to advisor approval' })
    }

    const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'super-admin' || req.auth?.role === 'supervisor'
    const professorOwner = isProfessorOwner(enrollment, req.auth)
    const isSupervisorProfessor = await isStudentSupervisor(enrollment, req.auth)
    if (!isPrivileged && !professorOwner && !isSupervisorProfessor) {
      return res.status(403).json({ success: false, error: 'Not authorized to forward this enrollment' })
    }

    const updatedAt = new Date().toISOString()
    await enrollmentsCol.updateOne({ id: enrollment.id }, { $set: { status: 'pendingAdvisorApproval', updatedAt, ...enrollmentActorPatch(req.auth) } })

    const updated = await enrollmentsCol.findOne({ id: enrollment.id })
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to request advisor approval', error)
    return res.status(500).json({ success: false, error: 'Failed to request advisor approval' })
  }
})

enrollmentRoutes.post('/:id/advisor-approve', async (req, res) => {
  try {
    const enrollmentsCol = await enrollmentsCollection()
    const studentsCol = await studentsCollection()

    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    if (enrollment.status !== 'pendingAdvisorApproval' && enrollment.status !== 'pending_approval') {
      return res.status(409).json({ success: false, error: 'Only pending advisor or payment enrollments can be approved' })
    }

    const approveSecondaryRoles = req.auth?.secondaryRoles ?? []
    const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'super-admin' || req.auth?.role === 'advisor' || req.auth?.role === 'supervisor' || approveSecondaryRoles.includes('advisor') || approveSecondaryRoles.includes('admin') || approveSecondaryRoles.includes('super-admin') || approveSecondaryRoles.includes('supervisor')
    const professorOwner = isProfessorOwner(enrollment, req.auth)
    const isSupervisorProfessor = await isStudentSupervisor(enrollment, req.auth)
    if (!isPrivileged && !professorOwner && !isSupervisorProfessor) {
      return res.status(403).json({ success: false, error: 'Not authorized to approve this enrollment' })
    }

    const studentRecord = await studentsCol.findOne({ id: enrollment.studentId })
    if (!studentRecord) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }
    const financialClearance = await checkBalance(enrollment.studentId, Number(enrollment.price ?? 0))
    if (!financialClearance.cleared) {
      const updatedAt = new Date().toISOString()
      await enrollmentsCol.updateOne(
        { id: enrollment.id },
        {
          $set: {
            paymentVerified: false,
            paymentStatus: 'payment_required',
            latestAdvisorMessage: 'Financial Clearance Required.',
            latestAdvisorMessageAt: updatedAt,
            updatedAt,
            ...enrollmentActorPatch(req.auth),
          },
        },
      )
      return sendEnrollmentRejection(res, 409, {
        reasonCode: 'financial_blocking',
        reason: 'Financial Clearance Required.',
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        enrollmentId: enrollment.id,
        auth: req.auth,
        details: {
          requestedStatus: 'active',
          price: Number(enrollment.price ?? 0),
        },
      })
    }

    const updatedAt = new Date().toISOString()

    await enrollmentsCol.updateOne(
      { id: enrollment.id },
      {
        $set: {
          status: 'active',
          updatedAt,
          tuitionCharged: enrollment.tuitionCharged ?? false,
          chargedAt: enrollment.chargedAt ?? null,
          paymentVerified: true,
          paymentStatus: 'paid',
          approvedByUserId: req.auth?.userId ?? null,
          approvedByName: req.auth?.username ?? null,
          approvedByRole: req.auth?.role ?? null,
          approvedAt: updatedAt,
          ...enrollmentActorPatch(req.auth),
          rejectedByUserId: null,
          rejectedByName: null,
          rejectedByRole: null,
          rejectedAt: null,
          latestAdvisorMessage: null,
          latestAdvisorMessageAt: null,
        },
      },
    )

    const updated = await enrollmentsCol.findOne({ id: enrollment.id })
    await notifyStudent(
      enrollment.studentId,
      `Enrollment approved: ${enrollment.courseTitle}`,
      'Your enrollment has been approved and completed.',
      req.auth?.username ?? req.auth?.userId ?? 'system',
    )
    await writeAuditLog({
      action: 'enrollment_approved',
      entityType: 'enrollment',
      entityId: enrollment.id,
      details: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        approvedAt: updatedAt,
      },
      auth: req.auth,
    })
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to approve enrollment (advisor)', error)
    return res.status(500).json({ success: false, error: 'Failed to approve enrollment' })
  }
})

enrollmentRoutes.post('/:id/advisor-reject', async (req, res) => {
  try {
    const enrollmentsCol = await enrollmentsCollection()
    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    if (enrollment.status !== 'pendingAdvisorApproval' && enrollment.status !== 'pending_approval') {
      return res.status(409).json({ success: false, error: 'Only pending advisor or payment enrollments can be rejected' })
    }

    const rejectSecondaryRoles = req.auth?.secondaryRoles ?? []
    const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'advisor' || req.auth?.role === 'supervisor' || rejectSecondaryRoles.includes('advisor') || rejectSecondaryRoles.includes('admin') || rejectSecondaryRoles.includes('supervisor')
    const professorOwner = isProfessorOwner(enrollment, req.auth)
    const isSupervisorProfessor = await isStudentSupervisor(enrollment, req.auth)
    if (!isPrivileged && !professorOwner && !isSupervisorProfessor) {
      return res.status(403).json({ success: false, error: 'Not authorized to reject this enrollment' })
    }

    const updatedAt = new Date().toISOString()
    await enrollmentsCol.updateOne(
      { id: enrollment.id },
      {
        $set: {
          status: 'rejected',
          updatedAt,
          rejectedByUserId: req.auth?.userId ?? null,
          rejectedByName: req.auth?.username ?? null,
          rejectedByRole: req.auth?.role ?? null,
          rejectedAt: updatedAt,
          approvedByUserId: null,
          approvedByName: null,
          approvedByRole: null,
          approvedAt: null,
          ...enrollmentActorPatch(req.auth),
        },
      },
    )

    const updated = await enrollmentsCol.findOne({ id: enrollment.id })
    await notifyStudent(
      enrollment.studentId,
      `Enrollment rejected: ${enrollment.courseTitle}`,
      'Your advisor rejected this enrollment request.',
      req.auth?.username ?? req.auth?.userId ?? 'system',
    )
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to reject enrollment (advisor)', error)
    return res.status(500).json({ success: false, error: 'Failed to reject enrollment' })
  }
})

enrollmentRoutes.post('/:id/advisor-message', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' })
    }

    const isPrivileged = req.auth?.role === 'admin' || req.auth?.role === 'super-admin' || req.auth?.role === 'advisor' || req.auth?.role === 'supervisor'
    if (!isPrivileged) {
      return res.status(403).json({ success: false, error: 'Advisor access required' })
    }

    const enrollmentsCol = await enrollmentsCollection()
    const studentsCol = await studentsCollection()
    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    const student = await studentsCol.findOne({ id: enrollment.studentId })
    const paymentStatus = getEnrollmentPaymentStatus(student)
    const updatedAt = new Date().toISOString()

    await enrollmentsCol.updateOne(
      { id: enrollment.id },
      {
        $set: {
          latestAdvisorMessage: message,
          latestAdvisorMessageAt: updatedAt,
          paymentStatus,
          updatedAt,
          ...enrollmentActorPatch(req.auth),
        },
      },
    )

    const updated = await enrollmentsCol.findOne({ id: enrollment.id })
    await notifyStudent(
      enrollment.studentId,
      `Advisor message: ${enrollment.courseTitle}`,
      message,
      req.auth?.username ?? req.auth?.userId ?? 'system',
    )
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to send advisor message', error)
    return res.status(500).json({ success: false, error: 'Failed to send advisor message' })
  }
})

enrollmentRoutes.put('/:id/grades', async (req, res) => {
  try {
    const enrollmentsCol = await enrollmentsCollection()
    const existing = await enrollmentsCol.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    const professorOwner = isProfessorOwner(existing, req.auth)
    const canEnterGrades = professorOwner && hasPermission(req.auth, 'ENTER_GRADES')
    const canFinalizeGrades = req.auth?.role === 'registrar' || req.auth?.role === 'admin' || req.auth?.role === 'super-admin'
    const finalize = req.body.finalize === true

    if (existing.isFinalized) {
      return res.status(403).json({ success: false, error: 'Grades are finalized and cannot be modified' })
    }

    const gradePayloadPresent =
      req.body.gradeMidterm !== undefined ||
      req.body.gradeFinal !== undefined ||
      req.body.gradeProject !== undefined ||
      req.body.gradeParticipation !== undefined ||
      req.body.gradeTotal !== undefined ||
      req.body.grade !== undefined ||
      req.body.letterGrade !== undefined

    if (gradePayloadPresent && !canEnterGrades) {
      return res.status(403).json({ success: false, error: 'Only the assigned professor may enter grades for this course.' })
    }

    if (finalize && !canFinalizeGrades) {
      return res.status(403).json({ success: false, error: 'Only the registrar can finalize grades.' })
    }

    const midtermScore = req.body.gradeMidterm !== undefined ? numericGrade(req.body.gradeMidterm) : existing.gradeMidterm ?? null
    const finalScore = req.body.gradeFinal !== undefined ? numericGrade(req.body.gradeFinal) : existing.gradeFinal ?? null
    const projectScore = req.body.gradeProject !== undefined ? numericGrade(req.body.gradeProject) : existing.gradeProject ?? null
    const participationScore = req.body.gradeParticipation !== undefined ? numericGrade(req.body.gradeParticipation) : existing.gradeParticipation ?? null

    const validationError = [
      validateGradeComponent('Midterm grade', midtermScore),
      validateGradeComponent('Final grade', finalScore),
      validateGradeComponent('Project grade', projectScore),
      validateGradeComponent('Participation grade', participationScore),
    ].find(Boolean)
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError })
    }

    let totalScore = req.body.gradeTotal !== undefined ? numericGrade(req.body.gradeTotal) : existing.gradeTotal ?? null
    if (totalScore === null) {
      const parts = [midtermScore, finalScore, projectScore, participationScore].filter((v) => v !== null) as number[]
      if (parts.length > 0) {
        totalScore = Number(parts.reduce((acc, v) => acc + v, 0).toFixed(2))
      }
    }

    const totalValidation = validateGradeComponent('Total grade', totalScore)
    if (totalValidation) {
      return res.status(400).json({ success: false, error: totalValidation })
    }

    let letter: string | null = null
    if (totalScore !== null) {
      letter = computeLetter(totalScore)
    } else if (req.body.letterGrade !== undefined) {
      letter = req.body.letterGrade ?? null
    } else {
      letter = existing.letterGrade ?? null
    }
    const now = new Date().toISOString()
    const statusValue: EnrollmentStatus = allowedStatuses.has(req.body.status as EnrollmentStatus)
      ? (req.body.status as EnrollmentStatus)
      : existing.status

    const beforeState = buildGradeSnapshot(existing)
    const updates: Partial<Enrollment> & { updatedAt: string } = {
      gradeMidterm: midtermScore,
      gradeFinal: finalScore,
      gradeProject: projectScore,
      gradeParticipation: participationScore,
      gradeTotal: totalScore,
      letterGrade: letter,
      grade: req.body.grade ?? existing.grade ?? null,
      status: statusValue,
      gradeUpdatedAt: now,
      updatedAt: now,
      ...enrollmentActorPatch(req.auth),
    }

    if (finalize) {
      updates.isFinalized = true
      updates.gradesFinalizedAt = now
      updates.gradesFinalizedBy = req.auth?.userId ?? null
    }

    await enrollmentsCol.updateOne({ id: existing.id }, { $set: updates })
    const updated = await enrollmentsCol.findOne({ id: existing.id })
    const afterState = buildGradeSnapshot(updated ?? { ...existing, ...updates })
    await recordGradeAudit({
      enrollmentId: existing.id,
      studentId: existing.studentId,
      courseId: existing.courseId,
      beforeState,
      afterState,
      auth: req.auth,
    })
    await writeAuditLog({
      action: finalize ? 'grades_finalized' : 'grades_updated',
      entityType: 'enrollment',
      entityId: existing.id,
      details: {
        studentId: existing.studentId,
        courseId: existing.courseId,
        beforeState,
        afterState,
      },
      auth: req.auth,
    })
    return res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    console.error('Failed to update grades', error)
    return res.status(500).json({ success: false, error: 'Failed to update grades' })
  }
})

enrollmentRoutes.post('/', async (req, res) => {
  const parsedBody = createEnrollmentSchema.safeParse(req.body ?? {})
  if (!parsedBody.success) {
    return res.status(400).json({ success: false, error: parsedBody.error.issues[0]?.message ?? 'Invalid enrollment payload' })
  }
  const { studentId, courseId, professorId, status, startDate, endDate, price, couponCode } = parsedBody.data

  const role = req.auth?.role
  const tokenStudentId = req.auth?.studentId
  const isPrivileged = role === 'admin' || role === 'super-admin' || role === 'supervisor'
  const isSelfUser = role === 'user' && tokenStudentId

  if (!isPrivileged && !isSelfUser) {
    return res.status(403).json({ success: false, error: 'Not authorized to create enrollments' })
  }

  if (!studentId || !courseId) {
    return res.status(400).json({ success: false, error: 'Student and course are required' })
  }

  if (isSelfUser && studentId !== tokenStudentId) {
    return res.status(403).json({ success: false, error: 'Users may only enroll their own linked student account' })
  }

  try {
    await ensureEnrollmentIndexes()
    const coursesCol = await coursesCollection()
    const profCol = await professorsCollection()
    const canOverrideCapacity = hasPermission(req.auth, 'override_capacity', 'enrollment:override-capacity')

    const { student } = await ensureStudent(studentId)
    const structure = await getAcademicStructure()
    if (!isPrivileged && structure.enrollmentOpen === false) {
      return res.status(403).json({
        success: false,
        error: structure.enrollmentMessage || 'Enrollment is currently closed by administration',
      })
    }
    const course = await coursesCol.findOne({ id: courseId })
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    if (!isPrivileged && !isCourseConfiguredForStudents(course, structure, student)) {
      return res.status(403).json({ success: false, error: 'This class is not available for student enrollment' })
    }

    if (!isPrivileged && !doesCourseMatchMajor(course, student, structure)) {
      return res.status(403).json({ success: false, error: 'This class is not available for this student major' })
    }

    const missingPrerequisites = await findMissingPrerequisites(student.id, course)
    if (missingPrerequisites.length > 0) {
      return res.status(409).json({ success: false, error: `Missing prerequisite courses: ${missingPrerequisites.join(', ')}` })
    }

    const studentConflict = await hasStudentScheduleConflict(student.id, course)
    if (studentConflict) {
      const reason = studentConflict.reason === 'travel'
        ? 'Insufficient travel time between classes.'
        : `Schedule Conflict: This class overlaps with ${studentConflict.courseTitle} located at ${studentConflict.campus}.`
      return sendEnrollmentRejection(res, 409, {
        reasonCode: studentConflict.reason === 'travel' ? 'insufficient_travel_buffer' : 'schedule_overlap',
        reason,
        studentId: student.id,
        courseId: course.id,
        auth: req.auth,
        details: {
          conflictingCourseTitle: studentConflict.courseTitle,
          conflictingCampus: studentConflict.campus,
        },
      })
    }

    if (course.professorId && (await hasProfessorScheduleConflict(course.professorId, course))) {
      return sendEnrollmentRejection(res, 409, {
        reasonCode: 'resource_overlap',
        reason: 'Schedule conflict detected for this professor',
        studentId: student.id,
        courseId: course.id,
        auth: req.auth,
        details: {
          resourceType: 'professor',
          professorId: course.professorId,
        },
      })
    }

    if (!isEnrollmentWindowOpen(course)) {
      return res.status(409).json({ success: false, error: 'Enrollment is closed for this course' })
    }

    const enrollmentsCol = await enrollmentsCollection()
    const existingEnrollment = await enrollmentsCol.findOne({
      studentId: student.id,
      courseId: course.id,
      ...(course.semesterId ? { semesterId: course.semesterId } : { semester: getCourseSemester(course) }),
      status: { $nin: ['cancelled', 'rejected', 'dropped'] },
    })
    if (existingEnrollment) {
      return res.status(409).json({ success: false, error: 'Enrollment already exists for this student and course' })
    }

    const professorIdValue = professorId ?? course.professorId
    let professorName = course.professorName
    if (professorIdValue) {
      const professor = await profCol.findOne({ id: professorIdValue })
      if (!professor) {
        return res.status(404).json({ success: false, error: 'Professor not found' })
      }
      professorName = `${professor.firstName} ${professor.lastName}`
    }

    const paymentStatus = getEnrollmentPaymentStatus(student)
    const defaultStatus: EnrollmentStatus = paymentStatus === 'paid' ? 'pendingAdvisorApproval' : 'pending_approval'
    const statusValue: EnrollmentStatus = allowedStatuses.has(status as EnrollmentStatus)
      ? (status as EnrollmentStatus)
      : defaultStatus

    const basePrice = course.price
    const overridePrice = price !== undefined ? Number(price) : undefined
    if (overridePrice !== undefined && (!Number.isFinite(overridePrice) || overridePrice < 0)) {
      return res.status(400).json({ success: false, error: 'Price must be zero or greater' })
    }

    const couponResult = await applyCoupon(basePrice, couponCode)
    if (couponResult.coupon && overridePrice !== undefined) {
      return res.status(400).json({ success: false, error: 'Cannot combine coupon with manual tuition override' })
    }

    const priceToUse = overridePrice ?? couponResult.price
    if ((statusValue === 'active' || statusValue === 'completed') && !(await checkBalance(student.id, priceToUse)).cleared) {
      return sendEnrollmentRejection(res, 409, {
        reasonCode: 'financial_blocking',
        reason: 'Financial Clearance Required.',
        studentId: student.id,
        courseId: course.id,
        auth: req.auth,
        details: {
          requestedStatus: statusValue,
          price: priceToUse,
        },
      })
    }

    let created
    try {
      created = await createEnrollmentWithCapacityLock({
        student,
        course: {
          ...course,
          professorId: professorIdValue ?? course.professorId,
          professorName,
          startDate: startDate || course.startDate,
          endDate: endDate || course.endDate,
        },
        status: statusValue,
        price: priceToUse,
        basePrice,
        couponCode: couponResult.coupon,
        discountPercent: couponResult.discountPercent,
        discountAmount: couponResult.discountAmount,
        auth: req.auth,
        canOverrideCapacity,
      })
    } catch (error) {
      if (isUniqueViolation(error)) {
        return res.status(409).json({ success: false, error: 'Enrollment already exists for this student and course' })
      }
      throw error
    }

    const enrollment = created.enrollment

    await notifyStudent(
      student.id,
      created.waitlisted
        ? `Waitlist confirmed: ${course.title}`
        : statusValue === 'active'
          ? `Enrollment successful: ${course.title}`
          : `Enrollment request submitted: ${course.title}`,
      created.waitlisted
        ? `The course is full, so the student has been added to the waitlist for ${course.title}.`
        : paymentStatus === 'paid'
        ? `Your enrollment for ${course.title} is now ${statusValue === 'active' ? 'approved' : 'pending advisor approval'}.`
        : 'Your enrollment cannot be approved until payment is completed.',
      `${student.firstName} ${student.lastName}`,
    )
    await writeAuditLog({
      action: created.waitlisted ? 'enrollment_waitlisted' : 'enrollment_created',
      entityType: 'enrollment',
      entityId: enrollment.id,
      details: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        semester: enrollment.semester,
        status: enrollment.status,
        createdByRole: req.auth?.role ?? null,
      },
      auth: req.auth,
    })

    res.status(201).json({ success: true, data: enrollment })
  } catch (error) {
    if (error instanceof Error && error.message === 'Coupon code is not valid') {
      return res.status(400).json({ success: false, error: error.message })
    }
    if (error instanceof Error && (
      error.message.startsWith('Missing prerequisite courses:') ||
      error.message.startsWith('Schedule Conflict:') ||
      error.message === 'Insufficient travel time between classes.'
    )) {
      if (error.message.startsWith('Schedule Conflict:') || error.message === 'Insufficient travel time between classes.') {
        await recordEnrollmentRejection({
          reasonCode: error.message === 'Insufficient travel time between classes.' ? 'insufficient_travel_buffer' : 'schedule_overlap',
          reason: error.message,
          studentId,
          courseId,
          auth: req.auth,
        })
      }
      return res.status(409).json({ success: false, error: error.message })
    }
    res.status(500).json({ success: false, error: 'Failed to create enrollment' })
  }
})

enrollmentRoutes.post('/:id/approve', async (req, res) => {
  try {
    const enrollmentsCol = await enrollmentsCollection()
    const studentsCol = await studentsCollection()

    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    const isAdmin = req.auth?.role === 'admin' || req.auth?.role === 'super-admin' || req.auth?.role === 'supervisor'
    const isAdvisor = req.auth?.role === 'advisor'
    const isProfessorOwner = req.auth?.role === 'professor' && req.auth.professorId && req.auth.professorId === enrollment.professorId

    if (!isAdmin && !isAdvisor && !isProfessorOwner) {
      return res.status(403).json({ success: false, error: 'Not authorized to approve this enrollment' })
    }

    if (enrollment.status === 'active') {
      return res.json({ success: true, data: enrollment })
    }

    const studentRecord = await studentsCol.findOne({ id: enrollment.studentId })
    if (!studentRecord) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const financialClearance = await checkBalance(enrollment.studentId, Number(enrollment.price ?? 0))
    if (!financialClearance.cleared) {
      return sendEnrollmentRejection(res, 409, {
        reasonCode: 'financial_blocking',
        reason: 'Financial Clearance Required.',
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        enrollmentId: enrollment.id,
        auth: req.auth,
        details: {
          requestedStatus: 'active',
          price: Number(enrollment.price ?? 0),
        },
      })
    }

    const decisionAt = new Date().toISOString()
    const updates: Partial<Enrollment> & { updatedAt: string } = {
      status: 'active',
      updatedAt: decisionAt,
      tuitionCharged: enrollment.tuitionCharged ?? false,
      chargedAt: enrollment.chargedAt ?? null,
      paymentVerified: true,
      paymentStatus: 'paid',
      approvedByUserId: req.auth?.userId ?? null,
      approvedByName: req.auth?.username ?? null,
      approvedByRole: req.auth?.role ?? null,
      approvedAt: decisionAt,
      ...enrollmentActorPatch(req.auth),
      rejectedByUserId: null,
      rejectedByName: null,
      rejectedByRole: null,
      rejectedAt: null,
    }

    await enrollmentsCol.updateOne({ id: enrollment.id }, { $set: updates })
    const updated = await enrollmentsCol.findOne({ id: enrollment.id })

    const responsePayload = {
      ...(updated ?? { ...enrollment, ...updates }),
      student: {
        id: studentRecord.id,
        displayId: studentRecord.displayId,
        firstName: studentRecord.firstName,
        lastName: studentRecord.lastName,
        email: studentRecord.email,
        photo: studentRecord.photo,
        balance: studentRecord.balance ?? 0,
      },
    }

    await writeAuditLog({
      action: 'enrollment_approved',
      entityType: 'enrollment',
      entityId: enrollment.id,
      details: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        approvedAt: decisionAt,
      },
      auth: req.auth,
    })

    if (studentRecord.email) {
      void sendMail({
        to: studentRecord.email,
        subject: 'Enrollment approved',
        text: `Your enrollment in ${enrollment.courseTitle ?? enrollment.courseId} has been approved.`,
      })
    }

    res.json({ success: true, data: responsePayload })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve enrollment' })
  }
})

enrollmentRoutes.get('/:id', async (req, res) => {
  try {
    const tokenStudentId = req.auth?.studentId || req.auth?.userId
    const enrollmentsCol = await enrollmentsCollection()
    const studentsCol = await studentsCollection()
    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    if (req.auth?.role === 'student') {
      if (!tokenStudentId) {
        return res.status(403).json({ success: false, error: 'Student identity missing in token' })
      }
      if (enrollment.studentId !== tokenStudentId) {
        return res.status(403).json({ success: false, error: 'Students can only view their own enrollments' })
      }
    }

    const student = await studentsCol.findOne({ id: enrollment.studentId })
    const hydrated = student
      ? {
          ...enrollment,
          student: {
            id: student.id,
            displayId: student.displayId,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            photo: student.photo,
            balance: student.balance ?? 0,
          },
        }
      : enrollment

    res.json({ success: true, data: hydrated })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch enrollment' })
  }
})

enrollmentRoutes.get('/:id/waitlist-position', async (req, res) => {
  try {
    const tokenStudentId = req.auth?.studentId || req.auth?.userId
    const enrollmentsCol = await enrollmentsCollection()
    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    if (req.auth?.role === 'student') {
      if (!tokenStudentId) {
        return res.status(403).json({ success: false, error: 'Student identity missing in token' })
      }
      if (enrollment.studentId !== tokenStudentId) {
        return res.status(403).json({ success: false, error: 'Students can only view their own enrollments' })
      }
    }

    if (enrollment.status !== 'waitlisted') {
      return res.json({ success: true, data: { position: null, totalWaitlisted: 0 } })
    }

    const queue = await enrollmentsCol
      .find({ courseId: enrollment.courseId, status: 'waitlisted' })
      .sort({ createdAt: 1 })
      .toArray()
    const position = queue.findIndex((item) => item.id === enrollment.id)

    res.json({
      success: true,
      data: {
        position: position >= 0 ? position + 1 : null,
        totalWaitlisted: queue.length,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch waitlist position' })
  }
})

enrollmentRoutes.put('/:id', requireAdmin, async (req, res) => {
  try {
    const enrollmentsCol = await enrollmentsCollection()
    const paymentsCol = await paymentsCollection()
    const studentsCol = await studentsCollection()

    const existing = await enrollmentsCol.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    const studentRecord = await studentsCol.findOne({ id: existing.studentId })
    if (!studentRecord) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const coursesCol = await coursesCollection()
    const profCol = await professorsCollection()

    let targetCourse = await coursesCol.findOne({ id: existing.courseId })
    if (!targetCourse) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    if (req.body.courseId && req.body.courseId !== existing.courseId) {
      const course = await coursesCol.findOne({ id: req.body.courseId })
      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' })
      }
      targetCourse = course
    }

    const statusValue: EnrollmentStatus = allowedStatuses.has(req.body.status as EnrollmentStatus)
      ? (req.body.status as EnrollmentStatus)
      : existing.status

    const professorIdValue = req.body.professorId ?? (req.body.courseId ? targetCourse.professorId : existing.professorId)
    let professorName = existing.professorName
    if (professorIdValue) {
      const professor = await profCol.findOne({ id: professorIdValue })
      if (!professor) {
        return res.status(404).json({ success: false, error: 'Professor not found' })
      }
      professorName = `${professor.firstName} ${professor.lastName}`
    }

    const basePrice = targetCourse.price
    const overridePrice = req.body.price !== undefined ? Number(req.body.price) : undefined
    if (overridePrice !== undefined && (!Number.isFinite(overridePrice) || overridePrice < 0)) {
      return res.status(400).json({ success: false, error: 'Price must be zero or greater' })
    }

    const couponInput = req.body.couponCode !== undefined ? req.body.couponCode : existing.couponCode
    const couponResult =
      couponInput === undefined && !req.body.courseId && overridePrice === undefined
        ? {
            price: existing.price,
            discountPercent: existing.discountPercent,
            discountAmount: existing.discountAmount,
            coupon: existing.couponCode,
          }
        : await applyCoupon(basePrice, couponInput)

    if (couponResult.coupon && overridePrice !== undefined) {
      return res.status(400).json({ success: false, error: 'Cannot combine coupon with manual tuition override' })
    }

    const nextPrice = overridePrice ?? couponResult.price ?? existing.price

    const wasCharged = existing.tuitionCharged === true
    const willChargeNow = false
    const priceDifference = wasCharged ? subtractCurrency(nextPrice, existing.price) : 0
    const chargeDelta = willChargeNow ? nextPrice : priceDifference

    if ((statusValue === 'active' || statusValue === 'completed') && !(await checkBalance(existing.studentId, nextPrice)).cleared) {
      return sendEnrollmentRejection(res, 409, {
        reasonCode: 'financial_blocking',
        reason: 'Financial Clearance Required.',
        studentId: existing.studentId,
        courseId: targetCourse.id,
        enrollmentId: existing.id,
        auth: req.auth,
        details: {
          requestedStatus: statusValue,
          price: nextPrice,
        },
      })
    }

    const gradeFieldsTouched =
      req.body.gradeMidterm !== undefined ||
      req.body.gradeFinal !== undefined ||
      req.body.gradeProject !== undefined ||
      req.body.gradeParticipation !== undefined ||
      req.body.gradeTotal !== undefined ||
      req.body.grade !== undefined ||
      req.body.letterGrade !== undefined

    if (existing.isFinalized && gradeFieldsTouched) {
      return res.status(403).json({ success: false, error: 'Grades are finalized and cannot be modified' })
    }

    const midtermScore = req.body.gradeMidterm !== undefined ? numericGrade(req.body.gradeMidterm) : existing.gradeMidterm ?? null
    const finalScore = req.body.gradeFinal !== undefined ? numericGrade(req.body.gradeFinal) : existing.gradeFinal ?? null
    const projectScore = req.body.gradeProject !== undefined ? numericGrade(req.body.gradeProject) : existing.gradeProject ?? null
    const participationScore = req.body.gradeParticipation !== undefined ? numericGrade(req.body.gradeParticipation) : existing.gradeParticipation ?? null

    const validationError = [
      validateGradeComponent('Midterm grade', midtermScore),
      validateGradeComponent('Final grade', finalScore),
      validateGradeComponent('Project grade', projectScore),
      validateGradeComponent('Participation grade', participationScore),
    ].find(Boolean)
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError })
    }

    let totalScore = req.body.gradeTotal !== undefined ? numericGrade(req.body.gradeTotal) : existing.gradeTotal ?? null
    if (totalScore === null) {
      const parts = [midtermScore, finalScore, projectScore, participationScore].filter((v) => v !== null) as number[]
      if (parts.length > 0) {
        totalScore = Number(parts.reduce((acc, v) => acc + v, 0).toFixed(2))
      }
    }

    const totalValidation = validateGradeComponent('Total grade', totalScore)
    if (totalValidation) {
      return res.status(400).json({ success: false, error: totalValidation })
    }

    const letter = req.body.letterGrade ?? existing.letterGrade ?? computeLetter(totalScore)
    const beforeGradeState = buildGradeSnapshot(existing)

    const updates: Partial<Enrollment> & { updatedAt: string } = {
      courseId: targetCourse.id,
      courseTitle: targetCourse.title,
      professorId: professorIdValue,
      professorName,
      status: statusValue,
      startDate: req.body.startDate ?? existing.startDate,
      endDate: req.body.endDate ?? existing.endDate,
      price: nextPrice,
      basePrice,
      couponCode: couponResult.coupon,
      discountPercent: couponResult.discountPercent,
      discountAmount: couponResult.discountAmount,
      updatedAt: new Date().toISOString(),
      semester: targetCourse.startDate?.slice(0, 7) ?? existing.semester ?? null,
      semesterId: targetCourse.semesterId ?? existing.semesterId ?? null,
      tuitionCharged: wasCharged || willChargeNow,
      chargedAt: wasCharged ? existing.chargedAt ?? null : willChargeNow ? new Date().toISOString() : existing.chargedAt ?? null,
      gradeMidterm: midtermScore,
      gradeFinal: finalScore,
      gradeProject: projectScore,
      gradeParticipation: participationScore,
      gradeTotal: totalScore,
      letterGrade: letter,
      grade: req.body.grade ?? existing.grade ?? null,
      paymentVerified: statusValue === 'active' || statusValue === 'completed' ? true : existing.paymentVerified ?? false,
      paymentStatus: statusValue === 'active' || statusValue === 'completed' ? 'paid' : existing.paymentStatus ?? 'payment_required',
      ...enrollmentActorPatch(req.auth),
    }

    if (chargeDelta !== 0) {
      const note = willChargeNow
        ? `Enrollment charge for ${targetCourse.title}`
        : chargeDelta > 0
          ? `Additional charge for ${targetCourse.title}`
          : `Refund issued for ${targetCourse.title}`

      const balanceResult = await adjustStudentBalance({
        student: studentRecord,
        studentsCol,
        paymentsCol,
        delta: chargeDelta,
        note,
        source: willChargeNow ? 'enrollment' : 'adjustment',
        referenceId: existing.id,
        enrollmentId: existing.id,
        courseId: existing.courseId,
        courseTitle: existing.courseTitle,
        auth: req.auth,
      })

      updates.couponCode = couponResult.coupon
      updates.discountAmount = couponResult.discountAmount
      updates.discountPercent = couponResult.discountPercent
      existing.student = existing.student ?? { ...studentRecord, balance: studentRecord.balance ?? 0 }
      existing.student.balance = balanceResult.balance
      updates.tuitionCharged = true
      updates.chargedAt = balanceResult.transaction.createdAt
    }

    const hydratedStudent = existing.student
      ? { ...existing.student, balance: existing.student.balance ?? studentRecord.balance ?? 0 }
      : { ...studentRecord, balance: studentRecord.balance ?? 0 }

    updates.student = hydratedStudent

    await enrollmentsCol.updateOne({ id: existing.id }, { $set: updates })
    const updated = await enrollmentsCol.findOne({ id: existing.id })
    if (gradeFieldsTouched) {
      await recordGradeAudit({
        enrollmentId: existing.id,
        studentId: existing.studentId,
        courseId: existing.courseId,
        beforeState: beforeGradeState,
        afterState: buildGradeSnapshot(updated ?? { ...existing, ...updates }),
        auth: req.auth,
      })
    }

    const responsePayload = {
      ...(updated ?? { ...existing, ...updates }),
      student: hydratedStudent,
    }

    await writeAuditLog({
      action: 'enrollment_updated',
      entityType: 'enrollment',
      entityId: existing.id,
      details: {
        studentId: existing.studentId,
        courseId: responsePayload.courseId,
        status: responsePayload.status,
        gradeFieldsTouched,
      },
      auth: req.auth,
    })

    res.json({ success: true, data: responsePayload })
  } catch (error) {
    if (error instanceof Error && error.message === 'Coupon code is not valid') {
      return res.status(400).json({ success: false, error: error.message })
    }
    res.status(500).json({ success: false, error: 'Failed to update enrollment' })
  }
})

enrollmentRoutes.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const enrollmentsCol = await enrollmentsCollection()
    const paymentsCol = await paymentsCollection()
    const studentsCol = await studentsCollection()

    const enrollment = await enrollmentsCol.findOne({ id: req.params.id })
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' })
    }

    const studentRecord = await studentsCol.findOne({ id: enrollment.studentId })
    if (!studentRecord) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    // Soft delete: keep the enrollment record for audit/history, just mark it deleted.
    await enrollmentsCol.updateOne({ id: enrollment.id }, { $set: { deletedAt: new Date().toISOString() } })

    let refundBalance = studentRecord.balance ?? 0
    if (enrollment.tuitionCharged) {
      const balanceResult = await adjustStudentBalance({
        student: studentRecord,
        studentsCol,
        paymentsCol,
        delta: -Math.abs(enrollment.price),
        note: `Enrollment refund for ${enrollment.courseTitle}`,
        source: 'enrollment',
        referenceId: enrollment.id,
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        courseTitle: enrollment.courseTitle,
        auth: req.auth,
      })
      refundBalance = balanceResult.balance
    }

    await promoteWaitlistedEnrollment(enrollment.courseId)
    await writeAuditLog({
      action: 'enrollment_deleted',
      entityType: 'enrollment',
      entityId: enrollment.id,
      details: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        refunded: Boolean(enrollment.tuitionCharged),
      },
      auth: req.auth,
    })

    const responsePayload = {
      ...enrollment,
      student: {
        id: studentRecord.id,
        displayId: studentRecord.displayId,
        firstName: studentRecord.firstName,
        lastName: studentRecord.lastName,
        email: studentRecord.email,
        photo: studentRecord.photo,
        balance: refundBalance,
      },
    }

    res.json({ success: true, data: responsePayload })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete enrollment' })
  }
})

const semesterSchema = z.object({
  label: z.string().trim().min(1),
  academicYear: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  status: z.enum(['upcoming', 'active', 'closed']).optional(),
})

async function semestersCollection() {
  return getCollection<Semester>('semesters')
}

enrollmentRoutes.get('/meta/semesters', async (req, res) => {
  try {
    const semesters = await listAllSemesters()
    res.json({ success: true, data: semesters })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch semesters' })
  }
})

enrollmentRoutes.post('/meta/semesters', requireAdmin, async (req, res) => {
  try {
    const parsed = semesterSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid semester payload' })
    }
    const now = new Date().toISOString()
    const id = `SEM-${randomUUID().slice(0, 8).toUpperCase()}`
    const semester: Semester = {
      id,
      label: parsed.data.label,
      academicYear: parsed.data.academicYear,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      status: parsed.data.status ?? 'upcoming',
      createdAt: now,
      updatedAt: now,
    }
    const collection = await semestersCollection()
    await collection.insertOne(semester)
    invalidateSemesterCache()
    await writeAuditLog({ action: 'semester_created', entityType: 'semester', entityId: id, details: { label: semester.label }, auth: req.auth })
    res.status(201).json({ success: true, data: semester })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create semester' })
  }
})

enrollmentRoutes.put('/meta/semesters/:id', requireAdmin, async (req, res) => {
  try {
    const collection = await semestersCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Semester not found' })
    }
    const parsed = semesterSchema.partial().safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid semester payload' })
    }
    const updates: Partial<Semester> = { ...parsed.data, updatedAt: new Date().toISOString() }
    await collection.updateOne({ id: existing.id }, { $set: updates })
    invalidateSemesterCache()
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'semester_updated', entityType: 'semester', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update semester' })
  }
})

enrollmentRoutes.delete('/meta/semesters/:id', requireAdmin, async (req, res) => {
  try {
    const collection = await semestersCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Semester not found' })
    }
    const coursesCol = await coursesCollection()
    const inUse = await coursesCol.find({ semesterId: existing.id }).limit(1).toArray()
    if (inUse.length > 0) {
      return res.status(409).json({ success: false, error: 'Cannot delete a semester that has courses assigned to it' })
    }
    await collection.deleteOne({ id: existing.id })
    invalidateSemesterCache()
    await writeAuditLog({ action: 'semester_deleted', entityType: 'semester', entityId: existing.id, details: { label: existing.label }, auth: req.auth })
    res.json({ success: true, data: { id: existing.id } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete semester' })
  }
})

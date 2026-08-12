import { Router } from 'express'
import {
  coursesCollection,
  enrollmentsCollection,
  graduationApprovalsCollection,
  professorsCollection,
  studentsCollection,
} from '../data/collections.js'
import { getCollection } from '../db/postgres.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { logger } from '../lib/logger.js'

export const deanRoutes: ReturnType<typeof Router> = Router()

function canAccessDean(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'dean'
}

interface GradeChangeRequestRecord extends Record<string, unknown> {
  id: string
  courseId: string
  courseCode?: string | null
  courseTitle?: string | null
  studentId: string
  studentName: string
  professorId: string
  professorName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

function normalizeDept(value?: string | null) {
  return (value ?? '').trim() || 'Unassigned'
}

// Aggregate enrollment/grade/pass-fail stats per department, pulled from courses +
// enrollments rather than a dedicated department table (none exists yet).
deanRoutes.get('/academic-overview', async (req, res) => {
  try {
    if (!canAccessDean(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Dean access required' })
    }

    const [coursesCol, enrollmentsCol, professorsCol, studentsCol] = await Promise.all([
      coursesCollection(),
      enrollmentsCollection(),
      professorsCollection(),
      studentsCollection(),
    ])

    const [courses, enrollments, professors, totalStudents] = await Promise.all([
      coursesCol.find().toArray(),
      enrollmentsCol.find().toArray(),
      professorsCol.find().toArray(),
      studentsCol.countDocuments(),
    ])

    const courseDeptById = new Map(courses.map((course) => [course.id, normalizeDept(course.department)]))

    type DeptBucket = {
      department: string
      courseCount: number
      professorCount: number
      enrollmentCount: number
      completedCount: number
      passCount: number
      failCount: number
      gradeSum: number
      gradeCount: number
    }
    const buckets = new Map<string, DeptBucket>()
    function bucketFor(department: string): DeptBucket {
      let bucket = buckets.get(department)
      if (!bucket) {
        bucket = { department, courseCount: 0, professorCount: 0, enrollmentCount: 0, completedCount: 0, passCount: 0, failCount: 0, gradeSum: 0, gradeCount: 0 }
        buckets.set(department, bucket)
      }
      return bucket
    }

    courses.forEach((course) => {
      bucketFor(normalizeDept(course.department)).courseCount += 1
    })
    professors.forEach((professor) => {
      bucketFor(normalizeDept(professor.department)).professorCount += 1
    })
    enrollments.forEach((enrollment) => {
      const department = courseDeptById.get(enrollment.courseId) ?? 'Unassigned'
      const bucket = bucketFor(department)
      bucket.enrollmentCount += 1
      if (enrollment.status === 'completed') {
        bucket.completedCount += 1
        const finalGrade = typeof enrollment.gradeFinal === 'number' ? enrollment.gradeFinal : null
        if (finalGrade !== null) {
          bucket.gradeSum += finalGrade
          bucket.gradeCount += 1
          if (finalGrade >= 60) {
            bucket.passCount += 1
          } else {
            bucket.failCount += 1
          }
        }
      }
    })

    const departments = Array.from(buckets.values())
      .map((bucket) => ({
        department: bucket.department,
        courseCount: bucket.courseCount,
        professorCount: bucket.professorCount,
        enrollmentCount: bucket.enrollmentCount,
        completedCount: bucket.completedCount,
        passRate: bucket.passCount + bucket.failCount > 0 ? Number(((bucket.passCount / (bucket.passCount + bucket.failCount)) * 100).toFixed(1)) : null,
        averageGrade: bucket.gradeCount > 0 ? Number((bucket.gradeSum / bucket.gradeCount).toFixed(1)) : null,
      }))
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)

    res.json({
      success: true,
      data: {
        totalStudents,
        totalProfessors: professors.length,
        totalCourses: courses.length,
        totalEnrollments: enrollments.length,
        departments,
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to build dean academic overview')
    res.status(500).json({ success: false, error: 'Failed to fetch academic overview' })
  }
})

// Per-professor teaching load, average grade given, and enrollment counts.
deanRoutes.get('/faculty-performance', async (req, res) => {
  try {
    if (!canAccessDean(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Dean access required' })
    }

    const [coursesCol, enrollmentsCol, professorsCol] = await Promise.all([
      coursesCollection(),
      enrollmentsCollection(),
      professorsCollection(),
    ])

    const [courses, enrollments, professors] = await Promise.all([
      coursesCol.find().toArray(),
      enrollmentsCol.find().toArray(),
      professorsCol.find().toArray(),
    ])

    const coursesByProfessor = new Map<string, typeof courses>()
    courses.forEach((course) => {
      if (!course.professorId) return
      const list = coursesByProfessor.get(course.professorId) ?? []
      list.push(course)
      coursesByProfessor.set(course.professorId, list)
    })

    const enrollmentsByCourse = new Map<string, typeof enrollments>()
    enrollments.forEach((enrollment) => {
      const list = enrollmentsByCourse.get(enrollment.courseId) ?? []
      list.push(enrollment)
      enrollmentsByCourse.set(enrollment.courseId, list)
    })

    const performance = professors.map((professor) => {
      const ownCourses = coursesByProfessor.get(professor.id) ?? []
      let studentCount = 0
      let gradeSum = 0
      let gradeCount = 0
      ownCourses.forEach((course) => {
        const courseEnrollments = enrollmentsByCourse.get(course.id) ?? []
        studentCount += courseEnrollments.length
        courseEnrollments.forEach((enrollment) => {
          if (typeof enrollment.gradeFinal === 'number') {
            gradeSum += enrollment.gradeFinal
            gradeCount += 1
          }
        })
      })

      return {
        professorId: professor.id,
        professorName: `${professor.firstName} ${professor.lastName}`.trim(),
        department: normalizeDept(professor.department),
        status: professor.status,
        courseCount: ownCourses.length,
        studentCount,
        averageGrade: gradeCount > 0 ? Number((gradeSum / gradeCount).toFixed(1)) : null,
      }
    })

    performance.sort((a, b) => b.studentCount - a.studentCount)

    res.json({ success: true, data: performance })
  } catch (error) {
    logger.error({ err: error }, 'Failed to build faculty performance summary')
    res.status(500).json({ success: false, error: 'Failed to fetch faculty performance' })
  }
})

// Department comparison/ranking: enrollment trend proxy + pass/fail rate, reusing
// the same aggregation as academic-overview but shaped for a ranked table.
deanRoutes.get('/department-comparison', async (req, res) => {
  try {
    if (!canAccessDean(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Dean access required' })
    }

    const [coursesCol, enrollmentsCol] = await Promise.all([coursesCollection(), enrollmentsCollection()])
    const [courses, enrollments] = await Promise.all([coursesCol.find().toArray(), enrollmentsCol.find().toArray()])
    const courseDeptById = new Map(courses.map((course) => [course.id, normalizeDept(course.department)]))

    type Row = { department: string; enrollmentCount: number; passCount: number; failCount: number }
    const rows = new Map<string, Row>()
    function rowFor(department: string): Row {
      let row = rows.get(department)
      if (!row) {
        row = { department, enrollmentCount: 0, passCount: 0, failCount: 0 }
        rows.set(department, row)
      }
      return row
    }

    enrollments.forEach((enrollment) => {
      const department = courseDeptById.get(enrollment.courseId) ?? 'Unassigned'
      const row = rowFor(department)
      row.enrollmentCount += 1
      if (enrollment.status === 'completed' && typeof enrollment.gradeFinal === 'number') {
        if (enrollment.gradeFinal >= 60) row.passCount += 1
        else row.failCount += 1
      }
    })

    const ranked = Array.from(rows.values())
      .map((row) => ({
        department: row.department,
        enrollmentCount: row.enrollmentCount,
        passRate: row.passCount + row.failCount > 0 ? Number(((row.passCount / (row.passCount + row.failCount)) * 100).toFixed(1)) : null,
      }))
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .map((row, index) => ({ ...row, rank: index + 1 }))

    res.json({ success: true, data: ranked })
  } catch (error) {
    logger.error({ err: error }, 'Failed to build department comparison')
    res.status(500).json({ success: false, error: 'Failed to fetch department comparison' })
  }
})

// Unified pending-approvals inbox: grade-change escalations + graduation approvals,
// the two workflows a dean is expected to sign off on.
deanRoutes.get('/approvals', async (req, res) => {
  try {
    if (!canAccessDean(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Dean access required' })
    }

    const [gradeChangeCol, graduationCol] = await Promise.all([
      getCollection<GradeChangeRequestRecord>('grade_change_requests'),
      graduationApprovalsCollection(),
    ])

    const [gradeChangeRequests, graduationApprovals] = await Promise.all([
      gradeChangeCol.find({ status: 'pending' }).toArray(),
      graduationCol.find({ status: 'pending' }).toArray(),
    ])

    res.json({
      success: true,
      data: {
        gradeChangeRequests,
        graduationApprovals,
        totalPending: gradeChangeRequests.length + graduationApprovals.length,
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch dean approvals inbox')
    res.status(500).json({ success: false, error: 'Failed to fetch approvals' })
  }
})

// Dean-level review of an escalated grade-change request (mirrors the admin/supervisor
// PATCH in grade-change-requests.ts, scoped to the dean role + audit-logged separately).
deanRoutes.patch('/approvals/grade-change/:id', async (req, res) => {
  try {
    if (!canAccessDean(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Dean access required' })
    }
    const status = req.body?.status
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ success: false, error: 'status must be approved or rejected' })
    }

    const gradeChangeCol = await getCollection<GradeChangeRequestRecord>('grade_change_requests')
    const existing = await gradeChangeCol.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Grade change request not found' })
    }

    const responseNote = typeof req.body?.responseNote === 'string' ? req.body.responseNote : null
    await gradeChangeCol.updateOne(
      { id: existing.id },
      { $set: { status, responseNote, reviewedBy: req.auth?.username ?? null, reviewedAt: new Date().toISOString() } },
    )

    if (status === 'approved') {
      const enrollmentsCol = await enrollmentsCollection()
      const newGrades = (existing as unknown as { newGrades?: Record<string, number | null> }).newGrades ?? {}
      const setFields: Record<string, number | null> = {}
      for (const [key, value] of Object.entries(newGrades)) {
        if (value !== null) setFields[key] = value
      }
      if (Object.keys(setFields).length > 0) {
        await enrollmentsCol.updateOne({ id: (existing as unknown as { enrollmentId: string }).enrollmentId }, { $set: setFields })
      }
    }

    await writeAuditLog({
      action: 'dean_grade_change_reviewed',
      entityType: 'grade_change_request',
      entityId: existing.id,
      details: { status, reviewedBy: req.auth?.username },
      auth: req.auth,
    })

    const updated = await gradeChangeCol.findOne({ id: existing.id })
    res.json({ success: true, data: updated })
  } catch (error) {
    logger.error({ err: error }, 'Failed to review grade change request')
    res.status(500).json({ success: false, error: 'Failed to review grade change request' })
  }
})

// Dean-level graduation sign-off, separate from registrar's endpoint so dean approvals
// are attributable in the audit trail even though they touch the same collection.
deanRoutes.patch('/approvals/graduation/:id', async (req, res) => {
  try {
    if (!canAccessDean(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Dean access required' })
    }
    const status = req.body?.status
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ success: false, error: 'status must be approved or rejected' })
    }

    const collection = await graduationApprovalsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Graduation approval not found' })
    }

    const remarks = typeof req.body?.remarks === 'string' ? req.body.remarks : existing.remarks ?? null
    await collection.updateOne({ id: existing.id }, { $set: { status, remarks } })

    if (status === 'approved') {
      const studentsCol = await studentsCollection()
      await studentsCol.updateOne({ id: existing.studentId }, { $set: { status: 'graduated' } })
    }

    await writeAuditLog({
      action: 'dean_graduation_reviewed',
      entityType: 'graduation_approval',
      entityId: existing.id,
      details: { studentId: existing.studentId, status },
      auth: req.auth,
    })

    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated })
  } catch (error) {
    logger.error({ err: error }, 'Failed to review graduation approval')
    res.status(500).json({ success: false, error: 'Failed to review graduation approval' })
  }
})

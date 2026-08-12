import type { Response } from 'express'
import { once } from 'node:events'
import type { StudentTranscript, TranscriptCourseRecord, TranscriptSemesterRecord } from '../../../shared/types/index.js'
import { runDbQuery } from '../db/postgres.js'

type TranscriptRow = {
  studentId: string
  studentDisplayId: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  program: string | null
  currentSemester: string | null
  enrollmentId: string
  courseId: string
  courseCode: string | null
  courseTitle: string | null
  grade: string | null
  letterGrade: string | null
  gradeTotal: number | string | null
  semester: string | null
  semesterSortKey: string | null
  finalizedAt: string | null
  creditHours: number | string | null
  department: string | null
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

function toGradePoint(record: Pick<TranscriptCourseRecord, 'letterGrade' | 'gradeTotal'>) {
  const letter = (record.letterGrade ?? '').trim().toUpperCase()
  if (letter === 'A') return 4
  if (letter === 'A-') return 3.7
  if (letter === 'B+') return 3.3
  if (letter === 'B') return 3
  if (letter === 'B-') return 2.7
  if (letter === 'C+') return 2.3
  if (letter === 'C') return 2
  if (letter === 'C-') return 1.7
  if (letter === 'D+') return 1.3
  if (letter === 'D') return 1
  if (letter === 'F') return 0

  const total = Number(record.gradeTotal ?? NaN)
  if (!Number.isFinite(total)) return null
  if (total >= 90) return 4
  if (total >= 85) return 3.7
  if (total >= 80) return 3.3
  if (total >= 70) return 3
  if (total >= 65) return 2.7
  if (total >= 60) return 2.3
  if (total >= 50) return 2
  return 0
}

function roundGpa(value: number) {
  return Number(value.toFixed(2))
}

function toCsvCell(value: unknown) {
  const stringValue = typeof value === 'string' ? value : value == null ? '' : String(value)
  return `"${stringValue.replace(/"/g, '""')}"`
}

async function writeCsvLine(res: Response, values: unknown[]) {
  const line = `${values.map((value) => toCsvCell(value)).join(',')}\n`
  if (!res.write(line)) {
    await once(res, 'drain')
  }
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPdfBuffer(lines: string[]) {
  const pageWidth = 612
  const pageHeight = 792
  const lineHeight = 15
  const top = 760
  const pageLineCapacity = 44
  const pages: string[] = []

  for (let offset = 0; offset < lines.length; offset += pageLineCapacity) {
    const pageLines = lines.slice(offset, offset + pageLineCapacity)
    const content = [
      'BT',
      '/F1 11 Tf',
      `50 ${top} Td`,
      ...pageLines.flatMap((line, index) => {
        if (index === 0) return [`(${pdfEscape(line)}) Tj`]
        return [`0 -${lineHeight} Td`, `(${pdfEscape(line)}) Tj`]
      }),
      'ET',
    ].join('\n')
    pages.push(content)
  }

  const objects: string[] = []
  const pageObjectNumbers: number[] = []
  const contentObjectNumbers: number[] = []

  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push('<< /Type /Pages /Kids [] /Count 0 >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  for (const pageContent of pages) {
    const pageObjectNumber = objects.length + 1
    const contentObjectNumber = objects.length + 2
    pageObjectNumbers.push(pageObjectNumber)
    contentObjectNumbers.push(contentObjectNumber)

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    )
    objects.push(`<< /Length ${Buffer.byteLength(pageContent, 'latin1')} >>\nstream\n${pageContent}\nendstream`)
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'))
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'latin1')
}

export async function buildStudentTranscript(studentId: string): Promise<StudentTranscript | null> {
  const { rows } = await runDbQuery<TranscriptRow>(
    `
      select
        s.id as "studentId",
        s.display_id as "studentDisplayId",
        s.first_name as "firstName",
        s.last_name as "lastName",
        s.email,
        s.program,
        s.current_semester as "currentSemester",
        e.id as "enrollmentId",
        e.course_id as "courseId",
        coalesce(c.code, e.course_code, e.display_id, e.course_id) as "courseCode",
        coalesce(e.course_title, c.title) as "courseTitle",
        e.grade,
        e.letter_grade as "letterGrade",
        e.grade_total as "gradeTotal",
        coalesce(
          sem.label,
          csem.label,
          e.semester,
          substring(e.start_date from 1 for 7),
          substring(c.start_date from 1 for 7),
          'Ungrouped'
        ) as semester,
        coalesce(sem.start_date, csem.start_date) as "semesterSortKey",
        e.grades_finalized_at as "finalizedAt",
        coalesce(c.credit_hours, 3) as "creditHours",
        c.department
      from public.enrollments e
      inner join public.students s on s.id = e.student_id
      left join public.courses c on c.id = e.course_id
      left join public.semesters sem on sem.id = e.semester_id
      left join public.semesters csem on csem.id = c.semester_id
      where e.student_id = $1
        and coalesce(e.is_finalized, false) = true
      order by "semesterSortKey" asc nulls last, semester asc, "courseCode" asc, e.id asc
    `,
    [studentId],
  )

  if (rows.length === 0) {
    const studentLookup = await runDbQuery<{
      studentId: string
      studentDisplayId: string | null
      firstName: string | null
      lastName: string | null
      email: string | null
      program: string | null
      currentSemester: string | null
    }>(
      `
        select
          id as "studentId",
          display_id as "studentDisplayId",
          first_name as "firstName",
          last_name as "lastName",
          email,
          program,
          current_semester as "currentSemester"
        from public.students
        where id = $1
        limit 1
      `,
      [studentId],
    )

    const student = studentLookup.rows[0]
    if (!student) return null

    return {
      student: {
        id: student.studentId,
        displayId: student.studentDisplayId ?? student.studentId,
        firstName: student.firstName ?? 'Student',
        lastName: student.lastName ?? '',
        email: student.email ?? '',
        program: student.program ?? '',
        currentSemester: student.currentSemester,
      },
      semesters: [],
      cumulativeCredits: 0,
      cumulativeGpa: 0,
      generatedAt: new Date().toISOString(),
    }
  }

  const first = rows[0]
  const courses: TranscriptCourseRecord[] = rows.map((row) => ({
    enrollmentId: row.enrollmentId,
    courseId: row.courseId,
    courseCode: row.courseCode ?? row.courseId,
    courseTitle: row.courseTitle ?? row.courseId,
    credits: Number(row.creditHours ?? 3) || 3,
    grade: row.grade ?? null,
    letterGrade: row.letterGrade ?? null,
    gradeTotal: row.gradeTotal == null ? null : Number(row.gradeTotal),
    campus: getCampusForDepartment(row.department),
    semester: row.semester ?? 'Ungrouped',
    finalizedAt: row.finalizedAt ?? null,
  }))

  const semestersMap = new Map<string, TranscriptCourseRecord[]>()
  courses.forEach((course) => {
    const bucket = semestersMap.get(course.semester) ?? []
    bucket.push(course)
    semestersMap.set(course.semester, bucket)
  })

  const semesters: TranscriptSemesterRecord[] = Array.from(semestersMap.entries()).map(([semester, semesterCourses]) => {
    const weightedPoints = semesterCourses.reduce((sum, course) => {
      const points = toGradePoint(course)
      return sum + (points ?? 0) * course.credits
    }, 0)
    const credits = semesterCourses.reduce((sum, course) => sum + course.credits, 0)
    return {
      semester,
      credits,
      gpa: credits > 0 ? roundGpa(weightedPoints / credits) : 0,
      courses: semesterCourses,
    }
  })

  const cumulativeCredits = semesters.reduce((sum, semester) => sum + semester.credits, 0)
  const cumulativePoints = semesters.reduce(
    (sum, semester) => sum + semester.courses.reduce((inner, course) => inner + (toGradePoint(course) ?? 0) * course.credits, 0),
    0,
  )

  return {
    student: {
      id: first.studentId,
      displayId: first.studentDisplayId ?? first.studentId,
      firstName: first.firstName ?? 'Student',
      lastName: first.lastName ?? '',
      email: first.email ?? '',
      program: first.program ?? '',
      currentSemester: first.currentSemester ?? null,
    },
    semesters,
    cumulativeCredits,
    cumulativeGpa: cumulativeCredits > 0 ? roundGpa(cumulativePoints / cumulativeCredits) : 0,
    generatedAt: new Date().toISOString(),
  }
}

export async function streamStudentTranscriptCsv(res: Response, transcript: StudentTranscript) {
  await writeCsvLine(res, ['Student ID', 'Student Name', 'Program', 'Semester', 'Course Code', 'Course Title', 'Credits', 'Campus', 'Grade', 'Letter Grade', 'Semester GPA', 'Cumulative GPA'])

  for (const semester of transcript.semesters) {
    for (const course of semester.courses) {
      await writeCsvLine(res, [
        transcript.student.displayId,
        `${transcript.student.firstName} ${transcript.student.lastName}`.trim(),
        transcript.student.program ?? '',
        semester.semester,
        course.courseCode,
        course.courseTitle,
        course.credits,
        course.campus ?? '',
        course.gradeTotal ?? course.grade ?? '',
        course.letterGrade ?? '',
        semester.gpa,
        transcript.cumulativeGpa,
      ])
    }
  }
}

export function buildStudentTranscriptPdf(transcript: StudentTranscript) {
  const lines: string[] = [
    'UNYT Official Transcript',
    `Student: ${transcript.student.firstName} ${transcript.student.lastName}`.trim(),
    `Student ID: ${transcript.student.displayId}`,
    `Program: ${transcript.student.program ?? ''}`,
    `Generated At: ${new Date(transcript.generatedAt).toLocaleString()}`,
    `Cumulative GPA: ${transcript.cumulativeGpa.toFixed(2)} | Credits: ${transcript.cumulativeCredits}`,
    '',
  ]

  if (transcript.semesters.length === 0) {
    lines.push('No finalized grades are available for this student.')
  } else {
    transcript.semesters.forEach((semester) => {
      lines.push(`${semester.semester} | GPA ${semester.gpa.toFixed(2)} | Credits ${semester.credits}`)
      semester.courses.forEach((course) => {
        const gradeLabel = course.letterGrade ?? (course.gradeTotal != null ? `${course.gradeTotal}` : course.grade ?? 'N/A')
        lines.push(`- ${course.courseCode} | ${course.courseTitle} | ${course.credits} cr | ${course.campus ?? 'Main Campus'} | ${gradeLabel}`)
      })
      lines.push('')
    })
  }

  return buildPdfBuffer(lines)
}

import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { coursesCollection, enrollmentsCollection, roomBookingsCollection } from '../data/collections.js'
import { getCollection, runDbQuery } from '../db/postgres.js'
import type { Course, CourseScheduleEntry, Enrollment, RoomBooking } from '../../../shared/types/index.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { sendMail } from '../lib/mailer.js'
import { saveDataUrl } from '../lib/storage.js'

export const professorWorkspaceRoutes: ReturnType<typeof Router> = Router()

type WorkspaceSectionKey =
  | 'materials'
  | 'assignments'
  | 'quizzes'
  | 'attendanceSessions'
  | 'messages'
  | 'announcements'
  | 'officeHours'

type MaterialCategory = 'syllabus' | 'slides' | 'pdf' | 'other'
type PublishableStatus = 'draft' | 'published' | 'closed'
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
type OfficeHourStatus = 'scheduled' | 'cancelled' | 'completed'

interface ProfessorMaterial {
  id: string
  title: string
  category: MaterialCategory
  description?: string | null
  fileName?: string | null
  fileUrl?: string | null
  mimeType?: string | null
  size?: number | null
  uploadedAt: string
  updatedAt: string
}

interface ProfessorAssignment {
  id: string
  title: string
  description?: string | null
  dueDate?: string | null
  maxPoints?: number | null
  status: PublishableStatus
  createdAt: string
  updatedAt: string
}

interface ProfessorQuiz {
  id: string
  title: string
  description?: string | null
  dueDate?: string | null
  totalPoints?: number | null
  questionCount?: number | null
  durationMinutes?: number | null
  status: PublishableStatus
  createdAt: string
  updatedAt: string
}

interface AttendanceRecord {
  studentId: string
  studentName: string
  status: AttendanceStatus
  note?: string | null
}

interface AttendanceSession {
  id: string
  title: string
  sessionDate: string
  notes?: string | null
  records: AttendanceRecord[]
  createdAt: string
  updatedAt: string
}

interface CourseMessage {
  id: string
  recipientType: 'student' | 'course'
  recipientIds: string[]
  subject: string
  body: string
  sentAt: string
  createdBy: string
}

interface CourseAnnouncement {
  id: string
  title: string
  body: string
  pinned: boolean
  publishedAt: string
  updatedAt: string
}

interface OfficeHour {
  id: string
  title: string
  startsAt: string
  endsAt: string
  location?: string | null
  meetingLink?: string | null
  notes?: string | null
  status: OfficeHourStatus
  createdAt: string
  updatedAt: string
}

interface MarkPublication {
  id: string
  title: string
  message: string
  publishedAt: string
  enrollmentIds: string[]
}

interface ProfessorWorkspace {
  id: string
  professorId: string
  courseId: string
  materials: ProfessorMaterial[]
  assignments: ProfessorAssignment[]
  quizzes: ProfessorQuiz[]
  attendanceSessions: AttendanceSession[]
  messages: CourseMessage[]
  announcements: CourseAnnouncement[]
  officeHours: OfficeHour[]
  markPublications: MarkPublication[]
  updatedAt: string
}

type MockClassBooking = RoomBooking

type MockClassConflict = {
  type: 'room-course' | 'room-booking' | 'professor-course' | 'professor-booking'
  message: string
  roomName?: string
  professorName?: string | null
  courseId?: string | null
  courseTitle?: string | null
  courseCode?: string | null
  bookingId?: string | null
  startAt?: string | null
  endAt?: string | null
}

const allowedSections = new Set<WorkspaceSectionKey>([
  'materials',
  'assignments',
  'quizzes',
  'attendanceSessions',
  'messages',
  'announcements',
  'officeHours',
])

let tableReady = false

function isPrivilegedRole(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor'
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asNullableString(value: unknown) {
  const text = asString(value)
  return text ? text : null
}

function asBoolean(value: unknown) {
  return value === true || value === 'true'
}

function asNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : []
}

function normalizeRoomName(value: unknown) {
  return asString(value).toLowerCase()
}

function normalizeDateTime(value: unknown) {
  const text = asString(value)
  if (!text) return ''
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map((part) => Number(part))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function minutesFromDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.getHours() * 60 + parsed.getMinutes()
}

function getScheduleDayFromDate(value: string): CourseScheduleEntry['day'] | null {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][parsed.getDay()] as CourseScheduleEntry['day']
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA
}

function titleCaseDay(day: CourseScheduleEntry['day']) {
  return day.charAt(0).toUpperCase() + day.slice(1)
}

async function getAllScheduleAwareCourses() {
  const coursesCol = await coursesCollection()
  return (await coursesCol.find().toArray()) as Course[]
}

async function getActiveMockClassBookings() {
  const collection = await roomBookingsCollection()
  return (await collection
    .find({ bookingType: 'mock-class', status: { $nin: ['cancelled', 'rejected'] } })
    .sort({ startAt: 1 })
    .limit(300)
    .toArray()) as MockClassBooking[]
}

function buildMockClassRooms(courses: Course[], bookings: MockClassBooking[]) {
  const rooms = new Set<string>()
  courses.forEach((course) => {
    if (course.location) rooms.add(course.location)
    course.schedule?.forEach((slot) => {
      if (slot.location) rooms.add(slot.location)
    })
  })
  bookings.forEach((booking) => {
    if (booking.roomName) rooms.add(booking.roomName)
  })
  return Array.from(rooms).sort((left, right) => left.localeCompare(right))
}

function findMockClassConflicts(options: {
  selectedCourse: Course
  roomName: string
  startAt: string
  endAt: string
  courses: Course[]
  bookings: MockClassBooking[]
  excludeBookingId?: string
}) {
  const { selectedCourse, roomName, startAt, endAt, courses, bookings, excludeBookingId } = options
  const conflicts: MockClassConflict[] = []
  const normalizedRoom = normalizeRoomName(roomName)
  const bookingDay = getScheduleDayFromDate(startAt)
  const startMinutes = minutesFromDate(startAt)
  const endMinutes = minutesFromDate(endAt)
  const startMs = new Date(startAt).getTime()
  const endMs = new Date(endAt).getTime()

  if (!normalizedRoom || !bookingDay || startMinutes === null || endMinutes === null || !Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return {
      available: false,
      conflicts: [{ type: 'room-booking', message: 'Invalid date, time, or room selection.' }],
    }
  }

  courses.forEach((course) => {
    course.schedule?.forEach((slot) => {
      if (slot.day !== bookingDay) return
      const slotStart = timeToMinutes(slot.startTime)
      const slotEnd = timeToMinutes(slot.endTime)
      if (slotStart === null || slotEnd === null) return
      if (!overlaps(startMinutes, endMinutes, slotStart, slotEnd)) return

      const slotRoom = normalizeRoomName(slot.location || course.location)
      if (slotRoom && slotRoom === normalizedRoom) {
        conflicts.push({
          type: 'room-course',
          message: `Room ${roomName} is already used by ${course.code} ${course.title} with ${course.professorName} on ${titleCaseDay(slot.day)} ${slot.startTime}-${slot.endTime}.`,
          roomName,
          professorName: course.professorName,
          courseId: course.id,
          courseTitle: course.title,
          courseCode: course.code,
        })
      }

      if (course.professorId === selectedCourse.professorId) {
        conflicts.push({
          type: 'professor-course',
          message: `${selectedCourse.professorName} already teaches ${course.code} ${course.title} on ${titleCaseDay(slot.day)} ${slot.startTime}-${slot.endTime}.`,
          roomName: slot.location || course.location || roomName,
          professorName: course.professorName,
          courseId: course.id,
          courseTitle: course.title,
          courseCode: course.code,
        })
      }
    })
  })

  bookings.forEach((booking) => {
    if (excludeBookingId && booking.id === excludeBookingId) return
    const bookingStartMs = new Date(booking.startAt).getTime()
    const bookingEndMs = new Date(booking.endAt).getTime()
    if (!Number.isFinite(bookingStartMs) || !Number.isFinite(bookingEndMs)) return
    if (!overlaps(startMs, endMs, bookingStartMs, bookingEndMs)) return

    if (normalizeRoomName(booking.roomName) === normalizedRoom) {
      conflicts.push({
        type: 'room-booking',
        message: `Room ${roomName} is already booked by ${booking.professorName || booking.bookedBy} from ${new Date(booking.startAt).toLocaleString()} to ${new Date(booking.endAt).toLocaleString()}.`,
        roomName,
        professorName: booking.professorName || booking.bookedBy,
        bookingId: booking.id,
        startAt: booking.startAt,
        endAt: booking.endAt,
        courseId: booking.courseId,
        courseTitle: booking.courseTitle,
      })
    }

    if (booking.professorId && booking.professorId === selectedCourse.professorId) {
      conflicts.push({
        type: 'professor-booking',
        message: `${selectedCourse.professorName} already has a mock-up class booking from ${new Date(booking.startAt).toLocaleString()} to ${new Date(booking.endAt).toLocaleString()}.`,
        roomName: booking.roomName,
        professorName: booking.professorName || booking.bookedBy,
        bookingId: booking.id,
        startAt: booking.startAt,
        endAt: booking.endAt,
        courseId: booking.courseId,
        courseTitle: booking.courseTitle,
      })
    }
  })

  return {
    available: conflicts.length === 0,
    conflicts,
  }
}

function buildWorkspace(courseId: string, professorId: string): ProfessorWorkspace {
  return {
    id: `PWORK-${randomUUID().slice(0, 8).toUpperCase()}`,
    professorId,
    courseId,
    materials: [],
    assignments: [],
    quizzes: [],
    attendanceSessions: [],
    messages: [],
    announcements: [],
    officeHours: [],
    markPublications: [],
    updatedAt: new Date().toISOString(),
  }
}

async function ensureProfessorWorkspaceTable() {
  if (tableReady) return

  await runDbQuery(`
    create table if not exists professor_workspaces (
      id text primary key,
      professor_id text not null,
      course_id text not null unique,
      materials jsonb not null default '[]'::jsonb,
      assignments jsonb not null default '[]'::jsonb,
      quizzes jsonb not null default '[]'::jsonb,
      attendance_sessions jsonb not null default '[]'::jsonb,
      messages jsonb not null default '[]'::jsonb,
      announcements jsonb not null default '[]'::jsonb,
      office_hours jsonb not null default '[]'::jsonb,
      mark_publications jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now()
    )
  `)

  await runDbQuery('create index if not exists idx_professor_workspaces_professor_id on professor_workspaces(professor_id)')
  tableReady = true
}

function rowToWorkspace(row: Record<string, unknown>): ProfessorWorkspace {
  return {
    id: String(row.id),
    professorId: String(row.professor_id),
    courseId: String(row.course_id),
    materials: asArray<ProfessorMaterial>(row.materials),
    assignments: asArray<ProfessorAssignment>(row.assignments),
    quizzes: asArray<ProfessorQuiz>(row.quizzes),
    attendanceSessions: asArray<AttendanceSession>(row.attendance_sessions),
    messages: asArray<CourseMessage>(row.messages),
    announcements: asArray<CourseAnnouncement>(row.announcements),
    officeHours: asArray<OfficeHour>(row.office_hours),
    markPublications: asArray<MarkPublication>(row.mark_publications),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : new Date().toISOString(),
  }
}

async function saveWorkspace(workspace: ProfessorWorkspace) {
  const updatedAt = new Date().toISOString()
  const payload = { ...workspace, updatedAt }

  await runDbQuery(
    `
      insert into professor_workspaces (
        id,
        professor_id,
        course_id,
        materials,
        assignments,
        quizzes,
        attendance_sessions,
        messages,
        announcements,
        office_hours,
        mark_publications,
        updated_at
      )
      values ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::timestamptz)
      on conflict (course_id) do update set
        professor_id = excluded.professor_id,
        materials = excluded.materials,
        assignments = excluded.assignments,
        quizzes = excluded.quizzes,
        attendance_sessions = excluded.attendance_sessions,
        messages = excluded.messages,
        announcements = excluded.announcements,
        office_hours = excluded.office_hours,
        mark_publications = excluded.mark_publications,
        updated_at = excluded.updated_at
    `,
    [
      payload.id,
      payload.professorId,
      payload.courseId,
      JSON.stringify(payload.materials),
      JSON.stringify(payload.assignments),
      JSON.stringify(payload.quizzes),
      JSON.stringify(payload.attendanceSessions),
      JSON.stringify(payload.messages),
      JSON.stringify(payload.announcements),
      JSON.stringify(payload.officeHours),
      JSON.stringify(payload.markPublications),
      updatedAt,
    ],
  )

  return { ...payload, updatedAt }
}

async function resolveCourse(reqCourseId: string, auth: Express.Request['auth']) {
  const coursesCol = await coursesCollection()
  const course = await coursesCol.findOne({ id: reqCourseId })
  if (!course) return { error: 'Course not found' as const }

  const privileged = isPrivilegedRole(auth?.role)
  if (!privileged) {
    if (auth?.role !== 'professor' || !auth.professorId) {
      return { error: 'Professor identity missing in token' as const }
    }
    if (course.professorId !== auth.professorId) {
      return { error: 'You can only manage your assigned courses' as const }
    }
  }

  return { course }
}

async function getWorkspaceForCourse(course: Course) {
  await ensureProfessorWorkspaceTable()
  const { rows } = await runDbQuery<Record<string, unknown>>(
    'select * from professor_workspaces where course_id = $1 limit 1',
    [course.id],
  )

  if (rows[0]) {
    return rowToWorkspace(rows[0])
  }

  const created = buildWorkspace(course.id, course.professorId)
  return saveWorkspace(created)
}

const ALLOWED_MATERIAL_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/zip',
])

const MAX_MATERIAL_FILE_BYTES = 8 * 1024 * 1024 // 8MB, under the 10MB express.json body cap

const DATA_URL_PATTERN = /^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/

/** Validates an uploaded file's declared MIME type and actual decoded size. Returns null if invalid. */
function validateMaterialFileUrl(fileUrl: string): { mimeType: string; size: number } | null {
  const match = fileUrl.match(DATA_URL_PATTERN)
  if (!match) return null
  const [, mimeType, base64Data] = match
  if (!ALLOWED_MATERIAL_MIME_TYPES.has(mimeType.toLowerCase())) return null
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0
  const size = Math.floor((base64Data.length * 3) / 4) - padding
  if (size > MAX_MATERIAL_FILE_BYTES) return null
  return { mimeType, size }
}

async function normalizeMaterial(input: Record<string, unknown>, existing?: ProfessorMaterial): Promise<ProfessorMaterial | null> {
  const title = asString(input.title)
  if (!title) return null
  const now = new Date().toISOString()
  const categoryInput = asString(input.category).toLowerCase()
  const category: MaterialCategory =
    categoryInput === 'syllabus' || categoryInput === 'slides' || categoryInput === 'pdf' ? (categoryInput as MaterialCategory) : 'other'

  const incomingFileUrl = asNullableString(input.fileUrl)
  let fileUrl = incomingFileUrl
  let mimeType = asNullableString(input.mimeType)
  let size = asNumber(input.size)

  // A fresh upload arrives as a data: URL; anything already stored (data: or a
  // previously-persisted storage URL from an edit that didn't touch the file) is
  // validated but only re-uploaded to storage if it's still a raw data: URL.
  if (incomingFileUrl && incomingFileUrl.startsWith('data:')) {
    const validated = validateMaterialFileUrl(incomingFileUrl)
    if (!validated) return null
    const stored = await saveDataUrl(incomingFileUrl, asNullableString(input.fileName) ?? undefined)
    if (!stored) return null
    fileUrl = stored.url
    mimeType = stored.contentType
    size = stored.size
  }

  return {
    id: existing?.id ?? `MAT-${randomUUID().slice(0, 8).toUpperCase()}`,
    title,
    category,
    description: asNullableString(input.description),
    fileName: asNullableString(input.fileName),
    fileUrl: fileUrl ?? existing?.fileUrl ?? null,
    mimeType,
    size,
    uploadedAt: existing?.uploadedAt ?? now,
    updatedAt: now,
  }
}

function normalizeAssignment(input: Record<string, unknown>, existing?: ProfessorAssignment): ProfessorAssignment | null {
  const title = asString(input.title)
  if (!title) return null
  const now = new Date().toISOString()
  const statusInput = asString(input.status).toLowerCase()
  const status: PublishableStatus =
    statusInput === 'published' || statusInput === 'closed' ? statusInput : 'draft'

  return {
    id: existing?.id ?? `ASN-${randomUUID().slice(0, 8).toUpperCase()}`,
    title,
    description: asNullableString(input.description),
    dueDate: asNullableString(input.dueDate),
    maxPoints: asNumber(input.maxPoints),
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

function normalizeQuiz(input: Record<string, unknown>, existing?: ProfessorQuiz): ProfessorQuiz | null {
  const title = asString(input.title)
  if (!title) return null
  const now = new Date().toISOString()
  const statusInput = asString(input.status).toLowerCase()
  const status: PublishableStatus =
    statusInput === 'published' || statusInput === 'closed' ? statusInput : 'draft'

  return {
    id: existing?.id ?? `QUIZ-${randomUUID().slice(0, 8).toUpperCase()}`,
    title,
    description: asNullableString(input.description),
    dueDate: asNullableString(input.dueDate),
    totalPoints: asNumber(input.totalPoints),
    questionCount: asNumber(input.questionCount),
    durationMinutes: asNumber(input.durationMinutes),
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

function normalizeAttendanceSession(input: Record<string, unknown>, existing?: AttendanceSession): AttendanceSession | null {
  const title = asString(input.title)
  const sessionDate = asString(input.sessionDate)
  if (!title || !sessionDate) return null
  const now = new Date().toISOString()

  const records = asArray<Record<string, unknown>>(input.records)
    .map((record) => {
      const studentId = asString(record.studentId)
      const studentName = asString(record.studentName)
      const statusInput = asString(record.status).toLowerCase()
      if (!studentId || !studentName) return null
      const status: AttendanceStatus =
        statusInput === 'absent' || statusInput === 'late' || statusInput === 'excused' ? statusInput : 'present'
      return {
        studentId,
        studentName,
        status,
        note: asNullableString(record.note),
      }
    })
    .filter(Boolean) as AttendanceRecord[]

  return {
    id: existing?.id ?? `ATT-${randomUUID().slice(0, 8).toUpperCase()}`,
    title,
    sessionDate,
    notes: asNullableString(input.notes),
    records,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

function normalizeMessage(input: Record<string, unknown>, existing: CourseMessage | undefined, username: string): CourseMessage | null {
  const subject = asString(input.subject)
  const body = asString(input.body)
  if (!subject || !body) return null

  const recipientType = asString(input.recipientType) === 'student' ? 'student' : 'course'
  const recipientIds = asArray<unknown>(input.recipientIds)
    .map((value) => asString(value))
    .filter(Boolean)

  return {
    id: existing?.id ?? `MSG-${randomUUID().slice(0, 8).toUpperCase()}`,
    recipientType,
    recipientIds,
    subject,
    body,
    sentAt: existing?.sentAt ?? new Date().toISOString(),
    createdBy: existing?.createdBy ?? username,
  }
}

function normalizeAnnouncement(input: Record<string, unknown>, existing?: CourseAnnouncement): CourseAnnouncement | null {
  const title = asString(input.title)
  const body = asString(input.body)
  if (!title || !body) return null
  const now = new Date().toISOString()
  return {
    id: existing?.id ?? `ANN-${randomUUID().slice(0, 8).toUpperCase()}`,
    title,
    body,
    pinned: asBoolean(input.pinned),
    publishedAt: existing?.publishedAt ?? now,
    updatedAt: now,
  }
}

function normalizeOfficeHour(input: Record<string, unknown>, existing?: OfficeHour): OfficeHour | null {
  const title = asString(input.title)
  const startsAt = asString(input.startsAt)
  const endsAt = asString(input.endsAt)
  if (!title || !startsAt || !endsAt) return null
  const now = new Date().toISOString()
  const statusInput = asString(input.status).toLowerCase()
  const status: OfficeHourStatus =
    statusInput === 'cancelled' || statusInput === 'completed' ? statusInput : 'scheduled'

  return {
    id: existing?.id ?? `OH-${randomUUID().slice(0, 8).toUpperCase()}`,
    title,
    startsAt,
    endsAt,
    location: asNullableString(input.location),
    meetingLink: asNullableString(input.meetingLink),
    notes: asNullableString(input.notes),
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

async function normalizeSectionItem(
  section: WorkspaceSectionKey,
  input: Record<string, unknown>,
  existing: any,
  username: string,
) {
  switch (section) {
    case 'materials':
      return await normalizeMaterial(input, existing)
    case 'assignments':
      return normalizeAssignment(input, existing)
    case 'quizzes':
      return normalizeQuiz(input, existing)
    case 'attendanceSessions':
      return normalizeAttendanceSession(input, existing)
    case 'messages':
      return normalizeMessage(input, existing, username)
    case 'announcements':
      return normalizeAnnouncement(input, existing)
    case 'officeHours':
      return normalizeOfficeHour(input, existing)
    default:
      return null
  }
}

async function getCourseEnrollments(courseId: string) {
  const enrollmentsCol = await enrollmentsCollection()
  const items = await enrollmentsCol.find({ courseId, status: { $nin: ['cancelled', 'rejected', 'dropped'] } }).toArray()
  return items as Enrollment[]
}

async function notifyStudents(course: Course, title: string, body: string, studentIds?: string[]) {
  const usersCol = await getCollection<Record<string, unknown>>('users')
  const notificationsCol = await getCollection<Record<string, unknown>>('notifications')
  const enrollments = await getCourseEnrollments(course.id)
  const targets = studentIds && studentIds.length > 0
    ? enrollments.filter((enrollment) => studentIds.includes(enrollment.studentId))
    : enrollments

  for (const enrollment of targets) {
    const user = await usersCol.findOne({ studentId: enrollment.studentId })
    await notificationsCol.insertOne({
      id: `NOTIF-${randomUUID().slice(0, 8).toUpperCase()}`,
      userId: (user?.id as string | undefined) ?? enrollment.studentId,
      title,
      body,
      createdAt: new Date().toISOString(),
      read: false,
      actor: course.professorName,
    })
    const email = user?.email as string | undefined
    if (email) {
      void sendMail({ to: email, subject: title, text: body })
    }
  }
}

professorWorkspaceRoutes.get('/courses/:courseId', async (req, res) => {
  try {
    const resolved = await resolveCourse(req.params.courseId, req.auth)
    if ('error' in resolved) {
      const status = resolved.error === 'Course not found' ? 404 : 403
      return res.status(status).json({ success: false, error: resolved.error })
    }

    const workspace = await getWorkspaceForCourse(resolved.course)
    res.json({ success: true, data: workspace })
  } catch (error) {
    console.error('Professor workspace fetch failed', error)
    res.status(500).json({ success: false, error: 'Failed to fetch professor workspace' })
  }
})

professorWorkspaceRoutes.get('/courses/:courseId/mock-classes', async (req, res) => {
  try {
    const resolved = await resolveCourse(req.params.courseId, req.auth)
    if ('error' in resolved) {
      const status = resolved.error === 'Course not found' ? 404 : 403
      return res.status(status).json({ success: false, error: resolved.error })
    }

    const [courses, bookings] = await Promise.all([getAllScheduleAwareCourses(), getActiveMockClassBookings()])
    res.json({
      success: true,
      data: {
        rooms: buildMockClassRooms(courses, bookings),
        bookings,
      },
    })
  } catch (error) {
    console.error('Mock class planner fetch failed', error)
    res.status(500).json({ success: false, error: 'Failed to load mock-up class planner' })
  }
})

professorWorkspaceRoutes.post('/courses/:courseId/mock-classes/availability', async (req, res) => {
  try {
    const resolved = await resolveCourse(req.params.courseId, req.auth)
    if ('error' in resolved) {
      const status = resolved.error === 'Course not found' ? 404 : 403
      return res.status(status).json({ success: false, error: resolved.error })
    }

    const roomName = asString(req.body?.roomName)
    const startAt = normalizeDateTime(req.body?.startAt)
    const endAt = normalizeDateTime(req.body?.endAt)
    if (!roomName || !startAt || !endAt) {
      return res.status(400).json({ success: false, error: 'roomName, startAt, and endAt are required' })
    }

    const [courses, bookings] = await Promise.all([getAllScheduleAwareCourses(), getActiveMockClassBookings()])
    const availability = findMockClassConflicts({
      selectedCourse: resolved.course,
      roomName,
      startAt,
      endAt,
      courses,
      bookings,
    })

    res.json({ success: true, data: availability })
  } catch (error) {
    console.error('Mock class availability check failed', error)
    res.status(500).json({ success: false, error: 'Failed to check mock-up class availability' })
  }
})

professorWorkspaceRoutes.post('/courses/:courseId/mock-classes', async (req, res) => {
  try {
    const resolved = await resolveCourse(req.params.courseId, req.auth)
    if ('error' in resolved) {
      const status = resolved.error === 'Course not found' ? 404 : 403
      return res.status(status).json({ success: false, error: resolved.error })
    }

    const roomName = asString(req.body?.roomName)
    const startAt = normalizeDateTime(req.body?.startAt)
    const endAt = normalizeDateTime(req.body?.endAt)
    const purpose = asString(req.body?.purpose) || `Mock-up class for ${resolved.course.code} ${resolved.course.title}`
    const notes = asNullableString(req.body?.notes)

    if (!roomName || !startAt || !endAt) {
      return res.status(400).json({ success: false, error: 'roomName, startAt, and endAt are required' })
    }

    const [courses, bookings, collection] = await Promise.all([
      getAllScheduleAwareCourses(),
      getActiveMockClassBookings(),
      roomBookingsCollection(),
    ])

    const availability = findMockClassConflicts({
      selectedCourse: resolved.course,
      roomName,
      startAt,
      endAt,
      courses,
      bookings,
    })

    if (!availability.available) {
      await writeAuditLog({
        action: 'resource_overlap_rejected',
        entityType: 'room_booking',
        entityId: resolved.course.id,
        details: {
          reasonCode: 'resource_overlap',
          reason: 'Selected room or time is not available',
          courseId: resolved.course.id,
          courseTitle: resolved.course.title,
          professorId: resolved.course.professorId,
          professorName: resolved.course.professorName,
          roomName,
          startAt,
          endAt,
          conflicts: availability.conflicts.map((conflict) => ({
            type: conflict.type,
            message: conflict.message,
            roomName: conflict.roomName ?? null,
            professorName: conflict.professorName ?? null,
            courseId: conflict.courseId ?? null,
            bookingId: conflict.bookingId ?? null,
          })),
        },
        auth: req.auth,
      })
      return res.status(409).json({ success: false, error: 'Selected room or time is not available', data: availability })
    }

    const booking: MockClassBooking = {
      id: `MCK-${randomUUID().slice(0, 8).toUpperCase()}`,
      roomName,
      bookedBy: req.auth?.username ?? resolved.course.professorName,
      purpose,
      startAt,
      endAt,
      status: 'approved',
      notes,
      bookingType: 'mock-class',
      courseId: resolved.course.id,
      courseTitle: resolved.course.title,
      professorId: resolved.course.professorId,
      professorName: resolved.course.professorName,
    }

    await collection.insertOne(booking)
    const nextBookings = await getActiveMockClassBookings()

    res.status(201).json({
      success: true,
      data: {
        booking,
        planner: {
          rooms: buildMockClassRooms(courses, nextBookings),
          bookings: nextBookings,
        },
      },
    })
  } catch (error) {
    console.error('Mock class booking failed', error)
    res.status(500).json({ success: false, error: 'Failed to create mock-up class booking' })
  }
})

professorWorkspaceRoutes.post('/courses/:courseId/publish-marks', async (req, res) => {
  try {
    const resolved = await resolveCourse(req.params.courseId, req.auth)
    if ('error' in resolved) {
      const status = resolved.error === 'Course not found' ? 404 : 403
      return res.status(status).json({ success: false, error: resolved.error })
    }

    const workspace = await getWorkspaceForCourse(resolved.course)
    const enrollments = await getCourseEnrollments(resolved.course.id)
    const publication: MarkPublication = {
      id: `MARK-${randomUUID().slice(0, 8).toUpperCase()}`,
      title: asString(req.body?.title) || `Marks published for ${resolved.course.code}`,
      message: asString(req.body?.message) || `Marks are now available for ${resolved.course.title}.`,
      publishedAt: new Date().toISOString(),
      enrollmentIds: enrollments.map((enrollment) => enrollment.id),
    }

    const saved = await saveWorkspace({
      ...workspace,
      markPublications: [publication, ...workspace.markPublications],
    })

    await notifyStudents(resolved.course, publication.title, publication.message)
    res.status(201).json({ success: true, data: saved })
  } catch (error) {
    console.error('Professor marks publish failed', error)
    res.status(500).json({ success: false, error: 'Failed to publish marks' })
  }
})

professorWorkspaceRoutes.post('/courses/:courseId/:section', async (req, res) => {
  try {
    const section = req.params.section as WorkspaceSectionKey
    if (!allowedSections.has(section)) {
      return res.status(404).json({ success: false, error: 'Unknown workspace section' })
    }

    const resolved = await resolveCourse(req.params.courseId, req.auth)
    if ('error' in resolved) {
      const status = resolved.error === 'Course not found' ? 404 : 403
      return res.status(status).json({ success: false, error: resolved.error })
    }

    const workspace = await getWorkspaceForCourse(resolved.course)
    const input = asObject(req.body) ?? {}
    const item = await normalizeSectionItem(section, input, undefined, req.auth?.username ?? resolved.course.professorName)
    if (!item) {
      return res.status(400).json({ success: false, error: 'Invalid workspace payload' })
    }

    const nextWorkspace = {
      ...workspace,
      [section]: [...workspace[section], item],
    } as ProfessorWorkspace

    const saved = await saveWorkspace(nextWorkspace)

    if (section === 'messages') {
      const message = item as CourseMessage
      await notifyStudents(
        resolved.course,
        `${resolved.course.code}: ${message.subject}`,
        message.body,
        message.recipientType === 'student' ? message.recipientIds : undefined,
      )
    }

    if (section === 'announcements') {
      const announcement = item as CourseAnnouncement
      await notifyStudents(
        resolved.course,
        `${resolved.course.code}: ${announcement.title}`,
        announcement.body,
      )
    }

    res.status(201).json({ success: true, data: saved })
  } catch (error) {
    console.error('Professor workspace create failed', error)
    res.status(500).json({ success: false, error: 'Failed to save professor workspace data' })
  }
})

professorWorkspaceRoutes.put('/courses/:courseId/:section/:itemId', async (req, res) => {
  try {
    const section = req.params.section as WorkspaceSectionKey
    if (!allowedSections.has(section)) {
      return res.status(404).json({ success: false, error: 'Unknown workspace section' })
    }

    const resolved = await resolveCourse(req.params.courseId, req.auth)
    if ('error' in resolved) {
      const status = resolved.error === 'Course not found' ? 404 : 403
      return res.status(status).json({ success: false, error: resolved.error })
    }

    const workspace = await getWorkspaceForCourse(resolved.course)
    const existing = workspace[section].find((entry: any) => entry.id === req.params.itemId)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Workspace item not found' })
    }

    const input = asObject(req.body) ?? {}
    const item = await normalizeSectionItem(section, input, existing, req.auth?.username ?? resolved.course.professorName)
    if (!item) {
      return res.status(400).json({ success: false, error: 'Invalid workspace payload' })
    }

    const nextWorkspace = {
      ...workspace,
      [section]: workspace[section].map((entry: any) => (entry.id === req.params.itemId ? item : entry)),
    } as ProfessorWorkspace

    const saved = await saveWorkspace(nextWorkspace)
    res.json({ success: true, data: saved })
  } catch (error) {
    console.error('Professor workspace update failed', error)
    res.status(500).json({ success: false, error: 'Failed to update professor workspace data' })
  }
})

professorWorkspaceRoutes.delete('/courses/:courseId/:section/:itemId', async (req, res) => {
  try {
    const section = req.params.section as WorkspaceSectionKey
    if (!allowedSections.has(section)) {
      return res.status(404).json({ success: false, error: 'Unknown workspace section' })
    }

    const resolved = await resolveCourse(req.params.courseId, req.auth)
    if ('error' in resolved) {
      const status = resolved.error === 'Course not found' ? 404 : 403
      return res.status(status).json({ success: false, error: resolved.error })
    }

    const workspace = await getWorkspaceForCourse(resolved.course)
    const nextItems = workspace[section].filter((entry: any) => entry.id !== req.params.itemId)
    const nextWorkspace = { ...workspace, [section]: nextItems } as ProfessorWorkspace
    const saved = await saveWorkspace(nextWorkspace)
    res.json({ success: true, data: saved })
  } catch (error) {
    console.error('Professor workspace delete failed', error)
    res.status(500).json({ success: false, error: 'Failed to delete professor workspace data' })
  }
})

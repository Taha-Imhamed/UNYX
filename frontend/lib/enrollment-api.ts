import type {
  Course,
  CourseScheduleEntry,
  Enrollment,
  EnrollmentStatus,
  PaymentMethod,
  PaymentTransaction,
  Professor,
  Student,
  StudentBalanceSummary,
  StudentFinancialSnapshot,
  CourseRevenueSummary,
  ProfessorRevenueSummary,
} from '@shared/types'
import { API_BASE_URL, apiFetch, authHeaders } from './api-client'

export interface EnrollmentRecord extends Enrollment {
  student: Pick<Student, "id" | "displayId" | "firstName" | "lastName" | "email" | "photo"> & {
    balance: number
  }
}

export interface AcademicDepartment {
  id: string
  name: string
}

export interface AcademicCampus {
  id: string
  name: string
}

export interface AcademicMajor {
  id: string
  name: string
  departmentId: string
  years: number
  subjects: string[]
  courseIds: string[]
  baseCourseIds?: string[]
}

export interface AcademicStructure {
  id: "global"
  enrollmentOpen: boolean
  enrollmentMessage: string | null
  departments: AcademicDepartment[]
  campuses: AcademicCampus[]
  majors: AcademicMajor[]
  updatedAt: string
}


export interface EnrollmentPagePayload {
  items: EnrollmentRecord[]
  total: number
  page: number
  pageSize: number
}

export function fetchEnrollments(options?: {
  page?: number
  pageSize?: number
  courseId?: string
  studentId?: string
  status?: string | string[]
  pendingOnly?: boolean
  signal?: AbortSignal
}) {
  const params = new URLSearchParams()
  if (options?.page) {
    params.set('page', String(options.page))
  }
  if (options?.pageSize) {
    params.set('pageSize', String(options.pageSize))
  }
  if (options?.courseId) {
    params.set('courseId', options.courseId)
  }
  if (options?.studentId) {
    params.set('studentId', options.studentId)
  }
  if (options?.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status]
    statuses.forEach((value) => {
      if (value) params.append('status', value)
    })
  }
  if (options?.pendingOnly) {
    params.set('pendingOnly', 'true')
  }
  const query = params.toString()
  return apiFetch<EnrollmentPagePayload>(`/enrollments${query ? `?${query}` : ''}`, { signal: options?.signal })
}

export interface EnrollmentSummaryCourse {
  courseId: string
  title: string
  professorName: string
  capacity: number
  count: number
}

export interface EnrollmentSummary {
  total: number
  statusCounts: Record<EnrollmentStatus, number>
  activeStudents: number
  tuitionPipeline: number
  topCourses: EnrollmentSummaryCourse[]
  courseRevenues: CourseRevenueSummary[]
  professorRevenues: ProfessorRevenueSummary[]
}

export interface AdminScheduleSlotItem {
  courseId: string
  courseTitle: string
  courseCode?: string | null
  professorId?: string | null
  professorName?: string | null
  campus?: string | null
  room?: string | null
  day: string
  startTime: string
  endTime: string
}

export function fetchEnrollmentSummary(signal?: AbortSignal) {
  return apiFetch<EnrollmentSummary>(`/enrollments/meta/summary`, { signal })
}

export function fetchAdminScheduleAtTime(options: { day: string; startTime: string; endTime?: string; signal?: AbortSignal }) {
  const params = new URLSearchParams({ day: options.day, startTime: options.startTime })
  if (options.endTime) params.append('endTime', options.endTime)
  return apiFetch<AdminScheduleSlotItem[]>(`/admin/schedule/at-time?${params.toString()}`, { signal: options.signal })
}

export function fetchAdminAvailableRooms(options: { day: string; startTime: string; endTime: string; campus?: string; minCapacity?: number; signal?: AbortSignal }) {
  const params = new URLSearchParams({ day: options.day, startTime: options.startTime, endTime: options.endTime })
  if (options.campus) params.append('campus', options.campus)
  if (options.minCapacity) params.append('minCapacity', String(options.minCapacity))
  return apiFetch<string[]>(`/admin/schedule/available-rooms?${params.toString()}`, { signal: options.signal })
}

export interface RoomRecord {
  id: string
  name: string
  campus: string | null
  capacity: number
  createdAt: string
}

export function fetchRooms(options?: { campus?: string; signal?: AbortSignal }) {
  const params = new URLSearchParams()
  if (options?.campus) params.set('campus', options.campus)
  const qs = params.toString()
  return apiFetch<RoomRecord[]>(`/admin/rooms${qs ? `?${qs}` : ''}`, { signal: options?.signal })
}

export function createRoomRequest(payload: { name: string; campus?: string | null; capacity?: number }) {
  return apiFetch<RoomRecord>(`/admin/rooms`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateRoomRequest(id: string, payload: { name?: string; campus?: string | null; capacity?: number }) {
  return apiFetch<RoomRecord>(`/admin/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteRoomRequest(id: string) {
  return apiFetch<{ id: string }>(`/admin/rooms/${id}`, {
    method: 'DELETE',
  })
}

export function updateAdminScheduleRoom(options: {
  day: string
  startTime: string
  endTime: string
  courseId: string
  oldRoom?: string | null
  newRoom: string
  signal?: AbortSignal
}) {
  return apiFetch<{ courseId: string; oldRoom: string | null; newRoom: string; updatedAt: string }>(
    `/admin/schedule/update-room`,
    {
      method: 'POST',
      signal: options.signal,
      body: JSON.stringify({
        day: options.day,
        startTime: options.startTime,
        endTime: options.endTime,
        courseId: options.courseId,
        oldRoom: options.oldRoom ?? '',
        newRoom: options.newRoom,
      }),
    },
  )
}

export async function downloadAdminScheduleReport(signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/admin/schedule/report.csv`, {
    method: 'GET',
    signal,
    headers: {
      Accept: 'text/csv',
      ...authHeaders(),
    },
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { error?: string; message?: string }
      throw new Error(payload.error ?? payload.message ?? `Request failed (${response.status})`)
    }

    const text = await response.text()
    throw new Error(text.trim() || `Request failed (${response.status})`)
  }

  const contentDisposition = response.headers.get('content-disposition') ?? ''
  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)

  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] ?? `schedule-report-${new Date().toISOString().slice(0, 10)}.csv`,
  }
}

export function fetchStudents(signal?: AbortSignal) {
  return apiFetch<Student[]>(`/students`, { signal })
}

export function fetchStudent(studentId: string, signal?: AbortSignal) {
  return apiFetch<Student>(`/students/${studentId}`, { signal })
}

export function fetchProfessors(signal?: AbortSignal) {
  return apiFetch<Professor[]>(`/professors`, { signal })
}

export function fetchStudentEnrollments(studentId: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ studentId, page: '1', pageSize: '200' })
  return apiFetch<EnrollmentPagePayload>(`/enrollments?${params.toString()}`, { signal }).then((payload) => payload.items)
}

export function fetchCourses(signalOrOptions?: AbortSignal | { signal?: AbortSignal; scope?: string; includeSchedule?: boolean; openOnly?: boolean; upcomingDays?: number; page?: number; limit?: number; mine?: boolean }) {
  let signal: AbortSignal | undefined = undefined
  const params = new URLSearchParams()
  if (signalOrOptions instanceof AbortSignal) {
    signal = signalOrOptions
  } else if (signalOrOptions && typeof signalOrOptions === 'object') {
    signal = signalOrOptions.signal
    if (signalOrOptions.scope) params.set('scope', String(signalOrOptions.scope))
    if (signalOrOptions.includeSchedule !== undefined) params.set('includeSchedule', String(signalOrOptions.includeSchedule))
    if (signalOrOptions.openOnly !== undefined) params.set('openOnly', String(signalOrOptions.openOnly))
    if (signalOrOptions.upcomingDays !== undefined) params.set('upcomingDays', String(signalOrOptions.upcomingDays))
    if (signalOrOptions.page !== undefined) params.set('page', String(signalOrOptions.page))
    if (signalOrOptions.limit !== undefined) params.set('limit', String(signalOrOptions.limit))
    if (signalOrOptions.mine !== undefined) params.set('mine', String(signalOrOptions.mine))
  }
  const query = params.toString()
  return apiFetch<Course[]>(`/enrollments/meta/courses${query ? `?${query}` : ''}`, { signal })
}

export function fetchAcademicStructure(signal?: AbortSignal) {
  return apiFetch<AcademicStructure>(`/enrollments/meta/academic-structure`, { signal })
}

export function updateAcademicStructure(payload: {
  departments: AcademicDepartment[]
  campuses: AcademicCampus[]
  majors: AcademicMajor[]
  enrollmentOpen?: boolean
  enrollmentMessage?: string | null
}) {
  return apiFetch<AcademicStructure>(`/enrollments/meta/academic-structure`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updateEnrollmentGlobalToggle(payload: { enrollmentOpen: boolean; enrollmentMessage?: string | null }) {
  return apiFetch<AcademicStructure>(`/enrollments/meta/enrollment-toggle`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function requestAdvisorApproval(enrollmentId: string) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${enrollmentId}/request-advisor-approval`, {
    method: 'POST',
  })
}

export function advisorApproveEnrollment(enrollmentId: string) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${enrollmentId}/advisor-approve`, {
    method: 'POST',
  })
}

export function promoteWaitlistEnrollment(enrollmentId: string) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${enrollmentId}/promote-waitlist`, {
    method: 'POST',
  })
}

export function advisorRejectEnrollment(enrollmentId: string) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${enrollmentId}/advisor-reject`, {
    method: 'POST',
  })
}

export function advisorMessageEnrollment(enrollmentId: string, message: string) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${enrollmentId}/advisor-message`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export function approvePaymentEnrollment(enrollmentId: string) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${enrollmentId}/approve-payment`, {
    method: 'POST',
  })
}

export function rejectPaymentEnrollment(enrollmentId: string) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${enrollmentId}/reject-payment`, {
    method: 'POST',
  })
}

export function createCourseRequest(payload: {
  title: string
  code?: string
  professorId?: string
  capacity?: number
  startDate?: string
  endDate?: string
  price?: number
  department?: string
  branch?: string
  location?: string
  sectionId?: string
  courseType?: 'major' | 'common'
  eligiblePrograms?: string[]
  eligibleFaculties?: string[]
  eligibleSemesters?: string[]
  prerequisiteCourseIds?: string[]
  creditHours?: number
  enrollmentOpen?: boolean
  enrollmentStatusNote?: string | null
  enrollmentOpenAt?: string | null
  enrollmentCloseAt?: string | null
}) {
  return apiFetch<Course>(`/enrollments/meta/courses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCourseRequest(
  id: string,
  payload: {
    title?: string
    code?: string
    professorId?: string
    capacity?: number
    startDate?: string
    endDate?: string
    price?: number
    department?: string
    branch?: string
    location?: string
    sectionId?: string
    courseType?: 'major' | 'common'
    eligiblePrograms?: string[]
    eligibleFaculties?: string[]
    eligibleSemesters?: string[]
    prerequisiteCourseIds?: string[]
    creditHours?: number
    enrollmentOpen?: boolean
    enrollmentStatusNote?: string | null
    enrollmentOpenAt?: string | null
    enrollmentCloseAt?: string | null
  },
) {
  return apiFetch<Course>(`/enrollments/meta/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function bulkUpdateCoursesRequest(payload: {
  courseIds: string[]
  action: 'open' | 'close'
  majorId?: string | null
  openAt?: string | null
  closeAt?: string | null
  note?: string | null
}) {
  return apiFetch<{ updated: Course[]; notFound: string[] }>(`/enrollments/meta/courses/bulk-update`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCourseScheduleRequest(id: string, schedule: Course['schedule']) {
  return apiFetch<Course>(`/enrollments/meta/courses/${id}/schedule`, {
    method: 'PUT',
    body: JSON.stringify({ schedule }),
  })
}

export function deleteCourseRequest(id: string) {
  return apiFetch<Course>(`/enrollments/meta/courses/${id}`, {
    method: 'DELETE',
  })
}

export interface BulkImportCourseRow {
  title: string
  code?: string
  professor?: string
  professorId?: string
  capacity?: number
  startDate?: string
  endDate?: string
  price?: number
  department?: string
  branch?: string
  location?: string
  sectionId?: string
  creditHours?: number
  courseType?: 'major' | 'common'
}

export function bulkImportCoursesRequest(courses: BulkImportCourseRow[]) {
  return apiFetch<{ created: Course[]; failed: Array<{ row: number; title: string; error: string }> }>(
    `/enrollments/meta/courses/bulk-import`,
    {
      method: 'POST',
      body: JSON.stringify({ courses }),
    },
  )
}

export interface DeletedCourseEntry {
  id: string
  course: Course
  enrollments: Enrollment[]
  deletedAt: string
  deletedByUserId: string | null
  deletedByName: string | null
}

export function fetchDeletedCourses() {
  return apiFetch<DeletedCourseEntry[]>(`/enrollments/meta/courses/deleted`)
}

export function restoreDeletedCourseRequest(id: string) {
  return apiFetch<{ course: Course; enrollmentsRestored: number }>(`/enrollments/meta/courses/deleted/${id}/restore`, {
    method: 'POST',
  })
}

export interface AuditLogEntryRecord {
  id: string
  action: string
  actorUserId: string | null
  actorUsername: string | null
  entityType: string | null
  entityId: string | null
  details: Record<string, unknown>
  createdAt: string
}

export function fetchAuditLog(options?: {
  limit?: number
  entityType?: string
  action?: string
  actor?: string
  startDate?: string
  endDate?: string
}) {
  const params = new URLSearchParams()
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.entityType) params.set('entityType', options.entityType)
  if (options?.action) params.set('action', options.action)
  if (options?.actor) params.set('actor', options.actor)
  if (options?.startDate) params.set('startDate', options.startDate)
  if (options?.endDate) params.set('endDate', options.endDate)
  const qs = params.toString()
  return apiFetch<AuditLogEntryRecord[]>(`/enrollments/meta/audit-log${qs ? `?${qs}` : ''}`)
}

export function createEnrollmentRequest(payload: {
  studentId: string
  courseId: string
  professorId?: string
  status?: string
  startDate?: string
  endDate?: string
  price?: number
  couponCode?: string
}) {
  return apiFetch<EnrollmentRecord>(`/enrollments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateEnrollmentRequest(
  id: string,
  payload: Partial<
    Pick<
      Enrollment,
      |
        'courseId'
        | 'status'
        | 'startDate'
        | 'endDate'
        | 'price'
        | 'professorId'
        | 'couponCode'
        | 'gradeMidterm'
        | 'gradeFinal'
        | 'gradeProject'
        | 'gradeParticipation'
        | 'gradeTotal'
        | 'grade'
        | 'letterGrade'
    >
  >,
) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updateEnrollmentGrades(
  id: string,
  payload: Partial<
    Pick<
      Enrollment,
      | 'gradeMidterm'
      | 'gradeFinal'
      | 'gradeProject'
      | 'gradeParticipation'
      | 'gradeTotal'
      | 'grade'
      | 'letterGrade'
      | 'status'
    >
  >,
) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${id}/grades`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function approveEnrollment(id: string) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${id}/approve`, {
    method: 'POST',
  })
}

export function deleteEnrollmentRequest(id: string) {
  return apiFetch<EnrollmentRecord>(`/enrollments/${id}`, {
    method: 'DELETE',
  })
}

export function fetchStudentBalance(studentId: string, signal?: AbortSignal) {
  return apiFetch<StudentBalanceSummary>(`/students/${studentId}/balance`, { signal })
}

export function fetchStudentTransactions(studentId: string, signal?: AbortSignal) {
  return apiFetch<PaymentTransaction[]>(`/students/${studentId}/transactions`, { signal })
}

export function fetchStudentFinancials(studentId: string, signal?: AbortSignal) {
  return apiFetch<StudentFinancialSnapshot>(`/students/${studentId}/financial`, { signal })
}

export function submitStudentPayment(
  studentId: string,
  payload: { amount: number; method: PaymentMethod; note?: string },
) {
  return apiFetch<{ transaction: PaymentTransaction; balance: number; updatedAt: string }>(
    `/students/${studentId}/payments`,
    {
    method: 'POST',
    body: JSON.stringify(payload),
    },
  )
}

export function previewEnrollmentSchedule(studentId: string, sectionIds: string[]) {
  return apiFetch<{
    sessions: Array<
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
    >
    conflicts: Array<{ day: string; courseIds: string[]; range: string }>
  }>(`/enrollments/schedule/preview`, {
    method: 'POST',
    body: JSON.stringify({ studentId, sectionIds }),
  })
}

export type { Course } from '@shared/types'

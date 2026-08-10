import type {
  Student,
  PaymentTransaction,
  StudentBalanceSummary,
  StudentFinancialSnapshot,
  Enrollment,
  CourseAvailability,
  CourseScheduleEntry,
  EnrollmentWithCourse,
  StudentHintsResponse,
  StudentTranscript,
} from '@shared/types'

const apiBaseEnv = process.env.NEXT_PUBLIC_API_URL ?? null

function resolveApiBase() {
  const fromEnv = apiBaseEnv && apiBaseEnv.trim().length > 0 ? apiBaseEnv.trim() : null
  if (fromEnv) {
    return fromEnv.endsWith('/') ? fromEnv.slice(0, -1) : fromEnv
  }
  return '/api'
}

const API_BASE_URL = resolveApiBase()
const API_TIMEOUT_MS = 15000

interface ApiFetchInit extends RequestInit {
  timeoutMs?: number
  retryOnTimeout?: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AcademicStructureSnapshot {
  enrollmentOpen: boolean
  enrollmentMessage?: string | null
  updatedAt?: string
}

function authHeaders(init?: HeadersInit): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('ar_company_token') ?? sessionStorage.getItem('ar_company_token')
      : null
  return token ? { ...init, Authorization: `Bearer ${token}` } : init ?? {}
}

function currentStudentId() {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('ar_company_user') ?? sessionStorage.getItem('ar_company_user')
    if (!stored) return null
    const parsed = JSON.parse(stored) as { studentId?: string | null; id?: string }
    return parsed.studentId ?? parsed.id ?? null
  } catch (error) {
    console.error('Unable to parse stored user for studentId', error)
    return null
  }
}

function ensureStudentId(studentId?: string) {
  const resolved = studentId ?? currentStudentId()
  if (!resolved) {
    throw new Error('Student identity unavailable. Please sign in again.')
  }
  return resolved
}

async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const { timeoutMs = API_TIMEOUT_MS, retryOnTimeout = 0, ...requestInit } = init ?? {}

  let attempt = 0
  while (true) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort(new Error('Request timed out'))
    }, timeoutMs)

    if (requestInit.signal) {
      if (requestInit.signal.aborted) {
        controller.abort(requestInit.signal.reason)
      } else {
        requestInit.signal.addEventListener('abort', () => controller.abort(requestInit.signal?.reason), { once: true })
      }
    }

    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(requestInit.headers),
        },
        ...requestInit,
        signal: controller.signal,
      })
    } catch (error) {
      clearTimeout(timeoutId)
      const timedOut = error instanceof Error && error.name === 'AbortError' && !requestInit.signal?.aborted
      if (timedOut && attempt < retryOnTimeout) {
        attempt += 1
        continue
      }
      const message =
        timedOut
          ? 'Request timed out. Please check that the backend server is running and reachable.'
          : error instanceof Error
            ? error.message
            : 'Network request failed'
      throw new Error(message)
    } finally {
      clearTimeout(timeoutId)
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      throw new Error(`Unexpected response (expected JSON): ${text.slice(0, 120)}...`)
    }

    const json = (await response.json()) as ApiResponse<T>

    if (!response.ok || !json.success) {
      throw new Error(json.error || 'Unable to process request')
    }

    if (json.data === undefined) {
      return undefined as T
    }

    return json.data
  }
}

export function fetchStudents(signal?: AbortSignal) {
  return apiFetch<Student[]>('/students', { signal })
}

export function fetchStudent(id: string, signal?: AbortSignal) {
  return apiFetch<Student>(`/students/${id}`, { signal })
}

export function fetchStudentMe(signal?: AbortSignal) {
  return apiFetch<Student>('/students/me', { signal })
}

export function createStudent(payload: Omit<Student, 'id' | 'displayId'>) {
  return apiFetch<Student>('/students', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateStudent(id: string, payload: Partial<Student>) {
  return apiFetch<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteStudent(id: string) {
  return apiFetch<void>(`/students/${id}`, { method: 'DELETE' })
}

export async function fetchStudentEnrollments(studentId?: string, signal?: AbortSignal) {
  const id = ensureStudentId(studentId)
  const params = new URLSearchParams({ studentId: id })
  ;["active", "pending", "pendingSupervisorApproval", "pendingAdvisorApproval", "pending_approval", "waitlisted"].forEach((status) =>
    params.append("status", status),
  )
  const result = await apiFetch<{ items: Enrollment[]; total: number; page: number; pageSize: number }>(
    `/enrollments?${params.toString()}`,
    { signal, timeoutMs: 45000, retryOnTimeout: 2 },
  )
  return result.items
}

export interface FetchAvailableCoursesOptions {
  limit?: number
  page?: number
  openOnly?: boolean
  upcomingDays?: number
  includeSchedule?: boolean
}

export function fetchAvailableCourses(options?: FetchAvailableCoursesOptions, signal?: AbortSignal) {
  const params = new URLSearchParams()
  if (options?.limit !== undefined) params.set('limit', String(options.limit))
  if (options?.page !== undefined) params.set('page', String(options.page))
  if (options?.openOnly !== undefined) params.set('openOnly', String(options.openOnly))
  if (options?.upcomingDays !== undefined) params.set('upcomingDays', String(options.upcomingDays))
  if (options?.includeSchedule !== undefined) params.set('includeSchedule', String(options.includeSchedule))
  const query = params.toString()
  const path = `/enrollments/meta/courses${query ? `?${query}` : ''}`
  return apiFetch<CourseAvailability[]>(path, { signal })
}

export function submitEnrollmentRequest(input: { courseId: string; couponCode?: string | null }) {
  return apiFetch<Enrollment & { availableSeats?: number }>(`/enrollments/self`, {
    method: 'POST',
    body: JSON.stringify({ courseId: input.courseId, couponCode: input.couponCode ?? undefined }),
  })
}

export function cancelSelfEnrollment(enrollmentId: string) {
  return apiFetch<Enrollment>(`/enrollments/self/${enrollmentId}`, { method: 'DELETE' })
}

export function submitStudentRequestMessage(input: {
  subject: string
  message: string
  category?: string
  courseId?: string
  priority?: 'low' | 'normal' | 'high'
  studentId?: string
  context?: string
  targetRole?: 'admin' | 'supervisor'
  attachment?: string
  attachmentName?: string
}) {
  const studentId = ensureStudentId(input.studentId)
  return apiFetch<{ id: string }>(`/feedback`, {
    method: 'POST',
    body: JSON.stringify({
      subject: input.subject,
      message: input.message,
      category: input.category || 'general',
      courseId: input.courseId || undefined,
      priority: input.priority || 'normal',
      studentId,
      context: input.context || undefined,
      source: 'student-portal',
      targetRole: input.targetRole || 'admin',
      attachment: input.attachment,
      attachmentName: input.attachmentName,
      status: 'open',
      createdAt: new Date().toISOString(),
    }),
  })
}

export function fetchStudentBalance(id: string, signal?: AbortSignal) {
  return apiFetch<StudentBalanceSummary>(`/students/${id}/balance`, { signal, timeoutMs: 30000, retryOnTimeout: 2 })
}

export function fetchStudentTransactions(id: string, signal?: AbortSignal) {
  return apiFetch<PaymentTransaction[]>(`/students/${id}/transactions`, { signal })
}

export function fetchStudentFinancialSnapshot(id: string, signal?: AbortSignal) {
  return apiFetch<StudentFinancialSnapshot>(`/students/${id}/financial`, { signal, timeoutMs: 30000, retryOnTimeout: 2 })
}

export function fetchStudentGrades(studentId?: string, signal?: AbortSignal) {
  const id = ensureStudentId(studentId)
  return apiFetch<EnrollmentWithCourse[]>(`/students/${id}/grades`, { signal, timeoutMs: 30000, retryOnTimeout: 2 })
}

export function fetchStudentTranscript(studentId?: string, signal?: AbortSignal) {
  const id = ensureStudentId(studentId)
  return apiFetch<StudentTranscript>(`/students/${id}/transcript`, { signal, timeoutMs: 30000, retryOnTimeout: 2 })
}

export async function downloadStudentTranscriptCsv(studentId?: string, signal?: AbortSignal) {
  const id = ensureStudentId(studentId)
  const response = await fetch(`${API_BASE_URL}/students/${id}/transcript.csv`, {
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
      const payload = (await response.json()) as ApiResponse<never>
      throw new Error(payload.error || payload.message || `Request failed (${response.status})`)
    }
    throw new Error(`Request failed (${response.status})`)
  }

  return response.blob()
}

export async function downloadStudentTranscriptPdf(studentId?: string, signal?: AbortSignal) {
  const id = ensureStudentId(studentId)
  const response = await fetch(`${API_BASE_URL}/students/${id}/transcript.pdf`, {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/pdf',
      ...authHeaders(),
    },
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as ApiResponse<never>
      throw new Error(payload.error || payload.message || `Request failed (${response.status})`)
    }
    throw new Error(`Request failed (${response.status})`)
  }

  return response.blob()
}

export function fetchStudentHints(signal?: AbortSignal) {
  return apiFetch<StudentHintsResponse>('/student/hints', { signal })
}

export function fetchAcademicStructure(signal?: AbortSignal) {
  return apiFetch<AcademicStructureSnapshot>('/enrollments/meta/academic-structure', { signal })
}

export function updateStudentSelf(payload: Partial<Student>) {
  return apiFetch<Student>(`/students/self`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function recordStudentPayment(id: string, payload: { amount: number; method: PaymentTransaction['method']; note?: string; invoiceId?: string | null }) {
  return apiFetch<{ transaction: PaymentTransaction; balance: number; updatedAt: string }>(`/students/${id}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function previewStudentSchedule(courseIds: string[], studentId?: string, signal?: AbortSignal) {
  const id = ensureStudentId(studentId)
  return apiFetch<{ sessions: Array<CourseScheduleEntry & { courseId: string; courseTitle: string; courseCode?: string; status: Enrollment['status'] | 'proposed'; source: 'existing' | 'proposed' }>; conflicts: Array<{ day: string; courseIds: string[]; range: string }> }>(
    `/students/${id}/schedule/preview`,
    {
      method: 'POST',
      body: JSON.stringify({ courseIds }),
      signal,
    },
  )
}

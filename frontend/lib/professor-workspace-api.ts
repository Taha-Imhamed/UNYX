import { apiFetch } from "./api-client"
import type { RoomBooking } from "@shared/types"

export type MaterialCategory = "syllabus" | "slides" | "pdf" | "other"
export type PublishableStatus = "draft" | "published" | "closed"
export type AttendanceStatus = "present" | "absent" | "late" | "excused"
export type OfficeHourStatus = "scheduled" | "cancelled" | "completed"
export type WorkspaceSectionKey =
  | "materials"
  | "assignments"
  | "quizzes"
  | "attendanceSessions"
  | "messages"
  | "announcements"
  | "officeHours"

export interface ProfessorMaterial {
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

export interface ProfessorAssignment {
  id: string
  title: string
  description?: string | null
  dueDate?: string | null
  maxPoints?: number | null
  status: PublishableStatus
  createdAt: string
  updatedAt: string
}

export interface ProfessorQuiz {
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

export interface AttendanceRecord {
  studentId: string
  studentName: string
  status: AttendanceStatus
  note?: string | null
}

export interface AttendanceSession {
  id: string
  title: string
  sessionDate: string
  notes?: string | null
  records: AttendanceRecord[]
  createdAt: string
  updatedAt: string
}

export interface CourseMessage {
  id: string
  recipientType: "student" | "course"
  recipientIds: string[]
  subject: string
  body: string
  sentAt: string
  createdBy: string
}

export interface CourseAnnouncement {
  id: string
  title: string
  body: string
  pinned: boolean
  publishedAt: string
  updatedAt: string
}

export interface OfficeHour {
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

export interface MarkPublication {
  id: string
  title: string
  message: string
  publishedAt: string
  enrollmentIds: string[]
}

export interface ProfessorWorkspace {
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

export interface MockClassConflict {
  type: "room-course" | "room-booking" | "professor-course" | "professor-booking"
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

export interface MockClassPlanner {
  rooms: string[]
  bookings: RoomBooking[]
}

export interface MockClassAvailabilityResult {
  available: boolean
  conflicts: MockClassConflict[]
}

export function fetchProfessorWorkspace(courseId: string, signal?: AbortSignal) {
  return apiFetch<ProfessorWorkspace>(`/professor-workspace/courses/${courseId}`, { signal })
}

export function createProfessorWorkspaceItem<T extends Record<string, unknown>>(
  courseId: string,
  section: WorkspaceSectionKey,
  payload: T,
) {
  return apiFetch<ProfessorWorkspace>(`/professor-workspace/courses/${courseId}/${section}`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateProfessorWorkspaceItem<T extends Record<string, unknown>>(
  courseId: string,
  section: WorkspaceSectionKey,
  itemId: string,
  payload: T,
) {
  return apiFetch<ProfessorWorkspace>(`/professor-workspace/courses/${courseId}/${section}/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function deleteProfessorWorkspaceItem(courseId: string, section: WorkspaceSectionKey, itemId: string) {
  return apiFetch<ProfessorWorkspace>(`/professor-workspace/courses/${courseId}/${section}/${itemId}`, {
    method: "DELETE",
  })
}

export function publishCourseMarks(courseId: string, payload?: { title?: string; message?: string }) {
  return apiFetch<ProfessorWorkspace>(`/professor-workspace/courses/${courseId}/publish-marks`, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  })
}

export function fetchMockClassPlanner(courseId: string, signal?: AbortSignal) {
  return apiFetch<MockClassPlanner>(`/professor-workspace/courses/${courseId}/mock-classes`, { signal })
}

export function checkMockClassAvailability(
  courseId: string,
  payload: { roomName: string; startAt: string; endAt: string },
) {
  return apiFetch<MockClassAvailabilityResult>(`/professor-workspace/courses/${courseId}/mock-classes/availability`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function createMockClassBooking(
  courseId: string,
  payload: { roomName: string; startAt: string; endAt: string; purpose?: string; notes?: string | null },
) {
  return apiFetch<{ booking: RoomBooking; planner: MockClassPlanner }>(`/professor-workspace/courses/${courseId}/mock-classes`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

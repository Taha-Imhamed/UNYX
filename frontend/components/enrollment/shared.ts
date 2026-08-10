import type { AcademicCampus, AcademicDepartment, AcademicMajor, EnrollmentRecord } from "@/lib/enrollment-api"
import type { Course, CourseScheduleEntry, EnrollmentStatus } from "@shared/types"

export const statusMeta: Record<
  EnrollmentStatus,
  { label: string; badge: "default" | "secondary" | "outline" | "destructive"; helper: string }
> = {
  active: { label: "Active", badge: "default", helper: "Currently in progress" },
  pending: { label: "Pending", badge: "secondary", helper: "Awaiting start or approval" },
  pendingSupervisorApproval: {
    label: "Pending Supervisor Approval",
    badge: "outline",
    helper: "Waiting on supervisor confirmation",
  },
  pendingAdvisorApproval: {
    label: "Pending Advisor Approval",
    badge: "outline",
    helper: "Awaiting academic advisor sign-off",
  },
  pending_approval: { label: "Pending Approval", badge: "outline", helper: "Awaiting payment confirmation" },
  rejected: { label: "Rejected", badge: "destructive", helper: "Enrollment rejected" },
  dropped: { label: "Dropped", badge: "destructive", helper: "Enrollment dropped" },
  waitlisted: { label: "Waitlisted", badge: "outline", helper: "Waiting for seat" },
  completed: { label: "Completed", badge: "default", helper: "Course finished" },
  cancelled: { label: "Cancelled", badge: "destructive", helper: "Enrollment removed" },
}

export const pendingStatuses = new Set<EnrollmentStatus>([
  "pending",
  "pendingSupervisorApproval",
  "pendingAdvisorApproval",
  "pending_approval",
])

export const filterPendingAllowed = (items: EnrollmentRecord[], blocked: Set<string>) =>
  items.filter((item) => pendingStatuses.has(item.status as EnrollmentStatus) && !blocked.has(item.id))

export const filterBlocked = (items: EnrollmentRecord[], blocked: Set<string>) =>
  items.filter((item) => !blocked.has(item.id))

export const blockedEnrollmentIdsGlobal = new Set<string>()

export const debugEnrollmentLog = (
  source: string,
  payload: { requestVersion?: number; page?: number; pageSize?: number; pendingOnly?: boolean; ids?: string[]; note?: string },
) => {
  console.info(
    `[enrollment-debug] ${source}`,
    JSON.stringify({
      ...payload,
      ts: new Date().toISOString(),
    }),
  )
}

export function getCouponPercent(code: string, lookup: Record<string, number>): number | null {
  const normalised = code.trim().toLowerCase()
  if (!normalised) {
    return null
  }
  const percent = lookup[normalised]
  return typeof percent === "number" ? percent : null
}

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })

export const scheduleDays: Array<CourseScheduleEntry["day"]> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

export const EMPTY_DEPARTMENTS: AcademicDepartment[] = []
export const EMPTY_CAMPUSES: AcademicCampus[] = []
export const EMPTY_MAJORS: AcademicMajor[] = []

/**
 * Shared pill-button color classes for the enrollment section, built from the
 * app's theme tokens (primary/secondary blue family) instead of one-off hex
 * values. Every enrollment action button should be `rounded-full` and use one
 * of these instead of inventing new colors per button.
 */
export const pillButtonStyles = {
  neutral: "rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
  primary:
    "rounded-full bg-primary text-primary-foreground shadow-[0_10px_24px_-6px_color-mix(in_oklab,var(--primary)_55%,transparent)] hover:bg-primary/90 hover:shadow-[0_12px_28px_-6px_color-mix(in_oklab,var(--primary)_65%,transparent)] transition-shadow",
  positive: "rounded-full border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  danger:
    "rounded-full bg-red-600 text-white shadow-[0_10px_24px_-6px_rgba(220,38,38,0.5)] hover:bg-red-700 hover:shadow-[0_12px_28px_-6px_rgba(220,38,38,0.6)] transition-shadow",
  dangerOutline: "rounded-full border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
} as const

export function isEnrollmentWindowOpen(course: Course, now = Date.now()) {
  const open = course.enrollmentOpenAt || course.enrollmentOpensAt
  const close = course.enrollmentCloseAt || course.enrollmentClosesAt
  const openTs = open ? new Date(open).getTime() : null
  const closeTs = close ? new Date(close).getTime() : null
  if (openTs && Number.isFinite(openTs) && now < openTs) return false
  if (closeTs && Number.isFinite(closeTs) && now > closeTs) return false
  return true
}

export function isEnrollmentActuallyOpen(course: Course, now = Date.now()) {
  return course.enrollmentOpen !== false && isEnrollmentWindowOpen(course, now)
}

export type EnrollmentClosedReason =
  | { kind: "open" }
  | { kind: "manually_closed" }
  | { kind: "window_not_started"; opensAt: string }
  | { kind: "window_ended"; closedAt: string }

/**
 * enrollmentOpen (manual flag) and enrollmentOpenAt/enrollmentCloseAt (time window)
 * are independent gates — a course can be manually "open" and still show closed
 * because the window hasn't started or already ended. This tells admins which
 * gate is actually blocking enrollment, instead of just "Closed".
 */
export function getEnrollmentClosedReason(course: Course, now = Date.now()): EnrollmentClosedReason {
  if (course.enrollmentOpen === false) {
    return { kind: "manually_closed" }
  }
  const open = course.enrollmentOpenAt || course.enrollmentOpensAt
  const close = course.enrollmentCloseAt || course.enrollmentClosesAt
  const openTs = open ? new Date(open).getTime() : null
  const closeTs = close ? new Date(close).getTime() : null
  if (openTs && Number.isFinite(openTs) && now < openTs) {
    return { kind: "window_not_started", opensAt: open as string }
  }
  if (closeTs && Number.isFinite(closeTs) && now > closeTs) {
    return { kind: "window_ended", closedAt: close as string }
  }
  return { kind: "open" }
}

export function formatEnrollmentClosedReason(reason: EnrollmentClosedReason): string {
  switch (reason.kind) {
    case "open":
      return "Open"
    case "manually_closed":
      return "Closed manually by admin"
    case "window_not_started":
      return `Opens ${dateFormatter.format(new Date(reason.opensAt))}`
    case "window_ended":
      return `Window ended ${dateFormatter.format(new Date(reason.closedAt))}`
  }
}

export interface EnrollmentRow {
  record: EnrollmentRecord
  searchKey: string
}

export interface StudentFinancialRow {
  id: string
  displayId: string
  firstName: string
  lastName: string
  email: string
  photo: string
  balance: number
  totalEnrollments: number
  activeEnrollments: number
  tuitionTotal: number
}

export function buildSearchKey(record: EnrollmentRecord) {
  return [
    record.student.firstName,
    record.student.lastName,
    record.student.email,
    record.courseTitle,
    record.professorName,
    record.status,
  ]
    .join(" ")
    .toLowerCase()
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0) ?? ""}${lastName.charAt(0) ?? ""}`.toUpperCase()
}

export function normalizeId(value: string) {
  return value.trim().toLowerCase()
}

export function getEligibleYearValues(eligibleSemesters?: string[] | null) {
  if (!Array.isArray(eligibleSemesters)) return []
  const seen = new Set<string>()
  return eligibleSemesters
    .map((value) => String(value).trim().toLowerCase())
    .flatMap((value) => {
      const match = value.match(/year\s*(\d+)/i)
      if (!match) return []
      return [String(Number(match[1]))]
    })
    .filter((value) => {
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
}

export function formatEligibleYearLabels(eligibleSemesters?: string[] | null) {
  return getEligibleYearValues(eligibleSemesters).map((value) => `Year ${value}`)
}

export function matchesFilters(
  row: EnrollmentRow,
  query: string,
  courseFilter: string,
  statusFilter: "all" | EnrollmentStatus,
) {
  const matchQuery = query ? row.searchKey.includes(query) : true
  const matchCourse = courseFilter === "all" ? true : row.record.courseId === courseFilter
  const matchStatus = statusFilter === "all" ? true : row.record.status === statusFilter
  return matchQuery && matchCourse && matchStatus
}

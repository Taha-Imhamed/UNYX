import { getCollection } from '../db/postgres.js'
import type { Semester, Student, Course } from '../../../shared/types/index.js'

const LEGACY_YEAR_WORDS: Record<string, number> = {
  'first-year': 1,
  'second-year': 2,
  'third-year': 3,
  'fourth-year': 4,
  'fifth-year': 5,
  'sixth-year': 6,
}

/**
 * Single source of truth for a student's class year (1-6). Prefers the real
 * `yearLevel` column; falls back to the legacy free-text `currentSemester`
 * ("Year N" / bare digit / old "first-year" word form) for records that predate
 * the migration that introduced `yearLevel`. Consolidates 8 previously-duplicated
 * copies of this logic scattered across the backend and frontend.
 */
export function deriveStudentYearLevel(student: (Partial<Student> & Record<string, unknown>) | null | undefined): number | undefined {
  if (!student) return undefined
  const direct = Number(student.yearLevel ?? student.currentYear)
  if (Number.isFinite(direct) && direct > 0) {
    return Math.floor(direct)
  }

  const semester = typeof student.currentSemester === 'string' ? student.currentSemester.trim() : ''
  if (!semester) return undefined

  const wordMatch = LEGACY_YEAR_WORDS[semester.toLowerCase()]
  if (wordMatch) return wordMatch

  const match = semester.match(/^(?:year\s*)?(\d+)$/i)
  if (!match) return undefined

  const derivedYear = Number(match[1])
  return Number.isFinite(derivedYear) && derivedYear > 0 ? Math.floor(derivedYear) : undefined
}

export function formatYearLevelLabel(yearLevel: number): string {
  return `Year ${yearLevel}`
}

async function semestersCollection() {
  return getCollection<Semester>('semesters')
}

let semesterCache: { at: number; rows: Semester[] } | null = null
const SEMESTER_CACHE_TTL_MS = 30_000

async function loadAllSemesters(): Promise<Semester[]> {
  if (semesterCache && Date.now() - semesterCache.at < SEMESTER_CACHE_TTL_MS) {
    return semesterCache.rows
  }
  const collection = await semestersCollection()
  const rows = await collection.find().sort({ startDate: 1 }).toArray()
  semesterCache = { at: Date.now(), rows }
  return rows
}

export function invalidateSemesterCache() {
  semesterCache = null
}

/**
 * Resolves the semester a given date falls inside, by range (not the old
 * "slice startDate to YYYY-MM" heuristic). Returns null if no semester covers
 * the date — callers should treat that as "term not yet configured" rather
 * than fabricating one.
 */
export async function resolveSemesterForDate(dateIso: string | null | undefined): Promise<Semester | null> {
  if (!dateIso) return null
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return null
  const semesters = await loadAllSemesters()
  const match = semesters.find((s) => {
    const start = new Date(s.startDate)
    const end = new Date(s.endDate)
    return date >= start && date <= end
  })
  return match ?? null
}

/**
 * Replacement for the old getCourseSemester(course) — resolves a course's real
 * semester via its semesterId FK first, falling back to date-range lookup by
 * startDate for legacy rows that predate the FK being populated.
 */
export async function resolveCourseSemester(course: Pick<Course, 'semesterId' | 'startDate'>): Promise<Semester | null> {
  if (course.semesterId) {
    const semesters = await loadAllSemesters()
    const byId = semesters.find((s) => s.id === course.semesterId)
    if (byId) return byId
  }
  return resolveSemesterForDate(course.startDate)
}

export async function getSemesterById(id: string | null | undefined): Promise<Semester | null> {
  if (!id) return null
  const semesters = await loadAllSemesters()
  return semesters.find((s) => s.id === id) ?? null
}

export async function listAllSemesters(): Promise<Semester[]> {
  return loadAllSemesters()
}

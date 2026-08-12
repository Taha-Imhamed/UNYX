import type { Student } from "@shared/types"

const LEGACY_YEAR_WORDS: Record<string, number> = {
  "first-year": 1,
  "second-year": 2,
  "third-year": 3,
  "fourth-year": 4,
  "fifth-year": 5,
  "sixth-year": 6,
}

/**
 * Single source of truth for a student's class year (1-6) on the frontend —
 * mirrors backend/src/lib/academic-terms.ts's deriveStudentYearLevel. Prefers
 * the real `yearLevel` field; falls back to the legacy free-text
 * `currentSemester` ("Year N" / bare digit / old word form) for records that
 * predate the migration that introduced `yearLevel`.
 */
export function deriveStudentYearLevel(student: Pick<Student, "yearLevel" | "currentYear" | "currentSemester"> | null | undefined): number | undefined {
  if (!student) return undefined

  const direct = Number(student.yearLevel ?? student.currentYear)
  if (Number.isFinite(direct) && direct > 0) {
    return Math.floor(direct)
  }

  const semester = typeof student.currentSemester === "string" ? student.currentSemester.trim() : ""
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

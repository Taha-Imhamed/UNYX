import { describe, expect, it } from "vitest"
import { deriveStudentYearLevel, formatYearLevelLabel } from "./academic-terms"

describe("deriveStudentYearLevel", () => {
  it("prefers a real yearLevel over everything else", () => {
    expect(deriveStudentYearLevel({ yearLevel: 3, currentYear: 1, currentSemester: "Year 5" })).toBe(3)
  })

  it("falls back to currentYear when yearLevel is absent", () => {
    expect(deriveStudentYearLevel({ currentYear: 2 })).toBe(2)
  })

  it('parses "Year N" free text', () => {
    expect(deriveStudentYearLevel({ currentSemester: "Year 4" })).toBe(4)
  })

  it("parses a bare numeric string", () => {
    expect(deriveStudentYearLevel({ currentSemester: "5" })).toBe(5)
  })

  it("is case-insensitive and tolerates extra whitespace", () => {
    expect(deriveStudentYearLevel({ currentSemester: "  yEAr   2  " })).toBe(2)
  })

  it("maps legacy word-form values", () => {
    expect(deriveStudentYearLevel({ currentSemester: "third-year" })).toBe(3)
    expect(deriveStudentYearLevel({ currentSemester: "first-year" })).toBe(1)
  })

  it("ignores non-positive or non-finite values", () => {
    expect(deriveStudentYearLevel({ yearLevel: 0, currentSemester: "Year 2" })).toBe(2)
    expect(deriveStudentYearLevel({ yearLevel: -1, currentSemester: "Year 2" })).toBe(2)
  })

  it("returns undefined when nothing is set", () => {
    expect(deriveStudentYearLevel({})).toBeUndefined()
  })

  it("returns undefined for unrecognized free text", () => {
    expect(deriveStudentYearLevel({ currentSemester: "Track 3" })).toBeUndefined()
  })

  it("returns undefined for a null/undefined student", () => {
    expect(deriveStudentYearLevel(null)).toBeUndefined()
    expect(deriveStudentYearLevel(undefined)).toBeUndefined()
  })
})

describe("formatYearLevelLabel", () => {
  it('formats a year level as "Year N"', () => {
    expect(formatYearLevelLabel(1)).toBe("Year 1")
    expect(formatYearLevelLabel(6)).toBe("Year 6")
  })
})

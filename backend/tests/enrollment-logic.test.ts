import { isTimeOverlapping, normalizeCourseType, normalizeEligibilityList } from '../src/routes/enrollments.js'
import type { CourseScheduleEntry } from '../../../shared/types/index.js'

function slot(day: CourseScheduleEntry['day'], startTime: string, endTime: string): CourseScheduleEntry {
  return { day, startTime, endTime, location: 'Room 1' }
}

describe('isTimeOverlapping', () => {
  it('returns null for different days', () => {
    expect(isTimeOverlapping(slot('monday', '09:00', '10:00'), slot('tuesday', '09:00', '10:00'), 10)).toBeNull()
  })

  it('detects a direct overlap', () => {
    expect(isTimeOverlapping(slot('monday', '09:00', '10:00'), slot('monday', '09:30', '10:30'), 10)).toBe('overlap')
  })

  it('detects back-to-back classes with insufficient travel buffer', () => {
    // 10:00-10:05 gap, buffer requires 10 minutes
    expect(isTimeOverlapping(slot('monday', '09:00', '10:00'), slot('monday', '10:05', '11:00'), 10)).toBe('travel')
  })

  it('allows back-to-back classes when the gap meets the buffer', () => {
    // 15 minute gap, buffer only requires 10
    expect(isTimeOverlapping(slot('monday', '09:00', '10:00'), slot('monday', '10:15', '11:00'), 10)).toBeNull()
  })

  it('is symmetric regardless of argument order', () => {
    const a = slot('monday', '09:00', '10:00')
    const b = slot('monday', '10:05', '11:00')
    expect(isTimeOverlapping(a, b, 10)).toBe(isTimeOverlapping(b, a, 10))
  })

  it('returns null for a zero-length gap with zero buffer', () => {
    expect(isTimeOverlapping(slot('monday', '09:00', '10:00'), slot('monday', '10:00', '11:00'), 0)).toBeNull()
  })

  it('returns null when a time value fails to parse', () => {
    expect(isTimeOverlapping(slot('monday', 'not-a-time', '10:00'), slot('monday', '09:30', '10:30'), 10)).toBeNull()
  })
})

describe('normalizeCourseType', () => {
  it('recognizes "common" explicitly', () => {
    expect(normalizeCourseType('common')).toBe('common')
  })

  it('defaults everything else to "major"', () => {
    expect(normalizeCourseType('major')).toBe('major')
    expect(normalizeCourseType(undefined)).toBe('major')
    expect(normalizeCourseType('')).toBe('major')
    expect(normalizeCourseType(123)).toBe('major')
  })
})

describe('normalizeEligibilityList', () => {
  it('lowercases and trims each entry (does not dedupe — duplicates pass through)', () => {
    expect(normalizeEligibilityList(['  Year 1 ', 'YEAR 1', 'Year 2'])).toEqual(['year 1', 'year 1', 'year 2'])
  })

  it('drops empty/whitespace-only entries', () => {
    expect(normalizeEligibilityList(['Year 1', '  ', ''])).toEqual(['year 1'])
  })

  it('returns undefined for a non-array input', () => {
    expect(normalizeEligibilityList('not-an-array')).toBeUndefined()
    expect(normalizeEligibilityList(null)).toBeUndefined()
    expect(normalizeEligibilityList(undefined)).toBeUndefined()
  })

  it('returns undefined when the array becomes empty after normalization', () => {
    expect(normalizeEligibilityList(['', '   '])).toBeUndefined()
  })
})

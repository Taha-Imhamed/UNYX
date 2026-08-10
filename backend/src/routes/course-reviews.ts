import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { getCollection } from '../db/postgres.js'
import { enrollmentsCollection } from '../data/collections.js'
import type { CourseReview, CourseReviewSummary } from '../../../shared/types/index.js'
import { logger } from '../lib/logger.js'

export const courseReviewRoutes: ReturnType<typeof Router> = Router()

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

async function reviewsCollection() {
  return getCollection<CourseReview>('course_reviews')
}

// Aggregate ratings per course. Available to any authenticated user (students browsing courses to enroll).
courseReviewRoutes.get('/summary', async (_req, res) => {
  try {
    const collection = await reviewsCollection()
    const items = await collection.find().limit(5000).toArray()
    const byCourse = new Map<string, { ratingSum: number; difficultySum: number; difficultyCount: number; count: number }>()
    for (const review of items) {
      const bucket = byCourse.get(review.courseId) ?? { ratingSum: 0, difficultySum: 0, difficultyCount: 0, count: 0 }
      bucket.ratingSum += review.rating
      bucket.count += 1
      if (typeof review.difficulty === 'number') {
        bucket.difficultySum += review.difficulty
        bucket.difficultyCount += 1
      }
      byCourse.set(review.courseId, bucket)
    }
    const summaries: CourseReviewSummary[] = Array.from(byCourse.entries()).map(([courseId, bucket]) => ({
      courseId,
      averageRating: Number((bucket.ratingSum / bucket.count).toFixed(2)),
      averageDifficulty: bucket.difficultyCount > 0 ? Number((bucket.difficultySum / bucket.difficultyCount).toFixed(2)) : null,
      reviewCount: bucket.count,
    }))
    res.json({ success: true, data: summaries })
  } catch (error) {
    logger.error({ err: error }, 'Failed to build course review summary')
    res.status(500).json({ success: false, error: 'Failed to build course review summary' })
  }
})

courseReviewRoutes.get('/', async (req, res) => {
  try {
    const collection = await reviewsCollection()
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined
    const items = await collection.find(courseId ? { courseId } : {}).sort({ createdAt: -1 }).limit(500).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch course reviews')
    res.status(500).json({ success: false, error: 'Failed to fetch course reviews' })
  }
})

courseReviewRoutes.get('/mine', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await reviewsCollection()
    const items = await collection.find({ studentId }).sort({ createdAt: -1 }).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch your course reviews')
    res.status(500).json({ success: false, error: 'Failed to fetch your course reviews' })
  }
})

courseReviewRoutes.post('/', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const { courseId, courseTitle, professorId, professorName, rating, difficulty, comment } = req.body ?? {}
    if (!courseId || !courseTitle || !Number.isFinite(Number(rating))) {
      return res.status(400).json({ success: false, error: 'courseId, courseTitle, and rating are required' })
    }
    const ratingValue = Math.round(Number(rating))
    if (ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ success: false, error: 'rating must be between 1 and 5' })
    }

    const enrollmentsCol = await enrollmentsCollection()
    const enrollment = await enrollmentsCol.findOne({ studentId, courseId })
    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'You can only review courses you have enrolled in' })
    }

    const collection = await reviewsCollection()
    const existing = await collection.findOne({ courseId, studentId })
    const now = new Date().toISOString()

    if (existing) {
      const updates: Partial<CourseReview> = {
        rating: ratingValue,
        difficulty: Number.isFinite(Number(difficulty)) ? Math.round(Number(difficulty)) : null,
        comment: typeof comment === 'string' ? comment : null,
        updatedAt: now,
      }
      await collection.updateOne({ id: existing.id }, { $set: updates })
      const updated = await collection.findOne({ id: existing.id })
      return res.json({ success: true, data: updated ?? { ...existing, ...updates } })
    }

    const review: CourseReview = {
      id: buildId('REV'),
      courseId: String(courseId),
      courseTitle: String(courseTitle),
      professorId: typeof professorId === 'string' ? professorId : null,
      professorName: typeof professorName === 'string' ? professorName : null,
      studentId,
      rating: ratingValue,
      difficulty: Number.isFinite(Number(difficulty)) ? Math.round(Number(difficulty)) : null,
      comment: typeof comment === 'string' ? comment : null,
      createdAt: now,
      updatedAt: now,
    }
    await collection.insertOne(review)
    res.status(201).json({ success: true, data: review })
  } catch (error) {
    logger.error({ err: error }, 'Failed to submit course review')
    res.status(500).json({ success: false, error: 'Failed to submit course review' })
  }
})

courseReviewRoutes.delete('/:id', async (req, res) => {
  try {
    const studentId = req.auth?.studentId || req.auth?.userId
    if (req.auth?.role !== 'student' || !studentId) {
      return res.status(403).json({ success: false, error: 'Student identity missing in token' })
    }
    const collection = await reviewsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing || existing.studentId !== studentId) {
      return res.status(404).json({ success: false, error: 'Review not found' })
    }
    await collection.deleteOne({ id: req.params.id })
    res.json({ success: true, message: 'Review deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete course review')
    res.status(500).json({ success: false, error: 'Failed to delete course review' })
  }
})

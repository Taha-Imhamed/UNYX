import { Router } from 'express'
import { randomUUID } from 'node:crypto'

import { getCollection } from '../db/postgres.js'
import { requirePermission } from '../middleware/auth.js'
import { newsCollection } from '../data/collections.js'
import type { UserNotification, User, NewsItem } from '../../../shared/types/index.js'
import { readPagination, UNPAGINATED_SAFETY_CAP } from '../lib/pagination.js'
import { logger } from '../lib/logger.js'

export const newsRoutes: ReturnType<typeof Router> = Router()

function normaliseExpiresAt(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('expiresAt must be a valid ISO date string')
  }
  return parsed.toISOString()
}

newsRoutes.get('/', async (req, res) => {
  try {
    const col = await newsCollection()
    const { isPaginated, page, pageSize } = readPagination(req)
    if (isPaginated) {
      const cursor = col.find().sort({ createdAt: -1 })
      const total = await cursor.count()
      const items = await cursor.skip((page - 1) * pageSize).limit(pageSize).toArray()
      return res.json({ success: true, data: { items, total, page, pageSize } })
    }
    const items = await col.find().sort({ createdAt: -1 }).limit(UNPAGINATED_SAFETY_CAP).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, '[news] failed to fetch items')
    res.status(500).json({ success: false, error: 'Failed to load announcements' })
  }
})

newsRoutes.get('/:id', async (req, res) => {
  try {
    const item = await newsCollection().then((col) => col.findOne({ id: req.params.id }))
    if (!item) {
      return res.status(404).json({ success: false, error: 'News entry not found' })
    }
    res.json({ success: true, data: item })
  } catch (error) {
    console.error('[news] failed to fetch item', error)
    res.status(500).json({ success: false, error: 'Failed to load announcement' })
  }
})

newsRoutes.post('/', requirePermission('marketing:manage'), async (req, res) => {
  const { title, body, createdBy, expiresAt, imageUrl } = req.body ?? {}

  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Title is required' })
  }

  if (typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ success: false, error: 'Body content is required' })
  }

  if (typeof createdBy !== 'string' || !createdBy.trim()) {
    return res.status(400).json({ success: false, error: 'createdBy is required to audit the announcement' })
  }

  let expiry: string | null = null

  try {
    expiry = normaliseExpiresAt(expiresAt)
  } catch (error) {
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Invalid expiresAt value' })
  }

  const now = new Date().toISOString()
  const news: NewsItem = {
    id: `NEWS-${randomUUID().slice(0, 8).toUpperCase()}`,
    title: title.trim(),
    body: body.trim(),
    createdAt: now,
    createdBy: createdBy.trim(),
    expiresAt: expiry,
    imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null,
  }

  try {
    const collection = await newsCollection()
    await collection.insertOne(news)
  } catch (err) {
    console.error('[news] failed to persist announcement', err)
    return res.status(500).json({ success: false, error: 'Failed to save announcement' })
  }

  // Notify all users (in DB) about the new announcement
  try {
    const usersCollection = await getCollection<User>('users')
    const notificationsCollection = await getCollection<UserNotification>('notifications')
    const users = await usersCollection.find({ status: 'active' }).toArray()
    const notificationDocs = users.map((user) => ({
      id: `NEWS-NOTIF-${randomUUID().slice(0, 8).toUpperCase()}`,
      userId: user.id,
      title: `New announcement: ${news.title}`,
      body: news.body,
      createdAt: now,
      read: false,
      actor: news.createdBy,
      imageUrl: news.imageUrl ?? undefined,
    }))
    if (notificationDocs.length > 0) {
      await notificationsCollection.insertMany(notificationDocs)
    }
  } catch (err) {
    // Log but do not block news creation
    console.error('Failed to notify users about news', err)
  }

  res.status(201).json({ success: true, data: news, message: 'Announcement published' })
})

newsRoutes.put('/:id', requirePermission('marketing:manage'), async (req, res) => {
  const { title, body, expiresAt, imageUrl } = req.body ?? {}

  try {
    const collection = await newsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'News entry not found' })
    }

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ success: false, error: 'Title is required when provided' })
    }

    if (body !== undefined && (typeof body !== 'string' || !body.trim())) {
      return res.status(400).json({ success: false, error: 'Body content is required when provided' })
    }

    let expiry = existing.expiresAt ?? null
    if (expiresAt !== undefined) {
      try {
        expiry = normaliseExpiresAt(expiresAt)
      } catch (error) {
        return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Invalid expiresAt value' })
      }
    }

    const nextImage =
      imageUrl === undefined
        ? existing.imageUrl ?? null
        : typeof imageUrl === 'string' && imageUrl.trim()
          ? imageUrl.trim()
          : null

    const updated: NewsItem = {
      ...existing,
      title: typeof title === 'string' ? title.trim() : existing.title,
      body: typeof body === 'string' ? body.trim() : existing.body,
      expiresAt: expiry,
      imageUrl: nextImage,
    }

    await collection.updateOne({ id: req.params.id }, { $set: updated })

    res.json({ success: true, data: updated, message: 'Announcement updated' })
  } catch (error) {
    console.error('[news] failed to update item', error)
    res.status(500).json({ success: false, error: 'Failed to update announcement' })
  }
})

newsRoutes.delete('/:id', requirePermission('marketing:manage'), async (req, res) => {
  try {
    const collection = await newsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'News entry not found' })
    }
    await collection.deleteOne({ id: req.params.id })
    res.json({ success: true, data: { id: existing.id }, message: 'Announcement deleted' })
  } catch (error) {
    console.error('[news] failed to delete item', error)
    res.status(500).json({ success: false, error: 'Failed to delete announcement' })
  }
})

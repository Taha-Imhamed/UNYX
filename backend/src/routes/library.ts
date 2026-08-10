import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { getCollection } from '../db/postgres.js'
import type { LibraryBook, LibraryLoan } from '../../../shared/types/index.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { logger } from '../lib/logger.js'

export const libraryRoutes: ReturnType<typeof Router> = Router()

function canAccessLibrary(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor' || role === 'librarian'
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

async function booksCollection() {
  return getCollection<LibraryBook>('library_books')
}

async function loansCollection() {
  return getCollection<LibraryLoan>('library_loans')
}

libraryRoutes.get('/books', async (req, res) => {
  try {
    if (!canAccessLibrary(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Library access required' })
    }
    const collection = await booksCollection()
    const items = await collection.find().sort({ title: 1 }).limit(500).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch library books')
    res.status(500).json({ success: false, error: 'Failed to fetch library books' })
  }
})

libraryRoutes.post('/books', async (req, res) => {
  try {
    if (!canAccessLibrary(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Library access required' })
    }
    const { title, author, isbn, category, totalCopies } = req.body ?? {}
    if (!title || !author) {
      return res.status(400).json({ success: false, error: 'title and author are required' })
    }
    const copies = Number.isFinite(Number(totalCopies)) && Number(totalCopies) > 0 ? Number(totalCopies) : 1
    const now = new Date().toISOString()
    const item: LibraryBook = {
      id: buildId('BOOK'),
      title: String(title),
      author: String(author),
      isbn: typeof isbn === 'string' ? isbn : null,
      category: typeof category === 'string' ? category : null,
      totalCopies: copies,
      availableCopies: copies,
      createdAt: now,
      updatedAt: now,
    }
    const collection = await booksCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'library_book_created', entityType: 'library_book', entityId: item.id, details: { title: item.title }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create library book')
    res.status(500).json({ success: false, error: 'Failed to create library book' })
  }
})

libraryRoutes.put('/books/:id', async (req, res) => {
  try {
    if (!canAccessLibrary(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Library access required' })
    }
    const collection = await booksCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Book not found' })
    }
    const updates: Partial<LibraryBook> = { updatedAt: new Date().toISOString() }
    ;['title', 'author', 'isbn', 'category', 'totalCopies', 'availableCopies'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update library book')
    res.status(500).json({ success: false, error: 'Failed to update library book' })
  }
})

libraryRoutes.delete('/books/:id', async (req, res) => {
  try {
    if (!canAccessLibrary(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Library access required' })
    }
    const collection = await booksCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Book not found' })
    }
    await writeAuditLog({ action: 'library_book_deleted', entityType: 'library_book', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Book deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete library book')
    res.status(500).json({ success: false, error: 'Failed to delete library book' })
  }
})

libraryRoutes.get('/loans', async (req, res) => {
  try {
    if (!canAccessLibrary(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Library access required' })
    }
    const collection = await loansCollection()
    const items = await collection.find().sort({ borrowedAt: -1 }).limit(500).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch library loans')
    res.status(500).json({ success: false, error: 'Failed to fetch library loans' })
  }
})

libraryRoutes.post('/loans', async (req, res) => {
  try {
    if (!canAccessLibrary(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Library access required' })
    }
    const { bookId, borrowerName, borrowerType, dueAt } = req.body ?? {}
    if (!bookId || !borrowerName || !dueAt) {
      return res.status(400).json({ success: false, error: 'bookId, borrowerName, and dueAt are required' })
    }
    const booksCol = await booksCollection()
    const book = await booksCol.findOne({ id: bookId })
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' })
    }
    if (book.availableCopies <= 0) {
      return res.status(409).json({ success: false, error: 'No available copies to loan' })
    }

    const now = new Date().toISOString()
    const item: LibraryLoan = {
      id: buildId('LOAN'),
      bookId: book.id,
      bookTitle: book.title,
      borrowerName: String(borrowerName),
      borrowerType: borrowerType === 'staff' ? 'staff' : 'student',
      borrowedAt: now,
      dueAt: String(dueAt),
      returnedAt: null,
      status: 'borrowed',
      createdAt: now,
    }
    const loansCol = await loansCollection()
    await loansCol.insertOne(item)
    await booksCol.updateOne({ id: book.id }, { $set: { availableCopies: book.availableCopies - 1 } })
    await writeAuditLog({ action: 'library_loan_created', entityType: 'library_loan', entityId: item.id, details: { bookId: book.id, borrowerName: item.borrowerName }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create library loan')
    res.status(500).json({ success: false, error: 'Failed to create library loan' })
  }
})

libraryRoutes.put('/loans/:id', async (req, res) => {
  try {
    if (!canAccessLibrary(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Library access required' })
    }
    const loansCol = await loansCollection()
    const existing = await loansCol.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Loan not found' })
    }

    const updates: Partial<LibraryLoan> = {}
    ;['borrowerName', 'borrowerType', 'dueAt', 'status'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })

    const wasReturned = existing.status === 'returned'
    const nowReturning = updates.status === 'returned' && !wasReturned
    if (nowReturning) {
      updates.returnedAt = new Date().toISOString()
    }

    await loansCol.updateOne({ id: existing.id }, { $set: updates })

    if (nowReturning) {
      const booksCol = await booksCollection()
      const book = await booksCol.findOne({ id: existing.bookId })
      if (book) {
        await booksCol.updateOne({ id: book.id }, { $set: { availableCopies: book.availableCopies + 1 } })
      }
    }

    const updated = await loansCol.findOne({ id: existing.id })
    await writeAuditLog({ action: 'library_loan_updated', entityType: 'library_loan', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update library loan')
    res.status(500).json({ success: false, error: 'Failed to update library loan' })
  }
})

libraryRoutes.delete('/loans/:id', async (req, res) => {
  try {
    if (!canAccessLibrary(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Library access required' })
    }
    const collection = await loansCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Loan not found' })
    }
    await writeAuditLog({ action: 'library_loan_deleted', entityType: 'library_loan', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Loan deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete library loan')
    res.status(500).json({ success: false, error: 'Failed to delete library loan' })
  }
})

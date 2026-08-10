import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { publicationsCollection, researchGrantsCollection, researchRequestsCollection } from '../data/collections.js'
import type { Publication, ResearchGrant, ResearchRequest } from '../../../shared/types/index.js'

export const researchOfficeRoutes: ReturnType<typeof Router> = Router()

function canAccessResearch(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor' || role === 'research-office' || role === 'it-admin'
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function toIso(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : new Date().toISOString()
}

researchOfficeRoutes.get('/research-grants', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const collection = await researchGrantsCollection()
    const items = await collection.find().sort({ submittedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Failed to fetch research grants', error)
    res.status(500).json({ success: false, error: 'Failed to fetch research grants' })
  }
})

researchOfficeRoutes.post('/research-grants', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const { projectTitle, principalInvestigator, amount, sponsor, submittedAt, status, summary } = req.body ?? {}
    if (!projectTitle || !principalInvestigator || !sponsor) {
      return res.status(400).json({ success: false, error: 'projectTitle, principalInvestigator, and sponsor are required' })
    }
    const item: ResearchGrant = {
      id: buildId('GRN'),
      projectTitle: String(projectTitle),
      principalInvestigator: String(principalInvestigator),
      amount: Number.isFinite(Number(amount)) ? Number(amount) : 0,
      sponsor: String(sponsor),
      submittedAt: toIso(submittedAt),
      status: status === 'submitted' || status === 'approved' || status === 'rejected' || status === 'funded' ? status : 'draft',
      summary: typeof summary === 'string' ? summary : null,
    }
    const collection = await researchGrantsCollection()
    await collection.insertOne(item)
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    console.error('Failed to create research grant', error)
    res.status(500).json({ success: false, error: 'Failed to create research grant' })
  }
})

researchOfficeRoutes.put('/research-grants/:id', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const collection = await researchGrantsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Research grant not found' })
    }
    const updates: Partial<ResearchGrant> = {}
    ;['projectTitle', 'principalInvestigator', 'amount', 'sponsor', 'submittedAt', 'status', 'summary'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    console.error('Failed to update research grant', error)
    res.status(500).json({ success: false, error: 'Failed to update research grant' })
  }
})

researchOfficeRoutes.delete('/research-grants/:id', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const collection = await researchGrantsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Research grant not found' })
    }
    res.json({ success: true, message: 'Research grant deleted' })
  } catch (error) {
    console.error('Failed to delete research grant', error)
    res.status(500).json({ success: false, error: 'Failed to delete research grant' })
  }
})

researchOfficeRoutes.get('/publications', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const collection = await publicationsCollection()
    const items = await collection.find().sort({ publishedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Failed to fetch publications', error)
    res.status(500).json({ success: false, error: 'Failed to fetch publications' })
  }
})

researchOfficeRoutes.post('/publications', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const { title, authors, journal, publishedAt, doi, status, abstract } = req.body ?? {}
    if (!title || !Array.isArray(authors) || authors.length === 0) {
      return res.status(400).json({ success: false, error: 'title and authors are required' })
    }
    const item: Publication = {
      id: buildId('PUB'),
      title: String(title),
      authors: authors.map((author: unknown) => String(author)).filter(Boolean),
      journal: typeof journal === 'string' ? journal : null,
      publishedAt: toIso(publishedAt),
      doi: typeof doi === 'string' ? doi : null,
      status: status === 'submitted' || status === 'published' ? status : 'draft',
      abstract: typeof abstract === 'string' ? abstract : null,
    }
    const collection = await publicationsCollection()
    await collection.insertOne(item)
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    console.error('Failed to create publication', error)
    res.status(500).json({ success: false, error: 'Failed to create publication' })
  }
})

researchOfficeRoutes.put('/publications/:id', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const collection = await publicationsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Publication not found' })
    }
    const updates: Partial<Publication> = {}
    ;['title', 'authors', 'journal', 'publishedAt', 'doi', 'status', 'abstract'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    console.error('Failed to update publication', error)
    res.status(500).json({ success: false, error: 'Failed to update publication' })
  }
})

researchOfficeRoutes.delete('/publications/:id', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const collection = await publicationsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Publication not found' })
    }
    res.json({ success: true, message: 'Publication deleted' })
  } catch (error) {
    console.error('Failed to delete publication', error)
    res.status(500).json({ success: false, error: 'Failed to delete publication' })
  }
})

researchOfficeRoutes.get('/research-requests', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const collection = await researchRequestsCollection()
    const items = await collection.find().sort({ requestedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Failed to fetch research requests', error)
    res.status(500).json({ success: false, error: 'Failed to fetch research requests' })
  }
})

researchOfficeRoutes.post('/research-requests', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const { title, requester, requestedAt, status, department, notes } = req.body ?? {}
    if (!title || !requester) {
      return res.status(400).json({ success: false, error: 'title and requester are required' })
    }
    const item: ResearchRequest = {
      id: buildId('RQR'),
      title: String(title),
      requester: String(requester),
      requestedAt: toIso(requestedAt),
      status: status === 'in-review' || status === 'approved' || status === 'closed' ? status : 'open',
      department: typeof department === 'string' ? department : null,
      notes: typeof notes === 'string' ? notes : null,
    }
    const collection = await researchRequestsCollection()
    await collection.insertOne(item)
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    console.error('Failed to create research request', error)
    res.status(500).json({ success: false, error: 'Failed to create research request' })
  }
})

researchOfficeRoutes.put('/research-requests/:id', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const collection = await researchRequestsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Research request not found' })
    }
    const updates: Partial<ResearchRequest> = {}
    ;['title', 'requester', 'requestedAt', 'status', 'department', 'notes'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    console.error('Failed to update research request', error)
    res.status(500).json({ success: false, error: 'Failed to update research request' })
  }
})

researchOfficeRoutes.delete('/research-requests/:id', async (req, res) => {
  try {
    if (!canAccessResearch(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Research office access required' })
    }
    const collection = await researchRequestsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Research request not found' })
    }
    res.json({ success: true, message: 'Research request deleted' })
  } catch (error) {
    console.error('Failed to delete research request', error)
    res.status(500).json({ success: false, error: 'Failed to delete research request' })
  }
})

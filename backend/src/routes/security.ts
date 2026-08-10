import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { incidentReportsCollection, idCardAccessCollection, visitorLogsCollection } from '../data/collections.js'
import type { IncidentReport, IdCardAccess, VisitorLog } from '../../../shared/types/index.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { logger } from '../lib/logger.js'

export const securityRoutes: ReturnType<typeof Router> = Router()

function canAccessSecurity(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'supervisor' || role === 'security' || role === 'it-admin'
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function toIso(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : new Date().toISOString()
}

securityRoutes.get('/visitor-logs', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const collection = await visitorLogsCollection()
    const items = await collection.find().sort({ checkInAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch visitor logs')
    res.status(500).json({ success: false, error: 'Failed to fetch visitor logs' })
  }
})

securityRoutes.post('/visitor-logs', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const { visitorName, purpose, contactNumber, hostName, checkInAt, checkOutAt, status, notes } = req.body ?? {}
    if (!visitorName || !purpose) {
      return res.status(400).json({ success: false, error: 'visitorName and purpose are required' })
    }
    const item: VisitorLog = {
      id: buildId('VIS'),
      visitorName: String(visitorName),
      purpose: String(purpose),
      contactNumber: typeof contactNumber === 'string' ? contactNumber : null,
      hostName: typeof hostName === 'string' ? hostName : null,
      checkInAt: toIso(checkInAt),
      checkOutAt: typeof checkOutAt === 'string' ? checkOutAt : null,
      status: status === 'checked-out' || status === 'flagged' ? status : 'checked-in',
      notes: typeof notes === 'string' ? notes : null,
    }
    const collection = await visitorLogsCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'security_visitor_log_created', entityType: 'visitor_log', entityId: item.id, details: { visitorName: item.visitorName }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create visitor log')
    res.status(500).json({ success: false, error: 'Failed to create visitor log' })
  }
})

securityRoutes.put('/visitor-logs/:id', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const collection = await visitorLogsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Visitor log not found' })
    }
    const updates: Partial<VisitorLog> = {}
    ;['visitorName', 'purpose', 'contactNumber', 'hostName', 'checkInAt', 'checkOutAt', 'status', 'notes'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'security_visitor_log_updated', entityType: 'visitor_log', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update visitor log')
    res.status(500).json({ success: false, error: 'Failed to update visitor log' })
  }
})

securityRoutes.delete('/visitor-logs/:id', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const collection = await visitorLogsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Visitor log not found' })
    }
    await writeAuditLog({ action: 'security_visitor_log_deleted', entityType: 'visitor_log', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Visitor log deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete visitor log')
    res.status(500).json({ success: false, error: 'Failed to delete visitor log' })
  }
})

securityRoutes.get('/incident-reports', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const collection = await incidentReportsCollection()
    const items = await collection.find().sort({ reportedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch incident reports')
    res.status(500).json({ success: false, error: 'Failed to fetch incident reports' })
  }
})

securityRoutes.post('/incident-reports', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const { title, description, severity, location, reportedBy, reportedAt, status, resolvedAt } = req.body ?? {}
    if (!title || !description || !location || !reportedBy) {
      return res.status(400).json({ success: false, error: 'title, description, location, and reportedBy are required' })
    }
    const item: IncidentReport = {
      id: buildId('INC'),
      title: String(title),
      description: String(description),
      severity: severity === 'medium' || severity === 'high' || severity === 'critical' ? severity : 'low',
      location: String(location),
      reportedBy: String(reportedBy),
      reportedAt: toIso(reportedAt),
      status: status === 'investigating' || status === 'resolved' || status === 'closed' ? status : 'open',
      resolvedAt: typeof resolvedAt === 'string' ? resolvedAt : null,
    }
    const collection = await incidentReportsCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'security_incident_report_created', entityType: 'incident_report', entityId: item.id, details: { severity: item.severity, location: item.location }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create incident report')
    res.status(500).json({ success: false, error: 'Failed to create incident report' })
  }
})

securityRoutes.put('/incident-reports/:id', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const collection = await incidentReportsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Incident report not found' })
    }
    const updates: Partial<IncidentReport> = {}
    ;['title', 'description', 'severity', 'location', 'reportedBy', 'reportedAt', 'status', 'resolvedAt'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'security_incident_report_updated', entityType: 'incident_report', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update incident report')
    res.status(500).json({ success: false, error: 'Failed to update incident report' })
  }
})

securityRoutes.delete('/incident-reports/:id', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const collection = await incidentReportsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Incident report not found' })
    }
    await writeAuditLog({ action: 'security_incident_report_deleted', entityType: 'incident_report', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Incident report deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete incident report')
    res.status(500).json({ success: false, error: 'Failed to delete incident report' })
  }
})

securityRoutes.get('/id-card-access', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const collection = await idCardAccessCollection()
    const items = await collection.find().sort({ issuedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch ID card access records')
    res.status(500).json({ success: false, error: 'Failed to fetch ID card access records' })
  }
})

securityRoutes.post('/id-card-access', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const { holderName, holderType, cardNumber, issuedAt, expiresAt, status, notes } = req.body ?? {}
    if (!holderName || !cardNumber) {
      return res.status(400).json({ success: false, error: 'holderName and cardNumber are required' })
    }
    const item: IdCardAccess = {
      id: buildId('IDC'),
      holderName: String(holderName),
      holderType: holderType === 'staff' || holderType === 'visitor' ? holderType : 'student',
      cardNumber: String(cardNumber),
      issuedAt: toIso(issuedAt),
      expiresAt: typeof expiresAt === 'string' ? expiresAt : null,
      status: status === 'revoked' || status === 'expired' ? status : 'active',
      notes: typeof notes === 'string' ? notes : null,
    }
    const collection = await idCardAccessCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'security_id_card_created', entityType: 'id_card_access', entityId: item.id, details: { holderName: item.holderName, holderType: item.holderType }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create ID card access record')
    res.status(500).json({ success: false, error: 'Failed to create ID card access record' })
  }
})

securityRoutes.put('/id-card-access/:id', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const collection = await idCardAccessCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'ID card access record not found' })
    }
    const updates: Partial<IdCardAccess> = {}
    ;['holderName', 'holderType', 'cardNumber', 'issuedAt', 'expiresAt', 'status', 'notes'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'security_id_card_updated', entityType: 'id_card_access', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update ID card access record')
    res.status(500).json({ success: false, error: 'Failed to update ID card access record' })
  }
})

securityRoutes.delete('/id-card-access/:id', async (req, res) => {
  try {
    if (!canAccessSecurity(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'Security access required' })
    }
    const collection = await idCardAccessCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'ID card access record not found' })
    }
    await writeAuditLog({ action: 'security_id_card_deleted', entityType: 'id_card_access', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'ID card access record deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete ID card access record')
    res.status(500).json({ success: false, error: 'Failed to delete ID card access record' })
  }
})

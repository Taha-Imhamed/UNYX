import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { deviceLogsCollection, integrationsCollection, maintenanceStateCollection, ssoConfigCollection } from '../data/collections.js'
import type { DeviceLog, Integration, MaintenanceState, SsoConfig } from '../../../shared/types/index.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { logger } from '../lib/logger.js'

export const itAdminRoutes: ReturnType<typeof Router> = Router()

function canAccessItAdmin(role?: string) {
  return role === 'admin' || role === 'super-admin' || role === 'it-admin'
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function toIso(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : new Date().toISOString()
}

itAdminRoutes.get('/sso-config', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const collection = await ssoConfigCollection()
    const items = await collection.find().sort({ updatedAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch SSO config')
    res.status(500).json({ success: false, error: 'Failed to fetch SSO config' })
  }
})

itAdminRoutes.post('/sso-config', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const { provider, clientId, issuerUrl, enabled, updatedAt } = req.body ?? {}
    if (!provider || !clientId) {
      return res.status(400).json({ success: false, error: 'provider and clientId are required' })
    }
    const item: SsoConfig = {
      id: buildId('SSO'),
      provider: String(provider),
      clientId: String(clientId),
      issuerUrl: typeof issuerUrl === 'string' ? issuerUrl : null,
      enabled: Boolean(enabled),
      updatedAt: toIso(updatedAt),
    }
    const collection = await ssoConfigCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'it_admin_sso_config_created', entityType: 'sso_config', entityId: item.id, details: { provider: item.provider, enabled: item.enabled }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create SSO config')
    res.status(500).json({ success: false, error: 'Failed to create SSO config' })
  }
})

itAdminRoutes.put('/sso-config/:id', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const collection = await ssoConfigCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'SSO config not found' })
    }
    const updates: Partial<SsoConfig> = {}
    ;['provider', 'clientId', 'issuerUrl', 'enabled', 'updatedAt'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'it_admin_sso_config_updated', entityType: 'sso_config', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update SSO config')
    res.status(500).json({ success: false, error: 'Failed to update SSO config' })
  }
})

itAdminRoutes.delete('/sso-config/:id', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const collection = await ssoConfigCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'SSO config not found' })
    }
    await writeAuditLog({ action: 'it_admin_sso_config_deleted', entityType: 'sso_config', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'SSO config deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete SSO config')
    res.status(500).json({ success: false, error: 'Failed to delete SSO config' })
  }
})

itAdminRoutes.get('/integrations', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const collection = await integrationsCollection()
    const items = await collection.find().sort({ name: 1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch integrations')
    res.status(500).json({ success: false, error: 'Failed to fetch integrations' })
  }
})

itAdminRoutes.post('/integrations', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const { name, endpoint, status, lastSyncedAt, notes } = req.body ?? {}
    if (!name || !endpoint) {
      return res.status(400).json({ success: false, error: 'name and endpoint are required' })
    }
    const item: Integration = {
      id: buildId('INT'),
      name: String(name),
      endpoint: String(endpoint),
      status: status === 'paused' || status === 'error' ? status : 'active',
      lastSyncedAt: typeof lastSyncedAt === 'string' ? lastSyncedAt : null,
      notes: typeof notes === 'string' ? notes : null,
    }
    const collection = await integrationsCollection()
    await collection.insertOne(item)
    await writeAuditLog({ action: 'it_admin_integration_created', entityType: 'integration', entityId: item.id, details: { name: item.name, endpoint: item.endpoint }, auth: req.auth })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create integration')
    res.status(500).json({ success: false, error: 'Failed to create integration' })
  }
})

itAdminRoutes.put('/integrations/:id', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const collection = await integrationsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Integration not found' })
    }
    const updates: Partial<Integration> = {}
    ;['name', 'endpoint', 'status', 'lastSyncedAt', 'notes'].forEach((key) => {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key]
      }
    })
    await collection.updateOne({ id: existing.id }, { $set: updates })
    const updated = await collection.findOne({ id: existing.id })
    await writeAuditLog({ action: 'it_admin_integration_updated', entityType: 'integration', entityId: existing.id, details: { updatedFields: Object.keys(updates) }, auth: req.auth })
    res.json({ success: true, data: updated ?? { ...existing, ...updates } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update integration')
    res.status(500).json({ success: false, error: 'Failed to update integration' })
  }
})

itAdminRoutes.delete('/integrations/:id', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const collection = await integrationsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Integration not found' })
    }
    await writeAuditLog({ action: 'it_admin_integration_deleted', entityType: 'integration', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Integration deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete integration')
    res.status(500).json({ success: false, error: 'Failed to delete integration' })
  }
})

itAdminRoutes.get('/maintenance-state', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const collection = await maintenanceStateCollection()
    const state = await collection.findOne({ id: 'global' })
    res.json({ success: true, data: state ?? { id: 'global', enabled: false, message: null, updatedAt: new Date().toISOString(), updatedBy: null } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch maintenance state')
    res.status(500).json({ success: false, error: 'Failed to fetch maintenance state' })
  }
})

itAdminRoutes.put('/maintenance-state', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const enabled = Boolean(req.body?.enabled)
    const message = typeof req.body?.message === 'string' ? req.body.message : null
    const updatedAt = new Date().toISOString()
    const updatedBy = req.auth?.username ?? req.auth?.userId ?? null
    const item: MaintenanceState = { id: 'global', enabled, message, updatedAt, updatedBy }
    const collection = await maintenanceStateCollection()
    await collection.updateOne({ id: 'global' }, { $set: item }, { upsert: true })
    await writeAuditLog({ action: 'it_admin_maintenance_state_updated', entityType: 'maintenance_state', entityId: 'global', details: { enabled }, auth: req.auth })
    res.json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update maintenance state')
    res.status(500).json({ success: false, error: 'Failed to update maintenance state' })
  }
})

itAdminRoutes.get('/device-logs', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const collection = await deviceLogsCollection()
    const items = await collection.find().sort({ createdAt: -1 }).limit(200).toArray()
    res.json({ success: true, data: items })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch device logs')
    res.status(500).json({ success: false, error: 'Failed to fetch device logs' })
  }
})

itAdminRoutes.post('/device-logs', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const { deviceName, ipAddress, eventType, createdAt, userId, details } = req.body ?? {}
    if (!deviceName || !eventType) {
      return res.status(400).json({ success: false, error: 'deviceName and eventType are required' })
    }
    const item: DeviceLog = {
      id: buildId('DVC'),
      deviceName: String(deviceName),
      ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
      eventType: String(eventType),
      createdAt: toIso(createdAt),
      userId: typeof userId === 'string' ? userId : null,
      details: typeof details === 'string' ? details : null,
    }
    const collection = await deviceLogsCollection()
    await collection.insertOne(item)
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create device log')
    res.status(500).json({ success: false, error: 'Failed to create device log' })
  }
})

itAdminRoutes.delete('/device-logs/:id', async (req, res) => {
  try {
    if (!canAccessItAdmin(req.auth?.role)) {
      return res.status(403).json({ success: false, error: 'IT admin access required' })
    }
    const collection = await deviceLogsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Device log not found' })
    }
    await writeAuditLog({ action: 'it_admin_device_log_deleted', entityType: 'device_log', entityId: req.params.id, details: {}, auth: req.auth })
    res.json({ success: true, message: 'Device log deleted' })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete device log')
    res.status(500).json({ success: false, error: 'Failed to delete device log' })
  }
})

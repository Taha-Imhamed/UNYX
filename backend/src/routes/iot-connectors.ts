import { Router } from 'express'
import { parseUserAgent } from '../lib/request-log.js'
import { registerConnection, unregisterConnection, listConnections, getConnection, pushToConnection, touchConnection } from '../lib/iot-registry.js'
import { revokeToken } from '../lib/revoked-tokens.js'
import { logger } from '../lib/logger.js'

export const iotConnectorRoutes: ReturnType<typeof Router> = Router()

function isSuperAdmin(role?: string) {
  return role === 'super-admin'
}

// Every logged-in user's dashboard opens exactly one of these — it's how the server
// reaches an already-open tab. Not gated to admins: this is the receiving end, not the
// control panel (that's /sessions + the POST actions below, which are super-admin only).
iotConnectorRoutes.get('/stream', (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
  res.flushHeaders?.()

  const uaString = req.get('user-agent') || ''
  const { browser, os, device } = parseUserAgent(uaString)

  const initialPath = typeof req.query.path === 'string' ? req.query.path : ''

  const connectionId = registerConnection({
    userId: req.auth.userId,
    username: req.auth.username,
    role: req.auth.role,
    jti: req.auth.jti,
    browser,
    os,
    device,
    currentPath: initialPath,
    res,
  })

  res.write(`data: ${JSON.stringify({ type: 'connected', connectionId })}\n\n`)

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    unregisterConnection(connectionId)
    res.end()
  })
})

iotConnectorRoutes.get('/sessions', (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  res.json({ success: true, data: listConnections() })
})

// Every client pings this on route change (and periodically) so "Follow User" can show
// their current page and last-activity time without the admin having to ask them.
iotConnectorRoutes.post('/heartbeat', (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  const connectionId = typeof req.body?.connectionId === 'string' ? req.body.connectionId : ''
  const path = typeof req.body?.path === 'string' ? req.body.path : undefined
  if (!connectionId) {
    return res.status(400).json({ success: false, error: 'connectionId is required' })
  }
  const connection = getConnection(connectionId)
  if (!connection || connection.userId !== req.auth.userId) {
    return res.status(404).json({ success: false, error: 'Session not found' })
  }
  touchConnection(connectionId, { currentPath: path })
  res.json({ success: true })
})

iotConnectorRoutes.post('/sessions/:connectionId/refresh', (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const ok = pushToConnection(req.params.connectionId, { type: 'refresh' })
  if (!ok) {
    return res.status(404).json({ success: false, error: 'Session not connected' })
  }
  res.json({ success: true })
})

iotConnectorRoutes.post('/sessions/:connectionId/message', (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  if (!text) {
    return res.status(400).json({ success: false, error: 'Message text is required' })
  }
  const ok = pushToConnection(req.params.connectionId, { type: 'message', text })
  if (!ok) {
    return res.status(404).json({ success: false, error: 'Session not connected' })
  }
  res.json({ success: true })
})

iotConnectorRoutes.post('/sessions/:connectionId/notification', (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : undefined
  if (!title) {
    return res.status(400).json({ success: false, error: 'Notification title is required' })
  }
  const ok = pushToConnection(req.params.connectionId, { type: 'notification', title, body })
  if (!ok) {
    return res.status(404).json({ success: false, error: 'Session not connected' })
  }
  res.json({ success: true })
})

// Same push for both — "navigate" (admin-picked page from the menu) and "open-record" (a
// specific record's path, e.g. /dashboard/students/STU-1). Kept as separate endpoints
// because they read differently in the UI/audit log even though the wire event is similar.
iotConnectorRoutes.post('/sessions/:connectionId/navigate', (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const path = typeof req.body?.path === 'string' ? req.body.path.trim() : ''
  if (!path.startsWith('/')) {
    return res.status(400).json({ success: false, error: 'A valid path is required' })
  }
  const ok = pushToConnection(req.params.connectionId, { type: 'navigate', path })
  if (!ok) {
    return res.status(404).json({ success: false, error: 'Session not connected' })
  }
  res.json({ success: true })
})

iotConnectorRoutes.post('/sessions/:connectionId/open-record', (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const path = typeof req.body?.path === 'string' ? req.body.path.trim() : ''
  if (!path.startsWith('/')) {
    return res.status(400).json({ success: false, error: 'A valid path is required' })
  }
  const ok = pushToConnection(req.params.connectionId, { type: 'open-record', path })
  if (!ok) {
    return res.status(404).json({ success: false, error: 'Session not connected' })
  }
  res.json({ success: true })
})

iotConnectorRoutes.post('/sessions/:connectionId/force-reauth', async (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const connection = getConnection(req.params.connectionId)
  if (!connection) {
    return res.status(404).json({ success: false, error: 'Session not connected' })
  }
  try {
    if (connection.jti) {
      await revokeToken(connection.jti, req.auth?.username ?? req.auth?.userId ?? null, 'IoT Connectors: forced re-authentication')
    }
    pushToConnection(req.params.connectionId, { type: 'force-reauth', reason: 'Please sign in again' })
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to force re-authentication')
    res.status(500).json({ success: false, error: 'Failed to force re-authentication' })
  }
})

iotConnectorRoutes.post('/sessions/:connectionId/timeout', async (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const connection = getConnection(req.params.connectionId)
  if (!connection) {
    return res.status(404).json({ success: false, error: 'Session not connected' })
  }

  try {
    // Real revocation: the token stays cryptographically valid until its 12h expiry, so
    // without this it'd still work from curl/another tab even after the push event tells
    // this one tab to log out. requireAuth checks isTokenRevoked(jti) on every request.
    if (connection.jti) {
      await revokeToken(connection.jti, req.auth?.username ?? req.auth?.userId ?? null, 'IoT Connectors: forced timeout')
    }
    pushToConnection(req.params.connectionId, { type: 'timeout', reason: 'Ended by administrator' })
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to time out session')
    res.status(500).json({ success: false, error: 'Failed to time out session' })
  }
})

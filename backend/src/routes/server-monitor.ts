import { Router } from 'express'
import os from 'node:os'
import { runDbQuery } from '../db/postgres.js'
import { liveLog } from '../lib/request-log.js'
import { logBroadcast } from '../lib/log-broadcast.js'

export const serverMonitorRoutes: ReturnType<typeof Router> = Router()

function isSuperAdmin(role?: string) {
  return role === 'super-admin'
}

const startedAt = Date.now()

function formatUptime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  parts.push(`${seconds}s`)
  return parts.join(' ')
}

function cpuUsagePercent() {
  const load = os.loadavg()[0]
  const cores = os.cpus().length || 1
  return Math.min(100, Math.round((load / cores) * 100))
}

serverMonitorRoutes.get('/overview', async (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }

  try {
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    const [usersResult, todayLoginsResult, monthLoginsResult, roleBreakdownResult, dbSizeResult, tableCountResult, connectionsResult, usersTableSizeResult] = await Promise.all([
      runDbQuery<{ total: string; active: string; suspended: string }>(
        `select count(*)::text as total,
                count(*) filter (where status = 'active')::text as active,
                count(*) filter (where status = 'inactive')::text as suspended
         from public.users`,
      ),
      runDbQuery<{ count: string }>(
        `select count(*)::text as count from public.users where last_login >= date_trunc('day', now())`,
      ),
      runDbQuery<{ count: string }>(
        `select count(*)::text as count from public.users where created_at >= date_trunc('month', now())`,
      ),
      runDbQuery<{ role: string; count: string }>(
        `select role, count(*)::text as count from public.users group by role order by count(*) desc`,
      ),
      runDbQuery<{ size: string }>(`select pg_size_pretty(pg_database_size(current_database())) as size`),
      runDbQuery<{ count: string }>(
        `select count(*)::text as count from information_schema.tables where table_schema = 'public'`,
      ),
      runDbQuery<{ count: string }>(
        `select count(*)::text as count from pg_stat_activity where datname = current_database()`,
      ),
      runDbQuery<{ table_name: string; size: string }>(
        `select relname as table_name, pg_size_pretty(pg_total_relation_size(relid)) as size
         from pg_catalog.pg_statio_user_tables
         order by pg_total_relation_size(relid) desc
         limit 8`,
      ),
    ]).catch((error) => {
      throw error
    })

    const recentEvents = liveLog.recent(200)
    const onlineCutoff = Date.now() - 5 * 60 * 1000
    const recentUniqueUsers = new Set(
      recentEvents
        .filter((e) => e.userId && new Date(e.timestamp).getTime() >= onlineCutoff)
        .map((e) => e.userId),
    )
    const failedLoginsRecent = recentEvents.filter((e) => e.type === 'login-fail').length
    const requestsWindowMs = 60 * 1000
    const recentRequestCount = recentEvents.filter(
      (e) => e.type === 'request' && Date.now() - new Date(e.timestamp).getTime() <= requestsWindowMs,
    ).length
    const avgResponseTime = (() => {
      const withDuration = recentEvents.filter((e) => typeof e.durationMs === 'number')
      if (!withDuration.length) return null
      return Math.round(withDuration.reduce((sum, e) => sum + (e.durationMs ?? 0), 0) / withDuration.length)
    })()

    res.json({
      success: true,
      data: {
        system: {
          status: 'online',
          uptime: formatUptime(Date.now() - startedAt),
          uptimeMs: Date.now() - startedAt,
          version: process.env.npm_package_version || '0.1.0',
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          cpuUsagePercent: cpuUsagePercent(),
          cpuCores: os.cpus().length,
          loadAvg: os.loadavg(),
          ramUsedBytes: usedMem,
          ramTotalBytes: totalMem,
          ramUsagePercent: Math.round((usedMem / totalMem) * 100),
          responseTimeMsAvg: avgResponseTime,
          requestsPerMinute: recentRequestCount,
        },
        users: {
          total: Number(usersResult.rows[0]?.total ?? 0),
          active: Number(usersResult.rows[0]?.active ?? 0),
          suspended: Number(usersResult.rows[0]?.suspended ?? 0),
          onlineNow: recentUniqueUsers.size,
          activeToday: Number(todayLoginsResult.rows[0]?.count ?? 0),
          newThisMonth: Number(monthLoginsResult.rows[0]?.count ?? 0),
          failedLoginAttemptsRecent: failedLoginsRecent,
          byRole: roleBreakdownResult.rows.map((r) => ({ role: r.role, count: Number(r.count) })),
        },
        database: {
          size: dbSizeResult.rows[0]?.size ?? 'unknown',
          tableCount: Number(tableCountResult.rows[0]?.count ?? 0),
          activeConnections: Number(connectionsResult.rows[0]?.count ?? 0),
          largestTables: usersTableSizeResult.rows,
        },
        security: {
          httpsEnabled: req.secure || req.get('x-forwarded-proto') === 'https',
          jwtSessionTimeout: '12h',
          loginRateLimit: '20 attempts / 15 min per IP',
          passwordHashing: 'bcrypt',
        },
      },
    })
  } catch (error) {
    console.error('[server-monitor] Failed to load overview', error)
    res.status(500).json({ success: false, error: 'Failed to load server overview' })
  }
})

serverMonitorRoutes.get('/logs', async (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const limit = Math.min(500, Number(req.query.limit) || 100)
  res.json({ success: true, data: liveLog.recent(limit) })
})

serverMonitorRoutes.get('/stream', (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
  res.flushHeaders?.()

  const send = (event: unknown) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  send({ type: 'connected' })
  const listener = (event: unknown) => send(event)
  liveLog.on('event', listener)

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    liveLog.off('event', listener)
    res.end()
  })
})

// Raw backend console output (every logger.* call, formatted like the pino-pretty text
// shown in the VS Code terminal) — distinct from /logs above, which is the parsed
// per-request traffic table. See lib/log-broadcast.ts for how these lines get captured.
serverMonitorRoutes.get('/console-logs', async (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }
  const limit = Math.min(1000, Number(req.query.limit) || 300)
  res.json({ success: true, data: logBroadcast.recent(limit) })
})

serverMonitorRoutes.get('/console-stream', (req, res) => {
  if (!isSuperAdmin(req.auth?.role)) {
    return res.status(403).json({ success: false, error: 'Super admin access required' })
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
  res.flushHeaders?.()

  const send = (event: unknown) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  send({ type: 'connected' })
  const listener = (line: unknown) => send(line)
  logBroadcast.on('line', listener)

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    logBroadcast.off('line', listener)
    res.end()
  })
})

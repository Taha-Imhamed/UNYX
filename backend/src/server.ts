import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pinoHttp from 'pino-http'
import { logger } from './lib/logger.js'
import { UPLOADS_DIR } from './lib/storage.js'
import { initErrorTracking, captureException } from './lib/error-tracking.js'
import { studentRoutes } from './routes/students.js'
import { enrollmentRoutes } from './routes/enrollments.js'
import { professorRoutes } from './routes/professors.js'
import { professorWorkspaceRoutes } from './routes/professor-workspace.js'
import { gradeChangeRequestRoutes } from './routes/grade-change-requests.js'
import { expenseRoutes } from './routes/expenses.js'
import { incomeRoutes } from './routes/income.js'
import { feedbackRoutes } from './routes/feedback.js'
import { userRoutes } from './routes/users.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { newsRoutes } from './routes/news.js'
import { paymentRoutes } from './routes/payments.js'
import couponsRoutes from './routes/coupons.js'
import { questionRoutes } from './routes/questions.js'
import { siteContentRoutes } from './routes/site-content.js'
import { studentHintsRoutes } from './routes/student-hints.js'
import { financeRoutes } from './routes/finance.js'
import { admissionsRoutes } from './routes/admissions.js'
import { facilitiesRoutes } from './routes/facilities.js'
import { itAdminRoutes } from './routes/it-admin.js'
import { terminalRoutes } from './routes/terminal.js'
import { registrarRoutes } from './routes/registrar.js'
import { deanRoutes } from './routes/dean.js'
import { aiAssistantRoutes } from './routes/ai-assistant.js'
import { researchOfficeRoutes } from './routes/research-office.js'
import { securityRoutes } from './routes/security.js'
import { adminScheduleRoutes } from './routes/admin-schedule.js'
import { serverMonitorRoutes } from './routes/server-monitor.js'
import { systemDiagnosticsRoutes } from './routes/system-diagnostics.js'
import { hrRoutes } from './routes/hr.js'
import { libraryRoutes } from './routes/library.js'
import { campusRoutes } from './routes/campus.js'
import { advisingRoutes } from './routes/advising.js'
import { courseReviewRoutes } from './routes/course-reviews.js'
import { supportTicketRoutes } from './routes/support-tickets.js'
import { iotConnectorRoutes } from './routes/iot-connectors.js'
import { requireAuth, enforceMaintenanceMode } from './middleware/auth.js'
import { enforceModuleGate } from './middleware/module-gate.js'
import { ensureDatabaseConnection, getActiveDbInfo, runDbQuery } from './db/postgres.js'
import { liveLog, extractClientIp, parseUserAgent } from './lib/request-log.js'

// Load .env.local first (if present), then fall back to .env
dotenv.config({ path: '.env.local' })
dotenv.config()

initErrorTracking()

const app = express()
const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 3001)

// Disable ETag/conditional responses so frontend always receives JSON bodies (avoids 304 with empty body)
app.set('etag', false)

// Prevent intermediate/browser caching for API responses
app.use((_, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

// Middleware
// CORS_ORIGINS: comma-separated allow-list, checked first regardless of NODE_ENV.
const allowedOriginsEnv = process.env.CORS_ORIGINS
const allowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://unyt-nine.vercel.app']

// If ALLOW_ALL_CORS=1 is set, allow any origin (useful for local debugging).
// WARNING: do NOT enable in production unless you understand the security implications.
const allowAll = process.env.ALLOW_ALL_CORS === '1'

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowAll) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      // SECURITY: any origin not in the allow-list above is accepted whenever
      // NODE_ENV isn't exactly "production" — convenient for local dev, but it means
      // a deploy that forgets to set NODE_ENV=production silently disables CORS
      // enforcement. Always confirm NODE_ENV is set correctly on real deployments.
      const env = process.env.NODE_ENV || 'development'
      if (env !== 'production') return callback(null, true)
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
// Serves locally-stored uploads (default storage backend, see lib/storage.ts). No-op if
// STORAGE_DRIVER=s3 is used instead — files there are served directly from S3/CDN.
app.use('/uploads', express.static(UPLOADS_DIR))
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' || req.url === '/api/server-monitor/stream' || req.url === '/api/server-monitor/console-stream' || req.url === '/api/iot/stream' } }))

// Live traffic log: records every request (method, path, status, IP, device) for the server-monitor page
app.use((req, res, next) => {
  const startedAt = Date.now()
  const ip = extractClientIp(req)
  const uaString = req.get('user-agent') || ''
  const { browser, os, device } = parseUserAgent(uaString)
  res.on('finish', () => {
    if (req.path === '/api/server-monitor/stream') return
    liveLog.push({
      type: 'request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip,
      userAgent: uaString,
      browser,
      os,
      device,
      userId: req.auth?.userId ?? null,
      username: req.auth?.username ?? null,
      role: req.auth?.role ?? null,
    })
  })
  next()
})

// Authn middleware (login + health are public)
app.use(requireAuth)
app.use(enforceMaintenanceMode)
app.use(enforceModuleGate)

// API Routes
app.use('/api/students', studentRoutes)
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/professors', professorRoutes)
app.use('/api/professor-workspace', professorWorkspaceRoutes)
app.use('/api/grade-change-requests', gradeChangeRequestRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/income', incomeRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/users', userRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/security', securityRoutes)
app.use('/api/facilities', facilitiesRoutes)
app.use('/api/research-office', researchOfficeRoutes)
app.use('/api/it-admin', itAdminRoutes)
app.use('/api/terminal', terminalRoutes)
app.use('/api/registrar', registrarRoutes)
app.use('/api/dean', deanRoutes)
app.use('/api/ai-assistant', aiAssistantRoutes)
app.use('/api/admissions', admissionsRoutes)
app.use('/api/admin', adminScheduleRoutes)
app.use('/api/server-monitor', serverMonitorRoutes)
app.use('/api/system-diagnostics', systemDiagnosticsRoutes)
app.use('/api/hr', hrRoutes)
app.use('/api/library', libraryRoutes)
app.use('/api/campus', campusRoutes)
app.use('/api/advising', advisingRoutes)
app.use('/api/course-reviews', courseReviewRoutes)
app.use('/api/support-tickets', supportTicketRoutes)
app.use('/api/iot', iotConnectorRoutes)
app.use(siteContentRoutes)
app.use('/api', studentHintsRoutes)
app.use(studentHintsRoutes)

app.use('/api/payments', paymentRoutes)
app.use('/api/coupons', couponsRoutes)
app.use('/api/finance', financeRoutes)

// Health check
app.get('/api/health', async (req, res) => {
  const timestamp = new Date().toISOString()
  try {
    await runDbQuery('SELECT 1')
    res.json({ status: 'ok', database: 'ok', timestamp })
  } catch (error) {
    logger.error({ err: error }, '[health] database ping failed')
    res.status(503).json({ status: 'degraded', database: 'unreachable', timestamp })
  }
})

// Centralized error handler. Any route that calls next(error) instead of handling
// it inline lands here instead of leaking an unformatted stack trace to the client.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err: error, path: req.originalUrl, method: req.method }, 'Unhandled route error')
  captureException(error)
  if (res.headersSent) return
  res.status(500).json({ success: false, error: 'Internal server error' })
})

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception')
  captureException(error)
})
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection')
  captureException(reason)
})

async function start() {
  try {
    try {
      await ensureDatabaseConnection()
    } catch (error) {
      logger.error({ err: error }, '[db] Initial connection check failed. Server will start and retry on demand.')
    }

    app.listen(PORT, () => {
      const dbInfo = getActiveDbInfo()
      logger.info(`Backend server running on port ${PORT}`)
      logger.info(`Database target: ${dbInfo.connectionUrl} (db: ${dbInfo.dbName})`)
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server')
    process.exit(1)
  }
}

void start()

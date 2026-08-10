import * as Sentry from '@sentry/node'
import { logger } from './logger.js'

let initialized = false

/** No-ops unless SENTRY_DSN is set. Call once, before the app starts handling requests. */
export function initErrorTracking() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    logger.info('[error-tracking] SENTRY_DSN not set — Sentry disabled')
    return
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  })
  initialized = true
  logger.info('[error-tracking] Sentry initialized')
}

export function captureException(error: unknown) {
  if (initialized) Sentry.captureException(error)
}

export function isErrorTrackingEnabled() {
  return initialized
}

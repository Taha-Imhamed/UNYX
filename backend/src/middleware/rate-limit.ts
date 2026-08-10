import type { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger.js'

interface RateLimitOptions {
  windowMs: number
  max: number
  message?: string
  /** Defaults to per-IP. Combine with auth user id where available for tighter scoping. */
  keyGenerator?: (req: Request) => string
  label: string
}

/**
 * Simple in-memory fixed-window rate limiter. Resets on process restart and does
 * not share state across instances — fine for a single-instance deployment, not
 * a substitute for a shared store (Redis) once this runs behind multiple processes.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, { count: number; first: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const entry = buckets.get(key)

    if (entry && now - entry.first < options.windowMs && entry.count >= options.max) {
      logger.warn({ key, label: options.label }, 'rate limit exceeded')
      return res.status(429).json({
        success: false,
        error: options.message || 'Too many requests. Please try again later.',
      })
    }

    if (!entry || now - entry.first >= options.windowMs) {
      buckets.set(key, { count: 1, first: now })
    } else {
      buckets.set(key, { count: entry.count + 1, first: entry.first })
    }

    next()
  }
}

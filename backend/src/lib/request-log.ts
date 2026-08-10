import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import { UAParser } from 'ua-parser-js'

export type LiveEventType = 'login-success' | 'login-fail' | 'request'

export interface LiveEvent {
  id: string
  type: LiveEventType
  timestamp: string
  method: string
  path: string
  status?: number
  durationMs?: number
  ip: string
  userAgent: string
  browser: string
  os: string
  device: string
  userId?: string | null
  username?: string | null
  role?: string | null
}

const MAX_EVENTS = 500

class LiveLogBuffer extends EventEmitter {
  private events: LiveEvent[] = []

  push(event: Omit<LiveEvent, 'id' | 'timestamp'>) {
    const full: LiveEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    }
    this.events.push(full)
    if (this.events.length > MAX_EVENTS) {
      this.events.splice(0, this.events.length - MAX_EVENTS)
    }
    this.emit('event', full)
    return full
  }

  recent(limit = 100): LiveEvent[] {
    return this.events.slice(-limit).reverse()
  }
}

export const liveLog = new LiveLogBuffer()

export function extractClientIp(req: { headers: Record<string, unknown>; socket?: { remoteAddress?: string }; ip?: string }): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

export function parseUserAgent(uaString: string) {
  const parser = new UAParser(uaString || '')
  const result = parser.getResult()
  const browser = [result.browser.name, result.browser.version].filter(Boolean).join(' ') || 'Unknown'
  const os = [result.os.name, result.os.version].filter(Boolean).join(' ') || 'Unknown'
  const device = result.device.type
    ? `${result.device.vendor ?? ''} ${result.device.model ?? ''} (${result.device.type})`.trim()
    : 'Desktop'
  return { browser, os, device }
}

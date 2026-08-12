import { Writable } from 'node:stream'
import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'

export interface BroadcastLogLine {
  id: string
  level: number
  levelLabel: string
  time: number
  msg: string
  line: string
  raw: Record<string, unknown>
}

const LEVEL_LABELS: Record<number, string> = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL',
}

const MAX_LINES = 1000

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

function formatTimestamp(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${d.getMilliseconds().toString().padStart(3, '0')}`
}

// Renders roughly the same shape as the pino-pretty console output (see logger.ts) so the
// Server page's log viewer reads like the terminal the user already watches in VS Code —
// "[2026-08-11 11:04:12.978] INFO: message" — plus any extra fields pino attached (err, req, etc).
function formatLine(entry: Record<string, unknown>): string {
  const level = Number(entry.level ?? 30)
  const label = LEVEL_LABELS[level] ?? 'INFO'
  const time = Number(entry.time ?? Date.now())
  const msg = typeof entry.msg === 'string' ? entry.msg : ''
  const known = new Set(['level', 'time', 'msg', 'pid', 'hostname'])
  const extras = Object.entries(entry).filter(([key]) => !known.has(key))

  let line = `[${formatTimestamp(time)}] ${label}: ${msg}`
  for (const [key, value] of extras) {
    if (value === undefined) continue
    const rendered = typeof value === 'object' ? JSON.stringify(value) : String(value)
    line += `\n    ${key}: ${rendered}`
  }
  return line
}

class LogBroadcastBuffer extends EventEmitter {
  private lines: BroadcastLogLine[] = []

  push(entry: Record<string, unknown>) {
    const level = Number(entry.level ?? 30)
    const full: BroadcastLogLine = {
      id: randomUUID(),
      level,
      levelLabel: LEVEL_LABELS[level] ?? 'INFO',
      time: Number(entry.time ?? Date.now()),
      msg: typeof entry.msg === 'string' ? entry.msg : '',
      line: formatLine(entry),
      raw: entry,
    }
    this.lines.push(full)
    if (this.lines.length > MAX_LINES) {
      this.lines.splice(0, this.lines.length - MAX_LINES)
    }
    this.emit('line', full)
    return full
  }

  recent(limit = 300): BroadcastLogLine[] {
    return this.lines.slice(-limit)
  }
}

export const logBroadcast = new LogBroadcastBuffer()

// A pino destination stream: pino writes newline-delimited JSON to this, one write per
// log call. Used alongside (not instead of) the existing pino-pretty console transport via
// pino.multistream — see logger.ts.
export const logCaptureStream = new Writable({
  write(chunk, _encoding, callback) {
    try {
      const text = chunk.toString('utf8').trim()
      if (text) {
        const entry = JSON.parse(text) as Record<string, unknown>
        logBroadcast.push(entry)
      }
    } catch {
      // non-JSON or partial chunk — skip rather than crash logging
    }
    callback()
  },
})

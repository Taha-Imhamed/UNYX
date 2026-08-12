import pino from 'pino'
import { logCaptureStream } from './log-broadcast.js'

const isProduction = process.env.NODE_ENV === 'production'
const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

// Two destinations for every log line: the console (pretty-printed in dev, matching what
// the user watches in their VS Code terminal) and logCaptureStream, which feeds the
// Server dashboard's live log viewer (see routes/server-monitor.ts's /log-stream). Combined
// via pino.multistream rather than a single `transport` option, since `transport` only
// supports one destination.
const consoleStream = isProduction
  ? pino.destination(1)
  : pino.transport({
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
    })

export const logger = pino(
  { level },
  pino.multistream([
    { stream: consoleStream, level },
    { stream: logCaptureStream, level },
  ]),
)

export type Logger = typeof logger

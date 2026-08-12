import type { Response } from 'express'
import { randomUUID } from 'node:crypto'

export interface IotConnection {
  connectionId: string
  userId: string
  username: string
  role: string
  jti?: string
  browser: string
  os: string
  device: string
  connectedAt: string
  currentPath: string
  lastActivityAt: string
  res: Response
}

// jti excluded — it's the token identifier used internally to revoke a session, no reason
// for it to leave the server in a list response an admin's browser renders.
export type IotConnectionSummary = Omit<IotConnection, 'res' | 'jti'>

// In-memory only, by design — this tracks live SSE sockets held open by this process.
// A restart drops all connections anyway (clients auto-reconnect from the frontend hook),
// so there's nothing worth persisting here.
const connections = new Map<string, IotConnection>()

export function registerConnection(input: Omit<IotConnection, 'connectionId' | 'connectedAt' | 'lastActivityAt'>): string {
  const connectionId = randomUUID()
  const now = new Date().toISOString()
  connections.set(connectionId, {
    ...input,
    connectionId,
    connectedAt: now,
    lastActivityAt: now,
  })
  return connectionId
}

export function unregisterConnection(connectionId: string) {
  connections.delete(connectionId)
}

export function listConnections(): IotConnectionSummary[] {
  return Array.from(connections.values())
    .map(({ res, jti, ...rest }) => rest)
    .sort((a, b) => (a.connectedAt < b.connectedAt ? 1 : -1))
}

export function getConnection(connectionId: string): IotConnection | undefined {
  return connections.get(connectionId)
}

// Updated by the client's own heartbeat/route-change ping (see POST /iot/heartbeat) —
// this is how "Follow User" knows what page someone is on without the admin having to ask.
export function touchConnection(connectionId: string, patch: { currentPath?: string }) {
  const connection = connections.get(connectionId)
  if (!connection) return false
  if (patch.currentPath !== undefined) connection.currentPath = patch.currentPath
  connection.lastActivityAt = new Date().toISOString()
  return true
}

type IotPushEvent =
  | { type: 'refresh' }
  | { type: 'timeout'; reason?: string }
  | { type: 'force-reauth'; reason?: string }
  | { type: 'message'; text: string }
  | { type: 'notification'; title: string; body?: string }
  | { type: 'navigate'; path: string }
  | { type: 'open-record'; path: string }

export function pushToConnection(connectionId: string, event: IotPushEvent): boolean {
  const connection = connections.get(connectionId)
  if (!connection) return false
  connection.res.write(`data: ${JSON.stringify(event)}\n\n`)
  return true
}

import { apiFetch } from "./api-client"

export interface IotSession {
  connectionId: string
  userId: string
  username: string
  role: string
  browser: string
  os: string
  device: string
  connectedAt: string
  currentPath: string
  lastActivityAt: string
}

export function fetchIotSessions(signal?: AbortSignal) {
  return apiFetch<IotSession[]>("/iot/sessions", { signal })
}

export function refreshIotSession(connectionId: string) {
  return apiFetch<void>(`/iot/sessions/${connectionId}/refresh`, { method: "POST" })
}

export function timeoutIotSession(connectionId: string) {
  return apiFetch<void>(`/iot/sessions/${connectionId}/timeout`, { method: "POST" })
}

export function forceReauthIotSession(connectionId: string) {
  return apiFetch<void>(`/iot/sessions/${connectionId}/force-reauth`, { method: "POST" })
}

export function messageIotSession(connectionId: string, text: string) {
  return apiFetch<void>(`/iot/sessions/${connectionId}/message`, {
    method: "POST",
    body: JSON.stringify({ text }),
  })
}

export function notifyIotSession(connectionId: string, title: string, body?: string) {
  return apiFetch<void>(`/iot/sessions/${connectionId}/notification`, {
    method: "POST",
    body: JSON.stringify({ title, body }),
  })
}

export function navigateIotSession(connectionId: string, path: string) {
  return apiFetch<void>(`/iot/sessions/${connectionId}/navigate`, {
    method: "POST",
    body: JSON.stringify({ path }),
  })
}

export function openRecordIotSession(connectionId: string, path: string) {
  return apiFetch<void>(`/iot/sessions/${connectionId}/open-record`, {
    method: "POST",
    body: JSON.stringify({ path }),
  })
}

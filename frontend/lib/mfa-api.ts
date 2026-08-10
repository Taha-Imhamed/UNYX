import { apiFetch } from "./api-client"

export function startMfaSetup(userId: string) {
  return apiFetch<{ secret: string; qrCodeDataUrl: string }>(`/users/${userId}/mfa/setup`, { method: "POST" })
}

export function verifyMfaSetup(userId: string, code: string) {
  return apiFetch<void>(`/users/${userId}/mfa/verify`, {
    method: "POST",
    body: JSON.stringify({ code }),
  })
}

export function disableMfa(userId: string) {
  return apiFetch<void>(`/users/${userId}/mfa/disable`, { method: "POST" })
}

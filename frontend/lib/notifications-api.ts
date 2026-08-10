import type { UserNotification } from "@shared/types"
import { apiFetch } from "./api-client"

export function fetchNotifications(userId: string, signal?: AbortSignal) {
  return apiFetch<UserNotification[]>(`/users/${userId}/notifications`, { signal })
}

export function markNotificationRead(userId: string, notificationId: string) {
  return apiFetch<void>(`/users/${userId}/notifications/${notificationId}/read`, { method: "PATCH" })
}

export function markAllNotificationsRead(userId: string) {
  return apiFetch<void>(`/users/${userId}/notifications/read-all`, { method: "PATCH" })
}

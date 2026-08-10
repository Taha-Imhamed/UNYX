import { apiFetch } from "./api-client"
import type { ModuleAccessState } from "./terminal-context"

export interface RoleSummary {
  role: string
  userCount: number
  moduleKey: string | null
}

export function fetchRoleSummaries(signal?: AbortSignal) {
  return apiFetch<RoleSummary[]>("/terminal/roles", { signal })
}

export interface RoleUser {
  id: string
  username: string
  email: string
  status: string
}

export function fetchUsersInRole(role: string, query?: string, signal?: AbortSignal) {
  const search = query ? `?query=${encodeURIComponent(query)}` : ""
  return apiFetch<RoleUser[]>(`/terminal/roles/${encodeURIComponent(role)}/users${search}`, { signal })
}

export interface UserFeatureOverride {
  id: string
  userId: string
  moduleKey: string
  featureKey: string
  state: ModuleAccessState
  createdAt: string
  createdBy?: string | null
}

export function fetchUserOverrides(userId: string, signal?: AbortSignal) {
  return apiFetch<UserFeatureOverride[]>(`/terminal/overrides/${encodeURIComponent(userId)}`, { signal })
}

export function setUserOverride(userId: string, moduleKey: string, featureKey: string, state: ModuleAccessState | null) {
  return apiFetch<UserFeatureOverride | null>(`/terminal/overrides/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify({ moduleKey, featureKey, state }),
  })
}

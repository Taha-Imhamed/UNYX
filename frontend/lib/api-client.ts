import type { Permission } from "@shared/types"

const apiBaseEnv = process.env.NEXT_PUBLIC_API_URL ?? null

function resolveApiBase() {
  const fromEnv = apiBaseEnv && apiBaseEnv.trim().length > 0 ? apiBaseEnv.trim() : null
  if (fromEnv) {
    return fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv
  }
  return "/api"
}

export const API_BASE_URL = resolveApiBase()

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function authHeaders(init?: HeadersInit): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ar_company_token") ?? sessionStorage.getItem("ar_company_token")
      : null
  return token ? { ...init, Authorization: `Bearer ${token}` } : init ?? {}
}

function handleAuthFailure(status: number, path: string) {
  if (typeof window === "undefined") return
  if (status === 401) {
    const hasToken =
      !!sessionStorage.getItem("ar_company_token") || !!localStorage.getItem("ar_company_token")
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem("ar_company_user")
      storage.removeItem("ar_company_token")
    }
    localStorage.removeItem("ar_company_remember")
    if (hasToken && !window.location.pathname.startsWith("/login")) {
      // eslint-disable-next-line no-console
      console.warn("[apiFetch] redirecting to login after 401", { path })
      window.location.assign("/login")
    }
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(init?.headers),
    },
    ...init,
  })

  if (response.status === 401 || response.status === 403) {
    // eslint-disable-next-line no-console
    console.warn("[apiFetch] auth error", { path: url, status: response.status })
    handleAuthFailure(response.status, url)
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
  if (!contentType.includes("application/json")) {
    const text = await response.text()
    throw new Error(`Expected JSON but got ${contentType || "unknown type"}: ${text.slice(0, 120)}...`)
  }

  const json = (await response.json()) as ApiResponse<T>

  if (!response.ok || !json.success) {
    const detail = json.error || json.message || `Request failed (${response.status})`
    throw new Error(detail)
  }

  if (json.data === undefined) {
    return undefined as T
  }

  return json.data
}

export function hasPermissionFromRole(role: string | undefined, overrides?: Partial<Record<Permission, boolean>>, permission?: Permission) {
  if (!permission) return false
  if (role === "admin" || role === "super-admin") return true
  const base: Permission[] = role === "supervisor"
    ? ["marketing:view", "marketing:manage", "enrollment:view", "enrollment:manage", "reports:view", "reports:export", "ADMIN_VIEW_SCHEDULE"]
    : role === "advisor"
      ? ["enrollment:view", "enrollment:manage", "reports:view"]
      : role === "teaching-assistant"
        ? ["enrollment:view", "reports:view"]
      : role === "registrar"
            ? ["users:manage", "enrollment:view", "enrollment:manage", "edit_any_grade", "reports:view", "ADMIN_VIEW_SCHEDULE", "MANAGE_RESOURCES"]
          : role === "admissions"
            ? ["marketing:view", "marketing:manage", "enrollment:view", "enrollment:manage", "reports:view"]
            : role === "finance"
              ? ["finance:view", "finance:manage", "VIEW_FINANCIALS", "reports:view"]
              : role === "it-admin"
                ? ["users:manage", "settings:manage", "reports:view"]
                : role === "dean"
                  ? ["reports:view", "enrollment:view"]
                  : role === "hod"
                    ? ["reports:view", "enrollment:view", "enrollment:manage"]
                    : role === "librarian"
                      ? ["reports:view"]
                      : role === "student-affairs"
                        ? ["marketing:view", "marketing:manage", "enrollment:view", "reports:view"]
                        : role === "hr"
                          ? ["users:manage", "settings:manage", "reports:view"]
                          : role === "security"
                            ? ["reports:view"]
                            : role === "facilities"
                              ? ["reports:view", "enrollment:view"]
                              : role === "research-office"
                                ? ["reports:view", "marketing:view"]
                                : role === "professor"
                                  ? ["enrollment:view", "ENTER_GRADES", "edit_own_grades"]
                                : []
  const set = new Set<Permission>(base)
  if (overrides) {
    for (const [key, value] of Object.entries(overrides) as Array<[Permission, boolean]>) {
      if (value) set.add(key)
      else set.delete(key)
    }
  }
  return set.has(permission)
}

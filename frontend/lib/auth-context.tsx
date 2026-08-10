"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { AccessProfile, Permission, SystemRole, UserNotification } from "@shared/types"

export interface AuthUser {
  id: string
  username: string
  displayName?: string | null
  email: string
  role: SystemRole
  secondaryRoles?: SystemRole[]
  avatarUrl?: string | null
  studentId?: string | null
  professorId?: string | null
  permissions?: Partial<Record<Permission, boolean>>
  customRoleId?: string | null
  customRoleName?: string | null
  accessProfile?: AccessProfile
  mfaEnabled?: boolean
}

interface AuthContextType {
  user: AuthUser | null
  login: (username: string, password: string, remember?: boolean, mfaCode?: string) => Promise<"success" | "mfa-required" | "failed">
  logout: () => void
  updatePassword: (input: { userId: string; currentPassword: string; newPassword: string }) => Promise<
    | { success: true; message?: string }
    | { success: false; error: string }
  >
  adminResetPassword: (input: { targetUserId: string; newPassword: string; reason?: string }) => Promise<
    | { success: true; message?: string }
    | { success: false; error: string }
  >
  fetchUserNotifications: (userId: string) => Promise<UserNotification[]>
  updateProfile: (input: { userId: string; username?: string; email?: string; avatarDataUrl?: string | null }) => Promise<
    | { success: true; data: AuthUser; message?: string }
    | { success: false; error: string }
  >
  isLoading: boolean
  isAdmin: boolean
  isStudent: boolean
  hasPermission: (permission: Permission) => boolean
  effectivePermissions: Permission[]
}

const AuthContext = createContext<AuthContextType | null>(null)

const apiBaseEnv = process.env.NEXT_PUBLIC_API_URL ?? null

function resolveApiBase() {
  const fromEnv = apiBaseEnv && apiBaseEnv.trim().length > 0 ? apiBaseEnv.trim() : null
  if (fromEnv) {
    return fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv
  }
  if (typeof window !== "undefined") {
    return "/api"
  }
  return "/api"
}

const API_BASE_URL = resolveApiBase()

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

const rolePermissions: Record<AuthUser["role"], Permission[]> = {
  admin: [
    "users:manage",
    "students:view",
    "professors:view",
    "marketing:view",
    "marketing:manage",
    "applications:view",
    "finance:view",
    "finance:manage",
    "finance:approve",
    "VIEW_FINANCIALS",
    "enrollment:view",
    "enrollment:manage",
    "feedback:view",
    "news:view",
    "audit:view",
    "reports:view",
    "reports:export",
    "ADMIN_VIEW_SCHEDULE",
    "MANAGE_RESOURCES",
    "settings:manage",
  ],
  "super-admin": [
    "users:manage",
    "students:view",
    "professors:view",
    "marketing:view",
    "marketing:manage",
    "applications:view",
    "finance:view",
    "finance:manage",
    "finance:approve",
    "VIEW_FINANCIALS",
    "enrollment:view",
    "enrollment:manage",
    "feedback:view",
    "news:view",
    "audit:view",
    "reports:view",
    "reports:export",
    "ADMIN_VIEW_SCHEDULE",
    "MANAGE_RESOURCES",
    "settings:manage",
  ],
  supervisor: ["students:view", "professors:view", "marketing:view", "marketing:manage", "applications:view", "enrollment:view", "enrollment:manage", "feedback:view", "news:view", "reports:view", "reports:export", "ADMIN_VIEW_SCHEDULE"],
  advisor: ["students:view", "enrollment:view", "enrollment:manage", "feedback:view", "reports:view"],
  "teaching-assistant": ["students:view", "enrollment:view", "reports:view"],
  registrar: ["users:manage", "students:view", "enrollment:view", "enrollment:manage", "edit_any_grade", "reports:view", "ADMIN_VIEW_SCHEDULE", "MANAGE_RESOURCES"],
  admissions: ["students:view", "marketing:view", "marketing:manage", "applications:view", "enrollment:view", "enrollment:manage", "reports:view"],
  finance: ["students:view", "finance:view", "finance:manage", "finance:approve", "VIEW_FINANCIALS", "reports:view", "reports:export"],
  "it-admin": ["users:manage", "audit:view", "settings:manage", "reports:view"],
  dean: ["students:view", "professors:view", "reports:view", "enrollment:view"],
  hod: ["professors:view", "reports:view", "enrollment:view", "enrollment:manage"],
  librarian: ["reports:view"],
  "student-affairs": ["students:view", "marketing:view", "marketing:manage", "feedback:view", "reports:view"],
  hr: ["users:manage", "settings:manage", "reports:view"],
  security: ["audit:view", "reports:view"],
  facilities: ["reports:view", "enrollment:view"],
  "research-office": ["reports:view", "marketing:view", "news:view"],
  user: [],
  student: [],
  professor: ["enrollment:view", "ENTER_GRADES", "edit_own_grades"],
}

function resolvePermissions(role: AuthUser["role"], overrides?: Partial<Record<Permission, boolean>>, secondaryRoles?: SystemRole[]): Permission[] {
  const base = new Set(rolePermissions[role] ?? [])
  ;(secondaryRoles ?? []).forEach((secondaryRole) => {
    for (const permission of rolePermissions[secondaryRole as AuthUser["role"]] ?? []) {
      base.add(permission)
    }
  })
  if (overrides) {
    for (const [key, value] of Object.entries(overrides) as Array<[Permission, boolean]>) {
      if (value) {
        base.add(key)
      } else {
        base.delete(key)
      }
    }
  }
  return Array.from(base)
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("ar_company_token") ?? sessionStorage.getItem("ar_company_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function readStoredAuth() {
  if (typeof window === "undefined") return null
  const storages: Storage[] = [localStorage, sessionStorage]
  for (const storage of storages) {
    try {
      const userRaw = storage.getItem("ar_company_user")
      const token = storage.getItem("ar_company_token")
      if (userRaw && token) {
        const user = JSON.parse(userRaw) as AuthUser
        return { user, token, remember: storage === localStorage }
      }
    } catch (error) {
      console.warn("[auth] failed to parse stored auth", error)
    }
  }
  return null
}

function persistAuth(user: AuthUser, token: string, remember?: boolean) {
  if (typeof window === "undefined") return
  const target = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage

  target.setItem("ar_company_user", JSON.stringify(user))
  target.setItem("ar_company_token", token)
  if (remember) {
    localStorage.setItem("ar_company_remember", "true")
  } else {
    localStorage.removeItem("ar_company_remember")
  }

  other.removeItem("ar_company_user")
  other.removeItem("ar_company_token")
}

function clearAuthStorage() {
  if (typeof window === "undefined") return
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem("ar_company_user")
    storage.removeItem("ar_company_token")
    storage.removeItem("ar_company_username")
    storage.removeItem("ar_company_student_profile")
  }
  localStorage.removeItem("ar_company_remember")
}

async function parseJsonResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
  if (!contentType.includes("application/json")) {
    const text = await response.text()
    throw new Error(`Expected JSON but got ${contentType || "unknown"}: ${text.slice(0, 120)}...`)
  }
  return (await response.json()) as ApiResponse<T>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const stored = readStoredAuth()
    if (stored?.user) {
      setUser(stored.user)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Redirect logic
    const currentPathname = pathname ?? ""
    if (!isLoading) {
      if (!user && (currentPathname.startsWith("/dashboard") || currentPathname.startsWith("/student"))) {
        router.push("/login")
      } else if (user?.role === "student" && currentPathname.startsWith("/dashboard")) {
        router.push("/student")
      }
    }
  }, [user, isLoading, pathname, router])

  const login = async (
    username: string,
    password: string,
    remember?: boolean,
    mfaCode?: string,
  ): Promise<"success" | "mfa-required" | "failed"> => {
    try {
      const trimmedUsername = username.trim()
      const trimmedPassword = password.trim()
      if (!trimmedUsername || !trimmedPassword) {
        return "failed"
      }

      // Ensure any stale tokens/user data are cleared before a new attempt
      clearAuthStorage()

      const response = await fetch(`${API_BASE_URL}/users/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword,
          ...(mfaCode ? { mfaCode: mfaCode.trim() } : {}),
        }),
      })

      const json = await parseJsonResponse<{ user: AuthUser; token: string }>(response)

      if (!response.ok || !json.success || !json.data) {
        if ((json as { mfaRequired?: boolean }).mfaRequired) {
          return "mfa-required"
        }
        return "failed"
      }

      setUser(json.data.user)
      persistAuth(json.data.user, json.data.token, remember)
      return "success"
    } catch (error) {
      console.error("Login request failed", error)
      return "failed"
    }
  }

  const logout = () => {
    setUser(null)
    clearAuthStorage()
    router.push("/login")
  }

  const updatePassword: AuthContextType["updatePassword"] = async ({ userId, currentPassword, newPassword }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const json = await parseJsonResponse<never>(response)

      if (!response.ok || !json.success) {
        return { success: false, error: json.error ?? "Unable to update password" }
      }

      return { success: true, message: json.message }
    } catch (error) {
      console.error("Password update failed", error)
      return { success: false, error: error instanceof Error ? error.message : "Unable to update password" }
    }
  }



  const updateProfile: AuthContextType["updateProfile"] = async ({ userId, username, email, avatarDataUrl }) => {
    const payload: Record<string, string | null> = {}

    if (typeof username === "string" && username.trim()) {
      payload.username = username.trim()
    }

    if (typeof email === "string" && email.trim()) {
      payload.email = email.trim()
    }

    if (avatarDataUrl !== undefined) {
      payload.avatarUrl = avatarDataUrl
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const json = await parseJsonResponse<AuthUser>(response)

      if (!response.ok || !json.success || !json.data) {
        return { success: false, error: json.error ?? "Unable to update profile" }
      }

      setUser(json.data)
      const existing = readStoredAuth()
      const token = existing?.token ?? localStorage.getItem("ar_company_token") ?? sessionStorage.getItem("ar_company_token") ?? ""
      persistAuth(json.data, token, existing?.remember)

      return { success: true, data: json.data, message: json.message }
    } catch (error) {
      console.error("Profile update failed", error)
      return { success: false, error: error instanceof Error ? error.message : "Unable to update profile" }
    }
  }

  const adminResetPassword: AuthContextType["adminResetPassword"] = async ({ targetUserId, newPassword, reason }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${targetUserId}/password/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ newPassword, reason, actor: user?.username ?? "admin" }),
      })

      const json = await parseJsonResponse<never>(response)

      if (!response.ok || !json.success) {
        return { success: false, error: json.error ?? "Unable to reset password" }
      }

      return { success: true, message: json.message }
    } catch (error) {
      console.error("Admin password reset failed", error)
      return { success: false, error: error instanceof Error ? error.message : "Unable to reset password" }
    }
  }

  const fetchUserNotifications: AuthContextType["fetchUserNotifications"] = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/notifications`, {
        headers: {
          ...getAuthHeaders(),
        },
      })
      const json = await parseJsonResponse<UserNotification[]>(response)

      if (!response.ok || !json.success || !json.data) {
        return []
      }

      return json.data
    } catch (error) {
      console.error("Notification fetch failed", error)
      return []
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updatePassword,
        adminResetPassword,
        fetchUserNotifications,
        updateProfile,
        isLoading,
        isAdmin: user?.role === "admin" || user?.role === "super-admin" || user?.role === "supervisor",
        isStudent: user?.role === "student",
        hasPermission: (permission) => {
          if (user?.role === "admin" || user?.role === "super-admin") return true
          return resolvePermissions(user?.role ?? "user", user?.permissions, user?.secondaryRoles).includes(permission)
        },
        effectivePermissions: resolvePermissions(user?.role ?? "user", user?.permissions, user?.secondaryRoles),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

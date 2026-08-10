"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/auth-context"

type DashboardRole =
  | "admin"
  | "super-admin"
  | "supervisor"
  | "user"
  | "student"
  | "professor"
  | "advisor"
  | "teaching-assistant"
  | "registrar"
  | "admissions"
  | "finance"
  | "it-admin"
  | "dean"
  | "hod"
  | "librarian"
  | "student-affairs"
  | "hr"
  | "security"
  | "facilities"
  | "research-office"

interface DashboardRouteGuardProps {
  allowedRoles: DashboardRole[]
  redirectTo?: string
  children: ReactNode
}

export function DashboardRouteGuard({ allowedRoles, redirectTo = "/dashboard", children }: DashboardRouteGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const allRoles = user ? [user.role, ...(user.secondaryRoles ?? [])] : []
  const isAllowed = !!user && allRoles.some((role) => allowedRoles.includes(role as DashboardRole))

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (!isAllowed) {
      router.replace(redirectTo)
    }
  }, [isAllowed, isLoading, redirectTo, router, user])

  if (isLoading || !user || !isAllowed) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return <>{children}</>
}

"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useModuleToggles } from "@/lib/terminal-context"
import { moduleKeyForHref } from "@/lib/terminal-modules"
import { Card, CardContent } from "@/components/ui/card"

export function ModuleLockGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ""
  const { user } = useAuth()
  const { getModuleState, lockMessage, loaded } = useModuleToggles()

  if (user?.role === "super-admin" || !loaded) {
    return <>{children}</>
  }

  const moduleKey = moduleKeyForHref(pathname)
  const state = getModuleState(moduleKey)

  if (state !== "locked") {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Page Unavailable</h2>
          <p className="text-sm text-muted-foreground">{lockMessage}</p>
        </CardContent>
      </Card>
    </div>
  )
}

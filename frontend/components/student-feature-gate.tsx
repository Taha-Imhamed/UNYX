"use client"

import type { ReactNode } from "react"
import { Lock, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useModuleToggles } from "@/lib/terminal-context"
import { Card, CardContent } from "@/components/ui/card"

const STUDENT_MODULE_KEY = "student-portal"

export function StudentFeatureGate({
  featureKey,
  children,
}: {
  featureKey: string
  children: ReactNode
}) {
  const { user } = useAuth()
  const { getFeatureState, getModuleState, lockMessage, loaded } = useModuleToggles()

  if (user?.role === "super-admin" || !loaded) {
    return <>{children}</>
  }

  const moduleState = getModuleState(STUDENT_MODULE_KEY)
  const state = moduleState === "hidden" ? "hidden" : getFeatureState(STUDENT_MODULE_KEY, featureKey)

  if (state === "open") {
    return <>{children}</>
  }

  const Icon = state === "hidden" ? EyeOff : Lock

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <Icon className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">
            {state === "hidden" ? "Feature Unavailable" : "Page Unavailable"}
          </h2>
          <p className="text-sm text-muted-foreground">{lockMessage}</p>
        </CardContent>
      </Card>
    </div>
  )
}

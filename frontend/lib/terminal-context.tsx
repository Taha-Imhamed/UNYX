"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { apiFetch } from "./api-client"
import { useAuth } from "./auth-context"

export type ModuleAccessState = "open" | "locked" | "hidden"

interface TerminalStateResponse {
  moduleStates: Record<string, ModuleAccessState>
  featureStates: Record<string, ModuleAccessState>
  lockMessage: string
}

interface ModuleTogglesContextValue {
  loaded: boolean
  getModuleState: (moduleKey: string | null | undefined) => ModuleAccessState
  getFeatureState: (moduleKey: string, featureKey: string) => ModuleAccessState
  isModuleEnabled: (moduleKey: string | null | undefined) => boolean
  isFeatureEnabled: (moduleKey: string, featureKey: string) => boolean
  moduleStates: Record<string, ModuleAccessState>
  featureStates: Record<string, ModuleAccessState>
  lockMessage: string
  refresh: () => Promise<void>
}

const ModuleTogglesContext = createContext<ModuleTogglesContextValue | undefined>(undefined)

export function ModuleTogglesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleAccessState>>({})
  const [featureStates, setFeatureStates] = useState<Record<string, ModuleAccessState>>({})
  const [lockMessage, setLockMessage] = useState("This page is under maintenance. We are working on it.")
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setModuleStates({})
      setFeatureStates({})
      setLoaded(true)
      return
    }
    try {
      const data = await apiFetch<TerminalStateResponse>("/terminal/public-state")
      setModuleStates(data.moduleStates ?? {})
      setFeatureStates(data.featureStates ?? {})
      if (data.lockMessage) setLockMessage(data.lockMessage)
    } catch {
      setModuleStates({})
      setFeatureStates({})
    } finally {
      setLoaded(true)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const getModuleState = useCallback(
    (moduleKey: string | null | undefined): ModuleAccessState => {
      if (!moduleKey) return "open"
      return moduleStates[moduleKey] ?? "open"
    },
    [moduleStates],
  )

  const getFeatureState = useCallback(
    (moduleKey: string, featureKey: string): ModuleAccessState => {
      return featureStates[`${moduleKey}:${featureKey}`] ?? "open"
    },
    [featureStates],
  )

  const isModuleEnabled = useCallback((moduleKey: string | null | undefined) => getModuleState(moduleKey) !== "hidden", [getModuleState])
  const isFeatureEnabled = useCallback(
    (moduleKey: string, featureKey: string) => getFeatureState(moduleKey, featureKey) !== "hidden",
    [getFeatureState],
  )

  const value = useMemo(
    () => ({
      loaded,
      getModuleState,
      getFeatureState,
      isModuleEnabled,
      isFeatureEnabled,
      moduleStates,
      featureStates,
      lockMessage,
      refresh,
    }),
    [loaded, getModuleState, getFeatureState, isModuleEnabled, isFeatureEnabled, moduleStates, featureStates, lockMessage, refresh],
  )

  return <ModuleTogglesContext.Provider value={value}>{children}</ModuleTogglesContext.Provider>
}

export function useModuleToggles() {
  const context = useContext(ModuleTogglesContext)
  if (!context) {
    throw new Error("useModuleToggles must be used within a ModuleTogglesProvider")
  }
  return context
}

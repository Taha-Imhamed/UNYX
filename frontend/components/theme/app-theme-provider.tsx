"use client"

import "../../sentry.client.config"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  applyThemeColors,
  DEFAULT_THEME,
  loadStoredTheme,
  saveStoredTheme,
  type AppThemeColors,
} from "@/lib/theme-presets"

interface AppThemeContextValue {
  colors: AppThemeColors
  setColors: (colors: AppThemeColors) => void
  resetToDefault: () => void
}

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined)

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [colors, setColorsState] = useState<AppThemeColors>(DEFAULT_THEME)

  useEffect(() => {
    const stored = loadStoredTheme()
    setColorsState(stored)
    applyThemeColors(stored)
  }, [])

  const setColors = (next: AppThemeColors) => {
    setColorsState(next)
    applyThemeColors(next)
    saveStoredTheme(next)
  }

  const resetToDefault = () => setColors(DEFAULT_THEME)

  return <AppThemeContext.Provider value={{ colors, setColors, resetToDefault }}>{children}</AppThemeContext.Provider>
}

export function useAppTheme() {
  const context = useContext(AppThemeContext)
  if (!context) throw new Error("useAppTheme must be used within an AppThemeProvider")
  return context
}

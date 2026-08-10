"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppTheme } from "@/components/theme/app-theme-provider"
import { THEME_PRESETS } from "@/lib/theme-presets"

const LIGHT_PRESET = THEME_PRESETS.find((p) => p.id === "ocean")!
const DARK_PRESET = THEME_PRESETS.find((p) => p.id === "midnight")!

export function DarkModeToggle() {
  const { colors, setColors } = useAppTheme()
  const isDark = colors.background === DARK_PRESET.background

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 rounded-md border border-slate-600 bg-white/5 text-slate-100 hover:bg-white/10"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setColors(isDark ? { background: LIGHT_PRESET.background, foreground: LIGHT_PRESET.foreground, menu: LIGHT_PRESET.menu } : { background: DARK_PRESET.background, foreground: DARK_PRESET.foreground, menu: DARK_PRESET.menu })}
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </Button>
  )
}

export interface AppThemeColors {
  background: string
  foreground: string
  menu: string
}

export interface AppThemePreset extends AppThemeColors {
  id: string
  name: string
}

export const THEME_STORAGE_KEY = "app-theme-colors-v1"

export const THEME_PRESETS: AppThemePreset[] = [
  { id: "ocean", name: "Ocean Blue", background: "#edf4f8", foreground: "#101820", menu: "#0f1c40" },
  { id: "midnight", name: "Midnight", background: "#0b1220", foreground: "#e6edf5", menu: "#05070d" },
  { id: "forest", name: "Forest", background: "#eef6ee", foreground: "#12241a", menu: "#0f2e1c" },
  { id: "sunset", name: "Sunset", background: "#fff3e8", foreground: "#2a170a", menu: "#3a1a12" },
]

export const DEFAULT_THEME: AppThemeColors = {
  background: THEME_PRESETS[0].background,
  foreground: THEME_PRESETS[0].foreground,
  menu: THEME_PRESETS[0].menu,
}

/** Picks a readable text color (near-white or near-black) against a given hex background. */
export function contrastForeground(hex: string): string {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return "#eef2fb"
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#101820" : "#eef2fb"
}

export function applyThemeColors(colors: AppThemeColors) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.style.setProperty("--background", colors.background)
  root.style.setProperty("--foreground", colors.foreground)
  root.style.setProperty("--menu-color", colors.menu)
  root.style.setProperty("--menu-foreground", contrastForeground(colors.menu))
}

export function loadStoredTheme(): AppThemeColors {
  if (typeof window === "undefined") return DEFAULT_THEME
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return DEFAULT_THEME
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.background === "string" && typeof parsed.foreground === "string" && typeof parsed.menu === "string") {
      return parsed
    }
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_THEME
}

export function saveStoredTheme(colors: AppThemeColors) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(colors))
}

/** Inlined into a <script> tag at the top of <body> so the theme applies before first paint. */
export const THEME_ANTI_FLASH_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(!raw)return;var c=JSON.parse(raw);if(!c||!c.background||!c.foreground||!c.menu)return;var root=document.documentElement;root.style.setProperty("--background",c.background);root.style.setProperty("--foreground",c.foreground);root.style.setProperty("--menu-color",c.menu);var hex=c.menu.replace("#","");if(hex.length===6){var r=parseInt(hex.substring(0,2),16),g=parseInt(hex.substring(2,4),16),b=parseInt(hex.substring(4,6),16);var lum=(0.299*r+0.587*g+0.114*b)/255;root.style.setProperty("--menu-foreground",lum>0.6?"#101820":"#eef2fb");}}catch(e){}})();`

"use client"

import { useState } from "react"
import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useAppTheme } from "@/components/theme/app-theme-provider"
import { DEFAULT_THEME, THEME_PRESETS } from "@/lib/theme-presets"

export function AppearanceSettingsCard() {
  const { colors, setColors, resetToDefault } = useAppTheme()
  const [draft, setDraft] = useState(colors)

  const activePresetId = THEME_PRESETS.find(
    (preset) => preset.background === colors.background && preset.foreground === colors.foreground && preset.menu === colors.menu,
  )?.id

  const applyCustom = () => setColors(draft)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>Pick a color theme or build a custom one</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setColors({ background: preset.background, foreground: preset.foreground, menu: preset.menu })
                setDraft({ background: preset.background, foreground: preset.foreground, menu: preset.menu })
              }}
              className={`flex flex-col items-stretch gap-2 rounded-xl border p-3 text-left transition-colors ${
                activePresetId === preset.id ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex h-12 overflow-hidden rounded-lg border border-border/60">
                <span className="w-1/3" style={{ backgroundColor: preset.menu }} />
                <span className="flex-1" style={{ backgroundColor: preset.background }} />
              </div>
              <span className="text-sm font-medium text-foreground">{preset.name}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-secondary/20 p-4">
          <p className="text-sm font-medium text-foreground">Custom theme</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="theme-background">Background color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="theme-background"
                  type="color"
                  value={draft.background}
                  onChange={(e) => setDraft((prev) => ({ ...prev, background: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0"
                />
                <span className="text-xs text-muted-foreground">{draft.background}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme-foreground">Text color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="theme-foreground"
                  type="color"
                  value={draft.foreground}
                  onChange={(e) => setDraft((prev) => ({ ...prev, foreground: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0"
                />
                <span className="text-xs text-muted-foreground">{draft.foreground}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme-menu">Menu color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="theme-menu"
                  type="color"
                  value={draft.menu}
                  onChange={(e) => setDraft((prev) => ({ ...prev, menu: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0"
                />
                <span className="text-xs text-muted-foreground">{draft.menu}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={applyCustom}>Apply custom theme</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetToDefault()
                setDraft(DEFAULT_THEME)
              }}
            >
              Reset to default
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

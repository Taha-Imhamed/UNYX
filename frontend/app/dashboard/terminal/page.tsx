"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardRouteGuard } from "@/components/dashboard-route-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, ChevronRight, ChevronDown, Lock, EyeOff, Unlock, SquareTerminal, Search, X, LayoutGrid } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useModuleToggles, type ModuleAccessState } from "@/lib/terminal-context"
import { TERMINAL_MODULES, ROLE_LABELS, ROLE_MODULE_MAP, type TerminalModuleDef } from "@/lib/terminal-modules"
import {
  fetchRoleSummaries,
  fetchUserOverrides,
  fetchUsersInRole,
  setUserOverride,
  type RoleSummary,
  type RoleUser,
  type UserFeatureOverride,
} from "@/lib/terminal-api"
import { cn } from "@/lib/utils"

interface TerminalStateResponse {
  moduleStates: Record<string, ModuleAccessState>
  featureStates: Record<string, ModuleAccessState>
  lockMessage: string
}

const STATE_OPTIONS: { value: ModuleAccessState; label: string; icon: typeof Unlock }[] = [
  { value: "open", label: "Open", icon: Unlock },
  { value: "locked", label: "Locked", icon: Lock },
  { value: "hidden", label: "Hidden", icon: EyeOff },
]

function StateSelector({
  value,
  onChange,
  disabled,
  size = "default",
}: {
  value: ModuleAccessState
  onChange: (v: ModuleAccessState) => void
  disabled?: boolean
  size?: "default" | "sm"
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border">
      {STATE_OPTIONS.map((opt) => {
        const Icon = opt.icon
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 font-medium transition-colors disabled:opacity-40",
              size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
              active
                ? opt.value === "open"
                  ? "bg-emerald-500 text-white"
                  : opt.value === "locked"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-500 text-white"
                : "bg-transparent text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// --- Role list (landing view) ------------------------------------------------

function RoleListView({ onSelectRole }: { onSelectRole: (role: string) => void }) {
  const [roles, setRoles] = useState<RoleSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchRoleSummaries(controller.signal)
      .then(setRoles)
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load roles")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" /> Loading roles
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load roles</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {roles.map((role) => (
        <button
          key={role.role}
          type="button"
          onClick={() => onSelectRole(role.role)}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-secondary/20"
        >
          <div>
            <p className="font-semibold text-foreground">{ROLE_LABELS[role.role] ?? role.role}</p>
            <p className="text-sm text-muted-foreground">{role.userCount} user{role.userCount === 1 ? "" : "s"}</p>
            {!role.moduleKey && <p className="mt-1 text-xs text-muted-foreground">No feature controls yet</p>}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}

// --- Role detail (global toggles for the role's module) ---------------------

function RoleFeatureList({
  module: mod,
  moduleStates,
  featureStates,
  onSetModuleState,
  onSetFeatureState,
  saving,
}: {
  module: TerminalModuleDef
  moduleStates: Record<string, ModuleAccessState>
  featureStates: Record<string, ModuleAccessState>
  onSetModuleState: (key: string, state: ModuleAccessState) => void
  onSetFeatureState: (moduleKey: string, featureKey: string, state: ModuleAccessState) => void
  saving: boolean
}) {
  const moduleState = moduleStates[mod.key] ?? "open"
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="font-medium">All {mod.label}</span>
        <StateSelector value={moduleState} onChange={(v) => onSetModuleState(mod.key, v)} disabled={saving} />
      </div>
      {mod.features.length > 0 && (
        <CardContent className="space-y-2 border-t pt-3">
          {mod.features.map((feature) => {
            const featureState = featureStates[`${mod.key}:${feature.key}`] ?? "open"
            return (
              <div key={feature.key} className="flex flex-wrap items-center justify-between gap-2 pl-2">
                <span className="text-sm text-muted-foreground">{feature.label}</span>
                <StateSelector
                  value={featureState}
                  disabled={saving || moduleState !== "open"}
                  onChange={(v) => onSetFeatureState(mod.key, feature.key, v)}
                />
              </div>
            )
          })}
        </CardContent>
      )}
    </Card>
  )
}

// --- Per-user override section ------------------------------------------------

function UserOverridePanel({ role, module: mod }: { role: string; module: TerminalModuleDef }) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<RoleUser[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<RoleUser | null>(null)
  const [overrides, setOverrides] = useState<UserFeatureOverride[]>([])
  const [loadingOverrides, setLoadingOverrides] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setSearching(true)
    fetchUsersInRole(role, search.trim() || undefined, controller.signal)
      .then(setResults)
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false)
      })
    return () => controller.abort()
  }, [role, search])

  const loadOverrides = (userId: string) => {
    setLoadingOverrides(true)
    fetchUserOverrides(userId)
      .then(setOverrides)
      .catch(() => setOverrides([]))
      .finally(() => setLoadingOverrides(false))
  }

  const selectUser = (user: RoleUser) => {
    setSelectedUser(user)
    loadOverrides(user.id)
  }

  const overrideMap = useMemo(() => {
    const map = new Map<string, ModuleAccessState>()
    overrides.forEach((o) => map.set(`${o.moduleKey}:${o.featureKey}`, o.state))
    return map
  }, [overrides])

  const handleSetOverride = async (featureKey: string, state: ModuleAccessState | null) => {
    if (!selectedUser) return
    const key = `${mod.key}:${featureKey}`
    setSavingKey(key)
    try {
      await setUserOverride(selectedUser.id, mod.key, featureKey, state)
      loadOverrides(selectedUser.id)
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div>
          <p className="font-medium">Override for one {ROLE_LABELS[role]?.toLowerCase() ?? role}</p>
          <p className="text-sm text-muted-foreground">
            Search a specific user to open or close a feature just for them, regardless of the setting above.
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {!selectedUser ? (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {searching ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Searching
              </div>
            ) : results.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No users found.</p>
            ) : (
              results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectUser(user)}
                  className="flex w-full items-center justify-between rounded-lg border border-border p-2.5 text-left text-sm hover:bg-secondary/20"
                >
                  <span>
                    <span className="font-medium text-foreground">{user.username}</span>{" "}
                    <span className="text-muted-foreground">{user.email}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedUser.username}</p>
                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedUser(null)}>
                <X className="h-3.5 w-3.5" /> Change user
              </Button>
            </div>

            {loadingOverrides ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading overrides
              </div>
            ) : (
              <div className="space-y-2">
                {(mod.features.length > 0 ? mod.features : [{ key: "_module", label: `All ${mod.label}` }]).map((feature) => {
                  const key = `${mod.key}:${feature.key}`
                  const currentOverride = overrideMap.get(key)
                  const savingThis = savingKey === key
                  return (
                    <div key={feature.key} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">{feature.label}</span>
                      <div className="flex items-center gap-2">
                        {currentOverride ? (
                          <Badge variant="outline" className="text-[10px]">Custom</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Default</Badge>
                        )}
                        <StateSelector
                          size="sm"
                          value={currentOverride ?? "open"}
                          disabled={savingThis}
                          onChange={(v) => handleSetOverride(feature.key, v)}
                        />
                        {currentOverride && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            disabled={savingThis}
                            onClick={() => handleSetOverride(feature.key, null)}
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- Role detail view ---------------------------------------------------------

function RoleDetailView({ role, onBack }: { role: string; onBack: () => void }) {
  const { refresh } = useModuleToggles()
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleAccessState>>({})
  const [featureStates, setFeatureStates] = useState<Record<string, ModuleAccessState>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<TerminalStateResponse>("/terminal/state")
      .then((data) => {
        setModuleStates(data.moduleStates ?? {})
        setFeatureStates(data.featureStates ?? {})
      })
      .catch(() => {})
  }, [])

  const roleModuleKey = ROLE_MODULE_MAP[role]
  const roleModule = roleModuleKey ? TERMINAL_MODULES.find((m) => m.key === roleModuleKey) : undefined

  const persist = async (nextModules: Record<string, ModuleAccessState>, nextFeatures: Record<string, ModuleAccessState>) => {
    setSaving(true)
    setError(null)
    try {
      await apiFetch("/terminal/toggles", {
        method: "PUT",
        body: JSON.stringify({ moduleStates: nextModules, featureStates: nextFeatures }),
      })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const setModuleState = (key: string, state: ModuleAccessState) => {
    const next = { ...moduleStates, [key]: state }
    setModuleStates(next)
    void persist(next, featureStates)
  }

  const setFeatureState = (moduleKey: string, featureKey: string, state: ModuleAccessState) => {
    const id = `${moduleKey}:${featureKey}`
    const next = { ...featureStates, [id]: state }
    setFeatureStates(next)
    void persist(moduleStates, next)
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" /> All roles
      </Button>

      <div>
        <h2 className="text-lg font-semibold text-foreground">{ROLE_LABELS[role] ?? role}</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!roleModule ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            This role doesn&apos;t have feature-level controls yet — only role-based dashboard access, managed under Users.
          </CardContent>
        </Card>
      ) : (
        <>
          <RoleFeatureList
            module={roleModule}
            moduleStates={moduleStates}
            featureStates={featureStates}
            onSetModuleState={setModuleState}
            onSetFeatureState={setFeatureState}
            saving={saving}
          />
          <UserOverridePanel role={role} module={roleModule} />
        </>
      )}
    </div>
  )
}

// --- All Features view (every module/category, flat, searchable) ------------

function AllFeaturesView({ onBack }: { onBack: () => void }) {
  const { refresh } = useModuleToggles()
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleAccessState>>({})
  const [featureStates, setFeatureStates] = useState<Record<string, ModuleAccessState>>({})
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<TerminalStateResponse>("/terminal/state")
      .then((data) => {
        setModuleStates(data.moduleStates ?? {})
        setFeatureStates(data.featureStates ?? {})
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const persist = async (nextModules: Record<string, ModuleAccessState>, nextFeatures: Record<string, ModuleAccessState>) => {
    setSaving(true)
    setError(null)
    try {
      await apiFetch("/terminal/toggles", {
        method: "PUT",
        body: JSON.stringify({ moduleStates: nextModules, featureStates: nextFeatures }),
      })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const setModuleState = (key: string, state: ModuleAccessState) => {
    const next = { ...moduleStates, [key]: state }
    setModuleStates(next)
    void persist(next, featureStates)
  }

  const setFeatureState = (moduleKey: string, featureKey: string, state: ModuleAccessState) => {
    const id = `${moduleKey}:${featureKey}`
    const next = { ...featureStates, [id]: state }
    setFeatureStates(next)
    void persist(moduleStates, next)
  }

  const query = search.trim().toLowerCase()

  const filteredModules = useMemo(() => {
    if (!query) return TERMINAL_MODULES
    return TERMINAL_MODULES.map((mod) => {
      const moduleMatches = mod.label.toLowerCase().includes(query)
      const matchingFeatures = mod.features.filter((f) => f.label.toLowerCase().includes(query))
      if (moduleMatches) return mod
      if (matchingFeatures.length > 0) return { ...mod, features: matchingFeatures }
      return null
    }).filter((mod): mod is TerminalModuleDef => mod !== null)
  }, [query])

  // Auto-expand modules with a matching feature while searching, so results are visible.
  useEffect(() => {
    if (!query) return
    setExpanded((prev) => {
      const next = { ...prev }
      filteredModules.forEach((mod) => {
        if (mod.features.length > 0) next[mod.key] = true
      })
      return next
    })
  }, [query, filteredModules])

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" /> All roles
      </Button>

      <div>
        <h2 className="text-lg font-semibold text-foreground">All Features</h2>
        <p className="text-sm text-muted-foreground">Every dashboard and feature across every category. Hide or show anything from here.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search dashboards or features..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Loading features
        </div>
      ) : filteredModules.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No dashboards or features match &quot;{search}&quot;.</p>
      ) : (
        <div className="space-y-2">
          {filteredModules.map((mod) => {
            const state = moduleStates[mod.key] ?? "open"
            const isExpanded = expanded[mod.key] ?? false
            return (
              <Card key={mod.key}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-left"
                    onClick={() => setExpanded((prev) => ({ ...prev, [mod.key]: !isExpanded }))}
                    disabled={mod.features.length === 0}
                  >
                    {mod.features.length > 0 ? (
                      isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                    ) : (
                      <span className="w-4" />
                    )}
                    <span className="font-medium">{mod.label}</span>
                  </button>
                  <StateSelector value={state} onChange={(v) => setModuleState(mod.key, v)} disabled={saving} />
                </div>
                {isExpanded && mod.features.length > 0 && (
                  <CardContent className="space-y-2 border-t pt-3">
                    {mod.features.map((feature) => {
                      const featureState = featureStates[`${mod.key}:${feature.key}`] ?? "open"
                      return (
                        <div key={feature.key} className="flex flex-wrap items-center justify-between gap-2 pl-6">
                          <span className="text-sm text-muted-foreground">{feature.label}</span>
                          <StateSelector
                            value={featureState}
                            disabled={saving || state !== "open"}
                            onChange={(v) => setFeatureState(mod.key, feature.key, v)}
                          />
                        </div>
                      )
                    })}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TerminalPage() {
  const [view, setView] = useState<"roles" | "all-features">("roles")
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  return (
    <DashboardRouteGuard allowedRoles={["super-admin"]}>
      <DashboardHeader
        title="Terminal"
        description="Pick a role to see how many people have it, manage its features, or override a feature for one person."
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SquareTerminal className="h-4 w-4" />
          Switchboard
        </div>
        {view === "roles" && !selectedRole && (
          <Button size="default" className="gap-2" onClick={() => setView("all-features")}>
            <LayoutGrid className="h-4 w-4" />
            All Features
          </Button>
        )}
      </div>
      {view === "roles" && !selectedRole && (
        <button
          type="button"
          onClick={() => setView("all-features")}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-left transition hover:border-primary hover:bg-primary/10"
        >
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">All Features</p>
              <p className="text-sm text-muted-foreground">Every category in one flat list, searchable — hide, lock, or open anything from here.</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      <div className="mt-4">
        {view === "all-features" ? (
          <AllFeaturesView onBack={() => setView("roles")} />
        ) : selectedRole ? (
          <RoleDetailView role={selectedRole} onBack={() => setSelectedRole(null)} />
        ) : (
          <RoleListView onSelectRole={setSelectedRole} />
        )}
      </div>
    </DashboardRouteGuard>
  )
}

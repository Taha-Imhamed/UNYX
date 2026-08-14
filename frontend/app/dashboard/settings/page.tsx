"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { MfaSettingsCard } from "@/components/mfa-settings-card"
import { AppearanceSettingsCard } from "@/components/theme/appearance-settings-card"
import {
  Shield,
  Bell,
  Lock,
  Camera,
  Trash,
  UserCog,
  Palette,
  Mail,
  GraduationCap,
  MessageSquare,
  Wallet,
  Ticket,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  FlaskConical,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserNotification } from "@shared/types"
import { createCoupon } from "@/lib/finance-api"
import { useSuperAdminGifEnabled } from "@/lib/super-admin-gif"

const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"])

const SECTION_TINTS = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
} as const

function SectionIcon({ icon: Icon, tint }: { icon: typeof Shield; tint: keyof typeof SECTION_TINTS }) {
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${SECTION_TINTS[tint]}`}>
      <Icon className="h-4.5 w-4.5" />
    </span>
  )
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { user, isLoading, isAdmin, updateProfile, updatePassword, fetchUserNotifications } = useAuth()
  const [gifEnabled, setGifEnabled] = useSuperAdminGifEnabled()

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [couponPercent, setCouponPercent] = useState(25)
  const [isCouponSaving, setIsCouponSaving] = useState(false)
  const [notificationFeed, setNotificationFeed] = useState<UserNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const userInitials = useMemo(() => {
    if (!user) {
      return "AD"
    }
    const identifier = user.username || user.email || "Admin"
    const parts = identifier.trim().split(/[\s._-]+/)
    const first = parts[0]?.charAt(0) ?? ""
    const second = parts[1]?.charAt(0) ?? (user.email?.charAt(0) ?? "")
    const initials = `${first}${second}`.toUpperCase()
    return initials || "AD"
  }, [user])

  useEffect(() => {
    setAvatarPreview(user?.avatarUrl ?? null)
    setAvatarDataUrl(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [user?.avatarUrl])

  useEffect(() => {
    setMfaEnabled(Boolean(user?.mfaEnabled))
  }, [user?.mfaEnabled])

  useEffect(() => {
    let active = true

    const loadNotifications = async () => {
      if (!user) {
        setNotificationFeed([])
        return
      }

      setNotificationsLoading(true)

      try {
        const entries = await fetchUserNotifications(user.id)
        if (!active) {
          return
        }
        setNotificationFeed(entries)
      } catch (error) {
        console.error("Notification load failed", error)
        if (active) {
          toast({
            variant: "destructive",
            title: "Unable to load notifications",
            description: "Security alerts could not be retrieved.",
          })
        }
      } finally {
        if (active) {
          setNotificationsLoading(false)
        }
      }
    }

    loadNotifications()

    return () => {
      active = false
    }
  }, [fetchUserNotifications, toast, user])

  const handleAvatarPick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      toast({
        variant: "destructive",
        title: "Unsupported image type",
        description: "Choose a PNG, JPG, or WebP image.",
      })
      event.target.value = ""
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast({
        variant: "destructive",
        title: "Image too large",
        description: "Choose an image under 2MB.",
      })
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result)
        setAvatarDataUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarRemove = () => {
    setAvatarPreview(null)
    setAvatarDataUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCouponSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!couponCode.trim()) {
      toast({
        variant: "destructive",
        title: "Coupon code required",
        description: "Enter a code before saving.",
      })
      return
    }

    setIsCouponSaving(true)

    try {
      // Real API call to persist coupon settings
      await createCoupon({ code: couponCode.trim().toUpperCase(), percent: couponPercent })

      toast({
        title: "Coupon ready",
        description: `${couponCode.toUpperCase()} configured at ${couponPercent}%`,
      })

      setCouponCode("")
      setCouponPercent(25)
    } catch (error) {
      console.error("Coupon setup failed", error)
      toast({
        variant: "destructive",
        title: "Unable to save coupon",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsCouponSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Settings" description="Configure your account, appearance, and platform preferences" />

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {isAdmin && (
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Admin settings</p>
              <p className="text-sm text-muted-foreground">These settings affect the entire platform. Changes here apply to all users.</p>
            </div>
          </div>
        )}

        <div className="grid gap-5">
          {isAdmin && (
            <Card className="overflow-hidden border-border bg-card">
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <SectionIcon icon={UserCog} tint="blue" />
                  User Management Lives Here
                </CardTitle>
                <CardDescription>Create, edit, reset passwords, and assign roles from the User Management page.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  We relocated account administration out of Settings. Use the dedicated User Management workspace instead.
                </p>
                <Button asChild className="gap-2">
                  <Link href="/dashboard/users">
                    <UserCog className="h-4 w-4" />
                    Go to User Management
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Account Settings */}
          <Card className="overflow-hidden border-border bg-card">
            <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-blue-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <SectionIcon icon={Lock} tint="cyan" />
                Account Settings
              </CardTitle>
              <CardDescription>Manage your profile, login, and password</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault()

                  if (!user) {
                    return
                  }

                  if (isSubmitting) {
                    return
                  }

                  setIsSubmitting(true)

                  const form = event.currentTarget
                  const formData = new FormData(form)
                  const username = (formData.get("username") as string | null)?.trim() ?? ""
                  const email = (formData.get("email") as string | null)?.trim() ?? ""
                  const currentPassword = (formData.get("current-password") as string | null) ?? ""
                  const newPassword = (formData.get("new-password") as string | null) ?? ""
                  const confirmPassword = (formData.get("confirm-password") as string | null) ?? ""

                  const usernameChanged = !!username && username !== user.username
                  const emailChanged = !!email && email !== user.email
                  const avatarChanged = avatarDataUrl !== undefined
                  const hasProfileTextChange = usernameChanged || emailChanged
                  const hasProfileChange = hasProfileTextChange || avatarChanged
                  const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmPassword)

                  if (!hasProfileChange && !wantsPasswordChange) {
                    toast({
                      title: "Nothing to update",
                      description: "No changes detected in your account settings.",
                    })
                    setIsSubmitting(false)
                    return
                  }

                  if (wantsPasswordChange) {
                    if (!currentPassword) {
                      toast({
                        variant: "destructive",
                        title: "Current password required",
                        description: "Enter your existing password before setting a new one.",
                      })
                      setIsSubmitting(false)
                      return
                    }

                    if (!newPassword || !confirmPassword) {
                      toast({
                        variant: "destructive",
                        title: "New password required",
                        description: "Enter and confirm your new password.",
                      })
                      setIsSubmitting(false)
                      return
                    }

                    if (newPassword !== confirmPassword) {
                      toast({
                        variant: "destructive",
                        title: "Passwords do not match",
                        description: "Make sure the new password and confirmation match exactly.",
                      })
                      setIsSubmitting(false)
                      return
                    }

                    if (newPassword.length < 4) {
                      toast({
                        variant: "destructive",
                        title: "New password too short",
                        description: "Use at least 4 characters for your new password.",
                      })
                      setIsSubmitting(false)
                      return
                    }
                  }

                  const notifications: string[] = []

                  if (hasProfileChange) {
                    const result = await updateProfile({
                      userId: user.id,
                      username: usernameChanged ? username : undefined,
                      email: emailChanged ? email : undefined,
                      avatarDataUrl: avatarChanged ? avatarDataUrl ?? null : undefined,
                    })

                    if (!result.success) {
                      toast({
                        variant: "destructive",
                        title: "Profile update failed",
                        description: result.error,
                      })
                      setIsSubmitting(false)
                      return
                    }

                    if (hasProfileTextChange) {
                      notifications.push("Profile details saved")
                    }

                    if (avatarChanged) {
                      notifications.push("Profile photo updated")
                    }

                    if (result.data) {
                      setAvatarPreview(result.data.avatarUrl ?? null)
                      setAvatarDataUrl(undefined)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }
                  }

                  if (wantsPasswordChange) {
                    const result = await updatePassword({ userId: user.id, currentPassword, newPassword })

                    if (!result.success) {
                      toast({
                        variant: "destructive",
                        title: "Password update failed",
                        description: result.error,
                      })
                      setIsSubmitting(false)
                      return
                    }

                    notifications.push(result.message ?? "Password updated")

                    form
                      .querySelectorAll<HTMLInputElement>('input[type="password"]')
                      .forEach((input) => {
                        input.value = ""
                      })
                  }

                  toast({
                    title: "Account updated",
                    description: notifications.join(" • ") || "Your account settings are up to date.",
                  })

                  setIsSubmitting(false)
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  <div className="col-span-2 flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-border/60">
                      <AvatarImage src={avatarPreview ?? undefined} alt={`${user?.username ?? "User"} avatar`} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleAvatarPick}>
                          <Camera className="h-4 w-4" />
                          Change Photo
                        </Button>
                        {avatarPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={handleAvatarRemove}
                          >
                            <Trash className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG, or WebP up to 2MB.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      defaultValue={user?.username}
                      className="bg-background border-border"
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      defaultValue={user?.email}
                      className="bg-background border-border"
                      autoComplete="email"
                      type="email"
                    />
                  </div>
                </div>
                <Separator className="bg-border" />
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  Change password
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    name="current-password"
                    type="password"
                    className="bg-background border-border"
                    autoComplete="current-password"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      name="new-password"
                      type="password"
                      className="bg-background border-border"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      className="bg-background border-border"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Leave password fields blank to keep your current password.</p>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? "Saving..." : "Update Account"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <AppearanceSettingsCard />

          {user?.role === "super-admin" && (
            <Card className="overflow-hidden border-border bg-card">
              <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <SectionIcon icon={Sparkles} tint="violet" />
                  Profile Effect
                </CardTitle>
                <CardDescription>Show an animated effect behind your sidebar avatar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <p className="font-medium text-foreground">Avatar animation</p>
                    <p className="text-sm text-muted-foreground">Off by default</p>
                  </div>
                  <Switch checked={gifEnabled} onCheckedChange={setGifEnabled} />
                </div>
              </CardContent>
            </Card>
          )}

          {user && <MfaSettingsCard userId={user.id} mfaEnabled={mfaEnabled} onChange={setMfaEnabled} />}

          {/* Notification Settings */}
          <Card className="overflow-hidden border-border bg-card">
            <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <SectionIcon icon={Bell} tint="amber" />
                Notifications
              </CardTitle>
              <CardDescription>Choose what you get notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { icon: Mail, tint: "blue" as const, title: "Email Notifications", desc: "Receive email alerts for important events", defaultChecked: true },
                { icon: GraduationCap, tint: "emerald" as const, title: "New Student Alerts", desc: "Get notified when new students enroll", defaultChecked: true },
                { icon: MessageSquare, tint: "violet" as const, title: "Feedback Notifications", desc: "Alert when new feedback is submitted", defaultChecked: true },
                { icon: Wallet, tint: "amber" as const, title: "Financial Alerts", desc: "Notify on large transactions", defaultChecked: false },
              ].map((item, idx, arr) => (
                <div key={item.title}>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <SectionIcon icon={item.icon} tint={item.tint} />
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                  {idx < arr.length - 1 && <Separator className="bg-border" />}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border bg-card">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <SectionIcon icon={ShieldCheck} tint="emerald" />
                Security Notifications
              </CardTitle>
              <CardDescription>In-app alerts that inform users about sensitive account changes</CardDescription>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                  Loading security alerts...
                </div>
              ) : notificationFeed.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
                  <ShieldCheck className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No security notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notificationFeed.map((notification) => {
                    const timestamp = new Date(notification.createdAt)
                    return (
                      <div key={notification.id} className="rounded-lg border border-border/60 bg-secondary/20 p-3 transition-colors hover:bg-secondary/30">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {Number.isNaN(timestamp.getTime())
                              ? "Just now"
                              : timestamp.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Actor: {notification.actor ?? "system"}</span>
                          <Badge variant={notification.read ? "secondary" : "default"} className="text-[10px]">
                            {notification.read ? "Read" : "Unread"}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="overflow-hidden border-border bg-card">
              <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 to-pink-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <SectionIcon icon={Ticket} tint="violet" />
                  Coupon Management
                </CardTitle>
                <CardDescription>Define new discount codes and assign percentage cuts</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCouponSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coupon-code">Coupon Code</Label>
                      <Input
                        id="coupon-code"
                        placeholder=""
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value)}
                        className="uppercase"
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">Codes are stored uppercase when saved.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coupon-percent">Discount Percent</Label>
                      <Input
                        id="coupon-percent"
                        type="number"
                        min={1}
                        max={100}
                        value={couponPercent}
                        onChange={(event) => setCouponPercent(Number(event.target.value))}
                        className="bg-background border-border"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[10, 25, 50, 75].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCouponPercent(preset)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                              couponPercent === preset
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                            }`}
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={isCouponSaving} className="gap-2">
                    <Ticket className="h-4 w-4" />
                    {isCouponSaving ? "Saving..." : "Save Coupon"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card className="overflow-hidden border-destructive/30 bg-card">
              <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-red-600" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <SectionIcon icon={ShieldAlert} tint="rose" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible platform actions — use with caution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Maintenance mode &amp; feature toggles</p>
                    <p className="text-xs text-muted-foreground">Lock or hide dashboards platform-wide from the Terminal.</p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Link href="/dashboard/terminal">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Open Terminal
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {user?.role === "super-admin" && (
            <Card className="overflow-hidden border-border bg-card">
              <div className="h-1 w-full bg-gradient-to-r from-sky-500 to-indigo-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <SectionIcon icon={FlaskConical} tint="blue" />
                  System Test
                </CardTitle>
                <CardDescription>Run every backend and database connection check, one by one or all at once</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  See live pass/fail status and HTTP-style codes for the database, tables, and platform integrations.
                </p>
                <Button asChild className="gap-2">
                  <Link href="/dashboard/system-test">
                    <FlaskConical className="h-4 w-4" />
                    Open Test
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}

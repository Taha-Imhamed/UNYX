"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useStudentProfile } from "@/hooks/use-student-portal"
import { updateStudentSelf } from "@/lib/students-api"
import { MfaSettingsCard } from "@/components/mfa-settings-card"

export default function StudentSettingsPage() {
  const { user, updateProfile, updatePassword, isLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const { profile, reload: reloadProfile } = useStudentProfile()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  const [address, setAddress] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [program, setProgram] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [savingNotifications, setSavingNotifications] = useState(false)

  useEffect(() => {
    if (!user) return
    setUsername(user.username ?? "")
    setEmail(user.email ?? "")
    setMfaEnabled(Boolean(user.mfaEnabled))
  }, [user])

  useEffect(() => {
    if (!profile) return
    setFirstName(profile.firstName ?? "")
    setLastName(profile.lastName ?? "")
    setAddress(profile.address ?? "")
    setPhone(profile.phone ?? "")
    setProgram(profile.program ?? "")
    setDateOfBirth(profile.dateOfBirth ?? "")
    const prefs = profile.notificationPreferences
    setEmailNotifications(prefs?.email ?? true)
    setSmsNotifications(prefs?.sms ?? false)
    setPushNotifications(prefs?.push ?? true)
  }, [profile])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Spinner className="h-5 w-5" />
      </div>
    )
  }

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (savingProfile) return

    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()

    if (!trimmedUsername || !trimmedEmail) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Username and email are required.",
      })
      return
    }

    setSavingProfile(true)
    try {
      const result = await updateProfile({
        userId: user.id,
        username: trimmedUsername !== user.username ? trimmedUsername : undefined,
        email: trimmedEmail !== user.email ? trimmedEmail : undefined,
      })

      if (!result.success) {
        toast({ variant: "destructive", title: "Could not update profile", description: result.error })
        return
      }

      toast({ title: "Profile updated", description: "Your changes have been saved." })
    } catch (err) {
      console.error("Profile update failed", err)
      toast({ variant: "destructive", title: "Update failed", description: "Please try again." })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePersonalSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile) {
      toast({ variant: "destructive", title: "Profile missing", description: "Unable to update profile details." })
      return
    }
    try {
      const updated = await updateStudentSelf({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        program: program.trim(),
        dateOfBirth: dateOfBirth,
      })
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("unyt_student_profile", JSON.stringify(updated))
          localStorage.setItem("ar_company_student_profile", JSON.stringify(updated))
        }
      } catch (error) {
        console.warn("Unable to cache updated profile", error)
      }
      reloadProfile?.()
      toast({ title: "Profile updated", description: "Your details were saved." })
      router.push("/student/profile")
    } catch (error) {
      console.error("Personal update failed", error)
      toast({ variant: "destructive", title: "Update failed", description: "Could not save your details." })
    }
  }

  const handleNotificationToggle = async (channel: "email" | "sms" | "push", value: boolean) => {
    if (channel === "email") setEmailNotifications(value)
    if (channel === "sms") setSmsNotifications(value)
    if (channel === "push") setPushNotifications(value)

    setSavingNotifications(true)
    try {
      await updateStudentSelf({
        notificationPreferences: {
          email: channel === "email" ? value : emailNotifications,
          sms: channel === "sms" ? value : smsNotifications,
          push: channel === "push" ? value : pushNotifications,
        },
      })
      reloadProfile?.()
    } catch (error) {
      console.error("Notification preference update failed", error)
      toast({ variant: "destructive", title: "Update failed", description: "Could not save notification preferences." })
      if (channel === "email") setEmailNotifications(!value)
      if (channel === "sms") setSmsNotifications(!value)
      if (channel === "push") setPushNotifications(!value)
    } finally {
      setSavingNotifications(false)
    }
  }

  const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{8,}$/

  const handlePasswordSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (savingPassword) return

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast({ variant: "destructive", title: "Missing fields", description: "Fill all password fields." })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords do not match", description: "Re-enter matching passwords." })
      return
    }

    if (!strongPasswordRegex.test(newPassword)) {
      toast({
        variant: "destructive",
        title: "Password too weak",
        description: "Use at least 8 characters, include a capital letter and a symbol.",
      })
      return
    }

    setSavingPassword(true)
    try {
      const result = await updatePassword({ userId: user.id, currentPassword, newPassword })
      if (!result.success) {
        toast({ variant: "destructive", title: "Unable to change password", description: result.error })
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({ title: "Password updated", description: "Your password has been changed." })
    } catch (err) {
      console.error("Password update failed", err)
      toast({ variant: "destructive", title: "Update failed", description: "Please try again." })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Account & Security</p>
        <h1 className="text-2xl font-semibold text-foreground">Student Settings</h1>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your account contact details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleProfileSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save changes"}</Button>
                <Button type="button" variant="outline" onClick={logout}>
                  Log out of this session
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password to secure your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handlePasswordSave}>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Separator className="my-2" />
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <MfaSettingsCard userId={user.id} mfaEnabled={mfaEnabled} onChange={setMfaEnabled} />

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Choose how you want to hear about grades, announcements, and account alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-xs text-muted-foreground">Grade postings, announcements, payment receipts.</p>
            </div>
            <Switch checked={emailNotifications} disabled={savingNotifications} onCheckedChange={(v) => handleNotificationToggle("email", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">SMS</p>
              <p className="text-xs text-muted-foreground">Time-sensitive alerts sent to your phone.</p>
            </div>
            <Switch checked={smsNotifications} disabled={savingNotifications} onCheckedChange={(v) => handleNotificationToggle("sms", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Push</p>
              <p className="text-xs text-muted-foreground">In-app and browser notifications.</p>
            </div>
            <Switch checked={pushNotifications} disabled={savingNotifications} onCheckedChange={(v) => handleNotificationToggle("push", v)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>These details stay on your profile until you edit them.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePersonalSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street and number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Input id="program" value={program} onChange={(e) => setProgram(e.target.value)} placeholder="Program" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
            </div>
            <Button type="submit">Save personal info</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

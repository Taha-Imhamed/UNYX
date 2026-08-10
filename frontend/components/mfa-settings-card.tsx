"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { disableMfa, startMfaSetup, verifyMfaSetup } from "@/lib/mfa-api"

export function MfaSettingsCard({
  userId,
  mfaEnabled,
  onChange,
}: {
  userId: string
  mfaEnabled: boolean
  onChange?: (enabled: boolean) => void
}) {
  const { toast } = useToast()
  const [step, setStep] = useState<"idle" | "setup">("idle")
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [isBusy, setIsBusy] = useState(false)

  const handleStart = async () => {
    setIsBusy(true)
    try {
      const result = await startMfaSetup(userId)
      setQrCodeDataUrl(result.qrCodeDataUrl)
      setSecret(result.secret)
      setStep("setup")
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to start MFA setup", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setIsBusy(false)
    }
  }

  const handleVerify = async () => {
    if (!code.trim()) return
    setIsBusy(true)
    try {
      await verifyMfaSetup(userId, code.trim())
      toast({ title: "MFA enabled", description: "Your account now requires an authenticator code at login." })
      setStep("idle")
      setCode("")
      setQrCodeDataUrl(null)
      setSecret(null)
      onChange?.(true)
    } catch (err) {
      toast({ variant: "destructive", title: "Invalid code", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setIsBusy(false)
    }
  }

  const handleDisable = async () => {
    setIsBusy(true)
    try {
      await disableMfa(userId)
      toast({ title: "MFA disabled" })
      onChange?.(false)
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to disable MFA", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>Require an authenticator app code in addition to your password at login.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mfaEnabled ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">2FA is currently enabled on your account.</p>
            <Button variant="destructive" size="sm" disabled={isBusy} onClick={handleDisable}>
              {isBusy ? <Spinner className="h-4 w-4" /> : "Disable 2FA"}
            </Button>
          </div>
        ) : step === "idle" ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">2FA is not enabled.</p>
            <Button size="sm" disabled={isBusy} onClick={handleStart}>
              {isBusy ? <Spinner className="h-4 w-4" /> : "Set up 2FA"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).</p>
            {qrCodeDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCodeDataUrl} alt="MFA QR code" className="h-40 w-40 rounded-lg border border-border bg-white p-2" />
            )}
            {secret && <p className="text-xs text-muted-foreground">Manual entry key: <span className="font-mono">{secret}</span></p>}
            <div className="space-y-2">
              <Label htmlFor="mfaVerifyCode">Enter the 6-digit code to confirm</Label>
              <Input id="mfaVerifyCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" inputMode="numeric" />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={isBusy || !code.trim()} onClick={handleVerify}>
                {isBusy ? <Spinner className="h-4 w-4" /> : "Confirm and enable"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setStep("idle"); setCode(""); setQrCodeDataUrl(null); setSecret(null) }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

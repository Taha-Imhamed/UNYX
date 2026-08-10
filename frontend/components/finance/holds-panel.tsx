"use client"

import { useState } from "react"
import { useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { RefreshCcw, ShieldOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { fetchFinancialHolds, releaseFinancialHold, syncFinancialHolds } from "@/lib/finance-api"
import type { FinancialHold } from "@shared/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function HoldsPanel() {
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const canManage = hasPermission("finance:manage")

  const [holds, setHolds] = useState<FinancialHold[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [releasingId, setReleasingId] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const data = await fetchFinancialHolds("active")
      setHolds(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load financial holds")
    }
  }

  useEffect(() => {
    setIsLoading(true)
    load().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await syncFinancialHolds()
      toast({ title: "Holds synced", description: `${result.created} created, ${result.released} released.` })
      await load()
    } catch (err) {
      toast({ variant: "destructive", title: "Sync failed", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setSyncing(false)
    }
  }

  const handleRelease = async (hold: FinancialHold) => {
    setReleasingId(hold.id)
    try {
      await releaseFinancialHold(hold.id)
      toast({ title: "Hold released", description: `${hold.studentName} can now register.` })
      await load()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to release", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setReleasingId(null)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Financial holds</CardTitle>
          <p className="text-sm text-muted-foreground">
            Students with an outstanding balance are already blocked from enrollment approval. This tracks that as a visible, releasable record.
          </p>
        </div>
        {canManage && (
          <Button size="sm" variant="outline" disabled={syncing} onClick={handleSync}>
            {syncing ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            Sync from balances
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Unable to load holds</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading holds
          </div>
        ) : holds.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No active holds. Click &quot;Sync from balances&quot; to generate holds for students with an outstanding balance.
          </p>
        ) : (
          <div className="space-y-2">
            {holds.map((hold) => (
              <div key={hold.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {hold.studentName} <span className="text-xs font-normal text-muted-foreground">({hold.studentDisplayId ?? hold.studentId})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{hold.reason} · held since {new Date(hold.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{currencyFormatter.format(hold.balanceAtHold)}</Badge>
                  {canManage && (
                    <Button size="sm" variant="outline" disabled={releasingId === hold.id} onClick={() => handleRelease(hold)}>
                      {releasingId === hold.id ? <Spinner className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                      Release
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

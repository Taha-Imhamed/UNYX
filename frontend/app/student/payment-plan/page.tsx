"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { fetchMyInstallmentPlans, requestInstallmentPlan } from "@/lib/finance-api"
import type { FinanceInstallmentPlan } from "@shared/types"
import { StudentFeatureGate } from "@/components/student-feature-gate"

export default function StudentPaymentPlanPage() {
  return (
    <StudentFeatureGate featureKey="payment-plan">
      <StudentPaymentPlanPageInner />
    </StudentFeatureGate>
  )
}

function StudentPaymentPlanPageInner() {
  const { toast } = useToast()
  const [totalAmount, setTotalAmount] = useState("")
  const [installmentCount, setInstallmentCount] = useState("3")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<FinanceInstallmentPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    fetchMyInstallmentPlans()
      .then((data) => setItems(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load your payment plans"))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    const amount = Number(totalAmount)
    const count = Number(installmentCount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Enter a valid amount" })
      return
    }
    setIsSubmitting(true)
    try {
      await requestInstallmentPlan({ totalAmount: amount, installmentCount: count, notes: notes.trim() || undefined })
      toast({ title: "Request submitted", description: "Finance will review and activate your plan." })
      setTotalAmount("")
      setNotes("")
      load()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to submit", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusLabel: Record<FinanceInstallmentPlan["status"], string> = {
    draft: "Pending review",
    active: "Active",
    completed: "Completed",
    defaulted: "Defaulted",
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Payment Plan</p>
        <h1 className="text-2xl font-bold text-foreground">Request an installment plan</h1>
        <p className="text-sm text-muted-foreground">Split your balance into monthly payments instead of paying it all at once.</p>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>New plan request</CardTitle>
          <CardDescription>Requests start as "Pending review" until finance activates them.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total amount</Label>
                <Input id="totalAmount" type="number" min="1" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="e.g. 1200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installmentCount">Number of installments</Label>
                <select
                  id="installmentCount"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                >
                  {[2, 3, 4, 6, 12].map((count) => (
                    <option key={count} value={count}>
                      {count} payments
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything finance should know about your situation" />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="h-4 w-4" /> : "Submit request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Your payment plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Loading
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!isLoading && !error && items.length === 0 && <p className="text-sm text-muted-foreground">No payment plans yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <Badge variant={item.status === "active" ? "default" : "outline"}>{statusLabel[item.status]}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                ${item.totalAmount.toFixed(2)} over {item.installmentCount} payments (${item.amountPerInstallment.toFixed(2)} each)
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Remaining: ${item.remainingBalance.toFixed(2)} • Next due {new Date(item.nextDueDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

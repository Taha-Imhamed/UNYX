"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { fetchMyHousing, fetchMyMealPlan } from "@/lib/campus-api"
import type { HousingAssignment, MealPlan } from "@shared/types"

export default function HousingPage() {
  const [housing, setHousing] = useState<HousingAssignment[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([fetchMyHousing(controller.signal), fetchMyMealPlan(controller.signal)])
      .then(([housingData, mealPlanData]) => {
        setHousing(housingData)
        setMealPlans(mealPlanData)
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load housing details")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Housing & Meal Plan</p>
        <h1 className="text-2xl font-bold text-foreground">Where you live and dine on campus</h1>
        <p className="text-sm text-muted-foreground">Your current room assignment and meal plan balance.</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" /> Loading
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!isLoading && !error && (
        <>
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle>Housing assignment</CardTitle>
              <CardDescription>Your current dorm/room placement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {housing.length === 0 ? (
                <p className="text-sm text-muted-foreground">No housing assignment on file. Contact Student Affairs to request campus housing.</p>
              ) : (
                housing.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {assignment.buildingName} — Room {assignment.roomNumber}
                        {assignment.bedNumber ? ` (Bed ${assignment.bedNumber})` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Since {new Date(assignment.startDate).toLocaleDateString()}
                        {assignment.endDate ? ` — ${new Date(assignment.endDate).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{assignment.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle>Meal plan</CardTitle>
              <CardDescription>Your active meal plan and remaining balance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meal plan on file. Contact Student Affairs to enroll.</p>
              ) : (
                mealPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{plan.planName}</p>
                      <p className="text-xs text-muted-foreground">
                        Since {new Date(plan.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">${plan.balance.toFixed(2)}</p>
                      <Badge variant="outline">{plan.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

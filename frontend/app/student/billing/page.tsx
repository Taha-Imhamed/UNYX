"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { useStudentFinancials, useStudentEnrollments } from "@/hooks/use-student-portal"
import { fetchMySponsorships } from "@/lib/finance-api"
import { fetchMyScholarshipAwards } from "@/lib/admissions-api"
import type { FinanceSponsorship, ScholarshipAward } from "@shared/types"
import { StudentFeatureGate } from "@/components/student-feature-gate"

export default function StudentBillingPage() {
  const { financials, isLoading, error } = useStudentFinancials()
  const { enrollments } = useStudentEnrollments()
  const [sponsorships, setSponsorships] = useState<FinanceSponsorship[]>([])
  const [scholarships, setScholarships] = useState<ScholarshipAward[]>([])
  const [aidLoading, setAidLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([fetchMySponsorships(controller.signal), fetchMyScholarshipAwards(controller.signal)])
      .then(([sponsorshipData, scholarshipData]) => {
        setSponsorships(sponsorshipData)
        setScholarships(scholarshipData)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSponsorships([])
          setScholarships([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAidLoading(false)
      })
    return () => controller.abort()
  }, [])

  const totalAidValue = useMemo(() => {
    const sponsorshipTotal = sponsorships.reduce((sum, s) => sum + (s.coverageValue ?? 0), 0)
    const scholarshipTotal = scholarships
      .filter((s) => s.status === "awarded")
      .reduce((sum, s) => sum + (s.amount ?? 0), 0)
    return sponsorshipTotal + scholarshipTotal
  }, [sponsorships, scholarships])

  const outstandingCourses = useMemo(
    () => enrollments.filter((enr) => (enr.status === "active" || enr.status === "pending") && (enr.price ?? 0) > 0),
    [enrollments],
  )

  if (isLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="h-4 w-4" /> Loading billing</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load billing</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Billing</p>
          <h1 className="text-2xl font-bold text-foreground">Account balance & payments</h1>
          <p className="text-sm text-muted-foreground">Charges and payments are synced from the finance module.</p>
        </div>
        <Badge variant="outline" className="border-border text-foreground">
          Balance: ${financials?.balance?.toFixed(2) ?? "0.00"}
        </Badge>
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="py-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">Summary</p>
          <div className="text-sm text-muted-foreground">
            <div>Last updated: {financials?.updatedAt ? new Date(financials.updatedAt).toLocaleString() : "—"}</div>
            <div>Payment status: {financials?.paymentStatus ?? "—"}</div>
          </div>
        </CardContent>
      </Card>

      <StudentFeatureGate featureKey="financial-aid-status">
        <Card className="border border-border bg-card">
          <CardContent className="py-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Financial aid & scholarships</p>
              {totalAidValue > 0 && (
                <Badge variant="secondary" className="text-foreground border-border">Total aid: ${totalAidValue.toFixed(2)}</Badge>
              )}
            </div>
            {aidLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading
              </div>
            ) : sponsorships.length === 0 && scholarships.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sponsorships or scholarships on file. Contact Financial Aid to apply.</p>
            ) : (
              <div className="divide-y divide-border text-sm">
                {sponsorships.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{s.sponsorName}</p>
                      <p className="text-xs text-muted-foreground">
                        Sponsorship • {s.coverageType ?? "coverage"} • {s.status ?? "active"}
                      </p>
                    </div>
                    <Badge variant="outline">${(s.coverageValue ?? 0).toFixed(2)}</Badge>
                  </div>
                ))}
                {scholarships.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{s.scholarshipName}</p>
                      <p className="text-xs text-muted-foreground">Scholarship • {s.status ?? "pending"}</p>
                    </div>
                    <Badge variant="outline">${(s.amount ?? 0).toFixed(2)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </StudentFeatureGate>

      <Card className="border border-border bg-card">
        <CardContent className="py-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">Outstanding courses</p>
          {outstandingCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outstanding course charges.</p>
          ) : (
            <div className="divide-y divide-border text-sm">
              {outstandingCourses.map((course) => (
                <div key={course.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{course.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">{course.courseCode ?? course.displayId ?? course.courseId}</p>
                  </div>
                  <Badge variant="secondary" className="text-foreground border-border">${(course.price ?? 0).toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

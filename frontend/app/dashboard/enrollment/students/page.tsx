"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpRight, Check, Users, Wallet } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { EnrollmentTabNav } from "@/components/enrollment/EnrollmentTabNav"
import { currencyFormatter, getInitials, type StudentFinancialRow } from "@/components/enrollment/shared"
import { useStudents } from "@/hooks/enrollment/use-students"
import { useEnrollments } from "@/hooks/enrollment/use-enrollments"
import { useAuth } from "@/lib/auth-context"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"

export default function EnrollmentStudentsPage() {
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })

  const canManageEnrollment = hasPermission("enrollment:manage") && user?.role !== "professor"
  const canViewEnrollment = canManageEnrollment || hasPermission("enrollment:view") || user?.role === "professor"
  const enabled = !authLoading && canViewEnrollment

  const role = user?.role
  const hideTuition = role === "professor" || role === "student"

  const { students, isLoading: studentsLoading, error: studentsError, refresh: refreshStudents } = useStudents({
    enabled,
    refreshKey: refreshVersion,
  })

  const { enrollments, refresh: refreshEnrollmentList } = useEnrollments({ enabled, refreshKey: refreshVersion })

  const [isRefreshing, setIsRefreshing] = useState(false)

  const studentFinancials = useMemo(() => {
    const map = new Map<string, StudentFinancialRow>()

    students.forEach((student) => {
      map.set(student.id, {
        id: student.id,
        displayId: student.displayId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        photo: student.photo || "/placeholder.svg",
        balance: Number(student.balance ?? 0),
        totalEnrollments: 0,
        activeEnrollments: 0,
        tuitionTotal: 0,
      })
    })

    enrollments.forEach((record) => {
      const current = map.get(record.student.id) ?? (() => {
        const fallback: StudentFinancialRow = {
          id: record.student.id,
          displayId: record.student.displayId,
          firstName: record.student.firstName,
          lastName: record.student.lastName,
          email: record.student.email,
          photo: record.student.photo || "/placeholder.svg",
          balance: Number(record.student.balance ?? 0),
          totalEnrollments: 0,
          activeEnrollments: 0,
          tuitionTotal: 0,
        }
        map.set(record.student.id, fallback)
        return fallback
      })()

      if (record.status !== "cancelled") {
        current.totalEnrollments += 1
        current.tuitionTotal += record.price
      }
      if (record.status === "active") {
        current.activeEnrollments += 1
      }
      if (typeof record.student.balance === "number") {
        current.balance = Number(record.student.balance)
      }
    })

    const rows = Array.from(map.values()).sort((a, b) => {
      if (b.balance !== a.balance) {
        return b.balance - a.balance
      }
      return b.tuitionTotal - a.tuitionTotal
    })

    const outstandingTotal = rows.reduce((sum, row) => (row.balance > 0 ? sum + row.balance : sum), 0)
    const outstandingCount = rows.reduce((count, row) => (row.balance > 0 ? count + 1 : count), 0)
    const clearedCount = rows.reduce((count, row) => (row.balance <= 0 ? count + 1 : count), 0)

    return { rows, outstandingTotal, outstandingCount, clearedCount }
  }, [students, enrollments])

  const { rows: studentFinanceRows, outstandingTotal, outstandingCount, clearedCount } = studentFinancials

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refreshStudents(), refreshEnrollmentList()])
    } catch {
      // hook records its own error state
    } finally {
      setIsRefreshing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!canViewEnrollment) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>You need enrollment view or manage permissions to access this area.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Student Enrollment Manager" description="Search students and manage their assigned courses" />
      <div className="flex-1 p-6 pt-4 md:pt-6">
        <div className="flex h-full flex-col gap-6">
          <EnrollmentTabNav onRefresh={handleRefresh} isRefreshing={isRefreshing} />

          <div className="flex flex-1 flex-col gap-6">
            {studentsError ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to load data</AlertTitle>
                <AlertDescription>{studentsError}</AlertDescription>
              </Alert>
            ) : null}

            {hideTuition ? (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Student roster</CardTitle>
                  <p className="text-sm text-muted-foreground">View enrolled students without financial details.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studentFinanceRows.length === 0 ? (
                    <div className="rounded-xl border border-sky-100 bg-sky-50/60 py-12 text-center text-sm text-muted-foreground">
                      {studentsLoading ? "Loading students…" : "Student records will appear here once data loads."}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/70">
                      <div className="overflow-x-auto">
                        <Table className="min-w-[560px]">
                          <TableHeader>
                            <TableRow className="bg-sky-100/80">
                              <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide">Student</TableHead>
                              <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide">Enrollments</TableHead>
                              <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide">Active</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentFinanceRows.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={row.photo || "/placeholder.svg"} alt={row.firstName} />
                                      <AvatarFallback>{getInitials(row.firstName, row.lastName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-foreground">
                                        {row.firstName} {row.lastName}
                                      </span>
                                      <span className="text-xs text-muted-foreground">{row.email}</span>
                                      <span className="text-xs text-muted-foreground">{row.displayId}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                  <div className="flex flex-col text-sm">
                                    <span className="text-foreground">{row.totalEnrollments}</span>
                                    <span className="text-xs text-muted-foreground">Total</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                  <div className="flex flex-col text-sm">
                                    <span className="text-foreground">{row.activeEnrollments}</span>
                                    <span className="text-xs text-muted-foreground">Active</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-border bg-card">
                    <CardContent className="flex items-center justify-between gap-4 p-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                        <p className="text-3xl font-semibold text-foreground">
                          {currencyFormatter.format(outstandingTotal)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                        <Wallet className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="flex items-center justify-between gap-4 p-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Students With Balance</p>
                        <p className="text-3xl font-semibold text-foreground">{outstandingCount}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                        <Users className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="flex items-center justify-between gap-4 p-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Cleared Accounts</p>
                        <p className="text-3xl font-semibold text-foreground">{clearedCount}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                        <Check className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Student financial overview</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Track overall balances and enrollment load to understand each student’s payment status.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {studentFinanceRows.length === 0 ? (
                      <div className="rounded-xl border border-border/70 py-12 text-center text-sm text-muted-foreground">
                        {studentsLoading ? "Loading students…" : "Student records will appear here once data loads."}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-sky-100 bg-white/90">
                        <div className="overflow-x-auto">
                          <Table className="min-w-[720px]">
                            <TableHeader>
                              <TableRow className="bg-sky-100/80">
                                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide">Student</TableHead>
                                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide">Enrollments</TableHead>
                                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide">Active</TableHead>
                                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide">Total Tuition</TableHead>
                                <TableHead className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide">Balance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentFinanceRows.map((row) => (
                                <TableRow key={row.id}>
                                  <TableCell className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage src={row.photo || "/placeholder.svg"} alt={row.firstName} />
                                        <AvatarFallback>{getInitials(row.firstName, row.lastName)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span className="font-medium text-foreground">
                                          {row.firstName} {row.lastName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{row.email}</span>
                                        <span className="text-xs text-muted-foreground">{row.displayId}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-6 py-4">
                                    <div className="flex flex-col text-sm">
                                      <span className="text-foreground">{row.totalEnrollments}</span>
                                      <span className="text-xs text-muted-foreground">Total</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-6 py-4">
                                    <div className="flex flex-col text-sm">
                                      <span className="text-foreground">{row.activeEnrollments}</span>
                                      <span className="text-xs text-muted-foreground">Active</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-6 py-4">
                                    <span className="text-sm font-medium text-foreground">
                                      {currencyFormatter.format(row.tuitionTotal)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-sm font-semibold text-foreground">
                                        {currencyFormatter.format(row.balance)}
                                      </span>
                                      <Badge variant={row.balance > 0 ? "destructive" : row.balance < 0 ? "secondary" : "default"}>
                                        {row.balance > 0 ? "Balance due" : row.balance < 0 ? "In credit" : "Settled"}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Student directory</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Financial summaries appear here, while detailed profile management stays in the dedicated students workspace.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Removing an enrollment only withdraws the selected course. The student record remains available for
                  future enrollment or payment updates.
                </p>
                <Button asChild className="w-fit gap-2">
                  <Link href="/dashboard/students">
                    <ArrowUpRight className="h-4 w-4" />
                    Open Students Workspace
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

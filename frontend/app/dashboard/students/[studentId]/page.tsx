"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { GradeBreakdown } from "@/components/student/grade-breakdown"
import { useToast } from "@/hooks/use-toast"
import { fetchStudent, fetchStudentFinancials, submitStudentPayment, updateEnrollmentRequest, updateEnrollmentGrades } from "@/lib/enrollment-api"
import { fetchStudentGrades } from "@/lib/students-api"
import type { Enrollment, EnrollmentStatus, EnrollmentWithCourse, PaymentMethod, PaymentTransaction, Student, StudentBalanceSummary } from "@shared/types"
import Link from "next/link"
import { ArrowLeft, CalendarRange, GraduationCap, Mail, MapPin, Phone, Receipt, TrendingUp } from "lucide-react"

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "transfer", label: "Bank Transfer" },
]

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })

function getInitials(student?: Pick<Student, "firstName" | "lastName">) {
  return `${student?.firstName.charAt(0) ?? ""}${student?.lastName.charAt(0) ?? ""}`.toUpperCase()
}

function normaliseStatus(status: Student["status"]) {
  switch (status) {
    case "active":
      return { label: "Active", badge: "default" as const }
    case "graduated":
      return { label: "Graduated", badge: "secondary" as const }
    case "inactive":
    default:
      return { label: "Inactive", badge: "outline" as const }
  }
}

const enrollmentBadge: Record<EnrollmentStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  pendingSupervisorApproval: { label: "Pending Supervisor Approval", variant: "outline" },
  pendingAdvisorApproval: { label: "Pending Advisor Approval", variant: "outline" },
  pending_approval: { label: "Pending Approval", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
  dropped: { label: "Dropped", variant: "destructive" },
  waitlisted: { label: "Waitlisted", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const studentIdParam = params?.studentId
  const studentId = Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam

  const [student, setStudent] = useState<Student | null>(null)
  const [balance, setBalance] = useState<StudentBalanceSummary | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(() => new Set(["overview"]))
  const [grades, setGrades] = useState<EnrollmentWithCourse[]>([])
  const [gradesLoading, setGradesLoading] = useState(false)
  const [gradesError, setGradesError] = useState<string | null>(null)
  const [gradeSavingId, setGradeSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) {
      return
    }
    const resolvedStudentId = studentId
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [studentRecord, financialSnapshot] = await Promise.all([
          fetchStudent(resolvedStudentId, controller.signal),
          fetchStudentFinancials(resolvedStudentId, controller.signal),
        ])
        if (controller.signal.aborted) return
        setStudent(studentRecord)
        setBalance({
          studentId: financialSnapshot.studentId,
          balance: financialSnapshot.balance,
          updatedAt: financialSnapshot.updatedAt,
        })
        setEnrollments(financialSnapshot.enrollments)
        setTransactions(financialSnapshot.transactions)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to load student record.")
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => controller.abort()
  }, [studentId])

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [transactions],
  )

  const activeEnrollments = useMemo(() => enrollments.filter((item) => item.status === "active"), [enrollments])
  const completedEnrollments = useMemo(() => enrollments.filter((item) => item.status === "completed"), [enrollments])
  const outstandingBalance = balance?.balance ?? student?.balance ?? 0
  const totalPaid = useMemo(() => {
    return sortedTransactions
      .filter((transaction) => transaction.type === "credit")
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  }, [sortedTransactions])
  const lastPayment = sortedTransactions.find((transaction) => transaction.type === "credit")

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!studentId) return
    const form = new FormData(event.currentTarget)
    const amount = Number(form.get("amount"))
    const method = form.get("method") as PaymentMethod
    const note = (form.get("note") as string) || undefined

    if (!amount || Number.isNaN(amount)) {
      setPaymentError("Enter a valid amount")
      return
    }
    if (!method) {
      setPaymentError("Select a payment method")
      return
    }
    if (balance && amount > balance.balance) {
      setPaymentError("Payment exceeds outstanding balance")
      return
    }

    setPaymentSubmitting(true)
    setPaymentError(null)
    try {
      const response = await submitStudentPayment(studentId, { amount, method, note })

      setTransactions((prev) => [response.transaction, ...prev])
      setBalance((prev) =>
        prev
          ? { ...prev, balance: response.balance, updatedAt: response.updatedAt }
          : { studentId, balance: response.balance, updatedAt: response.updatedAt },
      )

      if (response.balance <= 0) {
        const updatedTimestamp = response.updatedAt
        setEnrollments((prev) =>
          prev.map((enrollment) =>
            enrollment.status === "pending"
              ? { ...enrollment, status: "active", updatedAt: updatedTimestamp }
              : enrollment,
          ),
        )
      }
      toast({ title: "Payment recorded" })
      event.currentTarget.reset()
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Unable to record payment")
    } finally {
      setPaymentSubmitting(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setLoadedTabs((prev) => {
      if (prev.has(value)) {
        return prev
      }
      const next = new Set(prev)
      next.add(value)
      return next
    })
  }

  const loadGrades = useCallback(
    async (signal?: AbortSignal) => {
      if (!studentId) return
      setGradesLoading(true)
      setGradesError(null)
      try {
        const items = await fetchStudentGrades(studentId, signal)
        setGrades(items)
      } catch (err) {
        if (!signal?.aborted) {
          setGradesError(err instanceof Error ? err.message : "Unable to load grades")
        }
      } finally {
        if (!signal?.aborted) {
          setGradesLoading(false)
        }
      }
    },
    [studentId],
  )

  useEffect(() => {
    if (!studentId || !loadedTabs.has("grades")) return undefined
    const controller = new AbortController()
    loadGrades(controller.signal)
    return () => controller.abort()
  }, [studentId, loadedTabs, loadGrades])

  const handleSaveGrade = async (
    enrollmentId: string,
    payload: Partial<
      Pick<
        Enrollment,
        | "gradeMidterm"
        | "gradeFinal"
        | "gradeProject"
        | "gradeParticipation"
        | "gradeTotal"
        | "grade"
        | "letterGrade"
        | "status"
      >
    >,
  ) => {
    setGradeSavingId(enrollmentId)
    setGradesError(null)
    try {
      await updateEnrollmentGrades(enrollmentId, payload)
      await loadGrades()
      toast({ title: "Grades updated" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update grades"
      setGradesError(message)
      toast({ title: "Update failed", description: message, variant: "destructive" })
    } finally {
      setGradeSavingId(null)
    }
  }

  if (!studentId) {
    return (
      <div className="flex h-full flex-col">
        <DashboardHeader title="Student not found" description="The requested student identifier is missing." />
        <div className="flex flex-1 items-center justify-center p-4">
          <Alert variant="destructive">
            <AlertTitle>Missing student identifier</AlertTitle>
            <AlertDescription>Return to the students list and pick a record.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Student profile" description="Detailed academic and financial view." />
      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Button
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_8px_24px_rgba(228,196,92,0.28)]"
            style={{ ['--btn-glow-color' as string]: 'var(--accent)' }}
            asChild
          >
            <Link href="/dashboard/students">
              <ArrowLeft className="h-4 w-4" /> Back to students
            </Link>
          </Button>
          {student && (
            <Badge variant={normaliseStatus(student.status).badge}>{normaliseStatus(student.status).label}</Badge>
          )}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load student</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading || !student ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <>
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={student.photo || "/placeholder.svg"} alt={`${student.firstName} ${student.lastName}`} />
                    <AvatarFallback>{getInitials(student)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {student.firstName} {student.lastName}
                    </h2>
                    <p className="text-sm text-muted-foreground">Student ID · {student.id}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{student.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{student.phone}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{student.address}</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Program · {student.program}</span>
                  <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Supervisor · {student.supervisorName ?? "Unassigned"}</span>
                  <span className="flex items-center gap-2"><CalendarRange className="h-4 w-4" />Enrolled {dateFormatter.format(new Date(student.enrollmentDate))}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Outstanding balance</p>
                  <p className="text-3xl font-semibold text-foreground">{currencyFormatter.format(outstandingBalance)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Updated {balance ? dateFormatter.format(new Date(balance.updatedAt)) : "recently"}</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Active courses</p>
                  <p className="text-3xl font-semibold text-foreground">{activeEnrollments.length}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{completedEnrollments.length} completed historically</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Lifetime tuition collected</p>
                  <p className="text-3xl font-semibold text-success">
                    {currencyFormatter.format(totalPaid)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last payment {lastPayment ? dateFormatter.format(new Date(lastPayment.createdAt)) : "N/A"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-4">
              <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-secondary/40 p-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Academic snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><span className="font-semibold text-foreground">Program:</span> {student.program}</p>
                      <p><span className="font-semibold text-foreground">Supervisor:</span> {student.supervisorName ?? "Unassigned"}</p>
                      <p><span className="font-semibold text-foreground">Status:</span> {normaliseStatus(student.status).label}</p>
                      <p><span className="font-semibold text-foreground">Date of birth:</span> {dateFormatter.format(new Date(student.dateOfBirth))}</p>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><span className="font-semibold text-foreground">Primary email:</span> {student.email}</p>
                      <p><span className="font-semibold text-foreground">Phone:</span> {student.phone}</p>
                      <p><span className="font-semibold text-foreground">Address:</span> {student.address}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Current courses</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {activeEnrollments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No active enrollments right now.</p>
                    ) : (
                      activeEnrollments.map((enrollment) => (
                        <div key={enrollment.id} className="rounded-lg border border-border/70 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{enrollment.courseTitle}</p>
                              <p className="text-xs text-muted-foreground">{enrollment.professorName}</p>
                            </div>
                            <Badge variant="outline">{enrollment.status}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {dateFormatter.format(new Date(enrollment.startDate))} → {dateFormatter.format(new Date(enrollment.endDate))}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="enrollments">
                {loadedTabs.has("enrollments") ? (
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Enrollment history</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {enrollments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No enrollment records yet.</p>
                      ) : (
                        <ScrollArea className="max-h-[420px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-secondary/40">
                                <TableHead className="w-1/3">Course</TableHead>
                                <TableHead>Professor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead className="text-right">Tuition</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {enrollments.map((enrollment) => (
                                <TableRow key={enrollment.id} className="border-b border-border/60">
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-foreground">{enrollment.courseTitle}</span>
                                      <span className="text-xs text-muted-foreground">ID · {enrollment.id}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{enrollment.professorName}</TableCell>
                                  <TableCell>
                                    <Badge variant={enrollmentBadge[enrollment.status].variant}>
                                      {enrollmentBadge[enrollment.status].label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {dateFormatter.format(new Date(enrollment.startDate))} → {dateFormatter.format(new Date(enrollment.endDate))}
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-foreground">
                                    {currencyFormatter.format(enrollment.price)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Skeleton className="h-64 w-full" />
                )}
              </TabsContent>

              <TabsContent value="grades" className="space-y-4">
                {loadedTabs.has("grades") ? (
                  <>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Grades & breakdown</p>
                        <p className="text-sm text-muted-foreground">Edit numeric components; totals and letters refresh after save.</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="border-border text-foreground">{grades.length} courses</Badge>
                        {gradesLoading && <Spinner className="h-4 w-4" />}
                      </div>
                    </div>

                    {gradesError && (
                      <Alert variant="destructive">
                        <AlertTitle>Unable to load grades</AlertTitle>
                        <AlertDescription>{gradesError}</AlertDescription>
                      </Alert>
                    )}

                    {gradesLoading && grades.length === 0 ? (
                      <Skeleton className="h-32 w-full" />
                    ) : grades.length === 0 ? (
                      <Card className="border-border bg-card">
                        <CardContent className="py-5 text-sm text-muted-foreground">No grade records yet.</CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {grades.map((enrollment) => (
                          <GradeBreakdown
                            key={enrollment.id}
                            enrollment={enrollment}
                            readOnly={false}
                            saving={gradeSavingId === enrollment.id}
                            error={gradeSavingId === enrollment.id ? gradesError : null}
                            onSave={(input) => handleSaveGrade(enrollment.id, input)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Skeleton className="h-64 w-full" />
                )}
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                {loadedTabs.has("payments") ? (
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border-border bg-card lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Payment history</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {sortedTransactions.length === 0 ? (
                          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                            <Receipt className="h-6 w-6" />
                            <p className="text-sm">No payments recorded yet.</p>
                          </div>
                        ) : (
                          <ScrollArea className="max-h-[360px]">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-secondary/40">
                                  <TableHead>Reference</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Method</TableHead>
                                  <TableHead>Note</TableHead>
                                  <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sortedTransactions.map((transaction) => (
                                  <TableRow key={transaction.id}>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium text-foreground">{transaction.id}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {dateFormatter.format(new Date(transaction.createdAt))}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={transaction.type === "credit" ? "default" : "outline"}>{transaction.type}</Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{transaction.method}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground truncate max-w-[180px]">
                                      {transaction.note ?? "—"}
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold ${transaction.type === "credit" ? "text-foreground" : "text-destructive"}`}>
                                      {transaction.type === "credit" ? "+" : "-"}
                                      {currencyFormatter.format(transaction.amount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                      <CardHeader>
                        <CardTitle>Record new payment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form className="space-y-4" onSubmit={handlePaymentSubmit}>
                          <div className="space-y-2">
                            <Label htmlFor="paymentAmount">Amount</Label>
                            <Input id="paymentAmount" name="amount" type="number" min={1} step={1} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Method</Label>
                            <select
                              id="paymentMethod"
                              name="method"
                              className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                              defaultValue={paymentOptions[0]?.value}
                              required
                            >
                              {paymentOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="paymentNote">Internal note</Label>
                            <Textarea id="paymentNote" name="note" rows={3} placeholder="Optional context" />
                          </div>
                          {paymentError && <Alert variant="destructive">{paymentError}</Alert>}
                          <Button type="submit" className="w-full" disabled={paymentSubmitting}>
                            {paymentSubmitting ? (
                              <span className="flex items-center gap-2"><Spinner className="h-4 w-4" /> Saving...</span>
                            ) : (
                              <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Record payment</span>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Skeleton className="h-64 w-full" />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

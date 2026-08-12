"use client"

import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { FileText, UserCheck, DollarSign } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  fetchPendingRegistrations,
  fetchTranscriptRequestQueue,
  registerStudentEnrollment,
  updateTranscriptRequestStatus,
} from "@/lib/registrar-api"
import { fetchStudents } from "@/lib/students-api"
import type { Enrollment, Student, TranscriptRequest } from "@shared/types"

const documentTypeLabels: Record<TranscriptRequest["documentType"], string> = {
  transcript: "Official Transcript",
  "enrollment-letter": "Enrollment Verification Letter",
  "graduation-letter": "Graduation Confirmation Letter",
  "recommendation-letter": "Recommendation Letter",
  other: "Other",
}

const NEXT_STATUS: Record<TranscriptRequest["status"], TranscriptRequest["status"] | null> = {
  pending: "processing",
  processing: "ready",
  ready: "delivered",
  delivered: null,
  rejected: null,
}

const statusVariant: Record<TranscriptRequest["status"], "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  processing: "secondary",
  ready: "default",
  delivered: "secondary",
  rejected: "destructive",
}

function canAccessRegistrar(role?: string) {
  return role === "admin" || role === "super-admin" || role === "supervisor" || role === "registrar" || role === "it-admin"
}

// Matches backend canRegisterStudents() in registrar.ts — narrower than page view access,
// since registration auto-bills Finance and should stay limited to the role whose job it is.
function canRegisterStudents(role?: string) {
  return role === "admin" || role === "super-admin" || role === "registrar"
}

export default function RegistrarDashboardPage() {
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const canView = canAccessRegistrar(user?.role)
  const canRegister = canRegisterStudents(user?.role)

  const [requests, setRequests] = useState<TranscriptRequest[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [pendingRegistrations, setPendingRegistrations] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState<Record<string, boolean>>({})
  const [registerPending, setRegisterPending] = useState<Record<string, boolean>>({})

  const load = async () => {
    setLoadError(null)
    try {
      const [queue, studentList, pending] = await Promise.all([
        fetchTranscriptRequestQueue(),
        fetchStudents(),
        canRegister ? fetchPendingRegistrations() : Promise.resolve([]),
      ])
      setRequests(queue)
      setStudents(studentList)
      setPendingRegistrations(pending)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load transcript requests")
    }
  }

  useEffect(() => {
    if (authLoading || !canView) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    load().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canView])

  const studentsById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students])

  const sortedRequests = useMemo(
    () => [...requests].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
    [requests],
  )

  const handleAdvance = async (request: TranscriptRequest) => {
    const next = NEXT_STATUS[request.status]
    if (!next) return
    setActionPending((prev) => ({ ...prev, [request.id]: true }))
    try {
      await updateTranscriptRequestStatus(request.id, next)
      toast({ title: "Status updated", description: `Marked as ${next}.` })
      await load()
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to update", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setActionPending((prev) => ({ ...prev, [request.id]: false }))
    }
  }

  const handleReject = async (request: TranscriptRequest) => {
    setActionPending((prev) => ({ ...prev, [request.id]: true }))
    try {
      await updateTranscriptRequestStatus(request.id, "rejected")
      toast({ title: "Request rejected" })
      await load()
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to reject", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setActionPending((prev) => ({ ...prev, [request.id]: false }))
    }
  }

  const handleRegister = async (enrollment: Enrollment) => {
    setRegisterPending((prev) => ({ ...prev, [enrollment.id]: true }))
    try {
      const updated = await registerStudentEnrollment(enrollment.id)
      toast({
        title: "Student registered",
        description:
          updated.paymentStatus === "paid"
            ? "Registered — payment cleared."
            : "Registered — routed to Finance, payment still pending.",
      })
      await load()
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to register", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setRegisterPending((prev) => ({ ...prev, [enrollment.id]: false }))
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>You need registrar access to view this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Registrar" description="Document requests submitted by students, queued for processing" />
      <div className="flex-1 space-y-4 p-6 pt-4 md:pt-6">
        {loadError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load requests</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading requests…
          </div>
        ) : !canRegister ? null : (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserCheck className="h-4 w-4 text-primary" />
              Pending Registrations
            </h2>
            {pendingRegistrations.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">No students awaiting registration.</CardContent>
              </Card>
            ) : (
              pendingRegistrations.map((enrollment) => {
                const student = studentsById.get(enrollment.studentId)
                return (
                  <Card key={enrollment.id} className="border-border bg-card">
                    <CardHeader className="flex flex-col gap-2 pb-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          {enrollment.courseTitle}
                          <Badge variant="outline">{enrollment.status}</Badge>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {student ? `${student.firstName} ${student.lastName} (${student.displayId})` : enrollment.studentId} · tuition{" "}
                          {enrollment.price}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={registerPending[enrollment.id]}
                        onClick={() => handleRegister(enrollment)}
                      >
                        {registerPending[enrollment.id] ? <Spinner className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
                        Register &amp; Bill Finance
                      </Button>
                    </CardHeader>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {isLoading ? null : (
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Document Requests
          </h2>
        )}

        {isLoading ? null : sortedRequests.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">No document requests yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedRequests.map((request) => {
              const student = studentsById.get(request.studentId)
              const next = NEXT_STATUS[request.status]
              return (
                <Card key={request.id} className="border-border bg-card">
                  <CardHeader className="flex flex-col gap-2 pb-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-primary" />
                        {documentTypeLabels[request.documentType]}
                        <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {student ? `${student.firstName} ${student.lastName} (${student.displayId})` : request.studentId} · via {request.deliveryMethod} · requested{" "}
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {next && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionPending[request.id]}
                          onClick={() => handleAdvance(request)}
                        >
                          {actionPending[request.id] ? <Spinner className="h-3.5 w-3.5" /> : null}
                          Mark {next}
                        </Button>
                      )}
                      {request.status !== "rejected" && request.status !== "delivered" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          disabled={actionPending[request.id]}
                          onClick={() => handleReject(request)}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  {request.notes && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-foreground">{request.notes}</p>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

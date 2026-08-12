"use client"

import { useEffect, useState } from "react"
import { DashboardRouteGuard } from "@/components/dashboard-route-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchEnrollments, type EnrollmentRecord } from "@/lib/enrollment-api"
import { fetchStudents } from "@/lib/students-api"
import type { Student } from "@shared/types"
import { deriveStudentYearLevel } from "@/lib/academic-terms"
import { BookOpen, ChevronDown, Search } from "lucide-react"

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default"
  if (status === "cancelled" || status === "rejected") return "destructive"
  if (status === "completed") return "secondary"
  return "outline"
}

export default function AdviseeStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [classesStudent, setClassesStudent] = useState<Student | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    fetchStudents(controller.signal)
      .then((data) => setStudents(data))
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Failed to load students")
      })
      .finally(() => setIsLoading(false))
    return () => controller.abort()
  }, [])

  function openClasses(student: Student) {
    setClassesStudent(student)
    setEnrollments([])
    setEnrollmentsError(null)
    setEnrollmentsLoading(true)

    const controller = new AbortController()
    fetchEnrollments({ studentId: student.id, pageSize: 200, signal: controller.signal })
      .then((data) => setEnrollments(data.items))
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return
        setEnrollmentsError(err instanceof Error ? err.message : "Failed to load enrollments")
      })
      .finally(() => setEnrollmentsLoading(false))
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (
      !q ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.displayId ?? "").toLowerCase().includes(q) ||
      (s.program ?? "").toLowerCase().includes(q)
    )
  })

  const scheduleRows = enrollments.flatMap((enr) =>
    (enr.courseSchedule ?? []).map((slot) => ({ enr, slot })),
  ).sort((a, b) => DAY_ORDER.indexOf(a.slot.day) - DAY_ORDER.indexOf(b.slot.day))

  return (
    <DashboardRouteGuard allowedRoles={["advisor", "admin", "super-admin", "supervisor", "professor"]} redirectTo="/dashboard">
      <div className="flex h-full flex-col">
        <DashboardHeader title="My Advisees" description="Students assigned to you as academic advisor" />
        <div className="flex-1 space-y-6 p-6 pt-4 md:pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Load failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or program..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${filtered.length} student${filtered.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="h-6 w-6" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {search ? "No students match your search." : "No students assigned to you yet."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((student) => (
                <Card key={student.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarImage src={student.photo || undefined} alt={`${student.firstName} ${student.lastName}`} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                            {(student.firstName[0] ?? "") + (student.lastName[0] ?? "")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="text-base leading-tight">
                            {student.firstName} {student.lastName}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{student.displayId}</p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="shrink-0 h-8 gap-1 text-xs">
                            Actions <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openClasses(student)}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Classes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={student.status === "active" ? "default" : "secondary"} className="text-xs">
                        {student.status}
                      </Badge>
                      {deriveStudentYearLevel(student) && (
                        <Badge variant="outline" className="text-xs">
                          Year {deriveStudentYearLevel(student)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    {student.program && (
                      <p className="text-sm">
                        <span className="font-medium">Program:</span> {student.program}
                      </p>
                    )}
                    {student.major && (
                      <p className="text-sm">
                        <span className="font-medium">Major:</span> {student.major}
                      </p>
                    )}
                    {student.faculty && (
                      <p className="text-sm">
                        <span className="font-medium">Faculty:</span> {student.faculty}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">Balance:</span>{" "}
                      <span className={student.balance < 0 ? "text-red-600" : "text-green-600"}>
                        ${student.balance.toFixed(2)}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Classes dialog */}
      <Dialog open={!!classesStudent} onOpenChange={(open) => { if (!open) setClassesStudent(null) }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {classesStudent ? `${classesStudent.firstName} ${classesStudent.lastName} — Classes` : "Classes"}
            </DialogTitle>
          </DialogHeader>

          {enrollmentsLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-6 w-6" />
            </div>
          ) : enrollmentsError ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{enrollmentsError}</AlertDescription>
            </Alert>
          ) : enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No enrollments found.</p>
          ) : (
            <div className="space-y-6">
              {/* Enrolled courses list */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Enrolled Courses</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enr) => (
                      <TableRow key={enr.id}>
                        <TableCell className="font-medium">{enr.courseTitle}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{enr.courseCode ?? "—"}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {enr.startDate ? new Date(enr.startDate).toLocaleDateString() : "—"}
                          {" – "}
                          {enr.endDate ? new Date(enr.endDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(enr.status)} className="text-xs capitalize">
                            {enr.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Weekly schedule */}
              {scheduleRows.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Weekly Schedule</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduleRows.map(({ enr, slot }, idx) => (
                        <TableRow key={`${enr.id}-${idx}`}>
                          <TableCell className="font-medium">{capitalize(slot.day)}</TableCell>
                          <TableCell className="whitespace-nowrap">{slot.startTime} – {slot.endTime}</TableCell>
                          <TableCell>{enr.courseTitle}</TableCell>
                          <TableCell className="text-muted-foreground">{slot.location || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardRouteGuard>
  )
}

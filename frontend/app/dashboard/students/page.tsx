"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import { useToast } from "@/hooks/use-toast"
import { createStudent, deleteStudent, fetchStudents, updateStudent, fetchStudentGrades } from "@/lib/students-api"
import { createUser } from "@/lib/users-api"
import { fetchAcademicStructure, type AcademicStructure } from "@/lib/enrollment-api"
import StudentCard from "@/components/student-card"
import { fetchProfessors } from "@/lib/professor-api"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { useAuth } from "@/lib/auth-context"
import type { Professor, Student } from "@shared/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Wallet } from "lucide-react"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

function TiltCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Card className={`card-3d-lift dashboard-soft-hover relative overflow-hidden ${className ?? ""}`}>
      {children}
    </Card>
  )
}

function formatStudentYear(student: Student) {
  if (Number.isFinite(Number(student.currentYear)) && Number(student.currentYear) > 0) {
    return `Year ${Math.floor(Number(student.currentYear))}`
  }
  if (typeof student.currentSemester === "string" && student.currentSemester.trim()) {
    return student.currentSemester.trim()
  }
  return "Year not set"
}

const studentProgramOptions = [
  "Computer Science",
  "Business Administration",
  "Data Science",
  "Engineering",
  "Psychology",
] as const

const studentOptionalFields = [
  "middleName",
  "major",
  "faculty",
  "gender",
  "nationality",
  "nationalId",
  "passportNumber",
  "bloodType",
  "city",
  "postalCode",
  "emergencyContactName",
  "emergencyContactPhone",
  "motherName",
  "fatherName",
] as const

function getTrimmed(formData: FormData, key: string) {
  return ((formData.get(key) as string | null) ?? "").trim()
}

function calculateAge(dateOfBirth?: string) {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

function buildStudentPayload(formData: FormData, professors: Professor[], fallback?: Student): Omit<Student, "id" | "displayId"> | Partial<Student> {
  const photoData = getTrimmed(formData, "photoData") || fallback?.photo || "/placeholder-user.jpg"
  const balanceValue = Number(formData.get("balance") ?? fallback?.balance ?? 0)
  const supervisorId = getTrimmed(formData, "supervisorId") || fallback?.supervisorId || ""
  const supervisor = professors.find((item) => item.id === supervisorId)
  const supervisorAssigned = supervisorId && supervisorId !== "none"
  const payload: Partial<Student> = {
    firstName: getTrimmed(formData, "firstName") || fallback?.firstName || "",
    middleName: getTrimmed(formData, "middleName") || undefined,
    lastName: getTrimmed(formData, "lastName") || fallback?.lastName || "",
    email: getTrimmed(formData, "email") || fallback?.email || "",
    phone: getTrimmed(formData, "phone") || fallback?.phone || "",
    photo: photoData,
    enrollmentDate: getTrimmed(formData, "enrollmentDate") || fallback?.enrollmentDate || new Date().toISOString(),
    program: getTrimmed(formData, "program") || fallback?.program || "",
    major: getTrimmed(formData, "major") || undefined,
    faculty: getTrimmed(formData, "faculty") || undefined,
    currentYear: Number(formData.get("currentYear") ?? fallback?.currentYear ?? 1),
    status: ((formData.get("status") as Student["status"] | null) ?? fallback?.status ?? "active"),
    address: getTrimmed(formData, "address") || fallback?.address || "",
    city: getTrimmed(formData, "city") || undefined,
    postalCode: getTrimmed(formData, "postalCode") || undefined,
    dateOfBirth: getTrimmed(formData, "dateOfBirth") || fallback?.dateOfBirth || "",
    gender: getTrimmed(formData, "gender") || undefined,
    nationality: getTrimmed(formData, "nationality") || undefined,
    nationalId: getTrimmed(formData, "nationalId") || undefined,
    passportNumber: getTrimmed(formData, "passportNumber") || undefined,
    bloodType: getTrimmed(formData, "bloodType") || undefined,
    emergencyContactName: getTrimmed(formData, "emergencyContactName") || undefined,
    emergencyContactPhone: getTrimmed(formData, "emergencyContactPhone") || undefined,
    motherName: getTrimmed(formData, "motherName") || undefined,
    fatherName: getTrimmed(formData, "fatherName") || undefined,
    balance: Number.isFinite(balanceValue) ? balanceValue : fallback?.balance ?? 0,
    supervisorId: supervisorAssigned ? supervisor?.id ?? supervisorId : undefined,
    supervisorName:
      supervisorAssigned
        ? supervisor
          ? `${supervisor.firstName} ${supervisor.lastName}`
          : fallback?.supervisorId === supervisorId
            ? fallback?.supervisorName
            : undefined
        : undefined,
  }

  studentOptionalFields.forEach((field) => {
    if (!payload[field]) {
      delete payload[field]
    }
  })

  return payload
}

export default function StudentsPage() {
  const { user, isLoading: authLoading, hasPermission } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })
  const [students, setStudents] = useState<Student[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [gradeModalOpen, setGradeModalOpen] = useState(false)
  const [gradeData, setGradeData] = useState<any[] | null>(null)
  const [gradeLoading, setGradeLoading] = useState(false)
  const [professors, setProfessors] = useState<Professor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [professorsError, setProfessorsError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [pendingRefresh, setPendingRefresh] = useState(false)
  const hasOpenModal = isAddOpen || isViewOpen || isEditOpen
  const isFinanceUser = user?.role === "finance"
  const isAdminLike = user?.role === "admin" || user?.role === "super-admin" || user?.role === "supervisor"
  const isAdvisorUser = user?.role === "advisor" && Boolean(user.professorId)
  const canCreateOrDeleteStudents = !!user && !isFinanceUser && isAdminLike
  const canEditStudents = !!user && !isFinanceUser && (isAdminLike || isAdvisorUser)

  useEffect(() => {
    if (authLoading) return
    const allowed = hasPermission("students:view")
    if (!allowed) {
      router.push("/dashboard")
    }
  }, [authLoading, hasPermission, router])

  useEffect(() => {
    if (hasOpenModal) {
      setPendingRefresh(true)
      return
    }
    const controller = new AbortController()

        async function loadStudents() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await fetchStudents(controller.signal)
        if (!controller.signal.aborted) {
          // hide deleted students if any
          setStudents(data.filter((s) => s.status !== 'deleted'))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Unable to load students")
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadStudents()

    return () => controller.abort()
  }, [hasOpenModal, refreshVersion])

  useEffect(() => {
    if (!pendingRefresh || hasOpenModal) return
    const controller = new AbortController()
    async function reload() {
      setIsLoading(true)
      setLoadError(null)
      setProfessorsError(null)
      try {
        const [studentsData, professorsData] = await Promise.all([
          fetchStudents(controller.signal),
          fetchProfessors(controller.signal),
        ])
        if (!controller.signal.aborted) {
          setStudents(studentsData.filter((s) => s.status !== 'deleted'))
          setProfessors(professorsData)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Unable to load students")
          setProfessorsError(error instanceof Error ? error.message : "Unable to load professors")
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }
    reload()
    setPendingRefresh(false)
    return () => controller.abort()
  }, [hasOpenModal, pendingRefresh])

  useEffect(() => {
    if (hasOpenModal) {
      setPendingRefresh(true)
      return
    }
    const controller = new AbortController()

    async function loadProfessors() {
      setProfessorsError(null)
      try {
        const data = await fetchProfessors(controller.signal)
        if (!controller.signal.aborted) {
          setProfessors(data)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setProfessorsError(error instanceof Error ? error.message : "Unable to load professors")
        }
      }
    }

    loadProfessors()

    return () => controller.abort()
  }, [hasOpenModal, refreshVersion])

  const visibleStudents = useMemo(
    () => (isAdvisorUser && user?.professorId ? students.filter((student) => student.supervisorId === user.professorId) : students),
    [isAdvisorUser, students, user?.professorId],
  )

  const outstandingTotal = useMemo(
    () => visibleStudents.reduce((sum, student) => (student.balance > 0 ? sum + student.balance : sum), 0),
    [visibleStudents],
  )

  const withOutstandingCount = useMemo(
    () => visibleStudents.filter((student) => student.balance > 0).length,
    [visibleStudents],
  )

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSaving) return
    const formData = new FormData(e.currentTarget)

    const username = (formData.get("username") as string | null)?.trim() ?? ""
    const password = (formData.get("password") as string | null) ?? ""
    const confirmPassword = (formData.get("confirmPassword") as string | null) ?? ""

    if (username) {
      if (!password) {
        toast({ variant: "destructive", title: "Password required", description: "Provide a password when setting a username." })
        return
      }
      if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "Passwords do not match", description: "Make sure both password fields match." })
        return
      }
      if (password.length < 4) {
        toast({ variant: "destructive", title: "Password too short", description: "Use at least 4 characters for the password." })
        return
      }
    }

    setIsSaving(true)
    try {
      const payload = buildStudentPayload(formData, professors) as Omit<Student, "id" | "displayId">
      const created = await createStudent(payload)
      setStudents((prev) => [created, ...prev])
      // If username was provided, create a linked user account (best-effort)
      if (username) {
        try {
          const accountEmail = created.email || String(payload.email ?? "")
          await createUser({ username, email: accountEmail, password, role: "student", studentId: created.id })
          toast({ title: "Student and account created", description: `${username} can sign in now` })
        } catch (err) {
          console.warn("createUser failed", err)
          toast({ variant: "destructive", title: "Student created — account failed", description: err instanceof Error ? err.message : "Unable to create user account" })
        }
      } else {
        toast({ title: "Student added" })
      }
      setIsAddOpen(false)
      e.currentTarget.reset()
    } catch (error) {
      toast({ title: "Unable to add student", description: error instanceof Error ? error.message : "", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedStudent || isSaving) return
    const formData = new FormData(e.currentTarget)

    setIsSaving(true)
    try {
      const payload = buildStudentPayload(formData, professors, selectedStudent) as Partial<Student>
      const updated = await updateStudent(selectedStudent.id, payload)
      setStudents((prev) => prev.map((s) => (s.id === selectedStudent.id ? updated : s)))
      toast({ title: "Student updated" })
      setIsEditOpen(false)
      setSelectedStudent(null)
    } catch (error) {
      toast({ title: "Unable to update student", description: error instanceof Error ? error.message : "", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (deleteId) return
    setDeleteId(id)
    try {
      await deleteStudent(id)
      setStudents((prev) => prev.filter((s) => s.id !== id))
      toast({ title: "Student deleted" })
    } catch (error) {
      toast({ title: "Unable to delete student", description: error instanceof Error ? error.message : "", variant: "destructive" })
    } finally {
      setDeleteId(null)
    }
  }

  const canEditStudentRecord = (student: Student) => canEditStudents && (isAdminLike || student.supervisorId === user?.professorId)

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (student: Student) => (
        <div>
          <button
            type="button"
            className="text-left font-medium text-foreground hover:underline"
            onClick={() => {
              setSelectedStudent(student)
              setIsViewOpen(true)
            }}
          >
            {student.firstName} {student.lastName}
          </button>
          <div className="text-xs text-muted-foreground">{student.displayId || student.id}</div>
        </div>
      ),
    },
    { key: "program", header: "Program", render: (student: Student) => <div className="text-foreground">{student.program}</div> },
    {
      key: "balance",
      header: "Balance",
      render: (student: Student) => (
        <span
          className={`font-medium ${
            student.balance > 0 ? "text-destructive" : student.balance < 0 ? "text-success" : "text-foreground"
          }`}
        >
          {currencyFormatter.format(student.balance ?? 0)}
        </span>
      ),
    },
  ]

  const StudentForm: React.FC<{
    student?: Student | null
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    submitLabel: string
    isSubmitting?: boolean
    professors: Professor[]
    financeOnly?: boolean
    allowSupervisorEdit?: boolean
  }> = ({ student, onSubmit, submitLabel, isSubmitting, professors = [], financeOnly = false, allowSupervisorEdit = true }) => {
    const [preview, setPreview] = useState<string>(student?.photo ?? "")
    const [fileName, setFileName] = useState<string>("")
    const [academicStructure, setAcademicStructure] = useState<AcademicStructure | null>(null)
    const [programValue, setProgramValue] = useState<string>(student?.program ?? "Computer Science")
    const [majorValue, setMajorValue] = useState<string>((student?.major as string | undefined) ?? "")
    const initialYearValue =
      Number.isFinite(Number(student?.currentYear)) && Number(student?.currentYear) > 0
        ? String(Math.floor(Number(student?.currentYear)))
        : typeof student?.currentSemester === "string"
          ? student.currentSemester.match(/(\d+)/)?.[1] ?? "1"
          : "1"
    const [yearValue, setYearValue] = useState<string>(initialYearValue)
    const [statusValue, setStatusValue] = useState<Student["status"]>(student?.status ?? "active")
    const availablePrograms = useMemo(() => {
      const structurePrograms = (academicStructure?.departments ?? []).map((department) => department.name).filter(Boolean)
      const fallbackPrograms = structurePrograms.length > 0 ? structurePrograms : [...studentProgramOptions]
      return programValue && !fallbackPrograms.includes(programValue)
        ? [programValue, ...fallbackPrograms]
        : fallbackPrograms
    }, [academicStructure, programValue])
    const filteredMajors = useMemo(() => {
      const majors = academicStructure?.majors ?? []
      if (majors.length === 0) return []
      const matchingDepartment = (academicStructure?.departments ?? []).find((department) => department.name === programValue)
      if (!matchingDepartment) return majors
      return majors.filter((major) => major.departmentId === matchingDepartment.id)
    }, [academicStructure, programValue])
    const filteredSupervisors = useMemo(
      () => professors.filter((professor) => professor.department === programValue),
      [professors, programValue],
    )
    const [supervisorValue, setSupervisorValue] = useState<string>(student?.supervisorId ?? filteredSupervisors[0]?.id ?? "none")
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const fieldControlClass =
      "border-[#cfe0f5] bg-[#f7fbff] text-slate-700 placeholder:text-slate-400 focus-visible:border-[#9ec3eb] focus-visible:ring-[#bfdbfe]/40"

    useEffect(() => {
      let active = true
      fetchAcademicStructure()
        .then((data) => {
          if (!active) return
          setAcademicStructure(data)
        })
        .catch(() => {
          if (!active) return
          setAcademicStructure(null)
        })
      return () => {
        active = false
      }
    }, [])

    useEffect(() => {
      setPreview(student?.photo ?? "")
      setFileName("")
      setProgramValue(student?.program ?? "Computer Science")
      setMajorValue((student?.major as string | undefined) ?? "")
      setYearValue(
        Number.isFinite(Number(student?.currentYear)) && Number(student?.currentYear) > 0
          ? String(Math.floor(Number(student?.currentYear)))
          : typeof student?.currentSemester === "string"
            ? student.currentSemester.match(/(\d+)/)?.[1] ?? "1"
            : "1",
      )
      setStatusValue(student?.status ?? "active")
      setSupervisorValue(student?.supervisorId ?? "none")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }, [student])

    useEffect(() => {
      if (filteredMajors.length === 0) return
      setMajorValue((current) => {
        if (current && filteredMajors.some((major) => major.name === current)) return current
        return filteredMajors[0]?.name ?? current
      })
    }, [filteredMajors])

    useEffect(() => {
      const fallback = filteredSupervisors[0]?.id ?? "none"
      setSupervisorValue((prev) => {
        if (!prev) return fallback
        if (student?.supervisorId && prev === student.supervisorId) return prev
        return filteredSupervisors.some((professor) => professor.id === prev) ? prev : fallback
      })
    }, [filteredSupervisors, student])

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        setPreview(student?.photo ?? "")
        setFileName("")
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPreview(reader.result)
        }
      }
      reader.readAsDataURL(file)
      setFileName(file.name)
    }

    const handleRemovePhoto = () => {
      setPreview("")
      setFileName("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    const initials = student ? `${student.firstName[0]}${student.lastName[0]}` : "NA"

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        {financeOnly ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#d9e6f7] bg-[#f7fbff] p-4">
              <p className="text-sm font-medium text-[#27496d]">Finance update only</p>
              <p className="text-sm text-[#68809a]">Finance staff can only change the student balance from this screen.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Student</Label>
                <div className="rounded-md border border-[#cfe0f5] bg-[#f7fbff] px-3 py-2 text-sm text-slate-700">
                  {student ? `${student.firstName} ${student.lastName}` : "No student selected"}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Student ID</Label>
                <div className="rounded-md border border-[#cfe0f5] bg-[#f7fbff] px-3 py-2 text-sm text-slate-700">
                  {student?.displayId || student?.id || "Not available"}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Outstanding Balance</Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                step="0.01"
                defaultValue={student?.balance ?? 0}
                className={fieldControlClass}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {submitLabel}
              </Button>
            </div>
          </div>
        ) : (
          <>
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={preview || "/placeholder-user.jpg"} alt="Student avatar preview" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Input
                ref={fileInputRef}
                name="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className={fieldControlClass}
              />
              <Input type="hidden" name="photoData" value={preview} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{fileName || "Upload JPG or PNG under 2MB."}</span>
                {preview && (
                  <button type="button" onClick={handleRemovePhoto} className="text-primary hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={student?.firstName}
              className={fieldControlClass}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              name="middleName"
              defaultValue={student?.middleName as string | undefined}
              className={fieldControlClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={student?.lastName}
              className={fieldControlClass}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={student?.email}
              className={fieldControlClass}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={student?.phone}
              className={fieldControlClass}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="username">Username (optional)</Label>
            <Input id="username" name="username" placeholder="e.g. jdoe" className={fieldControlClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Password" className={fieldControlClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm password" className={fieldControlClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="program">Department</Label>
            <Select value={programValue} onValueChange={setProgramValue}>
              <SelectTrigger className={fieldControlClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePrograms.map((program) => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="hidden" name="program" value={programValue} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentYear">Year</Label>
            <Select value={yearValue} onValueChange={setYearValue}>
              <SelectTrigger className={fieldControlClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Year 1</SelectItem>
                <SelectItem value="2">Year 2</SelectItem>
                <SelectItem value="3">Year 3</SelectItem>
                <SelectItem value="4">Year 4</SelectItem>
                <SelectItem value="5">Year 5</SelectItem>
                <SelectItem value="6">Year 6</SelectItem>
              </SelectContent>
            </Select>
            <Input type="hidden" name="currentYear" value={yearValue} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="major">Major</Label>
            {filteredMajors.length > 0 ? (
              <>
                <Select value={majorValue} onValueChange={setMajorValue}>
                  <SelectTrigger className={fieldControlClass}>
                    <SelectValue placeholder="Select major" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMajors.map((major) => (
                      <SelectItem key={major.id} value={major.name}>
                        {major.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="hidden" id="major" name="major" value={majorValue} />
                <p className="text-xs text-muted-foreground">Major saves to the student record and controls course visibility.</p>
              </>
            ) : (
              <Input
                id="major"
                name="major"
                value={majorValue}
                onChange={(event) => setMajorValue(event.target.value)}
                className={fieldControlClass}
                required={filteredMajors.length > 0}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty</Label>
            <Input
              id="faculty"
              name="faculty"
              defaultValue={student?.faculty as string | undefined}
              className={fieldControlClass}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="supervisor">Supervisor</Label>
            {allowSupervisorEdit ? (
              <>
                <Select value={supervisorValue} onValueChange={setSupervisorValue}>
                  <SelectTrigger className={fieldControlClass}>
                    <SelectValue placeholder="Assign supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {student?.supervisorId && !filteredSupervisors.some((professor) => professor.id === student.supervisorId) && (
                      <SelectItem value={student.supervisorId}>{student.supervisorName ?? "Current supervisor"}</SelectItem>
                    )}
                    {filteredSupervisors.map((professor) => (
                      <SelectItem key={professor.id} value={professor.id}>
                        {professor.firstName} {professor.lastName} - {professor.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="hidden" name="supervisorId" value={supervisorValue} />
                {filteredSupervisors.length === 0 && (
                  <p className="text-xs text-muted-foreground">No professors available for this program yet.</p>
                )}
              </>
            ) : (
              <div className="rounded-md border border-[#cfe0f5] bg-[#f7fbff] px-3 py-2 text-sm text-slate-700">
                {student?.supervisorName ?? "Unassigned"}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Input
              id="gender"
              name="gender"
              defaultValue={student?.gender as string | undefined}
              className={fieldControlClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              name="nationality"
              defaultValue={student?.nationality as string | undefined}
              className={fieldControlClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodType">Blood Type</Label>
            <Input
              id="bloodType"
              name="bloodType"
              defaultValue={student?.bloodType as string | undefined}
              className={fieldControlClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={statusValue} onValueChange={(value) => setStatusValue(value as Student["status"])}>
            <SelectTrigger className={fieldControlClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>
          <Input type="hidden" name="status" value={statusValue} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="enrollmentDate">Enrollment Date</Label>
            <Input
              id="enrollmentDate"
              name="enrollmentDate"
              type="date"
              defaultValue={student?.enrollmentDate ? new Date(student.enrollmentDate).toISOString().slice(0, 10) : ""}
              className={fieldControlClass}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().slice(0, 10) : ""}
              className={fieldControlClass}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={student?.address}
            className={fieldControlClass}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={student?.city as string | undefined}
              className={fieldControlClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              name="postalCode"
              defaultValue={student?.postalCode as string | undefined}
              className={fieldControlClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID</Label>
            <Input
              id="nationalId"
              name="nationalId"
              defaultValue={student?.nationalId as string | undefined}
              className={fieldControlClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passportNumber">Passport Number</Label>
            <Input
              id="passportNumber"
              name="passportNumber"
              defaultValue={student?.passportNumber as string | undefined}
              className={fieldControlClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="motherName">Mother Name</Label>
            <Input
              id="motherName"
              name="motherName"
              defaultValue={student?.motherName as string | undefined}
              className={fieldControlClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatherName">Father Name</Label>
            <Input
              id="fatherName"
              name="fatherName"
              defaultValue={student?.fatherName as string | undefined}
              className={fieldControlClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              defaultValue={student?.emergencyContactName as string | undefined}
              className={fieldControlClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
            <Input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              defaultValue={student?.emergencyContactPhone as string | undefined}
              className={fieldControlClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="balance">Outstanding Balance</Label>
          <Input
            id="balance"
            name="balance"
            type="number"
            step="0.01"
            defaultValue={student?.balance ?? 0}
            className={fieldControlClass}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
          </>
        )}
      </form>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Students" description="Manage student records and enrollments" />

      <div className="flex-1 p-4 space-y-4">
        {loadError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load students</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}
        {professorsError && (
          <Alert>
            <AlertTitle>Professor directory unavailable</AlertTitle>
            <AlertDescription>{professorsError}. You can still create students without a supervisor.</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <TiltCard className="bg-card border-border px-4 py-2 group min-h-[96px]">
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
              <div className="absolute inset-0 pointer-events-none opacity-5" style={{ background: "radial-gradient(120% 80% at 30% 20%, var(--glow-accent) 0%, transparent 65%)" }} />
            </TiltCard>
              <TiltCard className="bg-card border-border px-4 py-2 group min-h-[96px]">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-primary">{visibleStudents.filter((s) => s.status === "active").length}</p>
              <div className="absolute inset-0 pointer-events-none opacity-5" style={{ background: "radial-gradient(120% 80% at 70% 20%, var(--glow-primary) 0%, transparent 65%)" }} />
            </TiltCard>
              <TiltCard className="bg-card border-border px-4 py-2 group min-h-[96px]">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-destructive" />
                <p className="text-xl font-semibold text-destructive">
                  {currencyFormatter.format(outstandingTotal)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{withOutstandingCount} students owe a balance</p>
              <div className="absolute inset-0 pointer-events-none opacity-5" style={{ background: "radial-gradient(120% 80% at 50% 80%, var(--glow-accent) 0%, transparent 70%)" }} />
            </TiltCard>
            </div>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} onClick={() => setViewMode('cards')}>
              Cards
            </Button>
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} onClick={() => setViewMode('table')}>
              Table
            </Button>
          </div>
          {canCreateOrDeleteStudents && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[96vw] max-w-[1120px] max-h-[92vh] overflow-x-hidden overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>Enter the student details below to create a new record.</DialogDescription>
                </DialogHeader>
                <StudentForm
                  onSubmit={handleAddStudent}
                  submitLabel="Add Student"
                  isSubmitting={isSaving}
                  professors={professors}
                  allowSupervisorEdit
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent>
            {viewMode === 'table' ? (
                <DataTable
                data={visibleStudents}
                columns={columns}
                compact
                searchPlaceholder="Search students..."
                searchKeys={["firstName", "lastName", "displayId", "program"]}
                filterKey="status"
                filterOptions={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "graduated", label: "Graduated" },
                ]}
                filterPlaceholder="Status"
                actions={(student) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_8px_24px_rgba(228,196,92,0.28)]"
                        style={{ ['--btn-glow-color' as string]: 'var(--accent)' }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedStudent(student)
                          setIsViewOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {canEditStudentRecord(student) && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedStudent(student)
                            setIsEditOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canCreateOrDeleteStudents && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteStudent(student.id)}
                          disabled={deleteId === student.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {visibleStudents.map((s) => (
                  <StudentCard
                    key={s.id}
                    student={s}
                    onView={(st) => {
                      setSelectedStudent(st)
                      setIsViewOpen(true)
                    }}
                    onGrades={async (st) => {
                      setGradeLoading(true)
                      try {
                        const grades = await fetchStudentGrades(st.id)
                        setGradeData(grades)
                        setGradeModalOpen(true)
                      } catch (err) {
                        setGradeData(null)
                      } finally {
                        setGradeLoading(false)
                      }
                    }}
                    onTranscript={async (st) => {
                      setGradeLoading(true)
                      try {
                        const grades = await fetchStudentGrades(st.id)
                        setGradeData(grades)
                        setGradeModalOpen(true)
                      } catch (err) {
                        setGradeData(null)
                      } finally {
                        setGradeLoading(false)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={selectedStudent.photo || "/placeholder.svg"}
                    alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                  />
                  <AvatarFallback className="text-lg">
                    {selectedStudent.firstName[0]}
                    {selectedStudent.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {[selectedStudent.firstName, selectedStudent.middleName as string | undefined, selectedStudent.lastName].filter(Boolean).join(" ")}
                  </h3>
                  <p className="text-muted-foreground">{selectedStudent.id}</p>
                  <Badge
                    variant={
                      selectedStudent.status === "active"
                        ? "default"
                        : selectedStudent.status === "inactive"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {selectedStudent.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Display ID</p>
                  <p className="text-foreground">{selectedStudent.displayId || selectedStudent.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Year</p>
                  <p className="text-foreground">{formatStudentYear(selectedStudent)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-foreground">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="text-foreground">{selectedStudent.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Program</p>
                  <p className="text-foreground">{selectedStudent.program}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Major</p>
                  <p className="text-foreground">{(selectedStudent.major as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Faculty</p>
                  <p className="text-foreground">{(selectedStudent.faculty as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Supervisor</p>
                  <p className="text-foreground">{selectedStudent.supervisorName ?? "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Enrollment Date</p>
                  <p className="text-foreground">{new Date(selectedStudent.enrollmentDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="text-foreground">{new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Age</p>
                  <p className="text-foreground">{calculateAge(selectedStudent.dateOfBirth) ?? "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="text-foreground">{(selectedStudent.gender as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nationality</p>
                  <p className="text-foreground">{(selectedStudent.nationality as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Blood Type</p>
                  <p className="text-foreground">{(selectedStudent.bloodType as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">National ID</p>
                  <p className="text-foreground">{(selectedStudent.nationalId as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Passport Number</p>
                  <p className="text-foreground">{(selectedStudent.passportNumber as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Address</p>
                  <p className="text-foreground">{selectedStudent.address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">City</p>
                  <p className="text-foreground">{(selectedStudent.city as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Postal Code</p>
                  <p className="text-foreground">{(selectedStudent.postalCode as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mother Name</p>
                  <p className="text-foreground">{(selectedStudent.motherName as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Father Name</p>
                  <p className="text-foreground">{(selectedStudent.fatherName as string | undefined) ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Emergency Contact</p>
                  <p className="text-foreground">
                    {(selectedStudent.emergencyContactName as string | undefined) ?? "Not set"}
                    {(selectedStudent.emergencyContactPhone as string | undefined)
                      ? ` • ${selectedStudent.emergencyContactPhone as string}`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Outstanding Balance</p>
                  <p
                    className={`font-semibold ${
                      selectedStudent.balance > 0
                        ? "text-destructive"
                        : selectedStudent.balance < 0
                          ? "text-success"
                          : "text-foreground"
                    }`}
                  >
                    {currencyFormatter.format(selectedStudent.balance ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grades / Transcript Dialog (reused) */}
      <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Grades</DialogTitle>
          </DialogHeader>
          <div>
            {gradeLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {!gradeLoading && gradeData && gradeData.length === 0 && <p className="text-sm text-muted-foreground">No grades found</p>}
            {!gradeLoading && gradeData && gradeData.length > 0 && (
              <div className="space-y-2">
                {gradeData.map((g: any) => (
                  <div key={g.id || `${g.courseId}-${g.term}`} className="flex items-center justify-between border-b border-border py-2">
                    <div>
                      <div className="font-medium text-foreground">{g.course?.title ?? g.courseTitle ?? g.courseId}</div>
                      <div className="text-xs text-muted-foreground">{g.grade ?? g.finalGrade ?? 'N/A'}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{g.term ?? g.semester ?? ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[96vw] max-w-[1120px] max-h-[92vh] overflow-x-hidden overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update the student information below.</DialogDescription>
          </DialogHeader>
          <StudentForm
            student={selectedStudent}
            onSubmit={handleEditStudent}
            submitLabel={isFinanceUser ? "Save Finance Details" : "Save Changes"}
            isSubmitting={isSaving}
            professors={professors}
            financeOnly={isFinanceUser}
            allowSupervisorEdit={isAdminLike}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

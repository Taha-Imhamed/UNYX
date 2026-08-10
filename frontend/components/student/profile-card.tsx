"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Student } from "@shared/types"
import { CalendarDays, Mail, MapPin, Phone, University } from "lucide-react"

interface ProfileCardProps {
  student: Student | null
  balance?: number
  isLoading?: boolean
}

export function ProfileCard({ student, balance, isLoading }: ProfileCardProps) {
  const initials = student ? `${student.firstName[0]}${student.lastName[0]}` : "ST"

  if (isLoading) {
    return (
      <Card className="bg-card border border-border shadow-md">
        <CardHeader>
          <div className="h-6 w-40 rounded bg-muted animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-48 rounded bg-muted animate-pulse" />
              <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-3 w-full rounded bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!student) {
    return (
      <Card className="bg-card border border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">No student record found.</CardContent>
      </Card>
    )
  }

  const formattedDob =
    student.dateOfBirth && !Number.isNaN(new Date(student.dateOfBirth).getTime())
      ? new Date(student.dateOfBirth).toLocaleDateString()
      : "Date of birth not provided"

  const age = (() => {
    if (!student.dateOfBirth) return "-"
    const dob = new Date(student.dateOfBirth)
    if (Number.isNaN(dob.getTime())) return "-"
    const diff = Date.now() - dob.getTime()
    const yrs = Math.floor(new Date(diff).getUTCFullYear() - 1970)
    return String(yrs)
  })()

  const yearLabel = student.currentYear ? `Year ${student.currentYear}` : (student.currentSemester ?? "Not set")
  const major = student.major || "Not set"
  const faculty = student.faculty || "Not set"
  const gender = student.gender || "Not provided"
  const nationality = student.nationality || "Not provided"
  const bloodType = student.bloodType || "-"
  const nationalId = student.nationalId || "-"
  const passportNumber = student.passportNumber || "-"
  const city = student.city || "-"
  const postalCode = student.postalCode || "-"
  const motherName = student.motherName || "-"
  const fatherName = student.fatherName || "-"

  return (
    <Card className="bg-card border border-border shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Student Profile</CardTitle>
        <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
          {student.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-4 ring-border">
            <AvatarImage src={student.photo} alt={student.firstName} />
            <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-sm text-muted-foreground">ID: {student.displayId}</p>
            <p className="text-sm text-muted-foreground">Program: {student.program}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground">
          <div>
            <div className="text-muted-foreground text-xs">Display ID</div>
            <div>{student.displayId}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Year</div>
            <div>{yearLabel}</div>
          </div>
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />{student.email}</div>
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{student.phone}</div>
          <div>
            <div className="text-muted-foreground text-xs">Program</div>
            <div>{student.program || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Major</div>
            <div>{major}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Faculty</div>
            <div>{faculty}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Supervisor</div>
            <div>{student.supervisorName || "Not assigned"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Enrollment date</div>
            <div>{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Date of birth</div>
            <div>{formattedDob}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Age</div>
            <div>{age}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Gender</div>
            <div>{gender}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Nationality</div>
            <div>{nationality}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Blood type</div>
            <div>{bloodType}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">National ID</div>
            <div>{nationalId}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Passport</div>
            <div>{passportNumber}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Address</div>
            <div>{student.address || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">City</div>
            <div>{city}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Postal code</div>
            <div>{postalCode}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Mother name</div>
            <div>{motherName}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Father name</div>
            <div>{fatherName}</div>
          </div>
          <div className="flex items-center gap-2"><ReceiptIcon balance={balance} /></div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReceiptIcon({ balance }: { balance?: number }) {
  const amount = balance ?? 0
  const isZero = Math.abs(amount) < 0.01
  const color = isZero ? "text-muted-foreground" : amount > 0 ? "text-warning" : "text-success"
  const label = isZero ? "Balance settled" : amount > 0 ? `Balance due: $${amount.toFixed(2)}` : `Credit: $${Math.abs(amount).toFixed(2)}`
  return (
    <div className="flex items-center gap-2">
      <University className="h-4 w-4 text-primary" />
      <span className={`text-sm font-medium ${color}`}>{label}</span>
    </div>
  )
}

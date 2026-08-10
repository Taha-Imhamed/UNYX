"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useStudentProfile } from "@/hooks/use-student-portal"
import { ProfileCard } from "@/components/student/profile-card"
import { useAuth } from "@/lib/auth-context"

export default function StudentProfilePage() {
  const { profile, isLoading } = useStudentProfile()
  const { user } = useAuth()

  if (isLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="h-4 w-4" /> Loading profile</div>
  }

  if (!profile) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card">
        <CardContent className="py-5">
          <ProfileCard student={profile} />
        </CardContent>
      </Card>
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Personal information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground">
          <div>
            <div className="text-muted-foreground text-xs">Display ID</div>
            <div>{profile.displayId || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Year</div>
            <div>{profile.currentYear ? `Year ${profile.currentYear}` : (profile.currentSemester ?? "Not set")}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">First name</div>
            <div>{profile.firstName || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Last name</div>
            <div>{profile.lastName || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Email</div>
            <div>{profile.email || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Phone</div>
            <div>{profile.phone || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Program</div>
            <div>{profile.program || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Major</div>
            <div>{profile.major || "Not set"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Faculty</div>
            <div>{profile.faculty || "Not set"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Supervisor</div>
            <div>{profile.supervisorName || "Not assigned"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Enrollment Date</div>
            <div>{profile.enrollmentDate ? new Date(profile.enrollmentDate).toLocaleDateString() : "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Date of Birth</div>
            <div>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Age</div>
            <div>{(function(){if(!profile.dateOfBirth) return "-"; const d=new Date(profile.dateOfBirth); if(Number.isNaN(d.getTime())) return "-"; return String(Math.floor((Date.now()-d.getTime())/31557600000));})()}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Gender</div>
            <div>{profile.gender || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Nationality</div>
            <div>{profile.nationality || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Blood Type</div>
            <div>{profile.bloodType || "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">National ID</div>
            <div>{profile.nationalId || "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Passport Number</div>
            <div>{profile.passportNumber || "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Address</div>
            <div>{profile.address || "Not provided"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">City</div>
            <div>{profile.city || "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Postal Code</div>
            <div>{profile.postalCode || "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Mother Name</div>
            <div>{profile.motherName || "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Father Name</div>
            <div>{profile.fatherName || "-"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

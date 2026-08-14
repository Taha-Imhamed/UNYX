"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import type { AccessProfile, CustomRoleTemplate, Permission, User } from "@shared/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, MoreHorizontal, Pencil, Trash2, Shield, UserIcon, Lock, ChevronDown, ChevronUp, BarChart3, Fingerprint, Save, Sparkles, ShieldCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { createCustomRole, createUser, deleteCustomRole, deleteUser, fetchCustomRoles, fetchUsers, updateCustomRole, updateUser } from "@/lib/users-api"
import { fetchAcademicStructure, type AcademicStructure } from "@/lib/enrollment-api"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"

const permissionOptions: Array<{ id: Permission; label: string; description: string; category: string }> = [
  { id: "users:manage", label: "User admin", description: "Create, edit, or remove user accounts and permission models.", category: "Identity" },
  { id: "users:create", label: "User create", description: "Open controlled account provisioning workflows.", category: "Identity" },
  { id: "users:edit", label: "User edit", description: "Change usernames, mappings, and account metadata.", category: "Identity" },
  { id: "users:delete", label: "User delete", description: "Remove portal accounts and linked access.", category: "Identity" },
  { id: "students:view", label: "Students view", description: "Open student tables and student dashboard modules.", category: "Academics" },
  { id: "students:create", label: "Students create", description: "Create linked student profiles and registrar records.", category: "Academics" },
  { id: "students:edit", label: "Students edit", description: "Update student identity, academic, and contact data.", category: "Academics" },
  { id: "students:delete", label: "Students delete", description: "Remove student records from admin workflows.", category: "Academics" },
  { id: "professors:view", label: "Professors view", description: "Open professor tables and academic staff modules.", category: "Academics" },
  { id: "professors:create", label: "Professors create", description: "Create professor profiles and linked accounts.", category: "Academics" },
  { id: "professors:edit", label: "Professors edit", description: "Update academic staff identity and employment data.", category: "Academics" },
  { id: "professors:delete", label: "Professors delete", description: "Remove professor records from the system.", category: "Academics" },
  { id: "enrollment:view", label: "Enrollment view", description: "View courses, seats, and enrollment requests.", category: "Enrollment" },
  { id: "enrollment:manage", label: "Enrollment manage", description: "Approve, deny, or restructure enrollment activity.", category: "Enrollment" },
  { id: "enrollment:self", label: "Self enrollment", description: "Allow self-service enrollment flows for the assigned user.", category: "Enrollment" },
  { id: "enrollment:override-window", label: "Window override", description: "Bypass standard enrollment date windows.", category: "Enrollment" },
  { id: "enrollment:override-capacity", label: "Capacity override", description: "Permit enrollments after a course is full.", category: "Enrollment" },
  { id: "marketing:view", label: "Marketing view", description: "View campaigns and announcements.", category: "Operations" },
  { id: "marketing:manage", label: "Marketing manage", description: "Publish or edit announcements and campaigns.", category: "Operations" },
  { id: "applications:view", label: "Applications view", description: "See admissions applications and related dashboard items.", category: "Operations" },
  { id: "applications:manage", label: "Applications manage", description: "Review and act on admissions decision queues.", category: "Operations" },
  { id: "finance:view", label: "Finance view", description: "View ledgers, payments, and dashboards.", category: "Operations" },
  { id: "finance:manage", label: "Finance manage", description: "Adjust ledgers, post transactions, and approvals.", category: "Operations" },
  { id: "finance:approve", label: "Finance approve", description: "Approve sensitive financial changes and settlements.", category: "Operations" },
  { id: "VIEW_FINANCIALS", label: "View financials", description: "Open protected finance modules and exported financial records.", category: "Operations" },
  { id: "feedback:view", label: "Feedback view", description: "Open feedback queues and support dashboard items.", category: "Operations" },
  { id: "feedback:manage", label: "Feedback manage", description: "Resolve, close, and route feedback cases.", category: "Operations" },
  { id: "news:view", label: "News view", description: "Open news and announcement modules.", category: "Operations" },
  { id: "news:manage", label: "News manage", description: "Draft, publish, and retract institutional news.", category: "Operations" },
  { id: "audit:view", label: "Audit view", description: "Open audit logs and security review pages.", category: "Security" },
  { id: "audit:export", label: "Audit export", description: "Export or archive sensitive audit material.", category: "Security" },
  { id: "reports:view", label: "Reports view", description: "View analytics and dashboards.", category: "Security" },
  { id: "reports:export", label: "Reports export", description: "Export report packs and analytics bundles.", category: "Security" },
  { id: "ADMIN_VIEW_SCHEDULE", label: "Schedule drill-down", description: "Inspect the full university schedule by time slot.", category: "Operations" },
  { id: "MANAGE_RESOURCES", label: "Manage resources", description: "Reassign rooms and work with detailed room availability.", category: "Operations" },
  { id: "ENTER_GRADES", label: "Enter grades", description: "Enter coursework grades for assigned professor sections.", category: "Academics" },
  { id: "settings:manage", label: "Settings manage", description: "Change system or policy settings.", category: "Security" },
  { id: "settings:security", label: "Security settings", description: "Edit security-sensitive platform controls.", category: "Security" },
  { id: "settings:integrations", label: "Integrations", description: "Manage external platform connections.", category: "Security" },
  { id: "settings:sso", label: "SSO settings", description: "Configure identity provider and SSO controls.", category: "Security" },
]

const roleOptions: Array<{ value: User["role"]; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "super-admin", label: "Super Admin" },
  { value: "supervisor", label: "Supervisor" },
  { value: "user", label: "User" },
  { value: "student", label: "Student" },
  { value: "professor", label: "Professor" },
  { value: "advisor", label: "Advisor" },
  { value: "teaching-assistant", label: "Teaching Assistant" },
  { value: "registrar", label: "Registrar" },
  { value: "admissions", label: "Admissions" },
  { value: "finance", label: "Finance" },
  { value: "it-admin", label: "IT Admin" },
  { value: "dean", label: "Dean" },
  { value: "hod", label: "Head of Department" },
  { value: "librarian", label: "Librarian" },
  { value: "student-affairs", label: "Student Affairs" },
  { value: "hr", label: "HR" },
  { value: "security", label: "Security" },
  { value: "facilities", label: "Facilities" },
  { value: "research-office", label: "Research Office" },
]

const accessProfileOptions: Array<{ key: keyof AccessProfile; label: string; description: string }> = [
  { key: "allowEnrollmentAnytime", label: "Enroll anytime", description: "Let this account bypass course opening and closing windows." },
  { key: "allowEnrollmentWhenClosed", label: "Ignore enrollment closure", description: "Allow enrollment even when administration has closed registration." },
  { key: "allowEnrollmentOverCapacity", label: "Over-capacity enrollment", description: "Allow course registration after seats are exhausted." },
  { key: "allowDeveloperWorkspace", label: "Developer workspace", description: "Unlock the technical workspace and deep system controls." },
  { key: "allowSensitiveSettings", label: "Sensitive settings", description: "Permit changes to high-risk platform configuration areas." },
  { key: "allowAuditExports", label: "Audit exports", description: "Allow export of security and audit evidence." },
  { key: "allowUserLifecycleManagement", label: "Identity lifecycle", description: "Grant end-to-end control over account activation and retirement." },
  { key: "allowStudentLifecycleManagement", label: "Student lifecycle", description: "Grant full control over detailed student record changes." },
  { key: "allowProfessorLifecycleManagement", label: "Professor lifecycle", description: "Grant full control over professor record changes." },
  { key: "allowFinanceApprovals", label: "Finance approvals", description: "Allow high-trust financial approval actions." },
  { key: "allowApplicationDecisions", label: "Admissions decisions", description: "Allow final decisions on application workflows." },
  { key: "allowNewsPublishing", label: "News publishing", description: "Allow drafting and publishing institutional announcements." },
]

const permissionCategories = ["Identity", "Academics", "Enrollment", "Operations", "Security"] as const

const USER_SUMMARY_STORAGE_KEY = "admin_users_summary_open"
const lightInputClass = "border-slate-200 bg-white shadow-sm"
const lightInfoBoxClass = "rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
const lightPermissionBoxClass = "flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
const lightActionButtonClass = "border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700"
const studentProfileInputClass = "border-slate-200 bg-slate-50 shadow-sm"

const studentProfileFields = [
  ["studentFirstName", "First Name"],
  ["studentMiddleName", "Middle Name"],
  ["studentLastName", "Last Name"],
  ["studentPhone", "Phone"],
  ["studentProgram", "Program"],
  ["studentMajor", "Major"],
  ["studentFaculty", "Faculty"],
  ["studentGender", "Gender"],
  ["studentNationality", "Nationality"],
  ["studentBloodType", "Blood Type"],
  ["studentNationalId", "National ID"],
  ["studentPassportNumber", "Passport Number"],
  ["studentAddress", "Address"],
  ["studentCity", "City"],
  ["studentPostalCode", "Postal Code"],
  ["studentEmergencyContactName", "Emergency Contact Name"],
  ["studentEmergencyContactPhone", "Emergency Contact Phone"],
  ["studentMotherName", "Mother Name"],
  ["studentFatherName", "Father Name"],
] as const

function getTrimmed(formData: FormData, key: string) {
  return ((formData.get(key) as string | null) ?? "").trim()
}

function buildStudentProfilePayload(formData: FormData, fallbackEmail: string) {
  const currentYear = Number(formData.get("studentCurrentYear") ?? 1)
  const payload: Record<string, unknown> = {
    firstName: getTrimmed(formData, "studentFirstName"),
    middleName: getTrimmed(formData, "studentMiddleName") || undefined,
    lastName: getTrimmed(formData, "studentLastName"),
    email: getTrimmed(formData, "studentEmail") || fallbackEmail,
    phone: getTrimmed(formData, "studentPhone"),
    enrollmentDate: getTrimmed(formData, "studentEnrollmentDate") || undefined,
    program: getTrimmed(formData, "studentProgram"),
    major: getTrimmed(formData, "studentMajor") || undefined,
    programId: getTrimmed(formData, "studentMajorId") || undefined,
    faculty: getTrimmed(formData, "studentFaculty") || undefined,
    facultyId: getTrimmed(formData, "studentDepartmentId") || undefined,
    currentYear: Number.isFinite(currentYear) && currentYear > 0 ? currentYear : 1,
    status: (formData.get("studentStatus") as string | null) ?? "active",
    address: getTrimmed(formData, "studentAddress"),
    city: getTrimmed(formData, "studentCity") || undefined,
    postalCode: getTrimmed(formData, "studentPostalCode") || undefined,
    dateOfBirth: getTrimmed(formData, "studentDateOfBirth") || undefined,
    gender: getTrimmed(formData, "studentGender") || undefined,
    nationality: getTrimmed(formData, "studentNationality") || undefined,
    nationalId: getTrimmed(formData, "studentNationalId") || undefined,
    passportNumber: getTrimmed(formData, "studentPassportNumber") || undefined,
    bloodType: getTrimmed(formData, "studentBloodType") || undefined,
    emergencyContactName: getTrimmed(formData, "studentEmergencyContactName") || undefined,
    emergencyContactPhone: getTrimmed(formData, "studentEmergencyContactPhone") || undefined,
    motherName: getTrimmed(formData, "studentMotherName") || undefined,
    fatherName: getTrimmed(formData, "studentFatherName") || undefined,
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "" || payload[key] === undefined) {
      delete payload[key]
    }
  })

  return payload
}

function StudentAccountFields() {
  const [structure, setStructure] = useState<AcademicStructure | null>(null)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [selectedMajorId, setSelectedMajorId] = useState<string>("")

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const s = await fetchAcademicStructure()
        if (!active) return
        setStructure(s)
        const firstDept = s?.departments?.[0]?.id
        setSelectedDepartmentId(firstDept ?? "")
        const firstMajor = s?.majors?.find((m) => m.departmentId === firstDept)?.id
        setSelectedMajorId(firstMajor ?? "")
      } catch (err) {
        // ignore - fallback to text inputs
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const departments = structure?.departments ?? []
  const majors = structure?.majors ?? []

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="space-y-1">
        <Label className="text-sm font-semibold">Student Profile Details</Label>
        <p className="text-xs text-muted-foreground">
          These fields are saved into the linked student record when the account is created.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="studentEmail">Student Email</Label>
          <Input id="studentEmail" name="studentEmail" type="email" className={studentProfileInputClass} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentPhone">Phone</Label>
          <Input id="studentPhone" name="studentPhone" className={studentProfileInputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {studentProfileFields.slice(0, 3).map(([name, label]) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} className={studentProfileInputClass} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="studentEnrollmentDate">Enrollment Date</Label>
          <Input id="studentEnrollmentDate" name="studentEnrollmentDate" type="date" className={studentProfileInputClass} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentDateOfBirth">Date of Birth</Label>
          <Input id="studentDateOfBirth" name="studentDateOfBirth" type="date" className={studentProfileInputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {studentProfileFields.slice(4, 7).map(([name, label]) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} className={studentProfileInputClass} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="studentCurrentYear">Current Year</Label>
          <Input id="studentCurrentYear" name="studentCurrentYear" type="number" min={1} max={8} defaultValue={1} className={studentProfileInputClass} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentStatus">Student Status</Label>
          <select id="studentStatus" name="studentStatus" defaultValue="active" className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentBloodType">Blood Type</Label>
          <Input id="studentBloodType" name="studentBloodType" className={studentProfileInputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {studentProfileFields.slice(7, 10).map(([name, label]) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} className={studentProfileInputClass} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {studentProfileFields.slice(10, 12).map(([name, label]) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} className={studentProfileInputClass} />
          </div>
        ))}
      </div>
      {/* Program + Major selects (fallback to text if no academic structure) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="studentProgram">Program</Label>
          {departments.length > 0 ? (
            <>
              <Select value={selectedDepartmentId} onValueChange={(v) => { setSelectedDepartmentId(v); setSelectedMajorId(majors.find((m) => m.departmentId === v)?.id ?? ""); }}>
                <SelectTrigger id="studentProgram" className={studentProfileInputClass}>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem value={d.id} key={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
               </Select>
               <Input type="hidden" name="studentDepartmentId" value={selectedDepartmentId} />
               <Input type="hidden" name="studentProgram" value={departments.find((d) => d.id === selectedDepartmentId)?.name ?? ""} />
             </>
          ) : (
            <Input id="studentProgram" name="studentProgram" className={studentProfileInputClass} />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentMajor">Major</Label>
          {majors.length > 0 ? (
            <>
              <Select value={selectedMajorId} onValueChange={(v) => setSelectedMajorId(v)}>
                <SelectTrigger id="studentMajor" className={studentProfileInputClass}>
                  <SelectValue placeholder="Select major" />
                </SelectTrigger>
                <SelectContent>
                  {(majors.filter((m) => !selectedDepartmentId || m.departmentId === selectedDepartmentId)).map((m) => (
                    <SelectItem value={m.id} key={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="hidden" name="studentMajorId" value={selectedMajorId} />
              <Input type="hidden" name="studentMajor" value={majors.find((m) => m.id === selectedMajorId)?.name ?? ""} />
            </>
          ) : (
            <Input id="studentMajor" name="studentMajor" className={studentProfileInputClass} />
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="studentAddress">Address</Label>
          <Input id="studentAddress" name="studentAddress" className={studentProfileInputClass} />
        </div>
        {studentProfileFields.slice(13, 15).map(([name, label]) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} className={studentProfileInputClass} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {studentProfileFields.slice(15, 19).map(([name, label]) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} className={studentProfileInputClass} />
          </div>
        ))}
      </div>
    </div>
  )
}

function getRoleLabel(role: User["role"]) {
  return roleOptions.find((option) => option.value === role)?.label ?? role
}

function clonePermissions(permissions?: Partial<Record<Permission, boolean>>) {
  return { ...(permissions ?? {}) }
}

function cloneAccessProfile(profile?: AccessProfile) {
  return { ...(profile ?? {}) }
}

function PermissionMatrix({
  permissions,
  onChange,
}: {
  permissions: Partial<Record<Permission, boolean>>
  onChange: React.Dispatch<React.SetStateAction<Partial<Record<Permission, boolean>>>>
}) {
  return (
    <div className="space-y-4">
      {permissionCategories.map((category) => (
        <div key={category} className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{category}</p>
            <p className="text-xs text-muted-foreground">Fine-grained controls for the {category.toLowerCase()} layer.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {permissionOptions
              .filter((option) => option.category === category)
              .map((option) => (
                <div key={option.id} className={lightPermissionBoxClass}>
                  <div className="space-y-0.5 pr-3">
                    <p className="text-sm font-semibold text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch
                    checked={Boolean(permissions[option.id])}
                    onCheckedChange={(value) => onChange((prev) => ({ ...prev, [option.id]: value }))}
                  />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AccessProfileMatrix({
  profile,
  onChange,
}: {
  profile: AccessProfile
  onChange: React.Dispatch<React.SetStateAction<AccessProfile>>
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {accessProfileOptions.map((option) => (
          <div key={option.key} className={lightPermissionBoxClass}>
            <div className="space-y-0.5 pr-3">
              <p className="text-sm font-semibold text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
            <Switch
              checked={Boolean(profile[option.key])}
              onCheckedChange={(value) => onChange((prev) => ({ ...prev, [option.key]: value }))}
            />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="access-profile-notes">Sensitive Notes</Label>
        <Textarea
          id="access-profile-notes"
          value={profile.notes ?? ""}
          onChange={(event) => onChange((prev) => ({ ...prev, notes: event.target.value }))}
          className={lightInputClass}
          rows={3}
          placeholder="Describe what makes this custom access pattern special."
        />
      </div>
    </div>
  )
}

function SecondaryRolePicker({
  primaryRole,
  value,
  onChange,
}: {
  primaryRole: User["role"]
  value: User["role"][]
  onChange: (roles: User["role"][]) => void
}) {
  const options = roleOptions.filter((option) => option.value !== primaryRole)
  return (
    <div className="space-y-2">
      <Label>Extra roles</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = value.includes(option.value)
          return (
            <label key={option.value} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? Array.from(new Set([...value, option.value]))
                      : value.filter((entry) => entry !== option.value),
                  )
                }
              />
              <span>{option.label}</span>
            </label>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">Example: main role professor, extra role advisor.</p>
    </div>
  )
}

export default function UsersPage() {
  const { isLoading, adminResetPassword, hasPermission } = useAuth()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [customRoles, setCustomRoles] = useState<CustomRoleTemplate[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [isRolesLoading, setIsRolesLoading] = useState(true)
  const [isSavingAdd, setIsSavingAdd] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isSavingCustomRole, setIsSavingCustomRole] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isDeletingCustomRoleId, setIsDeletingCustomRoleId] = useState<string | null>(null)
  const [deleteRoleState, setDeleteRoleState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)
  const [deleteUserState, setDeleteUserState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [addRole, setAddRole] = useState<User["role"]>("user")
  const [addCustomRoleId, setAddCustomRoleId] = useState<string>("none")
  const [addCustomRoleName, setAddCustomRoleName] = useState("")
  const [addCustomRoleDescription, setAddCustomRoleDescription] = useState("")
  const [addStudentId, setAddStudentId] = useState("")
  const [addProfessorId, setAddProfessorId] = useState("")
  const [addSecondaryRoles, setAddSecondaryRoles] = useState<User["role"][]>([])
  const [editRole, setEditRole] = useState<User["role"]>("user")
  const [editCustomRoleId, setEditCustomRoleId] = useState<string>("none")
  const [editCustomRoleName, setEditCustomRoleName] = useState("")
  const [editCustomRoleDescription, setEditCustomRoleDescription] = useState("")
  const [editStudentId, setEditStudentId] = useState("")
  const [editProfessorId, setEditProfessorId] = useState("")
  const [editSecondaryRoles, setEditSecondaryRoles] = useState<User["role"][]>([])
  const [newPermissions, setNewPermissions] = useState<Partial<Record<Permission, boolean>>>({})
  const [editPermissions, setEditPermissions] = useState<Partial<Record<Permission, boolean>>>({})
  const [addAccessProfile, setAddAccessProfile] = useState<AccessProfile>({})
  const [editAccessProfile, setEditAccessProfile] = useState<AccessProfile>({})
  const [resetTargetUserId, setResetTargetUserId] = useState<string>("")
  const [resetNewPassword, setResetNewPassword] = useState("")
  const [resetConfirmPassword, setResetConfirmPassword] = useState("")
  const [resetReason, setResetReason] = useState("Security rotation")
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const canManageUsers = hasPermission("users:manage")
  const [pendingRefresh, setPendingRefresh] = useState(false)
  const hasOpenModal = isAddOpen || isEditOpen

  // Redirect non-admins
  useEffect(() => {
    if (!isLoading && !canManageUsers) {
      router.push("/dashboard")
    }
  }, [canManageUsers, isLoading, router])

  useEffect(() => {
    if (isLoading || !canManageUsers) return
    if (hasOpenModal) {
      setPendingRefresh(true)
      return
    }

    let active = true

    const loadUsers = async () => {
      setIsUsersLoading(true)
      try {
        const data = await fetchUsers()
        if (!active) return
        setUsers(data)
      } catch (error) {
        console.error("User fetch failed", error)
        if (active) {
          toast({
            variant: "destructive",
            title: "Unable to load users",
            description: "Check your permissions or backend connection.",
          })
        }
      } finally {
        if (active) {
          setIsUsersLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      active = false
    }
  }, [toast, isLoading, canManageUsers, hasOpenModal, refreshVersion])

  useEffect(() => {
    if (isLoading || !canManageUsers) return

    let active = true

    const loadCustomRoles = async () => {
      setIsRolesLoading(true)
      try {
        const data = await fetchCustomRoles()
        if (!active) return
        setCustomRoles(data)
      } catch (error) {
        console.error("Custom roles fetch failed", error)
        if (active) {
          toast({
            variant: "destructive",
            title: "Unable to load custom roles",
            description: "The role library could not be loaded from the database.",
          })
        }
      } finally {
        if (active) {
          setIsRolesLoading(false)
        }
      }
    }

    loadCustomRoles()

    return () => {
      active = false
    }
  }, [canManageUsers, isLoading, refreshVersion, toast])

  useEffect(() => {
    if (!pendingRefresh || hasOpenModal || isLoading || !canManageUsers) return
    let active = true
    const reload = async () => {
      setIsUsersLoading(true)
      try {
        const data = await fetchUsers()
        if (!active) return
        setUsers(data)
      } catch (error) {
        console.error("User fetch failed", error)
        if (active) {
          toast({
            variant: "destructive",
            title: "Unable to load users",
            description: "Check your permissions or backend connection.",
          })
        }
      } finally {
        if (active) {
          setIsUsersLoading(false)
          setPendingRefresh(false)
        }
      }
    }
    reload()
    return () => {
      active = false
    }
  }, [canManageUsers, hasOpenModal, isLoading, pendingRefresh, refreshVersion, toast])

  useEffect(() => {
    if (resetTargetUserId || users.length === 0) return
    setResetTargetUserId(users[0].id)
  }, [resetTargetUserId, users])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(USER_SUMMARY_STORAGE_KEY)
    if (stored === "true") setIsSummaryOpen(true)
    if (stored === "false") setIsSummaryOpen(false)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(USER_SUMMARY_STORAGE_KEY, String(isSummaryOpen))
  }, [isSummaryOpen])

  useEffect(() => {
    if (selectedUser) {
      setEditPermissions(clonePermissions(selectedUser.permissions))
      setEditRole(selectedUser.role)
      setEditCustomRoleId(selectedUser.customRoleId ?? "none")
      setEditCustomRoleName(selectedUser.customRoleName ?? "")
      setEditCustomRoleDescription(
        customRoles.find((role) => role.id === selectedUser.customRoleId)?.description ?? "",
      )
      setEditStudentId(selectedUser.studentId ?? "")
      setEditProfessorId(selectedUser.professorId ?? "")
      setEditSecondaryRoles(selectedUser.secondaryRoles ?? [])
      setEditAccessProfile(cloneAccessProfile(selectedUser.accessProfile))
    } else {
      setEditPermissions({})
      setEditRole("user")
      setEditCustomRoleId("none")
      setEditCustomRoleName("")
      setEditCustomRoleDescription("")
      setEditStudentId("")
      setEditProfessorId("")
      setEditSecondaryRoles([])
      setEditAccessProfile({})
    }
  }, [customRoles, selectedUser])

  const applyTemplateToAddForm = (templateId: string) => {
    if (templateId === "none") {
      setAddCustomRoleId("none")
      setAddCustomRoleName("")
      setAddCustomRoleDescription("")
      return
    }

    const template = customRoles.find((entry) => entry.id === templateId)
    if (!template) return
    setAddRole(template.baseRole)
    setAddCustomRoleId(template.id)
    setAddCustomRoleName(template.name)
    setAddCustomRoleDescription(template.description ?? "")
    setNewPermissions(clonePermissions(template.permissions))
    setAddAccessProfile(cloneAccessProfile(template.accessProfile))
  }

  const applyTemplateToEditForm = (templateId: string) => {
    if (templateId === "none") {
      setEditCustomRoleId("none")
      setEditCustomRoleName("")
      setEditCustomRoleDescription("")
      return
    }

    const template = customRoles.find((entry) => entry.id === templateId)
    if (!template) return
    setEditRole(template.baseRole)
    setEditCustomRoleId(template.id)
    setEditCustomRoleName(template.name)
    setEditCustomRoleDescription(template.description ?? "")
    setEditPermissions(clonePermissions(template.permissions))
    setEditAccessProfile(cloneAccessProfile(template.accessProfile))
  }

  const saveCustomRoleTemplate = async (mode: "add" | "edit") => {
    const role = mode === "add" ? addRole : editRole
    const customRoleId = mode === "add" ? addCustomRoleId : editCustomRoleId
    const name = (mode === "add" ? addCustomRoleName : editCustomRoleName).trim()
    const description = (mode === "add" ? addCustomRoleDescription : editCustomRoleDescription).trim()
    const permissions = mode === "add" ? newPermissions : editPermissions
    const accessProfile = mode === "add" ? addAccessProfile : editAccessProfile

    if (!name) {
      toast({
        variant: "destructive",
        title: "Custom role name required",
        description: "Name the custom role before saving it to the role library.",
      })
      return
    }

    try {
      setIsSavingCustomRole(true)
      const saved =
        customRoleId !== "none"
          ? await updateCustomRole(customRoleId, {
              name,
              description: description || null,
              baseRole: role,
              permissions,
              accessProfile,
            })
          : await createCustomRole({
              name,
              description: description || null,
              baseRole: role,
              permissions,
              accessProfile,
            })

      setCustomRoles((prev) => {
        const next = prev.filter((entry) => entry.id !== saved.id)
        return [saved, ...next].sort((left, right) => left.name.localeCompare(right.name))
      })

      if (mode === "add") {
        setAddCustomRoleId(saved.id)
        setAddCustomRoleName(saved.name)
        setAddCustomRoleDescription(saved.description ?? "")
      } else {
        setEditCustomRoleId(saved.id)
        setEditCustomRoleName(saved.name)
        setEditCustomRoleDescription(saved.description ?? "")
      }

      toast({
        title: customRoleId !== "none" ? "Custom role updated" : "Custom role saved",
        description: `${saved.name} is now available in the role library.`,
      })
      // Refresh role library from backend to ensure UI shows authoritative list
      try {
        const latest = await fetchCustomRoles()
        setCustomRoles(latest)
      } catch (err) {
        console.warn("Failed to refresh custom roles after save", err)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to save custom role",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsSavingCustomRole(false)
    }
  }

  const requestDeleteCustomRole = (role: CustomRoleTemplate) => {
    setDeleteRoleState({ open: true, targetId: role.id, targetLabel: role.name, loading: false, error: null })
  }

  const confirmDeleteCustomRole = async () => {
    const roleId = deleteRoleState.targetId
    if (!roleId) return
    if (isDeletingCustomRoleId) return
    setIsDeletingCustomRoleId(roleId)
    setDeleteRoleState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await deleteCustomRole(roleId)
      setCustomRoles((prev) => prev.filter((entry) => entry.id !== roleId))
      if (addCustomRoleId === roleId) {
        setAddCustomRoleId("none")
        setAddCustomRoleName("")
        setAddCustomRoleDescription("")
      }
      if (editCustomRoleId === roleId) {
        setEditCustomRoleId("none")
        setEditCustomRoleName("")
        setEditCustomRoleDescription("")
      }
      toast({ title: "Custom role deleted" })
      setDeleteRoleState(emptyConfirmDeleteState)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to delete custom role",
        description: error instanceof Error ? error.message : "Unknown error",
      })
      setDeleteRoleState((prev) => ({ ...prev, loading: false, error: error instanceof Error ? error.message : "Unknown error" }))
    } finally {
      setIsDeletingCustomRoleId(null)
    }
  }

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSavingAdd) return

    const formData = new FormData(e.currentTarget)
    const password = (formData.get("password") as string | null)?.trim() ?? ""
    const confirmPassword = (formData.get("confirmPassword") as string | null)?.trim() ?? ""
    const username = (formData.get("username") as string | null)?.trim() ?? ""
    const email = (formData.get("email") as string | null)?.trim() ?? ""
    const role = addRole
    const studentId = addStudentId.trim()
    const professorId = addProfessorId.trim()
    const customRoleId = addCustomRoleId !== "none" ? addCustomRoleId : null
    const customRoleName = addCustomRoleName.trim() || null
    const secondaryRoles = addSecondaryRoles.filter((entry) => entry !== role)
    const studentProfile = role === "student" ? buildStudentProfilePayload(formData, email) : undefined

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Make sure both password fields match.",
      })
      return
    }

    if (!username || !email) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Username and email are required.",
      })
      return
    }

    try {
      setIsSavingAdd(true)
      const created = await createUser({
        username,
        email,
        role,
        secondaryRoles,
        password,
        permissions: newPermissions,
        customRoleId,
        customRoleName,
        accessProfile: addAccessProfile,
        studentId: role === "student" && studentId ? studentId : undefined,
        professorId: role === "professor" && professorId ? professorId : undefined,
        student: studentProfile,
      })
      setUsers((prev) => [created, ...prev])
      setIsAddOpen(false)
      // In some cases the event target may be detached; guard before calling reset
      if (e.currentTarget) {
        e.currentTarget.reset()
      }
      setNewPermissions({})
      setAddAccessProfile({})
      setAddRole("user")
      setAddCustomRoleId("none")
      setAddCustomRoleName("")
      setAddCustomRoleDescription("")
      setAddStudentId("")
      setAddProfessorId("")
      setAddSecondaryRoles([])
      toast({ title: "User created", description: `${created.username} added` })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      toast({
        variant: "destructive",
        title: "Unable to create user",
        description: message,
      })
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser || isSavingEdit) return

    const formData = new FormData(e.currentTarget)
    const username = (formData.get("username") as string | null)?.trim() ?? selectedUser.username
    const email = (formData.get("email") as string | null)?.trim() ?? selectedUser.email
    const role = editRole
    const status = (formData.get("status") as string | null) === "inactive" ? "inactive" : "active"
    const studentId = editStudentId.trim()
    const professorId = editProfessorId.trim()
    const customRoleId = editCustomRoleId !== "none" ? editCustomRoleId : null
    const customRoleName = editCustomRoleName.trim() || null
    const secondaryRoles = editSecondaryRoles.filter((entry) => entry !== role)

    try {
      setIsSavingEdit(true)
      const updated = await updateUser(selectedUser.id, {
        username,
        email,
        role,
        secondaryRoles,
        status,
        permissions: editPermissions,
        customRoleId,
        customRoleName,
        accessProfile: editAccessProfile,
        studentId: role === "student" ? (studentId || null) : null,
        professorId: role === "professor" ? (professorId || null) : null,
      })
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updated : u)))
      setIsEditOpen(false)
      setSelectedUser(null)
      setEditPermissions({})
      setEditAccessProfile({})
      setEditStudentId("")
      setEditProfessorId("")
      setEditSecondaryRoles([])
      setEditRole("user")
      setEditCustomRoleId("none")
      setEditCustomRoleName("")
      setEditCustomRoleDescription("")
      toast({ title: "User updated", description: `${updated.username} saved` })
    } catch (error) {
      console.error("Update user failed", error)
      toast({
        variant: "destructive",
        title: "Unable to update user",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isResettingPassword) return

    const target = users.find((entry) => entry.id === resetTargetUserId)
    if (!target) {
      toast({
        variant: "destructive",
        title: "Select a user",
        description: "Choose which account to reset.",
      })
      return
    }

    if (!resetNewPassword.trim() || !resetConfirmPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Password required",
        description: "Enter and confirm the new password.",
      })
      return
    }

    if (resetNewPassword !== resetConfirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Make sure the new password and confirmation match exactly.",
      })
      return
    }

    if (resetNewPassword.length < 4) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Use at least 4 characters for the new password.",
      })
      return
    }

    setIsResettingPassword(true)

    try {
      const result = await adminResetPassword({
        targetUserId: resetTargetUserId,
        newPassword: resetNewPassword,
        reason: resetReason.trim() || undefined,
      })

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Reset failed",
          description: result.error ?? "Unable to reset password",
        })
        setIsResettingPassword(false)
        return
      }

      toast({
        title: "Password rotated",
        description: `${target.username}'s password was reset and they were notified${result.message ? ` (${result.message})` : ""}.`,
      })

      setResetNewPassword("")
      setResetConfirmPassword("")
    } catch (error) {
      console.error("Admin reset failed", error)
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Unable to reset password",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  const requestDeleteUser = (user: User) => {
    setDeleteUserState({ open: true, targetId: user.id, targetLabel: user.username || user.email, loading: false, error: null })
  }

  const confirmDeleteUser = async () => {
    const id = deleteUserState.targetId
    if (!id) return
    if (isDeletingId) return
    setIsDeletingId(id)
    setDeleteUserState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      toast({ title: "User deleted" })
      setDeleteUserState(emptyConfirmDeleteState)
    } catch (error) {
      console.error("Delete user failed", error)
      toast({
        variant: "destructive",
        title: "Unable to delete user",
        description: error instanceof Error ? error.message : "Unknown error",
      })
      setDeleteUserState((prev) => ({ ...prev, loading: false, error: error instanceof Error ? error.message : "Unknown error" }))
    } finally {
      setIsDeletingId(null)
    }
  }

  const columns = [
    {
      key: "username",
      header: "User",
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            {user.role === "admin" ? (
              <Shield className="h-4 w-4 text-primary" />
            ) : (
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{user.username}</p>
            <p className="text-sm text-muted-foreground">{user.id}</p>
          </div>
        </div>
      ),
    },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (user: User) => (
        <div className="flex flex-col gap-1">
          <Badge
            variant={
              user.role === "admin"
                ? "default"
                : user.role === "supervisor"
                  ? "outline"
                  : user.role === "student"
                    ? "secondary"
                    : "secondary"
            }
            className="capitalize"
          >
            {getRoleLabel(user.role)}
          </Badge>
          {user.customRoleName ? (
            <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-amber-800">
              {user.customRoleName}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (user: User) => <span className="text-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (user: User) => (
        <span className="text-foreground">
          {user.lastLogin === "-" ? "-" : new Date(user.lastLogin).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user: User) => (
        <Badge
          variant="outline"
          className={
            user.status === "active"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }
        >
          {user.status}
        </Badge>
      ),
    },
  ]

  const roleCounts = users.reduce<Record<User["role"], number>>((acc, entry) => {
    acc[entry.role] = (acc[entry.role] ?? 0) + 1
    return acc
  }, {} as Record<User["role"], number>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!canManageUsers) {
    return null
  }

  if (isUsersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="User Management" description="Manage admin and user accounts" />

      <div className="flex-1 p-4 space-y-4">
        {/* Admin Notice */}
        <Alert className="border-primary/20 bg-primary/5">
          <Shield className="h-4 w-4 text-primary" />
          <AlertTitle className="text-foreground">Privileged Access</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Users with `users:manage` can create, edit, and delete portal accounts here, including registrar-managed student accounts.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new portal account. Student accounts can include a full registrar profile below.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" className={lightInputClass} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" className={lightInputClass} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    className={lightInputClass}
                    minLength={4}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className={lightInputClass}
                    minLength={4}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Card className="border-slate-200 bg-slate-50/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Custom Role Builder
                    </CardTitle>
                    <CardDescription>
                      Start from a base role, then apply a saved custom role or build one from scratch and save it for later reuse.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="custom-role-template">Saved custom role</Label>
                        <Select value={addCustomRoleId} onValueChange={applyTemplateToAddForm}>
                          <SelectTrigger id="custom-role-template" className={lightInputClass}>
                            <SelectValue placeholder="Select a saved custom role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No saved template</SelectItem>
                            {customRoles.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Base Role</Label>
                        <Select name="role" value={addRole} onValueChange={(value) => setAddRole(value as User["role"])}>
                          <SelectTrigger className={lightInputClass}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <SecondaryRolePicker primaryRole={addRole} value={addSecondaryRoles} onChange={setAddSecondaryRoles} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="custom-role-name">Custom role name</Label>
                        <Input
                          id="custom-role-name"
                          value={addCustomRoleName}
                          onChange={(event) => setAddCustomRoleName(event.target.value)}
                          className={lightInputClass}
                          placeholder="Examples: Unlimited Enrollment Student, Developer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-role-description">Custom role description</Label>
                        <Input
                          id="custom-role-description"
                          value={addCustomRoleDescription}
                          onChange={(event) => setAddCustomRoleDescription(event.target.value)}
                          className={lightInputClass}
                          placeholder="What makes this role unusually powerful or specific?"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" className={lightActionButtonClass} onClick={() => saveCustomRoleTemplate("add")} disabled={isSavingCustomRole}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSavingCustomRole ? "Saving template..." : addCustomRoleId !== "none" ? "Update saved custom role" : "Save as custom role"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {addRole === "student" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID (optional)</Label>
                      <Input
                        id="studentId"
                        name="studentId"
                        value={addStudentId}
                        onChange={(e) => setAddStudentId(e.target.value)}
                        placeholder="Leave blank to auto-create"
                        className={lightInputClass}
                      />
                      <p className="text-xs text-muted-foreground">Leave empty to auto-create a student profile.</p>
                    </div>
                    <StudentAccountFields />
                  </>
                )}
                {addRole === "professor" && (
                  <div className="space-y-2">
                    <Label htmlFor="professorId">Professor ID (optional)</Label>
                    <Input
                      id="professorId"
                      name="professorId"
                      value={addProfessorId}
                      onChange={(e) => setAddProfessorId(e.target.value)}
                      placeholder="Leave blank to auto-create"
                      className={lightInputClass}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty to auto-create a professor profile.</p>
                  </div>
                )}
                <Card className="border-slate-200 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Permission Section
                    </CardTitle>
                    <CardDescription>
                      This is the deep control surface. Save the exact access footprint you want, including risky exception rules.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Detailed Permissions</Label>
                      <p className="text-xs text-muted-foreground">Enable or disable precise capabilities for this account. These values are stored in the database and can also be reused through the custom role library.</p>
                    </div>
                    <PermissionMatrix permissions={newPermissions} onChange={setNewPermissions} />
                    <div className="space-y-2">
                      <Label>Sensitive Access Rules</Label>
                      <p className="text-xs text-muted-foreground">High-trust exception switches for special accounts, such as a student who can enroll outside the normal window.</p>
                    </div>
                    <AccessProfileMatrix profile={addAccessProfile} onChange={setAddAccessProfile} />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-[#d4af37] text-black hover:bg-[#c79b2b] shadow-[0_8px_24px_rgba(212,175,55,0.45)]"
                        onClick={() => {
                          setNewPermissions({})
                          setAddAccessProfile({})
                        }}
                      >
                        Reset to role defaults
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingAdd}>
                    {isSavingAdd ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              Custom Role Library
            </CardTitle>
            <CardDescription>
              Save named permission blueprints to reuse when creating or editing users. Each template stores the base role, detailed permissions, and sensitive access rules in the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRolesLoading ? (
              <div className="text-sm text-muted-foreground">Loading saved custom roles...</div>
            ) : customRoles.length === 0 ? (
              <div className={lightInfoBoxClass}>
                <p className="font-semibold text-foreground">No saved custom roles yet</p>
                <p className="text-sm text-muted-foreground">Open Add User or Edit User, shape the permissions exactly how you want them, then save that pattern into this library.</p>
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {customRoles.map((role) => (
                  <div key={role.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{role.name}</p>
                          <Badge variant="outline">{getRoleLabel(role.baseRole)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{role.description || "No description saved."}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={lightActionButtonClass}
                        onClick={() => requestDeleteCustomRole(role)}
                        disabled={isDeletingCustomRoleId === role.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeletingCustomRoleId === role.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{Object.values(role.permissions ?? {}).filter(Boolean).length} live permissions</span>
                      <span>{accessProfileOptions.filter((option) => Boolean(role.accessProfile?.[option.key])).length} sensitive flags</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Collapsible open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
          <Card className="overflow-hidden border-border bg-card shadow-[0_16px_34px_-28px_rgba(21,99,197,0.18)]">
            <CardHeader className="border-b border-border/70 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    User Summary
                  </CardTitle>
                  <CardDescription>Total users, active accounts, and role distribution.</CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-full">
                    {isSummaryOpen ? "Hide Summary" : "Show Summary"}
                    {isSummaryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Card className="bg-card border-border px-4 py-3">
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{users.length}</p>
                  </Card>
                  <Card className="bg-card border-border px-4 py-3">
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-success">{users.filter((u) => u.status === "active").length}</p>
                  </Card>
                  {roleOptions.map((option) => (
                    <Card key={option.value} className="bg-card border-border px-4 py-3">
                      <p className="text-sm text-muted-foreground">{option.label}</p>
                      <p className="text-2xl font-bold text-primary">{roleCounts[option.value] ?? 0}</p>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Reset User Password
              </CardTitle>
              <CardDescription>Rotate credentials and notify the selected account instantly.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reset-user">Target user</Label>
                    <Select
                      value={resetTargetUserId}
                      onValueChange={setResetTargetUserId}
                      disabled={isUsersLoading || users.length === 0}
                    >
                      <SelectTrigger id="reset-user" className={lightInputClass}>
                        <SelectValue placeholder="Pick a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.length === 0 ? (
                          <SelectItem disabled value="none">
                            No users available
                          </SelectItem>
                        ) : (
                          users.map((entry) => (
                            <SelectItem key={entry.id} value={entry.id}>
                              {entry.username} ({entry.role})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-reason">Reason (optional)</Label>
                    <Input
                      id="reset-reason"
                      value={resetReason}
                      onChange={(event) => setResetReason(event.target.value)}
                      placeholder="Security rotation, lockout recovery, etc."
                      className={lightInputClass}
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reset-password">New password</Label>
                    <Input
                      id="reset-password"
                      type="password"
                      value={resetNewPassword}
                      onChange={(event) => setResetNewPassword(event.target.value)}
                      className={lightInputClass}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-confirm">Confirm new password</Label>
                    <Input
                      id="reset-confirm"
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(event) => setResetConfirmPassword(event.target.value)}
                      className={lightInputClass}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isResettingPassword || isUsersLoading || users.length === 0 || !resetTargetUserId}
                >
                  {isResettingPassword ? "Resetting..." : "Reset and Notify"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                Access Architecture
              </CardTitle>
              <CardDescription>Base roles anchor the account. Saved custom roles and the detailed permission section let you go far beyond the default matrix.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="grid gap-2 md:grid-cols-2">
                <div className={lightInfoBoxClass}>
                  <p className="font-semibold text-foreground">Base role</p>
                  <p>The system workspace and default navigation start here.</p>
                </div>
                <div className={lightInfoBoxClass}>
                  <p className="font-semibold text-foreground">Custom role template</p>
                  <p>A named blueprint stored in the database for future reuse.</p>
                </div>
                <div className={lightInfoBoxClass}>
                  <p className="font-semibold text-foreground">Detailed permissions</p>
                  <p>Fine-grained feature switches for identity, academics, operations, and security.</p>
                </div>
                <div className={lightInfoBoxClass}>
                  <p className="font-semibold text-foreground">Sensitive access rules</p>
                  <p>Special-case exceptions like enroll-anytime or developer workspace access.</p>
                </div>
              </div>
              <p className="text-xs">Everything configured in the role builder is written back to the database, including saved role templates and per-user exception rules.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={users}
              columns={columns}
              searchPlaceholder="Search users..."
              searchKeys={["username", "email", "role", "status", "id"]}
              filterKey="role"
              filterOptions={roleOptions.map((option) => ({ value: option.value, label: option.label }))}
              filterPlaceholder="Role"
              actions={(user) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className={lightActionButtonClass}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(user)
                        setEditPermissions(user.permissions ?? {})
                        setIsEditOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => requestDeleteUser(user)}
                      disabled={user.username === "admin" || isDeletingId === user.id}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user account details.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  name="username"
                  defaultValue={selectedUser.username}
                  className={lightInputClass}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={selectedUser.email}
                  className={lightInputClass}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={selectedUser.status}>
                    <SelectTrigger className={lightInputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned blueprint</Label>
                  <div className={lightInfoBoxClass}>
                    <p className="font-semibold text-foreground">{selectedUser.customRoleName || "Standard system role"}</p>
                    <p className="text-xs text-muted-foreground">Current base role: {getRoleLabel(selectedUser.role)}</p>
                  </div>
                </div>
              </div>
              <Card className="border-slate-200 bg-slate-50/70">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Custom Role Builder
                  </CardTitle>
                  <CardDescription>Change the base role, attach a saved template, or rewrite the permission footprint and save it back into the role library.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-custom-role-template">Saved custom role</Label>
                      <Select value={editCustomRoleId} onValueChange={applyTemplateToEditForm}>
                        <SelectTrigger id="edit-custom-role-template" className={lightInputClass}>
                          <SelectValue placeholder="Select a saved custom role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No saved template</SelectItem>
                          {customRoles.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Base role</Label>
                      <Select
                        name="role"
                        value={editRole}
                        onValueChange={(value) => setEditRole(value as User["role"])}
                      >
                        <SelectTrigger className={lightInputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <SecondaryRolePicker primaryRole={editRole} value={editSecondaryRoles} onChange={setEditSecondaryRoles} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-custom-role-name">Custom role name</Label>
                      <Input
                        id="edit-custom-role-name"
                        value={editCustomRoleName}
                        onChange={(event) => setEditCustomRoleName(event.target.value)}
                        className={lightInputClass}
                        placeholder="Give this permission pattern a reusable name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-custom-role-description">Custom role description</Label>
                      <Input
                        id="edit-custom-role-description"
                        value={editCustomRoleDescription}
                        onChange={(event) => setEditCustomRoleDescription(event.target.value)}
                        className={lightInputClass}
                        placeholder="Why this role exists and what makes it special"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" className={lightActionButtonClass} onClick={() => saveCustomRoleTemplate("edit")} disabled={isSavingCustomRole}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSavingCustomRole ? "Saving template..." : editCustomRoleId !== "none" ? "Update saved custom role" : "Save as custom role"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {editRole === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-studentId">Student ID (optional)</Label>
                  <Input
                    id="edit-studentId"
                    name="studentId"
                    value={editStudentId}
                    onChange={(e) => setEditStudentId(e.target.value)}
                    placeholder="Leave blank to auto-create"
                    className={lightInputClass}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to auto-create a student profile.</p>
                </div>
              )}
              {editRole === "professor" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-professorId">Professor ID (optional)</Label>
                  <Input
                    id="edit-professorId"
                    name="professorId"
                    value={editProfessorId}
                    onChange={(e) => setEditProfessorId(e.target.value)}
                    placeholder="Leave blank to auto-create"
                    className={lightInputClass}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to auto-create a professor profile.</p>
                </div>
              )}
              <Card className="border-slate-200 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Permission Section
                  </CardTitle>
                  <CardDescription>Edit the granular permissions and sensitive exception switches for this account, then save them directly to the user record or into a reusable role template.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Detailed Permissions</Label>
                    <p className="text-xs text-muted-foreground">Turn capabilities on or off for this user regardless of their role.</p>
                  </div>
                  <PermissionMatrix permissions={editPermissions} onChange={setEditPermissions} />
                  <div className="space-y-2">
                    <Label>Sensitive Access Rules</Label>
                    <p className="text-xs text-muted-foreground">Use these switches for very specific power users, such as a student who can enroll at any time or a restricted developer account.</p>
                  </div>
                  <AccessProfileMatrix profile={editAccessProfile} onChange={setEditAccessProfile} />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#d4af37] text-black hover:bg-[#c79b2b] shadow-[0_8px_24px_rgba(212,175,55,0.45)]"
                      onClick={() => {
                        setEditPermissions({})
                        setEditAccessProfile({})
                      }}
                    >
                      Reset to role defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSavingEdit}>
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteAlert
        state={deleteRoleState}
        onOpenChange={(open) => {
          if (!open) setDeleteRoleState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmDeleteCustomRole}
        title="Delete custom role"
        description={`Removing ${deleteRoleState.targetLabel || "this custom role"} cannot be undone.`}
        confirmLabel="Delete custom role"
      />

      <ConfirmDeleteAlert
        state={deleteUserState}
        onOpenChange={(open) => {
          if (!open) setDeleteUserState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmDeleteUser}
        title="Delete user"
        description={`Removing ${deleteUserState.targetLabel || "this user"} cannot be undone.`}
        confirmLabel="Delete user"
      />
    </div>
  )
}

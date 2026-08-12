"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import appLogo from "../app logog  3 last.png"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import { AdminKpiCard } from "@/components/admin-kpi-card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  FileSearch,
  GraduationCap,
  Languages,
  LayoutDashboard,
  MonitorSmartphone,
  Megaphone,
  Palette,
  PlugZap,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  UserRoundCog,
  Users,
  WalletCards,
  Wrench,
  X,
  Zap,
} from "lucide-react"
import { Bell, BookOpen } from "lucide-react"
import { useModuleToggles } from "@/lib/terminal-context"
import { moduleKeyForHref } from "@/lib/terminal-modules"
import type { LucideIcon } from "lucide-react"
import { fetchUsers } from "@/lib/users-api"
import { fetchStudents } from "@/lib/enrollment-api"
import { fetchProfessors } from "@/lib/enrollment-api"
import { fetchCourses, fetchAcademicStructure, updateEnrollmentGlobalToggle } from "@/lib/enrollment-api"
import { fetchEnrollments } from "@/lib/enrollment-api"
import { fetchPayments, fetchIncome, fetchExpenses } from "@/lib/finance-api"
import { fetchQuestions } from "@/lib/questions-api"
import { fetchFeedback } from "@/lib/feedback-api"
import { fetchNews } from "@/lib/news-api"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type {
  User,
  Feedback,
  Income,
  VisitorLog,
  IncidentReport,
  IdCardAccess,
  MaintenanceRequest,
  EquipmentRequest,
  RoomBooking,
  ResearchGrant,
  Publication,
  ResearchRequest,
  SsoConfig,
  Integration,
  MaintenanceState,
  DeviceLog,
  EnrollmentOverride,
  TransferCredit,
  TranscriptRequest,
  GraduationApproval,
  ScholarshipAward,
  InterviewSchedule,
  OfferLetter,
} from "@shared/types"

type Role = User["role"]

interface WorkspaceMetrics {
  users: number
  students: number
  professors: number
  courses: number
  enrollments: number
  pendingApprovals: number
  completedEnrollments: number
  payments: number
  income: number
  expenses: number
  openQuestions: number
  pendingFeedback: number
  announcements: number
  unresolvedItems: number
  uniqueDepartments: number
  activeUsers: number
  visitorLogs: number
  incidentReports: number
  idCardAccess: number
  maintenanceRequests: number
  equipmentRequests: number
  roomBookings: number
  researchGrants: number
  publications: number
  researchRequests: number
  ssoConfigs: number
  integrations: number
  maintenanceEnabled: number
  deviceLogs: number
  enrollmentOverrides: number
  transferCredits: number
  transcriptRequests: number
  graduationApprovals: number
  scholarshipAwards: number
  interviewSchedules: number
  offerLetters: number
}

interface FeatureTile {
  label: string
  description: string
  metric: (metrics: WorkspaceMetrics) => string
  href?: string
  icon?: LucideIcon
  requiredPermissions?: Array<"users:manage" | "students:view" | "professors:view" | "marketing:view" | "marketing:manage" | "applications:view" | "finance:view" | "finance:manage" | "enrollment:view" | "enrollment:manage" | "feedback:view" | "news:view" | "audit:view" | "reports:view" | "settings:manage">
}

const zeroMetrics: WorkspaceMetrics = {
  users: 0,
  students: 0,
  professors: 0,
  courses: 0,
  enrollments: 0,
  pendingApprovals: 0,
  completedEnrollments: 0,
  payments: 0,
  income: 0,
  expenses: 0,
  openQuestions: 0,
  pendingFeedback: 0,
  announcements: 0,
  unresolvedItems: 0,
  uniqueDepartments: 0,
  activeUsers: 0,
  visitorLogs: 0,
  incidentReports: 0,
  idCardAccess: 0,
  maintenanceRequests: 0,
  equipmentRequests: 0,
  roomBookings: 0,
  researchGrants: 0,
  publications: 0,
  researchRequests: 0,
  ssoConfigs: 0,
  integrations: 0,
  maintenanceEnabled: 0,
  deviceLogs: 0,
  enrollmentOverrides: 0,
  transferCredits: 0,
  transcriptRequests: 0,
  graduationApprovals: 0,
  scholarshipAwards: 0,
  interviewSchedules: 0,
  offerLetters: 0,
}

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  "super-admin": "Super Admin",
  supervisor: "Supervisor",
  user: "User",
  student: "Student",
  professor: "Professor",
  advisor: "Academic Advisor",
  "teaching-assistant": "Teaching Assistant",
  registrar: "Registrar",
  admissions: "Admissions",
  finance: "Finance",
  "it-admin": "IT Admin",
  dean: "Dean",
  hod: "Head of Department",
  librarian: "Librarian",
  "student-affairs": "Student Affairs",
  hr: "HR",
  security: "Security",
  facilities: "Facilities",
  "research-office": "Research Office",
}

const roleFeatures: Partial<Record<Role, FeatureTile[]>> = {
  professor: [
    { label: "Assigned courses", description: "Courses currently assigned to you.", metric: (m) => `${m.courses} courses`, href: "/dashboard/professor" },
    { label: "Attendance management", description: "Manage attendance from enrolled class rosters.", metric: (m) => `${m.enrollments} roster records`, href: "/dashboard/professor" },
    { label: "Assignment creation", description: "Create coursework plans tied to your classes.", metric: (m) => `${m.courses} classes available`, href: "/dashboard/professor" },
    { label: "Quiz creation", description: "Use class Q&A streams for quiz and checks.", metric: (m) => `${m.openQuestions} open questions`, href: "/dashboard/professor" },
    { label: "Grade submissions", description: "Submit course grades per enrollment.", metric: (m) => `${m.enrollments} enrollments`, href: "/dashboard/professor/grade-submission" },
    { label: "Marks publishing", description: "Publish finalized marks after updates.", metric: (m) => `${m.completedEnrollments} completed`, href: "/dashboard/professor" },
    { label: "Student progress", description: "Track completion and approval progression.", metric: (m) => `${m.pendingApprovals} pending approvals`, href: "/dashboard/professor" },
    { label: "Messaging", description: "Reply to student course questions.", metric: (m) => `${m.openQuestions} unresolved`, href: "/dashboard/professor" },
    { label: "Announcements", description: "Publish class announcements.", metric: (m) => `${m.announcements} active news`, href: "/dashboard/news" },
  ],
  "teaching-assistant": [
    { label: "Assigned classes", description: "Classes currently in the active term.", metric: (m) => `${m.courses} classes`, href: "/dashboard/enrollment" },
    { label: "Attendance taking", description: "Track attendance from roster sheets.", metric: (m) => `${m.enrollments} enrolled students`, href: "/dashboard/professor" },
    { label: "Quiz marking", description: "Mark submissions from class assessments.", metric: (m) => `${m.openQuestions} pending responses`, href: "/dashboard/professor" },
    { label: "Homework grading", description: "Assist with ongoing grading workflows.", metric: (m) => `${m.completedEnrollments} completed records`, href: "/dashboard/professor" },
    { label: "Student support section", description: "Support requests from student channels.", metric: (m) => `${m.pendingFeedback} open feedback`, href: "/dashboard/feedback" },
    { label: "Lab materials upload", description: "Manage shared lab/course resources.", metric: (m) => `${m.courses} target courses`, href: "/dashboard/news" },
  ],
  advisor: [
    { label: "List of assigned students", description: "Students under advising scope.", metric: (m) => `${m.students} students`, href: "/dashboard/students" },
    { label: "Course approval actions", description: "Review and approve pending enrollments.", metric: (m) => `${m.pendingApprovals} awaiting action`, href: "/dashboard/enrollment" },
    { label: "GPA monitor", description: "Watch student completion performance trends.", metric: (m) => `${m.completedEnrollments} graded completions`, href: "/dashboard/students" },
    { label: "Attendance risk alerts", description: "Flag enrollment and participation risk.", metric: (m) => `${m.unresolvedItems} flagged records`, href: "/dashboard/enrollment" },
    { label: "Meeting scheduler", description: "Coordinate advising meetings with students.", metric: (m) => `${m.students} advisees`, href: "/dashboard/students" },
    { label: "Notes section", description: "Track advising notes and recommendations.", metric: (m) => `${m.pendingFeedback} open support notes`, href: "/dashboard/feedback" },
    { label: "Graduation progress tracker", description: "Measure completion and finalization progress.", metric: (m) => `${m.completedEnrollments} completed enrollments`, href: "/dashboard/students" },
  ],
  registrar: [
    { label: "Student records", description: "View and manage complete student records.", metric: (m) => `${m.students} records`, href: "/dashboard/students" },
    { label: "Enrollment management", description: "Control enrollment lifecycle and statuses.", metric: (m) => `${m.enrollments} enrollments`, href: "/dashboard/enrollment/enrollments" },
    { label: "Override controls", description: "Resolve exceptions and manual overrides.", metric: (m) => `${m.enrollmentOverrides} override records`, href: "/dashboard/enrollment/approvals" },
    { label: "Transcript generation", description: "Generate transcript-ready record sets.", metric: (m) => `${m.transcriptRequests} requests`, href: "/dashboard/students" },
    { label: "Graduation approvals", description: "Finalize graduation path approvals.", metric: (m) => `${m.graduationApprovals} approvals`, href: "/dashboard/students" },
    { label: "Schedule management", description: "Update class schedules and sections.", metric: (m) => `${m.courses} scheduled courses`, href: "/dashboard/enrollment/schedule" },
    { label: "Course catalog", description: "Maintain active course catalog.", metric: (m) => `${m.courses} catalog entries`, href: "/dashboard/enrollment/courses" },
    { label: "User accounts", description: "Create students and other portal accounts.", metric: (m) => `${m.users} user accounts`, href: "/dashboard/users" },
  ],
  admissions: [
    { label: "Application list", description: "Review incoming applicant pipeline.", metric: (m) => `${m.pendingApprovals} pending applications`, href: "/dashboard/applications" },
    { label: "Document verification", description: "Verify application documents and requirements.", metric: (m) => `${m.students} student records`, href: "/dashboard/students" },
    { label: "Interview scheduler", description: "Plan interviews for active candidates.", metric: (m) => `${m.interviewSchedules} scheduled interviews`, href: "/dashboard/admissions" },
    { label: "Approve/Reject/Waitlist", description: "Process admissions decision actions.", metric: (m) => `${m.offerLetters} decision letters`, href: "/dashboard/admissions" },
    { label: "Offer letter sender", description: "Publish offer and admission decisions.", metric: (m) => `${m.offerLetters} offer letters`, href: "/dashboard/admissions" },
    { label: "Scholarship management", description: "Track scholarship-related approvals.", metric: (m) => `${m.scholarshipAwards} scholarship awards`, href: "/dashboard/admissions" },
    { label: "Analytics", description: "Monitor admissions funnel and outcomes.", metric: (m) => `${m.users} total portal users`, href: "/dashboard/report" },
  ],
  finance: [
    { label: "Invoice generator", description: "Generate student billing invoices.", metric: (m) => `${m.enrollments} billable enrollments`, href: "/dashboard/finance" },
    { label: "Payment confirmations", description: "Confirm incoming payment transactions.", metric: (m) => `${m.payments} payment records`, href: "/dashboard/finance" },
    { label: "Refund approvals", description: "Review pending refund requests.", metric: (m) => `${m.pendingApprovals} pending financial approvals`, href: "/dashboard/finance" },
    { label: "Installment plans", description: "Track installment and remaining balances.", metric: (m) => `${m.students} student balances`, href: "/dashboard/finance" },
    { label: "Sponsorships", description: "Monitor sponsored payment flows.", metric: (m) => `${m.income} income entries`, href: "/dashboard/finance" },
    { label: "Unpaid balances", description: "Surface unpaid or overdue obligations.", metric: (m) => `${m.unresolvedItems} unresolved finance items`, href: "/dashboard/finance" },
    { label: "Financial reports", description: "Generate consolidated financial reports.", metric: (m) => `$${(m.income - m.expenses).toLocaleString()} net`, href: "/dashboard/report" },
  ],
  "it-admin": [
    { label: "User account management", description: "Manage all user accounts and statuses.", metric: (m) => `${m.users} user accounts`, href: "/dashboard/users" },
    { label: "Password reset", description: "Reset account passwords securely.", metric: (m) => `${m.activeUsers} active accounts`, href: "/dashboard/users" },
    { label: "Role assignment", description: "Assign and update system roles.", metric: (m) => `${m.users} role-bound users`, href: "/dashboard/users" },
    { label: "SSO config", description: "Manage identity provider integration setup.", metric: (m) => `${m.ssoConfigs} SSO records`, href: "/dashboard/settings" },
    { label: "Security logs", description: "Inspect security and access audit records.", metric: (m) => `${m.deviceLogs} device logs`, href: "/dashboard/it-admin/device-logs" },
    { label: "Device monitoring", description: "Track active endpoint and session health.", metric: (m) => `${m.deviceLogs} device events`, href: "/dashboard/it-admin/device-logs" },
    { label: "Backups", description: "Review backup and restore readiness.", metric: (m) => `${m.users} protected accounts`, href: "/dashboard/settings" },
    { label: "Audit trail", description: "Trace platform-wide administrative activity.", metric: (m) => `${m.unresolvedItems} audit exceptions`, href: "/dashboard/audit" },
    { label: "API/email/SMS settings", description: "Maintain external communication integrations.", metric: (m) => `${m.integrations} integration records`, href: "/dashboard/settings" },
    { label: "Maintenance mode toggle", description: "Control platform maintenance operations.", metric: (m) => `${m.maintenanceEnabled ? "ON" : "OFF"} system mode`, href: "/dashboard/settings" },
  ],
  dean: [
    { label: "Faculty analytics", description: "Open the dean summary view for faculty-wide performance and trends.", metric: (m) => `${m.professors} faculty members`, href: "/dashboard/report", icon: FileSearch },
    { label: "Budget approvals", description: "Review and approve department budget requests.", metric: (m) => `$${m.expenses.toLocaleString()} expenses`, href: "/dashboard/finance", icon: Building2 },
    { label: "Staff performance reviews", description: "Open the academic staff workspace for review and oversight.", metric: (m) => `${m.professors} staff records`, href: "/dashboard/professors", icon: Users },
    { label: "Student success reports", description: "Jump to student records and progression tracking.", metric: (m) => `${m.completedEnrollments} completed records`, href: "/dashboard/students", icon: GraduationCap },
    { label: "Accreditation reports", description: "Review accreditation evidence and reporting outputs.", metric: (m) => `${m.courses} active courses`, href: "/dashboard/report", icon: ShieldCheck },
    { label: "Department comparison", description: "Inspect department structures and compare coverage.", metric: (m) => `${m.uniqueDepartments} departments`, href: "/dashboard/enrollment/departments", icon: LayoutDashboard },
  ],
  hod: [
    { label: "Lecturer management", description: "Manage lecturer records and assignments.", metric: (m) => `${m.professors} lecturers`, href: "/dashboard/professors" },
    { label: "Teaching load assignment", description: "Balance teaching load by department.", metric: (m) => `${m.courses} course loads`, href: "/dashboard/professors" },
    { label: "Leave approvals", description: "Review and approve leave requests.", metric: (m) => `${m.unresolvedItems} pending cases`, href: "/dashboard/feedback" },
    { label: "Timetable approval", description: "Approve timetable and schedule adjustments.", metric: (m) => `${m.courses} schedules`, href: "/dashboard/professor" },
    { label: "Budget management", description: "Monitor and approve budget utilization.", metric: (m) => `$${m.expenses.toLocaleString()} expenses`, href: "/dashboard/finance" },
    { label: "Performance reviews", description: "Assess department performance quality.", metric: (m) => `${m.completedEnrollments} assessed outcomes`, href: "/dashboard/report" },
    { label: "Department reports", description: "Generate and publish department reports.", metric: (m) => `${m.uniqueDepartments} report units`, href: "/dashboard/report" },
  ],
  librarian: [
    { label: "Book inventory", description: "Track available inventory resources.", metric: (m) => `${m.courses} course-linked resources`, href: "/dashboard/librarian/records" },
    { label: "Borrow/Return/Reserve", description: "Manage circulation operations.", metric: (m) => `${m.students} active members`, href: "/dashboard/librarian/records" },
    { label: "Fines management", description: "Review and resolve overdue-related fines.", metric: (m) => `${m.unresolvedItems} unresolved cases`, href: "/dashboard/finance" },
    { label: "E-books and journals", description: "Manage digital catalog access.", metric: (m) => `${m.announcements} content updates`, href: "/dashboard/news" },
    { label: "Research database access", description: "Support access to research repositories.", metric: (m) => `${m.users} enabled accounts`, href: "/dashboard/users" },
    { label: "Overdue reports", description: "Generate overdue circulation reporting.", metric: (m) => `${m.unresolvedItems} overdue signals`, href: "/dashboard/report" },
  ],
  "super-admin": [
    { label: "Full system overview", description: "Global overview across all modules.", metric: (m) => `${m.users} users / ${m.students} students`, href: "/dashboard/report", icon: LayoutDashboard },
    { label: "Department and campus creation", description: "Manage departments/campuses via system settings.", metric: (m) => `${m.uniqueDepartments} departments`, href: "/dashboard/enrollment/departments", icon: Building2 },
    { label: "Role and permission matrix", description: "Control platform access matrix.", metric: (m) => `${m.users} assigned roles`, href: "/dashboard/users", icon: ShieldCheck },
    { label: "Backups", description: "Monitor backup readiness and recovery posture.", metric: (m) => `${m.users} protected identities`, href: "/dashboard/settings", icon: UserRoundCog },
    { label: "Audit logs", description: "Review platform-wide governance logs.", metric: (m) => `${m.unresolvedItems} review flags`, href: "/dashboard/audit", icon: FileSearch },
    { label: "Branding settings", description: "Update global branding and content identity.", metric: (m) => `${m.announcements} active brand notices`, href: "/dashboard/settings", icon: Palette },
    { label: "Integrations", description: "Configure external platform integrations.", metric: (m) => `${m.activeUsers} connected users`, href: "/dashboard/settings", icon: PlugZap },
    { label: "Global announcements", description: "Publish global communications.", metric: (m) => `${m.announcements} announcements`, href: "/dashboard/news", icon: Megaphone },
    { label: "Language settings", description: "Manage localization settings.", metric: (m) => `${m.users} localized accounts`, href: "/dashboard/settings", icon: Languages },
  ],
  "student-affairs": [
    { label: "Clubs management", description: "Manage clubs and community groups.", metric: (m) => `${m.students} student members`, href: "/dashboard/news" },
    { label: "Events management", description: "Manage student events and calendars.", metric: (m) => `${m.announcements} event posts`, href: "/dashboard/news" },
    { label: "Discipline cases", description: "Track discipline and conduct cases.", metric: (m) => `${m.pendingFeedback} active cases`, href: "/dashboard/feedback" },
    { label: "Welfare requests", description: "Review student welfare support requests.", metric: (m) => `${m.pendingFeedback} pending welfare requests`, href: "/dashboard/feedback" },
  ],
  hr: [
    { label: "Staff records", description: "Track staff records and employment status.", metric: (m) => `${m.users - m.students} staff accounts`, href: "/dashboard/hr/records" },
    { label: "Contracts", description: "Manage contract lifecycle and status.", metric: (m) => `${m.activeUsers} active contracts`, href: "/dashboard/hr/records" },
    { label: "Payroll", description: "Track payroll-linked financial records.", metric: (m) => `${m.payments} payroll-adjacent transactions`, href: "/dashboard/hr/records" },
    { label: "Leave requests", description: "Review and approve leave queues.", metric: (m) => `${m.unresolvedItems} pending requests`, href: "/dashboard/feedback" },
  ],
  security: [
    { label: "Visitor logs", description: "Track visitor and access records.", metric: (m) => `${m.visitorLogs} visitor entries`, href: "/dashboard/security/records" },
    { label: "Incident reports", description: "Review security incidents and escalations.", metric: (m) => `${m.incidentReports} incident reports`, href: "/dashboard/security/records" },
    { label: "ID card access control", description: "Monitor identity access controls.", metric: (m) => `${m.idCardAccess} card records`, href: "/dashboard/security/records" },
  ],
  facilities: [
    { label: "Classroom maintenance requests", description: "Track classroom maintenance workload.", metric: (m) => `${m.maintenanceRequests} maintenance requests`, href: "/dashboard/facilities/records" },
    { label: "Equipment requests", description: "Track equipment provisioning requests.", metric: (m) => `${m.equipmentRequests} equipment tickets`, href: "/dashboard/facilities/records" },
    { label: "Room booking", description: "Monitor room booking demand.", metric: (m) => `${m.roomBookings} room bookings`, href: "/dashboard/facilities/records" },
  ],
  "research-office": [
    { label: "Grants management", description: "Track grant-related workflows.", metric: (m) => `${m.researchGrants} grant records`, href: "/dashboard/research-office/records" },
    { label: "Publications tracker", description: "Track publication and output updates.", metric: (m) => `${m.publications} publications`, href: "/dashboard/research-office/records" },
    { label: "Research request approvals", description: "Review research request queues.", metric: (m) => `${m.researchRequests} research requests`, href: "/dashboard/research-office/records" },
  ],
}

const permissionFeatures: FeatureTile[] = [
  { label: "Students", description: "Open student records and student-related dashboard modules.", metric: (m) => `${m.students} student records`, href: "/dashboard/students", icon: GraduationCap, requiredPermissions: ["students:view"] },
  { label: "Professors", description: "Open professor records and academic staff modules.", metric: (m) => `${m.professors} professor records`, href: "/dashboard/professors", icon: Users, requiredPermissions: ["professors:view"] },
  { label: "Finance", description: "Open finance tables, ledgers, and payment dashboard modules.", metric: (m) => `${m.payments} payments tracked`, href: "/dashboard/finance", icon: Building2, requiredPermissions: ["finance:view"] },
  { label: "Applications", description: "Open admissions applications and decision queues.", metric: (m) => `${m.offerLetters} active offers`, href: "/dashboard/applications", icon: FileSearch, requiredPermissions: ["applications:view"] },
  { label: "Feedback", description: "Open feedback queues and support items.", metric: (m) => `${m.pendingFeedback} unresolved feedback`, href: "/dashboard/feedback", icon: UserRoundCog, requiredPermissions: ["feedback:view"] },
  { label: "News", description: "Open news and announcement management modules.", metric: (m) => `${m.announcements} announcements`, href: "/dashboard/news", icon: Megaphone, requiredPermissions: ["news:view"] },
  { label: "Audit", description: "Open audit logs and security review pages.", metric: (m) => `${m.deviceLogs} device log items`, href: "/dashboard/audit", icon: ShieldCheck, requiredPermissions: ["audit:view"] },
]

const universalStaffFeature: FeatureTile = {
  label: "Purchase & Fund Requests",
  description: "Request equipment, budgets, or funding and send it directly to finance for handling.",
  metric: (m) => `${m.unresolvedItems} active request-related items`,
  href: "/dashboard/requests",
  icon: WalletCards,
}

const requestReviewerRoles = new Set(["admin", "super-admin", "supervisor"])

const universalReviewerFeature: FeatureTile = {
  label: "Staff Requests",
  description: "Review purchase and fund requests submitted by staff, and edit or resolve them.",
  metric: (m) => `${m.unresolvedItems} active request-related items`,
  href: "/dashboard/requests",
  icon: WalletCards,
}

function toMetricValue(items: unknown): number {
  if (Array.isArray(items)) return items.length
  if (typeof items === "number") return items
  return 0
}

export function RoleWorkspaceDashboard() {
  const { user, hasPermission } = useAuth()
  const { isModuleEnabled } = useModuleToggles()
  const pathname = usePathname()
  const router = useRouter()
  const [metrics, setMetrics] = useState<WorkspaceMetrics>(zeroMetrics)
  const [recentFeedbackList, setRecentFeedbackList] = useState<Feedback[]>([])
  const [recentIncomeList, setRecentIncomeList] = useState<Income[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState | null>(null)
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false)
  const [enrollmentOpen, setEnrollmentOpen] = useState<boolean | null>(null)
  const [isSavingEnrollmentToggle, setIsSavingEnrollmentToggle] = useState(false)
  const [confirmEnrollmentDialogOpen, setConfirmEnrollmentDialogOpen] = useState(false)
  const [pendingEnrollmentNext, setPendingEnrollmentNext] = useState<boolean | null>(null)

  const allowedRoles = useMemo<readonly Role[]>(() => {
    if (pathname === "/dashboard/research" || pathname === "/dashboard/research-office") return ["research-office"] as const
    if (pathname === "/dashboard/super-admin") return ["super-admin"] as const
    if (pathname === "/dashboard/ta") return ["teaching-assistant"] as const
    if (pathname === "/dashboard/advisor") return ["advisor"] as const
    if (pathname === "/dashboard/student-affairs") return ["student-affairs"] as const
    if (pathname === "/dashboard/dean") return ["dean"] as const
    if (pathname === "/dashboard/hod") return ["hod"] as const
    if (pathname === "/dashboard/librarian") return ["librarian"] as const
    if (pathname === "/dashboard/hr") return ["hr"] as const
    if (pathname === "/dashboard/security") return ["security"] as const
    if (pathname === "/dashboard/facilities") return ["facilities"] as const
    if (pathname === "/dashboard/registrar") return ["registrar"] as const
    if (pathname === "/dashboard/admissions") return ["admissions"] as const
    if (pathname === "/dashboard/it-admin") return ["it-admin"] as const
    return [
      "super-admin",
      "professor",
      "advisor",
      "teaching-assistant",
      "registrar",
      "admissions",
      "finance",
      "it-admin",
      "dean",
      "hod",
      "librarian",
      "student-affairs",
      "hr",
      "security",
      "facilities",
      "research-office",
    ] as const
  }, [pathname])

  const isAllowed = !user || allowedRoles.includes(user.role)

  useEffect(() => {
    if (user && !isAllowed) {
      router.replace("/dashboard")
    }
  }, [isAllowed, router, user])

  useEffect(() => {
    const controller = new AbortController()

    async function loadWorkspaceMetrics() {
      setIsLoading(true)
      setError(null)
      try {
        const canManageUsers = hasPermission("users:manage")
        const canViewFinance = hasPermission("finance:view") || hasPermission("finance:manage")

        const [
          usersResult,
          studentsResult,
          professorsResult,
          coursesResult,
          enrollmentsResult,
          paymentsResult,
          incomeResult,
          expensesResult,
          questionsResult,
          feedbackResult,
          newsResult,
          visitorLogsResult,
          incidentReportsResult,
          idCardAccessResult,
          maintenanceRequestsResult,
          equipmentRequestsResult,
          roomBookingsResult,
          researchGrantsResult,
          publicationsResult,
          researchRequestsResult,
          ssoConfigsResult,
          integrationsResult,
          maintenanceStateResult,
          deviceLogsResult,
          enrollmentOverridesResult,
          transferCreditsResult,
          transcriptRequestsResult,
          graduationApprovalsResult,
          scholarshipAwardsResult,
          interviewSchedulesResult,
          offerLettersResult,
        ] = await Promise.allSettled([
          canManageUsers ? fetchUsers(controller.signal) : Promise.resolve([]),
          fetchStudents(controller.signal),
          fetchProfessors(controller.signal),
          fetchCourses(controller.signal),
          fetchEnrollments({ page: 1, pageSize: 5000, signal: controller.signal }),
          canViewFinance ? fetchPayments({ page: 1, pageSize: 5000, signal: controller.signal }) : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 5000 }),
          canViewFinance ? fetchIncome(controller.signal) : Promise.resolve([]),
          canViewFinance ? fetchExpenses(controller.signal) : Promise.resolve([]),
          fetchQuestions(controller.signal),
          fetchFeedback(controller.signal),
          fetchNews(controller.signal),
          apiFetch<VisitorLog[]>('/security/visitor-logs', { signal: controller.signal }),
          apiFetch<IncidentReport[]>('/security/incident-reports', { signal: controller.signal }),
          apiFetch<IdCardAccess[]>('/security/id-card-access', { signal: controller.signal }),
          apiFetch<MaintenanceRequest[]>('/facilities/maintenance-requests', { signal: controller.signal }),
          apiFetch<EquipmentRequest[]>('/facilities/equipment-requests', { signal: controller.signal }),
          apiFetch<RoomBooking[]>('/facilities/room-bookings', { signal: controller.signal }),
          apiFetch<ResearchGrant[]>('/research-office/research-grants', { signal: controller.signal }),
          apiFetch<Publication[]>('/research-office/publications', { signal: controller.signal }),
          apiFetch<ResearchRequest[]>('/research-office/research-requests', { signal: controller.signal }),
          apiFetch<SsoConfig[]>('/it-admin/sso-config', { signal: controller.signal }),
          apiFetch<Integration[]>('/it-admin/integrations', { signal: controller.signal }),
          apiFetch<MaintenanceState>('/it-admin/maintenance-state', { signal: controller.signal }),
          apiFetch<DeviceLog[]>('/it-admin/device-logs', { signal: controller.signal }),
          apiFetch<EnrollmentOverride[]>('/registrar/enrollment-overrides', { signal: controller.signal }),
          apiFetch<TransferCredit[]>('/registrar/transfer-credits', { signal: controller.signal }),
          apiFetch<TranscriptRequest[]>('/registrar/transcript-requests', { signal: controller.signal }),
          apiFetch<GraduationApproval[]>('/registrar/graduation-approvals', { signal: controller.signal }),
          apiFetch<ScholarshipAward[]>('/admissions/scholarship-awards', { signal: controller.signal }),
          apiFetch<InterviewSchedule[]>('/admissions/interview-schedules', { signal: controller.signal }),
          apiFetch<OfferLetter[]>('/admissions/offer-letters', { signal: controller.signal }),
        ])

        if (controller.signal.aborted) return

        const users = usersResult.status === "fulfilled" ? usersResult.value : []
        const students = studentsResult.status === "fulfilled" ? studentsResult.value : []
        const professors = professorsResult.status === "fulfilled" ? professorsResult.value : []
        const courses = coursesResult.status === "fulfilled" ? coursesResult.value : []
        const enrollments = enrollmentsResult.status === "fulfilled" ? enrollmentsResult.value.items : []
        const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value.items : []
        const income = incomeResult.status === "fulfilled" ? incomeResult.value : []
        const expenses = expensesResult.status === "fulfilled" ? expensesResult.value : []
        const questions = questionsResult.status === "fulfilled" ? questionsResult.value : []
        const feedback = feedbackResult.status === "fulfilled" ? feedbackResult.value : []
        const news = newsResult.status === "fulfilled" ? newsResult.value : []
        const recentFeedbackResolved = feedbackResult.status === "fulfilled" ? feedbackResult.value : []
        const recentIncomeResolved = incomeResult.status === "fulfilled" ? incomeResult.value : []
        const visitorLogs = visitorLogsResult.status === "fulfilled" ? visitorLogsResult.value : []
        const incidentReports = incidentReportsResult.status === "fulfilled" ? incidentReportsResult.value : []
        const idCardAccess = idCardAccessResult.status === "fulfilled" ? idCardAccessResult.value : []
        const maintenanceRequests = maintenanceRequestsResult.status === "fulfilled" ? maintenanceRequestsResult.value : []
        const equipmentRequests = equipmentRequestsResult.status === "fulfilled" ? equipmentRequestsResult.value : []
        const roomBookings = roomBookingsResult.status === "fulfilled" ? roomBookingsResult.value : []
        const researchGrants = researchGrantsResult.status === "fulfilled" ? researchGrantsResult.value : []
        const publications = publicationsResult.status === "fulfilled" ? publicationsResult.value : []
        const researchRequests = researchRequestsResult.status === "fulfilled" ? researchRequestsResult.value : []
        const ssoConfigs = ssoConfigsResult.status === "fulfilled" ? ssoConfigsResult.value : []
        const integrations = integrationsResult.status === "fulfilled" ? integrationsResult.value : []
        const maintenanceStateRecord = maintenanceStateResult.status === "fulfilled" ? maintenanceStateResult.value : null
        const deviceLogs = deviceLogsResult.status === "fulfilled" ? deviceLogsResult.value : []
        const enrollmentOverrides = enrollmentOverridesResult.status === "fulfilled" ? enrollmentOverridesResult.value : []
        const transferCredits = transferCreditsResult.status === "fulfilled" ? transferCreditsResult.value : []
        const transcriptRequests = transcriptRequestsResult.status === "fulfilled" ? transcriptRequestsResult.value : []
        const graduationApprovals = graduationApprovalsResult.status === "fulfilled" ? graduationApprovalsResult.value : []
        const scholarshipAwards = scholarshipAwardsResult.status === "fulfilled" ? scholarshipAwardsResult.value : []
        const interviewSchedules = interviewSchedulesResult.status === "fulfilled" ? interviewSchedulesResult.value : []
        const offerLetters = offerLettersResult.status === "fulfilled" ? offerLettersResult.value : []

        setMaintenanceState(maintenanceStateRecord)
        setRecentFeedbackList(recentFeedbackResolved.slice(0, 6))
        setRecentIncomeList(recentIncomeResolved.slice(0, 6))

        const pendingApprovals = enrollments.filter((item) =>
          ["pending", "pendingSupervisorApproval", "pendingAdvisorApproval", "pending_approval", "waitlisted"].includes(item.status),
        ).length
        const completedEnrollments = enrollments.filter((item) => item.status === "completed").length
        const openQuestions = questions.filter((item) => item.status !== "answered").length
        const pendingFeedback = feedback.filter((item) => item.status !== "resolved").length
        const unresolvedItems = pendingApprovals + openQuestions + pendingFeedback

        const departments = new Set<string>()
        professors.forEach((item) => {
          if (item.department) departments.add(item.department.trim().toLowerCase())
        })
        courses.forEach((item) => {
          if (item.department) departments.add(item.department.trim().toLowerCase())
        })

        setMetrics({
          users: toMetricValue(users),
          students: toMetricValue(students),
          professors: toMetricValue(professors),
          courses: toMetricValue(courses),
          enrollments: toMetricValue(enrollments),
          pendingApprovals,
          completedEnrollments,
          payments: toMetricValue(payments),
          income: income.reduce((sum, item) => sum + (item.amount || 0), 0),
          expenses: expenses.reduce((sum, item) => sum + (item.amount || 0), 0),
          openQuestions,
          pendingFeedback,
          announcements: toMetricValue(news),
          unresolvedItems,
          uniqueDepartments: departments.size,
          activeUsers: users.filter((item) => item.status === "active").length,
          visitorLogs: toMetricValue(visitorLogs),
          incidentReports: toMetricValue(incidentReports),
          idCardAccess: toMetricValue(idCardAccess),
          maintenanceRequests: toMetricValue(maintenanceRequests),
          equipmentRequests: toMetricValue(equipmentRequests),
          roomBookings: toMetricValue(roomBookings),
          researchGrants: toMetricValue(researchGrants),
          publications: toMetricValue(publications),
          researchRequests: toMetricValue(researchRequests),
          ssoConfigs: toMetricValue(ssoConfigs),
          integrations: toMetricValue(integrations),
          maintenanceEnabled: maintenanceStateRecord?.enabled ? 1 : 0,
          deviceLogs: toMetricValue(deviceLogs),
          enrollmentOverrides: toMetricValue(enrollmentOverrides),
          transferCredits: toMetricValue(transferCredits),
          transcriptRequests: toMetricValue(transcriptRequests),
          graduationApprovals: toMetricValue(graduationApprovals),
          scholarshipAwards: toMetricValue(scholarshipAwards),
          interviewSchedules: toMetricValue(interviewSchedules),
          offerLetters: toMetricValue(offerLetters),
        })
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to load role workspace data")
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadWorkspaceMetrics()
    return () => controller.abort()
  }, [hasPermission])

  useEffect(() => {
    if (!hasPermission("enrollment:manage")) return
    let mounted = true
    const controller = new AbortController()
    fetchAcademicStructure(controller.signal)
      .then((structure) => {
        if (!mounted) return
        setEnrollmentOpen(Boolean(structure.enrollmentOpen))
      })
      .catch(() => {
        /* ignore */
      })
    return () => {
      mounted = false
      controller.abort()
    }
  }, [hasPermission])

  async function handleEnrollmentToggle(next: boolean) {
    setIsSavingEnrollmentToggle(true)
    try {
      const updated = await updateEnrollmentGlobalToggle({ enrollmentOpen: next })
      setEnrollmentOpen(Boolean(updated.enrollmentOpen))
      setMetrics((m) => ({ ...m }))
    } catch (err) {
      // set error briefly in UI
    } finally {
      setIsSavingEnrollmentToggle(false)
      setConfirmEnrollmentDialogOpen(false)
      setPendingEnrollmentNext(null)
    }
  }

  const currentRole: Role | null = user?.role ?? null

  const features = useMemo(() => {
    if (!currentRole) return []
    const baseFeatures = roleFeatures[currentRole] ?? []
    const extraFeatures = permissionFeatures.filter((feature) =>
      feature.requiredPermissions?.some((permission) => hasPermission(permission)),
    )
    const merged = [...baseFeatures]
    extraFeatures.forEach((feature) => {
      if (!merged.some((entry) => entry.label === feature.label)) {
        merged.push(feature)
      }
    })
    const isReviewer = requestReviewerRoles.has(currentRole)
    const requestFeature = isReviewer ? universalReviewerFeature : universalStaffFeature
    if (!merged.some((entry) => entry.label === universalStaffFeature.label || entry.label === universalReviewerFeature.label)) {
      merged.push(requestFeature)
    }
    return merged.filter((feature) => isModuleEnabled(feature.href ? moduleKeyForHref(feature.href) : null))
  }, [currentRole, hasPermission, isModuleEnabled])

  async function handleMaintenanceToggle() {
    if (!maintenanceState) return
    setIsSavingMaintenance(true)
    try {
      const updated = await apiFetch<MaintenanceState>('/it-admin/maintenance-state', {
        method: "PUT",
        body: JSON.stringify({
          enabled: !maintenanceState.enabled,
          message: maintenanceState.message,
        }),
      })
      setMaintenanceState(updated)
      setMetrics((current) => ({
        ...current,
        maintenanceEnabled: updated.enabled ? 1 : 0,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update maintenance mode")
    } finally {
      setIsSavingMaintenance(false)
    }
  }

  if (!currentRole || !isAllowed) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(247,251,255,0.92)_100%)] p-4 pb-32 shadow-[0_18px_48px_-30px_rgba(44,83,130,0.34)] md:p-6 md:pb-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(165,205,240,0.18),transparent_0_16%),radial-gradient(circle_at_79%_18%,rgba(246,216,161,0.14),transparent_0_11%),radial-gradient(circle_at_76%_70%,rgba(161,219,223,0.12),transparent_0_15%),radial-gradient(circle_at_32%_78%,rgba(184,210,241,0.12),transparent_0_14%)]"
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.18]" aria-hidden>
        <Wrench className="absolute left-[34%] top-[6%] h-28 w-28 rotate-12 text-[#8fb0cf]" strokeWidth={1.2} />
        <CalendarDays className="absolute right-[9%] top-[6%] h-24 w-24 text-[#aebbd0]" strokeWidth={1.2} />
        <MonitorSmartphone className="absolute right-[29%] bottom-[18%] h-28 w-28 text-[#a6bada]" strokeWidth={1.2} />
        <Building2 className="absolute right-[8%] bottom-[10%] h-24 w-24 text-[#dbc79f]" strokeWidth={1.2} />
        <ShieldCheck className="absolute left-[40%] bottom-[12%] h-24 w-24 text-[#abd0d8]" strokeWidth={1.2} />
      </div>
      <div className="relative z-10 space-y-6">
      {currentRole === "super-admin" ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[#7382a3]">Role Workspace</p>
            <h1 className="text-[24px] font-extrabold text-[#16224a]">Super Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-[11px] border border-[#dde3f0] bg-[#eef1f8] px-3.5 py-2 sm:flex">
              <Search className="h-4 w-4 text-[#8592b3]" />
              <span className="text-[13px] text-[#8592b3]">Search users, courses, campusesâ€¦</span>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6e0f7] bg-[#eef2fc] px-3.5 py-2 text-[13px] font-bold text-[#2f56c8]">
              <span className="h-2 w-2 rounded-full bg-[#2f56c8]" />
              Super Admin
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[#556a86]">Role Workspace</p>
            <h1 className="text-3xl font-bold text-[#21314b]">{roleLabels[currentRole]} Dashboard</h1>
            <p className="text-sm text-[#556a86]">
              All feature cards below are bound to live platform totals and current database records.
            </p>
          </div>
          <Badge variant="outline" className="border-[#c6d6ea] bg-white/80 text-[#577ba9]">
            {roleLabels[currentRole]}
          </Badge>
        </div>
      )}

      {/* Super-admin quick stats + notifications */}
      {currentRole === "super-admin" && (
        <div className="mt-1">
          <p className="mb-5 text-sm text-[#69769a]">All feature cards below are bound to live platform totals and current database records.</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AdminKpiCard
                  label="Total Users"
                  value={metrics.users ?? 0}
                  icon={Users}
                  caption="all accounts on the platform"
                  href="/dashboard/users"
                />
                <AdminKpiCard
                  label="Active Students"
                  value={metrics.students ?? 0}
                  icon={GraduationCap}
                  caption="currently enrolled"
                  href="/dashboard/students"
                />
                <AdminKpiCard
                  label="Tuition Pipeline"
                  value={`$${(metrics.income ?? 0).toLocaleString()}`}
                  icon={WalletCards}
                  deltaLabel="Projected"
                  deltaTone="neutral"
                  caption="1 installment due"
                  href="/dashboard/finance"
                />
                <AdminKpiCard
                  label="Pending Approvals"
                  value={metrics.pendingApprovals ?? 0}
                  icon={Bell}
                  deltaLabel={(metrics.pendingApprovals ?? 0) === 0 ? "All clear" : "Action needed"}
                  deltaTone={(metrics.pendingApprovals ?? 0) === 0 ? "positive" : "neutral"}
                  caption={(metrics.pendingApprovals ?? 0) === 0 ? "nothing to review" : "action needed"}
                  href="/dashboard/enrollment"
                />
              </div>

              {/* Quick Actions */}
              <div className="rounded-[16px] border border-[#e5eaf4] bg-white p-[22px] shadow-[0_4px_18px_rgba(30,45,90,0.05)]">
                <div className="mb-4 flex items-center gap-2.5">
                  <Zap className="h-[18px] w-[18px] text-[#2f56c8]" />
                  <h2 className="text-[16px] font-extrabold text-[#16224a]">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingEnrollmentNext(!Boolean(enrollmentOpen))
                      setConfirmEnrollmentDialogOpen(true)
                    }}
                    className="flex items-center gap-2.5 rounded-[12px] border border-[#dde5f4] bg-[#f7f9fe] p-3.5 text-left text-[13px] font-semibold text-[#2b3a63] transition-colors hover:border-[#2f56c8] hover:bg-[#eef2fc]"
                  >
                    <X className="h-[18px] w-[18px] shrink-0 text-[#2f56c8]" />
                    {enrollmentOpen ? "Close Enrollment" : "Open Enrollment"}
                  </button>
                  <Link
                    href="/dashboard/enrollment/courses"
                    className="flex items-center gap-2.5 rounded-[12px] border border-[#dde5f4] bg-[#f7f9fe] p-3.5 text-[13px] font-semibold text-[#2b3a63] transition-colors hover:border-[#2f56c8] hover:bg-[#eef2fc]"
                  >
                    <Plus className="h-[18px] w-[18px] shrink-0 text-[#2f56c8]" />
                    Create Course
                  </Link>
                  <Link
                    href="/dashboard/report"
                    className="flex items-center gap-2.5 rounded-[12px] border border-[#dde5f4] bg-[#f7f9fe] p-3.5 text-[13px] font-semibold text-[#2b3a63] transition-colors hover:border-[#2f56c8] hover:bg-[#eef2fc]"
                  >
                    <BarChart3 className="h-[18px] w-[18px] shrink-0 text-[#2f56c8]" />
                    View Reports
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleMaintenanceToggle()}
                    disabled={isSavingMaintenance}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[12px] border p-3.5 text-left text-[13px] font-semibold transition-colors",
                      maintenanceState?.enabled
                        ? "border-[#e0a12f] bg-[#fdf5e7] text-[#a5761a] hover:border-[#e0a12f]"
                        : "border-[#f0dcb4] bg-[#fdf9f0] text-[#a5761a] hover:border-[#e0a12f]",
                    )}
                  >
                    <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
                    {maintenanceState?.enabled ? "Disable Maintenance" : "Enable Maintenance"}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="overflow-hidden rounded-[16px] border border-[#e5eaf4] bg-white shadow-[0_4px_18px_rgba(30,45,90,0.05)]">
                <div className="flex items-center justify-between border-b border-[#eef1f8] px-[22px] py-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#eef2fc] text-[#2f56c8]">
                      <Bell className="h-[17px] w-[17px]" />
                    </span>
                    <h2 className="text-[16px] font-extrabold text-[#16224a]">Notifications</h2>
                  </div>
                  <button type="button" className="text-xs font-bold text-[#2f56c8] hover:text-[#274ab0]">
                    Mark all read
                  </button>
                </div>
                <div className="flex flex-col">
                  {recentFeedbackList.map((f) => (
                    <div key={f.id} className="flex gap-3 border-b border-[#f2f4fa] px-[22px] py-4 transition-colors hover:bg-[#f8faff]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2fc] text-[#2f56c8]">
                        <Megaphone className="h-[17px] w-[17px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold text-[#16224a]">{f.studentName || f.subject || "Feedback"}</span>
                          <span className="whitespace-nowrap text-[11px] text-[#98a3c0]">{new Date(f.createdAt || f.date || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[13px] leading-[1.45] text-[#69769a]">{f.comment || f.category || "No message"}</p>
                      </div>
                    </div>
                  ))}
                  {recentIncomeList.map((i) => (
                    <div key={i.id} className="flex gap-3 border-b border-[#f2f4fa] px-[22px] py-4 transition-colors last:border-b-0 hover:bg-[#f8faff]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e9f6ef] text-[#1f9d61]">
                        <CalendarDays className="h-[17px] w-[17px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold text-[#16224a]">{i.source ?? i.description ?? "Income"}</span>
                          <span className="whitespace-nowrap text-sm font-extrabold text-[#1f9d61]">${Number(i.amount).toLocaleString()}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[13px] leading-[1.45] text-[#69769a]">{i.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#eef1f8] px-[22px] py-3.5 text-center">
                  <Link href="/dashboard/notifications" className="text-[13px] font-bold text-[#2f56c8] hover:text-[#274ab0]">
                    View all notifications
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmEnrollmentDialogOpen}
        onOpenChange={(v) => setConfirmEnrollmentDialogOpen(v)}
        title={pendingEnrollmentNext ? "Open enrollment?" : "Close enrollment?"}
        description={
          pendingEnrollmentNext
            ? "Are you sure you want to open enrollment for all campuses?"
            : "Are you sure you want to close enrollment for all campuses? This will prevent new enrollments."
        }
        confirmLabel={pendingEnrollmentNext ? "Open" : "Close"}
        cancelLabel="Cancel"
        loading={isSavingEnrollmentToggle}
        onConfirm={async () => {
          if (pendingEnrollmentNext === null) return
          await handleEnrollmentToggle(pendingEnrollmentNext)
        }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load role metrics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentRole === "it-admin" && maintenanceState && (
        <Card className="border border-white/70 bg-white/88 shadow-[0_16px_34px_-28px_rgba(21,99,197,0.26)] backdrop-blur-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold text-foreground">Maintenance mode</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {maintenanceState.enabled
                  ? maintenanceState.message || "The platform is currently in maintenance mode."
                  : "The platform is currently available to users."}
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={handleMaintenanceToggle}
              disabled={isSavingMaintenance}
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingMaintenance ? "Updating..." : maintenanceState.enabled ? "Disable mode" : "Enable mode"}
            </button>
          </CardHeader>
        </Card>
      )}

      {hasPermission("enrollment:manage") && currentRole !== "professor" && (
        <div className="flex flex-col gap-5 rounded-[16px] border border-[#e5eaf4] bg-white p-[22px] shadow-[0_4px_18px_rgba(30,45,90,0.05)] sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[16px] font-extrabold text-[#16224a]">Enrollment Window (Global)</h2>
              <span
                className={cn(
                  "rounded-full px-2.5 py-[3px] text-[11px] font-bold",
                  enrollmentOpen ? "bg-[#e6f6ee] text-[#1f9d61]" : "bg-[#fdecec] text-[#d15656]",
                )}
              >
                {enrollmentOpen ? "Live" : "Paused"}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-[#69769a]">
              Toggle global enrollment for students â€” when closed, available courses are hidden from students.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <label className="flex cursor-pointer items-center gap-2.5">
              <span className="text-[13px] font-bold text-[#33406a]">{enrollmentOpen ? "Open" : "Closed"}</span>
              <span className="relative inline-block">
                <input
                  type="checkbox"
                  checked={Boolean(enrollmentOpen)}
                  onChange={(e) => handleEnrollmentToggle(e.target.checked)}
                  disabled={isSavingEnrollmentToggle || enrollmentOpen === null}
                  aria-label="Toggle global enrollment"
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "block h-[26px] w-[46px] rounded-full transition-colors duration-200",
                    enrollmentOpen ? "bg-[#2f56c8]" : "bg-[#c6cee0]",
                    (isSavingEnrollmentToggle || enrollmentOpen === null) && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[3px] block h-5 w-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-[left] duration-200",
                      enrollmentOpen ? "left-[23px]" : "left-[3px]",
                    )}
                  />
                </span>
              </span>
            </label>
            <Link href="/dashboard/enrollment">
              <button
                type="button"
                className="rounded-[11px] bg-[linear-gradient(90deg,#2f56c8,#3860d6)] px-5 py-[11px] text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(47,86,200,0.35)] transition-[filter] hover:brightness-[1.06]"
              >
                Manage courses
              </button>
            </Link>
          </div>
        </div>
      )}
      {isLoading ? (
        <div className="flex h-[280px] items-center justify-center rounded-2xl border border-white/70 bg-white/88">
          <Spinner className="h-5 w-5" />
        </div>
      ) : features.length === 0 ? (
        <Card className="border border-white/70 bg-white/88">
          <CardHeader>
            <CardTitle>No dedicated workspace modules</CardTitle>
            <CardDescription>This role currently uses the standard shared dashboard modules.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            const content = (
              <div className="flex h-full min-h-[220px] flex-col rounded-[16px] border border-[#e5eaf4] bg-white p-[22px] shadow-[0_4px_18px_rgba(30,45,90,0.05)] transition-all hover:border-[#c3d1f2] hover:shadow-[0_8px_24px_rgba(30,45,90,0.1)]">
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#eef2fc] text-[#2f56c8]">
                    {Icon ? <Icon className="h-[22px] w-[22px]" /> : <ArrowUpRight className="h-[22px] w-[22px]" />}
                  </span>
                  <ArrowUpRight className="h-[18px] w-[18px] text-[#a9b4d0]" />
                </div>
                <h3 className="mb-1.5 mt-4 text-[16px] font-extrabold leading-snug text-[#16224a]">{feature.label}</h3>
                <p className="flex-1 text-[13px] leading-6 text-[#69769a]">{feature.description}</p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#eef1f8] pt-3.5">
                  <span className="max-w-full truncate rounded-full bg-[#eef2fc] px-2.5 py-1 text-xs font-bold text-[#2f56c8]">
                    {feature.metric(metrics)}
                  </span>
                  <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#2f56c8]">Open module â†’</span>
                </div>
              </div>
            )

            if (!feature.href) return <div key={feature.label}>{content}</div>

            return (
              <Link key={feature.label} href={feature.href} className="block h-full">
                {content}
              </Link>
            )
          })}
        </div>
      )}
      </div>
      <div className="pointer-events-none absolute bottom-5 right-6 z-10 opacity-90" aria-hidden>
        <div className="flex items-end gap-3">
          <div className="relative h-[70px] w-[70px] overflow-hidden rounded-md">
            <Image src={appLogo} alt="UNYT logo" fill className="object-contain" />
          </div>
          <div className="pb-1 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2d4060]">UNYT Portal</p>
            <p className="text-[10px] text-[#65809f]">{roleLabels[currentRole]} workspace</p>
          </div>
        </div>
      </div>
    </div>
  )
}

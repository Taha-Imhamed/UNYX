export interface TerminalModuleDef {
  key: string
  label: string
  features: { key: string; label: string }[]
  sidebarNames: string[]
}

// Roles with a dedicated terminal module today — mirrors backend/src/routes/terminal.ts's
// ROLE_MODULE_MAP. Roles not listed here have no feature-level controls yet.
export const ROLE_MODULE_MAP: Record<string, string> = {
  student: "student-portal",
  professor: "professor",
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  "super-admin": "Super Admin",
  supervisor: "Supervisor",
  user: "User",
  student: "Student",
  professor: "Professor",
  advisor: "Advisor",
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

export const TERMINAL_MODULES: TerminalModuleDef[] = [
  { key: "students", label: "Students", features: [], sidebarNames: ["Students"] },
  {
    key: "enrollment",
    label: "Enrollment",
    sidebarNames: ["Enrollment", "Enrollment Approvals"],
    features: [
      { key: "rooms", label: "Rooms" },
      { key: "waitlist", label: "Waitlist" },
      { key: "utilization", label: "Seat Utilization" },
    ],
  },
  { key: "professors", label: "Professors", features: [], sidebarNames: ["Professors"] },
  {
    key: "finance",
    label: "Finance",
    sidebarNames: ["Finance"],
    features: [
      { key: "requests", label: "Requests" },
      { key: "invoices", label: "Invoices" },
      { key: "refunds", label: "Refunds" },
      { key: "installment-plans", label: "Installment Plans" },
      { key: "sponsorships", label: "Sponsorships" },
      { key: "unpaid-balances", label: "Unpaid Balances" },
      { key: "ledger-view", label: "Ledger View (Debits/Credits)" },
      { key: "payment-reconciliation", label: "Payment Method Reconciliation" },
      { key: "outstanding-balance-report", label: "Outstanding Balance Report" },
      { key: "late-fees", label: "Automated Late-Fee Assessment" },
      { key: "financial-hold-trigger", label: "Financial Hold Auto-Trigger" },
      { key: "net-income-dashboard", label: "Net Income Dashboard (Trend Chart)" },
      { key: "accounting-export", label: "Accounting Export (CSV/QuickBooks)" },
    ],
  },
  {
    key: "applications",
    label: "Applications",
    sidebarNames: ["Applications"],
    features: [
      { key: "interview-schedules", label: "Interview Schedules" },
      { key: "offer-letters", label: "Offer Letters" },
      { key: "scholarship-awards", label: "Scholarship Awards" },
    ],
  },
  { key: "news", label: "News", features: [], sidebarNames: ["News"] },
  { key: "feedback", label: "Feedback", features: [], sidebarNames: ["Feedback"] },
  {
    key: "facilities",
    label: "Facilities",
    sidebarNames: ["Facilities"],
    features: [
      { key: "room-bookings", label: "Room Bookings" },
      { key: "equipment-requests", label: "Equipment Requests" },
      { key: "maintenance-requests", label: "Maintenance Requests" },
      { key: "availability-calendar", label: "Facility Availability Calendar" },
    ],
  },
  {
    key: "research-office",
    label: "Research Office",
    sidebarNames: ["Research Office"],
    features: [
      { key: "research-grants", label: "Research Grants" },
      { key: "publications", label: "Publications" },
      { key: "research-requests", label: "Research Requests" },
      { key: "collaboration-tracker", label: "Research Collaboration Tracker" },
    ],
  },
  {
    key: "hr",
    label: "HR",
    sidebarNames: [],
    features: [
      { key: "leave-requests", label: "Staff Leave / Time-Off Requests" },
      { key: "payroll-view", label: "Payroll / Salary Record View" },
      { key: "onboarding-checklist", label: "Onboarding Checklist" },
      { key: "org-chart", label: "Org Chart / Department Directory" },
      { key: "performance-review", label: "Staff Performance Review" },
    ],
  },
  {
    key: "library",
    label: "Library",
    sidebarNames: [],
    features: [
      { key: "catalog-checkout", label: "Catalog & Checkout" },
      { key: "fine-tracking", label: "Fine Tracking" },
    ],
  },
  {
    key: "registrar",
    label: "Registrar",
    sidebarNames: ["Registrar"],
    features: [
      { key: "enrollment-overrides", label: "Enrollment Overrides" },
      { key: "transfer-credits", label: "Transfer Credits" },
      { key: "transcript-requests", label: "Transcript Requests" },
      { key: "graduation-approvals", label: "Graduation Approvals" },
    ],
  },
  {
    key: "security",
    label: "Security",
    sidebarNames: ["Security"],
    features: [
      { key: "visitor-logs", label: "Visitor Logs" },
      { key: "incident-reports", label: "Incident Reports" },
      { key: "id-card-access", label: "ID Card Access" },
    ],
  },
  {
    key: "it-admin",
    label: "IT Admin",
    sidebarNames: ["IT Admin"],
    features: [
      { key: "sso-config", label: "SSO Config" },
      { key: "integrations", label: "Integrations" },
      { key: "device-logs", label: "Device Logs" },
      { key: "2fa-mfa", label: "2FA / MFA for Staff & Admin" },
      { key: "session-management", label: "Session Management (View/Revoke)" },
      { key: "password-reset-flow", label: "Password Reset Self-Service" },
      { key: "asset-management", label: "IT Asset / Device Management" },
    ],
  },
  {
    key: "audit",
    label: "Audit",
    sidebarNames: ["Audit"],
    features: [
      { key: "full-log", label: "Full Audit Log" },
      { key: "export", label: "Audit Export (CSV/PDF)" },
    ],
  },
  {
    key: "users",
    label: "Users",
    sidebarNames: ["Users"],
    features: [
      { key: "custom-role-builder", label: "Custom Role Builder" },
      { key: "bulk-deactivation", label: "Bulk Deactivation/Reactivation" },
    ],
  },
  { key: "settings", label: "Settings", features: [], sidebarNames: ["Settings"] },
  {
    key: "student-portal",
    label: "Student Dashboard",
    sidebarNames: [],
    features: [
      { key: "enroll", label: "Course Enrollment" },
      { key: "drop-withdraw", label: "Drop / Withdraw" },
      { key: "waitlist", label: "Waitlist Auto-Promote" },
      { key: "schedule-conflict", label: "Schedule Conflict Detector" },
      { key: "degree-audit", label: "Degree Audit" },
      { key: "gpa-calculator", label: "GPA Calculator" },
      { key: "transcript-export", label: "Transcript Export (PDF/CSV)" },
      { key: "transcript-view", label: "Unofficial Transcript View" },
      { key: "attendance", label: "Attendance / My Courses" },
      { key: "grade-appeal", label: "Grade Appeal / Dispute" },
      { key: "payment-plan", label: "Payment Plan" },
      { key: "payment-gateway", label: "Online Payment Gateway" },
      { key: "scholarship-application", label: "Scholarship Application" },
      { key: "financial-aid-status", label: "Financial Aid Status" },
      { key: "document-request", label: "Document Request" },
      { key: "advisor-contact", label: "Advisor Messaging / Booking" },
      { key: "academic-hold", label: "Academic Hold Visibility" },
      { key: "course-catalog", label: "Course Catalog Search" },
      { key: "notifications", label: "Notifications" },
    ],
  },
  {
    key: "professor",
    label: "Professor",
    sidebarNames: [],
    features: [
      { key: "class-overview", label: "Class Overview" },
      { key: "schedule", label: "Schedule" },
      { key: "assignments", label: "Assignments" },
      { key: "roster", label: "Student Roster" },
      { key: "mock-classes", label: "Mock-up Classes" },
      { key: "finance-requests", label: "Finance Requests" },
      { key: "materials", label: "Materials" },
      { key: "quizzes", label: "Quizzes" },
      { key: "gradebook", label: "Gradebook" },
      { key: "grade-submission", label: "Grade Submission" },
      { key: "messages", label: "Messages" },
      { key: "announcements", label: "Announcements" },
      { key: "office-hours", label: "Office Hours" },
      { key: "questions", label: "Student Questions" },
      { key: "students-requests", label: "Student Requests" },
      { key: "attendance", label: "Attendance" },
      { key: "analytics", label: "Analytics" },
      { key: "reports", label: "Pass/Fail Report" },
    ],
  },
  {
    key: "platform",
    label: "Platform",
    sidebarNames: [],
    features: [
      { key: "global-search", label: "Global Search" },
      { key: "notification-preferences", label: "Notification Preferences Center" },
      { key: "system-health", label: "System Health / Status Page" },
      { key: "data-export-backup", label: "Data Export / Backup Tool" },
      { key: "multi-language", label: "Multi-Language Support" },
    ],
  },
]

export function moduleKeyForSidebarName(name: string): string | null {
  const match = TERMINAL_MODULES.find((mod) => mod.sidebarNames.includes(name))
  return match ? match.key : null
}

const HREF_MODULE_MAP: Record<string, string> = {
  "/dashboard/students": "students",
  "/dashboard/enrollment": "enrollment",
  "/dashboard/professors": "professors",
  "/dashboard/finance": "finance",
  "/dashboard/applications": "applications",
  "/dashboard/admissions": "applications",
  "/dashboard/news": "news",
  "/dashboard/feedback": "feedback",
  "/dashboard/facilities": "facilities",
  "/dashboard/research": "research-office",
  "/dashboard/research-office": "research-office",
  "/dashboard/registrar": "registrar",
  "/dashboard/security": "security",
  "/dashboard/it-admin": "it-admin",
  "/dashboard/audit": "audit",
  "/dashboard/users": "users",
  "/dashboard/settings": "settings",
  "/student": "student-portal",
  "/dashboard/professor": "professor",
  "/dashboard/hr": "hr",
  "/dashboard/librarian": "library",
}

export function moduleKeyForHref(href: string): string | null {
  const path = href.split("?")[0].split("#")[0]
  const exact = HREF_MODULE_MAP[path]
  if (exact) return exact
  const prefixMatch = Object.entries(HREF_MODULE_MAP).find(([prefix]) => path.startsWith(`${prefix}/`))
  return prefixMatch ? prefixMatch[1] : null
}

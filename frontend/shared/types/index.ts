export interface Student extends Record<string, unknown> {
  id: string
  displayId: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phone: string
  photo: string
  enrollmentDate: string
  program: string
  major?: string
  programId?: string
  faculty?: string
  facultyId?: string
  gender?: string
  nationality?: string
  nationalId?: string
  passportNumber?: string
  bloodType?: string
  city?: string
  postalCode?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  motherName?: string
  fatherName?: string
  currentSemester?: string
  status: "active" | "inactive" | "graduated" | "deleted"
  address: string
  dateOfBirth: string
  balance: number
  supervisorId?: string
  supervisorName?: string
}

export interface StudentHint {
  title: string
  description: string
  link?: string
  os?: "windows" | "mac"
}

export interface StudentHintsResponse {
  field: string
  hints: StudentHint[]
}

export interface Professor extends Record<string, unknown> {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  photo: string
  department: string
  salary: number
  hireDate: string
  specialization: string
  status: "active" | "on-leave" | "retired"
}

export type ScheduleDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

export interface CourseScheduleEntry {
  day: ScheduleDay
  startTime: string
  endTime: string
  location: string
  department?: string
  branch?: string
}

export interface Expense extends Record<string, unknown> {
  id: string
  category: string
  description: string
  amount: number
  date: string
  approvedBy: string
  status: "pending" | "approved" | "rejected"
}

export interface Income extends Record<string, unknown> {
  id: string
  source: string
  description: string
  amount: number
  date: string
  studentId?: string
}

export type FinanceChargeType =
  | "tuition"
  | "semester"
  | "hostel"
  | "transport"
  | "late-penalty"
  | "refund"
  | "other"

export interface FinanceInvoiceLineItem extends Record<string, unknown> {
  id: string
  type: FinanceChargeType
  label: string
  description?: string | null
  quantity: number
  unitAmount: number
  total: number
}

export interface FinancialHold extends Record<string, unknown> {
  id: string
  studentId: string
  studentName: string
  studentDisplayId?: string | null
  reason: string
  balanceAtHold: number
  status: "active" | "released"
  createdAt: string
  releasedAt?: string | null
  releasedBy?: string | null
}

export interface FinanceInvoice extends Record<string, unknown> {
  id: string
  invoiceNumber: string
  studentId: string
  studentName: string
  studentDisplayId?: string | null
  title: string
  semester?: string | null
  issueDate: string
  dueDate: string
  status: "draft" | "open" | "partially-paid" | "paid" | "cancelled"
  subtotal: number
  total: number
  paidAmount: number
  balanceDue: number
  currency: string
  notes?: string | null
  lineItems: FinanceInvoiceLineItem[]
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface FinanceInstallmentPlan extends Record<string, unknown> {
  id: string
  studentId: string
  studentName: string
  title: string
  totalAmount: number
  installmentCount: number
  amountPerInstallment: number
  paidAmount: number
  remainingBalance: number
  startDate: string
  nextDueDate: string
  status: "draft" | "active" | "completed" | "defaulted"
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface FinanceSponsorship extends Record<string, unknown> {
  id: string
  studentId: string
  studentName: string
  sponsorName: string
  sponsorType: "family" | "company" | "scholarship" | "government" | "other"
  coverageType: "fixed" | "percentage"
  coverageValue: number
  appliedAmount: number
  status: "pending" | "active" | "ended"
  startDate: string
  endDate?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface FinanceRefundRequest extends Record<string, unknown> {
  id: string
  studentId: string
  studentName: string
  invoiceId?: string | null
  invoiceNumber?: string | null
  amount: number
  reason: string
  requestedAt: string
  status: "pending" | "approved" | "rejected"
  approvedAt?: string | null
  approvedBy?: string | null
  notes?: string | null
}

export interface FinanceReportSummary extends Record<string, unknown> {
  totalRevenue: number
  totalCollectedPayments: number
  totalPendingBalances: number
  totalExpenses: number
  netRevenue: number
  unpaidStudentCount: number
  openInvoiceCount: number
  pendingRefundCount: number
  activeInstallmentPlanCount: number
  activeSponsorshipCount: number
}

export interface FinanceRequest extends Record<string, unknown> {
  id: string
  requestNumber: string
  requesterId: string
  requesterName: string
  requesterRole: SystemRole
  department?: string | null
  requestType: "purchase" | "fund"
  title: string
  itemName: string
  amount: number
  urgency: "low" | "normal" | "high"
  justification: string
  vendorName?: string | null
  notes?: string | null
  status: "pending" | "approved" | "rejected" | "fulfilled"
  handledAt?: string | null
  handledBy?: string | null
  financeNotes?: string | null
  createdAt: string
  updatedAt: string
}

export interface Feedback extends Record<string, unknown> {
  id: string
  studentId: string
  studentName: string
  professorId?: string
  professorName?: string
  type: "course" | "facility" | "professor" | "general" | "admission"
  rating?: number
  comment: string
  date: string
  createdAt?: string
  status: "new" | "reviewed" | "resolved"
  subject?: string
  category?: string
  courseId?: string
  priority?: "low" | "normal" | "high"
  context?: string
  source?: string
  targetRole?: "admin" | "supervisor"
  attachment?: string
  attachmentName?: string
}

export type SystemRole =
  | "admin"
  | "super-admin"
  | "supervisor"
  | "user"
  | "student"
  | "professor"
  | "advisor"
  | "teaching-assistant"
  | "registrar"
  | "admissions"
  | "finance"
  | "it-admin"
  | "dean"
  | "hod"
  | "librarian"
  | "student-affairs"
  | "hr"
  | "security"
  | "facilities"
  | "research-office"

export interface AccessProfile extends Record<string, unknown> {
  allowEnrollmentAnytime?: boolean
  allowEnrollmentWhenClosed?: boolean
  allowEnrollmentOverCapacity?: boolean
  allowDeveloperWorkspace?: boolean
  allowSensitiveSettings?: boolean
  allowAuditExports?: boolean
  allowUserLifecycleManagement?: boolean
  allowStudentLifecycleManagement?: boolean
  allowProfessorLifecycleManagement?: boolean
  allowFinanceApprovals?: boolean
  allowApplicationDecisions?: boolean
  allowNewsPublishing?: boolean
  notes?: string
}

export interface CustomRoleTemplate extends Record<string, unknown> {
  id: string
  name: string
  description?: string | null
  baseRole: SystemRole
  permissions?: Partial<Record<Permission, boolean>>
  accessProfile?: AccessProfile
  createdAt: string
  updatedAt: string
}

export interface User extends Record<string, unknown> {
  id: string
  username: string
  email: string
  role: SystemRole
  secondaryRoles?: SystemRole[]
  createdAt: string
  lastLogin: string
  status: "active" | "inactive"
  avatarUrl?: string | null
  password?: string
  permissions?: Partial<Record<Permission, boolean>>
  customRoleId?: string | null
  customRoleName?: string | null
  accessProfile?: AccessProfile
  studentId?: string | null
  professorId?: string | null
  mfaEnabled?: boolean
}

export interface DashboardStats {
  totalStudents: number
  activeStudents: number
  totalProfessors: number
  totalIncome: number
  totalExpenses: number
  netIncome: number
  pendingFeedback: number
  averageRating: number
  totalEnrollments?: number
  tuitionPipeline?: number
  pendingApprovals?: number
}

export type PaymentMethod = "cash" | "card" | "transfer"

export type CouponCode = string

export interface Coupon extends Record<string, unknown> {
  code: CouponCode
  percent: number
  createdAt: string
}

export type EnrollmentStatus =
  | "pending"
  | "pendingSupervisorApproval"
  | "pendingAdvisorApproval"
  | "pending_approval"
  | "active"
  | "waitlisted"
  | "completed"
  | "cancelled"
  | "rejected"
  | "dropped"

export type CourseType = "major" | "common"

export type EnrollmentPaymentStatus = "paid" | "payment_required"

export interface Course extends Record<string, unknown> {
  id: string
  displayId: string
  title: string
  code: string
  professorId: string
  professorName: string
  sectionId?: string
  capacity: number
  startDate: string
  endDate: string
  price: number
  department?: string
  branch?: string
  location?: string
  schedule?: CourseScheduleEntry[]
  eligiblePrograms?: string[]
  eligibleFaculties?: string[]
  eligibleSemesters?: string[]
  prerequisiteCourseIds?: string[]
  creditHours?: number
  courseType?: CourseType
  enrollmentOpen?: boolean
  enrollmentOpensAt?: string | null
  enrollmentClosesAt?: string | null
  enrollmentOpenAt?: string | null
  enrollmentCloseAt?: string | null
  enrollmentStatusNote?: string | null
}

export interface AcademicDepartment {
  id: string
  name: string
}

export interface AcademicCampus {
  id: string
  name: string
}

export interface AcademicMajor {
  id: string
  name: string
  departmentId: string
  years: number
  subjects: string[]
  courseIds: string[]
  baseCourseIds?: string[]
}

export interface AcademicStructure {
  id: "global"
  enrollmentOpen: boolean
  enrollmentMessage: string | null
  departments: AcademicDepartment[]
  campuses: AcademicCampus[]
  majors: AcademicMajor[]
  updatedAt: string
}

export type EnrollmentStudentSummary = Pick<
  Student,
  "id" | "displayId" | "firstName" | "lastName" | "email" | "photo"
> & {
  balance?: number
}

export interface Enrollment extends Record<string, unknown> {
  id: string
  displayId: string
  studentId: string
  courseId: string
  courseTitle: string
  professorId: string
  professorName: string
  campus?: string | null
  status: EnrollmentStatus
  startDate: string
  endDate: string
  price: number
  basePrice?: number
  couponCode?: CouponCode
  discountPercent?: number
  discountAmount?: number
  createdAt: string
  updatedAt: string
  grade?: string | null
  gradeMidterm?: number | null
  gradeFinal?: number | null
  gradeProject?: number | null
  gradeParticipation?: number | null
  gradeTotal?: number | null
  letterGrade?: string | null
  isFinalized?: boolean
  gradeUpdatedAt?: string | null
  gradesFinalizedAt?: string | null
  gradesFinalizedBy?: string | null
  semester?: string | null
  tuitionCharged?: boolean
  chargedAt?: string | null
  paymentVerified?: boolean
  paymentStatus?: EnrollmentPaymentStatus
  approvedByUserId?: string | null
  approvedByName?: string | null
  approvedByRole?: User['role'] | null
  approvedAt?: string | null
  updatedByUserId?: string | null
  updatedByName?: string | null
  updatedByRole?: User['role'] | null
  rejectedByUserId?: string | null
  rejectedByName?: string | null
  rejectedByRole?: User['role'] | null
  rejectedAt?: string | null
  latestAdvisorMessage?: string | null
  latestAdvisorMessageAt?: string | null
  courseSchedule?: CourseScheduleEntry[]
  courseCode?: string | null
  courseBranch?: string | null
  student?: EnrollmentStudentSummary
  autoAssignedBaseCourse?: boolean
}

export interface EnrollmentWithCourse extends Enrollment {
  courseCode?: string
  sectionId?: string
  courseSchedule?: CourseScheduleEntry[]
}

export type TransactionType = "credit" | "debit"

export type TransactionSource = "payment" | "enrollment" | "adjustment"

export interface PaymentTransaction extends Record<string, unknown> {
  id: string
  displayId: string
  studentId: string
  amount: number
  method: PaymentMethod | "internal"
  note?: string
  createdAt: string
  type: TransactionType
  source: TransactionSource
  referenceId?: string
  enrollmentId?: string
  courseId?: string
  courseTitle?: string
  balanceAfter?: number
  invoiceId?: string | null
  financeStatus?: "pending" | "confirmed" | "rejected"
  confirmedAt?: string | null
  confirmedBy?: string | null
  confirmationNote?: string | null
}

export interface StudentBalanceSummary {
  studentId: string
  studentDisplayId?: string
  balance: number
  updatedAt: string
}

export interface StudentFinancialSnapshot extends StudentBalanceSummary {
  student: Pick<Student, "id" | "displayId" | "firstName" | "lastName" | "email" | "photo"> & { balance: number }
  transactions: PaymentTransaction[]
  enrollments: Enrollment[]
  paymentStatus: "paid" | "partial" | "unpaid"
}

export interface FinancialLedgerEntry extends Record<string, unknown> {
  id: string
  studentId: string
  amount: number
  entryType: 'credit' | 'debit'
  source: PaymentTransaction['source'] | 'refund' | 'invoice' | 'tuition-clearance'
  note?: string | null
  paymentId?: string | null
  enrollmentId?: string | null
  invoiceId?: string | null
  createdAt: string
  createdByUserId?: string | null
  createdByName?: string | null
  metadata?: Record<string, unknown>
}

export interface GradeAuditRecord extends Record<string, unknown> {
  id: string
  enrollmentId: string
  studentId: string
  courseId: string
  actorUserId?: string | null
  actorUsername?: string | null
  before: {
    gradeMidterm?: number | null
    gradeFinal?: number | null
    gradeProject?: number | null
    gradeParticipation?: number | null
    gradeTotal?: number | null
    letterGrade?: string | null
    grade?: string | null
    isFinalized?: boolean
  }
  after: {
    gradeMidterm?: number | null
    gradeFinal?: number | null
    gradeProject?: number | null
    gradeParticipation?: number | null
    gradeTotal?: number | null
    letterGrade?: string | null
    grade?: string | null
    isFinalized?: boolean
  }
  createdAt: string
}

export interface TranscriptCourseRecord extends Record<string, unknown> {
  enrollmentId: string
  courseId: string
  courseCode: string
  courseTitle: string
  credits: number
  grade: string | null
  letterGrade: string | null
  gradeTotal: number | null
  campus: string | null
  semester: string
  finalizedAt?: string | null
}

export interface TranscriptSemesterRecord extends Record<string, unknown> {
  semester: string
  credits: number
  gpa: number
  courses: TranscriptCourseRecord[]
}

export interface StudentTranscript extends Record<string, unknown> {
  student: Pick<Student, 'id' | 'displayId' | 'firstName' | 'lastName' | 'email' | 'program'> & {
    currentSemester?: string | null
  }
  semesters: TranscriptSemesterRecord[]
  cumulativeCredits: number
  cumulativeGpa: number
  generatedAt: string
}

export interface EnrollmentSummaryCourse {
  courseId: string
  title: string
  professorName: string
  capacity: number
  count: number
}

export interface CourseRevenueSummary {
  courseId: string
  title: string
  professorId?: string
  professorName?: string
  enrollments: number
  revenue: number
}

export interface ProfessorRevenueSummary {
  professorId: string
  professorName: string
  revenue: number
  enrollments: number
  courseCount?: number
}

export interface EnrollmentSummary {
  total: number
  statusCounts: Record<EnrollmentStatus, number>
  activeStudents: number
  tuitionPipeline: number
  topCourses: EnrollmentSummaryCourse[]
  courseRevenues: CourseRevenueSummary[]
  professorRevenues: ProfessorRevenueSummary[]
}

export interface AuthUser {
  id: string
  username: string
  email: string
  role: SystemRole
  avatarUrl?: string | null
  permissions?: Partial<Record<Permission, boolean>>
  customRoleId?: string | null
  customRoleName?: string | null
  accessProfile?: AccessProfile
  studentId?: string | null
  professorId?: string | null
  mfaEnabled?: boolean
}

export interface NewsItem extends Record<string, unknown> {
  id: string
  title: string
  body: string
  createdAt: string
  createdBy: string
  expiresAt?: string | null
  imageUrl?: string | null
}

export interface UserNotification extends Record<string, unknown> {
  id: string
  userId: string
  title: string
  body: string
  createdAt: string
  read: boolean
  actor?: string
}

export interface VisitorLog extends Record<string, unknown> {
  id: string
  visitorName: string
  purpose: string
  contactNumber?: string | null
  hostName?: string | null
  checkInAt: string
  checkOutAt?: string | null
  status: 'checked-in' | 'checked-out' | 'flagged'
  notes?: string | null
}

export interface IncidentReport extends Record<string, unknown> {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  location: string
  reportedBy: string
  reportedAt: string
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  resolvedAt?: string | null
}

export interface IdCardAccess extends Record<string, unknown> {
  id: string
  holderName: string
  holderType: 'student' | 'staff' | 'visitor'
  cardNumber: string
  issuedAt: string
  expiresAt?: string | null
  status: 'active' | 'revoked' | 'expired'
  notes?: string | null
}

export interface MaintenanceRequest extends Record<string, unknown> {
  id: string
  title: string
  description: string
  category: string
  location: string
  requestedBy: string
  requestedAt: string
  status: 'open' | 'in-progress' | 'on-hold' | 'completed'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  assignedTo?: string | null
  completedAt?: string | null
}

export interface EquipmentRequest extends Record<string, unknown> {
  id: string
  itemName: string
  quantity: number
  requestedBy: string
  requestedAt: string
  location: string
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled'
  notes?: string | null
}

export interface RoomBooking extends Record<string, unknown> {
  id: string
  roomName: string
  bookedBy: string
  purpose: string
  startAt: string
  endAt: string
  status: 'requested' | 'approved' | 'rejected' | 'cancelled'
  notes?: string | null
  bookingType?: 'standard' | 'mock-class'
  courseId?: string | null
  courseTitle?: string | null
  professorId?: string | null
  professorName?: string | null
}

export interface ResearchGrant extends Record<string, unknown> {
  id: string
  projectTitle: string
  principalInvestigator: string
  amount: number
  sponsor: string
  submittedAt: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'funded'
  summary?: string | null
}

export interface Publication extends Record<string, unknown> {
  id: string
  title: string
  authors: string[]
  journal?: string | null
  publishedAt: string
  doi?: string | null
  status: 'draft' | 'submitted' | 'published'
  abstract?: string | null
}

export interface ResearchRequest extends Record<string, unknown> {
  id: string
  title: string
  requester: string
  requestedAt: string
  status: 'open' | 'in-review' | 'approved' | 'closed'
  department?: string | null
  notes?: string | null
}

export interface StaffRecord extends Record<string, unknown> {
  id: string
  firstName: string
  lastName: string
  email: string
  department?: string | null
  position?: string | null
  employmentStatus: 'active' | 'on-leave' | 'terminated'
  hireDate?: string | null
  salary?: number | null
  phone?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface PayrollEntry extends Record<string, unknown> {
  id: string
  staffId: string
  staffName: string
  payPeriod: string
  amount: number
  status: 'pending' | 'paid'
  paidAt?: string | null
  notes?: string | null
  createdAt: string
}

export interface LibraryBook extends Record<string, unknown> {
  id: string
  title: string
  author: string
  isbn?: string | null
  category?: string | null
  totalCopies: number
  availableCopies: number
  createdAt: string
  updatedAt: string
}

export interface LibraryLoan extends Record<string, unknown> {
  id: string
  bookId: string
  bookTitle: string
  borrowerName: string
  borrowerType: 'student' | 'staff'
  borrowedAt: string
  dueAt: string
  returnedAt?: string | null
  status: 'borrowed' | 'returned' | 'overdue'
  createdAt: string
}

export interface CampusEvent extends Record<string, unknown> {
  id: string
  title: string
  description?: string | null
  category: 'academic' | 'social' | 'sports' | 'career' | 'other'
  location: string
  startAt: string
  endAt?: string | null
  capacity?: number | null
  rsvpCount: number
  createdAt: string
  updatedAt: string
}

export interface CampusEventRsvp extends Record<string, unknown> {
  id: string
  eventId: string
  studentId: string
  studentName: string
  createdAt: string
}

export interface HousingAssignment extends Record<string, unknown> {
  id: string
  studentId: string
  studentName: string
  buildingName: string
  roomNumber: string
  bedNumber?: string | null
  status: 'active' | 'pending' | 'ended'
  startDate: string
  endDate?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface MealPlan extends Record<string, unknown> {
  id: string
  studentId: string
  studentName: string
  planName: string
  balance: number
  status: 'active' | 'inactive'
  startDate: string
  endDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdvisingAppointment extends Record<string, unknown> {
  id: string
  studentId: string
  studentName: string
  advisorId: string
  advisorName: string
  scheduledAt: string
  durationMinutes: number
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CourseReview extends Record<string, unknown> {
  id: string
  courseId: string
  courseTitle: string
  professorId?: string | null
  professorName?: string | null
  studentId: string
  rating: number
  difficulty?: number | null
  comment?: string | null
  createdAt: string
  updatedAt: string
}

export interface CourseReviewSummary extends Record<string, unknown> {
  courseId: string
  averageRating: number
  averageDifficulty: number | null
  reviewCount: number
}

export interface SsoConfig extends Record<string, unknown> {
  id: string
  provider: string
  clientId: string
  issuerUrl?: string | null
  enabled: boolean
  updatedAt: string
}

export interface Integration extends Record<string, unknown> {
  id: string
  name: string
  endpoint: string
  status: 'active' | 'paused' | 'error'
  lastSyncedAt?: string | null
  notes?: string | null
}

export interface MaintenanceState extends Record<string, unknown> {
  id: string
  enabled: boolean
  message?: string | null
  updatedAt: string
  updatedBy?: string | null
}

export type ModuleAccessState = 'open' | 'locked' | 'hidden'

export interface ModuleToggleState extends Record<string, unknown> {
  id: string
  passphraseHash: string | null
  /** @deprecated use moduleStates */
  disabledModules: string[]
  /** @deprecated use featureStates */
  disabledFeatures: string[]
  moduleStates: Record<string, ModuleAccessState>
  featureStates: Record<string, ModuleAccessState>
  lockMessage?: string | null
  updatedAt: string
  updatedBy?: string | null
}

export interface DeviceLog extends Record<string, unknown> {
  id: string
  deviceName: string
  ipAddress?: string | null
  eventType: string
  createdAt: string
  userId?: string | null
  details?: string | null
}

export interface EnrollmentOverride extends Record<string, unknown> {
  id: string
  studentId: string
  courseId: string
  reason: string
  approvedBy: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected' | 'revoked'
}

export interface TransferCredit extends Record<string, unknown> {
  id: string
  studentId: string
  sourceInstitution: string
  courseTitle: string
  creditHours: number
  evaluatedBy: string
  evaluatedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface TranscriptRequest extends Record<string, unknown> {
  id: string
  studentId: string
  documentType: 'transcript' | 'enrollment-letter' | 'graduation-letter' | 'recommendation-letter' | 'other'
  requestedAt: string
  deliveryMethod: 'pickup' | 'email' | 'mail'
  status: 'pending' | 'processing' | 'ready' | 'delivered' | 'rejected'
  notes?: string | null
}

export interface GraduationApproval extends Record<string, unknown> {
  id: string
  studentId: string
  program: string
  approvedBy: string
  approvedAt: string
  status: 'pending' | 'approved' | 'rejected'
  remarks?: string | null
}

export interface ScholarshipAward extends Record<string, unknown> {
  id: string
  studentId: string
  scholarshipName: string
  amount: number
  awardedBy: string
  awardedAt: string
  status: 'pending' | 'awarded' | 'revoked'
  notes?: string | null
}

export interface InterviewSchedule extends Record<string, unknown> {
  id: string
  applicantName: string
  program: string
  interviewer: string
  scheduledAt: string
  status: 'scheduled' | 'completed' | 'rescheduled' | 'cancelled'
  notes?: string | null
}

export interface OfferLetter extends Record<string, unknown> {
  id: string
  applicantName: string
  program: string
  issuedAt: string
  status: 'draft' | 'issued' | 'accepted' | 'declined' | 'expired'
  expirationDate?: string | null
  notes?: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface StudentProfileSummary {
  student: Student
  enrollments: Enrollment[]
  balance?: number
}

export interface CourseAvailability extends Course {
  semester?: string | null
  enrolledCount?: number
  availableSeats?: number
  deadline?: string | null
}

export type Permission =
  | "users:manage"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "manage_users"
  | "students:view"
  | "students:create"
  | "students:edit"
  | "students:delete"
  | "professors:view"
  | "professors:create"
  | "professors:edit"
  | "professors:delete"
  | "marketing:view"
  | "marketing:manage"
  | "applications:view"
  | "applications:manage"
  | "finance:view"
  | "finance:manage"
  | "finance:approve"
  | "VIEW_FINANCIALS"
  | "enrollment:view"
  | "enrollment:manage"
  | "enrollment:self"
  | "enrollment:override-window"
  | "enrollment:override-capacity"
  | "override_capacity"
  | "ENTER_GRADES"
  | "edit_own_grades"
  | "edit_any_grade"
  | "feedback:view"
  | "feedback:manage"
  | "news:view"
  | "news:manage"
  | "audit:view"
  | "audit:export"
  | "reports:view"
  | "reports:export"
  | "ADMIN_VIEW_SCHEDULE"
  | "MANAGE_RESOURCES"
  | "settings:manage"
  | "settings:security"
  | "settings:integrations"
  | "settings:sso"

export interface Question extends Record<string, unknown> {
  id: string
  courseId: string
  professorId: string
  studentId: string
  body: string
  createdAt: string
  status: "open" | "answered"
  reply?: string
  repliedAt?: string | null
}

export type SiteMetricKey = "students" | "courses" | "professors" | "enrollments"

export interface SiteStat {
  label: string
  value: string
  iconKey?: string
  metricKey?: SiteMetricKey
}

export interface SiteSection {
  badge?: string
  title: string
  body: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  imageUrl?: string | null
}

export interface SiteContentHighlight {
  title: string
  description: string
  iconKey?: string
}

export interface SiteContent extends Record<string, unknown> {
  id: string
  hero: {
    badge?: string
    title: string
    subtitle: string
    primaryCtaLabel?: string
    primaryCtaHref?: string
    secondaryCtaLabel?: string
    secondaryCtaHref?: string
    backgroundImageUrl?: string | null
  }
  stats: SiteStat[]
  highlights?: SiteContentHighlight[]
  about: SiteSection
  admissions: SiteSection
  metrics?: Partial<Record<SiteMetricKey, number>>
  updatedAt: string
}

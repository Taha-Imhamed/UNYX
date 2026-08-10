export interface Student {
    id: string;
    displayId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    photo: string;
    enrollmentDate: string;
    program: string;
    status: "active" | "inactive" | "graduated";
    address: string;
    dateOfBirth: string;
    balance: number;
    supervisorId?: string;
    supervisorName?: string;
}
export interface Professor {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    photo: string;
    department: string;
    salary: number;
    hireDate: string;
    specialization: string;
    status: "active" | "on-leave" | "retired";
}
export type ScheduleDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export interface CourseScheduleEntry {
    day: ScheduleDay;
    startTime: string;
    endTime: string;
    location: string;
    department?: string;
    branch?: string;
}
export interface Expense {
    id: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    approvedBy: string;
    status: "pending" | "approved" | "rejected";
}
export interface Income {
    id: string;
    source: string;
    description: string;
    amount: number;
    date: string;
    studentId?: string;
}
export interface Feedback {
    id: string;
    studentId: string;
    studentName: string;
    professorId?: string;
    professorName?: string;
    type: "course" | "facility" | "professor" | "general";
    rating: number;
    comment: string;
    date: string;
    status: "new" | "reviewed" | "resolved";
    subject?: string;
    category?: string;
    courseId?: string;
    priority?: "low" | "normal" | "high";
    context?: string;
    source?: string;
    targetRole?: "admin" | "supervisor";
    attachment?: string;
    attachmentName?: string;
}
export interface User {
    id: string;
    username: string;
    email: string;
    role: "admin" | "supervisor" | "user" | "student" | "professor";
    createdAt: string;
    lastLogin: string;
    status: "active" | "inactive";
    avatarUrl?: string | null;
    password?: string;
    permissions?: Partial<Record<Permission, boolean>>;
    studentId?: string | null;
    professorId?: string | null;
}
export interface DashboardStats {
    totalStudents: number;
    activeStudents: number;
    totalProfessors: number;
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    pendingFeedback: number;
    averageRating: number;
}
export type PaymentMethod = "cash" | "card" | "transfer";
export type CouponCode = string;
export interface Coupon {
    code: CouponCode;
    percent: number;
    createdAt: string;
}
export type EnrollmentStatus = "pending" | "pendingSupervisorApproval" | "pendingAdvisorApproval" | "active" | "waitlisted" | "completed" | "cancelled";
export interface Course {
    id: string;
    displayId: string;
    title: string;
    code: string;
    professorId: string;
    professorName: string;
    sectionId?: string;
    capacity: number;
    startDate: string;
    endDate: string;
    price: number;
    department?: string;
    branch?: string;
    location?: string;
    schedule?: CourseScheduleEntry[];
    enrollmentOpen?: boolean;
    enrollmentOpensAt?: string | null;
    enrollmentClosesAt?: string | null;
    enrollmentOpenAt?: string | null;
    enrollmentCloseAt?: string | null;
    enrollmentStatusNote?: string | null;
}
export interface Enrollment {
    id: string;
    displayId: string;
    studentId: string;
    courseId: string;
    courseTitle: string;
    professorId: string;
    professorName: string;
    status: EnrollmentStatus;
    startDate: string;
    endDate: string;
    price: number;
    basePrice?: number;
    couponCode?: CouponCode;
    discountPercent?: number;
    discountAmount?: number;
    createdAt: string;
    updatedAt: string;
    grade?: string | null;
    gradeMidterm?: number | null;
    gradeFinal?: number | null;
    gradeProject?: number | null;
    gradeParticipation?: number | null;
    gradeTotal?: number | null;
    letterGrade?: string | null;
    semester?: string | null;
    tuitionCharged?: boolean;
    chargedAt?: string | null;
    approvedByUserId?: string | null;
    approvedByName?: string | null;
    approvedByRole?: User['role'] | null;
    approvedAt?: string | null;
    rejectedByUserId?: string | null;
    rejectedByName?: string | null;
    rejectedByRole?: User['role'] | null;
    rejectedAt?: string | null;
}
export interface EnrollmentWithCourse extends Enrollment {
    courseCode?: string;
    sectionId?: string;
    courseSchedule?: CourseScheduleEntry[];
}
export type TransactionType = "credit" | "debit";
export type TransactionSource = "payment" | "enrollment" | "adjustment";
export interface PaymentTransaction {
    id: string;
    displayId: string;
    studentId: string;
    amount: number;
    method: PaymentMethod | "internal";
    note?: string;
    createdAt: string;
    type: TransactionType;
    source: TransactionSource;
    referenceId?: string;
    enrollmentId?: string;
    courseId?: string;
    courseTitle?: string;
    balanceAfter?: number;
}
export interface StudentBalanceSummary {
    studentId: string;
    studentDisplayId?: string;
    balance: number;
    updatedAt: string;
}
export interface StudentFinancialSnapshot extends StudentBalanceSummary {
    student: Pick<Student, "id" | "displayId" | "firstName" | "lastName" | "email" | "photo"> & {
        balance: number;
    };
    transactions: PaymentTransaction[];
    enrollments: Enrollment[];
    paymentStatus: "paid" | "partial" | "unpaid";
}
export interface EnrollmentSummaryCourse {
    courseId: string;
    title: string;
    professorName: string;
    capacity: number;
    count: number;
}
export interface CourseRevenueSummary {
    courseId: string;
    title: string;
    professorId?: string;
    professorName?: string;
    enrollments: number;
    revenue: number;
}
export interface ProfessorRevenueSummary {
    professorId: string;
    professorName: string;
    revenue: number;
    enrollments: number;
    courseCount?: number;
}
export interface EnrollmentSummary {
    total: number;
    statusCounts: Record<EnrollmentStatus, number>;
    activeStudents: number;
    tuitionPipeline: number;
    topCourses: EnrollmentSummaryCourse[];
    courseRevenues: CourseRevenueSummary[];
    professorRevenues: ProfessorRevenueSummary[];
}
export interface AuthUser {
    id: string;
    username: string;
    email: string;
    role: "admin" | "supervisor" | "user" | "student" | "professor";
    avatarUrl?: string | null;
    permissions?: Partial<Record<Permission, boolean>>;
    studentId?: string | null;
    professorId?: string | null;
}
export interface NewsItem {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    createdBy: string;
    expiresAt?: string | null;
    imageUrl?: string | null;
}
export interface UserNotification {
    id: string;
    userId: string;
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
    actor?: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface StudentProfileSummary {
    student: Student;
    enrollments: Enrollment[];
    balance?: number;
}
export interface CourseAvailability extends Course {
    semester?: string | null;
    enrolledCount?: number;
    availableSeats?: number;
    deadline?: string | null;
}
export type Permission = "users:manage" | "marketing:view" | "marketing:manage" | "finance:view" | "finance:manage" | "enrollment:view" | "enrollment:manage" | "reports:view" | "settings:manage";
export interface Question {
    id: string;
    courseId: string;
    professorId: string;
    studentId: string;
    body: string;
    createdAt: string;
    status: "open" | "answered";
    reply?: string;
    repliedAt?: string | null;
}
export type SiteMetricKey = "students" | "courses" | "professors" | "enrollments";
export interface SiteStat {
    label: string;
    value: string;
    iconKey?: string;
    metricKey?: SiteMetricKey;
}
export interface SiteSection {
    badge?: string;
    title: string;
    body: string;
    primaryCtaLabel?: string;
    primaryCtaHref?: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
    imageUrl?: string | null;
}
export interface SiteContentHighlight {
    title: string;
    description: string;
    iconKey?: string;
}
export interface SiteContent {
    id: string;
    hero: {
        badge?: string;
        title: string;
        subtitle: string;
        primaryCtaLabel?: string;
        primaryCtaHref?: string;
        secondaryCtaLabel?: string;
        secondaryCtaHref?: string;
        backgroundImageUrl?: string | null;
    };
    stats: SiteStat[];
    highlights?: SiteContentHighlight[];
    about: SiteSection;
    admissions: SiteSection;
    metrics?: Partial<Record<SiteMetricKey, number>>;
    updatedAt: string;
}
//# sourceMappingURL=index.d.ts.map
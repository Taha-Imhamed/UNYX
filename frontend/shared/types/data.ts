export interface Student {
  id: string
  displayId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  photo: string
  enrollmentDate: string
  program: string
  status: "active" | "inactive" | "graduated"
  address: string
  dateOfBirth: string
  balance: number
}

export interface Professor {
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

export interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  approvedBy: string
  status: "pending" | "approved" | "rejected"
}

export interface Income {
  id: string
  source: string
  description: string
  amount: number
  date: string
  studentId?: string
}

export interface Feedback {
  id: string
  studentId: string
  studentName: string
  professorId?: string
  professorName?: string
  type: "course" | "facility" | "professor" | "general"
  rating: number
  comment: string
  date: string
  status: "new" | "reviewed" | "resolved"
}

export interface User {
  id: string
  username: string
  email: string
  role: "admin" | "supervisor" | "user" | "student"
  createdAt: string
  lastLogin: string
  status: "active" | "inactive"
  avatarUrl?: string | null
  studentId?: string | null
}

export interface NewsItem {
  id: string
  title: string
  body: string
  createdAt: string
  createdBy: string
  expiresAt?: string | null
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
}

// Mock Students
export const students: Student[] = [
  {
    id: "b1e0b023-4480-4a2f-b8e6-5459eaf20ec0",
    displayId: "STU-B1E0",
    firstName: "Emma",
    lastName: "Wilson",
    email: "emma.wilson@email.com",
    phone: "+1 555-0101",
    photo: "/diverse-female-student.png",
    enrollmentDate: "2024-01-15",
    program: "Computer Science",
    status: "active",
    address: "123 Oak Street, Boston, MA",
    dateOfBirth: "2002-03-22",
    balance: 0,
  },
  {
    id: "b1032c15-1697-4227-a9b1-15d9741ceec1",
    displayId: "STU-B103",
    firstName: "James",
    lastName: "Chen",
    email: "james.chen@email.com",
    phone: "+1 555-0102",
    photo: "/male-asian-student-portrait.jpg",
    enrollmentDate: "2024-01-15",
    program: "Business Administration",
    status: "active",
    address: "456 Maple Ave, Cambridge, MA",
    dateOfBirth: "2001-07-14",
    balance: 0,
  },
  {
    id: "ba1d84ee-65f5-4718-a845-81d1bac47f08",
    displayId: "STU-BA1D",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 555-0103",
    photo: "/female-african-american-student.jpg",
    enrollmentDate: "2023-09-01",
    program: "Data Science",
    status: "active",
    address: "789 Pine Rd, Somerville, MA",
    dateOfBirth: "2000-11-08",
    balance: 0,
  },
  {
    id: "77adee2b-7fdf-4513-aecb-d5e120c99fcd",
    displayId: "STU-77AD",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@email.com",
    phone: "+1 555-0104",
    photo: "/male-student-casual.jpg",
    enrollmentDate: "2023-09-01",
    program: "Engineering",
    status: "inactive",
    address: "321 Elm St, Brookline, MA",
    dateOfBirth: "2001-05-30",
    balance: 0,
  },
  {
    id: "6586525a-87c4-491b-8470-eaa4545456d1",
    displayId: "STU-6586",
    firstName: "Lisa",
    lastName: "Martinez",
    email: "lisa.martinez@email.com",
    phone: "+1 555-0105",
    photo: "/female-latina-student.jpg",
    enrollmentDate: "2022-09-01",
    program: "Psychology",
    status: "graduated",
    address: "654 Cedar Lane, Newton, MA",
    dateOfBirth: "1999-09-15",
    balance: 0,
  },
]

// Mock Professors
export const professors: Professor[] = [
  {
    id: "PROF001",
    firstName: "Dr. Robert",
    lastName: "Anderson",
    email: "r.anderson@arcompany.edu",
    phone: "+1 555-0201",
    photo: "/male-professor-academic.jpg",
    department: "Computer Science",
    salary: 95000,
    hireDate: "2018-08-15",
    specialization: "Machine Learning",
    status: "active",
  },
  {
    id: "PROF002",
    firstName: "Dr. Jennifer",
    lastName: "Lee",
    email: "j.lee@arcompany.edu",
    phone: "+1 555-0202",
    photo: "/female-asian-professor.jpg",
    department: "Business Administration",
    salary: 88000,
    hireDate: "2019-01-10",
    specialization: "Marketing Strategy",
    status: "active",
  },
  {
    id: "PROF003",
    firstName: "Dr. William",
    lastName: "Taylor",
    email: "w.taylor@arcompany.edu",
    phone: "+1 555-0203",
    photo: "/older-male-professor.jpg",
    department: "Engineering",
    salary: 102000,
    hireDate: "2015-03-20",
    specialization: "Structural Engineering",
    status: "active",
  },
  {
    id: "PROF004",
    firstName: "Dr. Maria",
    lastName: "Garcia",
    email: "m.garcia@arcompany.edu",
    phone: "+1 555-0204",
    photo: "/female-latina-professor.jpg",
    department: "Data Science",
    salary: 91000,
    hireDate: "2020-09-01",
    specialization: "Statistical Analysis",
    status: "on-leave",
  },
]

// Mock Expenses
export const expenses: Expense[] = [
  {
    id: "EXP001",
    category: "Salaries",
    description: "Monthly faculty salaries",
    amount: 376000,
    date: "2024-12-01",
    approvedBy: "Admin",
    status: "approved",
  },
  {
    id: "EXP002",
    category: "Equipment",
    description: "New lab computers",
    amount: 45000,
    date: "2024-12-10",
    approvedBy: "Admin",
    status: "approved",
  },
  {
    id: "EXP003",
    category: "Maintenance",
    description: "Building repairs - East Wing",
    amount: 12500,
    date: "2024-12-15",
    approvedBy: "Admin",
    status: "pending",
  },
  {
    id: "EXP004",
    category: "Utilities",
    description: "Monthly utilities",
    amount: 8200,
    date: "2024-12-20",
    approvedBy: "Admin",
    status: "approved",
  },
]

// Mock Income
export const incomeData: Income[] = [
  {
    id: "INC001",
    source: "Tuition",
    description: "Spring 2025 tuition fees",
    amount: 450000,
    date: "2024-12-01",
  },
  {
    id: "INC002",
    source: "Grants",
    description: "Research grant - AI Lab",
    amount: 125000,
    date: "2024-12-05",
  },
  {
    id: "INC003",
    source: "Donations",
    description: "Alumni donation fund",
    amount: 35000,
    date: "2024-12-12",
  },
  {
    id: "INC004",
    source: "Events",
    description: "Conference registration fees",
    amount: 18500,
    date: "2024-12-18",
  },
]

// Mock Feedback
export const feedbackData: Feedback[] = [
  {
    id: "FB001",
    studentId: "b1e0b023-4480-4a2f-b8e6-5459eaf20ec0",
    studentName: "Emma Wilson",
    professorId: "PROF001",
    professorName: "Dr. Robert Anderson",
    type: "professor",
    rating: 5,
    comment: "Excellent teaching methods and very approachable for questions.",
    date: "2024-12-20",
    status: "reviewed",
  },
  {
    id: "FB002",
    studentId: "b1032c15-1697-4227-a9b1-15d9741ceec1",
    studentName: "James Chen",
    type: "facility",
    rating: 3,
    comment: "Library needs more quiet study spaces during exam periods.",
    date: "2024-12-18",
    status: "new",
  },
  {
    id: "FB003",
    studentId: "ba1d84ee-65f5-4718-a845-81d1bac47f08",
    studentName: "Sarah Johnson",
    type: "course",
    rating: 4,
    comment: "Data Science curriculum is well-structured but could use more hands-on projects.",
    date: "2024-12-15",
    status: "resolved",
  },
]

// Mock Users
export const users: User[] = [
  {
    id: "USR001",
    username: "admin",
    email: "admin@arcompany.edu",
    role: "admin",
    createdAt: "2024-01-01",
    lastLogin: "2024-12-26",
    status: "active",
  },
  {
    id: "USR002",
    username: "jsmith",
    email: "j.smith@arcompany.edu",
    role: "user",
    createdAt: "2024-03-15",
    lastLogin: "2024-12-25",
    status: "active",
  },
  {
    id: "USR003",
    username: "mwilliams",
    email: "m.williams@arcompany.edu",
    role: "user",
    createdAt: "2024-06-01",
    lastLogin: "2024-12-20",
    status: "inactive",
  },
]

// Dashboard Stats
export const dashboardStats = {
  totalStudents: 248,
  activeStudents: 215,
  totalProfessors: 32,
  totalIncome: 628500,
  totalExpenses: 441700,
  netIncome: 186800,
  pendingFeedback: 12,
  averageRating: 4.2,
}

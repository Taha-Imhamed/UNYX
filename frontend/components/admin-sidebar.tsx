"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  MessageSquare,
  Settings,
  UserCog,
  LogOut,
  ChevronLeft,
  Menu,
  BookOpen,
  Megaphone,
  History,
  CalendarClock,
  Home,
  ShieldCheck,
  Briefcase,
  WalletCards,
  ClipboardList,
  FileText,
  Presentation,
  BadgeHelp,
  NotebookPen,
  Send,
  Clock3,
  BarChart3,
  CalendarPlus2,
  SquareTerminal,
  Sparkles,
  DoorOpen,
  Bot,
  ServerCog,
  Lock,
  FlaskConical,
  Building2,
  LifeBuoy,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useMemo, useState } from "react"
import { useAuth, type AuthUser } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Permission } from "@shared/types"
import { useModuleToggles } from "@/lib/terminal-context"
import { moduleKeyForSidebarName } from "@/lib/terminal-modules"

type Role = AuthUser["role"]

type NavigationItem = {
  name: string
  href: string
  icon: typeof LayoutDashboard
  roleHome?: boolean
  allowedRoles?: Role[]
  requiredPermissions?: Permission[]
  /** Module-level feature key gated by the Terminal switchboard, e.g. ["enrollment", "waitlist"]. */
  featureKey?: [moduleKey: string, featureKey: string]
}

type NavigationSection = {
  title: string
  items: NavigationItem[]
}

const roleHomePath: Partial<Record<Role, string>> = {
  "super-admin": "/dashboard/super-admin",
  professor: "/dashboard/professor",
  advisor: "/dashboard/advisor",
  "teaching-assistant": "/dashboard/ta",
  registrar: "/dashboard/registrar",
  admissions: "/dashboard/admissions",
  finance: "/dashboard/finance",
  "it-admin": "/dashboard/it-admin",
  dean: "/dashboard/dean",
  hod: "/dashboard/hod",
  librarian: "/dashboard/librarian",
  "student-affairs": "/dashboard/student-affairs",
  hr: "/dashboard/hr",
  security: "/dashboard/security",
  facilities: "/dashboard/facilities",
  "research-office": "/dashboard/research-office",
}

function resolveHomePath(role?: Role) {
  if (!role) return "/dashboard"
  return roleHomePath[role] ?? "/dashboard"
}

function getAllUserRoles(user?: { role?: Role; secondaryRoles?: Role[] | null } | null) {
  if (!user?.role) return []
  return [user.role, ...((user.secondaryRoles ?? []).filter(Boolean))]
}

const navigationSections: NavigationSection[] = [
  {
    title: "Dashboard",
    items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roleHome: true }],
  },
  {
    title: "Assistant",
    items: [
      {
        name: "Kino",
        href: "/dashboard/kino",
        icon: Bot,
        allowedRoles: ["admin", "super-admin", "supervisor", "user", "professor", "advisor", "teaching-assistant", "registrar", "admissions", "finance", "it-admin", "dean", "hod", "librarian", "student-affairs", "hr", "security", "facilities", "research-office"],
      },
    ],
  },
  {
    title: "Academic Management",
    items: [
      {
        name: "Students",
        href: "/dashboard/students",
        icon: GraduationCap,
        requiredPermissions: ["students:view"],
      },
      {
        name: "Enrollment",
        href: "/dashboard/enrollment",
        icon: BookOpen,
        requiredPermissions: ["enrollment:view"],
      },
      {
        name: "Enrollment Approvals",
        href: "/dashboard/advisor",
        icon: ClipboardList,
        allowedRoles: ["advisor", "admin", "super-admin", "supervisor", "professor"],
      },
      {
        name: "My Advisees",
        href: "/dashboard/advisor/students",
        icon: GraduationCap,
        allowedRoles: ["advisor", "professor"],
      },
      {
        name: "Advising Appointments",
        href: "/dashboard/advisor/appointments",
        icon: CalendarClock,
        allowedRoles: ["advisor", "admin", "super-admin", "supervisor", "student-affairs"],
      },
      {
        name: "Classes",
        href: "/dashboard/enrollment/courses",
        icon: CalendarClock,
        allowedRoles: ["professor", "admin", "super-admin", "supervisor", "teaching-assistant", "hod", "registrar"],
      },
      {
        name: "Campuses",
        href: "/dashboard/enrollment/campuses",
        icon: Home,
        allowedRoles: ["admin", "super-admin", "supervisor", "registrar"],
      },
      {
        name: "Rooms",
        href: "/dashboard/enrollment/rooms",
        icon: DoorOpen,
        allowedRoles: ["admin", "super-admin", "supervisor", "registrar"],
        featureKey: ["enrollment", "rooms"],
      },
      {
        name: "Waitlist",
        href: "/dashboard/enrollment/waitlist",
        icon: Clock3,
        allowedRoles: ["admin", "super-admin", "supervisor", "registrar", "advisor"],
        featureKey: ["enrollment", "waitlist"],
      },
      {
        name: "Seat Utilization",
        href: "/dashboard/enrollment/utilization",
        icon: BarChart3,
        allowedRoles: ["admin", "super-admin", "supervisor", "registrar"],
        featureKey: ["enrollment", "utilization"],
      },
      {
        name: "Professors",
        href: "/dashboard/professors",
        icon: Users,
        requiredPermissions: ["professors:view"],
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        name: "Finance",
        href: "/dashboard/finance",
        icon: DollarSign,
        requiredPermissions: ["finance:view"],
      },
      {
        name: "Applications",
        href: "/dashboard/applications",
        icon: Briefcase,
        requiredPermissions: ["applications:view"],
      },
      {
        name: "News",
        href: "/dashboard/news",
        icon: Megaphone,
        requiredPermissions: ["news:view"],
      },
      {
        name: "Feedback",
        href: "/dashboard/feedback",
        icon: MessageSquare,
        requiredPermissions: ["feedback:view"],
      },
      {
        name: "Security Records",
        href: "/dashboard/security/records",
        icon: ShieldCheck,
        allowedRoles: ["admin", "super-admin", "supervisor", "it-admin", "security"],
      },
      {
        name: "Facilities Records",
        href: "/dashboard/facilities/records",
        icon: DoorOpen,
        allowedRoles: ["admin", "super-admin", "supervisor", "it-admin", "facilities"],
      },
      {
        name: "Research Records",
        href: "/dashboard/research-office/records",
        icon: FlaskConical,
        allowedRoles: ["admin", "super-admin", "supervisor", "it-admin", "research-office"],
      },
      {
        name: "Device Logs",
        href: "/dashboard/it-admin/device-logs",
        icon: ServerCog,
        allowedRoles: ["admin", "super-admin", "supervisor", "it-admin"],
      },
      {
        name: "HR Records",
        href: "/dashboard/hr/records",
        icon: UserCog,
        allowedRoles: ["admin", "super-admin", "supervisor", "hr"],
      },
      {
        name: "Library Records",
        href: "/dashboard/librarian/records",
        icon: BookOpen,
        allowedRoles: ["admin", "super-admin", "supervisor", "librarian"],
      },
      {
        name: "Campus Life",
        href: "/dashboard/student-affairs/campus-life",
        icon: Building2,
        allowedRoles: ["admin", "super-admin", "supervisor", "student-affairs"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        name: "Audit",
        href: "/dashboard/audit",
        icon: History,
        requiredPermissions: ["audit:view"],
      },
      {
        name: "Users",
        href: "/dashboard/users",
        icon: UserCog,
        requiredPermissions: ["users:manage"],
      },
      {
        name: "Terminal",
        href: "/dashboard/terminal",
        icon: SquareTerminal,
        allowedRoles: ["super-admin"],
      },
      {
        name: "Last Features",
        href: "/dashboard/last-features",
        icon: Sparkles,
        allowedRoles: ["super-admin"],
      },
      {
        name: "Server",
        href: "/dashboard/server",
        icon: ServerCog,
        allowedRoles: ["super-admin"],
      },
      {
        name: "IoT Connectors",
        href: "/dashboard/iot-connectors",
        icon: Wifi,
        allowedRoles: ["super-admin"],
      },
    ],
  },
  {
    title: "Requests",
    items: [
      {
        name: "Requests",
        href: "/dashboard/requests",
        icon: WalletCards,
        allowedRoles: ["admin", "super-admin", "supervisor", "professor", "advisor", "teaching-assistant", "registrar", "admissions", "finance", "it-admin", "dean", "hod", "librarian", "student-affairs", "hr", "security", "facilities", "research-office", "user"],
      },
      {
        name: "Tickets",
        href: "/dashboard/tickets",
        icon: LifeBuoy,
        allowedRoles: ["admin", "super-admin", "supervisor", "professor", "advisor", "teaching-assistant", "registrar", "admissions", "finance", "it-admin", "dean", "hod", "librarian", "student-affairs", "hr", "security", "facilities", "research-office", "user"],
      },
    ],
  },
]

const professorNavigationSections: NavigationSection[] = [
  {
    title: "Teaching Hub",
    items: [
      { name: "Class Overview", href: "/dashboard/professor", icon: LayoutDashboard, allowedRoles: ["professor"], featureKey: ["professor", "class-overview"] },
      { name: "Schedule", href: "/dashboard/professor/schedule", icon: CalendarClock, allowedRoles: ["professor"], featureKey: ["professor", "schedule"] },
      { name: "Assignments", href: "/dashboard/professor/assignments", icon: NotebookPen, allowedRoles: ["professor"], featureKey: ["professor", "assignments"] },
      { name: "Student Roster", href: "/dashboard/professor/roster", icon: ClipboardList, allowedRoles: ["professor"], featureKey: ["professor", "roster"] },
      { name: "Mock-up Classes", href: "/dashboard/professor/mock-classes", icon: CalendarPlus2, allowedRoles: ["professor"], featureKey: ["professor", "mock-classes"] },
      { name: "Finance Requests", href: "/dashboard/professor/finance-requests", icon: WalletCards, allowedRoles: ["professor"], featureKey: ["professor", "finance-requests"] },
    ],
  },
  {
    title: "Course Delivery",
    items: [
      { name: "Materials", href: "/dashboard/professor/materials", icon: FileText, allowedRoles: ["professor"], featureKey: ["professor", "materials"] },
      { name: "Quizzes", href: "/dashboard/professor/quizzes", icon: BadgeHelp, allowedRoles: ["professor"], featureKey: ["professor", "quizzes"] },
      { name: "Gradebook", href: "/dashboard/professor/gradebook", icon: Presentation, allowedRoles: ["professor"], featureKey: ["professor", "gradebook"] },
      { name: "Grade Submission", href: "/dashboard/professor/grade-submission", icon: Presentation, allowedRoles: ["professor"], featureKey: ["professor", "grade-submission"] },
    ],
  },
  {
    title: "Engagement",
    items: [
      { name: "Messages", href: "/dashboard/professor/messages", icon: Send, allowedRoles: ["professor"], featureKey: ["professor", "messages"] },
      { name: "Announcements", href: "/dashboard/professor/announcements", icon: Megaphone, allowedRoles: ["professor"], featureKey: ["professor", "announcements"] },
      { name: "Office Hours", href: "/dashboard/professor/office-hours", icon: Clock3, allowedRoles: ["professor"], featureKey: ["professor", "office-hours"] },
      { name: "Student Questions", href: "/dashboard/professor/questions", icon: MessageSquare, allowedRoles: ["professor"], featureKey: ["professor", "questions"] },
      { name: "Student Requests", href: "/dashboard/professor/students-requests", icon: ClipboardList, allowedRoles: ["professor"], featureKey: ["professor", "students-requests"] },
    ],
  },
  {
    title: "Insights",
    items: [
      { name: "Attendance", href: "/dashboard/professor/attendance", icon: CalendarClock, allowedRoles: ["professor"], featureKey: ["professor", "attendance"] },
      { name: "Analytics", href: "/dashboard/professor/analytics", icon: BarChart3, allowedRoles: ["professor"], featureKey: ["professor", "analytics"] },
      { name: "Pass/Fail Report", href: "/dashboard/professor/reports", icon: History, allowedRoles: ["professor"], featureKey: ["professor", "reports"] },
    ],
  },
]

const settingsNavigationSection: NavigationSection = {
  title: "Preferences",
  items: [
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ],
}

function formatRoleLabel(role?: Role) {
  if (!role) return "User"
  return role
    .split("-")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ")
}

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
  locked,
}: {
  href: string
  label: string
  icon: typeof Home
  isActive: boolean
  collapsed: boolean
  locked?: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      style={isActive ? undefined : { color: "var(--menu-foreground-muted)" }}
      className={cn(
        "group relative flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-[14px] transition-all duration-200",
        isActive
          ? "bg-[linear-gradient(90deg,#2f56c8,#3860d6)] font-semibold text-white shadow-[0_4px_12px_rgba(47,86,200,0.4)]"
          : "hover:bg-white/[0.07] hover:[color:var(--menu-foreground)]",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon
        className="h-[18px] w-[18px] shrink-0"
        style={{ color: isActive ? "#fff" : "var(--menu-foreground-muted)" }}
      />
      {!collapsed && <span className="flex-1 leading-5">{label}</span>}
      {locked && <Lock className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white/80" : "text-amber-400")} />}
    </Link>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const currentPathname = pathname ?? ""
  const [collapsed, setCollapsed] = useState(false)
  const [currentHash, setCurrentHash] = useState("")
  const { user, logout, hasPermission } = useAuth()
  const { isModuleEnabled, isFeatureEnabled, getModuleState } = useModuleToggles()

  useEffect(() => {
    const syncHash = () => setCurrentHash(typeof window !== "undefined" ? window.location.hash : "")
    syncHash()
    window.addEventListener("hashchange", syncHash)
    return () => window.removeEventListener("hashchange", syncHash)
  }, [])

  const filteredSections = useMemo(() => {
    const baseSections =
      user?.role === "professor"
        ? [...navigationSections, ...professorNavigationSections, settingsNavigationSection]
        : [...navigationSections, settingsNavigationSection]
          return baseSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.roleHome) return true
          // Hide the central Enrollment management page from professors in the sidebar
                if (user?.role === "professor" && item.href === "/dashboard/enrollment") return false
                // Also hide the "Classes" link from professors
                if (user?.role === "professor" && item.name === "Classes") return false
          const allRoles = getAllUserRoles(user)
          const roleAllowed =
            !item.allowedRoles ||
            (allRoles.length > 0 &&
              allRoles.some((role) =>
                item.allowedRoles?.includes(role) || (role === "super-admin" && item.allowedRoles?.includes("admin")),
              ))
          if (!roleAllowed) return false
          if (!isModuleEnabled(moduleKeyForSidebarName(item.name))) return false
          if (item.featureKey && !isFeatureEnabled(item.featureKey[0], item.featureKey[1])) return false
          if (item.requiredPermissions?.length) {
            return item.requiredPermissions.every((permission) => hasPermission(permission))
          }
          return true
        }),
      }))
      .filter((section) => section.items.length > 0)
  }, [hasPermission, isModuleEnabled, isFeatureEnabled, user?.role, user?.secondaryRoles])

  const roleLabel = formatRoleLabel(user?.role)
  const homeHref = resolveHomePath(user?.role)

  return (
    <aside
      style={{
        backgroundImage: "linear-gradient(180deg, var(--menu-color) 0%, color-mix(in oklab, var(--menu-color) 78%, black 22%) 100%)",
        color: "var(--menu-foreground)",
      }}
      className={cn(
        "relative flex h-full flex-col shadow-[0_22px_48px_-28px_rgba(15,23,42,0.56)] print:hidden",
        collapsed ? "w-24" : "w-[16.5rem]",
      )}
    >
      <div className="flex items-center justify-between px-4 py-[18px]">
        {!collapsed && (
          <Link href={homeHref} className="min-w-0">
            <span className="block truncate text-[11px] font-extrabold uppercase tracking-[0.12em]" style={{ color: "var(--menu-foreground)" }}>{roleLabel} Menu</span>
            <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--menu-foreground-muted)" }}>UNYT Portal</p>
          </Link>
        )}
        <div className="flex items-center gap-2">
          {!collapsed && (
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-[9px] border border-[#23345e] bg-[#16244a] text-[#aebbdd] hover:bg-[#1c2c56]">
              <Link href="/" aria-label="Go to home">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((value) => !value)}
            className="h-8 w-8 rounded-[9px] border border-[#23345e] bg-[#16244a] text-[#aebbdd] hover:bg-[#1c2c56]"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[22px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className={cn(
            "mb-[22px] rounded-[16px] border border-white/10 bg-white/5 px-4 py-[18px] text-center",
            collapsed && "px-2",
          )}
        >
          <Avatar className={cn("mx-auto shadow-[0_6px_16px_rgba(0,0,0,0.25)]", collapsed ? "h-14 w-14" : "h-[76px] w-[76px]")}>
            <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.username ?? "Admin"} />
            <AvatarFallback className="bg-[linear-gradient(135deg,#7f9ae0,#5f79c9)] text-[30px] font-bold text-white">
              {(user?.username ?? "AD")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <p className="mt-3 text-[16px] font-bold leading-5" style={{ color: "var(--menu-foreground)" }}>{user?.username || "Administrator"}</p>
              <p className="mt-[3px] text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--menu-foreground-muted)" }}>{roleLabel}</p>
              <p className="mt-[6px] break-all text-[12px] leading-4" style={{ color: "var(--menu-foreground-muted)" }}>{user?.email || "No email available"}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(72,187,120,0.15)] px-3 py-[5px] text-[11px] font-semibold text-[#7ee2a8]">
                <ShieldCheck className="h-3 w-3" />
                Access granted
              </div>
              <Button
                onClick={logout}
                style={{ color: "var(--menu-foreground)" }}
                className="mt-[14px] h-[38px] w-full rounded-[10px] border border-white/[0.14] bg-white/[0.06] text-[13px] font-semibold hover:bg-white/[0.12]"
                variant="ghost"
              >
                Logout
              </Button>
            </>
          )}
        </div>

        <div className="space-y-3.5">
          {filteredSections.map((section) => (
            <section key={section.title}>
              {!collapsed && <h3 className="mb-1.5 px-2 text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--menu-foreground-muted)" }}>{section.title}</h3>}
              <div className={cn("space-y-0.5", collapsed && "space-y-1")}>
                {section.items.map((item) => {
                  const href = item.roleHome ? homeHref : item.href
                  const [hrefPath, hrefHash = ""] = href.split("#")
                  const isPathMatch = currentPathname === hrefPath || currentPathname.startsWith(hrefPath + "/")
                  const isActive = hrefHash ? isPathMatch && currentHash === `#${hrefHash}` : isPathMatch
                  const locked = getModuleState(moduleKeyForSidebarName(item.name)) === "locked"
                  return (
                    <SidebarNavLink
                      key={`${section.title}-${item.name}`}
                      href={href}
                      label={item.name}
                      icon={item.icon}
                      isActive={isActive}
                      collapsed={collapsed}
                      locked={locked}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {collapsed && (
        <div className="border-t border-slate-700 p-3">
          <Button
            onClick={logout}
            variant="ghost"
            size="icon"
            className="h-10 w-full rounded-xl border border-slate-600 bg-white/5 text-slate-100 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  )
}

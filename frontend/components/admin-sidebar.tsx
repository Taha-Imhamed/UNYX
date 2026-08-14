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
import { useSuperAdminGifEnabled } from "@/lib/super-admin-gif"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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

function useAdminNavSections() {
  const { user, hasPermission } = useAuth()
  const { isModuleEnabled, isFeatureEnabled } = useModuleToggles()

  return useMemo(() => {
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
}

function MobileAdminNav() {
  const pathname = usePathname()
  const currentPathname = pathname ?? ""
  const { user, logout } = useAuth()
  const { getModuleState } = useModuleToggles()
  const filteredSections = useAdminNavSections()
  const [open, setOpen] = useState(false)

  const roleLabel = formatRoleLabel(user?.role)
  const homeHref = resolveHomePath(user?.role)

  return (
    <div
      style={{
        backgroundImage: "linear-gradient(180deg, var(--menu-color) 0%, color-mix(in oklab, var(--menu-color) 78%, black 22%) 100%)",
        color: "var(--menu-foreground)",
      }}
      className="sticky top-0 z-40 flex items-center justify-between gap-2 px-3 py-2.5 pt-[calc(env(safe-area-inset-top)+10px)] shadow-[0_4px_16px_rgba(15,23,42,0.18)] md:hidden print:hidden"
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[9px] border border-[#23345e] bg-[#16244a] text-[#aebbdd] hover:bg-[#1c2c56]">
            <Menu className="h-[18px] w-[18px]" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          style={{
            backgroundImage: "linear-gradient(180deg, var(--menu-color) 0%, color-mix(in oklab, var(--menu-color) 78%, black 22%) 100%)",
            color: "var(--menu-foreground)",
          }}
          className="w-[17.5rem] border-r border-white/10 p-0"
        >
          <SheetHeader className="px-4 py-4 text-left">
            <SheetTitle style={{ color: "var(--menu-foreground)" }} className="text-[11px] font-extrabold uppercase tracking-[0.12em]">
              {roleLabel} Menu
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="space-y-3.5">
              {filteredSections.map((section) => (
                <section key={section.title}>
                  <h3 className="mb-1.5 px-2 text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--menu-foreground-muted)" }}>
                    {section.title}
                  </h3>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const href = item.roleHome ? homeHref : item.href
                      const [hrefPath] = href.split("#")
                      const isActive = currentPathname === hrefPath || currentPathname.startsWith(hrefPath + "/")
                      const locked = getModuleState(moduleKeyForSidebarName(item.name)) === "locked"
                      return (
                        <div key={`${section.title}-${item.name}`} onClick={() => setOpen(false)}>
                          <SidebarNavLink href={href} label={item.name} icon={item.icon} isActive={isActive} collapsed={false} locked={locked} />
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
            <Button
              onClick={logout}
              style={{ color: "var(--menu-foreground)" }}
              className="mt-4 h-10 w-full rounded-[10px] border border-white/[0.14] bg-white/[0.06] text-[13px] font-semibold hover:bg-white/[0.12]"
              variant="ghost"
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Link href={homeHref} className="min-w-0 flex-1 text-center">
        <span className="block truncate text-[11px] font-extrabold uppercase tracking-[0.12em]" style={{ color: "var(--menu-foreground)" }}>
          UNYT Portal
        </span>
      </Link>
      <Avatar className="h-9 w-9 shadow-[0_4px_10px_rgba(0,0,0,0.25)]">
        <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.username ?? "Admin"} />
        <AvatarFallback className="bg-[linear-gradient(135deg,#7f9ae0,#5f79c9)] text-[13px] font-bold text-white">
          {(user?.username ?? "AD")
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

function MobileBottomTabBar() {
  const pathname = usePathname()
  const currentPathname = pathname ?? ""
  const { user } = useAuth()
  const filteredSections = useAdminNavSections()
  const [open, setOpen] = useState(false)

  const homeHref = resolveHomePath(user?.role)

  const flatItems = useMemo(
    () =>
      filteredSections
        .flatMap((section) => section.items)
        .filter((item) => item.name !== "Settings"),
    [filteredSections],
  )

  const tabItems = flatItems.slice(0, 4)
  const restItems = filteredSections
    .map((section) => ({ ...section, items: section.items.filter((item) => !tabItems.includes(item)) }))
    .filter((section) => section.items.length > 0)

  return (
    <>
      <nav
        style={{
          backgroundImage: "linear-gradient(180deg, color-mix(in oklab, var(--menu-color) 92%, black 8%) 0%, color-mix(in oklab, var(--menu-color) 74%, black 26%) 100%)",
          color: "var(--menu-foreground)",
        }}
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/10 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(15,23,42,0.22)] md:hidden print:hidden"
      >
        {tabItems.map((item) => {
          const href = item.roleHome ? homeHref : item.href
          const [hrefPath] = href.split("#")
          const isActive = currentPathname === hrefPath || currentPathname.startsWith(hrefPath + "/")
          const Icon = item.icon
          return (
            <Link
              key={`tab-${item.name}`}
              href={href}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold"
              style={{ color: isActive ? "#fff" : "var(--menu-foreground-muted)" }}
            >
              <Icon className="h-5 w-5" style={{ color: isActive ? "#8fa8f2" : "var(--menu-foreground-muted)" }} />
              <span className="max-w-full truncate px-1">{item.name}</span>
            </Link>
          )
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold"
              style={{ color: "var(--menu-foreground-muted)" }}
            >
              <Menu className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            style={{
              backgroundImage: "linear-gradient(180deg, var(--menu-color) 0%, color-mix(in oklab, var(--menu-color) 78%, black 22%) 100%)",
              color: "var(--menu-foreground)",
            }}
            className="max-h-[80vh] rounded-t-[20px] border-white/10 pb-[calc(env(safe-area-inset-bottom)+16px)]"
          >
            <SheetHeader className="px-1 pb-1 text-left">
              <SheetTitle style={{ color: "var(--menu-foreground)" }} className="text-[13px] font-extrabold uppercase tracking-[0.1em]">
                More
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="space-y-3.5">
                {restItems.map((section) => (
                  <section key={section.title}>
                    <h3 className="mb-1.5 px-2 text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--menu-foreground-muted)" }}>
                      {section.title}
                    </h3>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const href = item.roleHome ? homeHref : item.href
                        const [hrefPath] = href.split("#")
                        const isActive = currentPathname === hrefPath || currentPathname.startsWith(hrefPath + "/")
                        return (
                          <div key={`more-${section.title}-${item.name}`} onClick={() => setOpen(false)}>
                            <SidebarNavLink href={href} label={item.name} icon={item.icon} isActive={isActive} collapsed={false} />
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
      <div aria-hidden className="h-[calc(56px+env(safe-area-inset-bottom))] md:hidden" />
    </>
  )
}

function DesktopAdminSidebar() {
  const pathname = usePathname()
  const currentPathname = pathname ?? ""
  const [collapsed, setCollapsed] = useState(false)
  const [currentHash, setCurrentHash] = useState("")
  const { user, logout } = useAuth()
  const { getModuleState } = useModuleToggles()
  const [gifEnabled] = useSuperAdminGifEnabled()

  useEffect(() => {
    const syncHash = () => setCurrentHash(typeof window !== "undefined" ? window.location.hash : "")
    syncHash()
    window.addEventListener("hashchange", syncHash)
    return () => window.removeEventListener("hashchange", syncHash)
  }, [])

  const filteredSections = useAdminNavSections()

  const roleLabel = formatRoleLabel(user?.role)
  const homeHref = resolveHomePath(user?.role)

  return (
    <aside
      style={{
        backgroundImage: "linear-gradient(180deg, var(--menu-color) 0%, color-mix(in oklab, var(--menu-color) 78%, black 22%) 100%)",
        color: "var(--menu-foreground)",
      }}
      className={cn(
        "relative hidden h-full flex-col shadow-[0_22px_48px_-28px_rgba(15,23,42,0.56)] print:hidden md:flex",
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
          <div
            className="relative mx-auto flex items-center justify-center"
            style={
              !collapsed && user?.role === "super-admin" && gifEnabled
                ? { width: 170, height: 170 }
                : { width: collapsed ? 56 : 76, height: collapsed ? 56 : 76 }
            }
          >
            {!collapsed && user?.role === "super-admin" && gifEnabled && (
              <img
                src="https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUyZXlycTFoeGkzcHIzd2o2ZmppenhlaHVmc3VhaHR3NXJhNzY2dmw4OSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/JSq8jv7SEm5GrpFebD/source.gif"
                alt=""
                className="pointer-events-none absolute left-1/2 top-1/2 h-[170px] w-[270px] -translate-x-1/2 -translate-y-[65%] animate-halo-pulse object-contain"
                style={{ zIndex: 1 }}
              />
            )}
            <Avatar className={cn("relative shadow-[0_6px_16px_rgba(0,0,0,0.25)]", collapsed ? "h-14 w-14" : "h-[76px] w-[76px]")} style={{ zIndex: 2 }}>
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
          </div>

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

export function AdminSidebar() {
  return (
    <>
      <MobileAdminNav />
      <DesktopAdminSidebar />
      <MobileBottomTabBar />
    </>
  )
}

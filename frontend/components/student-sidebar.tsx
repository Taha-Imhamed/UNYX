"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useStudentProfile } from "@/hooks/use-student-portal"
import { useModuleToggles } from "@/lib/terminal-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notification-bell"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  BookOpen,
  ChevronLeft,
  ClipboardCheck,
  FileBadge2,
  FileText,
  GraduationCap,
  Home,
  LifeBuoy,
  LogOut,
  Menu,
  Receipt,
  School,
  Settings,
  ShieldCheck,
  Star,
  Trophy,
  User2,
} from "lucide-react"

type NavItem = {
  label: string
  href: string
  icon: typeof Home
  featureKey?: [moduleKey: string, featureKey: string]
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Dashboard",
    items: [{ label: "Dashboard", href: "/student", icon: Home }],
  },
  {
    title: "My Information",
    items: [
      { label: "Supervisor Information", href: "/student/supervisor", icon: ShieldCheck, featureKey: ["student-portal", "advisor-contact"] },
      { label: "Student Information", href: "/student/profile", icon: User2 },
      { label: "Settings", href: "/student/settings", icon: Settings },
      { label: "Transcript", href: "/student/transcript", icon: FileBadge2, featureKey: ["student-portal", "transcript-view"] },
    ],
  },
  {
    title: "My Courses",
    items: [
      { label: "My Current Grades", href: "/student/grades", icon: Trophy },
      { label: "My Course Schedule", href: "/student/schedule", icon: BookOpen },
      { label: "My Courses", href: "/student/attendance", icon: School, featureKey: ["student-portal", "attendance"] },
    ],
  },
  {
    title: "General Information",
    items: [
      { label: "Department Courses", href: "/student/department-courses", icon: GraduationCap, featureKey: ["student-portal", "course-catalog"] },
      { label: "Degree Audit", href: "/student/degree-audit", icon: ClipboardCheck, featureKey: ["student-portal", "degree-audit"] },
      { label: "GPA Calculator", href: "/student/gpa-calculator", icon: BarChart3, featureKey: ["student-portal", "gpa-calculator"] },
      { label: "Course Reviews", href: "/student/course-reviews", icon: Star, featureKey: ["student-portal", "course-reviews"] },
    ],
  },
  {
    title: "Enrollment",
    items: [
      { label: "Enrollment Renewal", href: "/student/enrollment-renewal", icon: GraduationCap, featureKey: ["student-portal", "enrollment-renewal"] },
      { label: "Payment Plan", href: "/student/payment-plan", icon: Receipt, featureKey: ["student-portal", "payment-plan"] },
    ],
  },
  {
    title: "Campus Life",
    items: [
      { label: "Campus Events", href: "/student/campus-events", icon: CalendarDays, featureKey: ["student-portal", "campus-events"] },
      { label: "Housing & Meal Plan", href: "/student/housing", icon: Building2, featureKey: ["student-portal", "housing"] },
      { label: "Academic Advising", href: "/student/advising", icon: CalendarClock, featureKey: ["student-portal", "advisor-contact"] },
    ],
  },
  {
    title: "Petition",
    items: [
      { label: "Document Request", href: "/student/document-request", icon: FileText, featureKey: ["student-portal", "document-request"] },
      { label: "Support", href: "/student/support", icon: LifeBuoy, featureKey: ["student-portal", "support"] },
      { label: "Tickets", href: "/student/tickets", icon: LifeBuoy, featureKey: ["student-portal", "tickets"] },
    ],
  },
  {
    title: "Message",
    items: [{ label: "Message", href: "/student/message", icon: LifeBuoy, featureKey: ["student-portal", "message"] }],
  },
]

function useStudentNavSections() {
  const { isModuleEnabled, isFeatureEnabled } = useModuleToggles()
  return useMemo(
    () =>
      navSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => {
            if (!isModuleEnabled("student-portal")) return false
            if (item.featureKey && !isFeatureEnabled(item.featureKey[0], item.featureKey[1])) return false
            return true
          }),
        }))
        .filter((section) => section.items.length > 0),
    [isModuleEnabled, isFeatureEnabled],
  )
}

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: {
  href: string
  label: string
  icon: typeof Home
  isActive: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] transition-all duration-200",
        isActive
          ? "bg-white/8 text-white"
          : "text-slate-100/90 hover:bg-white/6 hover:text-white",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white" : "text-slate-300")} />
      {!collapsed && <span className="leading-5">{label}</span>}
    </Link>
  )
}

function MobileStudentNav() {
  const pathname = usePathname()
  const currentPathname = pathname ?? ""
  const { logout } = useAuth()
  const { isFeatureEnabled } = useModuleToggles()
  const filteredSections = useStudentNavSections()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center justify-between gap-2 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-primary)] px-3 py-2.5 text-[var(--sidebar-primary-foreground)] md:hidden print:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md border border-slate-600 bg-white/5 text-slate-100 hover:bg-white/10">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[17.5rem] border-r border-[var(--sidebar-border)] bg-[var(--sidebar-primary)] p-0 text-[var(--sidebar-primary-foreground)]">
          <SheetHeader className="px-3 py-3 text-left">
            <SheetTitle className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white">Student Menu</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <div className="space-y-4">
              {filteredSections.map((section) => (
                <section key={section.title}>
                  <h3 className="mb-1 px-0.5 text-[13px] font-semibold text-white">{section.title}</h3>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = currentPathname === item.href || currentPathname.startsWith(item.href + "/")
                      return (
                        <div key={item.href} onClick={() => setOpen(false)}>
                          <SidebarNavLink href={item.href} label={item.label} icon={item.icon} isActive={isActive} collapsed={false} />
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
            <Button onClick={logout} variant="ghost" className="mt-4 h-9 w-full justify-start gap-2 text-[13px] text-slate-100 hover:bg-white/6 hover:text-white">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white">UNYT Portal</span>
      <div className="flex items-center gap-2">
        <DarkModeToggle />
        {isFeatureEnabled("student-portal", "notifications") && <NotificationBell />}
      </div>
    </div>
  )
}

function MobileBottomTabBar() {
  const pathname = usePathname()
  const currentPathname = pathname ?? ""
  const filteredSections = useStudentNavSections()
  const [open, setOpen] = useState(false)

  const flatItems = useMemo(() => filteredSections.flatMap((section) => section.items), [filteredSections])
  const tabItems = flatItems.slice(0, 4)
  const restItems = filteredSections
    .map((section) => ({ ...section, items: section.items.filter((item) => !tabItems.includes(item)) }))
    .filter((section) => section.items.length > 0)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-[var(--sidebar-border)] bg-[var(--sidebar-primary)] px-1 pb-[env(safe-area-inset-bottom)] text-[var(--sidebar-primary-foreground)] shadow-[0_-6px_20px_rgba(15,23,42,0.22)] md:hidden print:hidden">
        {tabItems.map((item) => {
          const isActive = currentPathname === item.href || currentPathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={`tab-${item.href}`}
              href={item.href}
              className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold", isActive ? "text-white" : "text-slate-300")}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate px-1">{item.label}</span>
            </Link>
          )
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-slate-300">
              <Menu className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[80vh] rounded-t-[20px] border-[var(--sidebar-border)] bg-[var(--sidebar-primary)] pb-[calc(env(safe-area-inset-bottom)+16px)] text-[var(--sidebar-primary-foreground)]"
          >
            <SheetHeader className="px-1 pb-1 text-left">
              <SheetTitle className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white">More</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="space-y-4">
                {restItems.map((section) => (
                  <section key={section.title}>
                    <h3 className="mb-1 px-0.5 text-[13px] font-semibold text-white">{section.title}</h3>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = currentPathname === item.href || currentPathname.startsWith(item.href + "/")
                        return (
                          <div key={`more-${item.href}`} onClick={() => setOpen(false)}>
                            <SidebarNavLink href={item.href} label={item.label} icon={item.icon} isActive={isActive} collapsed={false} />
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

function DesktopStudentSidebar() {
  const pathname = usePathname()
  const currentPathname = pathname ?? ""
  const { user, logout } = useAuth()
  const { profile } = useStudentProfile()
  const { isFeatureEnabled } = useModuleToggles()
  const filteredSections = useStudentNavSections()
  const [collapsed, setCollapsed] = useState(false)

  const displayName =
    profile ? `${profile.firstName} ${profile.lastName}` : user?.username || "Student"
  const displayId = profile?.displayId || user?.studentId || user?.id || ""
  const faculty = profile?.faculty || "Faculty information"
  const program = profile?.program || "Program information"
  const semester = profile?.currentSemester || ""

  return (
    <aside
      className={cn(
        "relative hidden h-full flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow-[0_22px_48px_-28px_rgba(15,23,42,0.56)] print:hidden md:flex",
        collapsed ? "w-24" : "w-[17.5rem]",
      )}
    >
      <div className="flex items-center justify-between px-3 py-3">
        {!collapsed && (
          <Link href="/student" className="min-w-0">
            <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-white">Student Menu</span>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-300">UNYT Portal</p>
          </Link>
        )}
        <div className="flex items-center gap-2">
          {!collapsed && <DarkModeToggle />}
          {!collapsed && isFeatureEnabled("student-portal", "notifications") && <NotificationBell />}
          {!collapsed && (
            <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-md border border-slate-600 bg-white/5 text-slate-100 hover:bg-white/10">
              <Link href="/" aria-label="Go to home">
                <Home className="h-3 w-3" />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((value) => !value)}
            className="h-7 w-7 rounded-md border border-slate-600 bg-white/5 text-slate-100 hover:bg-white/10"
          >
            {collapsed ? <Menu className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className={cn(
            "mb-4 rounded-[18px] border border-[var(--border)] bg-[var(--card)] px-3 py-4 text-center shadow-[0_14px_30px_-18px_rgba(0,0,0,0.45)]",
            collapsed && "px-2",
          )}
        >
          <Avatar className={cn("mx-auto border-2 border-[var(--border)] bg-[var(--student-subtle-neutral-blue)] shadow-[0_12px_22px_-14px_rgba(79,70,229,0.30)]", collapsed ? "h-14 w-14" : "h-[78px] w-[78px]")}> 
            <AvatarImage src={profile?.photo || user?.avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-[var(--muted)] text-sm font-semibold text-[var(--student-white)]">
              {displayName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <p className="mt-3 text-[14px] font-semibold leading-5 text-[var(--foreground)]">{displayName}</p>
              {displayId && <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--primary)]">{displayId}</p>}
              <p className="text-[12px] leading-4 text-[var(--foreground)]">{faculty}</p>
              <p className="text-[12px] leading-4 text-[var(--foreground)]">{program}</p>
              {semester && <p className="text-[12px] leading-4 text-[var(--foreground)]">{semester}</p>}
              <Button
                onClick={logout}
                className="mt-3 h-7 w-full rounded-md border-0 bg-transparent text-[12px] text-[var(--foreground)] hover:bg-[var(--student-subtle-neutral-blue)]"
                variant="ghost"
              >
                Logout
              </Button>
            </>
          )}
        </div>

        <div className="space-y-4">
          {filteredSections.map((section) => (
            <section key={section.title}>
              {!collapsed && <h3 className="mb-1 px-0.5 text-[13px] font-semibold text-white">{section.title}</h3>}
              <div className={cn("space-y-0.5", collapsed && "space-y-1")}>
                {section.items.map((item) => {
                  const isActive = currentPathname === item.href || currentPathname.startsWith(item.href + "/")
                  return (
                    <SidebarNavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={isActive}
                      collapsed={collapsed}
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

export function StudentSidebar() {
  return (
    <>
      <MobileStudentNav />
      <DesktopStudentSidebar />
      <MobileBottomTabBar />
    </>
  )
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Bell,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { fetchDashboardOverview, type DashboardOverview } from "@/lib/dashboard-api"

interface DashboardHeaderProps {
  title: string
  description?: string
}

type NotificationItem = {
  id: string
  title: string
  description: string
  date: string
  icon: LucideIcon
  accent: string
}

const formatDate = (value: string) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "Just now" : parsed.toLocaleDateString()
}

const currencyFormatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" })
const formatCurrency = (value: number) => currencyFormatter.format(value)

type SearchResult = {
  id: string
  group: string
  title: string
  subtitle?: string
  href: string
  icon: LucideIcon
  keywords: string[]
}

type IndexedSearchResult = SearchResult & { searchText: string }

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const latestStudent = useMemo(() => {
    return overview?.recentStudents?.[0] ?? null
  }, [overview])

  const latestIncome = useMemo(() => {
    return overview?.recentIncome?.[0] ?? null
  }, [overview])

  const latestFeedback = useMemo(() => {
    return overview?.recentFeedback?.[0] ?? null
  }, [overview])

  useEffect(() => {
    const controller = new AbortController()
    fetchDashboardOverview(controller.signal)
      .then((data) => {
        setOverview(data)
        setLoadError(null)
      })
      .catch((error) => {
        if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
          return
        }
        console.warn("[dashboard-header] failed to load overview", error)
        setLoadError(error instanceof Error ? error.message : "Unable to load dashboard data")
        setOverview(null)
      })
    return () => controller.abort()
  }, [])

  const searchIndex = useMemo<IndexedSearchResult[]>(() => {
    const normaliseKeywords = (values: Array<string | undefined | null>) =>
      values.filter((value): value is string => Boolean(value && value.trim()))

    const navItems: SearchResult[] = [
      {
        id: "nav-dashboard",
        group: "Navigate",
        title: "Dashboard Overview",
        subtitle: "Return to the analytics hub",
        href: "/dashboard",
        icon: LayoutDashboard,
        keywords: ["overview", "analytics", "metrics", "home"],
      },
      {
        id: "nav-enrollment",
        group: "Navigate",
        title: "Enrollment",
        subtitle: "Manage course enrollments",
        href: "/dashboard/enrollment",
        icon: BookOpen,
        keywords: ["students", "courses", "registrations", "waitlist"],
      },
      {
        id: "nav-students",
        group: "Navigate",
        title: "Students",
        subtitle: "Browse the student directory",
        href: "/dashboard/students",
        icon: GraduationCap,
        keywords: ["students", "directory", "profiles"],
      },
      {
        id: "nav-professors",
        group: "Navigate",
        title: "Professors",
        subtitle: "Faculty roster and availability",
        href: "/dashboard/professors",
        icon: Users,
        keywords: ["professors", "faculty", "staff", "teacher"],
      },
      {
        id: "nav-finance",
        group: "Navigate",
        title: "Finance",
        subtitle: "Payments, payroll, and expenses",
        href: "/dashboard/finance",
        icon: Wallet,
        keywords: ["payments", "payroll", "income", "expenses"],
      },
      {
        id: "nav-feedback",
        group: "Navigate",
        title: "Feedback",
        subtitle: "Review student experience",
        href: "/dashboard/feedback",
        icon: MessageSquare,
        keywords: ["feedback", "reviews", "support"],
      },
      {
        id: "nav-settings",
        group: "Navigate",
        title: "Settings",
        subtitle: "Configure the admin portal",
        href: "/dashboard/settings",
        icon: Settings,
        keywords: ["settings", "preferences", "profile", "admin"],
      },
    ]

    const studentItems: SearchResult[] = (overview?.recentStudents ?? []).map((student) => ({
      id: `student-${student.id}`,
      group: "Students",
      title: `${student.firstName} ${student.lastName}`,
      subtitle: [student.program, student.email].filter(Boolean).join(" • "),
      href: `/dashboard/students?highlight=${student.id}`,
      icon: GraduationCap,
      keywords: normaliseKeywords([
        student.firstName,
        student.lastName,
        student.email,
        student.program,
        student.status,
        student.id,
        student.phone,
      ]),
    }))

    const feedbackItems: SearchResult[] = (overview?.recentFeedback ?? []).map((feedback) => {
      const typeLabel = feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)
      const snippet = feedback.comment?.slice(0, 72) ?? ""
      const commentSnippet = snippet.length === 72 ? `${snippet}…` : snippet
      return {
        id: `feedback-${feedback.id}`,
        group: "Feedback",
        title: feedback.studentName || feedback.id,
        subtitle: `${typeLabel}${commentSnippet ? ` • ${commentSnippet}` : ""}`,
        href: `/dashboard/feedback?highlight=${feedback.id}`,
        icon: MessageSquare,
        keywords: normaliseKeywords([
          feedback.studentName,
          feedback.professorName,
          feedback.comment,
          feedback.type,
          feedback.status,
          feedback.id,
        ]),
      }
    })

    return [...navItems, ...studentItems, ...feedbackItems].map((item) => ({
      ...item,
      searchText: [item.title, item.subtitle, ...item.keywords].filter(Boolean).join(" ").toLowerCase(),
    }))
  }, [overview])

  const filteredSearchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return searchIndex
    }
    const tokens = query.split(/\s+/).filter(Boolean)
    return searchIndex.filter((item) => tokens.every((token) => item.searchText.includes(token)))
  }, [searchIndex, searchQuery])

  const groupedSearchResults = useMemo(() => {
    return filteredSearchResults.reduce<Record<string, IndexedSearchResult[]>>((accumulator, item) => {
      if (!accumulator[item.group]) {
        accumulator[item.group] = []
      }
      accumulator[item.group].push(item)
      return accumulator
    }, {})
  }, [filteredSearchResults])

  const handleSearchOpenChange = useCallback((open: boolean) => {
    setIsSearchOpen(open)
    if (!open) {
      setSearchQuery("")
    }
  }, [])

  const handleSearchSelect = useCallback(
    (href: string) => {
      setIsSearchOpen(false)
      setSearchQuery("")
      router.push(href)
    },
    [router],
  )

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = []

    if (latestIncome) {
      items.push({
        id: `income-${latestIncome.id}`,
        title: "Latest course registration",
        description: `${latestIncome.source} · ${formatCurrency(latestIncome.amount)}`,
        date: latestIncome.date,
        icon: CalendarCheck,
        accent: "bg-tertiary/15 text-tertiary-foreground",
      })
    }

    if (latestStudent) {
      items.push({
        id: `student-${latestStudent.id}`,
        title: "New student enrolled",
        description: `${latestStudent.firstName} ${latestStudent.lastName} · ${latestStudent.program}`,
        date: latestStudent.enrollmentDate,
        icon: GraduationCap,
        accent: "bg-primary/10 text-primary",
      })
    }

    if (latestFeedback) {
      items.push({
        id: `feedback-${latestFeedback.id}`,
        title: "Feedback received",
        description: `${latestFeedback.studentName} rated ${latestFeedback.rating}/5 (${latestFeedback.type})`,
        date: latestFeedback.date,
        icon: MessageSquare,
        accent: "bg-tertiary/10 text-tertiary-foreground",
      })
    }

    return items
  }, [latestIncome, latestStudent, latestFeedback])

  return (
    <>
      <header className="dashboard-header-shell px-6">
        <div className="flex min-h-28 items-center justify-between gap-6 py-5">
          <div className="min-w-0 flex-1 rounded-[1.5rem] border border-border bg-card px-4 py-3 shadow-[0_12px_24px_-22px_rgba(21,99,197,0.2)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Admin Portal</p>
            <h1 className="dashboard-header-title truncate">{title}</h1>
            {description && <p className="dashboard-header-subtitle">{description}</p>}
            {loadError && <p className="mt-2 text-xs text-destructive">{loadError}</p>}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block w-[16rem] lg:w-[18rem] mr-3">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search anything..."
                readOnly
                onClick={() => setIsSearchOpen(true)}
                onFocus={() => setIsSearchOpen(true)}
                className="dashboard-control-input"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Open notifications"
                  className="dashboard-control-button"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={16} className="w-80 rounded-2xl border border-border bg-card p-0 shadow-[0_30px_60px_-36px_rgba(21,99,197,0.26)]">
                <div className="dashboard-panel-bleed flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                    <p className="text-xs text-muted-foreground">Latest activity from the platform</p>
                  </div>
                  <Badge variant="outline" className="border-primary/25 bg-primary/10 text-xs text-primary">
                    {notifications.length} new
                  </Badge>
                </div>
                {notifications.length > 0 ? (
                  <ScrollArea className="max-h-72">
                    <div className="divide-y divide-border/70">
                      {notifications.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/30">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium ${item.accent}`}>
                            <item.icon className="h-4 w-4" />
                          </span>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs leading-snug text-muted-foreground">{item.description}</p>
                            <p className="text-[11px] text-muted-foreground">{formatDate(item.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="px-4 py-6 text-sm text-muted-foreground">You're all caught up. No new notifications.</div>
                )}
                <div className="border-t border-border/70 px-4 py-3">
                  <Button
                    className="w-full justify-center rounded-xl border border-primary/35 bg-primary/10 text-primary shadow-sm hover:bg-primary/15"
                    onClick={() => router.push("/dashboard/notifications")}
                  >
                    View all activity
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
      <CommandDialog
        open={isSearchOpen}
        onOpenChange={handleSearchOpenChange}
        title="Search the dashboard"
        description="Jump to a page or record"
      >
        <CommandInput
          placeholder="Search students, pages, or records..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(groupedSearchResults).map(([group, items], index) => (
            <div key={group}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.slice(0, 8).map((item) => (
                  <CommandItem key={item.id} onSelect={() => handleSearchSelect(item.href)} value={item.searchText}>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      {item.subtitle && <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
      </>
    )
}

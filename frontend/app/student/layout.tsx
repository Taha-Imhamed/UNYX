"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { StudentSidebar } from "@/components/student-sidebar"
import { ModuleLockGate } from "@/components/module-lock-gate"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/auth-context"

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isStudent } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push("/login")
    } else if (!isStudent) {
      router.push("/dashboard")
    }
  }, [user, isStudent, isLoading, router])

  if (isLoading || !user || !isStudent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return (
    <div className="student-theme dashboard-minimal relative flex h-screen flex-col overflow-hidden bg-[#F8FAFC] text-[#0f172a] print:block print:h-auto print:overflow-visible print:bg-white md:flex-row">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(79,70,229,0.10),transparent_22%),radial-gradient(circle_at_78%_88%,rgba(14,165,233,0.08),transparent_24%),linear-gradient(180deg,#F8FAFC_0%,#F8FAFC_58%,#EEF2F8_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-[19rem] hidden w-px bg-gradient-to-b from-transparent via-slate-300/40 to-transparent xl:block" />
      <div className="print:hidden">
        <StudentSidebar />
      </div>
      <main className="relative z-10 flex-1 overflow-y-auto bg-transparent print:overflow-visible print:bg-white print:text-black">
        <div className="relative z-10 mx-auto h-full w-full max-w-[1580px] space-y-6 px-3 py-5 md:px-6 md:py-6 print:h-auto print:min-h-screen print:overflow-visible">
          <ModuleLockGate>{children}</ModuleLockGate>
        </div>
      </main>
    </div>
  )
}

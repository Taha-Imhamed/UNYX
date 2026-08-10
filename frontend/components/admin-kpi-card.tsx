"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Check, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminKpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  deltaLabel?: string
  deltaTone?: "positive" | "neutral"
  caption: string
  href?: string
}

export function AdminKpiCard({ label, value, icon: Icon, deltaLabel, deltaTone, caption, href }: AdminKpiCardProps) {
  const content = (
    <div className="rounded-[16px] border border-[#e5eaf4] bg-white p-5 shadow-[0_4px_18px_rgba(30,45,90,0.05)] transition-colors hover:border-[#c3d1f2]">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8592b3]">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#eef2fc] text-[#2f56c8]">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="mb-2 mt-2.5 text-[38px] font-extrabold leading-none text-[#16224a]">{value}</div>
      <div className="flex items-center gap-1.5">
        {deltaLabel && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-xs font-bold",
              deltaTone === "positive" ? "bg-[#e6f6ee] text-[#1f9d61]" : "bg-[#eef2fc] text-[#2f56c8]",
            )}
          >
            {deltaTone === "positive" ? <TrendingUp className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            {deltaLabel}
          </span>
        )}
        <span className="text-xs text-[#8592b3]">{caption}</span>
      </div>
    </div>
  )

  if (!href) return content
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}

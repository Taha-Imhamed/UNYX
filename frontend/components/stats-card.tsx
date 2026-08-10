"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  accent?: "neutral" | "tertiary"
  icon: LucideIcon
  href?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  accent = "neutral",
  icon: Icon,
  href,
}: StatsCardProps) {
  const compactValue = typeof value === "string" && value.length >= 6
  const iconTone =
    accent === "tertiary"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "border-sky-200 bg-sky-50 text-sky-700"

  const cardContent = (
    <Card className="h-full overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0_12px_28px_-20px_rgba(15,23,42,0.16),0_4px_6px_-1px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-22px_rgba(15,23,42,0.18),0_4px_6px_-1px_rgba(0,0,0,0.08)]">
      <CardContent className="relative flex min-h-[172px] flex-col p-4">
        <div className="pointer-events-none absolute right-3 top-3 h-14 w-14 rounded-full bg-[#EEF2FF] blur-xl" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#475569]">{title}</p>
            <p
              className={cn(
                "break-words font-semibold tracking-[-0.03em] text-foreground",
                compactValue ? "text-[2rem] leading-[1.02] md:text-[2.2rem]" : "text-[2.55rem] leading-[0.95] md:text-[2.75rem]",
              )}
            >
              {value}
            </p>
          </div>
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${iconTone}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-5 h-px w-[calc(100%+2rem)] -translate-x-4 bg-[#253b6e]" />
        <div className="mt-auto flex min-h-[3.25rem] items-end pt-4">
          {change && (
            <p
              className={cn(
                "line-clamp-2 text-[0.95rem] font-medium leading-5",
                changeType === "positive" && "text-[#334155]",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-[#334155]",
              )}
            >
              {change}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

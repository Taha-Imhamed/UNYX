"use client"

import Link from "next/link"
import type { StudentHint } from "@shared/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Laptop2, Monitor, ShieldCheck } from "lucide-react"

interface StudentHintCardProps {
  field: string
  hints: StudentHint[]
}

const osIcons: Record<NonNullable<StudentHint["os"]>, typeof Laptop2> = {
  windows: Monitor,
  mac: Laptop2,
}

export function StudentHintCard({ field, hints }: StudentHintCardProps) {
  if (!hints.length) return null
  return (
    <Card className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--card)] text-foreground shadow-[0_18px_40px_-32px_rgba(15,23,42,0.18)]">
      <CardHeader className="border-b border-[var(--border)]">
        <CardTitle className="text-[var(--foreground)]">Student Hint Corner</CardTitle>
        <p className="text-xs text-muted-foreground">
          Tips for {field === "general" ? "all students" : field.replace(/-/g, " ")}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hints.map((hint) => {
          const Icon = hint.os ? osIcons[hint.os] : ShieldCheck
          return (
            <div key={hint.title} className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--student-subtle-neutral-blue)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{hint.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{hint.description}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]">
                  <Icon className="h-4.5 w-4.5 text-[var(--muted)]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hint.link ? (
                  <Link href={hint.link} className="flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline">
                    Learn more <ExternalLink className="h-4 w-4" />
                  </Link>
                ) : null}
                {hint.os ? (
                  <Badge variant="outline" className="border-[var(--border)] bg-[var(--card)] text-xs uppercase text-muted-foreground">
                    {hint.os === "windows" ? "Windows" : "macOS"}
                  </Badge>
                ) : null}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

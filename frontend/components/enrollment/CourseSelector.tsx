import React, { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type SelectableCourse = {
  id: string
  code: string
  title: string
  sectionId?: string
  branch?: string
  location?: string
  availableSeats?: number
  capacity?: number
  enrolledCount?: number
  professorName?: string
  level?: number | null
}

interface CourseSelectorProps {
  courses: SelectableCourse[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  multi?: boolean
  showBranchFilter?: boolean
  label?: string
}

export function CourseSelector({ courses, selectedIds, onChange, multi = true, showBranchFilter = true, label }: CourseSelectorProps) {
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [query, setQuery] = useState("")

  const branches = useMemo(() => {
    const set = new Set<string>()
    courses.forEach((course) => {
      const branch = (course.branch || course.location || "Main").trim()
      if (branch) set.add(branch)
    })
    return ["all", ...Array.from(set).sort()]
  }, [courses])

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const branch = (course.branch || course.location || "Main").trim()
      const seats = course.availableSeats ?? Math.max(0, (course.capacity ?? 0) - (course.enrolledCount ?? 0))
      const full = seats <= 0
      const branchMatch = branchFilter === "all" || branch === branchFilter
      const text = `${course.code} ${course.title} ${branch}`.toLowerCase()
      const queryMatch = query ? text.includes(query.toLowerCase()) : true
      return branchMatch && queryMatch && (!multi || !full)
    })
  }, [branchFilter, courses, multi, query])

  const toggle = (courseId: string) => {
    if (multi) {
      onChange(selectedIds.includes(courseId) ? selectedIds.filter((id) => id !== courseId) : [...selectedIds, courseId])
    } else {
      onChange([courseId])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label>{label ?? "Select courses"}</Label>
        <div className="flex items-center gap-2 text-xs">
          <Input
            placeholder="Search code or title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-44"
          />
          {showBranchFilter && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-8 w-40 bg-secondary/60 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch === "all" ? "All branches" : branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((course) => {
          const seats = course.availableSeats ?? Math.max(0, (course.capacity ?? 0) - (course.enrolledCount ?? 0))
          const full = seats <= 0
          const selected = selectedIds.includes(course.id)
          return (
            <label
              key={course.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm",
                selected && "ring-1 ring-primary",
                full && "opacity-60",
              )}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                className="h-4 w-4"
                checked={selected}
                disabled={full && multi}
                onChange={() => toggle(course.id)}
              />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">{course.code}: {course.title}</span>
                <span className="text-xs text-muted-foreground">
                  {course.sectionId ? `Section ${course.sectionId}` : "No section"} · {course.branch || course.location || "Main"} · Seats left: {seats}
                </span>
                {course.professorName && <span className="text-[11px] text-muted-foreground">{course.professorName}</span>}
              </div>
              {full && <Badge variant="destructive">Full</Badge>}
            </label>
          )
        })}
      </div>
    </div>
  )
}

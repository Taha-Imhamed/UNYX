"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { fetchEnrollments, requestAdvisorApproval } from "@/lib/enrollment-api"
import type { EnrollmentRecord } from "@/lib/enrollment-api"
import { useMyCourses } from "@/hooks/enrollment/use-my-courses"
import { useToast } from "@/hooks/use-toast"

const PENDING_STATUSES = new Set(["pending", "pendingSupervisorApproval", "pendingAdvisorApproval", "waitlisted"])

export default function StudentsRequestsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { courses, isLoading: coursesLoading } = useMyCourses()
  const [items, setItems] = useState<EnrollmentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkSubmitting, setBulkSubmitting] = useState(false)

  useEffect(() => {
    if (!user || coursesLoading) return
    setLoading(true)
    let mounted = true
    const myCourseIds = new Set(courses.map((c) => c.id))

    fetchEnrollments({ page: 1, pageSize: 1000 })
      .then((payload) => {
        if (!mounted) return
        const enrolls = (payload?.items ?? []).filter((e) => {
          if (!e) return false
          if (!PENDING_STATUSES.has(e.status)) return false
          return myCourseIds.has(e.courseId)
        })
        setItems(enrolls)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))

    return () => { mounted = false }
  }, [user, courses, coursesLoading])

  const filteredItems = useMemo(
    () => (courseFilter === "all" ? items : items.filter((e) => e.courseId === courseFilter)),
    [items, courseFilter],
  )

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map((e) => e.id)),
    )
  }

  const handleRequestAdvisor = async (id: string) => {
    try {
      await requestAdvisorApproval(id)
      setItems((prev) => prev.filter((p) => p.id !== id))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast({ title: "Advisor approval requested" })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to request advisor approval",
        description: e instanceof Error ? e.message : "Please try again.",
      })
    }
  }

  const handleBulkRequestAdvisor = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBulkSubmitting(true)
    const succeeded: string[] = []
    const failed: string[] = []
    for (const id of ids) {
      try {
        await requestAdvisorApproval(id)
        succeeded.push(id)
      } catch {
        failed.push(id)
      }
    }
    setItems((prev) => prev.filter((p) => !succeeded.includes(p.id)))
    setSelectedIds(new Set())
    setBulkSubmitting(false)
    if (succeeded.length > 0) {
      toast({ title: `Advisor approval requested for ${succeeded.length} student(s)` })
    }
    if (failed.length > 0) {
      toast({ variant: "destructive", title: `Failed for ${failed.length} request(s)`, description: "Please retry those individually." })
    }
  }

  if (!user) return null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Students Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="min-w-[220px]">
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses ({items.length})</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.title} ({items.filter((e) => e.courseId === c.id).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {filteredItems.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                disabled={selectedIds.size === 0 || bulkSubmitting}
                onClick={handleBulkRequestAdvisor}
              >
                {bulkSubmitting ? "Requesting…" : `Request Advisor Approval (${selectedIds.size} selected)`}
              </Button>
            )}
          </div>

          {(loading || coursesLoading) && <div>Loading…</div>}
          {!loading && !coursesLoading && filteredItems.length === 0 && <div>No student enrollment requests found.</div>}

          {!loading && !coursesLoading && filteredItems.length > 0 && (
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredItems.length}
                onChange={toggleSelectAll}
                aria-label="Select all"
              />
              <span>Select all ({filteredItems.length})</span>
            </div>
          )}

          <div className="space-y-3">
            {filteredItems.map((e) => (
              <div key={e.id} className="p-3 border rounded-md flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(e.id)}
                    onChange={() => toggleSelected(e.id)}
                    aria-label={`Select ${e.student?.firstName} ${e.student?.lastName}`}
                  />
                  <div>
                    <div className="font-medium">{e.student?.firstName} {e.student?.lastName}</div>
                    <div className="text-sm text-muted-foreground">Course: {e.courseCode ?? e.courseId} • Status: {e.status}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleRequestAdvisor(e.id)}>Request Advisor Approval</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

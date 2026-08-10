"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import type { Feedback } from "@shared/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MoreHorizontal, Eye, CheckCircle, XCircle, MessageSquare } from "lucide-react"
import { StatsCard } from "@/components/stats-card"
import { apiFetch } from "@/lib/api-client"
import { Spinner } from "@/components/ui/spinner"

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    apiFetch<Feedback[]>("/feedback", { signal: controller.signal })
      .then((data) => {
        setFeedback(data ?? [])
        setError(null)
      })
      .catch((err) => {
        console.warn("[feedback] failed to load", err)
        setError(err instanceof Error ? err.message : "Unable to load feedback")
      })
      .finally(() => setIsLoading(false))
    return () => controller.abort()
  }, [])

  const ratedFeedback = feedback.filter((f) => typeof f.rating === "number")
  const averageRating =
    ratedFeedback.length > 0
      ? (ratedFeedback.reduce((sum, f) => sum + (f.rating ?? 0), 0) / ratedFeedback.length).toFixed(1)
      : "0.0"
  const newCount = feedback.filter((f) => f.status === "new").length
  const reviewedCount = feedback.filter((f) => f.status === "reviewed").length
  const resolvedCount = feedback.filter((f) => f.status === "resolved").length

  const handleUpdateStatus = async (id: string, status: Feedback["status"]) => {
    try {
      const updated = await apiFetch<Feedback>(`/feedback/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
      setFeedback((prev) => prev.map((f) => (f.id === id ? { ...f, ...updated } : f)))
      setError(null)
    } catch (err) {
      console.error("[feedback] failed to update", err)
      setError(err instanceof Error ? err.message : "Unable to update feedback")
    }
  }

  const renderStars = (rating?: number) => {
    const normalized = rating ?? 0
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= normalized ? "fill-warning text-warning" : "text-muted-foreground"}`}
          />
        ))}
      </div>
    )
  }

  const columns = [
    { key: "id", header: "ID" },
    { key: "studentName", header: "Student" },
    {
      key: "type",
      header: "Type",
      render: (item: Feedback) => (
        <Badge variant="outline" className="capitalize">
          {item.type}
        </Badge>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (item: Feedback) => renderStars(item.rating),
    },
    {
      key: "comment",
      header: "Comment",
      render: (item: Feedback) => <span className="text-foreground line-clamp-1 max-w-xs">{item.comment || item.subject || "—"}</span>,
    },
    {
      key: "date",
      header: "Date",
      render: (item: Feedback) => <span className="text-foreground">{new Date(item.date).toLocaleDateString()}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item: Feedback) => (
        <Badge variant={item.status === "new" ? "default" : item.status === "reviewed" ? "secondary" : "outline"}>
          {item.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Feedback" description="View and manage student feedback" />

      <div className="flex-1 p-4 space-y-4">
        {error && <div className="text-sm text-destructive">{error}</div>}
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Total Feedback" value={feedback.length} icon={MessageSquare} />
          <StatsCard
            title="Average Rating"
            value={averageRating}
            change="out of 5.0"
            changeType="neutral"
            icon={Star}
          />
          <StatsCard title="New" value={newCount} change="Awaiting review" changeType="neutral" icon={MessageSquare} />
          <StatsCard
            title="Resolved"
            value={resolvedCount}
            change={`${reviewedCount} in review`}
            changeType="positive"
            icon={CheckCircle}
          />
        </div>

        {/* Feedback Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>All Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading feedback...
              </div>
            ) : feedback.length === 0 ? (
              <div className="text-sm text-muted-foreground">No feedback recorded yet.</div>
            ) : (
              <DataTable
                data={feedback}
                columns={columns}
                searchPlaceholder="Search feedback..."
                searchKeys={["comment", "studentName", "professorName", "type", "status", "id"]}
                filterKey="status"
                filterOptions={[
                  { value: "new", label: "New" },
                  { value: "reviewed", label: "Reviewed" },
                  { value: "resolved", label: "Resolved" },
                ]}
                filterPlaceholder="Status"
                actions={(item) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_8px_24px_rgba(228,196,92,0.28)]"
                        style={{ ['--btn-glow-color' as string]: "var(--accent)" }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedFeedback(item)
                          setIsViewOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {item.status === "new" && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, "reviewed")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Reviewed
                        </DropdownMenuItem>
                      )}
                      {item.status === "reviewed" && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, "resolved")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Resolved
                        </DropdownMenuItem>
                      )}
                      {item.status !== "new" && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, "new")}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reset to New
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{selectedFeedback.studentName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedFeedback.id}</p>
                </div>
                <Badge
                  variant={
                    selectedFeedback.status === "new"
                      ? "default"
                      : selectedFeedback.status === "reviewed"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {selectedFeedback.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                {renderStars(selectedFeedback.rating)}
                <Badge variant="outline" className="capitalize">
                  {selectedFeedback.type}
                </Badge>
              </div>
              {selectedFeedback.professorName && (
                <div>
                  <p className="text-sm text-muted-foreground">Professor</p>
                  <p className="text-foreground">{selectedFeedback.professorName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Comment</p>
                <p className="text-foreground bg-secondary p-3 rounded-lg">
                  {selectedFeedback.comment || selectedFeedback.subject || "No comment provided."}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-foreground">{new Date(selectedFeedback.date).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 pt-2">
                {selectedFeedback.status === "new" && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedFeedback.id, "reviewed")
                      setSelectedFeedback({ ...selectedFeedback, status: "reviewed" })
                    }}
                  >
                    Mark as Reviewed
                  </Button>
                )}
                {selectedFeedback.status === "reviewed" && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedFeedback.id, "resolved")
                      setSelectedFeedback({ ...selectedFeedback, status: "resolved" })
                    }}
                  >
                    Mark as Resolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

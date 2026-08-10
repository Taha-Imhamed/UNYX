"use client"

import { useEffect, useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfessorTabNav } from "@/components/professor/ProfessorTabNav"
import { ProfessorCourseSelect } from "@/components/professor/ProfessorCourseSelect"
import { useToast } from "@/hooks/use-toast"
import { useProfessorCourseWorkspace } from "@/hooks/professor/use-professor-workspace"
import { fetchEnrollments, type EnrollmentRecord } from "@/lib/enrollment-api"

export default function ProfessorMessagesPage() {
  const { toast } = useToast()
  const { courses, isLoadingCourses, selectedCourseId, setSelectedCourseId, selectedCourse, createItem } = useProfessorCourseWorkspace()
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    recipientType: "course" as "course" | "student",
    recipientIds: [] as string[],
    subject: "",
    body: "",
  })

  useEffect(() => {
    if (!selectedCourseId) {
      setEnrollments([])
      return
    }
    const controller = new AbortController()
    fetchEnrollments({ courseId: selectedCourseId, page: 1, pageSize: 500, signal: controller.signal })
      .then((payload) => setEnrollments(payload.items))
      .catch(() => undefined)
    return () => controller.abort()
  }, [selectedCourseId])

  const handleSubmit = async () => {
    if (!selectedCourse) return
    setIsSaving(true)
    try {
      await createItem("messages", form)
      setForm({ recipientType: "course", recipientIds: [], subject: "", body: "" })
      toast({ title: "Message sent", description: "Students were notified." })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Messages" description="Send messages to students in your courses" />
      <ProfessorTabNav />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Select course</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessorCourseSelect courses={courses} selectedCourseId={selectedCourseId} onChange={setSelectedCourseId} isLoading={isLoadingCourses} />
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/92">
        <CardHeader>
          <CardTitle>Send messages to students</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              value={form.recipientType}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, recipientType: value as "course" | "student", recipientIds: value === "course" ? [] : prev.recipientIds }))
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="course">All students in course</SelectItem>
                <SelectItem value="student">Selected students</SelectItem>
              </SelectContent>
            </Select>
            {form.recipientType === "student" && (
              <Select
                value={form.recipientIds[0] ?? ""}
                onValueChange={(value) => setForm((prev) => ({ ...prev, recipientIds: value ? [value] : [] }))}
              >
                <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
                <SelectContent>
                  {enrollments.map((enrollment) => (
                    <SelectItem key={enrollment.studentId} value={enrollment.studentId}>
                      {enrollment.student.firstName} {enrollment.student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} />
          <Textarea placeholder="Message body" value={form.body} onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))} />
          <Button onClick={handleSubmit} disabled={isSaving}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Send message
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

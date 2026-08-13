"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { createSponsorship } from "@/lib/finance-api"
import type { FinanceSponsorship, Student } from "@shared/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function getStudentName(student: Student) {
  return `${student.firstName} ${student.lastName}`
}

export function SponsorshipsPanel({
  sponsorships,
  students,
  canManage,
  onChanged,
  onError,
}: {
  sponsorships: FinanceSponsorship[]
  students: Student[]
  canManage: boolean
  onChanged: () => void
  onError: (title: string, description: string) => void
}) {
  const [formOpen, setFormOpen] = useState(false)

  const handleCreateSponsorship = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      await createSponsorship({
        studentId: String(formData.get("studentId")),
        sponsorName: String(formData.get("sponsorName")),
        sponsorType: String(formData.get("sponsorType")) as FinanceSponsorship["sponsorType"],
        coverageType: String(formData.get("coverageType")) as FinanceSponsorship["coverageType"],
        coverageValue: Number(formData.get("coverageValue")),
        appliedAmount: Number(formData.get("appliedAmount") || 0),
        status: String(formData.get("status")) as FinanceSponsorship["status"],
        startDate: String(formData.get("startDate")),
        endDate: String(formData.get("endDate") || "") || null,
        notes: String(formData.get("notes") || "") || null,
      })
      setFormOpen(false)
      onChanged()
    } catch (error) {
      onError("Sponsorship failed", error instanceof Error ? error.message : "Unable to save sponsorship")
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Sponsorships</CardTitle>
          <p className="text-sm text-muted-foreground">Track sponsored tuition support and coverage agreements.</p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={!canManage}>
              <Plus className="mr-2 h-4 w-4" />
              Add sponsorship
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create sponsorship</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreateSponsorship}>
              <Select name="studentId" defaultValue={students[0]?.id}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>{getStudentName(student)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="sponsorName" placeholder="Sponsor name" required />
                <Select name="sponsorType" defaultValue="company">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="scholarship">Scholarship</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Select name="coverageType" defaultValue="fixed">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
                <Input name="coverageValue" type="number" step="0.01" placeholder="Coverage value" required />
                <Input name="appliedAmount" type="number" step="0.01" placeholder="Applied amount" defaultValue={0} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Select name="status" defaultValue="active">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
                <Input name="startDate" type="date" defaultValue={todayString()} required />
                <Input name="endDate" type="date" />
              </div>
              <Textarea name="notes" rows={3} placeholder="Optional notes" />
              <div className="flex justify-end"><Button type="submit">Save sponsorship</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Student</TableHead>
              <TableHead>Sponsor</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsorships.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.studentName}</TableCell>
                <TableCell>{item.sponsorName}</TableCell>
                <TableCell>{item.coverageType} • {item.coverageValue}</TableCell>
                <TableCell>{currencyFormatter.format(item.appliedAmount)}</TableCell>
                <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

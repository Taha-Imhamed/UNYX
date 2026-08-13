"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { createInstallmentPlan } from "@/lib/finance-api"
import type { FinanceInstallmentPlan, Student } from "@shared/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function getStudentName(student: Student) {
  return `${student.firstName} ${student.lastName}`
}

export function InstallmentPlansPanel({
  plans,
  students,
  canManage,
  onChanged,
  onError,
}: {
  plans: FinanceInstallmentPlan[]
  students: Student[]
  canManage: boolean
  onChanged: () => void
  onError: (title: string, description: string) => void
}) {
  const [formOpen, setFormOpen] = useState(false)

  const handleCreatePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      await createInstallmentPlan({
        studentId: String(formData.get("studentId")),
        title: String(formData.get("title")),
        totalAmount: Number(formData.get("totalAmount")),
        installmentCount: Number(formData.get("installmentCount")),
        paidAmount: Number(formData.get("paidAmount") || 0),
        startDate: String(formData.get("startDate")),
        nextDueDate: String(formData.get("nextDueDate")),
        status: String(formData.get("status")) as FinanceInstallmentPlan["status"],
        notes: String(formData.get("notes") || "") || null,
      })
      setFormOpen(false)
      onChanged()
    } catch (error) {
      onError("Plan not created", error instanceof Error ? error.message : "Unable to create installment plan")
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Installment plans</CardTitle>
          <p className="text-sm text-muted-foreground">Manage payment plans for students who pay in stages.</p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={!canManage}>
              <Plus className="mr-2 h-4 w-4" />
              Add plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create installment plan</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreatePlan}>
              <div className="space-y-2">
                <Label>Student</Label>
                <Select name="studentId" defaultValue={students[0]?.id}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>{getStudentName(student)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="planTitle">Title</Label>
                  <Input id="planTitle" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planStatus">Status</Label>
                  <Select name="status" defaultValue="active">
                    <SelectTrigger id="planStatus"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="defaulted">Defaulted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Input name="totalAmount" type="number" step="0.01" placeholder="Total amount" required />
                <Input name="installmentCount" type="number" min={1} placeholder="Installments" required />
                <Input name="paidAmount" type="number" step="0.01" placeholder="Already paid" defaultValue={0} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="startDate" type="date" defaultValue={todayString()} required />
                <Input name="nextDueDate" type="date" defaultValue={todayString()} required />
              </div>
              <Textarea name="notes" rows={3} placeholder="Optional notes" />
              <div className="flex justify-end"><Button type="submit">Save plan</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Student</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Next due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.studentName}</TableCell>
                <TableCell>{plan.title}</TableCell>
                <TableCell>{currencyFormatter.format(plan.remainingBalance)}</TableCell>
                <TableCell>{plan.nextDueDate}</TableCell>
                <TableCell><Badge variant="outline">{plan.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

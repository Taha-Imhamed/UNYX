"use client"

import { Alert } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Trash2 } from "lucide-react"
import { currencyFormatter } from "@/components/enrollment/shared"
import type { EnrollmentRecord } from "@/lib/enrollment-api"

export interface EnrollmentDeleteState {
  open: boolean
  record: EnrollmentRecord | null
  loading: boolean
  error: string | null
}

interface EnrollmentDeleteAlertProps {
  state: EnrollmentDeleteState
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function EnrollmentDeleteAlert({ state, onOpenChange, onConfirm }: EnrollmentDeleteAlertProps) {
  const deleteRecord = state.record
  const deleteStudentName = deleteRecord
    ? `${deleteRecord.student.firstName} ${deleteRecord.student.lastName}`
    : ""
  const deleteRefundAmount = deleteRecord ? currencyFormatter.format(deleteRecord.price) : ""

  return (
    <AlertDialog open={state.open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove enrollment</AlertDialogTitle>
          {deleteRecord ? (
            <AlertDialogDescription>
              Removing <span className="font-medium text-foreground">{deleteRecord.courseTitle}</span> for{' '}
              <span className="font-medium text-foreground">{deleteStudentName}</span> will credit{' '}
              <span className="font-medium text-foreground">{deleteRefundAmount}</span> back to their balance. Their student
              profile stays available for future enrollments.
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription>This enrollment will be removed.</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {state.error && <Alert variant="destructive">{state.error}</Alert>}

        {deleteRecord ? (
          <div className="rounded-md border border-dashed border-destructive/30 bg-destructive/10 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Student</span>
              <span className="font-medium text-foreground">{deleteStudentName}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Course</span>
              <span className="font-medium text-foreground">{deleteRecord.courseTitle}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Refund</span>
              <span className="font-semibold text-destructive">{deleteRefundAmount}</span>
            </div>
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={state.loading}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm} disabled={state.loading} className="gap-2">
            {state.loading ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            {state.loading ? "Processing" : "Confirm delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

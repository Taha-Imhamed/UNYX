"use client"

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
import { currencyFormatter, pillButtonStyles } from "@/components/enrollment/shared"
import type { Course } from "@shared/types"

export interface CourseDeleteState {
  open: boolean
  course: Course | null
  loading: boolean
  error: string | null
}

interface CourseDeleteAlertProps {
  state: CourseDeleteState
  onOpenChange: (open: boolean) => void
  /** Number of enrollments still attached to the course being deleted. */
  courseDeleteEnrollments: number
  onConfirm: () => void
}

export function CourseDeleteAlert({
  state,
  onOpenChange,
  courseDeleteEnrollments,
  onConfirm,
}: CourseDeleteAlertProps) {
  return (
    <AlertDialog open={state.open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Delete course
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Removing {state.course?.title ?? "this course"} immediately detaches it from selection menus.
            </p>
            <p className="text-sm text-muted-foreground">Existing enrollment history stays intact.</p>
            {courseDeleteEnrollments > 0 ? (
              <p className="text-sm text-muted-foreground">
                You must unenroll {courseDeleteEnrollments} student{courseDeleteEnrollments === 1 ? "" : "s"} first.
              </p>
            ) : null}
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {state.course ? (
          <div className="rounded-md border border-dashed border-destructive/30 bg-destructive/10 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Course</span>
              <span className="font-medium text-foreground">{state.course.title}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Tuition</span>
              <span className="font-medium text-foreground">{currencyFormatter.format(state.course.price)}</span>
            </div>
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={state.loading} className={pillButtonStyles.neutral}>Cancel</AlertDialogCancel>
          <Button
            className={`gap-2 ${pillButtonStyles.danger}`}
            onClick={onConfirm}
            disabled={state.loading || courseDeleteEnrollments > 0}
          >
            {state.loading ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            {state.loading ? "Processing" : "Delete course"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

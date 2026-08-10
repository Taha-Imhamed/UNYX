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
import { pillButtonStyles } from "@/components/enrollment/shared"

export interface ConfirmDeleteState {
  open: boolean
  targetId: string | null
  targetLabel: string
  loading: boolean
  error: string | null
}

export const emptyConfirmDeleteState: ConfirmDeleteState = {
  open: false,
  targetId: null,
  targetLabel: "",
  loading: false,
  error: null,
}

interface ConfirmDeleteAlertProps {
  state: ConfirmDeleteState
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  /** When set > 0, blocks the confirm action and shows blockedMessage instead. */
  blockedCount?: number
  /** Shown instead of description when blockedCount > 0. */
  blockedMessage?: string
}

export function ConfirmDeleteAlert({
  state,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  blockedCount = 0,
  blockedMessage,
}: ConfirmDeleteAlertProps) {
  const isBlocked = blockedCount > 0

  return (
    <AlertDialog open={state.open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              {isBlocked
                ? blockedMessage ?? `${blockedCount} item(s) still reference this — remove those first.`
                : description ?? `Removing ${state.targetLabel || "this item"} cannot be undone.`}
            </p>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={state.loading} className={pillButtonStyles.neutral}>Cancel</AlertDialogCancel>
          <Button className={`gap-2 ${pillButtonStyles.danger}`} onClick={onConfirm} disabled={state.loading || isBlocked}>
            {state.loading ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            {state.loading ? "Processing" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

"use client"

import type { Dispatch, FormEvent, SetStateAction } from "react"
import { Alert } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { currencyFormatter, getInitials, statusMeta } from "@/components/enrollment/shared"
import type { EnrollmentRecord } from "@/lib/enrollment-api"
import type { Course, EnrollmentStatus } from "@shared/types"

export interface EnrollmentEditForm {
  courseId: string
  status: EnrollmentStatus
  startDate: string
  endDate: string
  price: string
  professorId: string
  couponCode: string
}

interface EnrollmentEditSheetProps {
  editState: { open: boolean; record: EnrollmentRecord | null }
  setEditState: Dispatch<SetStateAction<{ open: boolean; record: EnrollmentRecord | null }>>
  editForm: EnrollmentEditForm
  setEditForm: Dispatch<SetStateAction<EnrollmentEditForm>>
  courses: Course[]
  hideTuition: boolean
  editCouponPercent: number | null
  editDiscountAmount: number
  editFinalPrice: number
  savingEdit: boolean
  editError: string | null
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function EnrollmentEditSheet({
  editState,
  setEditState,
  editForm,
  setEditForm,
  courses,
  hideTuition,
  editCouponPercent,
  editDiscountAmount,
  editFinalPrice,
  savingEdit,
  editError,
  onSubmit,
}: EnrollmentEditSheetProps) {
  return (
    <Sheet
      open={editState.open}
      onOpenChange={(open) => setEditState((prev) => ({ open, record: open ? prev.record : null }))}
    >
      <SheetContent side="right" className="flex h-full w-full max-w-2xl flex-col gap-0 overflow-hidden border-l border-sky-100 bg-[linear-gradient(180deg,#f8fcff_0%,#ffffff_22%)] p-0">
        <SheetHeader className="border-b border-sky-100 bg-white/90 px-6 py-6 pr-14 backdrop-blur">
          <SheetTitle className="text-2xl font-semibold tracking-tight text-slate-900">Edit enrollment</SheetTitle>
          <SheetDescription className="max-w-lg text-sm leading-6 text-slate-600">
            Adjust course placement, schedule dates, status, and tuition details in one clean panel.
          </SheetDescription>
        </SheetHeader>

        {editState.record && (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <div className="rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-[0_12px_32px_rgba(14,116,144,0.08)]">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border border-sky-100 shadow-sm">
                    <AvatarImage src={editState.record.student.photo || "/placeholder.svg"} alt={editState.record.student.firstName} />
                    <AvatarFallback>{getInitials(editState.record.student.firstName, editState.record.student.lastName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Student</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {editState.record.student.firstName} {editState.record.student.lastName}
                    </p>
                    <p className="truncate text-sm text-slate-600">{editState.record.student.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-800">
                        {editState.record.student.displayId || "No ID"}
                      </Badge>
                      <Badge variant={statusMeta[editForm.status].badge}>{statusMeta[editForm.status].label}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Course details</p>
                  <p className="text-sm text-slate-500">Choose the course and set the enrollment dates.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="course" className="text-sm font-medium text-slate-700">Course</Label>
                    <Select
                      value={editForm.courseId}
                      onValueChange={(value) => {
                        const selected = courses.find((course) => course.id === value)
                        setEditForm((prev) => ({
                          ...prev,
                          courseId: value,
                          price: selected ? String(selected.price) : prev.price,
                          professorId: selected ? selected.professorId : prev.professorId,
                        }))
                      }}
                    >
                      <SelectTrigger id="course" className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 text-slate-800 shadow-none">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">Start date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={editForm.startDate}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, startDate: event.target.value }))}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-medium text-slate-700">End date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={editForm.endDate}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, endDate: event.target.value }))}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Billing and status</p>
                  <p className="text-sm text-slate-500">Update enrollment status and pricing with clearer spacing.</p>
                </div>
                <div className={`grid gap-4 ${hideTuition ? "md:grid-cols-1" : "md:grid-cols-3"}`}>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-slate-700">Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value: EnrollmentStatus) => setEditForm((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger id="status" className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 text-slate-800 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(statusMeta).map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusMeta[status as EnrollmentStatus].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!hideTuition && (
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium text-slate-700">Tuition override</Label>
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        value={editForm.price}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))}
                        disabled={Boolean(editCouponPercent)}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>
                  )}
                  {!hideTuition && (
                    <div className="space-y-2">
                      <Label htmlFor="editCoupon" className="text-sm font-medium text-slate-700">Coupon</Label>
                      <Input
                        id="editCoupon"
                        value={editForm.couponCode}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, couponCode: event.target.value }))}
                        placeholder="Enter coupon code"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                      <p className="text-xs leading-5 text-slate-500">
                        {editCouponPercent
                          ? `Applying ${Math.round((editCouponPercent ?? 0) * 100)}% discount.`
                          : "Only predefined codes are accepted."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!hideTuition && (
                <div className="rounded-2xl border border-sky-100 bg-[linear-gradient(135deg,#eff8ff_0%,#f8fbff_100%)] p-5 text-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-600">Final tuition</span>
                    <span className="text-2xl font-semibold text-slate-900">{currencyFormatter.format(editFinalPrice)}</span>
                  </div>
                  {editCouponPercent ? (
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Discount applied</span>
                      <span>
                        -{currencyFormatter.format(editDiscountAmount)} ({Math.round((editCouponPercent ?? 0) * 100)}%)
                      </span>
                    </div>
                  ) : null}
                </div>
              )}

              {editError && <Alert variant="destructive">{editError}</Alert>}
            </div>

            <SheetFooter className="border-t border-sky-100 bg-white/95 px-6 py-4 backdrop-blur">
              <Button variant="outline" type="button" onClick={() => setEditState({ open: false, record: null })} className="h-12 rounded-xl border-slate-200 bg-slate-50 px-5 text-slate-700 hover:bg-slate-100">
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit} className="h-12 rounded-xl bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] px-5 text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] hover:opacity-95">
                {savingEdit ? <Spinner className="h-4 w-4" /> : "Save changes"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

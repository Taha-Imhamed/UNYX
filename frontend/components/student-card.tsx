"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, Eye, FileText } from "lucide-react"
import type { Student } from "@shared/types"

export default function StudentCard({
  student,
  onView,
  onGrades,
  onTranscript,
}: {
  student: Student
  onView: (s: Student) => void
  onGrades: (s: Student) => void
  onTranscript: (s: Student) => void
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={student.photo || "/placeholder.svg"} alt={`${student.firstName} ${student.lastName}`} />
          <AvatarFallback>
            {student.firstName?.[0]}
            {student.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-foreground">{student.firstName} {student.lastName}</div>
          <div className="text-xs text-muted-foreground">{student.displayId || student.id} • {student.program}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className={`font-semibold ${student.balance > 0 ? 'text-destructive' : student.balance < 0 ? 'text-success' : 'text-foreground'}`}>
            {new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(student.balance ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground">{student.status}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onView(student)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onGrades(student)}>
            <Wallet className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onTranscript(student)}>
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

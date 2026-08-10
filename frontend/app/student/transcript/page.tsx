"use client"

import GradesPage from "../grades/page"
import { StudentFeatureGate } from "@/components/student-feature-gate"

export default function TranscriptPage() {
  return (
    <StudentFeatureGate featureKey="transcript-view">
      <GradesPage />
    </StudentFeatureGate>
  )
}

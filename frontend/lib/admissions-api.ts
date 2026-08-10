import type { InterviewSchedule, ScholarshipAward } from "@shared/types"
import { apiFetch } from "./api-client"

export function fetchMyScholarshipAwards(signal?: AbortSignal) {
  return apiFetch<ScholarshipAward[]>("/admissions/scholarship-awards/mine", { signal })
}

export function fetchInterviewSchedules(signal?: AbortSignal) {
  return apiFetch<InterviewSchedule[]>("/admissions/interview-schedules", { signal })
}

export function createInterviewSchedule(payload: {
  applicantName: string
  program: string
  interviewer: string
  scheduledAt?: string
  status?: InterviewSchedule["status"]
  notes?: string
}) {
  return apiFetch<InterviewSchedule>("/admissions/interview-schedules", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateInterviewSchedule(id: string, payload: Partial<Omit<InterviewSchedule, "id">>) {
  return apiFetch<InterviewSchedule>(`/admissions/interview-schedules/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function deleteInterviewSchedule(id: string) {
  return apiFetch<{ message: string }>(`/admissions/interview-schedules/${id}`, {
    method: "DELETE",
  })
}

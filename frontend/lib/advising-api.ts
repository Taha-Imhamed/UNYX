import type { AdvisingAppointment } from "@shared/types"
import { apiFetch } from "./api-client"

export function fetchMyAppointments(signal?: AbortSignal) {
  return apiFetch<AdvisingAppointment[]>("/advising/appointments/mine", { signal })
}

export function requestAppointment(payload: {
  advisorId: string
  advisorName: string
  scheduledAt: string
  durationMinutes?: number
  notes?: string | null
}) {
  return apiFetch<AdvisingAppointment>("/advising/appointments/request", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function cancelAppointment(id: string) {
  return apiFetch<AdvisingAppointment>(`/advising/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status: "cancelled" }),
  })
}

export function fetchAdvisorAppointments(signal?: AbortSignal) {
  return apiFetch<AdvisingAppointment[]>("/advising/appointments", { signal })
}

export function updateAppointmentStatus(id: string, status: AdvisingAppointment["status"]) {
  return apiFetch<AdvisingAppointment>(`/advising/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })
}

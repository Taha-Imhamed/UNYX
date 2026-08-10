import type { CampusEvent, HousingAssignment, MealPlan } from "@shared/types"
import { apiFetch } from "./api-client"

export function fetchCampusEvents(signal?: AbortSignal) {
  return apiFetch<CampusEvent[]>("/campus/events", { signal })
}

export function fetchEventRsvpStatus(eventId: string, signal?: AbortSignal) {
  return apiFetch<{ rsvped: boolean }>(`/campus/events/${eventId}/rsvp/mine`, { signal })
}

export function rsvpToEvent(eventId: string) {
  return apiFetch<{ id: string }>(`/campus/events/${eventId}/rsvp`, { method: "POST" })
}

export function cancelEventRsvp(eventId: string) {
  return apiFetch<void>(`/campus/events/${eventId}/rsvp`, { method: "DELETE" })
}

export function fetchMyHousing(signal?: AbortSignal) {
  return apiFetch<HousingAssignment[]>("/campus/housing/mine", { signal })
}

export function fetchMyMealPlan(signal?: AbortSignal) {
  return apiFetch<MealPlan[]>("/campus/meal-plans/mine", { signal })
}

import type { SupportTicket, TicketCategory, TicketDepartment, TicketReply, TicketStatus } from "@shared/types"
import { apiFetch } from "./api-client"

export interface TicketMeta {
  departments: { key: TicketDepartment; label: string }[]
  categories: TicketCategory[]
}

export interface TicketBuckets {
  mine: SupportTicket[]
  assigned: SupportTicket[]
  all: SupportTicket[]
  myDepartment: TicketDepartment | null
}

export function fetchTicketMeta(signal?: AbortSignal) {
  return apiFetch<TicketMeta>("/support-tickets/meta", { signal })
}

export function fetchTickets(signal?: AbortSignal) {
  return apiFetch<TicketBuckets>("/support-tickets", { signal })
}

export function fetchTicket(id: string, signal?: AbortSignal) {
  return apiFetch<{ ticket: SupportTicket; replies: TicketReply[] }>(`/support-tickets/${id}`, { signal })
}

export function createTicket(payload: {
  department: TicketDepartment
  category: TicketCategory
  subject: string
  description: string
}) {
  return apiFetch<SupportTicket>("/support-tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function replyToTicket(id: string, body: string) {
  return apiFetch<{ ticket: SupportTicket; reply: TicketReply }>(`/support-tickets/${id}/replies`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })
}

export function setTicketStatus(id: string, status: TicketStatus) {
  return apiFetch<SupportTicket>(`/support-tickets/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })
}

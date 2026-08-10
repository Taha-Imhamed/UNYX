import type { TransferCredit, TranscriptRequest } from "@shared/types"
import { apiFetch } from "./api-client"

// Student self-service document requests (transcript, enrollment letter, etc.)
export function fetchMyDocumentRequests(signal?: AbortSignal) {
  return apiFetch<TranscriptRequest[]>("/registrar/transcript-requests/mine", { signal })
}

export function submitDocumentRequest(payload: {
  documentType: TranscriptRequest["documentType"]
  deliveryMethod?: TranscriptRequest["deliveryMethod"]
  notes?: string | null
}) {
  return apiFetch<TranscriptRequest>("/registrar/transcript-requests/mine", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Student self-service: approved/pending transfer credits, used by the degree-audit page.
export function fetchMyTransferCredits(signal?: AbortSignal) {
  return apiFetch<TransferCredit[]>("/registrar/transfer-credits/mine", { signal })
}

// Admin/registrar: full transcript request queue and status transitions.
export function fetchTranscriptRequestQueue(signal?: AbortSignal) {
  return apiFetch<TranscriptRequest[]>("/registrar/transcript-requests", { signal })
}

export function updateTranscriptRequestStatus(id: string, status: TranscriptRequest["status"]) {
  return apiFetch<TranscriptRequest>(`/registrar/transcript-requests/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })
}

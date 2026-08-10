import type { SiteContent } from "@shared/types"
import { apiFetch } from "./api-client"

export function fetchPublicSiteContent(signal?: AbortSignal) {
  return apiFetch<SiteContent>("/public/site-content", { signal, cache: "no-store" })
}

"use client"

const FINANCE_REQUESTS_EVENT = "finance-requests:changed"
const FINANCE_REQUESTS_STORAGE_KEY = "finance-requests-last-updated"

export function announceFinanceRequestsChanged() {
  if (typeof window === "undefined") return
  const timestamp = String(Date.now())
  window.localStorage.setItem(FINANCE_REQUESTS_STORAGE_KEY, timestamp)
  window.dispatchEvent(new CustomEvent(FINANCE_REQUESTS_EVENT, { detail: { timestamp } }))
}

export function subscribeToFinanceRequestChanges(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const handleWindowEvent = () => onChange()
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === FINANCE_REQUESTS_STORAGE_KEY) {
      onChange()
    }
  }

  window.addEventListener(FINANCE_REQUESTS_EVENT, handleWindowEvent)
  window.addEventListener("storage", handleStorageEvent)

  return () => {
    window.removeEventListener(FINANCE_REQUESTS_EVENT, handleWindowEvent)
    window.removeEventListener("storage", handleStorageEvent)
  }
}

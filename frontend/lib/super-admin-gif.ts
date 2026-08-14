"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "unyt:super-admin-gif-enabled"
const EVENT_NAME = "unyt:super-admin-gif-changed"

export function getSuperAdminGifEnabled(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(STORAGE_KEY) === "true"
}

export function setSuperAdminGifEnabled(enabled: boolean) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, String(enabled))
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: enabled }))
}

export function useSuperAdminGifEnabled(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(getSuperAdminGifEnabled())

    const onCustom = (e: Event) => setEnabled((e as CustomEvent<boolean>).detail)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEnabled(e.newValue === "true")
    }

    window.addEventListener(EVENT_NAME, onCustom)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(EVENT_NAME, onCustom)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  return [enabled, setSuperAdminGifEnabled]
}

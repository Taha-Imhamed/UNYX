"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface FocusRefreshOptions {
  minIntervalMs?: number
}

export function useFocusVisibilityRefresh(options: FocusRefreshOptions = {}) {
  const { minIntervalMs = 0 } = options
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  const lastAutoRef = useRef(0)

  const maybeAutoRefresh = useCallback(() => {
    const now = Date.now()
    if (minIntervalMs > 0 && now - lastAutoRef.current < minIntervalMs) {
      return
    }
    lastAutoRef.current = now
    refresh()
  }, [minIntervalMs, refresh])

  useEffect(() => {
    const handleFocus = () => maybeAutoRefresh()
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        maybeAutoRefresh()
      }
    }
    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [maybeAutoRefresh])

  return { version, refresh }
}

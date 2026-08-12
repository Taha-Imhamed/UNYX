"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { API_BASE_URL, authHeaders, apiFetch } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { LifeBuoy } from "lucide-react"

type IotPushEvent =
  | { type: "connected"; connectionId: string }
  | { type: "refresh" }
  | { type: "timeout"; reason?: string }
  | { type: "force-reauth"; reason?: string }
  | { type: "message"; text: string }
  | { type: "notification"; title: string; body?: string }
  | { type: "navigate"; path: string }
  | { type: "open-record"; path: string }

const IotChannelContext = createContext<{ connectionId: string | null }>({ connectionId: null })

export function useIotChannel() {
  return useContext(IotChannelContext)
}

// Mounted once at the app root (see app/layout.tsx). Every logged-in user's tab holds one
// of these open — it's the only way the server can reach an already-open browser tab
// (refresh it, log it out, or show an admin's message), since there's no other push
// channel in this app. Manual fetch+ReadableStream (not native EventSource) because
// EventSource can't send the Authorization header this API requires — mirrors the
// server-monitor stream client in app/dashboard/server/page.tsx.
export function IotChannelProvider({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!user) {
      abortRef.current?.abort()
      setConnectionId(null)
      return
    }

    let cancelled = false

    async function connect() {
      while (!cancelled) {
        const controller = new AbortController()
        abortRef.current = controller
        try {
          const initialPath = typeof window !== "undefined" ? window.location.pathname : ""
          const response = await fetch(`${API_BASE_URL}/iot/stream?path=${encodeURIComponent(initialPath)}`, {
            headers: { ...authHeaders() },
            signal: controller.signal,
          })
          if (!response.ok || !response.body) {
            await new Promise((resolve) => setTimeout(resolve, 5000))
            continue
          }
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ""
          while (!cancelled) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const chunks = buffer.split("\n\n")
            buffer = chunks.pop() ?? ""
            for (const chunk of chunks) {
              const line = chunk.split("\n").find((l) => l.startsWith("data: "))
              if (!line) continue
              try {
                const event = JSON.parse(line.slice(6)) as IotPushEvent
                if (event.type === "connected") {
                  setConnectionId(event.connectionId)
                } else if (event.type === "refresh") {
                  window.location.reload()
                } else if (event.type === "timeout") {
                  logout()
                } else if (event.type === "force-reauth") {
                  setOverlayMessage(event.reason || "An administrator ended this session. Please sign in again.")
                  setTimeout(() => logout(), 2500)
                } else if (event.type === "message") {
                  setOverlayMessage(event.text)
                } else if (event.type === "notification") {
                  toast({ title: event.title, description: event.body })
                } else if (event.type === "navigate" || event.type === "open-record") {
                  router.push(event.path)
                }
              } catch {
                // ignore malformed chunk
              }
            }
          }
        } catch {
          // connection dropped or aborted — fall through to reconnect
        }
        setConnectionId(null)
        if (!cancelled) {
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Report the current page on every route change so "Follow User" (IoT Connectors) can
  // show it — connectionId arrives async after the stream opens, so this also covers the
  // case where the very first heartbeat needs to wait a beat for that to land.
  useEffect(() => {
    if (!user || !connectionId) return
    apiFetch("/iot/heartbeat", {
      method: "POST",
      body: JSON.stringify({ connectionId, path: pathname }),
    }).catch(() => {})
  }, [user, connectionId, pathname])

  return (
    <IotChannelContext.Provider value={{ connectionId }}>
      {children}
      {overlayMessage && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-2xl">
            <LifeBuoy className="mx-auto mb-3 h-8 w-8 text-primary" />
            <p className="whitespace-pre-wrap break-words text-base text-foreground">{overlayMessage}</p>
            <Button className="mt-5 w-full" onClick={() => setOverlayMessage(null)}>
              OK
            </Button>
          </div>
        </div>
      )}
    </IotChannelContext.Provider>
  )
}

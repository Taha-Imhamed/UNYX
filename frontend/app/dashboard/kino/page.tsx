"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Loader2, Mic, MicOff, Send, Sparkles, XCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"

const CONVERSATION_STORAGE_KEY = "unyt_ai_conversation_id"

interface PendingToolAction {
  id: string
  toolName: string
  label: string
  parsedInput: Record<string, unknown>
}

type ChatEntryKind = "user" | "assistant" | "pending-action" | "action-result"

interface ChatEntry {
  key: string
  kind: ChatEntryKind
  content: string
  action?: PendingToolAction
  status?: "pending" | "confirming" | "cancelling" | "executed" | "cancelled"
}

interface AiMessageRow {
  id: string
  role: "user" | "assistant" | "tool_result"
  content: string
  toolCalls?: Array<{ id: string; toolName: string; input: Record<string, unknown>; status: string }> | null
}

// Minimal shape of the browser's Web Speech API — not in lib.dom.d.ts by default,
// and only Chrome/Edge implement it (no Firefox/Safari support as of this writing).
interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean }; length: number }
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionResultLike) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
}

function toLabel(toolName: string) {
  return toolName.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

function messagesToEntries(rows: AiMessageRow[]): ChatEntry[] {
  const entries: ChatEntry[] = []
  for (const row of rows) {
    if (row.role === "user") {
      entries.push({ key: row.id, kind: "user", content: row.content })
    } else if (row.role === "tool_result") {
      entries.push({ key: row.id, kind: "action-result", content: row.content })
    } else {
      if (row.content) {
        entries.push({ key: row.id, kind: "assistant", content: row.content })
      }
      for (const call of row.toolCalls ?? []) {
        if (call.status === "pending") {
          entries.push({
            key: call.id,
            kind: "pending-action",
            content: "",
            action: { id: call.id, toolName: call.toolName, label: toLabel(call.toolName), parsedInput: call.input },
            status: "pending",
          })
        }
      }
    }
  }
  return entries
}

const suggestedPrompts = [
  "How do I create a new student?",
  "Where can I see pending grade changes?",
  "How do I open or close enrollment?",
  "What can you help me with?",
]

export default function KinoPage() {
  const { user } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const isToolTier = user?.role === "admin" || user?.role === "super-admin"

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(CONVERSATION_STORAGE_KEY) : null
    if (!stored) return
    setConversationId(stored)
    apiFetch<AiMessageRow[]>(`/ai-assistant/conversations/${stored}/messages`)
      .then((rows) => setEntries(messagesToEntries(rows)))
      .catch(() => {
        sessionStorage.removeItem(CONVERSATION_STORAGE_KEY)
        setConversationId(null)
      })
  }, [])

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return
    setMicSupported(true)
    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.onresult = (event) => {
      let transcript = ""
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript
      }
      setInput(transcript)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
  }, [])

  function toggleListening() {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setInput("")
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  async function handleSend(overrideMessage?: string) {
    const message = (overrideMessage ?? input).trim()
    if (!message || isSending) return
    setError(null)
    setIsSending(true)
    setInput("")
    setEntries((prev) => [...prev, { key: `local-${Date.now()}`, kind: "user", content: message }])

    try {
      const res = await apiFetch<{ conversationId: string; reply: string; pendingActions: PendingToolAction[] }>(
        "/ai-assistant/chat",
        { method: "POST", body: JSON.stringify({ conversationId: conversationId ?? undefined, message }) },
      )
      if (res.conversationId !== conversationId) {
        setConversationId(res.conversationId)
        sessionStorage.setItem(CONVERSATION_STORAGE_KEY, res.conversationId)
      }
      setEntries((prev) => [
        ...prev,
        ...(res.reply ? [{ key: `assistant-${Date.now()}`, kind: "assistant" as const, content: res.reply }] : []),
        ...res.pendingActions.map((action) => ({
          key: action.id,
          kind: "pending-action" as const,
          content: "",
          action,
          status: "pending" as const,
        })),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach Kino")
    } finally {
      setIsSending(false)
    }
  }

  async function handleConfirm(action: PendingToolAction) {
    setEntries((prev) => prev.map((e) => (e.key === action.id ? { ...e, status: "confirming" } : e)))
    try {
      const res = await apiFetch<{ resultSummary: string }>(`/ai-assistant/tool-confirmations/${action.id}/confirm`, { method: "POST" })
      setEntries((prev) => [
        ...prev.map((e) => (e.key === action.id ? { ...e, status: "executed" as const } : e)),
        { key: `result-${action.id}`, kind: "action-result", content: `✓ ${res.resultSummary}` },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm action")
      setEntries((prev) => prev.map((e) => (e.key === action.id ? { ...e, status: "pending" } : e)))
    }
  }

  async function handleCancel(action: PendingToolAction) {
    setEntries((prev) => prev.map((e) => (e.key === action.id ? { ...e, status: "cancelling" } : e)))
    try {
      await apiFetch(`/ai-assistant/tool-confirmations/${action.id}/cancel`, { method: "POST" })
      setEntries((prev) => [
        ...prev.map((e) => (e.key === action.id ? { ...e, status: "cancelled" as const } : e)),
        { key: `result-${action.id}`, kind: "action-result", content: "Action cancelled" },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel action")
      setEntries((prev) => prev.map((e) => (e.key === action.id ? { ...e, status: "pending" } : e)))
    }
  }

  const hasStarted = entries.length > 0

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col">
      {!hasStarted ? (
        // Empty state: centered box, ChatGPT/Claude-style landing.
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2f56c8] text-white shadow-[0_8px_24px_rgba(47,86,200,0.35)]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mb-1.5 text-2xl font-extrabold text-[#16224a]">Hi {user?.username ?? "there"}, I'm Kino.</h1>
          <p className="mb-8 max-w-md text-center text-sm text-[#69769a]">
            {isToolTier
              ? "Ask me anything about UNYT, or tell me what you'd like me to do — e.g. \"create a user named jane.doe\"."
              : "Ask me anything about how UNYT works — I'll explain how to do it."}
          </p>

          <div className="w-full max-w-2xl">
            <ChatComposer
              input={input}
              setInput={setInput}
              onSend={() => handleSend()}
              isSending={isSending}
              micSupported={micSupported}
              isListening={isListening}
              onToggleMic={toggleListening}
            />
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="rounded-xl border border-[#e5eaf4] bg-white px-3.5 py-2.5 text-left text-[13px] font-medium text-[#33406a] transition-colors hover:border-[#2f56c8] hover:bg-[#eef2fc]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="mt-4 text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        // Conversation state: scrollable message column with a fixed composer at the bottom.
        <>
          <div className="flex-1 overflow-y-auto px-2">
            <div className="mx-auto flex max-w-2xl flex-col gap-3 py-6">
              {entries.map((entry) => {
                if (entry.kind === "user") {
                  return (
                    <div key={entry.key} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#2f56c8] px-4 py-2.5 text-sm text-white">
                      {entry.content}
                    </div>
                  )
                }
                if (entry.kind === "assistant") {
                  return (
                    <div key={entry.key} className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-[#eef2fc] px-4 py-2.5 text-sm text-[#16224a]">
                      {entry.content}
                    </div>
                  )
                }
                if (entry.kind === "action-result") {
                  return (
                    <div key={entry.key} className="mx-auto rounded-full bg-[#e6f6ee] px-3 py-1 text-xs font-semibold text-[#1f9d61]">
                      {entry.content}
                    </div>
                  )
                }
                const action = entry.action!
                return (
                  <div key={entry.key} className="mr-auto w-full max-w-[95%] rounded-xl border border-[#dde5f4] bg-white p-3.5 shadow-sm">
                    <p className="mb-1.5 text-sm font-bold text-[#16224a]">{action.label}</p>
                    <div className="mb-2.5 space-y-0.5">
                      {Object.entries(action.parsedInput).map(([key, value]) => (
                        <div key={key} className="flex gap-1.5 text-xs">
                          <span className="font-semibold text-[#69769a]">{key}:</span>
                          <span className="text-[#16224a]">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                    {entry.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleConfirm(action)} className="h-7 bg-[#1f9d61] px-2.5 text-xs hover:bg-[#1a8452]">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleCancel(action)} className="h-7 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700">
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel
                        </Button>
                      </div>
                    )}
                    {(entry.status === "confirming" || entry.status === "cancelling") && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {entry.status === "confirming" ? "Executing…" : "Cancelling…"}
                      </div>
                    )}
                  </div>
                )
              })}
              {isSending && (
                <div className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-[#eef2fc] px-4 py-2.5 text-sm text-[#69769a]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </div>
              )}
            </div>
          </div>

          {error && <p className="mx-auto max-w-2xl px-2 text-xs text-red-600">{error}</p>}

          <div className="mx-auto w-full max-w-2xl px-2 pb-2 pt-3">
            <ChatComposer
              input={input}
              setInput={setInput}
              onSend={() => handleSend()}
              isSending={isSending}
              micSupported={micSupported}
              isListening={isListening}
              onToggleMic={toggleListening}
            />
          </div>
        </>
      )}
    </div>
  )
}

function ChatComposer({
  input,
  setInput,
  onSend,
  isSending,
  micSupported,
  isListening,
  onToggleMic,
}: {
  input: string
  setInput: (value: string) => void
  onSend: () => void
  isSending: boolean
  micSupported: boolean
  isListening: boolean
  onToggleMic: () => void
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSend()
      }}
      className="flex items-end gap-2 rounded-2xl border border-[#dde5f4] bg-white p-2.5 shadow-[0_4px_18px_rgba(30,45,90,0.06)] focus-within:border-[#2f56c8]"
    >
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        placeholder={isListening ? "Listening…" : "Message Kino…"}
        disabled={isSending}
        rows={1}
        className="max-h-40 min-h-9 flex-1 resize-none border-0 shadow-none focus-visible:ring-0"
      />
      {micSupported && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onToggleMic}
          disabled={isSending}
          className={cn("shrink-0", isListening && "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700")}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      )}
      <Button type="submit" size="icon" disabled={isSending || !input.trim()} className="shrink-0 bg-[#2f56c8] hover:bg-[#2748ab]">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}

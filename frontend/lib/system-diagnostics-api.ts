import { apiFetch } from "./api-client"

export interface DiagnosticCheckMeta {
  id: string
  label: string
  group: string
}

export interface DiagnosticResult {
  id: string
  label: string
  group: string
  status: "pass" | "fail"
  code: number
  message: string
  durationMs: number
}

export const systemDiagnosticsApi = {
  list: (signal?: AbortSignal) => apiFetch<DiagnosticCheckMeta[]>("/system-diagnostics/checks", { signal }),
  runOne: (id: string) => apiFetch<DiagnosticResult>(`/system-diagnostics/run/${id}`, { method: "POST" }),
  runAll: () => apiFetch<DiagnosticResult[]>("/system-diagnostics/run-all", { method: "POST" }),
}

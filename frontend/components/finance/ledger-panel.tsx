"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchLedger, type LedgerEntry } from "@/lib/finance-api"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function LedgerPanel() {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [studentId, setStudentId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    fetchLedger({ studentId: studentId.trim() || undefined, signal: controller.signal })
      .then(setEntries)
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load ledger")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [studentId])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Financial ledger</CardTitle>
          <p className="text-sm text-muted-foreground">Append-only audit trail of every debit and credit posted to a student balance.</p>
        </div>
        <Input
          placeholder="Filter by student ID..."
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="sm:max-w-xs"
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading ledger
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No ledger entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.studentId}</TableCell>
                    <TableCell>
                      <Badge variant={entry.entryType === "credit" ? "secondary" : "outline"}>{entry.entryType}</Badge>
                    </TableCell>
                    <TableCell>{entry.source}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">{entry.note ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {entry.entryType === "debit" ? "-" : "+"}
                      {currencyFormatter.format(entry.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

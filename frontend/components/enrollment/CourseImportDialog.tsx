"use client"

import { useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { AlertTriangle, Check, Upload } from "lucide-react"
import { pillButtonStyles } from "@/components/enrollment/shared"
import { useToast } from "@/hooks/use-toast"
import { bulkImportCoursesRequest, type BulkImportCourseRow } from "@/lib/enrollment-api"
import type { Course } from "@shared/types"

interface CourseImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setCourses: Dispatch<SetStateAction<Course[]>>
}

const EXPECTED_HEADERS = ["title", "code", "professor", "capacity", "startDate", "endDate", "price", "department", "branch", "location"]

function parseCsv(text: string): BulkImportCourseRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) return []

  const splitLine = (line: string) => {
    const cells: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        cells.push(current)
        current = ""
      } else {
        current += char
      }
    }
    cells.push(current)
    return cells.map((cell) => cell.trim())
  }

  const headers = splitLine(lines[0]).map((h) => h.trim())
  const rows: BulkImportCourseRow[] = []

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitLine(lines[i])
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? ""
    })
    if (!record.title) continue

    rows.push({
      title: record.title,
      code: record.code || undefined,
      professor: record.professor || undefined,
      capacity: record.capacity ? Number(record.capacity) : undefined,
      startDate: record.startDate || undefined,
      endDate: record.endDate || undefined,
      price: record.price ? Number(record.price) : undefined,
      department: record.department || undefined,
      branch: record.branch || undefined,
      location: record.location || undefined,
    })
  }

  return rows
}

export function CourseImportDialog({ open, onOpenChange, setCourses }: CourseImportDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<BulkImportCourseRow[]>([])
  const [fileName, setFileName] = useState("")
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: Array<{ row: number; title: string; error: string }> } | null>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError(null)
    setResult(null)
    try {
      const text = await file.text()
      const parsed = parseCsv(text)
      if (parsed.length === 0) {
        setParseError("No valid rows found. Make sure the file has a header row and a 'title' column.")
        setRows([])
        return
      }
      setRows(parsed)
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Unable to read file")
      setRows([])
    }
  }

  const handleImport = async () => {
    if (rows.length === 0) return
    setImporting(true)
    setResult(null)
    try {
      const resp = await bulkImportCoursesRequest(rows)
      setResult({ created: resp.created.length, failed: resp.failed })
      if (resp.created.length > 0) {
        setCourses((prev) => [...prev, ...resp.created])
        toast({ title: `${resp.created.length} course(s) imported`, description: resp.failed.length > 0 ? `${resp.failed.length} row(s) failed.` : undefined })
      }
      if (resp.created.length === 0) {
        toast({ variant: "destructive", title: "Import failed", description: "No rows could be imported." })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setRows([])
    setFileName("")
    setParseError(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import courses from CSV
          </DialogTitle>
          <DialogDescription>
            Columns: {EXPECTED_HEADERS.join(", ")}. Only "title" is required — everything else falls back to
            defaults (first professor, 20 seats, today's date, 120-day duration).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
          />

          {parseError ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {parseError}
            </p>
          ) : null}

          {rows.length > 0 && !result ? (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-foreground">{fileName}</p>
              <p className="text-muted-foreground">{rows.length} course(s) ready to import.</p>
            </div>
          ) : null}

          {result ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-emerald-700">
                <Check className="h-4 w-4" />
                {result.created} course(s) created.
              </p>
              {result.failed.length > 0 ? (
                <div className="max-h-40 overflow-auto rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                  {result.failed.map((f) => (
                    <p key={f.row}>Row {f.row} ({f.title || "untitled"}): {f.error}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" className={pillButtonStyles.neutral} onClick={() => onOpenChange(false)}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result ? (
            <Button className={`gap-2 ${pillButtonStyles.primary}`} onClick={handleImport} disabled={rows.length === 0 || importing}>
              {importing ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              Import {rows.length > 0 ? `${rows.length} course(s)` : ""}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

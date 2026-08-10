"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { fetchMyDocumentRequests, submitDocumentRequest } from "@/lib/registrar-api"
import type { TranscriptRequest } from "@shared/types"
import { StudentFeatureGate } from "@/components/student-feature-gate"

const documentTypeLabels: Record<TranscriptRequest["documentType"], string> = {
  transcript: "Official Transcript",
  "enrollment-letter": "Enrollment Verification Letter",
  "graduation-letter": "Graduation Confirmation Letter",
  "recommendation-letter": "Recommendation Letter",
  other: "Other",
}

const deliveryLabels: Record<TranscriptRequest["deliveryMethod"], string> = {
  pickup: "Pick up in person",
  email: "Email",
  mail: "Mail",
}

export default function StudentDocumentRequestPage() {
  return (
    <StudentFeatureGate featureKey="document-request">
      <StudentDocumentRequestPageInner />
    </StudentFeatureGate>
  )
}

function StudentDocumentRequestPageInner() {
  const { toast } = useToast()
  const [documentType, setDocumentType] = useState<TranscriptRequest["documentType"]>("transcript")
  const [deliveryMethod, setDeliveryMethod] = useState<TranscriptRequest["deliveryMethod"]>("pickup")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<TranscriptRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    fetchMyDocumentRequests()
      .then((data) => setItems(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load your requests"))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await submitDocumentRequest({ documentType, deliveryMethod, notes: notes.trim() || undefined })
      toast({ title: "Request submitted", description: "The registrar's office will process your request." })
      setNotes("")
      load()
    } catch (err) {
      toast({ variant: "destructive", title: "Unable to submit", description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Document Requests</p>
        <h1 className="text-2xl font-bold text-foreground">Request official documents</h1>
        <p className="text-sm text-muted-foreground">Transcripts, enrollment letters, and other registrar documents.</p>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>New request</CardTitle>
          <CardDescription>Pick a document type and how you'd like to receive it.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document type</Label>
                <select
                  id="documentType"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as TranscriptRequest["documentType"])}
                >
                  {(Object.keys(documentTypeLabels) as TranscriptRequest["documentType"][]).map((key) => (
                    <option key={key} value={key}>
                      {documentTypeLabels[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryMethod">Delivery method</Label>
                <select
                  id="deliveryMethod"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as TranscriptRequest["deliveryMethod"])}
                >
                  {(Object.keys(deliveryLabels) as TranscriptRequest["deliveryMethod"][]).map((key) => (
                    <option key={key} value={key}>
                      {deliveryLabels[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything the registrar's office should know" />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="h-4 w-4" /> : "Submit request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Your requests</CardTitle>
          <CardDescription>Track the status of documents you've requested.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Loading
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!isLoading && !error && items.length === 0 && <p className="text-sm text-muted-foreground">No document requests yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{documentTypeLabels[item.documentType]}</p>
                <Badge variant="outline">{item.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {deliveryLabels[item.deliveryMethod]} • Requested {new Date(item.requestedAt).toLocaleString()}
              </p>
              {item.notes && <p className="mt-2 text-sm text-foreground">{item.notes}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Megaphone, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import type { NewsItem } from "@shared/types"
import { fetchNews, publishNews, updateNews, deleteNews } from "@/lib/news-api"
import { ConfirmDeleteAlert, emptyConfirmDeleteState, type ConfirmDeleteState } from "@/components/enrollment/ConfirmDeleteAlert"

const MAX_NEWS_IMAGE_SIZE = 2 * 1024 * 1024
const ACCEPTED_NEWS_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"])

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function NewsPage() {
  const { toast } = useToast()
  const { user, hasPermission } = useAuth()
  const [items, setItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newsTitle, setNewsTitle] = useState("")
  const [newsBody, setNewsBody] = useState("")
  const [newsExpiresAt, setNewsExpiresAt] = useState("")
  const [newsImage, setNewsImage] = useState<File | null>(null)
  const [newsImagePreview, setNewsImagePreview] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteState, setDeleteState] = useState<ConfirmDeleteState>(emptyConfirmDeleteState)
  const formRef = useRef<HTMLFormElement | null>(null)
  const titleRef = useRef<HTMLInputElement | null>(null)

  const loadNews = useCallback(
    async (options?: { signal?: AbortSignal; silent?: boolean }) => {
      try {
        const news = await fetchNews(options?.signal)
        setItems(news)
      } catch (error) {
        if (options?.signal?.aborted) {
          return
        }
        console.error("Failed to load news", error)
        if (!options?.silent) {
          toast({
            variant: "destructive",
            title: "Unable to load news",
            description: error instanceof Error ? error.message : "Unknown error",
          })
        }
        throw error
      }
    },
    [toast],
  )

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    loadNews({ signal: controller.signal, silent: true }).finally(() => setIsLoading(false))
    return () => controller.abort()
  }, [loadNews])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadNews()
      toast({ title: "News refreshed", description: "Announcements are up to date." })
    } catch (error) {
      // error already surfaced via toast in loadNews
      console.error("Refresh failed", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleNewsImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (!file) {
      setNewsImage(null)
      setNewsImagePreview(null)
      return
    }

    if (!ACCEPTED_NEWS_IMAGE_TYPES.has(file.type)) {
      toast({
        variant: "destructive",
        title: "Unsupported image type",
        description: "Choose a PNG, JPG, or WebP image.",
      })
      event.target.value = ""
      setNewsImage(null)
      setNewsImagePreview(null)
      return
    }

    if (file.size > MAX_NEWS_IMAGE_SIZE) {
      toast({
        variant: "destructive",
        title: "Image too large",
        description: "Choose an image under 2MB.",
      })
      event.target.value = ""
      setNewsImage(null)
      setNewsImagePreview(null)
      return
    }

    setNewsImage(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setNewsImagePreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const canManageNews = hasPermission("marketing:manage")

  const handleNewsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !canManageNews || isPublishing) return

    const trimmedTitle = newsTitle.trim()
    const trimmedBody = newsBody.trim()

    if (!trimmedTitle) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Add a headline before publishing an announcement.",
      })
      return
    }

    if (!trimmedBody) {
      toast({
        variant: "destructive",
        title: "Message required",
        description: "Write the announcement content before publishing.",
      })
      return
    }

    let expiresAtValue: string | null = null

    if (newsExpiresAt.trim()) {
      const parsed = new Date(`${newsExpiresAt}T00:00:00Z`)
      if (Number.isNaN(parsed.getTime())) {
        toast({
          variant: "destructive",
          title: "Invalid expiration date",
          description: "Choose a valid calendar date.",
        })
        return
      }
      expiresAtValue = parsed.toISOString()
    }

    setIsPublishing(true)

    let imageUrl: string | null = null
    if (newsImage) {
      const reader = new FileReader()
      imageUrl = await new Promise((resolve) => {
        reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null)
        reader.readAsDataURL(newsImage)
      })
    }

    try {
      if (editingId) {
        const updated = await updateNews(editingId, {
          title: trimmedTitle,
          body: trimmedBody,
          expiresAt: expiresAtValue,
          imageUrl: imageUrl ?? newsImagePreview ?? undefined,
        })

        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)))
        toast({ title: "Announcement updated", description: `${updated.title} has been saved.` })
      } else {
        const entry = await publishNews({
          title: trimmedTitle,
          body: trimmedBody,
          createdBy: user.username,
          expiresAt: expiresAtValue,
          imageUrl,
        })

        setItems((previous) => [entry, ...previous])

        toast({
          title: "Announcement posted",
          description: `${entry.title} is now available in News.`,
        })
      }

      setNewsTitle("")
      setNewsBody("")
      setNewsExpiresAt("")
      setNewsImage(null)
      setNewsImagePreview(null)
      setEditingId(null)
    } catch (error) {
      console.error("News publish failed", error)
      toast({
        variant: "destructive",
        title: editingId ? "Unable to update announcement" : "Unable to post announcement",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const requestDelete = (item: NewsItem) => {
    setDeleteState({ open: true, targetId: item.id, targetLabel: item.title, loading: false, error: null })
  }

  const confirmDelete = async () => {
    if (!deleteState.targetId) return
    setDeleteState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await deleteNews(deleteState.targetId)
      setItems((prev) => prev.filter((entry) => entry.id !== deleteState.targetId))
      toast({ title: "Announcement deleted", description: `${deleteState.targetLabel} removed.` })
      setDeleteState(emptyConfirmDeleteState)
    } catch (error) {
      console.error("Delete news failed", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      toast({
        variant: "destructive",
        title: "Unable to delete announcement",
        description: message,
      })
      setDeleteState((prev) => ({ ...prev, loading: false, error: message }))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader
        title="News"
        description="Stay up to date with announcements published by the admin team"
      />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Megaphone className="h-4 w-4 text-primary" />
            <span>Announcements are shared across every dashboard account.</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {canManageNews && (
          <Card className="mb-6 bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Publish Announcement
              </CardTitle>
              <CardDescription>Create a news post that appears for all dashboard users.</CardDescription>
            </CardHeader>
            <CardContent>
              <form ref={formRef} className="space-y-4" onSubmit={handleNewsSubmit}>
                {editingId && (
                  <div className="flex items-center justify-between rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                    <span>Editing announcement</span>
                    <Badge variant="secondary" className="capitalize">
                      {newsTitle || "Selected item"}
                    </Badge>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="news-title">Headline</Label>
                    <Input
                      ref={titleRef}
                      id="news-title"
                      placeholder="e.g. System maintenance on Friday"
                      value={newsTitle}
                      onChange={(event) => setNewsTitle(event.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="news-expires">Expires (optional)</Label>
                    <Input
                      id="news-expires"
                      type="date"
                      value={newsExpiresAt}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(event) => setNewsExpiresAt(event.target.value)}
                      className="bg-secondary border-border"
                    />
                    <p className="text-xs text-muted-foreground">Announcements expire at midnight UTC of the selected date.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="news-body">Message</Label>
                  <Textarea
                    id="news-body"
                    placeholder="Share the details that users should see when they open News..."
                    value={newsBody}
                    onChange={(event) => setNewsBody(event.target.value)}
                    className="bg-secondary border-border min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">Users read announcements in the News page within the dashboard.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="news-image">Image (optional)</Label>
                  <Input
                    id="news-image"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleNewsImageChange}
                  />
                  {newsImagePreview && (
                    <img src={newsImagePreview} alt="Preview" className="max-h-40 rounded border" />
                  )}
                  <p className="text-xs text-muted-foreground">PNG, JPG, or WebP. Image will appear with the announcement.</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Admins and supervisors can publish and edit. All users can read the feed below.</p>
                  <div className="flex items-center gap-2">
                    {editingId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null)
                          setNewsTitle("")
                          setNewsBody("")
                          setNewsExpiresAt("")
                          setNewsImage(null)
                          setNewsImagePreview(null)
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={isPublishing}>
                      {isPublishing ? (editingId ? "Saving..." : "Publishing...") : editingId ? "Save Changes" : "Publish Announcement"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading announcements...</span>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>No announcements yet</CardTitle>
              <CardDescription>Check back soon for new updates from the admin team.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 pb-6">
              {items.map((item) => {
                const isExpired = item.expiresAt ? new Date(item.expiresAt).getTime() < Date.now() : false
                const isOwner = canManageNews
                return (
                  <Card key={item.id} className="bg-card border-border">
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">{item.title}</CardTitle>
                        <CardDescription className="text-xs">
                          Published {formatDateTime(item.createdAt)} by {item.createdBy}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isExpired ? "secondary" : "default"}
                          className={isExpired ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}
                        >
                          {isExpired ? "Expired" : "Active"}
                        </Badge>
                        {isOwner && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingId(item.id)
                                setNewsTitle(item.title)
                                setNewsBody(item.body)
                                setNewsExpiresAt(item.expiresAt ? item.expiresAt.slice(0, 10) : "")
                                setNewsImage(null)
                                setNewsImagePreview(item.imageUrl ?? null)
                                queueMicrotask(() => {
                                  formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                                  titleRef.current?.focus()
                                })
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => requestDelete(item)}
                              disabled={deleteState.loading && deleteState.targetId === item.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="News" className="max-h-48 rounded border mb-2" />
                      )}
                      <p className="whitespace-pre-line leading-relaxed">{item.body}</p>
                      {item.expiresAt ? (
                        <p className="text-xs">
                          Visible until <span className="font-medium text-foreground">{formatDate(item.expiresAt)}</span>
                        </p>
                      ) : (
                        <p className="text-xs">No expiration date set.</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <ConfirmDeleteAlert
        state={deleteState}
        onOpenChange={(open) => {
          if (!open) setDeleteState(emptyConfirmDeleteState)
        }}
        onConfirm={confirmDelete}
        title="Delete announcement"
        description={`Removing ${deleteState.targetLabel || "this announcement"} cannot be undone.`}
        confirmLabel="Delete announcement"
      />
    </div>
  )
}

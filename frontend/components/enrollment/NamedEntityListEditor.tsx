"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2 } from "lucide-react"
import { pillButtonStyles } from "@/components/enrollment/shared"

interface NamedEntity {
  id: string
  name: string
}

interface NamedEntityListEditorProps<T extends NamedEntity> {
  items: T[]
  newName: string
  onNewNameChange: (value: string) => void
  onAdd: () => void
  onRemove: (item: T) => void
  saving: boolean
  addPlaceholder: string
  emptyLabel: string
  addLabel?: string
  removeLabel?: string
  isSelected?: (item: T) => boolean
  onSelect?: (item: T) => void
  renderExtra?: (item: T) => React.ReactNode
}

export function NamedEntityListEditor<T extends NamedEntity>({
  items,
  newName,
  onNewNameChange,
  onAdd,
  onRemove,
  saving,
  addPlaceholder,
  emptyLabel,
  addLabel = "Add",
  removeLabel = "Remove",
  isSelected,
  onSelect,
  renderExtra,
}: NamedEntityListEditorProps<T>) {
  const [search, setSearch] = useState("")

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.name.toLowerCase().includes(q))
  }, [items, search])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(event) => onNewNameChange(event.target.value)}
          placeholder={addPlaceholder}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onAdd()
            }
          }}
        />
        <Button className={`gap-2 ${pillButtonStyles.primary}`} onClick={onAdd} disabled={saving}>
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      </div>
      {items.length > 6 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search…"
          />
        </div>
      ) : null}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">{items.length === 0 ? emptyLabel : "No matches."}</p>
        ) : (
          filteredItems.map((item) => {
            const selected = isSelected?.(item) ?? false
            return (
              <div
                key={item.id}
                onClick={onSelect ? () => onSelect(item) : undefined}
                role={onSelect ? "button" : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onKeyDown={
                  onSelect
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          onSelect(item)
                        }
                      }
                    : undefined
                }
                className={`flex items-center justify-between rounded-md border p-2 ${
                  onSelect
                    ? `cursor-pointer transition ${selected ? "border-sky-300 bg-sky-50 shadow-sm" : "border-sky-100 bg-white/90 hover:border-sky-200 hover:bg-sky-50/60"}`
                    : "border-sky-100 bg-white/90"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {renderExtra?.(item)}
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 ${pillButtonStyles.dangerOutline}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemove(item)
                    }}
                    disabled={saving}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {removeLabel}
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchKey?: keyof T
  searchKeys?: Array<keyof T | string>
  filterKey?: keyof T
  filterOptions?: { value: string; label: string }[]
  filterPlaceholder?: string
  pageSize?: number
  actions?: (item: T) => React.ReactNode
  maxHeight?: number | string
  compact?: boolean
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKey,
  searchKeys,
  filterKey,
  filterOptions,
  filterPlaceholder = "Filter",
  pageSize = 10,
  actions,
  maxHeight,
  compact = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const toSearchString = (value: unknown): string => {
    if (value === null || value === undefined) {
      return ""
    }
    if (typeof value === "string") {
      return value.toLowerCase()
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value).toLowerCase()
    }
    if (value instanceof Date) {
      return value.toISOString().toLowerCase()
    }
    if (Array.isArray(value)) {
      return value.map((item) => toSearchString(item)).filter(Boolean).join(" ")
    }
    if (typeof value === "object") {
      return Object.values(value as Record<string, unknown>)
        .map((item) => toSearchString(item))
        .filter(Boolean)
        .join(" ")
    }
    return ""
  }

  const resolveValue = (record: T, key: keyof T | string): unknown => {
    if (typeof key === "string" && key.includes(".")) {
      return key.split(".").reduce<unknown>((acc, part) => {
        if (acc && typeof acc === "object") {
          return (acc as Record<string, unknown>)[part]
        }
        return undefined
      }, record)
    }

    if (key in record) {
      return record[key as keyof T]
    }

    if (typeof key === "string") {
      return (record as Record<string, unknown>)[key]
    }

    return undefined
  }

  const filteredData = data.filter((item) => {
    const normalizedQuery = search.trim().toLowerCase()
    const tokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : []
    const activeSearchKeys =
      searchKeys && searchKeys.length > 0 ? searchKeys : searchKey ? [searchKey] : columns.map((column) => column.key)
    const matchesSearch =
      tokens.length === 0 ||
      tokens.every((token) =>
        activeSearchKeys.some((key) => toSearchString(resolveValue(item, key)).includes(token)),
      )
    const matchesFilter = filter === "all" || !filterKey ? true : String(item[filterKey]) === filter
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className={compact ? "h-10 rounded-xl border-slate-200 bg-white pl-12 shadow-sm transition-all focus:ring-2 focus:ring-primary/30" : "h-11 rounded-xl border-slate-200 bg-white pl-12 shadow-sm transition-all focus:ring-2 focus:ring-primary/30"}
          />
        </div>
        {filterOptions && (
          <Select
            value={filter}
            onValueChange={(value) => {
              setFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className={compact ? "h-10 w-44 rounded-xl border-slate-200 bg-white shadow-sm" : "h-11 w-44 rounded-xl border-slate-200 bg-white shadow-sm"}>
              <SelectValue placeholder={filterPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div
          className={`overflow-x-auto ${maxHeight ? "overflow-y-auto" : ""}`}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <Table className={compact ? "table-fixed" : undefined}>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50 hover:bg-slate-50">
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={compact ? "text-foreground font-semibold py-3 px-4 whitespace-normal break-words" : "text-foreground font-semibold py-4 px-6"}
                  >
                    {column.header}
                  </TableHead>
                ))}
                {actions && (
                  <TableHead
                    className={compact ? "text-foreground font-semibold text-right py-3 px-4 whitespace-normal break-words" : "text-foreground font-semibold text-right py-4 px-6"}
                  >
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                      <span>No data found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow key={index} className="group border-b border-slate-100 transition-colors hover:bg-slate-50/80 last:border-0">
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.key)}
                        className={compact ? "py-3 px-4 align-top whitespace-normal break-words" : "py-4 px-6"}
                      >
                        {column.render ? column.render(item) : String(item[column.key as keyof T] ?? "")}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell
                        className={compact ? "text-right py-3 px-4 align-top whitespace-normal break-words opacity-70 group-hover:opacity-100 transition-opacity" : "text-right py-4 px-6 opacity-70 group-hover:opacity-100 transition-opacity"}
                      >
                        {actions(item)}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredData.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 rounded-xl border-slate-200 transition-colors hover:border-primary/20 hover:bg-slate-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-1 rounded-xl bg-slate-50 px-4 py-2">
              <span className="text-sm font-medium text-foreground">{currentPage}</span>
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-10 w-10 rounded-xl border-slate-200 transition-colors hover:border-primary/20 hover:bg-slate-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

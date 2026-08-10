import type { Request } from 'express'

const DEFAULT_UNPAGINATED_CAP = 1000
const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 500

export interface PaginationRequest {
  /** True when the caller explicitly asked for a page (via ?page= or ?pageSize=). */
  isPaginated: boolean
  page: number
  pageSize: number
}

/**
 * Reads ?page=/?pageSize= from the query string. Pagination is opt-in: existing
 * clients that don't send these params keep getting a plain array response
 * (capped at DEFAULT_UNPAGINATED_CAP as a safety net against unbounded scans),
 * so this doesn't break any current frontend consumer.
 */
export function readPagination(req: Request): PaginationRequest {
  const { page, pageSize } = req.query
  const isPaginated = page !== undefined || pageSize !== undefined
  const parsedPage = Math.max(1, Number(page) || 1)
  const parsedPageSize = Math.max(1, Math.min(MAX_PAGE_SIZE, Number(pageSize) || DEFAULT_PAGE_SIZE))
  return { isPaginated, page: parsedPage, pageSize: parsedPageSize }
}

export const UNPAGINATED_SAFETY_CAP = DEFAULT_UNPAGINATED_CAP

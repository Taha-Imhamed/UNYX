"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchCoupons } from "@/lib/finance-api"

const buildCouponMap = (coupons: Array<{ code: string; percent: number }>) => {
  const couponMap: Record<string, number> = { roi: 0.25, ndricim: 0.5 }
  coupons.forEach((coupon) => {
    const key = coupon.code.trim().toLowerCase()
    if (!key) return
    const percentDecimal = coupon.percent > 1 ? coupon.percent / 100 : coupon.percent
    couponMap[key] = percentDecimal
  })
  return couponMap
}

export function useCouponDiscounts(options?: { enabled?: boolean; refreshKey?: unknown }) {
  const enabled = options?.enabled ?? true
  const refreshKey = options?.refreshKey
  const [couponDiscounts, setCouponDiscounts] = useState<Record<string, number>>({ roi: 0.25, ndricim: 0.5 })
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    fetchCoupons(controller.signal)
      .then((coupons) => {
        if (controller.signal.aborted) return
        setCouponDiscounts(buildCouponMap(coupons))
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load coupons.")
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })
    return () => controller.abort()
  }, [enabled, refreshKey])

  const refresh = useCallback(async () => {
    try {
      const coupons = await fetchCoupons()
      const map = buildCouponMap(coupons)
      setCouponDiscounts(map)
      return map
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load coupons.")
      throw err
    }
  }, [])

  return { couponDiscounts, setCouponDiscounts, isLoading, error, refresh }
}

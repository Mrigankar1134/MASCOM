'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type CartLine = {
  productId: string
  slug: string
  name: string
  image?: string
  color?: string
  size?: string
  customName?: string
  unitPrice: number
  quantity: number
}

type CartApi = {
  lines: CartLine[]
  count: number
  subtotal: number
  ready: boolean
  add: (line: CartLine) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartApi | null>(null)
const STORAGE_KEY = 'mascom-bag-v1'

/** A line is identified by product + variant + personalisation. */
export function lineKey(line: Pick<CartLine, 'productId' | 'color' | 'size' | 'customName'>): string {
  return [line.productId, line.color ?? '', line.size ?? '', line.customName ?? ''].join('|')
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)

  // The bag lives in localStorage so a student can close the tab mid-drop and
  // come back to it, no server round trip, and it works offline.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setLines(JSON.parse(raw) as CartLine[])
    } catch {
      /* corrupted or unavailable storage, start with an empty bag */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* quota or private mode, the bag just won't survive a reload */
    }
  }, [lines, ready])

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const key = lineKey(line)
      const existing = prev.find((l) => lineKey(l) === key)
      if (existing) {
        return prev.map((l) =>
          lineKey(l) === key ? { ...l, quantity: Math.min(l.quantity + line.quantity, 20) } : l,
        )
      }
      return [...prev, line]
    })
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) => (lineKey(l) === key ? { ...l, quantity: Math.min(quantity, 20) } : l)),
    )
  }, [])

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartApi>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0)
    const subtotal = lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0)
    return { lines, count, subtotal, ready, add, setQuantity, remove, clear }
  }, [lines, ready, add, setQuantity, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}

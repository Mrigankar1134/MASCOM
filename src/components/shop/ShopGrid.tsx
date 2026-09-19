'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ShopProduct } from '@/lib/data'
import { ProductCard } from './ProductCard'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState } from '@/components/ui/Feedback'
import { Icon } from '@/components/shell/Icons'

export function ShopGrid({ products }: { products: ShopProduct[] }) {
  const categories = useMemo(() => {
    const set = new Map<string, number>()
    for (const p of products) {
      const key = p.category?.trim() || 'Other'
      set.set(key, (set.get(key) ?? 0) + 1)
    }
    return [...set.entries()].map(([value, count]) => ({ value, label: value, count }))
  }, [products])

  const [filter, setFilter] = useState('all')

  const visible =
    filter === 'all'
      ? products
      : products.filter((p) => (p.category?.trim() || 'Other') === filter)

  const openCount = products.filter((p) => p.available).length

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:pt-10">
      <header className="mb-6 lg:mb-9">
        <p className="eyebrow">{openCount > 0 ? 'Orders open' : 'Catalogue'}</p>
        <h1 className="display mt-2.5 text-[clamp(2.2rem,7vw,3.5rem)]">The drop</h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--muted-fg)]">
          {openCount > 0
            ? 'Pick your colour and size, pay any coordinator by UPI, and upload the screenshot. They confirm it and your order is locked in.'
            : 'Nothing is open for orders right now. Everything here is from past drops.'}
        </p>
      </header>

      {categories.length > 1 && (
        <Segmented
          className="mb-5"
          options={[{ value: 'all', label: 'Everything', count: products.length }, ...categories]}
          value={filter}
          onChange={setFilter}
        />
      )}

      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {visible.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Icon.Box size={24} />}
          title="No drop is live right now"
          description="Drops open for a short window and sell out fast. Check back, or follow the Instagram for the announcement."
          action={
            <Link
              href="/"
              className="press inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[14.5px] font-semibold"
              style={{ background: 'var(--accent-solid)', color: 'var(--accent-contrast)' }}
            >
              Back to home
            </Link>
          }
        />
      )}
    </div>
  )
}

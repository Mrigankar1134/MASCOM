'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ShopProduct } from '@/lib/data'
import { ProductCard } from './ProductCard'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState } from '@/components/ui/Feedback'
import { Icon } from '@/components/shell/Icons'
import { NavBar } from '@/components/shell/NavBar'
import { Button } from '@/components/ui/Button'

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
    <div className="mx-auto max-w-7xl">
      <NavBar
        title="The drop"
        subtitle={
          openCount > 0
            ? 'Grab your size, pay a coordinator on UPI, send the screenshot. That is the whole thing.'
            : 'Nothing is open right now. Everything here is from past drops.'
        }
      >
        {categories.length > 1 && (
          <Segmented
            options={[{ value: 'all', label: 'All', count: products.length }, ...categories]}
            value={filter}
            onChange={setFilter}
            className="max-w-md"
          />
        )}
      </NavBar>

      <div className="px-4 pt-3">
        {visible.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {visible.map((product, i) => (
              <ProductCard key={product._id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="ios-group">
            <EmptyState
              icon={<Icon.Box size={24} />}
              title="Nothing live right now"
              description="Drops go up for a few days and sell out fast. Check back soon, or keep an eye on our Instagram."
              action={
                <Link href="/">
                  <Button>Back to home</Button>
                </Link>
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import type { ShopProduct } from '@/lib/data'
import { money } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/components/ui/cn'

/** Best-guess swatch for a colour name, so the dots look right without hex data. */
export function swatch(color: string): string {
  const key = color.trim().toLowerCase()
  const known: Record<string, string> = {
    black: '#111114',
    white: '#f6f6f8',
    navy: '#1b2a4a',
    'navy blue': '#1b2a4a',
    blue: '#2563eb',
    'sky blue': '#7dd3fc',
    red: '#dc2626',
    maroon: '#7f1d2e',
    green: '#15803d',
    'bottle green': '#0f5132',
    olive: '#6b7a3a',
    grey: '#9ca3af',
    gray: '#9ca3af',
    'light grey': '#d1d5db',
    'melange grey': '#b6b9c2',
    beige: '#e7dbc6',
    cream: '#f3ead7',
    lavender: '#c4b5fd',
    purple: '#7c3aed',
    pink: '#f472b6',
    yellow: '#facc15',
    mustard: '#d9a51b',
    orange: '#f97316',
    brown: '#6b4a2f',
    teal: '#0d9488',
  }
  return known[key] ?? '#9ca3af'
}

export function ProductCard({ product, index = 0 }: { product: ShopProduct; index?: number }) {
  const [variantIndex, setVariantIndex] = useState(0)
  const variant = product.variants[variantIndex]
  const image = variant?.imageUrls?.[0]
  const soldOut = !product.available

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.05, ease: [0.32, 0.72, 0, 1] }}
      className="glass glass-lens glass-interactive group overflow-hidden rounded-[1.5rem] p-2"
    >
      <Link href={`/shop/${product.slug}`} className="block">
        <div
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.1rem]"
          style={{ background: 'var(--hairline-soft)' }}
        >
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full place-items-center text-[var(--faint-fg)]">
              <span className="text-[12px] font-medium">Photo coming soon</span>
            </div>
          )}

          <div className="absolute left-2.5 top-2.5 flex gap-1.5">
            {soldOut ? (
              <Badge tone="neutral">Closed</Badge>
            ) : (
              <Badge tone="accent" dot>
                Open
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="px-2 pb-1.5 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/shop/${product.slug}`}>
              <h3 className="truncate text-[15px] font-semibold tracking-tight">{product.name}</h3>
            </Link>
            <p className="mt-0.5 truncate text-[12.5px] text-[var(--faint-fg)]">
              {product.category || product.material || 'MASCOM drop'}
            </p>
          </div>
          <p className="shrink-0 text-[15px] font-semibold tabular">{money(product.price)}</p>
        </div>

        {product.variants.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5">
            {product.variants.slice(0, 6).map((v, i) => (
              <button
                key={v.color}
                onClick={() => setVariantIndex(i)}
                aria-label={v.color}
                title={v.color}
                className={cn(
                  'press h-5 w-5 rounded-full transition-transform',
                  i === variantIndex && 'scale-110',
                )}
                style={{
                  background: swatch(v.color),
                  boxShadow:
                    i === variantIndex
                      ? '0 0 0 2px var(--page-bg), 0 0 0 3.5px var(--accent)'
                      : 'inset 0 0 0 1px var(--hairline)',
                }}
              />
            ))}
            {product.variants.length > 6 && (
              <span className="text-[11px] text-[var(--faint-fg)]">
                +{product.variants.length - 6}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.article>
  )
}

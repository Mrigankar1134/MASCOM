'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import type { ShopProduct } from '@/lib/data'
import { money } from '@/lib/format'
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
      className="group"
    >
      <Link href={`/shop/${product.slug}`} className="block">
        <div
          className="squircle relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-lg)]"
          style={{ background: 'var(--fill-4)', boxShadow: 'var(--shadow-1)' }}
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
            <div className="grid h-full place-items-center text-[var(--label-3)]">
              <span className="t-caption-1">Photo coming soon</span>
            </div>
          )}

          {/* A capsule on the material, the way a badge sits on artwork in
              the App Store, not a chip floating on its own. */}
          <div className="absolute left-2 top-2 flex gap-1.5">
            {soldOut ? (
              <span className="glass rounded-full px-2 py-[3px] text-[11px] font-semibold leading-[13px] text-[var(--label-2)]">
                Closed
              </span>
            ) : (
              <span
                className="rounded-full px-2 py-[3px] text-[11px] font-semibold leading-[13px]"
                style={{ background: 'var(--tint-solid)', color: 'var(--tint-contrast)' }}
              >
                Open
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Name, then price beneath it, a title never has to compete with a
          number for the same line, so nothing truncates at phone width. */}
      <div className="pt-2.5">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="t-subhead line-clamp-2 font-semibold">{product.name}</h3>
        </Link>
        <p className="t-subhead mt-0.5 text-[var(--label-2)] tabular">{money(product.price)}</p>

        {/* The dot stays small; the button around it carries the touch
            target, so a thumb does not have to hit an 18px circle. */}
        {product.variants.length > 1 && (
          <div className="-mx-1.5 mt-1 flex items-center">
            {product.variants.slice(0, 6).map((v, i) => (
              <button
                key={v.color}
                onClick={() => setVariantIndex(i)}
                aria-label={v.color}
                aria-pressed={i === variantIndex}
                title={v.color}
                className="press grid h-8 w-8 shrink-0 place-items-center rounded-full"
              >
                <span
                  className={cn(
                    'block h-[18px] w-[18px] rounded-full transition-transform',
                    i === variantIndex && 'scale-110',
                  )}
                  style={{
                    background: swatch(v.color),
                    boxShadow:
                      i === variantIndex
                        ? '0 0 0 2px var(--surface), 0 0 0 3.5px var(--tint)'
                        : 'inset 0 0 0 1px var(--separator)',
                  }}
                />
              </button>
            ))}
            {product.variants.length > 6 && (
              <span className="t-caption-2 text-[var(--label-3)]">
                +{product.variants.length - 6}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.article>
  )
}

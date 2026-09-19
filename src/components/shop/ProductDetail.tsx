'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ShopProduct } from '@/lib/data'
import { money } from '@/lib/format'
import { swatch } from './ProductCard'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/shell/Icons'
import { useToast } from '@/components/ui/Toast'
import { useCart } from '@/lib/client/cart'
import { useSession } from '@/lib/client/session'
import { cn } from '@/components/ui/cn'

export function ProductDetail({ product }: { product: ShopProduct }) {
  const router = useRouter()
  const toast = useToast()
  const cart = useCart()
  const user = useSession()

  const [variantIndex, setVariantIndex] = useState(0)
  const [imageIndex, setImageIndex] = useState(0)
  const [size, setSize] = useState<string | null>(
    product.availableSizes.length === 1 ? product.availableSizes[0] : null,
  )
  const [customName, setCustomName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const variant = product.variants[variantIndex]
  const images = variant?.imageUrls?.length ? variant.imageUrls : []
  const needsSize = product.availableSizes.length > 0
  const canAdd = product.available && (!needsSize || !!size)

  function addToBag(thenCheckout = false) {
    if (!product.available) return
    if (needsSize && !size) {
      toast.error('Pick a size first.')
      return
    }

    cart.add({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: images[0],
      color: variant?.color,
      size: size ?? undefined,
      customName: product.allowCustomName && customName.trim() ? customName.trim() : undefined,
      unitPrice: product.price,
      quantity,
    })

    if (thenCheckout) {
      router.push(user ? '/checkout' : '/signin?next=/checkout')
      return
    }

    setAdded(true)
    toast.success(`${product.name} added to your bag.`)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:pt-8">
      <Link
        href="/shop"
        className="press mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--muted-fg)]"
      >
        <Icon.ChevronLeft size={16} />
        All drops
      </Link>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        {/* ── Gallery ──────────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Glass className="overflow-hidden p-2">
            <div
              className="relative aspect-square w-full overflow-hidden rounded-[1.1rem]"
              style={{ background: 'var(--hairline-soft)' }}
            >
              <AnimatePresence mode="wait">
                {images[imageIndex] ? (
                  <motion.div
                    key={images[imageIndex]}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={images[imageIndex]}
                      alt={`${product.name} in ${variant?.color ?? 'default'}`}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 48vw"
                      className="object-cover"
                    />
                  </motion.div>
                ) : (
                  <div className="grid h-full place-items-center text-[var(--faint-fg)]">
                    <Icon.Box size={32} />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </Glass>

          {images.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setImageIndex(i)}
                  className={cn(
                    'press relative h-16 w-16 shrink-0 overflow-hidden rounded-xl transition-opacity',
                    i === imageIndex ? 'opacity-100' : 'opacity-55',
                  )}
                  style={{
                    boxShadow:
                      i === imageIndex
                        ? '0 0 0 2px var(--page-bg), 0 0 0 3.5px var(--accent)'
                        : 'inset 0 0 0 1px var(--hairline)',
                  }}
                  aria-label={`View photo ${i + 1}`}
                >
                  <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ──────────────────────────────────────────────────── */}
        <div className="pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {product.available ? (
              <Badge tone="accent" dot>
                Orders open
              </Badge>
            ) : (
              <Badge tone="neutral">Closed</Badge>
            )}
            {product.category && <Badge tone="neutral">{product.category}</Badge>}
            {product.totalSold > 0 && <Badge tone="neutral">{product.totalSold} ordered</Badge>}
          </div>

          <h1 className="display mt-4 text-[clamp(2rem,6vw,3rem)]">{product.name}</h1>
          <p className="mt-3 text-[26px] font-semibold tabular">{money(product.price)}</p>

          {product.description && (
            <p className="mt-4 max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-[var(--muted-fg)]">
              {product.description}
            </p>
          )}

          {product.variants.length > 0 && (
            <section className="mt-8">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--faint-fg)]">
                  Colour
                </h2>
                <span className="text-[13.5px] font-medium">{variant?.color}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.variants.map((v, i) => (
                  <button
                    key={v.color}
                    onClick={() => {
                      setVariantIndex(i)
                      setImageIndex(0)
                    }}
                    aria-label={v.color}
                    aria-pressed={i === variantIndex}
                    className="press h-9 w-9 rounded-full transition-transform"
                    style={{
                      background: swatch(v.color),
                      boxShadow:
                        i === variantIndex
                          ? '0 0 0 2px var(--page-bg), 0 0 0 4px var(--accent)'
                          : 'inset 0 0 0 1px var(--hairline)',
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {needsSize && (
            <section className="mt-7">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--faint-fg)]">
                Size
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={cn(
                      'press min-w-14 rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-colors',
                      size === s ? 'text-[var(--accent-contrast)]' : 'glass text-[var(--page-fg)]',
                    )}
                    style={size === s ? { background: 'var(--accent-solid)' } : undefined}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>
          )}

          {product.allowCustomName && (
            <section className="mt-7">
              <label
                htmlFor="custom-name"
                className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--faint-fg)]"
              >
                Name on the back
              </label>
              <input
                id="custom-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value.slice(0, 16))}
                placeholder="Optional — up to 16 characters"
                maxLength={16}
                className="mt-3 h-12 w-full rounded-2xl border px-4 text-[15px] uppercase tracking-wide outline-none transition-shadow focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-glow)]"
                style={{ background: 'var(--field-bg)', borderColor: 'var(--field-border)' }}
              />
              <p className="mt-1.5 text-[12.5px] text-[var(--faint-fg)]">
                Printed exactly as typed. {16 - customName.length} characters left.
              </p>
            </section>
          )}

          <section className="mt-7 flex items-center gap-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--faint-fg)]">
              Quantity
            </h2>
            <div className="glass inline-flex items-center gap-1 rounded-full p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="press grid h-9 w-9 place-items-center rounded-full disabled:opacity-35"
                aria-label="Reduce quantity"
              >
                <Icon.Minus size={16} />
              </button>
              <span className="w-8 text-center text-[15px] font-semibold tabular">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                disabled={quantity >= 20}
                className="press grid h-9 w-9 place-items-center rounded-full disabled:opacity-35"
                aria-label="Increase quantity"
              >
                <Icon.Plus size={16} />
              </button>
            </div>
          </section>

          {/* Desktop actions — phones get the sticky bar below instead. */}
          <div className="mt-9 hidden gap-3 lg:flex">
            <Button size="lg" onClick={() => addToBag(true)} disabled={!canAdd}>
              {product.available ? 'Buy now' : 'Orders closed'}
            </Button>
            <Button size="lg" variant="glass" onClick={() => addToBag(false)} disabled={!canAdd}>
              {added ? 'Added ✓' : 'Add to bag'}
            </Button>
          </div>

          <Glass tone="faint" className="mt-8 flex gap-3 p-4">
            <span className="mt-0.5 shrink-0 text-[var(--accent)]">
              <Icon.Wallet size={18} />
            </span>
            <p className="text-[13.5px] leading-relaxed text-[var(--muted-fg)]">
              <span className="font-semibold text-[var(--page-fg)]">How payment works.</span> MASCOM
              has no payment gateway, so you pay a coordinator directly over UPI. At checkout you
              pick who you are paying, scan their QR, and upload the screenshot. That coordinator
              confirms it and your order is locked in.
            </p>
          </Glass>
        </div>
      </div>

      {/* ── Sticky mobile buy bar ──────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(5.2rem+env(safe-area-inset-bottom))] lg:hidden">
        <Glass lifted className="glass-bar flex items-center gap-3 rounded-[1.4rem] p-2.5">
          <div className="min-w-0 pl-1.5">
            <p className="text-[11px] font-medium text-[var(--faint-fg)]">Total</p>
            <p className="text-[17px] font-semibold tabular">{money(product.price * quantity)}</p>
          </div>
          <Button
            className="ml-auto"
            onClick={() => addToBag(false)}
            variant="glass"
            disabled={!canAdd}
          >
            {added ? 'Added ✓' : 'Add'}
          </Button>
          <Button onClick={() => addToBag(true)} disabled={!canAdd}>
            {product.available ? 'Buy now' : 'Closed'}
          </Button>
        </Glass>
      </div>
    </div>
  )
}

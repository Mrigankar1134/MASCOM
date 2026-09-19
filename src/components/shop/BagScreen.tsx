'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { lineKey, useCart } from '@/lib/client/cart'
import { useSession } from '@/lib/client/session'
import { money } from '@/lib/format'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Icon } from '@/components/shell/Icons'
import { swatch } from './ProductCard'

export function BagScreen() {
  const cart = useCart()
  const user = useSession()

  if (!cart.ready) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 pt-8 sm:px-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <h1 className="display text-[clamp(2rem,6vw,2.8rem)]">Your bag</h1>
        <Glass className="mt-6">
          <EmptyState
            icon={<Icon.Bag size={24} />}
            title="Nothing in here yet"
            description="Once a drop is open, everything you pick lands here and stays put until you check out."
            action={
              <Link
                href="/shop"
                className="press inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[14.5px] font-semibold"
                style={{ background: 'var(--accent-solid)', color: 'var(--accent-contrast)' }}
              >
                Browse the drop
                <Icon.ArrowRight size={16} />
              </Link>
            }
          />
        </Glass>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      <header className="mb-5 flex items-baseline justify-between">
        <h1 className="display text-[clamp(2rem,6vw,2.8rem)]">Your bag</h1>
        <button
          onClick={cart.clear}
          className="press text-[13.5px] font-medium text-[var(--muted-fg)] hover:text-[var(--danger)]"
        >
          Clear all
        </button>
      </header>

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {cart.lines.map((line) => {
            const key = lineKey(line)
            return (
              <motion.li
                key={key}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              >
                <Glass className="flex gap-3.5 p-3">
                  <Link
                    href={`/shop/${line.slug}`}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl"
                    style={{ background: 'var(--hairline-soft)' }}
                  >
                    {line.image ? (
                      <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-[var(--faint-fg)]">
                        <Icon.Box size={20} />
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/shop/${line.slug}`}>
                          <h2 className="truncate text-[15px] font-semibold">{line.name}</h2>
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-[var(--muted-fg)]">
                          {line.color && (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  background: swatch(line.color),
                                  boxShadow: 'inset 0 0 0 1px var(--hairline)',
                                }}
                              />
                              {line.color}
                            </span>
                          )}
                          {line.size && <span>Size {line.size}</span>}
                          {line.customName && (
                            <span className="font-medium" style={{ color: 'var(--accent)' }}>
                              “{line.customName}”
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => cart.remove(key)}
                        className="press -mr-1 -mt-1 grid h-8 w-8 place-items-center rounded-full text-[var(--faint-fg)] hover:text-[var(--danger)]"
                        aria-label={`Remove ${line.name}`}
                      >
                        <Icon.X size={16} />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="glass inline-flex items-center gap-0.5 rounded-full p-0.5">
                        <button
                          onClick={() => cart.setQuantity(key, line.quantity - 1)}
                          className="press grid h-8 w-8 place-items-center rounded-full"
                          aria-label="Reduce quantity"
                        >
                          <Icon.Minus size={15} />
                        </button>
                        <span className="w-7 text-center text-[14px] font-semibold tabular">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => cart.setQuantity(key, line.quantity + 1)}
                          className="press grid h-8 w-8 place-items-center rounded-full"
                          aria-label="Increase quantity"
                        >
                          <Icon.Plus size={15} />
                        </button>
                      </div>
                      <p className="text-[15px] font-semibold tabular">
                        {money(line.unitPrice * line.quantity)}
                      </p>
                    </div>
                  </div>
                </Glass>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>

      <Glass tone="strong" className="mt-5 p-5">
        <dl className="space-y-2.5 text-[14.5px]">
          <div className="flex justify-between">
            <dt className="text-[var(--muted-fg)]">
              Subtotal · {cart.count} {cart.count === 1 ? 'item' : 'items'}
            </dt>
            <dd className="font-medium tabular">{money(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted-fg)]">Collection</dt>
            <dd className="font-medium">On campus — free</dd>
          </div>
          <div
            className="flex items-baseline justify-between border-t pt-3 text-[18px] font-semibold"
            style={{ borderColor: 'var(--hairline-soft)' }}
          >
            <dt>Total</dt>
            <dd className="tabular">{money(cart.subtotal)}</dd>
          </div>
        </dl>

        <Link href={user ? '/checkout' : '/signin?next=/checkout'} className="mt-5 block">
          <Button size="lg" block>
            {user ? 'Continue to payment' : 'Sign in to check out'}
            <Icon.ArrowRight size={18} />
          </Button>
        </Link>

        <p className="mt-3 text-center text-[12.5px] text-[var(--faint-fg)]">
          You will pay a coordinator by UPI and upload the screenshot.
        </p>
      </Glass>
    </div>
  )
}

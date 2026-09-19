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
import { NavBar } from '@/components/shell/NavBar'
import { swatch } from './ProductCard'

export function BagScreen() {
  const cart = useCart()
  const user = useSession()

  if (!cart.ready) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 pt-8">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <NavBar title="Your bag" />
        <div className="ios-group mx-4">
          <EmptyState
            icon={<Icon.Bag size={24} />}
            title="Nothing in here yet"
            description="Anything you pick lands here and stays put, even if you close the tab."
            action={
              <Link href="/shop">
                <Button icon={<Icon.ArrowRight size={16} />}>Browse the drop</Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <NavBar
        title="Your bag"
        trailing={
          <button
            onClick={cart.clear}
            className="press t-callout text-[var(--tint)]"
          >
            Clear
          </button>
        }
      />

      <div className="px-4 pt-2">
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
                    style={{ background: 'var(--separator-soft)' }}
                  >
                    {line.image ? (
                      <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-[var(--label-3)]">
                        <Icon.Box size={20} />
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/shop/${line.slug}`}>
                          <h2 className="truncate t-subhead font-semibold">{line.name}</h2>
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 t-caption-1 text-[var(--label-2)]">
                          {line.color && (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  background: swatch(line.color),
                                  boxShadow: 'inset 0 0 0 1px var(--separator)',
                                }}
                              />
                              {line.color}
                            </span>
                          )}
                          {line.size && <span>Size {line.size}</span>}
                          {line.customName && (
                            <span className="font-medium" style={{ color: 'var(--tint)' }}>
                              “{line.customName}”
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => cart.remove(key)}
                        className="press -mr-1 -mt-1 grid h-8 w-8 place-items-center rounded-full text-[var(--label-3)] hover:text-[var(--danger)]"
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
                        <span className="w-7 text-center t-subhead font-semibold tabular">
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
                      <p className="t-subhead font-semibold tabular">
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
        <dl className="space-y-2.5 t-subhead">
          <div className="flex justify-between">
            <dt className="text-[var(--label-2)]">
              Subtotal · {cart.count} {cart.count === 1 ? 'item' : 'items'}
            </dt>
            <dd className="font-medium tabular">{money(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--label-2)]">Collection</dt>
            <dd className="font-medium">Free, on campus</dd>
          </div>
          <div
            className="flex items-baseline justify-between border-t pt-3 t-title-3 font-semibold"
            style={{ borderColor: 'var(--separator-soft)' }}
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

        <p className="t-caption-1 mt-3 text-center text-[var(--label-3)]">
          Next up: pay a coordinator on UPI and send the screenshot.
        </p>
      </Glass>
      </div>
    </div>
  )
}

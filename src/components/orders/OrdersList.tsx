'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { money, relativeTime } from '@/lib/format'
import { Glass } from '@/components/ui/Glass'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Feedback'
import { Segmented } from '@/components/ui/Segmented'
import { Icon } from '@/components/shell/Icons'

export type OrderSummary = {
  _id: string
  orderId: string
  createdAt: string
  status: string
  paymentStatus: string
  finalAmountPaid: number
  paidTo?: string
  items: {
    productSnapshot?: { name?: string; image?: string }
    variant?: { color?: string; size?: string; selectedImage?: string }
    quantity: number
  }[]
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Awaiting' },
  { value: 'active', label: 'Confirmed' },
  { value: 'done', label: 'Delivered' },
]

export function OrdersList({ orders }: { orders: OrderSummary[] }) {
  const [filter, setFilter] = useState('all')

  const visible = orders.filter((o) => {
    if (filter === 'pending') return o.paymentStatus === 'Pending'
    if (filter === 'active') return o.paymentStatus === 'Paid' && o.status !== 'Delivered'
    if (filter === 'done') return o.status === 'Delivered'
    return true
  })

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      <header className="mb-5">
        <h1 className="display text-[clamp(2rem,6vw,2.8rem)]">Your orders</h1>
        <p className="mt-2 text-[14.5px] text-[var(--muted-fg)]">
          Every drop you have ordered, and exactly where it has got to.
        </p>
      </header>

      {orders.length > 0 && (
        <Segmented className="mb-4" options={FILTERS} value={filter} onChange={setFilter} />
      )}

      {visible.length === 0 ? (
        <Glass>
          <EmptyState
            icon={<Icon.Receipt size={24} />}
            title={orders.length === 0 ? 'No orders yet' : 'Nothing in this view'}
            description={
              orders.length === 0
                ? 'When you order from a drop it shows up here, with live status right through to collection.'
                : 'Try another filter to see the rest of your orders.'
            }
            action={
              orders.length === 0 ? (
                <Link
                  href="/shop"
                  className="press inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[14.5px] font-semibold"
                  style={{ background: 'var(--accent-solid)', color: 'var(--accent-contrast)' }}
                >
                  Browse the drop
                  <Icon.ArrowRight size={16} />
                </Link>
              ) : undefined
            }
          />
        </Glass>
      ) : (
        <ul className="space-y-3">
          {visible.map((order, i) => {
            const preview = order.items
              .map((it) => it.variant?.selectedImage ?? it.productSnapshot?.image)
              .filter(Boolean)
              .slice(0, 3) as string[]
            const units = order.items.reduce((n, it) => n + it.quantity, 0)

            return (
              <motion.li
                key={order._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04 }}
              >
                <Link href={`/orders/${order.orderId}`}>
                  <Glass interactive className="flex items-center gap-4 p-4">
                    <div className="flex -space-x-3">
                      {preview.length > 0 ? (
                        preview.map((src, n) => (
                          <span
                            key={`${src}-${n}`}
                            className="relative h-12 w-11 overflow-hidden rounded-lg"
                            style={{
                              background: 'var(--hairline-soft)',
                              boxShadow: '0 0 0 2px var(--page-bg)',
                              zIndex: preview.length - n,
                            }}
                          >
                            <Image src={src} alt="" fill sizes="44px" className="object-cover" />
                          </span>
                        ))
                      ) : (
                        <span
                          className="grid h-12 w-11 place-items-center rounded-lg text-[var(--faint-fg)]"
                          style={{ background: 'var(--hairline-soft)' }}
                        >
                          <Icon.Box size={18} />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[13px] font-semibold">{order.orderId}</p>
                        <span className="text-[12px] text-[var(--faint-fg)]">
                          {relativeTime(order.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[13.5px] text-[var(--muted-fg)]">
                        {units} {units === 1 ? 'item' : 'items'}
                        {order.paidTo ? ` · paid to ${order.paidTo}` : ''}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={order.status} />
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[15px] font-semibold tabular">
                        {money(order.finalAmountPaid)}
                      </p>
                      <Icon.Chevron size={16} className="ml-auto mt-1 text-[var(--faint-fg)]" />
                    </div>
                  </Glass>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

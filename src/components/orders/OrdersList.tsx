'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { money } from '@/lib/format'
import { TimeAgo } from '@/components/ui/Time'
import { Glass } from '@/components/ui/Glass'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Feedback'
import { Segmented } from '@/components/ui/Segmented'
import { Icon } from '@/components/shell/Icons'
import { NavBar } from '@/components/shell/NavBar'
import { Button } from '@/components/ui/Button'

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
    <div className="mx-auto max-w-3xl">
      <NavBar
        title="Your orders"
        subtitle="Every drop you have ordered, and exactly where it has got to."
      >
        {orders.length > 0 && (
          <Segmented options={FILTERS} value={filter} onChange={setFilter} className="max-w-md" />
        )}
      </NavBar>

      <div className="px-4 pt-3">
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
                <Link href="/shop">
                  <Button icon={<Icon.ArrowRight size={16} />}>Browse the drop</Button>
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
                              background: 'var(--separator-soft)',
                              boxShadow: '0 0 0 2px var(--page-bg)',
                              zIndex: preview.length - n,
                            }}
                          >
                            <Image src={src} alt="" fill sizes="44px" className="object-cover" />
                          </span>
                        ))
                      ) : (
                        <span
                          className="grid h-12 w-11 place-items-center rounded-lg text-[var(--label-3)]"
                          style={{ background: 'var(--separator-soft)' }}
                        >
                          <Icon.Box size={18} />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono t-footnote font-semibold">{order.orderId}</p>
                        <TimeAgo
                          value={order.createdAt}
                          className="t-caption-1 text-[var(--label-3)]"
                        />
                      </div>
                      <p className="mt-1 truncate t-footnote text-[var(--label-2)]">
                        {units} {units === 1 ? 'item' : 'items'}
                        {order.paidTo ? ` · paid to ${order.paidTo}` : ''}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={order.status} />
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="t-subhead font-semibold tabular">
                        {money(order.finalAmountPaid)}
                      </p>
                      <Icon.Chevron size={16} className="ml-auto mt-1 text-[var(--label-3)]" />
                    </div>
                  </Glass>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      )}
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Glass } from '@/components/ui/Glass'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState } from '@/components/ui/Feedback'
import { Icon } from '@/components/shell/Icons'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/client/api'
import { money, formatDateTime } from '@/lib/format'
import { ITEM_STATUSES, ORDER_STATUSES } from '@/lib/constants'

export type AdminOrder = {
  _id: string
  orderId: string
  createdAt: string
  status: string
  paymentStatus: string
  finalAmountPaid: number
  paidTo?: string
  batchNote?: string
  userId?: {
    name?: string
    email?: string
    phone?: string
    rollNo?: string
    section?: string
    hostel?: string
    block?: string
    roomNo?: string
  }
  items: {
    _id: string
    quantity: number
    unitPrice: number
    customName?: string
    itemStatus: string
    batchNumber?: string
    productSnapshot?: { name?: string }
    variant?: { color?: string; size?: string }
  }[]
}

export function OrdersTable({
  orders,
  canOverride,
}: {
  orders: AdminOrder[]
  canOverride: boolean
}) {
  const router = useRouter()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      if (filter === 'unpaid' && o.paymentStatus !== 'Pending') return false
      if (filter === 'production' && !['Confirmed', 'Processing'].includes(o.status)) return false
      if (filter === 'delivered' && o.status !== 'Delivered') return false
      if (!q) return true
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.userId?.name?.toLowerCase().includes(q) ||
        o.userId?.rollNo?.toLowerCase().includes(q)
      )
    })
  }, [orders, filter, query])

  async function setOrderStatus(order: AdminOrder, status: string) {
    setBusy(order._id)
    try {
      await api(`/api/admin/orders/${order._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminOverride: canOverride }),
      })
      toast.success(`${order.orderId} → ${status}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update that order.')
    } finally {
      setBusy(null)
    }
  }

  async function setItemStatus(order: AdminOrder, itemId: string, itemStatus: string) {
    setBusy(`${order._id}:${itemId}`)
    try {
      await api(`/api/admin/orders/${order._id}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ itemStatus, adminOverride: canOverride }),
      })
      toast.success('Item updated.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update that item.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="mb-5">
        <h1 className="display text-[clamp(1.8rem,4vw,2.5rem)]">Orders</h1>
        <p className="mt-2 text-[14.5px] text-[var(--muted-fg)]">
          Everything placed, with per-item status for the fulfilment run.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <Segmented
          options={[
            { value: 'all', label: 'All', count: orders.length },
            { value: 'unpaid', label: 'Unverified' },
            { value: 'production', label: 'In production' },
            { value: 'delivered', label: 'Delivered' },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="glass flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-full px-3.5 sm:max-w-xs">
          <Icon.Search size={16} className="shrink-0 text-[var(--faint-fg)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order ID, name or roll no"
            className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[var(--faint-fg)]"
          />
        </div>
        <a
          href="/api/admin/export"
          className="glass press ml-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold"
        >
          <Icon.Download size={16} />
          <span className="hidden sm:inline">Export CSV</span>
        </a>
      </div>

      {visible.length === 0 ? (
        <Glass>
          <EmptyState icon={<Icon.Receipt size={24} />} title="No orders match" />
        </Glass>
      ) : (
        <Glass className="overflow-hidden">
          {/* Column headings only make sense once there is room for them */}
          <div
            className="hidden border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--faint-fg)] lg:grid lg:grid-cols-[130px_minmax(0,1fr)_120px_150px_110px_40px] lg:gap-4"
            style={{ borderColor: 'var(--hairline-soft)' }}
          >
            <span>Order</span>
            <span>Student</span>
            <span>Payment</span>
            <span>Status</span>
            <span className="text-right">Amount</span>
            <span />
          </div>

          <ul className="divide-y" style={{ borderColor: 'var(--hairline-soft)' }}>
            {visible.map((order) => {
              const open = expanded === order._id
              return (
                <li key={order._id}>
                  <button
                    onClick={() => setExpanded(open ? null : order._id)}
                    className="w-full px-5 py-3.5 text-left transition-colors hover:bg-[var(--hairline-soft)] lg:grid lg:grid-cols-[130px_minmax(0,1fr)_120px_150px_110px_40px] lg:items-center lg:gap-4"
                    aria-expanded={open}
                  >
                    <div className="flex items-center justify-between lg:block">
                      <span className="font-mono text-[13px] font-semibold">{order.orderId}</span>
                      <span className="text-[11.5px] text-[var(--faint-fg)] lg:block">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>

                    <div className="mt-1.5 min-w-0 lg:mt-0">
                      <p className="truncate text-[13.5px] font-medium">
                        {order.userId?.name ?? 'Unknown'}
                      </p>
                      <p className="truncate text-[12px] text-[var(--muted-fg)]">
                        {[order.userId?.rollNo, order.userId?.section, order.userId?.hostel]
                          .filter(Boolean)
                          .join(' · ') || order.userId?.email}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 lg:mt-0 lg:block">
                      <Badge
                        tone={
                          order.paymentStatus === 'Paid'
                            ? 'ok'
                            : order.paymentStatus === 'Failed'
                              ? 'danger'
                              : 'warn'
                        }
                        dot
                      >
                        {order.paymentStatus}
                      </Badge>
                      {order.paidTo && (
                        <span className="text-[11.5px] text-[var(--faint-fg)] lg:mt-1 lg:block">
                          → {order.paidTo}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 lg:mt-0">
                      <StatusBadge status={order.status} />
                    </div>

                    <p className="mt-2 text-[14px] font-semibold tabular lg:mt-0 lg:text-right">
                      {money(order.finalAmountPaid)}
                    </p>

                    <span className="hidden justify-self-end text-[var(--faint-fg)] lg:block">
                      <Icon.Chevron
                        size={16}
                        className={open ? 'rotate-90 transition-transform' : 'transition-transform'}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                      >
                        <div
                          className="space-y-4 px-5 pb-5 pt-1"
                          style={{ background: 'var(--hairline-soft)' }}
                        >
                          <div>
                            <p className="eyebrow mb-2">Items</p>
                            <ul className="space-y-2">
                              {order.items.map((item) => (
                                <li
                                  key={item._id}
                                  className="glass flex flex-wrap items-center gap-3 rounded-xl p-3"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13.5px] font-medium">
                                      {item.productSnapshot?.name ?? 'Item'}
                                      <span className="ml-2 font-normal text-[var(--muted-fg)]">
                                        {[item.variant?.color, item.variant?.size]
                                          .filter(Boolean)
                                          .join(' · ')}
                                      </span>
                                    </p>
                                    <p className="mt-0.5 text-[12px] text-[var(--muted-fg)]">
                                      ×{item.quantity} · {money(item.unitPrice * item.quantity)}
                                      {item.batchNumber && item.batchNumber !== 'WAITING'
                                        ? ` · batch ${item.batchNumber}`
                                        : ''}
                                      {item.customName ? ` · “${item.customName}”` : ''}
                                    </p>
                                  </div>
                                  <select
                                    value={item.itemStatus}
                                    disabled={busy === `${order._id}:${item._id}`}
                                    onChange={(e) => setItemStatus(order, item._id, e.target.value)}
                                    className="h-9 rounded-lg border px-2.5 text-[12.5px] font-medium outline-none"
                                    style={{
                                      background: 'var(--field-bg)',
                                      borderColor: 'var(--field-border)',
                                    }}
                                    aria-label={`Status for ${item.productSnapshot?.name}`}
                                  >
                                    {ITEM_STATUSES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <label className="text-[12.5px] font-medium text-[var(--muted-fg)]">
                              Whole order
                            </label>
                            <select
                              value={order.status}
                              disabled={busy === order._id}
                              onChange={(e) => setOrderStatus(order, e.target.value)}
                              className="h-9 rounded-lg border px-2.5 text-[12.5px] font-medium outline-none"
                              style={{
                                background: 'var(--field-bg)',
                                borderColor: 'var(--field-border)',
                              }}
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            {order.paymentStatus !== 'Paid' && (
                              <span className="text-[12px] text-[var(--faint-fg)]">
                                {canOverride
                                  ? 'Payment is unverified — delivering will use your admin override.'
                                  : 'Payment must be verified before this can be delivered.'}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </Glass>
      )}
    </div>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { money } from '@/lib/format'
import { DateTime } from '@/components/ui/Time'
import { Glass } from '@/components/ui/Glass'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Sheet } from '@/components/ui/Sheet'
import { Icon } from '@/components/shell/Icons'
import { swatch } from '@/components/shop/ProductCard'

export type OrderRecord = {
  _id: string
  orderId: string
  createdAt: string
  status: string
  paymentStatus: string
  totalAmount: number
  discountAmount: number
  finalAmountPaid: number
  paidTo?: string
  screenshotUrl?: string
  paymentReference?: string
  verificationDate?: string
  verificationNotes?: string
  couponCodeUsed?: string
  paymentRecipientId?: { _id: string; name: string; upiId: string; phoneNumber: string } | string
  items: {
    _id: string
    quantity: number
    unitPrice: number
    customName?: string
    batchNumber?: string
    itemStatus: string
    productSnapshot?: { name?: string; image?: string }
    variant?: { color?: string; size?: string; selectedImage?: string }
  }[]
}

/** The four stages a student actually cares about, in order. */
const JOURNEY = [
  { key: 'placed', label: 'Order placed', note: 'We have your order and your proof of payment.' },
  { key: 'verified', label: 'Payment verified', note: 'The coordinator confirmed your UPI payment.' },
  { key: 'production', label: 'In production', note: 'Your size and colour are with the vendor.' },
  { key: 'collected', label: 'Ready to collect', note: 'Pick it up at the collection counter.' },
]

function stageIndex(order: OrderRecord): number {
  if (order.status === 'Delivered') return 3
  if (order.status === 'Processing' || order.status === 'Partially Fulfilled') return 2
  if (order.paymentStatus === 'Paid') return 1
  return 0
}

export function OrderDetail({
  order,
  justPlaced,
}: {
  order: OrderRecord
  justPlaced?: boolean
}) {
  const [celebrate, setCelebrate] = useState(!!justPlaced)
  const [proofOpen, setProofOpen] = useState(false)

  useEffect(() => {
    if (!celebrate) return
    const t = setTimeout(() => setCelebrate(false), 4200)
    return () => clearTimeout(t)
  }, [celebrate])

  const recipient =
    typeof order.paymentRecipientId === 'object' ? order.paymentRecipientId : null
  const stage = stageIndex(order)
  const failed = order.paymentStatus === 'Failed' || order.status === 'Failed'

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
      <Link
        href="/orders"
        className="press mb-4 inline-flex items-center gap-1.5 t-footnote font-medium text-[var(--label-2)]"
      >
        <Icon.ChevronLeft size={16} />
        All orders
      </Link>

      {celebrate && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="mb-4"
        >
          <Glass tone="strong" className="flex items-center gap-3.5 p-4">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}
            >
              <Icon.CheckCircle size={22} />
            </span>
            <div>
              <p className="t-subhead font-semibold">Order placed</p>
              <p className="mt-0.5 t-footnote text-[var(--label-2)]">
                {order.paidTo ?? 'The coordinator'} will verify your payment shortly. You will see
                it update right here.
              </p>
            </div>
          </Glass>
        </motion.div>
      )}

      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="display mt-1.5 font-mono text-[clamp(1.8rem,5.5vw,2.4rem)]">
            {order.orderId}
          </h1>
          <p className="mt-1.5 t-footnote text-[var(--label-3)]">
            Placed <DateTime value={order.createdAt} />
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={order.status} />
          <Badge tone={order.paymentStatus === 'Paid' ? 'ok' : order.paymentStatus === 'Failed' ? 'danger' : 'warn'} dot>
            Payment {order.paymentStatus}
          </Badge>
        </div>
      </header>

      {/* ── Journey ──────────────────────────────────────────────────────── */}
      <Glass tone="strong" className="p-5">
        {failed ? (
          <div className="flex gap-3.5">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
            >
              <Icon.Alert size={20} />
            </span>
            <div>
              <p className="t-subhead font-semibold">Payment could not be verified</p>
              <p className="mt-1 t-footnote leading-relaxed text-[var(--label-2)]">
                {order.verificationNotes ??
                  `${order.paidTo ?? 'The coordinator'} could not match this payment in their UPI history. Reach out to them directly with your reference number.`}
              </p>
            </div>
          </div>
        ) : (
          <ol className="relative space-y-5">
            {JOURNEY.map((phase, i) => {
              const done = i <= stage
              const current = i === stage
              return (
                <li key={phase.key} className="relative flex gap-3.5">
                  {i < JOURNEY.length - 1 && (
                    <span
                      className="absolute left-[13px] top-7 h-[calc(100%+0.5rem)] w-0.5 rounded"
                      style={{ background: i < stage ? 'var(--tint)' : 'var(--separator)' }}
                      aria-hidden
                    />
                  )}
                  <span
                    className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full"
                    style={{
                      background: done ? 'var(--tint-solid)' : 'var(--separator-soft)',
                      color: done ? 'var(--tint-contrast)' : 'var(--label-3)',
                    }}
                  >
                    {done ? <Icon.Check size={14} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                  </span>
                  <div className="pb-0.5">
                    <p
                      className={`t-subhead font-semibold ${current ? '' : done ? '' : 'text-[var(--label-3)]'}`}
                    >
                      {phase.label}
                      {current && (
                        <span
                          className="ml-2 rounded-full px-2 py-0.5 t-caption-2 font-bold uppercase tracking-wide"
                          style={{ background: 'var(--tint-glow)', color: 'var(--tint)' }}
                        >
                          Now
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 t-footnote leading-relaxed text-[var(--label-2)]">
                      {phase.note}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </Glass>

      {/* ── Items ────────────────────────────────────────────────────────── */}
      <h2 className="mb-3 mt-6 t-footnote font-semibold uppercase tracking-[0.12em] text-[var(--label-3)]">
        Items
      </h2>
      <ul className="space-y-2.5">
        {order.items.map((item) => {
          const image = item.variant?.selectedImage ?? item.productSnapshot?.image
          return (
            <li key={item._id}>
              <Glass className="flex items-center gap-3.5 p-3">
                <span
                  className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg"
                  style={{ background: 'var(--separator-soft)' }}
                >
                  {image ? (
                    <Image src={image} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-[var(--label-3)]">
                      <Icon.Box size={18} />
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate t-subhead font-semibold">
                    {item.productSnapshot?.name ?? 'Item'}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 t-caption-1 text-[var(--label-2)]">
                    {item.variant?.color && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: swatch(item.variant.color),
                            boxShadow: 'inset 0 0 0 1px var(--separator)',
                          }}
                        />
                        {item.variant.color}
                      </span>
                    )}
                    {item.variant?.size && <span>Size {item.variant.size}</span>}
                    <span>Qty {item.quantity}</span>
                    {item.customName && (
                      <span className="font-medium" style={{ color: 'var(--tint)' }}>
                        “{item.customName}”
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatusBadge status={item.itemStatus} />
                    {item.batchNumber && item.batchNumber !== 'WAITING' && (
                      <Badge tone="neutral">Batch {item.batchNumber}</Badge>
                    )}
                  </div>
                </div>

                <p className="shrink-0 t-subhead font-semibold tabular">
                  {money(item.unitPrice * item.quantity)}
                </p>
              </Glass>
            </li>
          )
        })}
      </ul>

      {/* ── Payment ──────────────────────────────────────────────────────── */}
      <h2 className="mb-3 mt-6 t-footnote font-semibold uppercase tracking-[0.12em] text-[var(--label-3)]">
        Payment
      </h2>
      <Glass className="p-5">
        <dl className="space-y-2.5 t-subhead">
          <Row label="Subtotal" value={money(order.totalAmount)} />
          {order.discountAmount > 0 && (
            <Row
              label={`Discount${order.couponCodeUsed ? ` · ${order.couponCodeUsed}` : ''}`}
              value={`− ${money(order.discountAmount)}`}
            />
          )}
          <div
            className="flex items-baseline justify-between border-t pt-3 t-body font-semibold"
            style={{ borderColor: 'var(--separator-soft)' }}
          >
            <dt>Paid</dt>
            <dd className="tabular">{money(order.finalAmountPaid)}</dd>
          </div>
        </dl>

        {(recipient || order.paidTo) && (
          <div
            className="mt-4 space-y-2.5 border-t pt-4 t-footnote"
            style={{ borderColor: 'var(--separator-soft)' }}
          >
            <Row label="Paid to" value={recipient?.name ?? order.paidTo ?? '—'} />
            {recipient?.upiId && <Row label="UPI ID" value={recipient.upiId} mono />}
            {order.paymentReference && (
              <Row label="Reference" value={order.paymentReference} mono />
            )}
            {order.verificationDate && (
              <Row label="Verified" node={<DateTime value={order.verificationDate} />} />
            )}
          </div>
        )}

        {order.screenshotUrl && (
          <button
            onClick={() => setProofOpen(true)}
            className="press glass mt-4 flex w-full items-center gap-3 rounded-xl p-3 text-left"
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
              style={{ background: 'var(--separator-soft)' }}
            >
              <Icon.Camera size={17} />
            </span>
            <span className="flex-1 t-footnote font-medium">View your payment screenshot</span>
            <Icon.Chevron size={16} className="text-[var(--label-3)]" />
          </button>
        )}
      </Glass>

      <Sheet open={proofOpen} onClose={() => setProofOpen(false)} title="Payment screenshot" size="lg">
        {order.screenshotUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={order.screenshotUrl}
            alt="Your payment screenshot"
            className="w-full rounded-2xl"
          />
        )}
      </Sheet>
    </div>
  )
}

function Row({
  label,
  value,
  node,
  mono,
}: {
  label: string
  value?: string
  node?: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-[var(--label-2)]">{label}</dt>
      <dd className={`min-w-0 truncate text-right font-medium ${mono ? 'font-mono t-footnote' : 'tabular'}`}>
        {node ?? value}
      </dd>
    </div>
  )
}

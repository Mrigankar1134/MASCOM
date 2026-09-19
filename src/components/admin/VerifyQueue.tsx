'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState } from '@/components/ui/Feedback'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/shell/Icons'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/client/api'
import { money } from '@/lib/format'
import { DateTime, TimeAgo } from '@/components/ui/Time'
import { cn } from '@/components/ui/cn'
import { ConsoleHeader } from './ConsoleHeader'

export type QueueOrder = {
  _id: string
  orderId: string
  createdAt: string
  status: string
  paymentStatus: string
  finalAmountPaid: number
  totalAmount: number
  discountAmount: number
  paidTo?: string
  screenshotUrl?: string
  paymentReference?: string
  verificationDate?: string
  verificationNotes?: string
  riskScore?: number
  fraudFlags?: string[]
  userId?: {
    _id: string
    name: string
    email: string
    phone?: string
    rollNo?: string
    section?: string
    hostel?: string
    block?: string
    roomNo?: string
  }
  paymentRecipientId?: { _id: string; name: string; upiId: string; userId?: string }
  items: {
    _id: string
    quantity: number
    unitPrice: number
    customName?: string
    itemStatus: string
    productSnapshot?: { name?: string }
    variant?: { color?: string; size?: string }
  }[]
}

type Viewer = {
  id: string
  isAdmin: boolean
  isStaff: boolean
  recipientId: string | null
  recipientName: string | null
}

export function VerifyQueue({
  orders,
  recipients,
  viewer,
}: {
  orders: QueueOrder[]
  recipients: { _id: string; name: string }[]
  viewer: Viewer
}) {
  const router = useRouter()
  const toast = useToast()

  const [status, setStatus] = useState('Pending')
  const [recipientFilter, setRecipientFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [proofOpen, setProofOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      if (status !== 'all' && o.paymentStatus !== status) return false
      if (recipientFilter !== 'all' && o.paymentRecipientId?._id !== recipientFilter) return false
      if (!q) return true
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.userId?.name?.toLowerCase().includes(q) ||
        o.userId?.rollNo?.toLowerCase().includes(q) ||
        o.paymentReference?.toLowerCase().includes(q)
      )
    })
  }, [orders, status, recipientFilter, query])

  // Keep a selection alive as filters change so the detail pane never blanks.
  const selected = filtered.find((o) => o._id === selectedId) ?? filtered[0] ?? null

  useEffect(() => {
    if (selected && selected._id !== selectedId) setSelectedId(selected._id)
  }, [selected, selectedId])

  const counts = useMemo(
    () => ({
      Pending: orders.filter((o) => o.paymentStatus === 'Pending').length,
      Paid: orders.filter((o) => o.paymentStatus === 'Paid').length,
      Failed: orders.filter((o) => o.paymentStatus === 'Failed').length,
    }),
    [orders],
  )

  /** Whether this viewer is allowed to decide on this particular order. */
  function canDecide(order: QueueOrder): boolean {
    if (viewer.isAdmin) return true
    return !!viewer.recipientId && order.paymentRecipientId?._id === viewer.recipientId
  }

  async function decide(order: QueueOrder, paymentStatus: 'Paid' | 'Failed', notes?: string) {
    setBusyId(order._id)
    try {
      await api(`/api/admin/orders/${order._id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus, notes }),
      })
      toast.success(
        paymentStatus === 'Paid'
          ? `${order.orderId} confirmed.`
          : `${order.orderId} marked unverified.`,
      )
      router.refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update that order.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <ConsoleHeader
        title="Verify payments"
        subtitle={
          viewer.isStaff
            ? 'Every order students said they paid. Only the coordinator the money went to can confirm it — admins can override.'
            : `Orders students said they paid to you${viewer.recipientName ? ` as ${viewer.recipientName}` : ''}. Check each screenshot against your own UPI history before confirming.`
        }
      />

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <Segmented
          options={[
            { value: 'Pending', label: 'Awaiting', count: counts.Pending },
            { value: 'Paid', label: 'Confirmed', count: counts.Paid },
            { value: 'Failed', label: 'Rejected', count: counts.Failed },
            { value: 'all', label: 'All', count: orders.length },
          ]}
          value={status}
          onChange={setStatus}
        />

        <div className="glass flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-full px-3.5 sm:max-w-xs">
          <Icon.Search size={16} className="shrink-0 text-[var(--label-3)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order ID, name, roll no, UTR"
            className="min-w-0 flex-1 bg-transparent t-footnote outline-none placeholder:text-[var(--label-3)]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="press shrink-0 text-[var(--label-3)]">
              <Icon.X size={15} />
            </button>
          )}
        </div>

        {viewer.isStaff && recipients.length > 0 && (
          <select
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value)}
            className="glass h-10 rounded-full px-3.5 t-footnote font-medium outline-none"
            aria-label="Filter by recipient"
          >
            <option value="all">All recipients</option>
            {recipients.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        )}

        <a
          href={`/api/admin/export?status=${status}`}
          className="glass press ml-auto inline-flex h-10 items-center gap-2 rounded-full px-4 t-footnote font-semibold"
        >
          <Icon.Download size={16} />
          <span className="hidden sm:inline">Export CSV</span>
        </a>
      </div>

      {filtered.length === 0 ? (
        <Glass>
          <EmptyState
            icon={<Icon.CheckCircle size={24} />}
            title={status === 'Pending' ? 'Nothing waiting on you' : 'Nothing here'}
            description={
              status === 'Pending'
                ? 'Every payment sent your way has been checked off. New orders show up here the moment they are placed.'
                : 'Try another filter or clear the search.'
            }
          />
        </Glass>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
          {/* ── Queue list ─────────────────────────────────────────────── */}
          <ul className="scroll-slim space-y-2 xl:max-h-[calc(100dvh-14rem)] xl:overflow-y-auto xl:pr-1">
            {filtered.map((order) => {
              const active = order._id === selected?._id
              return (
                <li key={order._id}>
                  <button
                    onClick={() => setSelectedId(order._id)}
                    className={cn(
                      'press glass glass-lens w-full rounded-2xl p-3.5 text-left transition-shadow',
                      active && 'glass-lifted',
                    )}
                    style={
                      active
                        ? { boxShadow: '0 0 0 2px var(--tint), var(--glass-shadow-lifted)' }
                        : undefined
                    }
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={order.userId?.name} size={38} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="truncate t-subhead font-semibold">
                            {order.userId?.name ?? 'Unknown student'}
                          </p>
                          <TimeAgo
                            value={order.createdAt}
                            className="shrink-0 text-[11px] text-[var(--label-3)]"
                          />
                        </div>
                        <p className="mt-0.5 truncate font-mono t-caption-1 text-[var(--label-2)]">
                          {order.orderId}
                          {order.userId?.rollNo ? ` · ${order.userId.rollNo}` : ''}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
                          {viewer.isStaff && order.paidTo && (
                            <Badge tone="neutral">→ {order.paidTo}</Badge>
                          )}
                          {!!order.riskScore && order.riskScore >= 40 && (
                            <Badge tone="danger">Review</Badge>
                          )}
                        </div>
                      </div>
                      <p className="shrink-0 t-subhead font-semibold tabular">
                        {money(order.finalAmountPaid)}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* ── Detail ─────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                className="min-w-0"
              >
                <VerifyDetail
                  order={selected}
                  viewer={viewer}
                  canDecide={canDecide(selected)}
                  busy={busyId === selected._id}
                  onDecide={decide}
                  onOpenProof={() => setProofOpen(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <Sheet
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        title={`Screenshot · ${selected?.orderId ?? ''}`}
        size="lg"
      >
        {selected?.screenshotUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.screenshotUrl} alt="Payment screenshot" className="w-full rounded-2xl" />
        )}
      </Sheet>
    </div>
  )
}

function VerifyDetail({
  order,
  viewer,
  canDecide,
  busy,
  onDecide,
  onOpenProof,
}: {
  order: QueueOrder
  viewer: Viewer
  canDecide: boolean
  busy: boolean
  onDecide: (order: QueueOrder, status: 'Paid' | 'Failed', notes?: string) => void
  onOpenProof: () => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const student = order.userId
  const pending = order.paymentStatus === 'Pending'

  return (
    <Glass tone="strong" className="overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        {/* Facts */}
        <div className="min-w-0 p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Order</p>
              <h2 className="mt-1 font-mono t-title-2 font-semibold">{order.orderId}</h2>
              <p className="mt-1 t-caption-1 text-[var(--label-3)]">
                Placed <DateTime value={order.createdAt} />
              </p>
            </div>
            <div className="text-right">
              <p className="display text-[30px] tabular">{money(order.finalAmountPaid)}</p>
              <div className="mt-1.5 flex justify-end gap-1.5">
                <StatusBadge status={order.status} />
              </div>
            </div>
          </div>

          {!!order.fraudFlags?.length && (
            <div
              className="mt-4 flex gap-2.5 rounded-xl p-3"
              style={{ background: 'var(--warn-bg)' }}
            >
              <span className="mt-0.5 shrink-0" style={{ color: 'var(--warn)' }}>
                <Icon.Alert size={16} />
              </span>
              <p className="t-caption-1 leading-relaxed" style={{ color: 'var(--warn)' }}>
                Worth a closer look: {order.fraudFlags.join(', ').replace(/_/g, ' ')}.
              </p>
            </div>
          )}

          <section className="mt-5">
            <h3 className="eyebrow mb-2.5">Student</h3>
            <div className="glass flex items-center gap-3 rounded-xl p-3">
              <Avatar name={student?.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate t-subhead font-semibold">{student?.name ?? 'Unknown'}</p>
                <p className="truncate t-caption-1 text-[var(--label-2)]">{student?.email}</p>
              </div>
              {student?.phone && (
                <a
                  href={`tel:${student.phone}`}
                  className="press shrink-0 rounded-lg px-3 py-1.5 t-caption-1 font-semibold"
                  style={{ background: 'var(--separator-soft)' }}
                >
                  Call
                </a>
              )}
            </div>
            <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 t-footnote sm:grid-cols-3">
              <Fact label="Roll no" value={student?.rollNo} />
              <Fact label="Section" value={student?.section} />
              <Fact
                label="Hostel"
                value={[student?.hostel, student?.block, student?.roomNo].filter(Boolean).join(' ')}
              />
            </dl>
          </section>

          <section className="mt-5">
            <h3 className="eyebrow mb-2.5">Payment</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 t-footnote">
              <Fact label="Paid to" value={order.paidTo} />
              <Fact label="UPI ID" value={order.paymentRecipientId?.upiId} mono />
              <Fact label="Reference / UTR" value={order.paymentReference} mono />
              <Fact label="Subtotal" value={money(order.totalAmount)} />
              {order.discountAmount > 0 && (
                <Fact label="Discount" value={`− ${money(order.discountAmount)}`} />
              )}
              {order.verificationDate && (
                <Fact label="Decided" node={<DateTime value={order.verificationDate} />} />
              )}
            </dl>
            {order.verificationNotes && (
              <p className="mt-2.5 t-caption-1 italic text-[var(--label-2)]">
                “{order.verificationNotes}”
              </p>
            )}
          </section>

          <section className="mt-5">
            <h3 className="eyebrow mb-2.5">Items</h3>
            <ul className="space-y-1.5">
              {order.items.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 t-footnote"
                  style={{ background: 'var(--separator-soft)' }}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {item.productSnapshot?.name ?? 'Item'}
                    <span className="ml-2 font-normal text-[var(--label-2)]">
                      {[item.variant?.color, item.variant?.size].filter(Boolean).join(' · ')}
                    </span>
                    {item.customName && (
                      <span className="ml-2 font-semibold" style={{ color: 'var(--tint)' }}>
                        “{item.customName}”
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 tabular text-[var(--label-2)]">×{item.quantity}</span>
                  <span className="shrink-0 font-semibold tabular">
                    {money(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Proof + decision */}
        <div
          className="border-t p-5 lg:border-l lg:border-t-0 lg:p-6"
          style={{ borderColor: 'var(--separator-soft)' }}
        >
          <h3 className="eyebrow mb-2.5">Proof of payment</h3>
          {order.screenshotUrl ? (
            <button
              onClick={onOpenProof}
              className="press glass block w-full overflow-hidden rounded-2xl p-1.5"
              aria-label="Open the screenshot full size"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.screenshotUrl}
                alt="Payment screenshot"
                className="max-h-80 w-full rounded-xl bg-black/5 object-contain"
              />
              <span className="block py-2 text-center t-caption-1 font-semibold text-[var(--label-2)]">
                Tap to enlarge
              </span>
            </button>
          ) : (
            <div
              className="rounded-2xl p-6 text-center t-footnote text-[var(--label-3)]"
              style={{ background: 'var(--separator-soft)' }}
            >
              No screenshot was attached.
            </div>
          )}

          <div className="mt-5">
            {!canDecide ? (
              <div
                className="rounded-xl p-3.5 t-caption-1 leading-relaxed"
                style={{ background: 'var(--info-bg)', color: 'var(--info)' }}
              >
                This payment went to {order.paidTo ?? 'another coordinator'}, so only they can
                confirm it.
                {viewer.isStaff && !viewer.isAdmin && ' An admin can override.'}
              </div>
            ) : rejectOpen ? (
              <div className="space-y-2.5">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 300))}
                  placeholder="What was wrong? The student sees this."
                  className="h-24 w-full rounded-xl border p-3 t-footnote outline-none focus:border-[var(--danger)]"
                  style={{ background: 'var(--field-bg)', borderColor: 'var(--field-border)' }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    block
                    loading={busy}
                    onClick={() => onDecide(order, 'Failed', notes.trim() || undefined)}
                  >
                    Reject payment
                  </Button>
                  <Button variant="glass" onClick={() => setRejectOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pending ? (
                  <>
                    <Button
                      block
                      size="lg"
                      loading={busy}
                      onClick={() => onDecide(order, 'Paid')}
                      icon={<Icon.Check size={18} strokeWidth={2.5} />}
                    >
                      Money received
                    </Button>
                    <Button variant="glass" block onClick={() => setRejectOpen(true)}>
                      I cannot find this payment
                    </Button>
                    <p className="pt-1 text-center t-caption-1 leading-relaxed text-[var(--label-3)]">
                      Confirming moves the order into production and counts the units as sold.
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      className="flex items-center gap-2.5 rounded-xl p-3.5 t-footnote font-medium"
                      style={{
                        background:
                          order.paymentStatus === 'Paid' ? 'var(--ok-bg)' : 'var(--danger-bg)',
                        color: order.paymentStatus === 'Paid' ? 'var(--ok)' : 'var(--danger)',
                      }}
                    >
                      {order.paymentStatus === 'Paid' ? (
                        <Icon.CheckCircle size={17} />
                      ) : (
                        <Icon.Alert size={17} />
                      )}
                      {order.paymentStatus === 'Paid'
                        ? 'Confirmed received'
                        : 'Marked as not received'}
                    </div>
                    <Button
                      variant="glass"
                      block
                      loading={busy}
                      onClick={() =>
                        onDecide(order, order.paymentStatus === 'Paid' ? 'Failed' : 'Paid')
                      }
                    >
                      {order.paymentStatus === 'Paid' ? 'Undo — mark unverified' : 'Actually, confirm it'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Glass>
  )
}

function Fact({
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
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--label-3)]">
        {label}
      </dt>
      <dd className={cn('mt-0.5 truncate font-medium', mono && 'font-mono t-caption-1')}>
        {node ?? value ?? '—'}
      </dd>
    </div>
  )
}

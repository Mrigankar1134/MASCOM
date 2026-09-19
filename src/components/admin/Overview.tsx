'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Glass } from '@/components/ui/Glass'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/Feedback'
import { Icon } from '@/components/shell/Icons'
import { money, relativeTime } from '@/lib/format'

export type OverviewData = {
  scope: 'all' | 'mine'
  recipientName: string | null
  viewerName: string
  totals: {
    revenue: number
    orders: number
    pending: number
    paid: number
    failed: number
    units: number
    awaiting: number
  }
  series: { date: string; revenue: number; orders: number }[]
  recent: {
    _id: string
    orderId: string
    createdAt: string
    paymentStatus: string
    finalAmountPaid: number
    paidTo?: string
    userId?: { name?: string; rollNo?: string }
  }[]
  topProducts: { _id: string; name: string; totalSold: number; totalRevenue: number }[]
  counts: { students: number; products: number; recipients: number } | null
}

export function Overview({ data }: { data: OverviewData }) {
  const { totals } = data
  const firstName = data.viewerName.split(' ')[0]

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="mb-6">
        <p className="eyebrow">
          {data.scope === 'all' ? 'Everything' : `Collecting as ${data.recipientName ?? 'recipient'}`}
        </p>
        <h1 className="display mt-2 text-[clamp(1.8rem,4vw,2.5rem)]">Hey {firstName}</h1>
        <p className="mt-2 text-[14.5px] text-[var(--muted-fg)]">
          {totals.pending > 0 ? (
            <>
              <span className="font-semibold text-[var(--page-fg)]">
                {totals.pending} {totals.pending === 1 ? 'payment' : 'payments'}
              </span>{' '}
              waiting on you — {money(totals.awaiting)} unverified.
            </>
          ) : (
            'Nothing is waiting on you. Everything sent your way has been checked.'
          )}
        </p>
      </header>

      {totals.pending > 0 && (
        <Link href="/admin/verify" className="mb-5 block">
          <Glass interactive tone="strong" className="flex items-center gap-4 p-4">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}
            >
              <Icon.Clock size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">Verify {totals.pending} pending</p>
              <p className="text-[13px] text-[var(--muted-fg)]">
                Students are waiting on confirmation before their orders move.
              </p>
            </div>
            <Icon.Chevron size={18} className="shrink-0 text-[var(--faint-fg)]" />
          </Glass>
        </Link>
      )}

      {/* ── Stat tiles ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Collected" value={money(totals.revenue)} hint={`${totals.paid} confirmed`} tone="ok" />
        <Stat label="Awaiting" value={money(totals.awaiting)} hint={`${totals.pending} to verify`} tone="warn" />
        <Stat label="Orders" value={String(totals.orders)} hint={`${totals.units} items`} />
        <Stat
          label="Rejected"
          value={String(totals.failed)}
          hint={totals.failed > 0 ? 'Unmatched payments' : 'All clean'}
          tone={totals.failed > 0 ? 'danger' : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <CollectionsChart series={data.series} />

        <Glass className="p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">Payment status</h2>
          <p className="mt-1 text-[12.5px] text-[var(--muted-fg)]">
            Across {totals.orders} {totals.orders === 1 ? 'order' : 'orders'}.
          </p>

          <ul className="mt-4 space-y-3">
            <StatusRow label="Confirmed" count={totals.paid} total={totals.orders} tone="ok" icon={<Icon.CheckCircle size={15} />} />
            <StatusRow label="Awaiting verification" count={totals.pending} total={totals.orders} tone="warn" icon={<Icon.Clock size={15} />} />
            <StatusRow label="Rejected" count={totals.failed} total={totals.orders} tone="danger" icon={<Icon.Alert size={15} />} />
          </ul>

          {data.counts && (
            <div
              className="mt-5 grid grid-cols-3 gap-3 border-t pt-4"
              style={{ borderColor: 'var(--hairline-soft)' }}
            >
              <MiniStat label="Students" value={data.counts.students} />
              <MiniStat label="Drops" value={data.counts.products} />
              <MiniStat label="Collectors" value={data.counts.recipients} />
            </div>
          )}
        </Glass>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Glass className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">Latest orders</h2>
            <Link href="/admin/verify" className="text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>
              See all
            </Link>
          </div>

          {data.recent.length === 0 ? (
            <EmptyState icon={<Icon.Receipt size={22} />} title="No orders yet" className="py-10" />
          ) : (
            <ul className="space-y-2">
              {data.recent.map((order) => (
                <li key={order._id}>
                  <Link
                    href="/admin/verify"
                    className="press flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-[var(--hairline-soft)]"
                  >
                    <Avatar name={order.userId?.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">
                        {order.userId?.name ?? 'Unknown'}
                      </p>
                      <p className="truncate font-mono text-[11.5px] text-[var(--faint-fg)]">
                        {order.orderId} · {relativeTime(order.createdAt)}
                      </p>
                    </div>
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
                    <span className="shrink-0 text-[13.5px] font-semibold tabular">
                      {money(order.finalAmountPaid)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Glass>

        {data.topProducts.length > 0 && (
          <Glass className="p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight">Best sellers</h2>
              <Link href="/admin/products" className="text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>
                Manage drops
              </Link>
            </div>

            <ul className="space-y-3">
              {data.topProducts.map((product, i) => {
                const max = Math.max(...data.topProducts.map((p) => p.totalSold), 1)
                return (
                  <li key={product._id}>
                    <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span className="min-w-0 truncate font-medium">
                        <span className="mr-2 text-[var(--faint-fg)] tabular">{i + 1}</span>
                        {product.name}
                      </span>
                      <span className="shrink-0 tabular text-[var(--muted-fg)]">
                        {product.totalSold} sold
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                      style={{ background: 'var(--hairline-soft)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(product.totalSold / max) * 100}%`,
                          background: 'var(--accent)',
                        }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Glass>
        )}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'ok' | 'warn' | 'danger'
}) {
  const color =
    tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : tone === 'danger' ? 'var(--danger)' : undefined

  return (
    <Glass className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--faint-fg)]">
        {label}
      </p>
      <p className="mt-2 text-[clamp(1.35rem,3.2vw,1.75rem)] font-semibold tabular" style={{ color }}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[12px] text-[var(--muted-fg)]">{hint}</p>}
    </Glass>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[18px] font-semibold tabular">{value}</p>
      <p className="text-[11px] text-[var(--faint-fg)]">{label}</p>
    </div>
  )
}

function StatusRow({
  label,
  count,
  total,
  tone,
  icon,
}: {
  label: string
  count: number
  total: number
  tone: 'ok' | 'warn' | 'danger'
  icon: React.ReactNode
}) {
  const color = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : 'var(--danger)'
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <li>
      <div className="flex items-center gap-2 text-[13px]">
        {/* Icon + label, never colour alone */}
        <span style={{ color }}>{icon}</span>
        <span className="flex-1 font-medium">{label}</span>
        <span className="tabular text-[var(--muted-fg)]">
          {count} · {pct}%
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full"
        style={{ background: 'var(--hairline-soft)' }}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </li>
  )
}

/**
 * Daily collections. One measure, one hue — orders and rupees are different
 * scales, so orders ride in the tooltip rather than a second axis.
 */
function CollectionsChart({ series }: { series: OverviewData['series'] }) {
  const [hover, setHover] = useState<number | null>(null)

  const max = Math.max(...series.map((d) => d.revenue), 1)
  const totalRevenue = series.reduce((n, d) => n + d.revenue, 0)
  const totalOrders = series.reduce((n, d) => n + d.orders, 0)
  const active = hover !== null ? series[hover] : null

  return (
    <Glass className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Collections · last 14 days</h2>
          <p className="mt-1 text-[12.5px] text-[var(--muted-fg)]">
            Confirmed payments only.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[20px] font-semibold tabular">{money(totalRevenue)}</p>
          <p className="text-[12px] text-[var(--faint-fg)]">{totalOrders} orders placed</p>
        </div>
      </div>

      <div className="relative mt-6">
        {/* Tooltip */}
        {active && (
          <div
            className="glass glass-lifted pointer-events-none absolute -top-2 z-10 -translate-y-full rounded-xl px-3 py-2 text-[12px]"
            style={{
              left: `${((hover! + 0.5) / series.length) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="font-semibold">
              {new Date(active.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
            <p className="mt-0.5 tabular text-[var(--muted-fg)]">
              {money(active.revenue)} · {active.orders} {active.orders === 1 ? 'order' : 'orders'}
            </p>
          </div>
        )}

        <div className="flex h-36 items-end gap-[2px]" role="img" aria-label="Daily collections for the last 14 days">
          {series.map((day, i) => {
            const height = day.revenue > 0 ? Math.max((day.revenue / max) * 100, 3) : 1.5
            return (
              <div
                key={day.date}
                className="group relative flex h-full flex-1 cursor-default items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.6, delay: i * 0.02, ease: [0.32, 0.72, 0, 1] }}
                  className="w-full rounded-t-[4px] transition-opacity"
                  style={{
                    background: day.revenue > 0 ? 'var(--accent)' : 'var(--hairline)',
                    opacity: hover === null || hover === i ? 1 : 0.45,
                  }}
                />
              </div>
            )
          })}
        </div>

        <div
          className="mt-2 flex justify-between border-t pt-2 text-[11px] text-[var(--faint-fg)]"
          style={{ borderColor: 'var(--hairline-soft)' }}
        >
          <span>
            {new Date(series[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          <span>Today</span>
        </div>
      </div>
    </Glass>
  )
}

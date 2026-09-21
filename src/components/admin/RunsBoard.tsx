'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState } from '@/components/ui/Feedback'
import { Icon } from '@/components/shell/Icons'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/client/api'
import { money } from '@/lib/format'
import { DateTime } from '@/components/ui/Time'
import { ConsoleHeader } from './ConsoleHeader'

export type BatchRow = {
  _id: string
  batchNumber: string
  orderStartDate: string
  orderEndDate: string
  productId?: { _id: string; name?: string } | string
  counts: { items: number; units: number }
}

export type CouponRow = {
  _id: string
  code: string
  type: 'Percentage' | 'Fixed'
  value: number
  minOrderAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  validFrom: string
  validUntil: string
  description?: string
  active: boolean
}

export function RunsBoard({
  batches,
  coupons,
  products,
  waiting,
}: {
  batches: BatchRow[]
  coupons: CouponRow[]
  products: { _id: string; name: string }[]
  waiting: { items: number; units: number }
}) {
  const [sheet, setSheet] = useState<'batch' | 'coupon' | null>(null)

  return (
    <div className="mx-auto max-w-[1600px]">
      <ConsoleHeader
        title="Runs & coupons"
        subtitle="A run groups every order placed inside a window so the vendor gets one list. Anything ordered outside a run waits in the pool until you open one."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {/* ── Production runs ──────────────────────────────────────────── */}
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="t-subhead font-semibold tracking-tight">Production runs</h2>
            <Button size="sm" onClick={() => setSheet('batch')} icon={<Icon.Plus size={15} />}>
              New run
            </Button>
          </div>

          {waiting.items > 0 && (
            <Glass tone="faint" className="mb-3 flex items-center gap-3 p-3.5">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}
              >
                <Icon.Clock size={17} />
              </span>
              <p className="t-footnote leading-relaxed text-[var(--label-2)]">
                <span className="font-semibold text-[var(--label)]">
                  {waiting.units} item{waiting.units === 1 ? '' : 's'}
                </span>{' '}
                are waiting for a run. Opening one that covers their order dates picks them up
                automatically.
              </p>
            </Glass>
          )}

          {batches.length === 0 ? (
            <Glass>
              <EmptyState
                icon={<Icon.Truck size={22} />}
                title="No runs yet"
                description="Open one for the current window so orders stop piling up as WAITING."
                className="py-10"
              />
            </Glass>
          ) : (
            <ul className="space-y-2.5">
              {batches.map((batch) => (
                <li key={batch._id}>
                  <BatchCard batch={batch} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Coupons ──────────────────────────────────────────────────── */}
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="t-subhead font-semibold tracking-tight">Coupons</h2>
            <Button size="sm" onClick={() => setSheet('coupon')} icon={<Icon.Plus size={15} />}>
              New coupon
            </Button>
          </div>

          {coupons.length === 0 ? (
            <Glass>
              <EmptyState
                icon={<Icon.Tag size={22} />}
                title="No coupons"
                description="Make one for an early-bird window or a committee discount."
                className="py-10"
              />
            </Glass>
          ) : (
            <ul className="space-y-2.5">
              {coupons.map((coupon) => (
                <li key={coupon._id}>
                  <CouponCard coupon={coupon} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {sheet === 'batch' && <BatchEditor products={products} onClose={() => setSheet(null)} />}
      {sheet === 'coupon' && <CouponEditor onClose={() => setSheet(null)} />}
    </div>
  )
}

function BatchCard({ batch }: { batch: BatchRow }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const now = Date.now()
  const open =
    new Date(batch.orderStartDate).getTime() <= now &&
    new Date(batch.orderEndDate).getTime() >= now

  async function remove() {
    setBusy(true)
    try {
      await api(`/api/admin/batches/${batch._id}`, { method: 'DELETE' })
      toast.success(`${batch.batchNumber} closed. Its items went back to waiting.`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove that run.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Glass className="flex min-w-0 items-center gap-3 p-4">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{
          background: open ? 'var(--tint-glow)' : 'var(--separator-soft)',
          color: open ? 'var(--tint)' : 'var(--label-3)',
        }}
      >
        <Icon.Truck size={19} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono t-subhead font-semibold">{batch.batchNumber}</p>
          {open ? <Badge tone="ok" dot>Collecting</Badge> : <Badge tone="neutral">Closed</Badge>}
        </div>
        <p className="mt-0.5 truncate t-caption-1 text-[var(--label-2)]">
          {typeof batch.productId === 'object' ? batch.productId?.name : 'Product'}
        </p>
        <p className="mt-0.5 truncate t-caption-1 text-[var(--label-3)]">
          <DateTime value={batch.orderStartDate} mode="date" /> to{' '}
          <DateTime value={batch.orderEndDate} mode="date" />
        </p>
        <p className="mt-0.5 t-caption-1 text-[var(--label-3)]">
          {batch.counts.units} unit{batch.counts.units === 1 ? '' : 's'} across{' '}
          {batch.counts.items} line{batch.counts.items === 1 ? '' : 's'}
        </p>
      </div>

      <button
        onClick={remove}
        disabled={busy}
        className="press shrink-0 rounded-lg px-2.5 py-1.5 t-caption-1 font-semibold disabled:opacity-50"
        style={{ background: 'var(--separator-soft)', color: 'var(--danger)' }}
      >
        Close
      </button>
    </Glass>
  )
}

function CouponCard({ coupon }: { coupon: CouponRow }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const expired = new Date(coupon.validUntil).getTime() < Date.now()

  async function toggle() {
    setBusy(true)
    try {
      await api(`/api/admin/coupons/${coupon._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !coupon.active }),
      })
      toast.success(`${coupon.code} ${coupon.active ? 'paused' : 'activated'}.`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update that coupon.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Glass className="flex min-w-0 items-center gap-3 p-4">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{
          background: coupon.active && !expired ? 'var(--tint-glow)' : 'var(--separator-soft)',
          color: coupon.active && !expired ? 'var(--tint)' : 'var(--label-3)',
        }}
      >
        <Icon.Tag size={19} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono t-subhead font-semibold">{coupon.code}</p>
          {expired ? (
            <Badge tone="neutral">Expired</Badge>
          ) : coupon.active ? (
            <Badge tone="ok" dot>Live</Badge>
          ) : (
            <Badge tone="neutral">Paused</Badge>
          )}
        </div>
        <p className="mt-0.5 t-caption-1 text-[var(--label-2)]">
          {coupon.type === 'Percentage' ? `${coupon.value}% off` : `${money(coupon.value)} off`}
          {coupon.minOrderAmount ? ` over ${money(coupon.minOrderAmount)}` : ''}
          {coupon.maxDiscount ? ` · capped at ${money(coupon.maxDiscount)}` : ''}
        </p>
        <p className="mt-0.5 t-caption-1 text-[var(--label-3)]">
          Used {coupon.usedCount}
          {coupon.usageLimit ? ` of ${coupon.usageLimit}` : ''} · until{' '}
          <DateTime value={coupon.validUntil} mode="date" />
        </p>
      </div>

      <button
        onClick={toggle}
        disabled={busy || expired}
        className="press shrink-0 rounded-lg px-2.5 py-1.5 t-caption-1 font-semibold disabled:opacity-40"
        style={{ background: 'var(--separator-soft)' }}
      >
        {coupon.active ? 'Pause' : 'Activate'}
      </button>
    </Glass>
  )
}

function BatchEditor({
  products,
  onClose,
}: {
  products: { _id: string; name: string }[]
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const today = new Date().toISOString().slice(0, 10)

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    const form = new FormData(event.currentTarget)

    setSaving(true)
    try {
      const result = await api<{ adopted: number }>('/api/admin/batches', {
        method: 'POST',
        body: JSON.stringify({
          productId: String(form.get('productId')),
          batchNumber: String(form.get('batchNumber')).trim(),
          orderStartDate: String(form.get('orderStartDate')),
          orderEndDate: String(form.get('orderEndDate')),
        }),
      })
      toast.success(
        result.adopted > 0
          ? `Run opened. ${result.adopted} waiting order${result.adopted === 1 ? '' : 's'} picked up.`
          : 'Run opened.',
      )
      router.refresh()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.issues?.length) {
        setErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])))
      }
      toast.error(err instanceof ApiError ? err.message : 'Could not open that run.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Open a production run"
      description="Everything ordered inside this window gets grouped under one batch number, including anything already waiting."
    >
      <form onSubmit={save} className="space-y-4">
        <Select name="productId" label="Product" required error={errors.productId}>
          <option value="">Choose a drop…</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </Select>

        <Input
          name="batchNumber"
          label="Batch number"
          placeholder="B-02"
          required
          error={errors.batchNumber}
          hint="Goes on the vendor list and shows up for students."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="orderStartDate"
            type="date"
            label="Window opens"
            defaultValue={today}
            required
            error={errors.orderStartDate}
          />
          <Input
            name="orderEndDate"
            type="date"
            label="Window closes"
            defaultValue={today}
            required
            error={errors.orderEndDate}
          />
        </div>

        <Button type="submit" loading={saving} block className="mt-2">
          Open run
        </Button>
      </form>
    </Sheet>
  )
}

function CouponEditor({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const toast = useToast()
  const [type, setType] = useState<'Percentage' | 'Fixed'>('Percentage')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const today = new Date().toISOString().slice(0, 10)
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    const form = new FormData(event.currentTarget)

    const num = (key: string) => {
      const raw = String(form.get(key) ?? '').trim()
      return raw === '' ? undefined : Number(raw)
    }

    setSaving(true)
    try {
      await api('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: String(form.get('code')).trim().toUpperCase(),
          type,
          value: Number(form.get('value')),
          minOrderAmount: num('minOrderAmount'),
          maxDiscount: num('maxDiscount'),
          usageLimit: num('usageLimit'),
          validFrom: new Date(String(form.get('validFrom'))).toISOString(),
          validUntil: new Date(String(form.get('validUntil')) + 'T23:59:59').toISOString(),
          description: String(form.get('description') ?? '').trim() || undefined,
        }),
      })
      toast.success('Coupon created.')
      router.refresh()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.issues?.length) {
        setErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])))
      }
      toast.error(err instanceof ApiError ? err.message : 'Could not create that coupon.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open onClose={onClose} title="New coupon" description="Comes off the order subtotal at checkout.">
      <form onSubmit={save} className="space-y-4">
        <Input
          name="code"
          label="Code"
          placeholder="EARLYBIRD"
          required
          error={errors.code}
          className="font-mono uppercase"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            name="type"
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as 'Percentage' | 'Fixed')}
          >
            <option value="Percentage">Percentage off</option>
            <option value="Fixed">Flat amount off</option>
          </Select>
          <Input
            name="value"
            type="number"
            min={1}
            max={type === 'Percentage' ? 100 : 100000}
            label={type === 'Percentage' ? 'Percent off' : 'Rupees off'}
            required
            error={errors.value}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="minOrderAmount"
            type="number"
            min={0}
            label="Minimum order (₹)"
            placeholder="Optional"
          />
          {type === 'Percentage' && (
            <Input
              name="maxDiscount"
              type="number"
              min={0}
              label="Maximum discount (₹)"
              placeholder="Optional cap"
            />
          )}
        </div>

        <Input
          name="usageLimit"
          type="number"
          min={1}
          label="Total uses"
          placeholder="Leave empty for unlimited"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="validFrom" type="date" label="Valid from" defaultValue={today} required />
          <Input name="validUntil" type="date" label="Valid until" defaultValue={nextMonth} required />
        </div>

        <Input name="description" label="Note" placeholder="Optional, for the committee" />

        <Button type="submit" loading={saving} block className="mt-2">
          Create coupon
        </Button>
      </form>
    </Sheet>
  )
}

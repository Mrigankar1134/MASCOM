'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ShopRecipient } from '@/lib/data'
import { lineKey, useCart } from '@/lib/client/cart'
import { useSession } from '@/lib/client/session'
import { api, ApiError } from '@/lib/client/api'
import { money } from '@/lib/format'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { Icon } from '@/components/shell/Icons'
import { Wordmark } from '@/components/shell/Wordmark'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useToast } from '@/components/ui/Toast'
import { Stepper, type Step } from './Stepper'
import { RecipientPicker } from './RecipientPicker'
import { PaymentPanel } from './PaymentPanel'
import { ProofUpload } from './ProofUpload'
import { swatch } from '@/components/shop/ProductCard'

const STEPS: Step[] = [
  { id: 'review', label: 'Review' },
  { id: 'who', label: 'Who you pay' },
  { id: 'pay', label: 'Pay' },
  { id: 'proof', label: 'Proof' },
]

export function CheckoutFlow({ recipients }: { recipients: ShopRecipient[] }) {
  const router = useRouter()
  const toast = useToast()
  const cart = useCart()
  const user = useSession()

  const [step, setStep] = useState(0)
  const [recipient, setRecipient] = useState<ShopRecipient | null>(
    recipients.length === 1 ? recipients[0] : null,
  )
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)

  // The QR encodes this number, and the server recomputes the same discount
  // when the order is created — the two must never drift apart.
  const total = coupon ? coupon.total : cart.subtotal
  const note = useMemo(
    () => `MASCOM ${user?.rollNo ?? user?.name ?? ''}`.trim().slice(0, 48),
    [user],
  )

  if (cart.ready && cart.lines.length === 0) {
    return (
      <CheckoutShell>
        <Glass className="mt-10">
          <EmptyState
            icon={<Icon.Bag size={24} />}
            title="Your bag is empty"
            description="Add something from the drop and come back — your payment details stay saved."
            action={
              <Link
                href="/shop"
                className="press inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[14.5px] font-semibold"
                style={{ background: 'var(--accent-solid)', color: 'var(--accent-contrast)' }}
              >
                Back to the drop
              </Link>
            }
          />
        </Glass>
      </CheckoutShell>
    )
  }

  if (recipients.length === 0) {
    return (
      <CheckoutShell>
        <Glass className="mt-10">
          <EmptyState
            icon={<Icon.Wallet size={24} />}
            title="No one is collecting payments yet"
            description="A coordinator has to be set up as a payment recipient before orders can be placed. Ping the MASCOM team and try again shortly."
          />
        </Glass>
      </CheckoutShell>
    )
  }

  async function placeOrder() {
    if (!recipient || !screenshotUrl) return

    setPlacing(true)
    try {
      const result = await api<{ order: { orderId: string } }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            color: l.color,
            size: l.size,
            customName: l.customName,
          })),
          paymentRecipientId: recipient._id,
          screenshotUrl,
          paymentReference: reference.trim() || undefined,
          couponCode: coupon?.code,
        }),
      })

      cart.clear()
      toast.success('Order placed. Waiting on verification.')
      router.push(`/orders/${result.order.orderId}?placed=1`)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not place the order. Try again.',
      )
      setPlacing(false)
    }
  }

  const canContinue = [
    cart.lines.length > 0,
    !!recipient,
    !!recipient,
    !!screenshotUrl && confirmed,
  ][step]

  return (
    <CheckoutShell>
      <div className="mt-4">
        <Stepper steps={STEPS} current={step} onJump={(i) => setStep(i)} />
      </div>

      <div className="mt-6 grid gap-6 pb-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={STEPS[step].id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              {step === 0 && <ReviewStep coupon={coupon} onCoupon={setCoupon} />}

              {step === 1 && (
                <section>
                  <StepHeading
                    title="Who are you paying?"
                    body="MASCOM has no payment gateway, so you pay a coordinator directly. Whoever you pick here receives the money and is the one who verifies your order."
                  />
                  <RecipientPicker
                    recipients={recipients}
                    selectedId={recipient?._id ?? null}
                    onSelect={(r) => {
                      setRecipient(r)
                      setStep(2)
                    }}
                  />
                </section>
              )}

              {step === 2 && recipient && (
                <section>
                  <StepHeading
                    title={`Pay ${money(total)}`}
                    body={`Scan the code or open your UPI app, then come back and upload the screenshot.`}
                  />
                  <PaymentPanel recipient={recipient} amount={total} note={note} />
                </section>
              )}

              {step === 3 && recipient && (
                <section>
                  <StepHeading
                    title="Show us the proof"
                    body={`${recipient.name} will check this against their own UPI history before confirming your order.`}
                  />
                  <ProofUpload
                    screenshotUrl={screenshotUrl}
                    onScreenshot={setScreenshotUrl}
                    reference={reference}
                    onReference={setReference}
                  />

                  <Glass className="mt-4 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
                      />
                      <span className="text-[13.5px] leading-relaxed text-[var(--muted-fg)]">
                        I confirm I have paid{' '}
                        <span className="font-semibold text-[var(--page-fg)]">{money(total)}</span> to{' '}
                        <span className="font-semibold text-[var(--page-fg)]">{recipient.name}</span>,
                        and the screenshot above is of that payment.
                      </span>
                    </label>
                  </Glass>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Summary rail — a sticky sidebar on desktop, a card up top on mobile */}
        <aside className={`order-first lg:order-last ${step >= 2 ? 'hidden lg:block' : ''}`}>
          <div className="lg:sticky lg:top-6">
            <SummaryCard
              total={total}
              coupon={coupon}
              recipientName={recipient?.name}
              collapsedOnMobile={step > 0}
            />
          </div>
        </aside>
      </div>

      {/* Action bar */}
      <div className="sticky bottom-0 z-30 mt-8 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <Glass lifted className="glass-bar flex items-center gap-3 rounded-[1.3rem] p-2.5">
          {step > 0 && (
            <Button variant="glass" onClick={() => setStep((s) => s - 1)} aria-label="Go back">
              <Icon.ChevronLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}

          <div className="ml-1 min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[var(--faint-fg)]">
              {['Your bag', 'Step 2 of 4', 'Step 3 of 4', 'Last step'][step]}
            </p>
            <p className="truncate text-[16px] font-semibold tabular">{money(total)}</p>
          </div>

          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue}
              size="md"
            >
              {step === 2 ? 'I have paid' : 'Continue'}
              <Icon.ArrowRight size={17} />
            </Button>
          ) : (
            <Button onClick={placeOrder} disabled={!canContinue} loading={placing} size="md">
              Place order
            </Button>
          )}
        </Glass>
      </div>
    </CheckoutShell>
  )
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/bag" className="press inline-flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full glass">
            <Icon.ChevronLeft size={17} />
          </span>
          <Wordmark compact />
        </Link>
        <ThemeToggle />
      </div>
      {children}
    </div>
  )
}

function StepHeading({ title, body }: { title: string; body: string }) {
  return (
    <header className="mb-5">
      <h1 className="display text-[clamp(1.6rem,5vw,2.25rem)]">{title}</h1>
      <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-[var(--muted-fg)]">{body}</p>
    </header>
  )
}

export type AppliedCoupon = {
  code: string
  label: string
  subtotal: number
  discount: number
  total: number
}

function ReviewStep({
  coupon,
  onCoupon,
}: {
  coupon: AppliedCoupon | null
  onCoupon: (next: AppliedCoupon | null) => void
}) {
  const cart = useCart()

  return (
    <section>
      <StepHeading
        title="Check your order"
        body="Sizes and names are printed exactly as shown here — they cannot be changed once production starts."
      />

      <ul className="space-y-2.5">
        {cart.lines.map((line) => (
          <li key={lineKey(line)}>
            <Glass className="flex items-center gap-3.5 p-3">
              <span
                className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg"
                style={{ background: 'var(--hairline-soft)' }}
              >
                {line.image ? (
                  <Image src={line.image} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-[var(--faint-fg)]">
                    <Icon.Box size={18} />
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold">{line.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12.5px] text-[var(--muted-fg)]">
                  {line.color && (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background: swatch(line.color),
                          boxShadow: 'inset 0 0 0 1px var(--hairline)',
                        }}
                      />
                      {line.color}
                    </span>
                  )}
                  {line.size && <span>Size {line.size}</span>}
                  <span>Qty {line.quantity}</span>
                  {line.customName && (
                    <span className="font-medium" style={{ color: 'var(--accent)' }}>
                      “{line.customName}”
                    </span>
                  )}
                </div>
              </div>

              <p className="shrink-0 text-[14.5px] font-semibold tabular">
                {money(line.unitPrice * line.quantity)}
              </p>
            </Glass>
          </li>
        ))}
      </ul>

      <Link
        href="/bag"
        className="press mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold"
        style={{ color: 'var(--accent)' }}
      >
        Edit your bag
        <Icon.ArrowRight size={14} />
      </Link>

      <CouponField coupon={coupon} onCoupon={onCoupon} />
    </section>
  )
}

function CouponField({
  coupon,
  onCoupon,
}: {
  coupon: AppliedCoupon | null
  onCoupon: (next: AppliedCoupon | null) => void
}) {
  const cart = useCart()
  const toast = useToast()
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)

  async function apply() {
    const trimmed = code.trim()
    if (!trimmed) return

    setChecking(true)
    try {
      const result = await api<AppliedCoupon>('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: trimmed,
          items: cart.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            color: l.color,
            size: l.size,
            customName: l.customName,
          })),
        }),
      })
      onCoupon(result)
      setCode('')
      toast.success(`${result.code} applied — ${money(result.discount)} off.`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not check that code.')
    } finally {
      setChecking(false)
    }
  }

  if (coupon) {
    return (
      <Glass className="mt-4 flex items-center gap-3 p-3.5">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
          style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}
        >
          <Icon.Check size={17} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[13.5px] font-semibold">{coupon.code}</p>
          <p className="text-[12.5px] text-[var(--muted-fg)]">
            {coupon.label} · {money(coupon.discount)} off
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCoupon(null)}
          className="press shrink-0 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold"
          style={{ background: 'var(--hairline-soft)' }}
        >
          Remove
        </button>
      </Glass>
    )
  }

  return (
    <Glass className="mt-4 flex items-center gap-2 p-2 pl-4">
      <Icon.Tag size={16} className="shrink-0 text-[var(--faint-fg)]" />
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 32))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            apply()
          }
        }}
        placeholder="Coupon code"
        autoCapitalize="characters"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent font-mono text-[14px] outline-none placeholder:font-sans placeholder:text-[var(--faint-fg)]"
        aria-label="Coupon code"
      />
      <Button type="button" size="sm" variant="glass" loading={checking} onClick={apply} disabled={!code.trim()}>
        Apply
      </Button>
    </Glass>
  )
}

function SummaryCard({
  total,
  coupon,
  recipientName,
  collapsedOnMobile,
}: {
  total: number
  coupon: AppliedCoupon | null
  recipientName?: string
  collapsedOnMobile: boolean
}) {
  const cart = useCart()

  return (
    <Glass tone="strong" className="p-5">
      <p className="eyebrow">Order summary</p>

      <dl className={`mt-4 space-y-2.5 text-[14px] ${collapsedOnMobile ? 'hidden lg:block' : ''}`}>
        <div className="flex justify-between">
          <dt className="text-[var(--muted-fg)]">
            {cart.count} {cart.count === 1 ? 'item' : 'items'}
          </dt>
          <dd className="font-medium tabular">{money(cart.subtotal)}</dd>
        </div>
        {coupon && (
          <div className="flex justify-between" style={{ color: 'var(--ok)' }}>
            <dt className="font-medium">{coupon.code}</dt>
            <dd className="font-medium tabular">− {money(coupon.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-[var(--muted-fg)]">Collection</dt>
          <dd className="font-medium">On campus</dd>
        </div>
      </dl>

      <div
        className="mt-4 flex items-baseline justify-between border-t pt-4"
        style={{ borderColor: 'var(--hairline-soft)' }}
      >
        <span className="text-[14px] font-medium text-[var(--muted-fg)]">Pay now</span>
        <span className="text-[22px] font-semibold tabular">{money(total)}</span>
      </div>

      {recipientName && (
        <p className="mt-3 flex items-center gap-2 text-[12.5px] text-[var(--muted-fg)]">
          <Icon.Wallet size={14} />
          Paying <span className="font-semibold text-[var(--page-fg)]">{recipientName}</span>
        </p>
      )}
    </Glass>
  )
}

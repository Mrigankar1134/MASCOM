'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { ShopRecipient } from '@/lib/data'
import { buildUpiUri } from '@/lib/upi'
import { money } from '@/lib/format'
import { Glass } from '@/components/ui/Glass'
import { Icon } from '@/components/shell/Icons'
import { useToast } from '@/components/ui/Toast'
import { useTheme } from '@/components/ui/ThemeProvider'
import { cn } from '@/components/ui/cn'

/**
 * The pay step. Shows an amount-locked QR by default so the student cannot
 * mistype the total, with the coordinator's own saved QR one tap away.
 */
export function PaymentPanel({
  recipient,
  amount,
  note,
}: {
  recipient: ShopRecipient
  amount: number
  note: string
}) {
  const toast = useToast()
  const { resolved } = useTheme()
  const [useOwnQr, setUseOwnQr] = useState(false)

  const generatedQr = `/api/qr?${new URLSearchParams({
    upi: recipient.upiId,
    name: recipient.name,
    amount: String(amount),
    note,
    theme: resolved,
  })}`

  const upiUri = buildUpiUri({
    upiId: recipient.upiId,
    payeeName: recipient.name,
    amount,
    note,
  })

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${what} copied.`)
    } catch {
      toast.error('Could not copy — select and copy it manually.')
    }
  }

  return (
    <div className="space-y-4">
      <Glass tone="strong" className="overflow-hidden p-5">
        <div className="text-center">
          <p className="eyebrow">Pay {recipient.name}</p>
          <p className="display mt-2 text-[40px] tabular">{money(amount)}</p>
        </div>

        {/* QR plate — white in both themes so any scanner reads it reliably */}
        <div className="mt-5 flex justify-center">
          <div
            className="relative rounded-[1.6rem] p-4"
            style={{
              background: useOwnQr ? 'transparent' : resolved === 'dark' ? '#101018' : '#ffffff',
              boxShadow: 'inset 0 0 0 1px var(--hairline), var(--glass-shadow)',
            }}
          >
            {useOwnQr ? (
              recipient.qrCodeUrl ? (
                <Image
                  src={recipient.qrCodeUrl}
                  alt={`${recipient.name}'s payment QR`}
                  width={220}
                  height={220}
                  unoptimized
                  className="h-[220px] w-[220px] rounded-2xl object-contain"
                />
              ) : (
                <div className="grid h-[220px] w-[220px] place-items-center text-center text-[13px] text-[var(--faint-fg)]">
                  No saved QR — use the generated one.
                </div>
              )
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={generatedQr}
                alt={`Scan to pay ${money(amount)} to ${recipient.name}`}
                width={220}
                height={220}
                className="h-[220px] w-[220px]"
              />
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[13.5px] leading-relaxed text-[var(--muted-fg)]">
          {useOwnQr ? (
            <>
              This is {recipient.name}&apos;s own QR — you will need to type{' '}
              <span className="font-semibold text-[var(--page-fg)]">{money(amount)}</span> yourself.
            </>
          ) : (
            <>
              Scan with any UPI app. The amount is already filled in — just confirm.
            </>
          )}
        </p>

        {recipient.qrCodeUrl && (
          <button
            type="button"
            onClick={() => setUseOwnQr((v) => !v)}
            className="press mx-auto mt-3 block text-[13px] font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            {useOwnQr ? 'Use the amount-locked QR' : `Use ${recipient.name}'s own QR instead`}
          </button>
        )}

        {/* On a phone this hands off straight into GPay / PhonePe / Paytm */}
        <a
          href={upiUri}
          className="press mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold sm:hidden"
          style={{ background: 'var(--accent-solid)', color: 'var(--accent-contrast)' }}
        >
          <Icon.Wallet size={18} />
          Open your UPI app
        </a>
      </Glass>

      <Glass className="divide-y" style={{ borderColor: 'var(--hairline-soft)' }}>
        <CopyRow
          label="UPI ID"
          value={recipient.upiId}
          mono
          onCopy={() => copy(recipient.upiId, 'UPI ID')}
        />
        <CopyRow
          label="Phone"
          value={recipient.phoneNumber}
          onCopy={() => copy(recipient.phoneNumber, 'Phone number')}
        />
        <CopyRow
          label="Exact amount"
          value={money(amount)}
          onCopy={() => copy(String(amount), 'Amount')}
        />
      </Glass>

      <Glass tone="faint" className="flex gap-3 p-4">
        <span className="mt-0.5 shrink-0" style={{ color: 'var(--warn)' }}>
          <Icon.Alert size={17} />
        </span>
        <p className="text-[13px] leading-relaxed text-[var(--muted-fg)]">
          Pay the exact amount to <span className="font-semibold text-[var(--page-fg)]">{recipient.name}</span>.
          Your order goes to them to verify, so paying someone else leaves it stuck.
        </p>
      </Glass>
    </div>
  )
}

function CopyRow({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string
  value: string
  mono?: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="w-28 shrink-0 text-[12.5px] font-medium text-[var(--faint-fg)]">{label}</span>
      <span className={cn('min-w-0 flex-1 truncate text-[14px] font-medium', mono && 'font-mono')}>
        {value}
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="press shrink-0 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold"
        style={{ background: 'var(--hairline-soft)' }}
      >
        Copy
      </button>
    </div>
  )
}

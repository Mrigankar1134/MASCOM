import { STATUS_TONE } from '@/lib/constants'
import { cn } from './cn'

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'accent'

const TONE_STYLES: Record<Tone, { color: string; background: string }> = {
  ok: { color: 'var(--ok)', background: 'var(--ok-bg)' },
  warn: { color: 'var(--warn)', background: 'var(--warn-bg)' },
  danger: { color: 'var(--danger)', background: 'var(--danger-bg)' },
  info: { color: 'var(--info)', background: 'var(--info-bg)' },
  accent: { color: 'var(--tint)', background: 'var(--tint-glow)' },
  neutral: { color: 'var(--label-2)', background: 'var(--fill-4)' },
}

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className,
}: {
  children: React.ReactNode
  tone?: Tone
  dot?: boolean
  className?: string
}) {
  const style = TONE_STYLES[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-[3px]',
        'text-[11px] font-semibold leading-[13px] tracking-[0.006em]',
        className,
      )}
      style={style}
    >
      {dot && (
        <span
          aria-hidden
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ background: 'currentColor' }}
        />
      )}
      {children}
    </span>
  )
}

/** Badge that picks its own colour from an order/payment status string. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={(STATUS_TONE[status] ?? 'neutral') as Tone} dot className={className}>
      {status}
    </Badge>
  )
}

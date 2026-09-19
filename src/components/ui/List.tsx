import Link from 'next/link'
import { cn } from './cn'
import { Icon } from '@/components/shell/Icons'

/**
 * The inset grouped list from Settings — a rounded section, a caption above,
 * an optional explanatory footnote below, and hairlines that stop short of
 * the leading content. It is the most recognisable structure in iOS, and it
 * suits forms and detail screens far better than a stack of cards.
 */
export function ListSection({
  header,
  footer,
  children,
  className,
}: {
  header?: string
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('w-full', className)}>
      {header && <h2 className="t-section-header mb-2 px-4">{header}</h2>}
      <div className="ios-group">{children}</div>
      {footer && <p className="t-footnote mt-2 px-4 text-[var(--label-2)]">{footer}</p>}
    </section>
  )
}

type RowProps = {
  /** Leading glyph, usually in a tinted rounded square. */
  icon?: React.ReactNode
  label: React.ReactNode
  /** Secondary line under the label. */
  detail?: React.ReactNode
  /** Right-aligned secondary value. */
  value?: React.ReactNode
  /** Right-hand control (switch, badge, button). Replaces the chevron. */
  accessory?: React.ReactNode
  href?: string
  onClick?: () => void
  destructive?: boolean
  className?: string
}

export function ListRow({
  icon,
  label,
  detail,
  value,
  accessory,
  href,
  onClick,
  destructive,
  className,
}: RowProps) {
  const interactive = !!href || !!onClick
  const showChevron = interactive && !accessory

  const body = (
    <>
      {icon && <span className="shrink-0">{icon}</span>}

      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('t-body truncate', destructive ? 'text-[var(--danger)]' : null)}>
          {label}
        </span>
        {detail && (
          <span className="t-footnote mt-0.5 truncate text-[var(--label-2)]">{detail}</span>
        )}
      </span>

      {value && (
        <span className="t-body shrink-0 truncate text-[var(--label-2)] tabular">{value}</span>
      )}
      {accessory}
      {showChevron && (
        <Icon.Chevron size={15} className="shrink-0 text-[var(--label-4)]" strokeWidth={2.5} />
      )}
    </>
  )

  const classes = cn('ios-row', icon ? 'ios-row-inset' : null, className)

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {body}
      </button>
    )
  }
  return <div className={classes}>{body}</div>
}

/** Tinted rounded square that holds a row's glyph, as in Settings. */
export function RowIcon({
  children,
  tone = 'tint',
}: {
  children: React.ReactNode
  tone?: 'tint' | 'ok' | 'warn' | 'danger' | 'info' | 'neutral'
}) {
  const colors: Record<string, { bg: string; fg: string }> = {
    tint: { bg: 'var(--tint-solid)', fg: 'var(--tint-contrast)' },
    ok: { bg: 'var(--ok)', fg: '#fff' },
    warn: { bg: 'var(--warn)', fg: '#fff' },
    danger: { bg: 'var(--danger)', fg: '#fff' },
    info: { bg: 'var(--info)', fg: '#fff' },
    neutral: { bg: 'var(--fill)', fg: 'var(--label-2)' },
  }
  const c = colors[tone]
  return (
    <span
      className="squircle grid h-[29px] w-[29px] place-items-center rounded-[7px]"
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  )
}

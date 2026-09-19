import { cn } from './cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('shimmer overflow-hidden rounded-xl', className)}
      style={{ background: 'var(--hairline-soft)' }}
      aria-hidden
    />
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60', className)}
      aria-hidden
    />
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      {icon && (
        <div
          className="mb-4 grid h-14 w-14 place-items-center rounded-2xl text-[var(--faint-fg)]"
          style={{ background: 'var(--hairline-soft)' }}
        >
          {icon}
        </div>
      )}
      <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--muted-fg)]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

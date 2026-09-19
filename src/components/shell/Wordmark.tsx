import { cn } from '@/components/ui/cn'

export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-baseline gap-2 select-none', className)}>
      <span className="display text-[19px] font-extrabold tracking-[-0.06em]">MASCOM</span>
      {!compact && (
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--faint-fg)] sm:inline">
          IIM Amritsar
        </span>
      )}
    </span>
  )
}

import { cn } from '@/components/ui/cn'

export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-baseline gap-2 select-none', className)}>
      <span className="display t-title-3 font-extrabold tracking-[-0.06em]">MASCOM</span>
      {!compact && (
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--label-3)] sm:inline">
          IIM Amritsar
        </span>
      )}
    </span>
  )
}

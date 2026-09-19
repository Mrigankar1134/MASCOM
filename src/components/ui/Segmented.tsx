'use client'

import { motion } from 'framer-motion'
import { useId } from 'react'
import { cn } from './cn'

type Option<T extends string> = { value: T; label: string; count?: number }

/** iOS-style segmented control with a sliding glass thumb. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: Option<T>[]
  value: T
  onChange: (next: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  const layoutId = useId()

  return (
    <div
      role="tablist"
      className={cn(
        'glass no-scrollbar relative flex overflow-x-auto rounded-full p-1',
        size === 'sm' ? 'gap-0.5' : 'gap-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'press relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors',
              size === 'sm' ? 'px-3 py-1.5 text-[12.5px]' : 'px-4 py-2 text-[13.5px]',
              active ? 'text-[var(--accent-contrast)]' : 'text-[var(--muted-fg)] hover:text-[var(--page-fg)]',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--accent)' }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span
                className="relative z-10 rounded-full px-1.5 py-0.5 text-[10.5px] tabular"
                style={{
                  background: active ? 'rgba(0,0,0,0.14)' : 'var(--hairline-soft)',
                }}
              >
                {opt.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

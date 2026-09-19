'use client'

import { motion } from 'framer-motion'
import { useId } from 'react'
import { cn } from './cn'

type Option<T extends string> = { value: T; label: string; count?: number }

/**
 * UISegmentedControl, as it actually looks: a 32pt track on a neutral fill
 * with a white (or elevated grey) thumb that slides. The thumb is not
 * tinted — in UIKit the selection reads through elevation and weight, and
 * tinting it is the giveaway that a control was drawn rather than used.
 */
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
        'no-scrollbar relative flex overflow-x-auto rounded-[9px] p-[2px]',
        size === 'sm' ? 'h-[28px]' : 'h-[32px]',
        className,
      )}
      style={{ background: 'var(--segment-track)' }}
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
              'relative flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px]',
              'px-3.5 transition-colors duration-200',
              size === 'sm' ? 't-caption-1' : 't-footnote',
              active ? 'font-semibold text-[var(--label)]' : 'font-medium text-[var(--label-2)]',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[7px]"
                style={{
                  background: 'var(--segment-thumb)',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)',
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 420 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span
                className={cn(
                  'relative z-10 text-[11px] tabular',
                  active ? 'text-[var(--label-2)]' : 'text-[var(--label-3)]',
                )}
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

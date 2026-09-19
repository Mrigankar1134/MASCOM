'use client'

import { motion } from 'framer-motion'
import { Icon } from '@/components/shell/Icons'
import { cn } from '@/components/ui/cn'

export type Step = { id: string; label: string }

export function Stepper({
  steps,
  current,
  onJump,
}: {
  steps: Step[]
  current: number
  onJump?: (index: number) => void
}) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Checkout progress">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        const reachable = i < current && !!onJump

        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1.5">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump?.(i)}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-left transition-colors',
                reachable && 'press cursor-pointer',
                !reachable && 'cursor-default',
              )}
              style={active ? { background: 'var(--glass-tint)' } : undefined}
            >
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                style={{
                  background: done || active ? 'var(--tint-solid)' : 'var(--separator-soft)',
                  color: done || active ? 'var(--tint-contrast)' : 'var(--label-3)',
                }}
              >
                {done ? <Icon.Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden truncate t-caption-1 font-semibold sm:inline',
                  active ? 'text-[var(--label)]' : 'text-[var(--label-2)]',
                )}
              >
                {step.label}
              </span>
            </button>

            {i < steps.length - 1 && (
              <span className="h-px flex-1 overflow-hidden" style={{ background: 'var(--separator)' }}>
                <motion.span
                  className="block h-full"
                  style={{ background: 'var(--tint)' }}
                  initial={false}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                />
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

'use client'

import { forwardRef } from 'react'
import { cn } from './cn'

/**
 * Apple's button roles rather than generic web variants:
 *  - filled   the one prominent action (tinted background, dark label)
 *  - tinted   a secondary action (tint at low opacity)
 *  - gray     neutral, sits on a fill
 *  - glass    a control floating over content
 *  - plain    text only
 *  - destructive
 *
 * Heights follow the HIG: 50pt for a prominent full-width action, 44pt
 * standard (the minimum comfortable target), 34pt for a compact control.
 */
type Variant = 'filled' | 'tinted' | 'gray' | 'glass' | 'plain' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
  icon?: React.ReactNode
}

const SIZES: Record<Size, string> = {
  sm: 'h-[34px] px-3.5 gap-1.5 rounded-[10px] t-footnote font-semibold',
  md: 'h-[44px] px-5 gap-2 rounded-[14px] t-callout font-semibold',
  lg: 'h-[50px] px-6 gap-2 rounded-[14px] t-body font-semibold',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'filled', size = 'md', loading, block, icon, className, children, disabled, ...rest },
  ref,
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        'btn press relative inline-flex select-none items-center justify-center',
        'transition-[background,box-shadow,opacity] duration-200',
        'disabled:cursor-not-allowed disabled:opacity-40',
        SIZES[size],
        block && 'w-full',
        variant === 'filled' && 'text-[var(--tint-contrast)]',
        variant === 'tinted' && 'text-[var(--tint)]',
        variant === 'gray' && 'text-[var(--label)]',
        variant === 'glass' && 'glass glass-lens text-[var(--label)]',
        variant === 'plain' && 'text-[var(--tint)] px-1',
        variant === 'destructive' && 'text-white',
        className,
      )}
      style={
        variant === 'filled'
          ? { background: 'var(--tint-solid)' }
          : variant === 'tinted'
            ? { background: 'var(--tint-glow)' }
            : variant === 'gray'
              ? { background: 'var(--fill-3)' }
              : variant === 'destructive'
                ? { background: 'var(--danger)' }
                : undefined
      }
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-[17px] w-[17px] animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  )
})

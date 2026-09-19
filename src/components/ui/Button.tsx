'use client'

import { forwardRef } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'glass' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
  icon?: React.ReactNode
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-2xl',
  lg: 'h-14 px-7 text-base gap-2.5 rounded-[1.25rem]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, block, icon, className, children, disabled, ...rest },
  ref,
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        'press relative inline-flex select-none items-center justify-center font-semibold',
        'transition-[background,box-shadow,opacity,transform] duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        SIZES[size],
        block && 'w-full',
        variant === 'primary' &&
          'text-[var(--accent-contrast)] shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_8px_24px_-8px_var(--accent-glow)]',
        variant === 'glass' && 'glass glass-lens text-[var(--page-fg)]',
        variant === 'ghost' && 'text-[var(--muted-fg)] hover:text-[var(--page-fg)]',
        variant === 'danger' && 'text-white',
        className,
      )}
      style={
        variant === 'primary'
          ? { background: 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 88%, white), var(--accent))' }
          : variant === 'danger'
            ? { background: 'linear-gradient(180deg, color-mix(in srgb, var(--danger) 88%, white), var(--danger))' }
            : undefined
      }
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  )
})

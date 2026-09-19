'use client'

import { forwardRef, useId } from 'react'
import { cn } from './cn'

/* Fields sit on a fill rather than inside a stroked box — UIKit uses
   elevation and inset, not outlines. 44pt tall so they clear the minimum
   touch target. */
const CONTROL =
  'w-full rounded-[12px] px-3.5 t-body text-[var(--label)] placeholder:text-[var(--label-3)] ' +
  'transition-[box-shadow,background] duration-200 outline-none border-0 ' +
  'focus:shadow-[0_0_0_3.5px_var(--tint-glow)]'

type FieldWrapProps = {
  label?: string
  hint?: string
  error?: string | null
  children: (id: string) => React.ReactNode
  className?: string
}

export function Field({ label, hint, error, children, className }: FieldWrapProps) {
  const id = useId()
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="t-footnote block px-1 font-medium text-[var(--label-2)]">
          {label}
        </label>
      )}
      {children(id)}
      {error ? (
        <p className="t-caption-1 px-1 font-medium text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="t-caption-1 px-1 text-[var(--label-3)]">{hint}</p>
      ) : null}
    </div>
  )
}

function fieldStyle(error?: string | null): React.CSSProperties {
  return {
    background: 'var(--field-bg)',
    boxShadow: error ? 'inset 0 0 0 1.5px var(--danger)' : undefined,
  }
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string | null
  wrapClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, wrapClassName, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} className={wrapClassName}>
      {(id) => (
        <input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          className={cn(CONTROL, 'h-[44px]', className)}
          style={fieldStyle(error)}
          {...rest}
        />
      )}
    </Field>
  )
})

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: string | null
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) => (
        <textarea
          id={id}
          ref={ref}
          aria-invalid={!!error}
          className={cn(CONTROL, 'min-h-[92px] py-3 leading-relaxed', className)}
          style={fieldStyle(error)}
          {...rest}
        />
      )}
    </Field>
  )
})

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string | null
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, children, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) => (
        <select
          id={id}
          ref={ref}
          className={cn(CONTROL, 'h-[44px] appearance-none pr-10', className)}
          style={fieldStyle(error)}
          {...rest}
        >
          {children}
        </select>
      )}
    </Field>
  )
})

/**
 * A field as a grouped-list row: label on the left, value on the right.
 * This is how iOS lays out forms, and it reads far better than a stack of
 * boxed inputs on a detail screen.
 */
export const FieldRow = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }
>(function FieldRow({ label, error, className, ...rest }, ref) {
  const id = useId()
  return (
    <div className="ios-row">
      <label htmlFor={id} className="t-body w-[7.5rem] shrink-0 text-[var(--label)]">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent t-body text-right outline-none',
          'placeholder:text-[var(--label-3)]',
          error && 'text-[var(--danger)]',
          className,
        )}
        {...rest}
      />
    </div>
  )
})

/** iOS switch. */
export function Toggle({
  checked,
  onChange,
  label,
  name,
  defaultChecked,
}: {
  checked?: boolean
  onChange?: (next: boolean) => void
  label: string
  name?: string
  defaultChecked?: boolean
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer sr-only"
        aria-label={label}
      />
      <span
        className="h-[31px] w-[51px] rounded-full transition-colors duration-300 peer-checked:bg-[var(--ok)]"
        style={{ background: 'var(--fill-2)' }}
      />
      <span
        className="pointer-events-none absolute left-[2px] h-[27px] w-[27px] rounded-full bg-white transition-transform duration-300 peer-checked:translate-x-[20px]"
        style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.16)' }}
      />
    </label>
  )
}

'use client'

import { forwardRef, useId } from 'react'
import { cn } from './cn'

const CONTROL =
  'w-full rounded-2xl px-4 text-[15px] text-[var(--page-fg)] placeholder:text-[var(--faint-fg)] ' +
  'transition-[border-color,box-shadow,background] duration-200 outline-none ' +
  'focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-glow)]'

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
        <label htmlFor={id} className="block text-[13px] font-medium text-[var(--muted-fg)]">
          {label}
        </label>
      )}
      {children(id)}
      {error ? (
        <p className="text-[12.5px] font-medium" style={{ color: 'var(--danger)' }} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] text-[var(--faint-fg)]">{hint}</p>
      ) : null}
    </div>
  )
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
          className={cn(CONTROL, 'h-12 border', className)}
          style={{
            background: 'var(--field-bg)',
            borderColor: error ? 'var(--danger)' : 'var(--field-border)',
          }}
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
          className={cn(CONTROL, 'min-h-24 border py-3 leading-relaxed', className)}
          style={{
            background: 'var(--field-bg)',
            borderColor: error ? 'var(--danger)' : 'var(--field-border)',
          }}
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
          className={cn(CONTROL, 'h-12 appearance-none border pr-10', className)}
          style={{
            background: 'var(--field-bg)',
            borderColor: error ? 'var(--danger)' : 'var(--field-border)',
          }}
          {...rest}
        >
          {children}
        </select>
      )}
    </Field>
  )
})

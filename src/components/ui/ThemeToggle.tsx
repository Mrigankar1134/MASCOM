'use client'

import { useTheme, type ThemePref } from './ThemeProvider'
import { cn } from './cn'

const OPTIONS: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'Auto',
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    ),
  },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme()

  return (
    <div
      className={cn('glass inline-flex items-center gap-0.5 rounded-full p-0.5', className)}
      role="radiogroup"
      aria-label="Colour theme"
    >
      {OPTIONS.map((opt) => {
        const active = preference === opt.value
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            title={`${opt.label} theme`}
            onClick={() => setPreference(opt.value)}
            className={cn(
              'press relative z-10 grid h-8 w-8 place-items-center rounded-full transition-colors',
              active ? 'text-[var(--accent-contrast)]' : 'text-[var(--muted-fg)] hover:text-[var(--page-fg)]',
            )}
            style={active ? { background: 'var(--accent-solid)' } : undefined}
          >
            {opt.icon}
          </button>
        )
      })}
    </div>
  )
}

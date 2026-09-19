'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/shell/Icons'
import { Wordmark } from '@/components/shell/Wordmark'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app]', error)
  }, [error])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-16">
      <Link href="/" className="press mb-8">
        <Wordmark />
      </Link>

      <Glass tone="strong" className="w-full max-w-md p-8 text-center">
        <span
          className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
        >
          <Icon.Alert size={24} />
        </span>

        <h1 className="mt-5 t-title-3 font-semibold tracking-tight">Something broke</h1>
        <p className="mt-2 t-subhead leading-relaxed text-[var(--label-2)]">
          This is on us, not you. Try again — if it keeps happening, send a coordinator the code
          below.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono t-caption-1 text-[var(--label-3)]">{error.digest}</p>
        )}

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button onClick={reset} icon={<Icon.Refresh size={16} />}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="glass" block>
              Back to home
            </Button>
          </Link>
        </div>
      </Glass>
    </main>
  )
}

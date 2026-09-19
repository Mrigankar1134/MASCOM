'use client'

import { useEffect, useState } from 'react'
import { formatDate, formatDateTime, relativeTime } from '@/lib/format'

/**
 * Dates are the one thing that cannot be rendered identically on both sides of
 * hydration: the server renders in its own timezone, at its own instant, so
 * "3m ago" becomes "4m ago" by the time the client reaches it and React throws
 * the whole tree away. These two components render a stable string on the
 * server and settle to the viewer's own reading once mounted.
 */
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

export function TimeAgo({
  value,
  className,
}: {
  value?: string | Date | null
  className?: string
}) {
  const mounted = useMounted()
  const [, tick] = useState(0)

  // Keep "just now" from going stale while someone watches the queue.
  useEffect(() => {
    if (!value) return
    const id = setInterval(() => tick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [value])

  if (!value) return <span className={className}>-</span>

  return (
    <span className={className} suppressHydrationWarning>
      {mounted ? relativeTime(value) : formatDate(value)}
    </span>
  )
}

export function DateTime({
  value,
  mode = 'datetime',
  className,
}: {
  value?: string | Date | null
  mode?: 'date' | 'datetime'
  className?: string
}) {
  if (!value) return <span className={className}>-</span>

  // Same format on both sides; suppressHydrationWarning covers the server
  // rendering this in UTC while the viewer reads it in their own timezone.
  return (
    <span className={className} suppressHydrationWarning>
      {mode === 'date' ? formatDate(value) : formatDateTime(value)}
    </span>
  )
}

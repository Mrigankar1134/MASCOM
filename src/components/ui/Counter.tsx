'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/**
 * Counts up to a number the first time it scrolls into view, then stops.
 *
 * Only the digits animate: any prefix or suffix (a currency symbol, a "+")
 * is held steady, so "800+" does not flicker its plus sign on every frame.
 * With reduced motion the final value is rendered immediately.
 */
export function Counter({
  value,
  duration = 1.4,
  className,
}: {
  value: string | number
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()

  const text = String(value)
  const match = text.match(/^(\D*)([\d,]+)(.*)$/)
  const target = match ? Number(match[2].replace(/,/g, '')) : NaN

  const [shown, setShown] = useState(() => (Number.isNaN(target) ? 0 : target))

  useEffect(() => {
    if (Number.isNaN(target)) return
    if (reduced || !inView) {
      setShown(target)
      return
    }

    setShown(0)
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1)
      // Ease out so it decelerates into the final number.
      setShown(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, target, duration, reduced])

  if (Number.isNaN(target) || !match) {
    return (
      <span ref={ref} className={className}>
        {text}
      </span>
    )
  }

  return (
    <span ref={ref} className={className}>
      {match[1]}
      {shown.toLocaleString('en-IN')}
      {match[3]}
    </span>
  )
}

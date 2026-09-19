'use client'

import { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'

const COLORS = ['var(--tint-solid)', 'var(--ok)', 'var(--info)', 'var(--tint)']

/**
 * A short burst of confetti for the moment an order goes through. Pure CSS
 * animation on a handful of spans, cleaned up by the parent unmounting it,
 * and skipped entirely for anyone who asked for reduced motion.
 */
export function Celebrate({ pieces = 26 }: { pieces?: number }) {
  const reduced = useReducedMotion()

  const shards = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => {
        const angle = (i / pieces) * Math.PI * 2 + Math.random() * 0.4
        const distance = 90 + Math.random() * 130
        return {
          id: i,
          dx: `${Math.cos(angle) * distance}px`,
          dy: `${Math.sin(angle) * distance - 40}px`,
          dr: `${(Math.random() - 0.5) * 720}deg`,
          delay: Math.random() * 0.12,
          duration: 0.9 + Math.random() * 0.5,
          color: COLORS[i % COLORS.length],
          size: 5 + Math.random() * 5,
          round: Math.random() > 0.5,
        }
      }),
    [pieces],
  )

  if (reduced) return null

  return (
    // Fixed rather than absolute so the burst is never clipped by the card
    // that triggered it. Zero-sized, so it is purely an origin point.
    <div className="pointer-events-none fixed left-1/2 top-[30%] z-30 h-0 w-0" aria-hidden>
      {shards.map((s) => (
        <span
          key={s.id}
          className="absolute block"
          style={{
            width: s.size,
            height: s.size * (s.round ? 1 : 1.8),
            borderRadius: s.round ? '50%' : '1px',
            background: s.color,
            animation: `shard ${s.duration}s var(--ease-glass) ${s.delay}s forwards`,
            ['--dx' as string]: s.dx,
            ['--dy' as string]: s.dy,
            ['--dr' as string]: s.dr,
          }}
        />
      ))}
    </div>
  )
}

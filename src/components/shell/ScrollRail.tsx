'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * A hairline of tint across the top of the page that fills as you read.
 * Pinned above the nav so it reads as chrome rather than as content, and
 * driven by a spring so it glides instead of stepping with each scroll tick.
 */
export function ScrollRail() {
  const { scrollYProgress } = useScroll()
  const width = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 })

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left"
      style={{
        scaleX: width,
        background:
          'linear-gradient(90deg, var(--tint-solid), color-mix(in srgb, var(--tint-solid) 55%, white))',
      }}
    />
  )
}

'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Lets a glass surface catch the light as the pointer moves across it.
 *
 * Writes the pointer position straight to CSS custom properties rather than
 * through React state, so moving the mouse never triggers a render. Updates
 * are coalesced into one animation frame, and a pointer that cannot hover
 * (a finger) never fires any of this, leaving the static highlight in place.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const frame = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  const onPointerMove = useCallback((event: React.PointerEvent<T>) => {
    const el = ref.current
    if (!el || event.pointerType === 'touch') return

    const rect = el.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
    })
  }, [])

  return { ref, onPointerMove, className: 'spotlight' as const }
}

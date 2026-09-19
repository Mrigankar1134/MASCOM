'use client'

import { useSpotlight } from '@/lib/client/spotlight'
import { cn } from './cn'

type GlassProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside' | 'li'
  /** How much the surface is tinted. `strong` for content that must stay legible. */
  tone?: 'default' | 'strong' | 'faint'
  /** Adds the lens flare highlight. On by default for cards. */
  lens?: boolean
  lifted?: boolean
  interactive?: boolean
  /** Lets the highlight follow the pointer across the surface. */
  spotlight?: boolean
}

export function Glass({
  as: Tag = 'div',
  tone = 'default',
  lens = true,
  lifted = false,
  interactive = false,
  spotlight = false,
  className,
  children,
  ...rest
}: GlassProps) {
  const spot = useSpotlight<HTMLElement>()

  return (
    <Tag
      // The tag is polymorphic, so the ref is widened to HTMLElement here;
      // the hook only ever reads getBoundingClientRect off it.
      ref={spotlight ? (spot.ref as React.Ref<never>) : undefined}
      onPointerMove={spotlight ? spot.onPointerMove : undefined}
      className={cn(
        'glass rounded-[var(--radius-xl)]',
        tone === 'strong' && 'glass-strong',
        tone === 'faint' && 'glass-faint',
        lens && 'glass-lens',
        lifted && 'glass-lifted',
        interactive && 'glass-interactive',
        spotlight && 'spotlight',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

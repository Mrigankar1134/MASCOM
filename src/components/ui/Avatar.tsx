import Image from 'next/image'
import { initials } from '@/lib/format'
import { cn } from './cn'

/**
 * Falls back to a monogram when someone has no photo, used heavily in the
 * recipient picker, where a face makes it obvious who you are paying.
 */
export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name?: string | null
  src?: string | null
  size?: number
  className?: string
}) {
  const label = initials(name)
  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: src ? 'transparent' : 'var(--tint-glow)',
        color: 'var(--tint)',
        boxShadow: 'inset 0 0 0 1px var(--separator)',
      }}
    >
      {src ? (
        // The span above is explicitly sized, so fill cannot shift layout.
        <Image src={src} alt={name ?? ''} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span aria-hidden>{label}</span>
      )}
    </span>
  )
}

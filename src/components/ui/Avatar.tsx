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
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ''} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span aria-hidden>{label}</span>
      )}
    </span>
  )
}

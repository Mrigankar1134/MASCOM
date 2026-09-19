import { cn } from './cn'

type GlassProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside' | 'li'
  /** How much the surface is tinted. `strong` for content that must stay legible. */
  tone?: 'default' | 'strong' | 'faint'
  /** Adds the lens flare highlight. On by default for cards. */
  lens?: boolean
  lifted?: boolean
  interactive?: boolean
}

export function Glass({
  as: Tag = 'div',
  tone = 'default',
  lens = true,
  lifted = false,
  interactive = false,
  className,
  children,
  ...rest
}: GlassProps) {
  return (
    <Tag
      className={cn(
        'glass rounded-[var(--radius-glass)]',
        tone === 'strong' && 'glass-strong',
        tone === 'faint' && 'glass-faint',
        lens && 'glass-lens',
        lifted && 'glass-lifted',
        interactive && 'glass-interactive',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

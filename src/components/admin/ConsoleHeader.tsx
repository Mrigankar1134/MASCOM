/**
 * The header every console screen sits under. macOS leads with a compact
 * title and puts the actions on the trailing edge of the same line, rather
 * than the oversized display type a marketing page would use.
 */
export function ConsoleHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="t-title-1">{title}</h1>
        {subtitle && (
          <p className="t-subhead mt-1.5 max-w-2xl text-[var(--label-2)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function money(value: number | null | undefined): string {
  return inr.format(Number(value ?? 0))
}

export function compactMoney(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(n >= 10_00_000 ? 0 : 1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return `₹${n}`
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return '-'
  const then = new Date(value).getTime()
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '@/components/shell/Icons'
import { Wordmark } from '@/components/shell/Wordmark'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/components/ui/cn'

export type ConsoleUser = {
  name: string
  email: string
  photo: string | null
  isAdmin: boolean
  isStaff: boolean
  recipientName: string | null
}

type NavItem = {
  href: string
  label: string
  icon: (p: { size?: number; className?: string; strokeWidth?: number }) => React.ReactNode
  staffOnly?: boolean
  adminOnly?: boolean
  badge?: number
}

/**
 * Desktop-first console shell: a permanent sidebar from `lg` up, and a
 * slide-over drawer below that so a coordinator can still verify a payment
 * from their phone while standing at the collection counter.
 */
export function ConsoleShell({
  user,
  pendingCount,
  children,
}: {
  user: ConsoleUser
  pendingCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const allItems: NavItem[] = [
    { href: '/admin', label: 'Overview', icon: Icon.Chart },
    { href: '/admin/verify', label: 'Verify payments', icon: Icon.CheckCircle, badge: pendingCount },
    { href: '/admin/orders', label: 'Orders', icon: Icon.Receipt, staffOnly: true },
    { href: '/admin/products', label: 'Drops', icon: Icon.Box, staffOnly: true },
    { href: '/admin/recipients', label: 'Collections', icon: Icon.Wallet, staffOnly: true },
    { href: '/admin/batches', label: 'Runs & coupons', icon: Icon.Truck, staffOnly: true },
    { href: '/admin/users', label: 'People', icon: Icon.Users, staffOnly: true },
  ]

  const items = allItems.filter((item) => {
    if (item.adminOnly) return user.isAdmin
    if (item.staffOnly) return user.isStaff
    return true
  })

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  // macOS groups a source list under small-caps headers rather than running
  // every destination together.
  const groups: { title: string; items: NavItem[] }[] = [
    { title: 'Collect', items: items.filter((i) => ['/admin', '/admin/verify'].includes(i.href)) },
    { title: 'Manage', items: items.filter((i) => !['/admin', '/admin/verify'].includes(i.href)) },
  ].filter((g) => g.items.length > 0)

  const nav = (onNavigate?: () => void) => (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto" aria-label="Console">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--label-3)]">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
      {group.items.map((item) => {
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        const ItemIcon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-[30px] items-center gap-2.5 rounded-[7px] px-2.5 t-footnote transition-colors',
              active
                ? 'font-semibold text-[var(--tint-contrast)]'
                : 'font-medium text-[var(--label-2)] hover:bg-[var(--fill-4)] hover:text-[var(--label)]',
            )}
          >
            {active && (
              <motion.span
                layoutId="console-nav"
                className="absolute inset-0 rounded-[7px]"
                style={{ background: 'var(--tint-solid)' }}
                transition={{ type: 'spring', damping: 32, stiffness: 420 }}
              />
            )}
            <span className="relative z-10">
              <ItemIcon size={16} strokeWidth={1.9} />
            </span>
            <span className="relative z-10 flex-1 truncate">{item.label}</span>
            {!!item.badge && item.badge > 0 && (
              <span
                className="relative z-10 rounded-full px-1.5 text-[11px] font-semibold leading-[17px] tabular"
                style={{
                  background: active ? 'rgba(0,0,0,0.18)' : 'var(--fill-2)',
                  color: active ? 'var(--tint-contrast)' : 'var(--label-2)',
                }}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        )
      })}
          </div>
        </div>
      ))}
    </nav>
  )

  const identity = (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 rounded-[10px] p-2" style={{ background: 'var(--fill-4)' }}>
        <Avatar name={user.name} src={user.photo} size={30} />
        <div className="min-w-0 flex-1">
          <p className="truncate t-caption-1 font-semibold">{user.name}</p>
          <p className="truncate text-[11px] text-[var(--label-3)]">
            {user.isAdmin
              ? 'Admin'
              : user.isStaff
                ? 'Moderator'
                : `Collecting as ${user.recipientName ?? 'recipient'}`}
          </p>
        </div>
        <button
          onClick={signOut}
          className="press grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--label-3)] hover:text-[var(--label)]"
          aria-label="Sign out"
          title="Sign out"
        >
          <Icon.Logout size={15} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href="/shop"
          className="press flex-1 whitespace-nowrap rounded-[7px] px-2.5 py-1.5 text-center t-caption-1 font-medium text-[var(--label-2)]"
          style={{ background: 'var(--fill-4)' }}
        >
          Back to shop
        </Link>
        <ThemeToggle />
      </div>
    </div>
  )

  return (
    <div className="flex min-h-dvh">
      {/* ── Sidebar (desktop) ──────────────────────────────────────────── */}
      <aside
        className="glass-chrome sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col gap-4 border-r p-3 lg:flex"
        style={{ borderColor: 'var(--separator-soft)' }}
      >
        <Link href="/admin" className="press px-2 pb-1 pt-3">
          <Wordmark compact />
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--label-3)]">
            Console
          </p>
        </Link>
        {nav()}
        {identity}
      </aside>

      {/* ── Drawer (mobile) ────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              className="glass glass-lifted absolute inset-y-0 left-0 flex w-72 flex-col gap-5 rounded-r-[var(--radius-sheet)] p-4 pt-[max(1rem,env(safe-area-inset-top))]"
            >
              <div className="flex items-center justify-between px-2">
                <Wordmark compact />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="press grid h-9 w-9 place-items-center rounded-full"
                  aria-label="Close"
                >
                  <Icon.X size={18} />
                </button>
              </div>
              {nav(() => setDrawerOpen(false))}
              {identity}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Mobile top bar ───────────────────────────────────────────── */}
        <header
          className="glass-chrome sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden"
          style={{ borderColor: 'var(--separator-soft)' }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="press grid h-10 w-10 place-items-center rounded-xl"
            style={{ background: 'var(--separator-soft)' }}
            aria-label="Open menu"
          >
            <Icon.Menu size={19} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="t-caption-2 font-semibold uppercase tracking-[0.16em] text-[var(--label-3)]">
              Console
            </p>
            <p className="truncate t-subhead font-semibold">
              {items.find((i) =>
                i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href),
              )?.label ?? 'Console'}
            </p>
          </div>
          {pendingCount > 0 && (
            <Link
              href="/admin/verify"
              className="press rounded-full px-3 py-1.5 t-caption-1 font-bold tabular"
              style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}
            >
              {pendingCount} to verify
            </Link>
          )}
        </header>

        <main className="min-w-0 flex-1 px-4 pb-16 pt-4 sm:px-6 lg:px-8 lg:pt-6">{children}</main>
      </div>
    </div>
  )
}

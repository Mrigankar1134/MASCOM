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
  icon: (p: { size?: number; className?: string }) => React.ReactNode
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

  const nav = (onNavigate?: () => void) => (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Console">
      {items.map((item) => {
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
              'press relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors',
              active
                ? 'text-[var(--accent-contrast)]'
                : 'text-[var(--muted-fg)] hover:text-[var(--page-fg)]',
            )}
          >
            {active && (
              <motion.span
                layoutId="console-nav"
                className="absolute inset-0 rounded-xl"
                style={{ background: 'var(--accent-solid)' }}
                transition={{ type: 'spring', damping: 32, stiffness: 420 }}
              />
            )}
            <span className="relative z-10">
              <ItemIcon size={18} />
            </span>
            <span className="relative z-10 flex-1">{item.label}</span>
            {!!item.badge && item.badge > 0 && (
              <span
                className="relative z-10 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular"
                style={{
                  background: active ? 'rgba(0,0,0,0.16)' : 'var(--warn-bg)',
                  color: active ? 'var(--accent-contrast)' : 'var(--warn)',
                }}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  const identity = (
    <div className="space-y-3">
      <div className="glass flex items-center gap-3 rounded-2xl p-3">
        <Avatar name={user.name} src={user.photo} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold">{user.name}</p>
          <p className="truncate text-[11.5px] text-[var(--faint-fg)]">
            {user.isAdmin
              ? 'Admin'
              : user.isStaff
                ? 'Moderator'
                : `Collecting as ${user.recipientName ?? 'recipient'}`}
          </p>
        </div>
        <button
          onClick={signOut}
          className="press grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--faint-fg)]"
          aria-label="Sign out"
          title="Sign out"
        >
          <Icon.Logout size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href="/shop"
          className="press flex-1 rounded-xl px-3 py-2 text-center text-[12.5px] font-semibold text-[var(--muted-fg)]"
          style={{ background: 'var(--hairline-soft)' }}
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
        className="glass-chrome sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r p-4 lg:flex"
        style={{ borderColor: 'var(--hairline-soft)' }}
      >
        <Link href="/admin" className="press px-2 pt-2">
          <Wordmark compact />
          <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--faint-fg)]">
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
          style={{ borderColor: 'var(--hairline-soft)' }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="press grid h-10 w-10 place-items-center rounded-xl"
            style={{ background: 'var(--hairline-soft)' }}
            aria-label="Open menu"
          >
            <Icon.Menu size={19} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--faint-fg)]">
              Console
            </p>
            <p className="truncate text-[15px] font-semibold">
              {items.find((i) =>
                i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href),
              )?.label ?? 'Console'}
            </p>
          </div>
          {pendingCount > 0 && (
            <Link
              href="/admin/verify"
              className="press rounded-full px-3 py-1.5 text-[12px] font-bold tabular"
              style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}
            >
              {pendingCount} to verify
            </Link>
          )}
        </header>

        <main className="min-w-0 flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">{children}</main>
      </div>
    </div>
  )
}

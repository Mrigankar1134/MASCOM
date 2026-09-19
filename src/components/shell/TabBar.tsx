'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Icon } from './Icons'
import { useCart } from '@/lib/client/cart'
import { useSession, canOpenConsole } from '@/lib/client/session'
import { cn } from '@/components/ui/cn'

type Tab = {
  href: string
  label: string
  icon: (p: { size?: number; className?: string }) => React.ReactNode
  match: (path: string) => boolean
  badge?: number
}

/**
 * The primary navigation on phones: a floating glass tab bar pinned above the
 * home indicator. Everything a student needs mid-drop is one thumb away.
 */
export function TabBar() {
  const pathname = usePathname()
  const { count } = useCart()
  const user = useSession()

  const tabs: Tab[] = [
    { href: '/shop', label: 'Shop', icon: Icon.Grid, match: (p) => p.startsWith('/shop') },
    { href: '/bag', label: 'Bag', icon: Icon.Bag, match: (p) => p.startsWith('/bag'), badge: count },
    {
      href: '/orders',
      label: 'Orders',
      icon: Icon.Receipt,
      match: (p) => p.startsWith('/orders'),
    },
    canOpenConsole(user)
      ? { href: '/admin', label: 'Console', icon: Icon.Shield, match: (p) => p.startsWith('/admin') }
      : { href: '/account', label: 'You', icon: Icon.User, match: (p) => p.startsWith('/account') },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Primary"
    >
      <div className="glass glass-lens glass-lifted mx-auto flex max-w-md items-stretch gap-1 rounded-[1.4rem] p-1.5">
        {tabs.map((tab) => {
          const active = tab.match(pathname)
          const TabIcon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'press relative flex flex-1 flex-col items-center gap-1 rounded-[1.05rem] py-2 transition-colors',
                active ? 'text-[var(--accent-contrast)]' : 'text-[var(--muted-fg)]',
              )}
            >
              {active && (
                <motion.span
                  layoutId="tabbar-thumb"
                  className="absolute inset-0 rounded-[1.05rem]"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <span className="relative z-10">
                <TabIcon size={21} />
                {!!tab.badge && tab.badge > 0 && (
                  <span
                    className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold tabular"
                    style={{
                      background: active ? 'var(--accent-contrast)' : 'var(--accent)',
                      color: active ? 'var(--accent)' : 'var(--accent-contrast)',
                    }}
                  >
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </span>
              <span className="relative z-10 text-[10.5px] font-semibold tracking-tight">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

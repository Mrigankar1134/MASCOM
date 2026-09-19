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
  icon: (p: { size?: number; className?: string; strokeWidth?: number }) => React.ReactNode
  match: (path: string) => boolean
  badge?: number
}

/**
 * A floating glass tab bar. Selection reads through tint and weight rather
 * than a heavy filled pill, the capsule behind the active tab stays at low
 * opacity so the bar still looks like glass over the content beneath it.
 */
export function TabBar() {
  const pathname = usePathname()
  const { count } = useCart()
  const user = useSession()

  const tabs: Tab[] = [
    { href: '/shop', label: 'Shop', icon: Icon.Grid, match: (p) => p.startsWith('/shop') },
    { href: '/bag', label: 'Bag', icon: Icon.Bag, match: (p) => p.startsWith('/bag'), badge: count },
    { href: '/orders', label: 'Orders', icon: Icon.Receipt, match: (p) => p.startsWith('/orders') },
    canOpenConsole(user)
      ? { href: '/admin', label: 'Console', icon: Icon.Shield, match: (p) => p.startsWith('/admin') }
      : { href: '/account', label: 'You', icon: Icon.User, match: (p) => p.startsWith('/account') },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Primary"
    >
      <div className="glass glass-lens glass-lifted mx-auto flex max-w-md items-stretch gap-1 rounded-[26px] p-1.5">
        {tabs.map((tab) => {
          const active = tab.match(pathname)
          const TabIcon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'press relative flex min-h-[49px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[20px] transition-colors',
                active ? 'text-[var(--tint)]' : 'text-[var(--label-2)]',
              )}
            >
              {active && (
                <motion.span
                  layoutId="tabbar-thumb"
                  className="absolute inset-0 rounded-[20px]"
                  style={{ background: 'var(--tint-glow)' }}
                  transition={{ type: 'spring', damping: 32, stiffness: 420 }}
                />
              )}
              <span className="relative z-10">
                <TabIcon size={25} strokeWidth={active ? 2.1 : 1.8} />
                {!!tab.badge && tab.badge > 0 && (
                  <span
                    className="absolute -right-2.5 -top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[11px] font-semibold tabular"
                    style={{ background: 'var(--danger)', color: '#fff' }}
                  >
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'relative z-10 text-[10px] leading-[12px] tracking-[0.005em]',
                  active ? 'font-semibold' : 'font-medium',
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

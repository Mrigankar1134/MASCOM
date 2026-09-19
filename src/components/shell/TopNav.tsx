'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from './Icons'
import { Wordmark } from './Wordmark'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Avatar } from '@/components/ui/Avatar'
import { useCart } from '@/lib/client/cart'
import { canOpenConsole, useSession } from '@/lib/client/session'
import { cn } from '@/components/ui/cn'

const LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/orders', label: 'Orders' },
  { href: '/#about', label: 'About' },
  { href: '/#team', label: 'Team' },
]

/**
 * Desktop navigation. On phones it collapses to a slim glass header — the
 * TabBar carries navigation there instead.
 */
export function TopNav({ transparentUntilScroll = false }: { transparentUntilScroll?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useSession()
  const { count } = useCart()
  const [scrolled, setScrolled] = useState(!transparentUntilScroll)

  useEffect(() => {
    if (!transparentUntilScroll) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparentUntilScroll])

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors duration-300',
        scrolled && 'glass-chrome border-b',
      )}
      style={scrolled ? { borderColor: 'var(--separator-soft)' } : undefined}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:h-[68px]">
        <Link href="/" className="press shrink-0" aria-label="MASCOM home">
          <Wordmark />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Sections">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-full px-3.5 py-2 t-subhead font-medium transition-colors',
                pathname === link.href
                  ? 'text-[var(--label)]'
                  : 'text-[var(--label-2)] hover:text-[var(--label)]',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />

          <Link
            href="/bag"
            className="glass press relative hidden h-10 w-10 place-items-center rounded-full lg:grid"
            aria-label={`Bag${count ? `, ${count} items` : ''}`}
          >
            <Icon.Bag size={19} />
            {count > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold tabular"
                style={{ background: 'var(--tint-solid)', color: 'var(--tint-contrast)' }}
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              {canOpenConsole(user) && (
                <Link
                  href="/admin"
                  className="glass press hidden items-center gap-2 rounded-full px-3.5 py-2 t-footnote font-semibold lg:inline-flex"
                >
                  <Icon.Shield size={16} />
                  Console
                </Link>
              )}
              <Link href="/account" className="press" aria-label="Your account">
                <Avatar name={user.name} src={user.profilePicUrl} size={36} />
              </Link>
              <button
                onClick={signOut}
                className="glass press hidden h-10 w-10 place-items-center rounded-full text-[var(--label-2)] lg:grid"
                aria-label="Sign out"
                title="Sign out"
              >
                <Icon.Logout size={18} />
              </button>
            </div>
          ) : (
            <Link
              href="/signin"
              className="press inline-flex h-10 items-center rounded-full px-4 t-footnote font-semibold"
              style={{ background: 'var(--tint-solid)', color: 'var(--tint-contrast)' }}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

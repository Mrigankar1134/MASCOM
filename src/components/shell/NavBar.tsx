'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { Icon } from './Icons'
import { cn } from '@/components/ui/cn'

/**
 * The iOS large-title navigation bar.
 *
 * At rest the title sits large below a 44pt bar. As the page scrolls the
 * large title rises and fades out, the bar picks up its material and
 * hairline, and the title reappears inline. Getting this transition right
 * is most of what makes a screen feel native rather than like a web page
 * with big text at the top.
 */
export function NavBar({
  title,
  subtitle,
  back,
  trailing,
  children,
}: {
  title: string
  subtitle?: string
  /** Shows a back chevron pointing at this href. */
  back?: { href: string; label?: string }
  trailing?: React.ReactNode
  /** Content pinned under the title, e.g. a segmented control. */
  children?: React.ReactNode
}) {
  const { scrollY } = useScroll()
  const [collapsed, setCollapsed] = useState(false)

  useMotionValueEvent(scrollY, 'change', (y) => setCollapsed(y > 36))

  const largeOpacity = useTransform(scrollY, [0, 34], [1, 0])
  const largeY = useTransform(scrollY, [0, 52], [0, -14])

  return (
    <>
      <header
        className={cn(
          // Phones get the collapsing bar; on desktop the top nav already
          // carries wayfinding, so only the large title remains.
          'sticky top-0 z-40 transition-[background,box-shadow] duration-300 lg:hidden',
          collapsed && 'glass-chrome',
        )}
        style={
          collapsed
            ? { boxShadow: 'inset 0 -0.5px 0 var(--separator)' }
            : undefined
        }
      >
        <div className="flex h-[var(--nav-h)] items-center gap-2 px-4 pt-[env(safe-area-inset-top)]">
          {back && (
            <Link
              href={back.href}
              className="press -ml-2 flex shrink-0 items-center gap-0.5 pr-1 text-[var(--tint)]"
            >
              <Icon.ChevronLeft size={19} strokeWidth={2.5} />
              {back.label && <span className="t-body max-w-[8rem] truncate">{back.label}</span>}
            </Link>
          )}

          {/* Inline title fades in exactly as the large one leaves */}
          <motion.h1
            animate={{ opacity: collapsed ? 1 : 0, y: collapsed ? 0 : 6 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="t-headline min-w-0 flex-1 truncate text-center"
          >
            {title}
          </motion.h1>

          <div className="flex shrink-0 items-center gap-1.5">{trailing}</div>
        </div>
      </header>

      <motion.div style={{ opacity: largeOpacity, y: largeY }} className="px-4 pb-1 pt-1 lg:hidden">
        <h1 className="t-large-title">{title}</h1>
        {subtitle && <p className="t-subhead mt-1.5 max-w-lg text-[var(--label-2)]">{subtitle}</p>}
      </motion.div>

      {/* Desktop keeps a static title, no collapse, nothing to scroll away. */}
      <div className="hidden px-4 pb-2 pt-4 lg:block">
        <h1 className="display text-[2.75rem]">{title}</h1>
        {subtitle && <p className="t-body mt-2 max-w-xl text-[var(--label-2)]">{subtitle}</p>}
      </div>

      {children && <div className="px-4 pb-1 pt-2">{children}</div>}
    </>
  )
}

/** A circular glass control for the nav bar's trailing edge. */
export function NavButton({
  children,
  onClick,
  href,
  label,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  label: string
}) {
  const cls =
    'glass press grid h-9 w-9 place-items-center rounded-full text-[var(--label)]'
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={label}>
        {children}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={cls} aria-label={label}>
      {children}
    </button>
  )
}

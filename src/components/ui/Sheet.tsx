'use client'

import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from './cn'

type SheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  /** Desktop width. Mobile is always full-width. */
  size?: 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}

const WIDTHS = { md: 'sm:max-w-md', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }

/**
 * One component, two behaviours: a drag-dismissable bottom sheet on phones,
 * a centred dialog on larger screens. Both are the same glass material.
 */
export function Sheet({ open, onClose, title, description, children, size = 'md', footer }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            aria-label="Close"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={onDragEnd}
            initial={{ y: '100%', opacity: 0.6, scale: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', damping: 34, stiffness: 340 }}
            className={cn(
              'glass glass-strong glass-lens glass-lifted relative flex max-h-[92dvh] w-full flex-col',
              'rounded-t-[var(--radius-sheet)] sm:rounded-[28px]',
              WIDTHS[size],
            )}
          >
            {/* The grabber: 36×5pt, as UIKit draws it. */}
            <div className="flex shrink-0 justify-center pt-[5px] sm:hidden">
              <span
                className="h-[5px] w-[36px] rounded-full"
                style={{ background: 'var(--label-4)' }}
              />
            </div>

            {(title || description) && (
              <header className="shrink-0 px-5 pb-4 pt-4 sm:px-6 sm:pt-6">
                {title && <h2 className="t-title-2">{title}</h2>}
                {description && (
                  <p className="t-subhead mt-1.5 text-[var(--label-2)]">{description}</p>
                )}
              </header>
            )}

            <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
              {children}
            </div>

            {footer && (
              <footer
                className="shrink-0 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
                style={{ borderColor: 'var(--separator-soft)' }}
              >
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

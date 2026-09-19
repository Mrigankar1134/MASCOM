'use client'

import { motion } from 'framer-motion'
import type { ShopRecipient } from '@/lib/data'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/shell/Icons'
import { cn } from '@/components/ui/cn'

/**
 * Choosing who you pay is the single most consequential step in this flow:
 * it decides whose QR you scan AND whose queue your order lands in. So each
 * option is a large, unmistakable target that shows the person and the handle.
 */
export function RecipientPicker({
  recipients,
  selectedId,
  onSelect,
}: {
  recipients: ShopRecipient[]
  selectedId: string | null
  onSelect: (recipient: ShopRecipient) => void
}) {
  return (
    <ul className="space-y-2.5" role="radiogroup" aria-label="Who are you paying?">
      {recipients.map((recipient, i) => {
        const selected = recipient._id === selectedId
        return (
          <motion.li
            key={recipient._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04, ease: [0.32, 0.72, 0, 1] }}
          >
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(recipient)}
              className={cn(
                'press glass glass-lens flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-shadow',
                selected && 'glass-lifted',
              )}
              style={
                selected
                  ? { boxShadow: '0 0 0 2px var(--tint), var(--glass-shadow-lifted)' }
                  : undefined
              }
            >
              <Avatar name={recipient.name} size={46} />

              <div className="min-w-0 flex-1">
                <p className="truncate t-subhead font-semibold">{recipient.name}</p>
                <p className="mt-0.5 truncate font-mono t-caption-1 text-[var(--label-2)]">
                  {recipient.upiId}
                </p>
                {recipient.description && (
                  <p className="mt-0.5 truncate t-caption-1 text-[var(--label-3)]">
                    {recipient.description}
                  </p>
                )}
              </div>

              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors"
                style={{
                  background: selected ? 'var(--tint-solid)' : 'transparent',
                  color: selected ? 'var(--tint-contrast)' : 'transparent',
                  boxShadow: selected ? 'none' : 'inset 0 0 0 1.5px var(--separator)',
                }}
              >
                <Icon.Check size={13} strokeWidth={3} />
              </span>
            </button>
          </motion.li>
        )
      })}
    </ul>
  )
}

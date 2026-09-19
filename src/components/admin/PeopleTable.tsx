'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Glass } from '@/components/ui/Glass'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState } from '@/components/ui/Feedback'
import { Icon } from '@/components/shell/Icons'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/client/api'
import { formatDate, relativeTime } from '@/lib/format'

export type PersonRow = {
  _id: string
  name: string
  email: string
  rollNo?: string
  section?: string
  phone?: string
  hostel?: string
  isAdmin?: boolean
  isModerator?: boolean
  isRecipient?: boolean
  createdAt: string
  lastLogin?: string
}

const ROLES = [
  { key: 'isAdmin' as const, label: 'Admin', hint: 'Full access, can override anything.' },
  { key: 'isModerator' as const, label: 'Moderator', hint: 'Manage orders and drops.' },
  { key: 'isRecipient' as const, label: 'Recipient', hint: 'Verifies payments sent to them.' },
]

export function PeopleTable({
  people,
  canEditRoles,
  viewerId,
}: {
  people: PersonRow[]
  canEditRoles: boolean
  viewerId: string
}) {
  const router = useRouter()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return people.filter((p) => {
      if (filter === 'staff' && !p.isAdmin && !p.isModerator) return false
      if (filter === 'recipients' && !p.isRecipient) return false
      if (!q) return true
      return (
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.rollNo?.toLowerCase().includes(q)
      )
    })
  }, [people, filter, query])

  async function toggleRole(person: PersonRow, key: (typeof ROLES)[number]['key']) {
    setBusy(`${person._id}:${key}`)
    try {
      await api(`/api/admin/users/${person._id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ [key]: !person[key] }),
      })
      toast.success(`${person.name} updated.`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not change that role.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="mb-5">
        <h1 className="display text-[clamp(1.8rem,4vw,2.5rem)]">People</h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--muted-fg)]">
          Everyone with an account. Recipients see their own verification queue; moderators manage
          orders and drops; admins can do everything, including overriding a verification.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <Segmented
          options={[
            { value: 'all', label: 'Everyone', count: people.length },
            { value: 'staff', label: 'Staff', count: people.filter((p) => p.isAdmin || p.isModerator).length },
            { value: 'recipients', label: 'Recipients', count: people.filter((p) => p.isRecipient).length },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="glass flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-full px-3.5 sm:max-w-xs">
          <Icon.Search size={16} className="shrink-0 text-[var(--faint-fg)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email or roll no"
            className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[var(--faint-fg)]"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <Glass>
          <EmptyState icon={<Icon.Users size={24} />} title="Nobody matches that" />
        </Glass>
      ) : (
        <Glass className="overflow-hidden">
          <ul className="divide-y" style={{ borderColor: 'var(--hairline-soft)' }}>
            {visible.map((person) => (
              <li
                key={person._id}
                className="flex flex-wrap items-center gap-4 px-4 py-3.5 lg:px-5"
              >
                <Avatar name={person.name} size={40} />

                <div className="min-w-[180px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold">{person.name}</p>
                    {person._id === viewerId && <Badge tone="accent">You</Badge>}
                  </div>
                  <p className="truncate text-[12.5px] text-[var(--muted-fg)]">{person.email}</p>
                  <p className="mt-0.5 text-[11.5px] text-[var(--faint-fg)]">
                    {[person.rollNo, person.section, person.hostel].filter(Boolean).join(' · ')}
                    {person.lastLogin ? ` · seen ${relativeTime(person.lastLogin)}` : ''}
                    {!person.lastLogin ? ` · joined ${formatDate(person.createdAt)}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ROLES.map((role) => {
                    const on = !!person[role.key]
                    const locked =
                      !canEditRoles || (role.key === 'isAdmin' && person._id === viewerId)

                    if (locked) {
                      return on ? (
                        <Badge key={role.key} tone="accent">
                          {role.label}
                        </Badge>
                      ) : null
                    }

                    return (
                      <button
                        key={role.key}
                        onClick={() => toggleRole(person, role.key)}
                        disabled={busy === `${person._id}:${role.key}`}
                        title={role.hint}
                        aria-pressed={on}
                        className="press rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors disabled:opacity-50"
                        style={{
                          background: on ? 'var(--accent-glow)' : 'var(--hairline-soft)',
                          color: on ? 'var(--accent)' : 'var(--faint-fg)',
                        }}
                      >
                        {on ? '✓ ' : ''}
                        {role.label}
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
        </Glass>
      )}
    </div>
  )
}

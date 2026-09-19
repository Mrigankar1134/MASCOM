'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ListRow, ListSection, RowIcon } from '@/components/ui/List'
import { Button } from '@/components/ui/Button'
import { FieldRow } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Sheet } from '@/components/ui/Sheet'
import { Icon } from '@/components/shell/Icons'
import { NavBar } from '@/components/shell/NavBar'
import { useTheme, type ThemePref } from '@/components/ui/ThemeProvider'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/client/api'
import { canOpenConsole, useSession } from '@/lib/client/session'
import { site } from '@/content/site'

export type AccountUser = {
  _id: string
  name: string
  email: string
  phone?: string
  rollNo?: string
  section?: string
  hostel?: string
  block?: string
  roomNo?: string
  gender?: string
  profilePicUrl?: string
  roles: string[]
}

export function AccountScreen({ user }: { user: AccountUser }) {
  const router = useRouter()
  const toast = useToast()
  const session = useSession()
  const { preference, setPreference } = useTheme()

  const [editing, setEditing] = useState<'profile' | 'room' | null>(null)

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const room = [user.hostel, user.block, user.roomNo].filter(Boolean).join(' · ')
  const extraRoles = user.roles.filter((r) => r !== 'student')

  return (
    <>
      <NavBar title="Account" />

      <div className="space-y-7 px-4 pb-8">
        {/* ── Identity card ─────────────────────────────────────────── */}
        <div className="ios-group flex items-center gap-4 p-4">
          <Avatar name={user.name} src={user.profilePicUrl} size={64} />
          <div className="min-w-0 flex-1">
            <p className="t-title-3 truncate">{user.name}</p>
            <p className="t-subhead truncate text-[var(--label-2)]">{user.email}</p>
            {extraRoles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {extraRoles.map((role) => (
                  <Badge key={role} tone="accent">
                    {role}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {canOpenConsole(session) && (
          <ListSection
            footer={
              session?.isRecipient && !session.isAdmin && !session.isModerator
                ? 'Payments students send you land here to be checked.'
                : undefined
            }
          >
            <ListRow
              href="/admin"
              icon={
                <RowIcon tone="tint">
                  <Icon.Shield size={17} strokeWidth={2} />
                </RowIcon>
              }
              label="Committee console"
            />
          </ListSection>
        )}

        {/* ── Details ───────────────────────────────────────────────── */}
        <ListSection
          header="Your details"
          footer="This goes on the packing list, so keep your hostel and room up to date."
        >
          <ListRow label="Name" value={user.name} onClick={() => setEditing('profile')} />
          <ListRow label="Phone" value={user.phone || 'Not set'} onClick={() => setEditing('profile')} />
          <ListRow label="Roll number" value={user.rollNo || 'Not set'} onClick={() => setEditing('profile')} />
          <ListRow label="Section" value={user.section || 'Not set'} onClick={() => setEditing('profile')} />
          <ListRow label="Room" value={room || 'Not set'} onClick={() => setEditing('room')} />
        </ListSection>

        {/* ── Appearance ────────────────────────────────────────────── */}
        <ListSection header="Appearance" footer="Auto just follows your device.">
          {(
            [
              ['light', 'Light'],
              ['dark', 'Dark'],
              ['system', 'Auto'],
            ] as [ThemePref, string][]
          ).map(([value, label]) => (
            <ListRow
              key={value}
              label={label}
              onClick={() => setPreference(value)}
              accessory={
                preference === value ? (
                  <Icon.Check size={18} strokeWidth={2.5} className="text-[var(--tint)]" />
                ) : (
                  <span className="w-[18px]" />
                )
              }
            />
          ))}
        </ListSection>

        {/* ── Orders & help ─────────────────────────────────────────── */}
        <ListSection>
          <ListRow
            href="/orders"
            icon={
              <RowIcon tone="info">
                <Icon.Receipt size={16} strokeWidth={2} />
              </RowIcon>
            }
            label="Your orders"
          />
          <ListRow
            href={site.instagram}
            icon={
              <RowIcon tone="neutral">
                <Icon.Sparkle size={16} strokeWidth={2} />
              </RowIcon>
            }
            label="Contact MASCOM"
            detail={site.instagramHandle}
          />
        </ListSection>

        <ListSection>
          <ListRow label="Sign out" destructive onClick={signOut} accessory={<span />} />
        </ListSection>

        <p className="t-caption-1 pb-2 text-center text-[var(--label-3)]">
          {site.name} · {site.institute}
        </p>
      </div>

      {editing && (
        <ProfileSheet
          user={user}
          scope={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            toast.success('Saved.')
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function ProfileSheet({
  user,
  scope,
  onClose,
  onSaved,
}: {
  user: AccountUser
  scope: 'profile' | 'room'
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setSaving(true)

    const form = new FormData(event.currentTarget)
    try {
      await api('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(Object.fromEntries(form.entries())),
      })
      onSaved()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.issues?.length) {
        setErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])))
      }
      toast.error(err instanceof ApiError ? err.message : 'Could not save that.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={scope === 'room' ? 'Where you collect' : 'Your details'}
      description={
        scope === 'room'
          ? 'Where your kit goes if we cannot catch you at the counter.'
          : undefined
      }
    >
      <form onSubmit={save} className="space-y-5">
        <div className="ios-group">
          {scope === 'profile' ? (
            <>
              <FieldRow name="name" label="Name" defaultValue={user.name} error={errors.name} />
              <FieldRow
                name="phone"
                label="Phone"
                inputMode="tel"
                placeholder="Not set"
                defaultValue={user.phone ?? ''}
                error={errors.phone}
              />
              <FieldRow
                name="rollNo"
                label="Roll no."
                placeholder="Not set"
                defaultValue={user.rollNo ?? ''}
              />
              <FieldRow
                name="section"
                label="Section"
                placeholder="Not set"
                defaultValue={user.section ?? ''}
              />
            </>
          ) : (
            <>
              <FieldRow
                name="hostel"
                label="Hostel"
                placeholder="Not set"
                defaultValue={user.hostel ?? ''}
              />
              <FieldRow
                name="block"
                label="Block"
                placeholder="Not set"
                defaultValue={user.block ?? ''}
              />
              <FieldRow
                name="roomNo"
                label="Room"
                placeholder="Not set"
                defaultValue={user.roomNo ?? ''}
              />
            </>
          )}
        </div>

        <Button type="submit" size="lg" block loading={saving}>
          Save
        </Button>
      </form>
    </Sheet>
  )
}

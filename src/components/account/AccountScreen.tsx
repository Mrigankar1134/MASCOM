'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Icon } from '@/components/shell/Icons'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/client/api'
import { canOpenConsole, useSession } from '@/lib/client/session'

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
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setSaving(true)

    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries())

    try {
      await api('/api/auth/me', { method: 'PATCH', body: JSON.stringify(payload) })
      toast.success('Profile saved.')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError && err.issues?.length) {
        setErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])))
      }
      toast.error(err instanceof ApiError ? err.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
      <header className="mb-6 flex items-center gap-4">
        <Avatar name={user.name} src={user.profilePicUrl} size={62} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-semibold tracking-tight">{user.name}</h1>
          <p className="truncate text-[13.5px] text-[var(--muted-fg)]">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.roles
              .filter((r) => r !== 'student')
              .map((role) => (
                <Badge key={role} tone="accent">
                  {role}
                </Badge>
              ))}
            {user.rollNo && <Badge tone="neutral">{user.rollNo}</Badge>}
          </div>
        </div>
      </header>

      {canOpenConsole(session) && (
        <Link href="/admin" className="mb-4 block">
          <Glass interactive className="flex items-center gap-3.5 p-4">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
            >
              <Icon.Shield size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-semibold">Open the console</p>
              <p className="text-[12.5px] text-[var(--muted-fg)]">
                {session?.isRecipient && !session.isAdmin && !session.isModerator
                  ? 'Verify the payments students sent you.'
                  : 'Verify payments, manage drops and orders.'}
              </p>
            </div>
            <Icon.Chevron size={17} className="text-[var(--faint-fg)]" />
          </Glass>
        </Link>
      )}

      <form onSubmit={save}>
        <Glass className="p-5">
          <h2 className="text-[16px] font-semibold tracking-tight">Your details</h2>
          <p className="mt-1 text-[13px] text-[var(--muted-fg)]">
            Used on the packing list, so keep your hostel and room current.
          </p>

          <div className="mt-5 space-y-4">
            <Input name="name" label="Full name" defaultValue={user.name} error={errors.name} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="phone"
                label="Phone"
                inputMode="tel"
                defaultValue={user.phone ?? ''}
                error={errors.phone}
              />
              <Input
                name="rollNo"
                label="Roll number"
                defaultValue={user.rollNo ?? ''}
                error={errors.rollNo}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="section"
                label="Section"
                defaultValue={user.section ?? ''}
                error={errors.section}
              />
              <Select name="gender" label="Gender" defaultValue={user.gender ?? ''}>
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input name="hostel" label="Hostel" defaultValue={user.hostel ?? ''} />
              <Input name="block" label="Block" defaultValue={user.block ?? ''} />
              <Input name="roomNo" label="Room" defaultValue={user.roomNo ?? ''} />
            </div>
          </div>

          <Button type="submit" loading={saving} className="mt-6" block>
            Save changes
          </Button>
        </Glass>
      </form>

      <Glass className="mt-4 flex items-center justify-between p-4">
        <div>
          <p className="text-[14.5px] font-semibold">Appearance</p>
          <p className="text-[12.5px] text-[var(--muted-fg)]">Follows your device by default.</p>
        </div>
        <ThemeToggle />
      </Glass>

      <button
        onClick={signOut}
        className="press glass mt-4 flex w-full items-center justify-center gap-2 rounded-2xl p-4 text-[14.5px] font-semibold"
        style={{ color: 'var(--danger)' }}
      >
        <Icon.Logout size={17} />
        Sign out
      </button>
    </div>
  )
}

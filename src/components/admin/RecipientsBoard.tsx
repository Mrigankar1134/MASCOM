'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, Spinner } from '@/components/ui/Feedback'
import { Icon } from '@/components/shell/Icons'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/client/api'
import { compressImage } from '@/lib/client/compress'
import { money } from '@/lib/format'
import { ConsoleHeader } from './ConsoleHeader'

export type RecipientRow = {
  _id: string
  name: string
  upiId: string
  phoneNumber: string
  qrCodeUrl: string
  description?: string
  isActive: boolean
  userId?: { _id: string; name?: string; email?: string } | string
  totals: {
    collected: number
    awaiting: number
    paid: number
    pending: number
    failed: number
  }
}

type Candidate = { _id: string; name: string; email: string }

export function RecipientsBoard({
  recipients,
  candidates,
  canEdit,
}: {
  recipients: RecipientRow[]
  candidates: Candidate[]
  canEdit: boolean
}) {
  const [editing, setEditing] = useState<RecipientRow | 'new' | null>(null)

  const grandTotal = recipients.reduce((n, r) => n + r.totals.collected, 0)
  const grandAwaiting = recipients.reduce((n, r) => n + r.totals.awaiting, 0)

  return (
    <div className="mx-auto max-w-[1600px]">
      <ConsoleHeader
        title="Collections"
        subtitle="The coordinators students can pay. Each one verifies the payments sent to them, so whoever is on this list needs a linked account."
        actions={
          canEdit ? (
            <Button size="sm" onClick={() => setEditing('new')} icon={<Icon.Plus size={15} />}>
              Add recipient
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Collected" value={money(grandTotal)} />
        <Tile label="Awaiting verification" value={money(grandAwaiting)} tone="warn" />
        <Tile label="Active collectors" value={String(recipients.filter((r) => r.isActive).length)} />
        <Tile
          label="Pending checks"
          value={String(recipients.reduce((n, r) => n + r.totals.pending, 0))}
          tone="warn"
        />
      </div>

      {recipients.length === 0 ? (
        <Glass>
          <EmptyState
            icon={<Icon.Wallet size={24} />}
            title="No one is collecting payments yet"
            description="Add a coordinator with their UPI ID and QR so students have someone to pay at checkout."
            action={
              canEdit ? <Button onClick={() => setEditing('new')}>Add the first one</Button> : undefined
            }
          />
        </Glass>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {recipients.map((recipient) => (
            <Glass key={recipient._id} className="flex flex-col p-4">
              <div className="flex items-start gap-3">
                <Avatar name={recipient.name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate t-subhead font-semibold">{recipient.name}</p>
                    {!recipient.isActive && <Badge tone="neutral">Inactive</Badge>}
                  </div>
                  <p className="truncate font-mono t-caption-1 text-[var(--label-2)]">
                    {recipient.upiId}
                  </p>
                  <p className="truncate t-caption-1 text-[var(--label-3)]">
                    {typeof recipient.userId === 'object'
                      ? `Verifies as ${recipient.userId?.name ?? recipient.userId?.email}`
                      : 'No linked account'}
                  </p>
                </div>
                {recipient.qrCodeUrl && (
                  <span
                    className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg"
                    style={{ background: '#fff' }}
                  >
                    <Image
                      src={recipient.qrCodeUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="44px"
                      className="object-contain p-0.5"
                    />
                  </span>
                )}
              </div>

              <dl
                className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center"
                style={{ borderColor: 'var(--separator-soft)' }}
              >
                <div>
                  <dt className="t-caption-2 uppercase tracking-wide text-[var(--label-3)]">
                    Collected
                  </dt>
                  <dd className="mt-0.5 t-subhead font-semibold tabular" style={{ color: 'var(--ok)' }}>
                    {money(recipient.totals.collected)}
                  </dd>
                </div>
                <div>
                  <dt className="t-caption-2 uppercase tracking-wide text-[var(--label-3)]">
                    Pending
                  </dt>
                  <dd className="mt-0.5 t-subhead font-semibold tabular" style={{ color: 'var(--warn)' }}>
                    {recipient.totals.pending}
                  </dd>
                </div>
                <div>
                  <dt className="t-caption-2 uppercase tracking-wide text-[var(--label-3)]">
                    Rejected
                  </dt>
                  <dd className="mt-0.5 t-subhead font-semibold tabular">
                    {recipient.totals.failed}
                  </dd>
                </div>
              </dl>

              {canEdit && (
                <button
                  onClick={() => setEditing(recipient)}
                  className="press glass mt-3 w-full rounded-xl py-2 t-footnote font-semibold"
                >
                  Edit
                </button>
              )}
            </Glass>
          ))}
        </div>
      )}

      {canEdit && editing && (
        <RecipientEditor
          recipient={editing === 'new' ? null : editing}
          candidates={candidates}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <Glass className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--label-3)]">
        {label}
      </p>
      <p
        className="mt-2 text-[clamp(1.2rem,3vw,1.6rem)] font-semibold tabular"
        style={tone === 'warn' ? { color: 'var(--warn)' } : undefined}
      >
        {value}
      </p>
    </Glass>
  )
}

function RecipientEditor({
  recipient,
  candidates,
  onClose,
}: {
  recipient: RecipientRow | null
  candidates: Candidate[]
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [qrCodeUrl, setQrCodeUrl] = useState(recipient?.qrCodeUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function uploadQr(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const compressed = await compressImage(file, { maxEdge: 900 })
      const form = new FormData()
      form.append('file', compressed)
      form.append('kind', 'qr')
      const result = await api<{ url: string }>('/api/uploads', { method: 'POST', body: form })
      setQrCodeUrl(result.url)
      toast.success('QR uploaded.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})

    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get('name') ?? '').trim(),
      upiId: String(form.get('upiId') ?? '').trim(),
      phoneNumber: String(form.get('phoneNumber') ?? '').trim(),
      description: String(form.get('description') ?? '').trim(),
      userId: String(form.get('userId') ?? ''),
      isActive: form.get('isActive') === 'on',
      qrCodeUrl,
    }

    if (!payload.qrCodeUrl) {
      toast.error('Upload the payment QR first.')
      return
    }

    setSaving(true)
    try {
      if (recipient) {
        await api(`/api/admin/recipients/${recipient._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await api('/api/admin/recipients', { method: 'POST', body: JSON.stringify(payload) })
      }
      toast.success(recipient ? 'Recipient updated.' : 'Recipient added.')
      router.refresh()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.issues?.length) {
        setErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])))
      }
      toast.error(err instanceof ApiError ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!recipient) return
    setSaving(true)
    try {
      const result = await api<{ deactivated?: boolean; message?: string }>(
        `/api/admin/recipients/${recipient._id}`,
        { method: 'DELETE' },
      )
      toast.success(result.message ?? 'Recipient removed.')
      router.refresh()
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={recipient ? `Edit ${recipient.name}` : 'Add a payment recipient'}
      description="Students see this person at checkout, scan their QR, and their orders land in this person's verification queue."
      size="lg"
    >
      <form onSubmit={save} className="space-y-4" id="recipient-form">
        <Input
          name="name"
          label="Display name"
          defaultValue={recipient?.name}
          placeholder="How students see them at checkout"
          required
          error={errors.name}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="upiId"
            label="UPI ID"
            defaultValue={recipient?.upiId}
            placeholder="name@okaxis"
            autoCapitalize="none"
            spellCheck={false}
            required
            error={errors.upiId}
            hint="Used to generate the amount-locked QR."
          />
          <Input
            name="phoneNumber"
            label="Phone"
            inputMode="tel"
            defaultValue={recipient?.phoneNumber}
            required
            error={errors.phoneNumber}
          />
        </div>

        <Select
          name="userId"
          label="Verifies as"
          defaultValue={
            typeof recipient?.userId === 'object' ? recipient.userId?._id : recipient?.userId ?? ''
          }
          required
          error={errors.userId}
          hint="This account gets the verification queue for payments sent here."
        >
          <option value="">Choose an account…</option>
          {candidates.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} — {c.email}
            </option>
          ))}
        </Select>

        <Input
          name="description"
          label="Note"
          defaultValue={recipient?.description}
          placeholder="Optional, e.g. “Section B and hostel 3”"
        />

        <div>
          <p className="mb-1.5 t-footnote font-medium text-[var(--label-2)]">Payment QR</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => uploadQr(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="press glass flex w-full items-center gap-4 rounded-2xl p-3 text-left"
          >
            <span
              className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl"
              style={{ background: qrCodeUrl ? '#fff' : 'var(--separator-soft)' }}
            >
              {uploading ? (
                <Spinner />
              ) : qrCodeUrl ? (
                <Image src={qrCodeUrl} alt="" fill unoptimized sizes="80px" className="object-contain p-1" />
              ) : (
                <Icon.QR size={24} className="text-[var(--label-3)]" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block t-footnote font-semibold">
                {qrCodeUrl ? 'Replace QR image' : 'Upload their UPI QR'}
              </span>
              <span className="mt-0.5 block t-caption-1 leading-relaxed text-[var(--label-2)]">
                A screenshot of their GPay / PhonePe QR. Students can fall back to this if the
                generated one does not scan.
              </span>
            </span>
          </button>
        </div>

        <label className="glass flex cursor-pointer items-center gap-3 rounded-xl p-3.5">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={recipient?.isActive ?? true}
            className="h-5 w-5 accent-[var(--tint)]"
          />
          <span className="t-footnote">
            <span className="font-semibold">Available at checkout</span>
            <span className="mt-0.5 block t-caption-1 text-[var(--label-2)]">
              Turn off to stop new payments without touching past orders.
            </span>
          </span>
        </label>

        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={saving} block>
            {recipient ? 'Save changes' : 'Add recipient'}
          </Button>
          {recipient && (
            <Button type="button" variant="glass" onClick={remove} disabled={saving}>
              Remove
            </Button>
          )}
        </div>
      </form>
    </Sheet>
  )
}

'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState, Spinner } from '@/components/ui/Feedback'
import { Icon } from '@/components/shell/Icons'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/client/api'
import { compressImage } from '@/lib/client/compress'
import { money } from '@/lib/format'
import { swatch } from '@/components/shop/ProductCard'
import { ConsoleHeader } from './ConsoleHeader'

export type DropRow = {
  _id: string
  name: string
  slug: string
  description?: string
  price: number
  available: boolean
  isLive: boolean
  category?: string
  material?: string
  availableSizes: string[]
  allowCustomName: boolean
  totalSold: number
  totalRevenue: number
  variants: { color: string; imageUrls: string[] }[]
}

type Variant = { color: string; imageUrls: string[] }

export function DropsBoard({
  products,
  canDelete,
}: {
  products: DropRow[]
  canDelete: boolean
}) {
  const [editing, setEditing] = useState<DropRow | 'new' | null>(null)

  return (
    <div className="mx-auto max-w-[1600px]">
      <ConsoleHeader
        title="Drops"
        subtitle="A drop is only orderable when it is both live and open. Changing the price starts a new band, so orders already placed keep what they paid."
        actions={
          <Button size="sm" onClick={() => setEditing('new')} icon={<Icon.Plus size={15} />}>
            New drop
          </Button>
        }
      />

      {products.length === 0 ? (
        <Glass>
          <EmptyState
            icon={<Icon.Box size={24} />}
            title="No drops yet"
            description="Make one, add colours and photos, then open it up for orders."
            action={<Button onClick={() => setEditing('new')}>Make the first one</Button>}
          />
        </Glass>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const cover = product.variants?.[0]?.imageUrls?.[0]
            return (
              <Glass key={product._id} className="flex flex-col overflow-hidden p-3">
                <div className="flex gap-3.5">
                  <span
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl"
                    style={{ background: 'var(--separator-soft)' }}
                  >
                    {cover ? (
                      <Image src={cover} alt="" fill sizes="80px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-[var(--label-3)]">
                        <Icon.Box size={20} />
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate t-subhead font-semibold">{product.name}</p>
                    <p className="mt-0.5 t-subhead font-semibold tabular">{money(product.price)}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {product.available && product.isLive ? (
                        <Badge tone="ok" dot>
                          Open
                        </Badge>
                      ) : product.isLive ? (
                        <Badge tone="warn">Live, closed</Badge>
                      ) : (
                        <Badge tone="neutral">Draft</Badge>
                      )}
                      {product.totalSold > 0 && (
                        <Badge tone="neutral">{product.totalSold} sold</Badge>
                      )}
                    </div>
                    {product.variants?.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {product.variants.slice(0, 8).map((v) => (
                          <span
                            key={v.color}
                            title={v.color}
                            className="h-3.5 w-3.5 rounded-full"
                            style={{
                              background: swatch(v.color),
                              boxShadow: 'inset 0 0 0 1px var(--separator)',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setEditing(product)}
                  className="press glass mt-3 w-full rounded-xl py-2 t-footnote font-semibold"
                >
                  Edit drop
                </button>
              </Glass>
            )
          })}
        </div>
      )}

      {editing && (
        <DropEditor
          product={editing === 'new' ? null : editing}
          canDelete={canDelete}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function DropEditor({
  product,
  canDelete,
  onClose,
}: {
  product: DropRow | null
  canDelete: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()

  const [variants, setVariants] = useState<Variant[]>(
    product?.variants?.length ? product.variants : [{ color: '', imageUrls: [] }],
  )
  const [sizes, setSizes] = useState((product?.availableSizes ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function updateVariant(index: number, patch: Partial<Variant>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})

    const form = new FormData(event.currentTarget)
    const cleanVariants = variants
      .filter((v) => v.color.trim())
      .map((v) => ({ color: v.color.trim(), imageUrls: v.imageUrls }))

    const payload = {
      name: String(form.get('name') ?? '').trim(),
      description: String(form.get('description') ?? '').trim(),
      price: Number(form.get('price') ?? 0),
      category: String(form.get('category') ?? '').trim(),
      material: String(form.get('material') ?? '').trim(),
      availableSizes: sizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      allowCustomName: form.get('allowCustomName') === 'on',
      available: form.get('available') === 'on',
      isLive: form.get('isLive') === 'on',
      variants: cleanVariants,
    }

    setSaving(true)
    try {
      if (product) {
        await api(`/api/admin/products/${product._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await api('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) })
      }
      toast.success(product ? 'Drop updated.' : 'Drop created.')
      router.refresh()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.issues?.length) {
        setErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])))
      }
      toast.error(err instanceof ApiError ? err.message : 'Could not save this drop.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!product) return
    setSaving(true)
    try {
      const result = await api<{ message?: string }>(`/api/admin/products/${product._id}`, {
        method: 'DELETE',
      })
      toast.success(result.message ?? 'Drop removed.')
      router.refresh()
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove this drop.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={product ? `Edit ${product.name}` : 'New drop'}
      size="xl"
    >
      <form onSubmit={save} className="space-y-4">
        <Input name="name" label="Name" defaultValue={product?.name} required error={errors.name} />

        <Textarea
          name="description"
          label="Description"
          defaultValue={product?.description}
          placeholder="Fabric, fit, why it is worth it."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            name="price"
            type="number"
            min={0}
            step={1}
            label="Price (₹)"
            defaultValue={product?.price}
            required
            error={errors.price}
            hint={product ? 'Changing this opens a new price band.' : undefined}
          />
          <Input name="category" label="Category" defaultValue={product?.category} placeholder="Apparel" />
          <Input name="material" label="Material" defaultValue={product?.material} placeholder="Cotton piqué" />
        </div>

        <Input
          label="Sizes"
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
          placeholder="XS, S, M, L, XL, XXL"
          hint="Comma separated. Leave it empty for one-size items."
        />

        {/* ── Variants ─────────────────────────────────────────────────── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="t-footnote font-medium text-[var(--label-2)]">Colours & photos</p>
            <button
              type="button"
              onClick={() => setVariants((prev) => [...prev, { color: '', imageUrls: [] }])}
              className="press t-caption-1 font-semibold"
              style={{ color: 'var(--tint)' }}
            >
              + Add colour
            </button>
          </div>

          <div className="space-y-2.5">
            {variants.map((variant, index) => (
              <VariantEditor
                key={index}
                variant={variant}
                onChange={(patch) => updateVariant(index, patch)}
                onRemove={
                  variants.length > 1
                    ? () => setVariants((prev) => prev.filter((_, i) => i !== index))
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <Toggle
            name="isLive"
            label="Live"
            hint="Visible in the shop"
            defaultChecked={product?.isLive ?? false}
          />
          <Toggle
            name="available"
            label="Open for orders"
            hint="Students can buy"
            defaultChecked={product?.available ?? false}
          />
          <Toggle
            name="allowCustomName"
            label="Name on back"
            hint="Allow personalisation"
            defaultChecked={product?.allowCustomName ?? false}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={saving} block>
            {product ? 'Save changes' : 'Create drop'}
          </Button>
          {product && canDelete && (
            <Button type="button" variant="glass" onClick={remove} disabled={saving}>
              Delete
            </Button>
          )}
        </div>
      </form>
    </Sheet>
  )
}

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string
  label: string
  hint: string
  defaultChecked: boolean
}) {
  return (
    <label className="glass flex cursor-pointer items-center gap-3 rounded-xl p-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 shrink-0 accent-[var(--tint)]"
      />
      <span className="min-w-0 t-footnote">
        <span className="block font-semibold">{label}</span>
        <span className="block truncate t-caption-1 text-[var(--label-2)]">{hint}</span>
      </span>
    </label>
  )
}

function VariantEditor({
  variant,
  onChange,
  onRemove,
}: {
  variant: Variant
  onChange: (patch: Partial<Variant>) => void
  onRemove?: () => void
}) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files).slice(0, 6)) {
        const compressed = await compressImage(file, { maxEdge: 1600, quality: 0.86 })
        const form = new FormData()
        form.append('file', compressed)
        form.append('kind', 'product')
        const result = await api<{ url: string }>('/api/uploads', { method: 'POST', body: form })
        urls.push(result.url)
      }
      onChange({ imageUrls: [...variant.imageUrls, ...urls].slice(0, 8) })
      toast.success(`${urls.length} photo${urls.length === 1 ? '' : 's'} added.`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-center gap-2.5">
        <span
          className="h-8 w-8 shrink-0 rounded-full"
          style={{
            background: variant.color ? swatch(variant.color) : 'var(--separator-soft)',
            boxShadow: 'inset 0 0 0 1px var(--separator)',
          }}
        />
        <input
          value={variant.color}
          onChange={(e) => onChange({ color: e.target.value })}
          placeholder="Colour name, e.g. Navy"
          className="h-10 min-w-0 flex-1 rounded-xl border px-3 t-subhead outline-none focus:border-[var(--tint)]"
          style={{ background: 'var(--field-bg)', borderColor: 'var(--field-border)' }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="press glass grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          aria-label="Add photos"
        >
          {uploading ? <Spinner className="h-4 w-4" /> : <Icon.Upload size={16} />}
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="press grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--label-3)]"
            aria-label="Remove colour"
          >
            <Icon.X size={16} />
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => upload(e.target.files)}
      />

      {variant.imageUrls.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {variant.imageUrls.map((url) => (
            <span key={url} className="relative h-14 w-14 overflow-hidden rounded-lg">
              <Image src={url} alt="" fill sizes="56px" className="object-cover" />
              <button
                type="button"
                onClick={() =>
                  onChange({ imageUrls: variant.imageUrls.filter((u) => u !== url) })
                }
                className="press absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"
                aria-label="Remove photo"
              >
                <Icon.X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

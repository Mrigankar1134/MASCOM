'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Glass } from '@/components/ui/Glass'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/shell/Icons'
import { Spinner } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { compressImage } from '@/lib/client/compress'
import { api, ApiError } from '@/lib/client/api'
import { MAX_SCREENSHOT_BYTES } from '@/lib/constants'

export function ProofUpload({
  screenshotUrl,
  onScreenshot,
  reference,
  onReference,
}: {
  screenshotUrl: string | null
  onScreenshot: (url: string | null) => void
  reference: string
  onReference: (value: string) => void
}) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Upload a screenshot image.')
      return
    }
    if (file.size > MAX_SCREENSHOT_BYTES * 3) {
      toast.error('That image is far too large.')
      return
    }

    setUploading(true)
    try {
      // Shrink on-device first: phone screenshots are routinely 4–8MB.
      const compressed = await compressImage(file)
      const form = new FormData()
      form.append('file', compressed)
      form.append('kind', 'screenshot')

      const result = await api<{ url: string }>('/api/uploads', { method: 'POST', body: form })
      onScreenshot(result.url)
      toast.success('Screenshot attached.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Glass tone="strong" className="p-5">
        <h3 className="text-[16px] font-semibold tracking-tight">Upload your payment screenshot</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--muted-fg)]">
          The success screen from your UPI app. This is what the coordinator checks against their
          own statement, so make sure the amount and time are visible.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {screenshotUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="mt-4"
          >
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{ boxShadow: 'inset 0 0 0 1px var(--hairline)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotUrl}
                alt="Your payment screenshot"
                className="max-h-80 w-full bg-black/5 object-contain"
              />
              <span
                className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}
              >
                <Icon.Check size={12} strokeWidth={3} />
                Attached
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="press glass flex-1 rounded-xl py-2.5 text-[13.5px] font-semibold"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onScreenshot(null)}
                className="press glass rounded-xl px-4 py-2.5 text-[13.5px] font-semibold"
                style={{ color: 'var(--danger)' }}
              >
                Remove
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              handleFile(e.dataTransfer.files?.[0])
            }}
            disabled={uploading}
            className="press mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors"
            style={{
              borderColor: dragging ? 'var(--accent)' : 'var(--hairline)',
              background: dragging ? 'var(--accent-glow)' : 'var(--field-bg)',
            }}
          >
            <span
              className="grid h-12 w-12 place-items-center rounded-2xl"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
            >
              {uploading ? <Spinner /> : <Icon.Camera size={22} />}
            </span>
            <span className="text-center">
              <span className="block text-[14.5px] font-semibold">
                {uploading ? 'Uploading…' : 'Tap to add screenshot'}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-[var(--faint-fg)]">
                PNG or JPG, up to 5MB. Large images are shrunk automatically.
              </span>
            </span>
          </button>
        )}
      </Glass>

      <Glass className="p-5">
        <Input
          label="UPI reference / UTR number"
          hint="Optional, but it makes verification almost instant."
          placeholder="e.g. 412345678901"
          inputMode="numeric"
          autoComplete="off"
          value={reference}
          onChange={(e) => onReference(e.target.value.slice(0, 40))}
        />
      </Glass>
    </div>
  )
}

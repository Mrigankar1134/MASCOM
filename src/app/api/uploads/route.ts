import { saveUpload, type UploadKind } from '@/lib/storage'
import { MAX_IMAGE_BYTES, MAX_SCREENSHOT_BYTES } from '@/lib/constants'
import { fail, ok, requireUser, route } from '@/lib/api-helpers'
import { isStaff } from '@/lib/auth'

const KINDS: Record<string, { kind: UploadKind; maxBytes: number; staffOnly: boolean }> = {
  screenshot: { kind: 'screenshots', maxBytes: MAX_SCREENSHOT_BYTES, staffOnly: false },
  avatar: { kind: 'avatars', maxBytes: MAX_SCREENSHOT_BYTES, staffOnly: false },
  product: { kind: 'products', maxBytes: MAX_IMAGE_BYTES, staffOnly: true },
  qr: { kind: 'qr', maxBytes: MAX_IMAGE_BYTES, staffOnly: true },
}

export const POST = route(async (req) => {
  const user = await requireUser()

  const form = await req.formData()
  const file = form.get('file')
  const requested = String(form.get('kind') ?? 'screenshot')

  const config = KINDS[requested]
  if (!config) return fail('Unknown upload type.', 400)
  if (config.staffOnly && !isStaff(user)) return fail('You do not have access to this.', 403)
  if (!(file instanceof File)) return fail('No file received.', 400)

  try {
    const saved = await saveUpload(file, config.kind, config.maxBytes)
    return ok(saved, { status: 201 })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Upload failed.', 400)
  }
})

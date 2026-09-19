import 'server-only'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const ALLOWED = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/heic', '.heic'],
])

export type UploadKind = 'screenshots' | 'products' | 'qr' | 'avatars'

function uploadDir(): string {
  return process.env.UPLOAD_DIR?.trim() || './public/uploads'
}

function publicPath(): string {
  return process.env.UPLOAD_PUBLIC_PATH?.trim() || '/uploads'
}

/**
 * Writes an uploaded image to the configured upload directory and returns the
 * public URL. Mirrors how the previous Express server stored files, so a
 * mounted disk carries straight over.
 */
export async function saveUpload(
  file: File,
  kind: UploadKind,
  maxBytes: number,
): Promise<{ url: string; filename: string; bytes: number }> {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('No file received.')
  }
  if (file.size === 0) throw new Error('That file is empty.')
  if (file.size > maxBytes) {
    throw new Error(`That file is too large. Keep it under ${Math.round(maxBytes / 1024 / 1024)}MB.`)
  }

  const ext = ALLOWED.get(file.type)
  if (!ext) throw new Error('Only JPG, PNG, WebP, GIF or HEIC images are accepted.')

  const dir = path.join(uploadDir(), kind)
  await mkdir(dir, { recursive: true })

  const filename = `${kind.slice(0, 3)}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, filename), buffer)

  return {
    url: `${publicPath()}/${kind}/${filename}`,
    filename,
    bytes: buffer.byteLength,
  }
}

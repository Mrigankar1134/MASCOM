'use client'

/**
 * Downscales and re-encodes an image in the browser before upload.
 *
 * Payment screenshots come straight from a phone's camera roll and are often
 * 4-8MB. Shrinking them here keeps uploads fast on campus wifi and keeps the
 * upload directory small, while staying more than legible for verification.
 */
export async function compressImage(
  file: File,
  { maxEdge = 1400, quality = 0.82 }: { maxEdge?: number; quality?: number } = {},
): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))

    // Already small enough and reasonably sized, leave it alone.
    if (scale === 1 && file.size < 900_000) {
      bitmap.close()
      return file
    }

    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob || blob.size >= file.size) return file

    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    // Unsupported format (HEIC on some browsers), send the original.
    return file
  }
}

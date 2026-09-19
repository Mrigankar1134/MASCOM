import QRCode from 'qrcode'
import { buildUpiUri, isValidUpiId } from '@/lib/upi'
import { fail, requireUser, route } from '@/lib/api-helpers'

/**
 * Renders an amount-locked UPI QR for a recipient.
 *
 * A coordinator's saved QR is a plain payee code, the student has to type the
 * amount themselves, which is where most mismatches come from. Encoding the
 * exact total here removes that step, and the recipient's own QR stays
 * available as a fallback.
 */
export const GET = route(async (req) => {
  await requireUser()

  const url = new URL(req.url)
  const upiId = url.searchParams.get('upi')?.trim() ?? ''
  const payeeName = url.searchParams.get('name')?.trim() ?? 'MASCOM'
  const amount = Number(url.searchParams.get('amount') ?? 0)
  const note = url.searchParams.get('note') ?? undefined
  const dark = url.searchParams.get('theme') === 'dark'

  if (!isValidUpiId(upiId)) return fail('That UPI ID does not look right.', 400)
  if (!Number.isFinite(amount) || amount <= 0) return fail('Amount must be greater than zero.', 400)

  const png = await QRCode.toBuffer(buildUpiUri({ upiId, payeeName, amount, note }), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 512,
    color: dark
      ? { dark: '#f4f4f8ff', light: '#00000000' }
      : { dark: '#0d0e15ff', light: '#00000000' },
  })

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // Personal payment details, never cache these in a shared cache.
      'Cache-Control': 'private, max-age=300',
    },
  })
})

/**
 * Builds a UPI intent link. On a phone this opens GPay / PhonePe / Paytm with
 * the payee, amount and note already filled in — the student only confirms.
 * Desktop browsers ignore it, which is why the QR is always shown as well.
 */
export function buildUpiUri(input: {
  upiId: string
  payeeName: string
  amount: number
  note?: string
}): string {
  const params = new URLSearchParams({
    pa: input.upiId,
    pn: input.payeeName,
    am: input.amount.toFixed(2),
    cu: 'INR',
  })
  if (input.note) params.set('tn', input.note.slice(0, 48))
  return `upi://pay?${params.toString()}`
}

/** True for a plausible `name@bank` VPA. Deliberately permissive. */
export function isValidUpiId(value: string): boolean {
  return /^[\w.\-]{2,64}@[a-zA-Z]{2,32}$/.test(value.trim())
}

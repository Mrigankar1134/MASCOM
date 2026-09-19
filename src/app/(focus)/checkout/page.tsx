import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getActiveRecipients, safely } from '@/lib/data'
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow'

export const metadata: Metadata = { title: 'Checkout' }
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const user = await getCurrentUser().catch(() => null)
  if (!user) redirect('/signin?next=/checkout')

  const recipients = await safely(getActiveRecipients, [])

  return <CheckoutFlow recipients={recipients} />
}

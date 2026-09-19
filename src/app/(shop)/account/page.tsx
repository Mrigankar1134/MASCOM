import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser, rolesOf } from '@/lib/auth'
import { plain } from '@/lib/json'
import { AccountScreen, type AccountUser } from '@/components/account/AccountScreen'

export const metadata: Metadata = { title: 'Your account' }
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await getCurrentUser().catch(() => null)
  if (!user) redirect('/signin?next=/account')

  return (
    <AccountScreen
      user={{ ...(plain(user) as unknown as AccountUser), roles: rolesOf(user) }}
    />
  )
}

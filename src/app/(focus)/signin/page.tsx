import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AuthScreen } from '@/components/auth/AuthScreen'

export const metadata: Metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const user = await getCurrentUser().catch(() => null)
  const { next } = await searchParams
  if (user) redirect(next ?? '/shop')

  return <AuthScreen mode="signin" next={next} />
}

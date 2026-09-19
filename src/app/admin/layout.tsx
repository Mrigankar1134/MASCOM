import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { canOpenConsole, getCurrentUser, isAdmin, isStaff } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { ConsoleShell } from '@/components/admin/ConsoleShell'

export const metadata: Metadata = { title: 'Console' }
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null)
  if (!user) redirect('/signin?next=/admin')
  if (!canOpenConsole(user)) redirect('/shop')

  await connectDB()

  // The badge on "Verify" is the one number that pulls people into the console,
  // so it is scoped the same way the queue itself is.
  const mine = await PaymentRecipient.findOne({ userId: user._id }).lean()
  const pendingFilter = isStaff(user)
    ? { paymentStatus: 'Pending' }
    : { paymentStatus: 'Pending', paymentRecipientId: mine?._id ?? null }
  const pendingCount = await Order.countDocuments(pendingFilter)

  return (
    <ConsoleShell
      user={{
        name: user.name,
        email: user.email,
        photo: user.profilePicUrl ?? null,
        isAdmin: isAdmin(user),
        isStaff: isStaff(user),
        recipientName: mine?.name ?? null,
      }}
      pendingCount={pendingCount}
    >
      {children}
    </ConsoleShell>
  )
}

import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { Order } from '@/lib/models/Order'
import { User } from '@/lib/models/User'
import { getCurrentUser, isAdmin, isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'
import { RecipientsBoard, type RecipientRow } from '@/components/admin/RecipientsBoard'

export const dynamic = 'force-dynamic'

export default async function RecipientsPage() {
  const user = await getCurrentUser()
  if (!isStaff(user)) redirect('/admin')

  await connectDB()

  const recipients = await PaymentRecipient.find()
    .populate('userId', 'name email')
    .sort({ name: 1 })
    .lean()

  const totals = await Order.aggregate<{
    _id: string
    collected: number
    paid: number
    pending: number
    failed: number
    awaiting: number
  }>([
    {
      $group: {
        _id: '$paymentRecipientId',
        collected: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$finalAmountPaid', 0] } },
        awaiting: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, '$finalAmountPaid', 0] },
        },
        paid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Failed'] }, 1, 0] } },
      },
    },
  ])
  // The aggregate rows carry an ObjectId _id, which cannot cross into a client
  // component — keep only the numbers.
  const byId = new Map(
    totals.map((t) => [
      String(t._id),
      {
        collected: t.collected,
        awaiting: t.awaiting,
        paid: t.paid,
        pending: t.pending,
        failed: t.failed,
      },
    ]),
  )

  // Candidate accounts to link a new recipient to.
  const staffUsers = await User.find({
    $or: [{ isAdmin: true }, { isModerator: true }, { isRecipient: true }],
  })
    .select('name email')
    .sort({ name: 1 })
    .limit(100)
    .lean()

  const rows: RecipientRow[] = plain(recipients).map((r) => ({
    ...r,
    _id: String(r._id),
    userId: r.userId as unknown as RecipientRow['userId'],
    totals: byId.get(String(r._id)) ?? {
      collected: 0, awaiting: 0, paid: 0, pending: 0, failed: 0,
    },
  })) as RecipientRow[]

  return (
    <RecipientsBoard
      recipients={rows}
      candidates={plain(staffUsers).map((u) => ({
        _id: String(u._id),
        name: u.name,
        email: u.email,
      }))}
      canEdit={isAdmin(user)}
    />
  )
}

import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { getCurrentUser, isAdmin, isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'
import { VerifyQueue, type QueueOrder } from '@/components/admin/VerifyQueue'

export const dynamic = 'force-dynamic'

export default async function VerifyPage() {
  const user = await getCurrentUser()
  await connectDB()

  const staff = isStaff(user)
  const mine = await PaymentRecipient.findOne({ userId: user!._id }).lean()

  // A recipient sees only what was sent to them. Staff see the whole board.
  const filter = staff ? {} : { paymentRecipientId: mine?._id ?? null }

  const orders = await Order.find(filter)
    .populate('userId', 'name email phone rollNo section hostel block roomNo')
    .populate('paymentRecipientId', 'name upiId phoneNumber userId')
    .sort({ paymentStatus: 1, createdAt: -1 })
    .limit(200)
    .lean()

  const recipients = staff
    ? await PaymentRecipient.find().select('name').sort({ name: 1 }).lean()
    : []

  return (
    <VerifyQueue
      orders={plain(orders) as unknown as QueueOrder[]}
      recipients={plain(recipients).map((r) => ({ _id: String(r._id), name: r.name }))}
      viewer={{
        id: String(user!._id),
        isAdmin: isAdmin(user),
        isStaff: staff,
        recipientId: mine ? String(mine._id) : null,
        recipientName: mine?.name ?? null,
      }}
    />
  )
}

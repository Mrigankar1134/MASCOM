import { connectDB } from '@/lib/db'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { Order } from '@/lib/models/Order'
import { User } from '@/lib/models/User'
import { ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { recipientSchema } from '@/lib/validators'
import { plain } from '@/lib/json'

/** Every recipient plus what they have collected — the admin overview. */
export const GET = route(async () => {
  await requireUser('staff')
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
  }>([
    {
      $group: {
        _id: '$paymentRecipientId',
        collected: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$finalAmountPaid', 0] },
        },
        paid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Failed'] }, 1, 0] } },
      },
    },
  ])

  const byId = new Map(totals.map((t) => [String(t._id), t]))

  return ok({
    recipients: plain(recipients).map((r) => ({
      ...r,
      totals: byId.get(String(r._id)) ?? { collected: 0, paid: 0, pending: 0, failed: 0 },
    })),
  })
})

export const POST = route(async (req) => {
  await requireUser('admin')
  const body = await parseBody(req, recipientSchema)

  await connectDB()

  const recipient = await PaymentRecipient.create({ ...body, isActive: body.isActive ?? true })

  // The linked account is how this person reaches their verification queue.
  await User.findByIdAndUpdate(body.userId, { $set: { isRecipient: true } })

  return ok({ recipient: plain(recipient) }, { status: 201 })
})

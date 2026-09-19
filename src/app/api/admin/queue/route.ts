import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { ok, requireUser, route } from '@/lib/api-helpers'
import { isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'

/**
 * The verification queue.
 *
 * A plain recipient sees only the payments students said they made to *them* —
 * that is the whole point of the person-to-person flow. Admins and moderators
 * see everything, and can filter down to one recipient.
 */
export const GET = route(async (req) => {
  const user = await requireUser('console')
  await connectDB()

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const recipientFilter = url.searchParams.get('recipient')
  const search = url.searchParams.get('q')?.trim()
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 200)

  const filter: Record<string, unknown> = {}

  const myRecipient = await PaymentRecipient.findOne({ userId: user._id }).lean()

  if (isStaff(user)) {
    if (recipientFilter && recipientFilter !== 'all') filter.paymentRecipientId = recipientFilter
  } else {
    // Not staff — they can only be here because they are a recipient.
    if (!myRecipient) return ok({ orders: [], recipient: null, scope: 'none' })
    filter.paymentRecipientId = myRecipient._id
  }

  if (status && status !== 'all') filter.paymentStatus = status

  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ orderId: rx }, { paidTo: rx }, { paymentReference: rx }]
  }

  const orders = await Order.find(filter)
    .populate('userId', 'name email phone rollNo section hostel block roomNo')
    .populate('paymentRecipientId', 'name upiId phoneNumber')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return ok({
    orders: plain(orders),
    recipient: myRecipient ? plain(myRecipient) : null,
    scope: isStaff(user) ? 'all' : 'mine',
  })
})

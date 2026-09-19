import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { fail, ok, requireUser, route } from '@/lib/api-helpers'
import { isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'

export const GET = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser()
  const { id } = await ctx.params

  await connectDB()

  const order = await Order.findOne({
    $or: [{ orderId: id }, ...(/^[a-f\d]{24}$/i.test(id) ? [{ _id: id }] : [])],
  })
    .populate('paymentRecipientId', 'name upiId phoneNumber')
    .lean()

  if (!order) return fail('Order not found.', 404)

  // Students see only their own orders; staff can open any of them.
  if (String(order.userId) !== String(user._id) && !isStaff(user)) {
    return fail('Order not found.', 404)
  }

  return ok({ order: plain(order) })
})

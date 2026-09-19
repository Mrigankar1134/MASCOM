import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { isAdmin } from '@/lib/auth'
import { updateOrderSchema } from '@/lib/validators'

export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser('staff')
  const { id } = await ctx.params
  const body = await parseBody(req, updateOrderSchema)

  await connectDB()

  const order = await Order.findById(id)
  if (!order) return fail('Order not found.', 404)

  if (body.status) {
    const override = !!body.adminOverride && isAdmin(user)
    if (body.status === 'Delivered' && order.paymentStatus !== 'Paid' && !override) {
      return fail('Confirm the payment before marking this delivered.', 400)
    }

    if (body.status === 'Delivered') {
      for (const item of order.items) {
        item.itemStatus = 'Delivered'
        item.fulfilledAt = new Date()
        item.statusHistory.push({ status: 'Delivered', timestamp: new Date(), updatedBy: user._id })
      }
    }

    if (body.status === 'Processing') {
      for (const item of order.items) {
        if (item.itemStatus === 'Confirmed') {
          item.itemStatus = 'Processing'
          item.statusHistory.push({
            status: 'Processing',
            timestamp: new Date(),
            updatedBy: user._id,
          })
        }
      }
    }

    order.status = body.status
    order.adminOverride = override || order.adminOverride
  }

  if (body.batchNote !== undefined) order.batchNote = body.batchNote

  await order.save()

  return ok({ order: { id: String(order._id), status: order.status } })
})

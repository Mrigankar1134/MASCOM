import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { deriveOrderStatus } from '@/lib/orders'
import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { isAdmin } from '@/lib/auth'
import { updateItemSchema } from '@/lib/validators'

export const PATCH = route(
  async (req, ctx: { params: Promise<{ id: string; itemId: string }> }) => {
    const user = await requireUser('staff')
    const { id, itemId } = await ctx.params
    const body = await parseBody(req, updateItemSchema)

    await connectDB()

    const order = await Order.findById(id)
    if (!order) return fail('Order not found.', 404)

    const item = order.items.id(itemId)
    if (!item) return fail('That item is not part of this order.', 404)

    const override = !!body.adminOverride && isAdmin(user)
    if (body.itemStatus === 'Delivered' && order.paymentStatus !== 'Paid' && !override) {
      return fail('Confirm the payment before marking this delivered.', 400)
    }

    item.itemStatus = body.itemStatus
    item.fulfilledAt = ['Delivered', 'Failed'].includes(body.itemStatus) ? new Date() : null
    if (body.batchNumber) item.batchNumber = body.batchNumber
    if (body.notes) item.itemNote = body.notes
    item.statusHistory.push({
      status: body.itemStatus,
      timestamp: new Date(),
      updatedBy: user._id,
      notes: body.notes,
    })

    order.status = deriveOrderStatus(order)
    await order.save()

    return ok({ order: { id: String(order._id), status: order.status } })
  },
)

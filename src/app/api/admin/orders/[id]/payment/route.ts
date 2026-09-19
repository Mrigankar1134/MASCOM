import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { Product } from '@/lib/models/Product'
import { deriveOrderStatus } from '@/lib/orders'
import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { isAdmin, isStaff } from '@/lib/auth'
import { verifyPaymentSchema } from '@/lib/validators'

/**
 * Confirms (or rejects) a payment.
 *
 * Authority rule, unchanged from the current system: the person the money was
 * sent to is the one who says it arrived. Admins can override, moderators
 * cannot, since they did not receive the money either.
 */
export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser('console')
  const { id } = await ctx.params
  const { paymentStatus, notes } = await parseBody(req, verifyPaymentSchema)

  await connectDB()

  const order = await Order.findById(id)
  if (!order) return fail('Order not found.', 404)

  const recipient = await PaymentRecipient.findById(order.paymentRecipientId).lean()
  const isTheRecipient =
    !!recipient?.userId && String(recipient.userId) === String(user._id)

  if (!isTheRecipient && !isAdmin(user)) {
    return fail(
      isStaff(user)
        ? 'Only the recipient this was paid to can verify it. An admin can override.'
        : 'Only the recipient this was paid to can verify it.',
      403,
    )
  }

  if (order.paymentStatus === paymentStatus) {
    return ok({ order: { id: String(order._id), paymentStatus: order.paymentStatus }, changed: false })
  }

  const wasPaid = order.paymentStatus === 'Paid'
  order.paymentStatus = paymentStatus
  order.paymentConfirmed = paymentStatus === 'Paid'
  order.verifiedBy = user._id
  order.verificationDate = new Date()
  order.verificationMethod = isTheRecipient ? 'Screenshot' : 'Admin'
  order.adminOverride = !isTheRecipient
  if (notes) order.verificationNotes = notes

  if (paymentStatus === 'Paid') {
    for (const item of order.items) {
      if (item.itemStatus === 'Verification Pending') item.itemStatus = 'Confirmed'
      item.statusHistory.push({
        status: 'Confirmed',
        timestamp: new Date(),
        updatedBy: user._id,
        notes: notes ?? 'Payment verified',
      })
    }

    // Count the units against the price band they were bought at, but only on
    // the transition into Paid so a double-click cannot inflate sales.
    if (!wasPaid) {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId, 'salesHistory._id': item.salesHistoryId },
          { $inc: { 'salesHistory.$.unitsSold': item.quantity, totalSold: item.quantity } },
        )
      }
    }
  } else if (paymentStatus === 'Failed') {
    for (const item of order.items) {
      item.itemStatus = 'Failed'
      item.fulfilledAt = new Date()
      item.statusHistory.push({
        status: 'Failed',
        timestamp: new Date(),
        updatedBy: user._id,
        notes: notes ?? 'Payment could not be verified',
      })
    }

    // Reverse the sales count if this order had previously been confirmed.
    if (wasPaid) {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId, 'salesHistory._id': item.salesHistoryId },
          { $inc: { 'salesHistory.$.unitsSold': -item.quantity, totalSold: -item.quantity } },
        )
      }
    }
  }

  order.status = paymentStatus === 'Failed' ? 'Failed' : deriveOrderStatus(order)
  await order.save()

  return ok({
    order: {
      id: String(order._id),
      orderId: order.orderId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      verifiedBy: user.name,
      verificationDate: order.verificationDate,
    },
    changed: true,
  })
})

import { connectDB } from '@/lib/db'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { Order } from '@/lib/models/Order'
import { User } from '@/lib/models/User'
import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { updateRecipientSchema } from '@/lib/validators'
import { plain } from '@/lib/json'

export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser('admin')
  const { id } = await ctx.params
  const body = await parseBody(req, updateRecipientSchema)

  await connectDB()

  const recipient = await PaymentRecipient.findById(id)
  if (!recipient) return fail('Recipient not found.', 404)

  const previousUserId = String(recipient.userId)
  Object.assign(recipient, body)
  await recipient.save()

  if (body.userId && body.userId !== previousUserId) {
    await User.findByIdAndUpdate(body.userId, { $set: { isRecipient: true } })
    // The previous account keeps the flag only if it still collects elsewhere.
    const stillRecipient = await PaymentRecipient.exists({ userId: previousUserId })
    if (!stillRecipient) {
      await User.findByIdAndUpdate(previousUserId, { $set: { isRecipient: false } })
    }
  }

  return ok({ recipient: plain(recipient) })
})

export const DELETE = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser('admin')
  const { id } = await ctx.params

  await connectDB()

  const recipient = await PaymentRecipient.findById(id)
  if (!recipient) return fail('Recipient not found.', 404)

  // Orders point back at this record, so deleting it would orphan the payment
  // trail. Deactivating hides them from checkout and keeps history intact.
  const orderCount = await Order.countDocuments({ paymentRecipientId: recipient._id })
  if (orderCount > 0) {
    recipient.isActive = false
    await recipient.save()
    return ok({
      deactivated: true,
      message: `${recipient.name} has ${orderCount} orders, so they were deactivated rather than deleted.`,
    })
  }

  await recipient.deleteOne()
  const stillRecipient = await PaymentRecipient.exists({ userId: recipient.userId })
  if (!stillRecipient) {
    await User.findByIdAndUpdate(recipient.userId, { $set: { isRecipient: false } })
  }

  return ok({ deleted: true })
})

import { connectDB } from '@/lib/db'
import { Batch } from '@/lib/models/Batch'
import { Order } from '@/lib/models/Order'
import { fail, ok, requireUser, route } from '@/lib/api-helpers'

export const DELETE = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser('staff')
  const { id } = await ctx.params

  await connectDB()

  const batch = await Batch.findById(id)
  if (!batch) return fail('Batch not found.', 404)

  // Put its order lines back in the waiting pool rather than orphaning them.
  await Order.updateMany(
    { 'items.batchNumber': batch.batchNumber },
    { $set: { 'items.$[item].batchNumber': 'WAITING' } },
    { arrayFilters: [{ 'item.batchNumber': batch.batchNumber }] },
  )

  await batch.deleteOne()
  return ok({ deleted: true })
})

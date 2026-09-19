import { connectDB } from '@/lib/db'
import { Batch } from '@/lib/models/Batch'
import { Order } from '@/lib/models/Order'
import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { batchSchema } from '@/lib/validators'
import { plain } from '@/lib/json'

export const GET = route(async () => {
  await requireUser('staff')
  await connectDB()

  const batches = await Batch.find().populate('productId', 'name').sort({ orderStartDate: -1 }).lean()

  // How many order lines each run is carrying.
  const counts = await Order.aggregate<{ _id: string; items: number; units: number }>([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.batchNumber',
        items: { $sum: 1 },
        units: { $sum: '$items.quantity' },
      },
    },
  ])
  const byNumber = new Map(
    counts.map((c) => [String(c._id), { items: c.items, units: c.units }]),
  )

  return ok({
    batches: plain(batches).map((b) => ({
      ...b,
      counts: byNumber.get(b.batchNumber) ?? { items: 0, units: 0 },
    })),
    waiting: byNumber.get('WAITING') ?? { items: 0, units: 0 },
  })
})

export const POST = route(async (req) => {
  const user = await requireUser('staff')
  const body = await parseBody(req, batchSchema)

  await connectDB()

  // Date inputs arrive as midnight. A run that "ends today" has to cover all
  // of today, or it reads as closed from the moment it is created.
  const orderStartDate = new Date(body.orderStartDate)
  orderStartDate.setHours(0, 0, 0, 0)
  const orderEndDate = new Date(body.orderEndDate)
  orderEndDate.setHours(23, 59, 59, 999)

  if (orderEndDate < orderStartDate) {
    return fail('The closing date cannot be before the opening date.', 422)
  }

  const batch = await Batch.create({
    ...body,
    orderStartDate,
    orderEndDate,
    createdBy: user._id,
  })

  // Adopt the orders already placed inside this window, they were parked as
  // WAITING because no run existed when they came in.
  const adopted = await Order.updateMany(
    {
      createdAt: { $gte: batch.orderStartDate, $lte: batch.orderEndDate },
      'items.productId': batch.productId,
      'items.batchNumber': 'WAITING',
    },
    { $set: { 'items.$[item].batchNumber': batch.batchNumber } },
    { arrayFilters: [{ 'item.productId': batch.productId, 'item.batchNumber': 'WAITING' }] },
  )

  return ok({ batch: plain(batch), adopted: adopted.modifiedCount }, { status: 201 })
})

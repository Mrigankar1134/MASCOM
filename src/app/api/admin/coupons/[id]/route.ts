import { connectDB } from '@/lib/db'
import { Coupon } from '@/lib/models/Coupon'
import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { z } from 'zod'

export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser('staff')
  const { id } = await ctx.params
  const { active } = await parseBody(req, z.object({ active: z.boolean() }))

  await connectDB()

  const coupon = await Coupon.findByIdAndUpdate(id, { $set: { active } }, { new: true })
  if (!coupon) return fail('Coupon not found.', 404)

  return ok({ coupon: { id: String(coupon._id), code: coupon.code, active: coupon.active } })
})

export const DELETE = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser('admin')
  const { id } = await ctx.params

  await connectDB()

  const coupon = await Coupon.findById(id)
  if (!coupon) return fail('Coupon not found.', 404)

  // A used coupon is part of order history — retire it instead of deleting.
  if (coupon.usedCount > 0) {
    coupon.active = false
    await coupon.save()
    return ok({
      deactivated: true,
      message: `${coupon.code} has been used ${coupon.usedCount} times, so it was deactivated rather than deleted.`,
    })
  }

  await coupon.deleteOne()
  return ok({ deleted: true })
})

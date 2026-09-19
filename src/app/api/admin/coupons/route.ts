import { connectDB } from '@/lib/db'
import { Coupon } from '@/lib/models/Coupon'
import { ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { z } from 'zod'

const couponSchema = z
  .object({
    code: z.string().trim().min(3).max(32).toUpperCase(),
    type: z.enum(['Percentage', 'Fixed']),
    value: z.number().min(1).max(100000),
    minOrderAmount: z.number().min(0).optional(),
    maxDiscount: z.number().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    validFrom: z.string().min(1),
    validUntil: z.string().min(1),
    description: z.string().trim().max(160).optional(),
    active: z.boolean().optional(),
  })
  .refine((c) => c.type !== 'Percentage' || c.value <= 100, {
    message: 'A percentage discount cannot be more than 100.',
    path: ['value'],
  })

export const GET = route(async () => {
  await requireUser('staff')
  await connectDB()

  const coupons = await Coupon.find().sort({ createdAt: -1 }).limit(100).lean()
  return ok({ coupons: plain(coupons) })
})

export const POST = route(async (req) => {
  const user = await requireUser('staff')
  const body = await parseBody(req, couponSchema)

  await connectDB()

  const coupon = await Coupon.create({
    ...body,
    validFrom: new Date(body.validFrom),
    validUntil: new Date(body.validUntil),
    accessType: 'Public',
    active: body.active ?? true,
    createdBy: user._id,
  })

  return ok({ coupon: plain(coupon) }, { status: 201 })
})

import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Coupon } from '@/lib/models/Coupon'
import { Product } from '@/lib/models/Product'
import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { orderItemInput } from '@/lib/validators'

const schema = z.object({
  code: z.string().trim().min(1).max(32),
  items: z.array(orderItemInput).min(1),
})

/**
 * Prices a coupon before checkout so the QR can encode the exact amount the
 * server will later expect. Without this the student would scan a total that
 * does not match what the order is worth, and verification would never line up.
 */
export const POST = route(async (req) => {
  const user = await requireUser()
  const body = await parseBody(req, schema)

  await connectDB()

  const products = await Product.find({
    _id: { $in: [...new Set(body.items.map((i) => i.productId))] },
  })
  const byId = new Map(products.map((p) => [String(p._id), p]))

  let subtotal = 0
  for (const line of body.items) {
    const product = byId.get(line.productId)
    if (!product) return fail('One of the items is no longer available.', 400)
    const band = product.salesHistory.at(-1)
    if (!band) return fail(`${product.name} has no price set.`, 400)
    subtotal += band.price * line.quantity
  }

  const now = new Date()
  const coupon = await Coupon.findOne({
    code: body.code.toUpperCase(),
    active: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  })

  if (!coupon) return fail('That code is not valid right now.', 404)
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return fail('That coupon has been fully used.', 400)
  }
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return fail(`Spend at least ₹${coupon.minOrderAmount} to use this code.`, 400)
  }
  if (
    coupon.accessType === 'UserSpecific' &&
    !coupon.applicableUsers.some((id) => String(id) === String(user._id))
  ) {
    return fail('That code is not available on your account.', 403)
  }

  const discount =
    coupon.type === 'Percentage'
      ? Math.min(
          Math.round((subtotal * coupon.value) / 100),
          coupon.maxDiscount ?? Number.MAX_SAFE_INTEGER,
        )
      : Math.min(coupon.value, subtotal)

  return ok({
    code: coupon.code,
    label:
      coupon.type === 'Percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`,
    subtotal,
    discount,
    total: Math.max(subtotal - discount, 0),
  })
})

import { headers } from 'next/headers'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Product } from '@/lib/models/Product'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { Batch } from '@/lib/models/Batch'
import { Coupon } from '@/lib/models/Coupon'
import { assessRisk, nextOrderId } from '@/lib/orders'
import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { createOrderSchema } from '@/lib/validators'
import { plain } from '@/lib/json'

export const GET = route(async () => {
  const user = await requireUser()

  const orders = await Order.find({ userId: user._id })
    .populate('paymentRecipientId', 'name upiId phoneNumber')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  return ok({ orders: plain(orders) })
})

/**
 * Places an order against a chosen payment recipient.
 *
 * There is no payment gateway in this flow: the student has already paid the
 * recipient over UPI and uploaded proof. So the order is created as
 * `Verification Pending`, and stays that way until the recipient confirms the
 * money arrived. Nothing here marks anything as paid.
 */
export const POST = route(async (req) => {
  const user = await requireUser()
  const body = await parseBody(req, createOrderSchema)

  await connectDB()

  const recipient = await PaymentRecipient.findOne({
    _id: body.paymentRecipientId,
    isActive: true,
  })
  if (!recipient) return fail('That payment recipient is no longer available.', 400)

  // ── Price the order from the database, never from the request ──────────
  const productIds = [...new Set(body.items.map((i) => i.productId))]
  const products = await Product.find({ _id: { $in: productIds } })
  const byId = new Map(products.map((p) => [String(p._id), p]))

  const items = []
  let totalAmount = 0

  for (const line of body.items) {
    const product = byId.get(line.productId)
    if (!product) return fail('One of the items is no longer available.', 400)
    if (!product.available || !product.isLive) {
      return fail(`${product.name} is not open for orders right now.`, 400)
    }

    const band = product.salesHistory.at(-1)
    if (!band) return fail(`${product.name} has no price set. Tell a coordinator.`, 400)

    if (line.size && product.availableSizes.length > 0 && !product.availableSizes.includes(line.size)) {
      return fail(`${line.size} is not available for ${product.name}.`, 400)
    }

    const selectedVariant = product.variants.find((v) => v.color === line.color)
    if (line.color && product.variants.length > 0 && !selectedVariant) {
      return fail(`${line.color} is not available for ${product.name}.`, 400)
    }

    const customName = product.allowCustomName ? line.customName : undefined

    // Every order carries a batch number so the fulfilment side can group
    // production runs; WAITING means "not assigned to a run yet".
    const now = new Date()
    const batch = await Batch.findOne({
      productId: product._id,
      orderStartDate: { $lte: now },
      orderEndDate: { $gte: now },
    }).lean()

    totalAmount += band.price * line.quantity

    items.push({
      productId: product._id,
      salesHistoryId: band._id,
      unitPrice: band.price,
      batchNote: band.note ?? '',
      quantity: line.quantity,
      customName,
      itemStatus: 'Verification Pending' as const,
      batchNumber: batch?.batchNumber ?? 'WAITING',
      productSnapshot: {
        name: product.name,
        description: product.description,
        image: selectedVariant?.imageUrls?.[0] ?? product.variants[0]?.imageUrls?.[0],
        category: product.category,
        variants: product.variants.map((v) => ({ color: v.color, imageUrls: v.imageUrls })),
        availableSizes: product.availableSizes,
      },
      variant: {
        color: line.color,
        size: line.size,
        selectedImage: selectedVariant?.imageUrls?.[0] ?? product.variants[0]?.imageUrls?.[0],
        availableColors: product.variants.map((v) => v.color),
        availableSizes: product.availableSizes,
      },
      statusHistory: [{ status: 'Verification Pending', timestamp: new Date() }],
      waitingSince: new Date(),
    })
  }

  // ── Coupon, if any ──────────────────────────────────────────────────────
  let discountAmount = 0
  let couponCodeUsed: string | undefined

  if (body.couponCode) {
    const now = new Date()
    const coupon = await Coupon.findOne({
      code: body.couponCode.toUpperCase(),
      active: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    })

    if (!coupon) return fail('That coupon code is not valid right now.', 400)
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return fail('That coupon has been fully used.', 400)
    }
    if (coupon.minOrderAmount && totalAmount < coupon.minOrderAmount) {
      return fail(`That coupon needs an order of at least ₹${coupon.minOrderAmount}.`, 400)
    }
    if (
      coupon.accessType === 'UserSpecific' &&
      !coupon.applicableUsers.some((id) => String(id) === String(user._id))
    ) {
      return fail('That coupon is not available on your account.', 403)
    }

    discountAmount =
      coupon.type === 'Percentage'
        ? Math.min(
            Math.round((totalAmount * coupon.value) / 100),
            coupon.maxDiscount ?? Number.MAX_SAFE_INTEGER,
          )
        : Math.min(coupon.value, totalAmount)

    couponCodeUsed = coupon.code
    coupon.usedCount += 1
    await coupon.save()
  }

  const finalAmountPaid = Math.max(totalAmount - discountAmount, 0)

  // ── Risk signals shown to whoever verifies the payment ──────────────────
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentOrdersByUser = await Order.countDocuments({
    userId: user._id,
    createdAt: { $gte: dayAgo },
  })
  const { riskScore, fraudFlags } = assessRisk({
    finalAmountPaid,
    itemCount: items.length,
    recentOrdersByUser,
  })

  const headerList = await headers()

  // Two checkouts can pick the same sequential id; the unique index rejects
  // the loser, so take the next number and try again.
  let created = null
  let lastError: unknown = null
  for (let attempt = 0; attempt < 4 && !created; attempt++) {
    try {
      created = await Order.create({
        orderId: await nextOrderId(),
        userId: user._id,
        items,
        totalAmount,
        discountAmount,
        finalAmountPaid,
        couponCodeUsed,
        status: 'Verification Pending',
        paymentStatus: 'Pending',
        paymentRecipientId: recipient._id,
        paidTo: recipient.name,
        screenshotUrl: body.screenshotUrl,
        paymentReference: body.paymentReference,
        paymentConfirmed: false,
        verificationMethod: 'Screenshot',
        ipAddress: headerList.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: headerList.get('user-agent') ?? undefined,
        riskScore,
        fraudFlags,
        isFraudFlagged: riskScore >= 40,
      })
    } catch (err) {
      lastError = err
      if (!(err instanceof Error) || !err.message.includes('E11000')) throw err
    }
  }

  if (!created) throw lastError ?? new Error('Could not create the order.')

  await Order.updateOne(
    { _id: created._id },
    { $set: { 'items.$[].statusHistory.0.updatedBy': user._id } },
  )

  return ok(
    {
      order: {
        id: String(created._id),
        orderId: created.orderId,
        status: created.status,
        paymentStatus: created.paymentStatus,
        finalAmountPaid: created.finalAmountPaid,
        paidTo: created.paidTo,
      },
    },
    { status: 201 },
  )
})

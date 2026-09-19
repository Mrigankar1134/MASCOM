import { connectDB } from '@/lib/db'
import { Product } from '@/lib/models/Product'
import { Order } from '@/lib/models/Order'
import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { productSchema } from '@/lib/validators'
import { plain } from '@/lib/json'

export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser('staff')
  const { id } = await ctx.params
  const body = await parseBody(req, productSchema.partial())

  await connectDB()

  const product = await Product.findById(id)
  if (!product) return fail('Product not found.', 404)

  // A price change opens a new sales band so past orders keep their own price.
  if (body.price !== undefined && body.price !== product.price) {
    product.salesHistory.push({
      price: body.price,
      unitsSold: 0,
      date: new Date(),
      note: 'Price updated',
    })
  }

  Object.assign(product, {
    ...body,
    launchTime: body.launchTime ? new Date(body.launchTime) : product.launchTime,
  })
  await product.save()

  return ok({ product: plain(product.toObject()) })
})

export const DELETE = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser('admin')
  const { id } = await ctx.params

  await connectDB()

  const ordered = await Order.exists({ 'items.productId': id })
  if (ordered) {
    // Orders reference this product, so retire it instead of deleting history.
    await Product.findByIdAndUpdate(id, { $set: { available: false, isLive: false } })
    return ok({
      retired: true,
      message: 'This product has orders against it, so it was closed rather than deleted.',
    })
  }

  await Product.findByIdAndDelete(id)
  return ok({ deleted: true })
})

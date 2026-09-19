import slugify from 'slugify'
import { connectDB } from '@/lib/db'
import { Product } from '@/lib/models/Product'
import { ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { productSchema } from '@/lib/validators'
import { plain } from '@/lib/json'

export const GET = route(async () => {
  await requireUser('staff')
  await connectDB()

  const products = await Product.find().sort({ updatedAt: -1 }).lean()
  return ok({ products: plain(products) })
})

export const POST = route(async (req) => {
  await requireUser('staff')
  const body = await parseBody(req, productSchema)

  await connectDB()

  // Keep slugs unique without making the coordinator think about it.
  const base = slugify(body.name, { lower: true, strict: true })
  let slug = base
  for (let n = 2; await Product.exists({ slug }); n++) slug = `${base}-${n}`

  const product = await Product.create({
    ...body,
    slug,
    productId: `MAS${Date.now().toString(36).toUpperCase()}`,
    launchTime: body.launchTime ? new Date(body.launchTime) : undefined,
  })

  return ok({ product: plain(product) }, { status: 201 })
})

import 'server-only'
import { connectDB } from '@/lib/db'
import { Product } from '@/lib/models/Product'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { plain } from '@/lib/json'

export type ShopProduct = {
  _id: string
  productId: string
  name: string
  slug: string
  description?: string
  price: number
  available: boolean
  isLive: boolean
  category?: string
  material?: string
  availableSizes: string[]
  allowCustomName: boolean
  launchTime?: string | null
  variants: { color: string; imageUrls: string[] }[]
  totalSold: number
  likes: number
}

export type ShopRecipient = {
  _id: string
  name: string
  upiId: string
  phoneNumber: string
  qrCodeUrl: string
  description?: string
}

function toShopProduct(doc: Record<string, unknown>): ShopProduct {
  const p = plain(doc) as Record<string, never>
  return {
    _id: String(p._id),
    productId: String(p.productId ?? ''),
    name: String(p.name ?? ''),
    slug: String(p.slug ?? p._id),
    description: p.description ?? undefined,
    price: Number(p.price ?? 0),
    available: !!p.available,
    isLive: !!p.isLive,
    category: p.category ?? undefined,
    material: p.material ?? undefined,
    availableSizes: (p.availableSizes as unknown as string[]) ?? [],
    allowCustomName: !!p.allowCustomName,
    launchTime: (p.launchTime as unknown as string) ?? null,
    variants: ((p.variants as unknown as { color: string; imageUrls: string[] }[]) ?? []).map(
      (v) => ({ color: v.color, imageUrls: v.imageUrls ?? [] }),
    ),
    totalSold: Number(p.totalSold ?? 0),
    likes: Number(p.likes ?? 0),
  }
}

/**
 * Products a student may actually see. Anything not live, or scheduled for a
 * future launch, stays hidden until its moment.
 */
export async function getShopProducts(): Promise<ShopProduct[]> {
  await connectDB()
  const now = new Date()
  const docs = await Product.find({
    $and: [
      { $or: [{ isLive: true }, { launchTime: { $lte: now } }] },
      { $or: [{ available: true }, { available: { $exists: false } }] },
    ],
  })
    .sort({ updatedAt: -1 })
    .lean()

  return docs.map(toShopProduct)
}

export async function getProductBySlug(slug: string): Promise<ShopProduct | null> {
  await connectDB()
  const doc = await Product.findOne({
    $or: [{ slug }, { productId: slug }],
  }).lean()
  return doc ? toShopProduct(doc as Record<string, unknown>) : null
}

/** Recipients a student can choose to pay at checkout. */
export async function getActiveRecipients(): Promise<ShopRecipient[]> {
  await connectDB()
  const docs = await PaymentRecipient.find({ isActive: true })
    .select('name upiId phoneNumber qrCodeUrl description')
    .sort({ name: 1 })
    .lean()

  return plain(docs).map((r) => ({
    _id: String(r._id),
    name: r.name,
    upiId: r.upiId,
    phoneNumber: r.phoneNumber,
    qrCodeUrl: r.qrCodeUrl,
    description: r.description ?? undefined,
  }))
}

/**
 * Wraps a data call so a missing/unreachable database renders an empty state
 * instead of crashing the page, the marketing site still has to work.
 */
export async function safely<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.error('[data]', err instanceof Error ? err.message : err)
    return fallback
  }
}

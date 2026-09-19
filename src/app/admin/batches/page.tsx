import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Batch } from '@/lib/models/Batch'
import { Coupon } from '@/lib/models/Coupon'
import { Order } from '@/lib/models/Order'
import { Product } from '@/lib/models/Product'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'
import { RunsBoard, type BatchRow, type CouponRow } from '@/components/admin/RunsBoard'

export const dynamic = 'force-dynamic'

export default async function RunsPage() {
  const user = await getCurrentUser()
  if (!isStaff(user)) redirect('/admin')

  await connectDB()

  const [batches, coupons, products, counts] = await Promise.all([
    Batch.find().populate('productId', 'name').sort({ orderStartDate: -1 }).lean(),
    Coupon.find().sort({ createdAt: -1 }).limit(60).lean(),
    Product.find().select('name').sort({ name: 1 }).lean(),
    Order.aggregate<{ _id: string; items: number; units: number }>([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.batchNumber',
          items: { $sum: 1 },
          units: { $sum: '$items.quantity' },
        },
      },
    ]),
  ])

  const byNumber = new Map(
    counts.map((c) => [String(c._id), { items: c.items, units: c.units }]),
  )

  return (
    <RunsBoard
      batches={
        plain(batches).map((b) => ({
          ...b,
          _id: String(b._id),
          counts: byNumber.get(b.batchNumber) ?? { items: 0, units: 0 },
        })) as unknown as BatchRow[]
      }
      coupons={plain(coupons) as unknown as CouponRow[]}
      products={plain(products).map((p) => ({ _id: String(p._id), name: p.name }))}
      waiting={byNumber.get('WAITING') ?? { items: 0, units: 0 }}
    />
  )
}

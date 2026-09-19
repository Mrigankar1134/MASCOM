import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Product } from '@/lib/models/Product'
import { User } from '@/lib/models/User'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { ok, requireUser, route } from '@/lib/api-helpers'
import { isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'

/** Numbers for the console overview, scoped to what the viewer may see. */
export const GET = route(async () => {
  const user = await requireUser('console')
  await connectDB()

  const staff = isStaff(user)
  const myRecipient = await PaymentRecipient.findOne({ userId: user._id }).lean()
  const scopeFilter = staff ? {} : { paymentRecipientId: myRecipient?._id ?? null }

  const [totals] = await Order.aggregate<{
    revenue: number
    orders: number
    pending: number
    paid: number
    failed: number
    units: number
  }>([
    { $match: scopeFilter },
    {
      $group: {
        _id: null,
        revenue: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$finalAmountPaid', 0] },
        },
        orders: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0] } },
        paid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Failed'] }, 1, 0] } },
        units: { $sum: { $sum: '$items.quantity' } },
      },
    },
  ])

  // Last 14 days of activity for the overview sparkline.
  const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
  since.setHours(0, 0, 0, 0)

  const daily = await Order.aggregate<{ _id: string; orders: number; revenue: number }>([
    { $match: { ...scopeFilter, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$finalAmountPaid', 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const series: { date: string; orders: number; revenue: number }[] = []
  for (let i = 0; i < 14; i++) {
    const day = new Date(since)
    day.setDate(since.getDate() + i)
    const key = day.toISOString().slice(0, 10)
    const found = daily.find((d) => d._id === key)
    series.push({ date: key, orders: found?.orders ?? 0, revenue: found?.revenue ?? 0 })
  }

  const topProducts = staff
    ? await Product.find()
        .select('name totalSold totalRevenue price variants')
        .sort({ totalSold: -1 })
        .limit(5)
        .lean()
    : []

  return ok({
    scope: staff ? 'all' : 'mine',
    recipient: myRecipient ? plain(myRecipient) : null,
    totals: totals ?? { revenue: 0, orders: 0, pending: 0, paid: 0, failed: 0, units: 0 },
    series,
    topProducts: plain(topProducts),
    counts: staff
      ? {
          students: await User.countDocuments(),
          products: await Product.countDocuments(),
          recipients: await PaymentRecipient.countDocuments({ isActive: true }),
        }
      : null,
  })
})

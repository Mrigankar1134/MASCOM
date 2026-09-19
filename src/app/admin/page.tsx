import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Product } from '@/lib/models/Product'
import { User } from '@/lib/models/User'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'
import { Overview, type OverviewData } from '@/components/admin/Overview'

export const dynamic = 'force-dynamic'

export default async function ConsoleOverview() {
  const user = await getCurrentUser()
  await connectDB()

  const staff = isStaff(user)
  const mine = await PaymentRecipient.findOne({ userId: user!._id }).lean()
  const scope = staff ? {} : { paymentRecipientId: mine?._id ?? null }

  const [totals] = await Order.aggregate([
    { $match: scope },
    {
      $group: {
        _id: null,
        revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$finalAmountPaid', 0] } },
        orders: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0] } },
        paid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Failed'] }, 1, 0] } },
        units: { $sum: { $sum: '$items.quantity' } },
        awaiting: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, '$finalAmountPaid', 0] },
        },
      },
    },
  ])

  // Fourteen days of collections for the overview chart.
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - 13)

  const daily = await Order.aggregate<{ _id: string; revenue: number; orders: number }>([
    { $match: { ...scope, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$finalAmountPaid', 0] } },
        orders: { $sum: 1 },
      },
    },
  ])

  const series: OverviewData['series'] = []
  for (let i = 0; i < 14; i++) {
    const day = new Date(since)
    day.setDate(since.getDate() + i)
    const key = day.toISOString().slice(0, 10)
    const found = daily.find((d) => d._id === key)
    series.push({ date: key, revenue: found?.revenue ?? 0, orders: found?.orders ?? 0 })
  }

  const recent = await Order.find(scope)
    .populate('userId', 'name rollNo')
    .sort({ createdAt: -1 })
    .limit(6)
    .lean()

  const topProducts = staff
    ? await Product.find().select('name totalSold totalRevenue').sort({ totalSold: -1 }).limit(5).lean()
    : []

  return (
    <Overview
      data={{
        scope: staff ? 'all' : 'mine',
        recipientName: mine?.name ?? null,
        viewerName: user!.name,
        totals: totals ?? {
          revenue: 0, orders: 0, pending: 0, paid: 0, failed: 0, units: 0, awaiting: 0,
        },
        series,
        recent: plain(recent) as unknown as OverviewData['recent'],
        topProducts: plain(topProducts) as unknown as OverviewData['topProducts'],
        counts: staff
          ? {
              students: await User.countDocuments(),
              products: await Product.countDocuments(),
              recipients: await PaymentRecipient.countDocuments({ isActive: true }),
            }
          : null,
      }}
    />
  )
}

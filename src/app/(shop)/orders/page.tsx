import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { getCurrentUser } from '@/lib/auth'
import { plain } from '@/lib/json'
import { OrdersList, type OrderSummary } from '@/components/orders/OrdersList'

export const metadata: Metadata = { title: 'Your orders' }
export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const user = await getCurrentUser().catch(() => null)
  if (!user) redirect('/signin?next=/orders')

  await connectDB()
  const orders = await Order.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  return <OrdersList orders={plain(orders) as unknown as OrderSummary[]} />
}

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'
import { OrderDetail, type OrderRecord } from '@/components/orders/OrderDetail'

export const metadata: Metadata = { title: 'Order' }
export const dynamic = 'force-dynamic'

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ placed?: string }>
}) {
  const { id } = await params
  const { placed } = await searchParams

  const user = await getCurrentUser().catch(() => null)
  if (!user) redirect(`/signin?next=/orders/${id}`)

  await connectDB()
  const order = await Order.findOne({
    $or: [{ orderId: id }, ...(/^[a-f\d]{24}$/i.test(id) ? [{ _id: id }] : [])],
  })
    .populate('paymentRecipientId', 'name upiId phoneNumber')
    .lean()

  if (!order) notFound()
  if (String(order.userId) !== String(user._id) && !isStaff(user)) notFound()

  return (
    <OrderDetail
      order={plain(order) as unknown as OrderRecord}
      justPlaced={placed === '1'}
    />
  )
}

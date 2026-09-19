import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { getCurrentUser, isAdmin, isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'
import { OrdersTable, type AdminOrder } from '@/components/admin/OrdersTable'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const user = await getCurrentUser()
  if (!isStaff(user)) redirect('/admin')

  await connectDB()
  const orders = await Order.find()
    .populate('userId', 'name email phone rollNo section hostel block roomNo')
    .sort({ createdAt: -1 })
    .limit(300)
    .lean()

  return (
    <OrdersTable
      orders={plain(orders) as unknown as AdminOrder[]}
      canOverride={isAdmin(user)}
    />
  )
}

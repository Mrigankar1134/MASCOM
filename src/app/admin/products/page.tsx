import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Product } from '@/lib/models/Product'
import { getCurrentUser, isAdmin, isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'
import { DropsBoard, type DropRow } from '@/components/admin/DropsBoard'

export const dynamic = 'force-dynamic'

export default async function DropsPage() {
  const user = await getCurrentUser()
  if (!isStaff(user)) redirect('/admin')

  await connectDB()
  const products = await Product.find().sort({ updatedAt: -1 }).lean()

  return (
    <DropsBoard products={plain(products) as unknown as DropRow[]} canDelete={isAdmin(user)} />
  )
}

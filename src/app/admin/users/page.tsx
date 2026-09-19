import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { getCurrentUser, isAdmin, isStaff } from '@/lib/auth'
import { plain } from '@/lib/json'
import { PeopleTable, type PersonRow } from '@/components/admin/PeopleTable'

export const dynamic = 'force-dynamic'

export default async function PeoplePage() {
  const user = await getCurrentUser()
  if (!isStaff(user)) redirect('/admin')

  await connectDB()
  const users = await User.find()
    .select('name email rollNo section phone hostel isAdmin isModerator isRecipient createdAt lastLogin')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean()

  return (
    <PeopleTable
      people={plain(users) as unknown as PersonRow[]}
      canEditRoles={isAdmin(user)}
      viewerId={String(user!._id)}
    />
  )
}

import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { ok, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'

export const GET = route(async (req) => {
  await requireUser('staff')
  await connectDB()

  const url = new URL(req.url)
  const search = url.searchParams.get('q')?.trim()
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 300)

  const filter: Record<string, unknown> = {}
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: rx }, { email: rx }, { rollNo: rx }]
  }

  const users = await User.find(filter)
    .select('name email rollNo section phone isAdmin isModerator isRecipient createdAt lastLogin')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return ok({ users: plain(users) })
})

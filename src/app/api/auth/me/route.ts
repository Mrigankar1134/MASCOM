import { getCurrentUser, rolesOf } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { profileSchema } from '@/lib/validators'
import { plain } from '@/lib/json'

export const GET = route(async () => {
  await connectDB()
  const user = await getCurrentUser()
  if (!user) return ok({ user: null })

  return ok({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      rollNo: user.rollNo ?? null,
      section: user.section ?? null,
      hostel: user.hostel ?? null,
      block: user.block ?? null,
      roomNo: user.roomNo ?? null,
      gender: user.gender ?? null,
      profilePicUrl: user.profilePicUrl ?? null,
      roles: rolesOf(user),
    },
  })
})

export const PATCH = route(async (req) => {
  const current = await requireUser()
  const body = await parseBody(req, profileSchema)

  // Empty strings mean "clear this field", not "leave it alone".
  const update = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))

  const user = await User.findByIdAndUpdate(current._id, { $set: update }, { new: true }).lean()

  return ok({ user: plain(user) })
})

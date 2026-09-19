import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { createSession, verifyPassword } from '@/lib/auth'
import { fail, ok, parseBody, route } from '@/lib/api-helpers'
import { signInSchema } from '@/lib/validators'

export const POST = route(async (req) => {
  const { email, password } = await parseBody(req, signInSchema)

  await connectDB()

  const user = await User.findOne({ email }).select('+passwordHash')
  // Same message either way, never reveal which accounts exist.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail('That email and password do not match.', 401)
  }

  user.lastLogin = new Date()
  user.logs.push({ action: 'signed_in', timestamp: new Date() })
  await user.save()

  await createSession(String(user._id))

  return ok({
    id: String(user._id),
    name: user.name,
    email: user.email,
    isAdmin: !!user.isAdmin,
    isModerator: !!user.isModerator,
    isRecipient: !!user.isRecipient,
  })
})

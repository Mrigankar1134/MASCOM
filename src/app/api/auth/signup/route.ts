import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { createSession, hashPassword, isAllowedEmail, isBootstrapAdmin } from '@/lib/auth'
import { fail, ok, parseBody, route } from '@/lib/api-helpers'
import { signUpSchema } from '@/lib/validators'

export const POST = route(async (req) => {
  const body = await parseBody(req, signUpSchema)

  if (!isAllowedEmail(body.email)) {
    const domains = process.env.ALLOWED_EMAIL_DOMAINS ?? ''
    return fail(`Use your college email address (${domains}).`, 403)
  }

  await connectDB()

  const existing = await User.findOne({ email: body.email }).lean()
  if (existing) {
    return fail('An account with that email already exists. Try signing in.', 409)
  }

  const user = await User.create({
    name: body.name,
    email: body.email,
    passwordHash: await hashPassword(body.password),
    rollNo: body.rollNo,
    section: body.section,
    phone: body.phone,
    roles: ['student'],
    isAdmin: isBootstrapAdmin(body.email),
    lastLogin: new Date(),
  })

  await createSession(String(user._id))

  return ok({ id: String(user._id), name: user.name, email: user.email }, { status: 201 })
})

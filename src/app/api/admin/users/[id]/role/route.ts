import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'
import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { roleSchema } from '@/lib/validators'
import { plain } from '@/lib/json'

export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireUser('admin')
  const { id } = await ctx.params
  const body = await parseBody(req, roleSchema)

  await connectDB()

  // Guard against an admin locking themselves out of their own console.
  if (String(actor._id) === id && body.isAdmin === false) {
    return fail('You cannot remove your own admin access.', 400)
  }

  const user = await User.findById(id)
  if (!user) return fail('User not found.', 404)

  if (body.isRecipient === false) {
    const collects = await PaymentRecipient.exists({ userId: user._id, isActive: true })
    if (collects) {
      return fail(
        'This person is still an active payment recipient. Deactivate that record first.',
        400,
      )
    }
  }

  if (body.isAdmin !== undefined) user.isAdmin = body.isAdmin
  if (body.isModerator !== undefined) user.isModerator = body.isModerator
  if (body.isRecipient !== undefined) user.isRecipient = body.isRecipient

  user.logs.push({
    action: 'roles_updated',
    timestamp: new Date(),
    metadata: { by: String(actor._id), ...body },
  })
  await user.save()

  return ok({ user: plain(user.toObject()) })
})

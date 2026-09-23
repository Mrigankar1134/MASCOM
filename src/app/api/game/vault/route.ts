import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { campusDate } from '@/lib/game/rules'
import { vaultSchema } from '@/lib/game/validators'
import { VaultConfig } from '@/lib/models/game/Social'

/** Where your alarm sits today, for friends raiding you. */
export const GET = route(async () => {
  const user = await requireUser()
  const vault = await VaultConfig.findOne({ userId: user._id, campusDate: campusDate() })
  return ok(plain({ alarmSlot: vault?.alarmSlot ?? null, lockedForToday: Boolean(vault) }))
})

/**
 * Sets the alarm for the campus day. It can only be set once a day: raids already under way keep
 * the layout they started with, and a defender can't move the alarm after seeing who is coming.
 */
export const PUT = route(async (req) => {
  const user = await requireUser()
  const body = await parseBody(req, vaultSchema)
  const date = campusDate()

  const existing = await VaultConfig.findOne({ userId: user._id, campusDate: date })
  if (existing) return fail('Your alarm is set for today. You can move it again tomorrow.', 409)

  try {
    const vault = await VaultConfig.create({ userId: user._id, campusDate: date, alarmSlot: body.alarmSlot })
    return ok(plain({ alarmSlot: vault.alarmSlot, lockedForToday: true }), { status: 201 })
  } catch {
    return fail('Your alarm is set for today. You can move it again tomorrow.', 409)
  }
})

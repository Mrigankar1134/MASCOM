import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { joinSchema, settingsSchema } from '@/lib/game/validators'
import { WEEKLY_STASH, weekId } from '@/lib/game/rules'
import { GameProfile } from '@/lib/models/game/GameProfile'

/** Creates the player's game identity: the alias others see, their cohort and friend-raid opt-in. */
export const POST = route(async (req) => {
  const user = await requireUser()
  const body = await parseBody(req, joinSchema)

  const existing = await GameProfile.findOne({ userId: user._id })
  if (existing) return fail('You have already joined Campus Heist.', 409)

  const profile = await GameProfile.create({
    userId: user._id,
    alias: body.alias,
    cohort: body.cohort,
    socialOptIn: body.socialOptIn ?? true,
    socialBalance: WEEKLY_STASH,
    stashWeek: weekId(),
  })
  return ok(plain({ alias: profile.alias, cohort: profile.cohort, socialOptIn: profile.socialOptIn }), { status: 201 })
})

/** Changes the alias, cohort or friend-raid opt-in. */
export const PATCH = route(async (req) => {
  const user = await requireUser()
  const body = await parseBody(req, settingsSchema)

  const profile = await GameProfile.findOneAndUpdate({ userId: user._id }, { $set: body }, { new: true })
  if (!profile) return fail('Join Campus Heist first.', 409)
  return ok(plain({ alias: profile.alias, cohort: profile.cohort, socialOptIn: profile.socialOptIn }))
})

import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { friendsOf } from '@/lib/game/engine'
import { pairKey } from '@/lib/game/rules'
import { friendActionSchema } from '@/lib/game/validators'
import { GameProfile } from '@/lib/models/game/GameProfile'
import { Friendship } from '@/lib/models/game/Social'

/**
 * The friends list, plus who can be raided right now. With `?q=` it searches other players by
 * alias so you can send a request; only people who have joined the game are searchable.
 */
export const GET = route(async (req) => {
  const user = await requireUser()
  const q = new URL(req.url).searchParams.get('q')?.trim()

  const lists = await friendsOf(user._id)
  let results: { userId: string; alias: string; cohort: string }[] = []

  if (q && q.length >= 2) {
    const known = new Set([
      String(user._id),
      ...lists.friends.map((f) => f.userId),
      ...lists.incoming.map((f) => f.userId),
      ...lists.outgoing.map((f) => f.userId),
    ])
    const found = await GameProfile.find({ alias: { $regex: q, $options: 'i' } })
      .select('userId alias cohort')
      .limit(20)
    results = found
      .filter((p) => !known.has(String(p.userId)))
      .map((p) => ({ userId: String(p.userId), alias: p.alias, cohort: p.cohort }))
  }

  return ok(plain({ ...lists, results }))
})

/** Sends, accepts or removes a friendship, and blocks or unblocks a player. */
export const POST = route(async (req) => {
  const user = await requireUser()
  const { action, userId: otherId } = await parseBody(req, friendActionSchema)
  if (String(user._id) === otherId) return fail('That is you.', 400)

  const key = pairKey(String(user._id), otherId)

  if (action === 'request') {
    const other = await GameProfile.findOne({ userId: otherId })
    if (!other) return fail('That player has not joined Campus Heist.', 404)
    if ((other.blocked ?? []).some((b) => String(b) === String(user._id))) {
      return fail('You cannot add that player.', 403)
    }
    const existing = await Friendship.findOne({ pairKey: key })
    if (existing?.state === 'accepted') return fail('You are already friends.', 409)
    if (existing) {
      // They asked first: treat this as accepting.
      if (String(existing.addresseeId) === String(user._id)) {
        await Friendship.updateOne({ _id: existing._id }, { $set: { state: 'accepted', acceptedAt: new Date() } })
        return ok({ state: 'accepted' })
      }
      return ok({ state: 'pending' })
    }
    await Friendship.create({ pairKey: key, requesterId: user._id, addresseeId: otherId, state: 'pending' })
    return ok({ state: 'pending' }, { status: 201 })
  }

  if (action === 'accept') {
    const updated = await Friendship.findOneAndUpdate(
      { pairKey: key, addresseeId: user._id, state: 'pending' },
      { $set: { state: 'accepted', acceptedAt: new Date() } },
      { new: true },
    )
    if (!updated) return fail('There is no request from that player.', 404)
    return ok({ state: 'accepted' })
  }

  if (action === 'remove') {
    await Friendship.deleteOne({ pairKey: key })
    return ok({ state: 'none' })
  }

  if (action === 'block') {
    await Friendship.deleteOne({ pairKey: key })
    await GameProfile.updateOne({ userId: user._id }, { $addToSet: { blocked: otherId } })
    return ok({ state: 'blocked' })
  }

  await GameProfile.updateOne({ userId: user._id }, { $pull: { blocked: otherId } })
  return ok({ state: 'none' })
})

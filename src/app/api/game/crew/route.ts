import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { CREW_SIZE, eventOpen, nextEventStart, weekId } from '@/lib/game/rules'
import { crewActionSchema } from '@/lib/game/validators'
import { Crew } from '@/lib/models/game/Crew'
import { GameProfile } from '@/lib/models/game/GameProfile'
import { Raid } from '@/lib/models/game/Raid'

function crewCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint32Array(5)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

async function describe(crewId: string) {
  const crew = await Crew.findById(crewId)
  if (!crew) return null
  const profiles = await GameProfile.find({ userId: { $in: crew.memberIds } }).select('userId alias cohort')
  const aliasBy = new Map(profiles.map((p) => [String(p.userId), p]))
  const raids = await Raid.find({ crewId: crew._id, mode: 'event', phase: 'settled' }).select('attackerId settledAmount')
  const scoreBy = new Map(raids.map((r) => [String(r.attackerId), r.settledAmount ?? 0]))
  return {
    id: String(crew._id),
    name: crew.name,
    code: crew.code,
    captainId: String(crew.captainId),
    members: crew.memberIds.map((id) => ({
      userId: String(id),
      alias: aliasBy.get(String(id))?.alias ?? 'Someone',
      cohort: aliasBy.get(String(id))?.cohort ?? '',
      score: scoreBy.get(String(id)) ?? null,
    })),
    score: raids.reduce((sum, r) => sum + (r.settledAmount ?? 0), 0),
    complete: crew.memberIds.length === CREW_SIZE,
  }
}

/** Your crew for this week's Friday Big Heist, and the event's state. */
export const GET = route(async () => {
  const user = await requireUser()
  const week = weekId()
  const crew = await Crew.findOne({ eventId: week, memberIds: user._id })
  return ok(
    plain({
      event: { id: week, open: eventOpen(), startsAt: nextEventStart(), crewSize: CREW_SIZE, maxScore: CREW_SIZE * 180 },
      crew: crew ? await describe(String(crew._id)) : null,
    }),
  )
})

/** Creates a crew, joins one with its code, or leaves before the event starts. */
export const POST = route(async (req) => {
  const user = await requireUser()
  const body = await parseBody(req, crewActionSchema)
  const week = weekId()

  const profile = await GameProfile.findOne({ userId: user._id })
  if (!profile) return fail('Join Campus Heist first.', 409)

  const mine = await Crew.findOne({ eventId: week, memberIds: user._id })

  if (body.action === 'leave') {
    if (!mine) return fail('You are not in a crew.', 404)
    if (eventOpen()) return fail('The roster is locked while the event is running.', 409)
    await Crew.updateOne({ _id: mine._id }, { $pull: { memberIds: user._id } })
    const left = await Crew.findById(mine._id)
    if (left && left.memberIds.length === 0) await Crew.deleteOne({ _id: left._id })
    return ok({ crew: null })
  }

  if (mine) return fail('You are already in a crew this week.', 409)
  if (eventOpen()) return fail('The roster locked when the event started.', 409)

  if (body.action === 'create') {
    if (!body.name) return fail('Give your crew a name.')
    const crew = await Crew.create({
      eventId: week,
      name: body.name,
      code: crewCode(),
      captainId: user._id,
      memberIds: [user._id],
    })
    return ok(plain({ crew: await describe(String(crew._id)) }), { status: 201 })
  }

  if (!body.code) return fail('Enter the crew code.')
  const crew = await Crew.findOne({ eventId: week, code: body.code.toUpperCase() })
  if (!crew) return fail('No crew with that code this week.', 404)
  if (crew.memberIds.length >= CREW_SIZE) return fail('That crew is full.', 409)

  // The array size check keeps a full crew from taking a fourth member under a race.
  const joined = await Crew.findOneAndUpdate(
    { _id: crew._id, [`memberIds.${CREW_SIZE - 1}`]: { $exists: false } },
    { $addToSet: { memberIds: user._id } },
    { new: true },
  )
  if (!joined) return fail('That crew just filled up.', 409)
  return ok(plain({ crew: await describe(String(joined._id)) }))
})

import { ok, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { CREW_SIZE, weekId } from '@/lib/game/rules'
import { Crew } from '@/lib/models/game/Crew'
import { Raid } from '@/lib/models/game/Raid'

/**
 * The Friday event table: each crew's score is the sum of its three settled event vaults, so a
 * missing attempt simply counts as zero. Ties share a position.
 */
export const GET = route(async (req) => {
  const user = await requireUser()
  const week = new URL(req.url).searchParams.get('event') || weekId()

  const crews = await Crew.find({ eventId: week })
  const raids = await Raid.find({ mode: 'event', phase: 'settled', weekId: week }).select('crewId settledAmount')
  const scoreByCrew = new Map<string, number>()
  for (const raid of raids) {
    const key = String(raid.crewId)
    scoreByCrew.set(key, (scoreByCrew.get(key) ?? 0) + (raid.settledAmount ?? 0))
  }

  const rows = crews
    .map((crew) => ({
      id: String(crew._id),
      name: crew.name,
      members: crew.memberIds.length,
      score: scoreByCrew.get(String(crew._id)) ?? 0,
      isMine: crew.memberIds.some((m) => String(m) === String(user._id)),
    }))
    .sort((a, b) => b.score - a.score)

  let lastScore: number | null = null
  let lastRank = 0
  const ranked = rows.map((row, index) => {
    const rank = row.score === lastScore ? lastRank : index + 1
    lastScore = row.score
    lastRank = rank
    return { ...row, rank }
  })

  return ok(plain({ event: week, maxScore: CREW_SIZE * 180, rows: ranked }))
})

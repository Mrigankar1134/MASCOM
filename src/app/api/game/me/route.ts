import { ok, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { leaderboard, loadProfile, quotaFor, recentEncounters, sweepExpired, viewRaid } from '@/lib/game/engine'
import { COHORTS, EXPOSURE_CAP, RANKED_PER_DAY, SOCIAL_PER_DAY, WEEKLY_STASH, campusDate, eventOpen, nextEventStart, weekId } from '@/lib/game/rules'
import { Crew } from '@/lib/models/game/Crew'
import { Raid } from '@/lib/models/game/Raid'
import { VaultConfig } from '@/lib/models/game/Social'

/** Everything the game's home screen needs in one call. */
export const GET = route(async () => {
  const user = await requireUser()
  const profile = await loadProfile(user._id)

  if (!profile) {
    return ok({
      joined: false,
      cohorts: COHORTS,
      suggestedAlias: user.name?.split(' ')[0] ?? '',
      rules: { first: 80, second: 180, rankedPerDay: RANKED_PER_DAY, socialPerDay: SOCIAL_PER_DAY, exposureCap: EXPOSURE_CAP, weeklyStash: WEEKLY_STASH },
    })
  }

  await sweepExpired(user._id)

  const week = weekId()
  const date = campusDate()
  const [quota, standings, active, vault, crew, encounters] = await Promise.all([
    quotaFor(user._id, date),
    leaderboard(user._id, 'campus', week, 5),
    Raid.findOne({ attackerId: user._id, phase: { $in: ['active', 'decision'] } }),
    VaultConfig.findOne({ userId: user._id, campusDate: date }),
    Crew.findOne({ eventId: week, memberIds: user._id }),
    recentEncounters(user._id, 8),
  ])

  return ok(
    plain({
      joined: true,
      profile: {
        alias: profile.alias,
        cohort: profile.cohort,
        socialOptIn: profile.socialOptIn,
        stash: profile.socialBalance,
        reserved: profile.socialReserved,
      },
      cohorts: COHORTS,
      attempts: { ranked: quota.rankedLeft, social: quota.socialLeft, exposureLeft: quota.exposureLeft, eventUsed: quota.eventUsed },
      week: {
        id: week,
        points: standings.me?.points ?? 0,
        rank: standings.me?.rank ?? 0,
        attempts: standings.me?.attempts ?? 0,
        top: standings.rows.slice(0, 3),
      },
      activeRaid: active ? await viewRaid(active) : null,
      vault: { alarmSlot: vault?.alarmSlot ?? null, lockedForToday: Boolean(vault) },
      event: {
        open: eventOpen(),
        startsAt: nextEventStart(),
        crew: crew ? { id: String(crew._id), name: crew.name, code: crew.code, size: crew.memberIds.length } : null,
      },
      encounters,
      rules: { first: 80, second: 180, rankedPerDay: RANKED_PER_DAY, socialPerDay: SOCIAL_PER_DAY, exposureCap: EXPOSURE_CAP, weeklyStash: WEEKLY_STASH },
    }),
  )
})

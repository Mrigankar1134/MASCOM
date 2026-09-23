import { fail, ok, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { settleRaid, viewRaid } from '@/lib/game/engine'
import { payoutFor } from '@/lib/game/rules'
import { Raid } from '@/lib/models/game/Raid'

type Context = { params: Promise<{ id: string }> }

/** Resumes a raid: the same server state as before, never a fresh roll. */
export const GET = route(async (_req: Request, context: Context) => {
  const user = await requireUser()
  const { id } = await context.params

  const raid = await Raid.findOne({ _id: id, attackerId: user._id })
  if (!raid) return fail('That raid is not yours.', 404)

  if (raid.phase !== 'settled' && raid.expiresAt.getTime() < Date.now()) {
    const hitAlarm = raid.openedDoors.includes(raid.alarmSlot)
    const safe = raid.openedDoors.filter((d) => d !== raid.alarmSlot).length
    const settled = await settleRaid(raid, hitAlarm ? 0 : payoutFor(Math.min(safe, 1)), hitAlarm ? 'caught' : 'timeout')
    return ok(plain({ raid: await viewRaid(settled) }))
  }
  return ok(plain({ raid: await viewRaid(raid) }))
})

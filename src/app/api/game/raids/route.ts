import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { GameError, startRaid, viewRaid } from '@/lib/game/engine'
import { startRaidSchema } from '@/lib/game/validators'

/**
 * Starts a raid. The server picks the target for ranked play, freezes the hidden layout and
 * charges the attempt; the reply only ever contains what the attacker may see.
 */
export const POST = route(async (req) => {
  const user = await requireUser()
  const body = await parseBody(req, startRaidSchema)

  try {
    const raid = await startRaid(user._id, body)
    return ok(plain({ raid: await viewRaid(raid) }), { status: 201 })
  } catch (err) {
    if (err instanceof GameError) return fail(err.message, err.status)
    throw err
  }
})

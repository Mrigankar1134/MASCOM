import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { GameError, openDoor, viewRaid } from '@/lib/game/engine'
import { openDoorSchema } from '@/lib/game/validators'

type Context = { params: Promise<{ id: string }> }

/** Opens one door. The reply reveals that door only, and the settlement if the raid ended. */
export const POST = route(async (req: Request, context: Context) => {
  const user = await requireUser()
  const { id } = await context.params
  const body = await parseBody(req, openDoorSchema)

  try {
    const raid = await openDoor(user._id, id, body.door, body.version)
    return ok(plain({ raid: await viewRaid(raid) }))
  } catch (err) {
    if (err instanceof GameError) return fail(err.message, err.status)
    throw err
  }
})

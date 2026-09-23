import { fail, ok, parseBody, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { GameError, escape, viewRaid } from '@/lib/game/engine'
import { escapeSchema } from '@/lib/game/validators'

type Context = { params: Promise<{ id: string }> }

/** Walks away with the loot on the table. Retrying the same request settles only once. */
export const POST = route(async (req: Request, context: Context) => {
  const user = await requireUser()
  const { id } = await context.params
  const body = await parseBody(req, escapeSchema)

  try {
    const raid = await escape(user._id, id, body.version)
    return ok(plain({ raid: await viewRaid(raid) }))
  } catch (err) {
    if (err instanceof GameError) return fail(err.message, err.status)
    throw err
  }
})

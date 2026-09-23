import { ok, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { recentEncounters } from '@/lib/game/engine'

/** Recent friend raids on both sides: who escaped, who got caught, and the real amount moved. */
export const GET = route(async () => {
  const user = await requireUser()
  return ok(plain({ encounters: await recentEncounters(user._id, 30) }))
})

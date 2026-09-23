import { ok, requireUser, route } from '@/lib/api-helpers'
import { plain } from '@/lib/json'
import { leaderboard } from '@/lib/game/engine'
import { weekId } from '@/lib/game/rules'

/** Weekly standings for one of the three views: campus, my cohort or friends. */
export const GET = route(async (req) => {
  const user = await requireUser()
  const params = new URL(req.url).searchParams
  const scopeParam = params.get('scope')
  const scope = scopeParam === 'cohort' || scopeParam === 'friends' ? scopeParam : 'campus'
  const week = params.get('week') || weekId()

  const { rows, me } = await leaderboard(user._id, scope, week, 50)
  return ok(plain({ week, scope, rows, me }))
})

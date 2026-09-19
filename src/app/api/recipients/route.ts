import { getActiveRecipients } from '@/lib/data'
import { ok, requireUser, route } from '@/lib/api-helpers'

/**
 * The people a student can pay. Requires a session: these are personal UPI
 * handles and phone numbers, not public information.
 */
export const GET = route(async () => {
  await requireUser()
  const recipients = await getActiveRecipients()
  return ok({ recipients })
})

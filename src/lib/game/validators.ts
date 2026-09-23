import { z } from 'zod'
import { COHORTS, DOORS } from '@/lib/game/rules'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'That player id looks wrong.')

export const joinSchema = z.object({
  alias: z.string().trim().min(2, 'Pick an alias of at least 2 characters.').max(24),
  cohort: z.enum(COHORTS),
  socialOptIn: z.boolean().optional(),
})

export const settingsSchema = z.object({
  alias: z.string().trim().min(2).max(24).optional(),
  cohort: z.enum(COHORTS).optional(),
  socialOptIn: z.boolean().optional(),
})

export const startRaidSchema = z.object({
  mode: z.enum(['ranked', 'friend', 'event']),
  targetId: objectId.optional(),
  idempotencyKey: z.string().min(8).max(64).optional(),
})

export const openDoorSchema = z.object({
  door: z.number().int().min(0).max(DOORS - 1),
  version: z.number().int().min(0).optional(),
})

export const escapeSchema = z.object({
  version: z.number().int().min(0).optional(),
})

export const vaultSchema = z.object({
  alarmSlot: z.number().int().min(0).max(DOORS - 1),
})

export const friendActionSchema = z.object({
  action: z.enum(['request', 'accept', 'remove', 'block', 'unblock']),
  userId: objectId,
})

export const crewActionSchema = z.object({
  action: z.enum(['create', 'join', 'leave']),
  name: z.string().trim().min(2).max(24).optional(),
  code: z.string().trim().min(4).max(8).optional(),
})

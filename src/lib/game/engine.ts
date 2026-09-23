import 'server-only'
import type { Types } from 'mongoose'
import { Crew } from '@/lib/models/game/Crew'
import { DailyQuota } from '@/lib/models/game/DailyQuota'
import { GameProfile, type GameProfileDoc } from '@/lib/models/game/GameProfile'
import { Raid, type RaidDoc } from '@/lib/models/game/Raid'
import { Encounter, Friendship, VaultConfig } from '@/lib/models/game/Social'
import { WeeklyScore } from '@/lib/models/game/WeeklyScore'
import { User } from '@/lib/models/User'
import {
  DOORS,
  EXPOSURE_CAP,
  MIN_EXPOSURE,
  RAID_TIMEOUT_MS,
  RANKED_PER_DAY,
  SECOND_DOOR,
  SOCIAL_PER_DAY,
  WEEKLY_STASH,
  campusDate,
  eventOpen,
  pairKey,
  payoutFor,
  randomAlarmSlot,
  weekId,
} from '@/lib/game/rules'

/**
 * The rules engine. Everything that decides an outcome or moves a balance lives here, so the
 * app only ever sends intentions (start, open, escape) and receives sanitized state.
 *
 * MongoDB here runs standalone, so there are no multi-document transactions. Instead every
 * contested change is a single conditional `findOneAndUpdate` (atomic on one document) backed by
 * a unique index: attempts can't go past the daily limit, a raid can only settle once, and a
 * defender's exposure can't exceed the cap even if two friends raid them at the same moment.
 */

const DUPLICATE_KEY = 11000

function isDuplicate(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === DUPLICATE_KEY
}

export type Id = Types.ObjectId | string

// ---------------------------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------------------------

/** The player's game profile, with the weekly stash topped up the first time they appear in a new week. */
export async function loadProfile(userId: Id): Promise<GameProfileDoc | null> {
  const profile = await GameProfile.findOne({ userId })
  if (!profile) return null
  const week = weekId()
  if (profile.stashWeek !== week) {
    // A new week: reset the stash to its seed. Reserved coins belong to raids that are over.
    await GameProfile.updateOne(
      { _id: profile._id, stashWeek: profile.stashWeek },
      { $set: { socialBalance: WEEKLY_STASH, socialReserved: 0, stashWeek: week } },
    )
    return GameProfile.findById(profile._id)
  }
  return profile
}

export async function quotaFor(userId: Id, date = campusDate()) {
  const quota = await DailyQuota.findOne({ userId, campusDate: date })
  return {
    rankedLeft: Math.max(0, RANKED_PER_DAY - (quota?.rankedUsed ?? 0)),
    socialLeft: Math.max(0, SOCIAL_PER_DAY - (quota?.socialUsed ?? 0)),
    eventUsed: quota?.eventUsed ?? 0,
    exposureLeft: Math.max(0, EXPOSURE_CAP - (quota?.exposureUsed ?? 0) - (quota?.exposureReserved ?? 0)),
  }
}

/** Takes one attempt of the given kind, or returns false when the daily limit is already spent. */
async function consumeAttempt(userId: Id, date: string, field: 'rankedUsed' | 'socialUsed' | 'eventUsed', limit: number) {
  try {
    const quota = await DailyQuota.findOneAndUpdate(
      { userId, campusDate: date, [field]: { $lt: limit } },
      { $inc: { [field]: 1 }, $setOnInsert: { userId, campusDate: date } },
      { new: true, upsert: true },
    )
    return Boolean(quota)
  } catch (err) {
    // The unique (userId, campusDate) index rejects the upsert when the row exists but is full.
    if (isDuplicate(err)) return false
    throw err
  }
}

async function refundAttempt(userId: Id, date: string, field: 'rankedUsed' | 'socialUsed' | 'eventUsed') {
  await DailyQuota.updateOne({ userId, campusDate: date, [field]: { $gt: 0 } }, { $inc: { [field]: -1 } })
}

// ---------------------------------------------------------------------------------------------
// Sanitized views
// ---------------------------------------------------------------------------------------------

export type DoorState = 'closed' | 'safe' | 'alarm'

export type RaidView = {
  id: string
  mode: string
  phase: string
  doors: DoorState[]
  provisional: number
  rewardCap: number | null
  outcome: string | null
  settledAmount: number | null
  nominalAmount: number | null
  version: number
  expiresAt: string
  target: { alias: string; cohort: string } | null
}

/** What the attacker is allowed to see: opened doors only, never the hidden layout. */
export async function viewRaid(raid: RaidDoc): Promise<RaidView> {
  const doors: DoorState[] = Array.from({ length: DOORS }, (_, i) => {
    if (raid.openedDoors.includes(i)) return i === raid.alarmSlot ? 'alarm' : 'safe'
    // Once it's over there's nothing left to protect, so show where the alarm was.
    if (raid.phase === 'settled' && i === raid.alarmSlot) return 'alarm'
    return 'closed'
  })
  let target: RaidView['target'] = null
  if (raid.defenderId) {
    const profile = await GameProfile.findOne({ userId: raid.defenderId }).select('alias cohort')
    if (profile) target = { alias: profile.alias, cohort: profile.cohort }
  }
  return {
    id: String(raid._id),
    mode: raid.mode,
    phase: raid.phase,
    doors,
    provisional: raid.provisional ?? 0,
    rewardCap: raid.rewardCap ?? null,
    outcome: raid.outcome ?? null,
    settledAmount: raid.settledAmount ?? null,
    nominalAmount: raid.nominalAmount ?? null,
    version: raid.version ?? 0,
    expiresAt: raid.expiresAt.toISOString(),
    target,
  }
}

// ---------------------------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------------------------

/**
 * Ends a raid exactly once and applies its effects. The phase flip is the guard: whoever wins
 * that update does the payout, so a retried request can never award twice.
 */
export async function settleRaid(raid: RaidDoc, amount: number, outcome: 'escaped' | 'caught' | 'timeout'): Promise<RaidDoc> {
  // A friend raid can only move what was reserved from the defender, so the settled amount is
  // the real transfer. The nominal 80/180 is kept beside it, and the result screen says both.
  const paid = raid.mode === 'friend' ? Math.min(amount, raid.reservedAmount ?? 0) : amount

  const settled = await Raid.findOneAndUpdate(
    { _id: raid._id, phase: { $in: ['active', 'decision'] } },
    {
      $set: { phase: 'settled', settledAmount: paid, nominalAmount: amount, outcome, settledAt: new Date() },
      $inc: { version: 1 },
    },
    { new: true },
  )
  if (!settled) return (await Raid.findById(raid._id)) as RaidDoc

  if (settled.mode === 'ranked') {
    await WeeklyScore.updateOne(
      { userId: settled.attackerId, weekId: settled.weekId },
      {
        $inc: { points: amount, attempts: 1, escapes: amount > 0 ? 1 : 0, caught: amount > 0 ? 0 : 1 },
        $setOnInsert: { userId: settled.attackerId, weekId: settled.weekId },
      },
      { upsert: true },
    )
  }

  if (settled.mode === 'friend' && settled.defenderId) {
    const reserved = settled.reservedAmount ?? 0
    if (paid > 0) {
      await GameProfile.updateOne({ userId: settled.attackerId }, { $inc: { socialBalance: paid } })
    }
    await GameProfile.updateOne(
      { userId: settled.defenderId },
      { $inc: { socialReserved: -reserved, socialBalance: reserved - paid } },
    )
    await DailyQuota.updateOne(
      { userId: settled.defenderId, campusDate: settled.campusDate },
      { $inc: { exposureReserved: -reserved, exposureUsed: paid } },
    )
    try {
      await Encounter.create({
        raidId: settled._id,
        attackerId: settled.attackerId,
        defenderId: settled.defenderId,
        amount: paid,
        outcome,
        campusDate: settled.campusDate,
      })
    } catch (err) {
      if (!isDuplicate(err)) throw err
    }
  }

  await GameProfile.updateOne({ userId: settled.attackerId }, { $set: { lastPlayedAt: new Date() } })
  return settled
}

/**
 * Settles anything the player left hanging: on timeout they keep a single safe door's 80 and
 * lose anything they were gambling with, exactly as if they had walked away.
 */
export async function sweepExpired(userId: Id): Promise<void> {
  const stale = await Raid.find({
    attackerId: userId,
    phase: { $in: ['active', 'decision'] },
    expiresAt: { $lt: new Date() },
  })
  for (const raid of stale) {
    const safeOpened = raid.openedDoors.filter((d) => d !== raid.alarmSlot).length
    const hitAlarm = raid.openedDoors.includes(raid.alarmSlot)
    await settleRaid(raid, hitAlarm ? 0 : payoutFor(Math.min(safeOpened, 1)), hitAlarm ? 'caught' : 'timeout')
  }
}

// ---------------------------------------------------------------------------------------------
// Starting a raid
// ---------------------------------------------------------------------------------------------

export class GameError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
  }
}

async function pickRankedTarget(userId: Id, blocked: Id[]): Promise<Types.ObjectId | null> {
  const [pick] = await GameProfile.aggregate<{ userId: Types.ObjectId }>([
    { $match: { userId: { $nin: [userId, ...blocked] } } },
    { $sample: { size: 1 } },
    { $project: { userId: 1 } },
  ])
  return pick?.userId ?? null
}

/** Reserves a defender's coins for a friend raid, or returns 0 when they can't be raided now. */
async function reserveExposure(defenderId: Id, date: string, wanted: number): Promise<number> {
  const quota = await DailyQuota.findOne({ userId: defenderId, campusDate: date })
  const room = EXPOSURE_CAP - (quota?.exposureUsed ?? 0) - (quota?.exposureReserved ?? 0)
  const defender = await GameProfile.findOne({ userId: defenderId })
  const amount = Math.min(wanted, room, defender?.socialBalance ?? 0)
  if (amount < MIN_EXPOSURE) return 0

  // Make sure the row exists first: MongoDB does not allow $expr in an upsert's filter.
  try {
    await DailyQuota.updateOne(
      { userId: defenderId, campusDate: date },
      { $setOnInsert: { userId: defenderId, campusDate: date } },
      { upsert: true },
    )
  } catch (err) {
    if (!isDuplicate(err)) throw err // a parallel raid created it, which is fine
  }

  // Then take the room atomically, so two friends raiding at once can't exceed the cap.
  const updated = await DailyQuota.findOneAndUpdate(
    {
      userId: defenderId,
      campusDate: date,
      $expr: { $lte: [{ $add: ['$exposureUsed', '$exposureReserved', amount] }, EXPOSURE_CAP] },
    },
    { $inc: { exposureReserved: amount } },
    { new: true },
  )
  if (!updated) return 0 // another raid took the room first

  // Hold the coins themselves, so a second raid can't promise the same balance twice.
  const held = await GameProfile.findOneAndUpdate(
    { userId: defenderId, socialBalance: { $gte: amount } },
    { $inc: { socialBalance: -amount, socialReserved: amount } },
    { new: true },
  )
  if (!held) {
    await DailyQuota.updateOne({ userId: defenderId, campusDate: date }, { $inc: { exposureReserved: -amount } })
    return 0
  }
  return amount
}

async function releaseExposure(defenderId: Id, date: string, amount: number) {
  if (amount <= 0) return
  await DailyQuota.updateOne({ userId: defenderId, campusDate: date }, { $inc: { exposureReserved: -amount } })
  await GameProfile.updateOne({ userId: defenderId }, { $inc: { socialReserved: -amount, socialBalance: amount } })
}

export type StartOptions = {
  mode: 'ranked' | 'friend' | 'event'
  targetId?: string
  idempotencyKey?: string
}

export async function startRaid(userId: Id, options: StartOptions): Promise<RaidDoc> {
  const profile = await loadProfile(userId)
  if (!profile) throw new GameError('Join Campus Heist first.', 409)

  await sweepExpired(userId)

  if (options.idempotencyKey) {
    const existing = await Raid.findOne({ idempotencyKey: options.idempotencyKey, attackerId: userId })
    if (existing) return existing
  }

  const active = await Raid.findOne({ attackerId: userId, phase: { $in: ['active', 'decision'] } })
  if (active) return active

  const date = campusDate()
  const week = weekId()
  let defenderId: Types.ObjectId | null = null
  let reserved = 0
  let rewardCap: number | null = null
  let crewId: Types.ObjectId | undefined

  if (options.mode === 'ranked') {
    if (!(await consumeAttempt(userId, date, 'rankedUsed', RANKED_PER_DAY))) {
      throw new GameError('You have used all three ranked raids today. They reset at midnight.', 429)
    }
    defenderId = await pickRankedTarget(userId, profile.blocked ?? [])
  } else if (options.mode === 'friend') {
    if (!options.targetId) throw new GameError('Pick a friend to raid.')
    const target = await loadProfile(options.targetId)
    if (!target) throw new GameError('That player has not joined Campus Heist.', 404)
    if (!target.socialOptIn) throw new GameError('That player has friend raids turned off.', 403)
    if ((target.blocked ?? []).some((b) => String(b) === String(userId))) {
      throw new GameError('You cannot raid that player.', 403)
    }
    const friendship = await Friendship.findOne({ pairKey: pairKey(String(userId), String(options.targetId)), state: 'accepted' })
    if (!friendship) throw new GameError('You can only raid accepted friends.', 403)

    const already = await Raid.findOne({
      attackerId: userId,
      defenderId: options.targetId,
      mode: 'friend',
      campusDate: date,
    })
    if (already) throw new GameError('You have already raided them today. Try someone else.', 429)

    if (!(await consumeAttempt(userId, date, 'socialUsed', SOCIAL_PER_DAY))) {
      throw new GameError('You have used all three friend raids today.', 429)
    }
    reserved = await reserveExposure(options.targetId, date, SECOND_DOOR)
    if (reserved === 0) {
      await refundAttempt(userId, date, 'socialUsed')
      throw new GameError('They have nothing left to lose today. Their vault is safe until tomorrow.', 409)
    }
    defenderId = target.userId as Types.ObjectId
    rewardCap = reserved
  } else {
    if (!eventOpen()) throw new GameError('The Friday Big Heist is not open right now.', 409)
    const crew = await Crew.findOne({ eventId: week, memberIds: userId })
    if (!crew) throw new GameError('Join a crew of three before the event.', 409)
    if (crew.memberIds.length !== 3) throw new GameError('Your crew needs three members.', 409)
    if (!(await consumeAttempt(userId, date, 'eventUsed', 1))) {
      throw new GameError('You have already taken your event vault.', 429)
    }
    crewId = crew._id
  }

  // The hidden layout: chosen now, frozen for this raid, never sent to the attacker.
  let alarmSlot = randomAlarmSlot()
  if (options.mode === 'friend' && defenderId) {
    const vault = await VaultConfig.findOne({ userId: defenderId, campusDate: date })
    if (vault) alarmSlot = vault.alarmSlot
  }

  try {
    return await Raid.create({
      mode: options.mode,
      attackerId: userId,
      defenderId,
      alarmSlot,
      openedDoors: [],
      phase: 'active',
      provisional: 0,
      reservedAmount: reserved,
      rewardCap,
      campusDate: date,
      weekId: week,
      crewId,
      idempotencyKey: options.idempotencyKey,
      expiresAt: new Date(Date.now() + RAID_TIMEOUT_MS),
    })
  } catch (err) {
    // Roll back what we took if the raid itself could not be created.
    if (options.mode === 'friend' && defenderId) await releaseExposure(defenderId, date, reserved)
    const field = options.mode === 'ranked' ? 'rankedUsed' : options.mode === 'friend' ? 'socialUsed' : 'eventUsed'
    await refundAttempt(userId, date, field)
    if (isDuplicate(err) && options.idempotencyKey) {
      const existing = await Raid.findOne({ idempotencyKey: options.idempotencyKey })
      if (existing) return existing
    }
    throw err
  }
}

// ---------------------------------------------------------------------------------------------
// Playing a raid
// ---------------------------------------------------------------------------------------------

export async function openDoor(userId: Id, raidId: string, door: number, expectedVersion?: number): Promise<RaidDoc> {
  if (!Number.isInteger(door) || door < 0 || door >= DOORS) throw new GameError('Pick one of the three doors.')

  const filter: Record<string, unknown> = {
    _id: raidId,
    attackerId: userId,
    phase: { $in: ['active', 'decision'] },
    openedDoors: { $ne: door },
  }
  if (expectedVersion !== undefined) filter.version = expectedVersion

  const raid = await Raid.findOneAndUpdate(filter, { $push: { openedDoors: door }, $inc: { version: 1 } }, { new: true })
  if (!raid) {
    const current = await Raid.findOne({ _id: raidId, attackerId: userId })
    if (!current) throw new GameError('That raid is not yours.', 404)
    if (current.phase === 'settled') return current
    throw new GameError('That door was already opened.', 409)
  }

  if (raid.expiresAt.getTime() < Date.now()) {
    const safe = raid.openedDoors.filter((d) => d !== raid.alarmSlot).length
    return settleRaid(raid, raid.openedDoors.includes(raid.alarmSlot) ? 0 : payoutFor(Math.min(safe, 1)), 'timeout')
  }

  if (door === raid.alarmSlot) return settleRaid(raid, 0, 'caught')

  const safeOpened = raid.openedDoors.length
  if (safeOpened >= 2) return settleRaid(raid, payoutFor(2), 'escaped')

  // One safe door: the loot is provisional until they escape or risk the next door.
  return (await Raid.findOneAndUpdate(
    { _id: raid._id, phase: 'active' },
    { $set: { phase: 'decision', provisional: payoutFor(1) }, $inc: { version: 1 } },
    { new: true },
  )) as RaidDoc
}

export async function escape(userId: Id, raidId: string, expectedVersion?: number): Promise<RaidDoc> {
  const filter: Record<string, unknown> = { _id: raidId, attackerId: userId }
  if (expectedVersion !== undefined) filter.version = expectedVersion
  const raid = await Raid.findOne(filter)
  if (!raid) {
    const current = await Raid.findOne({ _id: raidId, attackerId: userId })
    if (current?.phase === 'settled') return current
    throw new GameError('That raid is not yours, or it has moved on.', 409)
  }
  if (raid.phase === 'settled') return raid
  if (raid.phase !== 'decision') throw new GameError('Open a door first.', 409)
  return settleRaid(raid, raid.provisional ?? 0, 'escaped')
}

// ---------------------------------------------------------------------------------------------
// Standings
// ---------------------------------------------------------------------------------------------

export type LeaderboardRow = {
  userId: string
  alias: string
  cohort: string
  points: number
  attempts: number
  rank: number
  isMe: boolean
}

/** Weekly standings, ranked 1, 2, 2, 4 so ties share a position. */
export async function leaderboard(
  userId: Id,
  scope: 'campus' | 'cohort' | 'friends',
  week = weekId(),
  limit = 50,
): Promise<{ rows: LeaderboardRow[]; me: LeaderboardRow | null }> {
  const profile = await loadProfile(userId)
  let allowed: Types.ObjectId[] | null = null

  if (scope === 'cohort' && profile) {
    const peers = await GameProfile.find({ cohort: profile.cohort }).select('userId')
    allowed = peers.map((p) => p.userId as Types.ObjectId)
  }
  if (scope === 'friends') {
    const friends = await Friendship.find({ state: 'accepted', $or: [{ requesterId: userId }, { addresseeId: userId }] })
    allowed = friends.map((f) => (String(f.requesterId) === String(userId) ? f.addresseeId : f.requesterId) as Types.ObjectId)
    allowed.push(userId as Types.ObjectId)
  }

  const query: Record<string, unknown> = { weekId: week, attempts: { $gt: 0 } }
  if (allowed) query.userId = { $in: allowed }

  const scores = await WeeklyScore.find(query).sort({ points: -1, updatedAt: 1 }).limit(limit)
  const profiles = await GameProfile.find({ userId: { $in: scores.map((s) => s.userId) } }).select('userId alias cohort')
  const byUser = new Map(profiles.map((p) => [String(p.userId), p]))

  const rows: LeaderboardRow[] = []
  let lastPoints: number | null = null
  let lastRank = 0
  scores.forEach((score, index) => {
    const rank = score.points === lastPoints ? lastRank : index + 1
    lastPoints = score.points
    lastRank = rank
    const p = byUser.get(String(score.userId))
    rows.push({
      userId: String(score.userId),
      alias: p?.alias ?? 'Someone',
      cohort: p?.cohort ?? '',
      points: score.points,
      attempts: score.attempts,
      rank,
      isMe: String(score.userId) === String(userId),
    })
  })

  let me = rows.find((r) => r.isMe) ?? null
  if (!me && profile) {
    const mine = await WeeklyScore.findOne({ userId, weekId: week })
    const ahead = mine ? await WeeklyScore.countDocuments({ weekId: week, points: { $gt: mine.points } }) : null
    me = {
      userId: String(userId),
      alias: profile.alias,
      cohort: profile.cohort,
      points: mine?.points ?? 0,
      attempts: mine?.attempts ?? 0,
      rank: ahead === null ? 0 : ahead + 1,
      isMe: true,
    }
  }
  return { rows, me }
}

/** Friend list with who can actually be raided right now, and why not when they can't. */
export async function friendsOf(userId: Id) {
  const links = await Friendship.find({ $or: [{ requesterId: userId }, { addresseeId: userId }] })
  const otherId = (f: (typeof links)[number]) =>
    String(f.requesterId) === String(userId) ? f.addresseeId : f.requesterId

  const ids = links.map(otherId)
  const [profiles, users] = await Promise.all([
    GameProfile.find({ userId: { $in: ids } }).select('userId alias cohort socialOptIn blocked socialBalance'),
    User.find({ _id: { $in: ids } }).select('name'),
  ])
  const profileBy = new Map(profiles.map((p) => [String(p.userId), p]))
  const userBy = new Map(users.map((u) => [String(u._id), u]))
  const date = campusDate()
  const quotas = await DailyQuota.find({ userId: { $in: ids }, campusDate: date })
  const quotaBy = new Map(quotas.map((q) => [String(q.userId), q]))
  const raidedToday = await Raid.find({ attackerId: userId, mode: 'friend', campusDate: date }).select('defenderId')
  const already = new Set(raidedToday.map((r) => String(r.defenderId)))

  const friends = []
  const incoming = []
  const outgoing = []
  for (const link of links) {
    const id = String(otherId(link))
    const profile = profileBy.get(id)
    const entry = {
      userId: id,
      alias: profile?.alias ?? userBy.get(id)?.name ?? 'Someone',
      cohort: profile?.cohort ?? '',
      joined: Boolean(profile),
    }
    if (link.state === 'pending') {
      if (String(link.addresseeId) === String(userId)) incoming.push(entry)
      else outgoing.push(entry)
      continue
    }
    const quota = quotaBy.get(id)
    const room = EXPOSURE_CAP - (quota?.exposureUsed ?? 0) - (quota?.exposureReserved ?? 0)
    const exposure = Math.min(room, profile?.socialBalance ?? 0)
    const blockedMe = (profile?.blocked ?? []).some((b) => String(b) === String(userId))
    friends.push({
      ...entry,
      optedIn: profile?.socialOptIn ?? false,
      exposure: Math.max(0, exposure),
      raidable: Boolean(profile) && (profile?.socialOptIn ?? false) && !blockedMe && exposure >= MIN_EXPOSURE && !already.has(id),
      reason: !profile
        ? 'Has not joined the game'
        : blockedMe
          ? 'Not available'
          : !profile.socialOptIn
            ? 'Friend raids turned off'
            : already.has(id)
              ? 'Already raided today'
              : exposure < MIN_EXPOSURE
                ? 'Nothing left to lose today'
                : null,
    })
  }
  return { friends, incoming, outgoing }
}

/** Recent friend-raid history for both sides, newest first. */
export async function recentEncounters(userId: Id, limit = 20) {
  const rows = await Encounter.find({ $or: [{ attackerId: userId }, { defenderId: userId }] })
    .sort({ createdAt: -1 })
    .limit(limit)
  const ids = rows.flatMap((r) => [r.attackerId, r.defenderId])
  const profiles = await GameProfile.find({ userId: { $in: ids } }).select('userId alias')
  const aliasBy = new Map(profiles.map((p) => [String(p.userId), p.alias]))
  return rows.map((r) => {
    const raided = String(r.attackerId) === String(userId)
    const otherId = raided ? r.defenderId : r.attackerId
    return {
      id: String(r._id),
      raided,
      otherAlias: aliasBy.get(String(otherId)) ?? 'Someone',
      amount: r.amount,
      outcome: r.outcome,
      at: r.createdAt?.toISOString() ?? new Date().toISOString(),
    }
  })
}

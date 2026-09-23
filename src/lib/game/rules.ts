import 'server-only'

/**
 * Campus Heist rules, in one place (concept v1.0).
 *
 * A vault has three doors: two safe, one alarm. The first safe door is worth 80; opening the
 * other safe door takes it to 180. An alarm ends the raid at zero. Ranked raids award points
 * issued by the game; friend raids move a small social stash between players.
 *
 * Everything time-related runs on the campus clock (Asia/Kolkata): days roll at midnight and
 * weeks at Monday 00:00.
 */
export const RULES_VERSION = 1

export const DOORS = 3
export const FIRST_DOOR = 80
export const SECOND_DOOR = 180

export const RANKED_PER_DAY = 3
export const SOCIAL_PER_DAY = 3

/** Most social coins a defender can lose in one campus day, across all raids. */
export const EXPOSURE_CAP = 120
/** Don't offer a friend as a target unless this much can still be reserved from them. */
export const MIN_EXPOSURE = 100
/** Everyone starts each week with this many social coins; they have no cash value. */
export const WEEKLY_STASH = 300

/** A raid must be finished within this long, after which the server settles it. */
export const RAID_TIMEOUT_MS = 2 * 60 * 1000

export const CREW_SIZE = 3
/** Friday 18:00 to 23:00 campus time. */
export const EVENT_DAY = 5 // Friday, as JS getDay() in campus time
export const EVENT_START_HOUR = 18
export const EVENT_END_HOUR = 23

export const COHORTS = ['BA', 'HR', 'Core', 'IPM', 'MSDSM'] as const
export type Cohort = (typeof COHORTS)[number]

export type RaidMode = 'ranked' | 'friend' | 'event'
export type RaidPhase = 'active' | 'decision' | 'settled'

const CAMPUS_TZ = 'Asia/Kolkata'

/** The campus wall-clock time, as a Date whose UTC fields read as campus local fields. */
function campusClock(at: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMPUS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(at)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')))
}

/** The campus date, `YYYY-MM-DD`. Attempts are charged to the day a raid started. */
export function campusDate(at: Date = new Date()): string {
  return campusClock(at).toISOString().slice(0, 10)
}

/** The competition week a moment belongs to, `YYYY-Www`, starting Monday 00:00 campus time. */
export function weekId(at: Date = new Date()): string {
  const clock = campusClock(at)
  const monday = new Date(clock)
  // getUTCDay: 0 = Sunday, so Monday is 1 and Sunday counts as the previous week's day 7.
  const offset = (clock.getUTCDay() + 6) % 7
  monday.setUTCDate(clock.getUTCDate() - offset)
  monday.setUTCHours(0, 0, 0, 0)
  // ISO week number of that Monday.
  const thursday = new Date(monday)
  thursday.setUTCDate(monday.getUTCDate() + 3)
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Is the Friday Big Heist window open right now? */
export function eventOpen(at: Date = new Date()): boolean {
  const clock = campusClock(at)
  return clock.getUTCDay() === EVENT_DAY && clock.getUTCHours() >= EVENT_START_HOUR && clock.getUTCHours() < EVENT_END_HOUR
}

/** When the next event window opens, as an ISO instant, for the countdown in the app. */
export function nextEventStart(at: Date = new Date()): string {
  const clock = campusClock(at)
  const start = new Date(clock)
  const days = (EVENT_DAY - clock.getUTCDay() + 7) % 7
  start.setUTCDate(clock.getUTCDate() + days)
  start.setUTCHours(EVENT_START_HOUR, 0, 0, 0)
  if (start <= clock) start.setUTCDate(start.getUTCDate() + 7)
  // Convert the campus wall clock back to a real instant (campus time is UTC+5:30).
  return new Date(start.getTime() - 5.5 * 3600 * 1000).toISOString()
}

/** A cryptographically random alarm door, chosen by the server and never sent to the attacker. */
export function randomAlarmSlot(): number {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return bytes[0] % DOORS
}

/** What a raid pays out given the doors opened so far, assuming none of them was the alarm. */
export function payoutFor(safeDoorsOpened: number): number {
  if (safeDoorsOpened >= 2) return SECOND_DOOR
  if (safeDoorsOpened === 1) return FIRST_DOOR
  return 0
}

/** Stable, order-independent key for a pair of users, so a friendship can't be duplicated. */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join(':')
}

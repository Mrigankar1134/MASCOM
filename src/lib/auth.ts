import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { User, type UserDoc } from '@/lib/models/User'
import type { Role } from '@/lib/constants'

const COOKIE_NAME = 'mascom_session'

function secret(): Uint8Array {
  const value = process.env.JWT_SECRET
  if (!value || value.length < 16) {
    throw new Error('JWT_SECRET is missing or too short — set it in .env.local')
  }
  return new TextEncoder().encode(value)
}

function ttlDays(): number {
  const n = Number(process.env.SESSION_TTL_DAYS ?? 30)
  return Number.isFinite(n) && n > 0 ? n : 30
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function createSession(userId: string): Promise<void> {
  const maxAge = ttlDays() * 24 * 60 * 60
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlDays()}d`)
    .sign(secret())

  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/** The signed-in user, or null. Safe to call from any server component. */
export async function getCurrentUser(): Promise<UserDoc | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    const userId = payload.userId
    if (typeof userId !== 'string') return null

    await connectDB()
    return await User.findById(userId).lean<UserDoc>()
  } catch {
    return null
  }
}

/** Roles a user holds, folding the legacy boolean flags into one list. */
export function rolesOf(user: Pick<UserDoc, 'roles' | 'isAdmin' | 'isModerator' | 'isRecipient'>): Role[] {
  const set = new Set<Role>(['student'])
  for (const r of user.roles ?? []) {
    if (r === 'admin' || r === 'moderator' || r === 'recipient' || r === 'student') set.add(r)
  }
  if (user.isAdmin) set.add('admin')
  if (user.isModerator) set.add('moderator')
  if (user.isRecipient) set.add('recipient')
  return [...set]
}

export function isAdmin(user: UserDoc | null): boolean {
  return !!user && rolesOf(user).includes('admin')
}

export function isStaff(user: UserDoc | null): boolean {
  if (!user) return false
  const roles = rolesOf(user)
  return roles.includes('admin') || roles.includes('moderator')
}

/** Anyone who has a reason to open the admin console at all. */
export function canOpenConsole(user: UserDoc | null): boolean {
  if (!user) return false
  const roles = rolesOf(user)
  return roles.includes('admin') || roles.includes('moderator') || roles.includes('recipient')
}

export function isAllowedEmail(email: string): boolean {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS?.trim()
  if (!raw) return true
  const domains = raw.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
  if (domains.length === 0) return true
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return domains.some((d) => domain === d || domain.endsWith(`.${d}`))
}

export function isBootstrapAdmin(email: string): boolean {
  const raw = process.env.BOOTSTRAP_ADMIN_EMAILS?.trim()
  if (!raw) return false
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase())
}

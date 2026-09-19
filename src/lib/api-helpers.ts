import 'server-only'
import { NextResponse } from 'next/server'
import { ZodError, type ZodSchema } from 'zod'
import { connectDB } from '@/lib/db'
import { canOpenConsole, getCurrentUser, isAdmin, isStaff } from '@/lib/auth'
import type { UserDoc } from '@/lib/models/User'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as object, init)
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

/** Turns thrown errors into a consistent JSON shape instead of an HTML 500. */
export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return fail('Please check the highlighted fields.', 422, {
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
  }
  if (err instanceof Error && err.message.includes('E11000')) {
    return fail('That value is already taken.', 409)
  }
  console.error('[api]', err)
  const message =
    process.env.NODE_ENV === 'development' && err instanceof Error
      ? err.message
      : 'Something went wrong on our side. Please try again.'
  return fail(message, 500)
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const json = await req.json().catch(() => ({}))
  return schema.parse(json)
}

type Guard = 'user' | 'console' | 'staff' | 'admin'

/**
 * Connects to the database and enforces the minimum role for a route.
 * Throws a `Response` that route handlers surface directly.
 */
export async function requireUser(level: Guard = 'user'): Promise<UserDoc> {
  await connectDB()
  const user = await getCurrentUser()
  if (!user) throw fail('Please sign in to continue.', 401)

  if (level === 'admin' && !isAdmin(user)) throw fail('Admins only.', 403)
  if (level === 'staff' && !isStaff(user)) throw fail('You do not have access to this.', 403)
  if (level === 'console' && !canOpenConsole(user)) {
    throw fail('You do not have access to this.', 403)
  }
  return user
}

/** Wraps a handler so guard rejections and thrown errors both return JSON. */
export function route<Args extends unknown[]>(
  handler: (req: Request, ...args: Args) => Promise<Response>,
) {
  return async (req: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(req, ...args)
    } catch (err) {
      if (err instanceof Response) return err
      return handleError(err)
    }
  }
}

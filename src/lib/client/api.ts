'use client'

export class ApiError extends Error {
  status: number
  issues?: { path: string; message: string }[]

  constructor(message: string, status: number, issues?: { path: string; message: string }[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.issues = issues
  }
}

/** Fetch wrapper that always yields a typed result or a readable ApiError. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init?.headers,
    },
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    throw new ApiError(
      payload?.error ?? `Request failed (${res.status})`,
      res.status,
      payload?.issues,
    )
  }
  return payload as T
}

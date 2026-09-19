'use client'

import { createContext, useContext } from 'react'

export type SessionUser = {
  id: string
  name: string
  email: string
  profilePicUrl?: string | null
  rollNo?: string | null
  phone?: string | null
  roles: string[]
  isAdmin: boolean
  isModerator: boolean
  isRecipient: boolean
}

const SessionContext = createContext<SessionUser | null>(null)

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser | null
  children: React.ReactNode
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
}

/** The signed-in user as known to client components. Null when signed out. */
export function useSession(): SessionUser | null {
  return useContext(SessionContext)
}

export function canOpenConsole(user: SessionUser | null): boolean {
  return !!user && (user.isAdmin || user.isModerator || user.isRecipient)
}

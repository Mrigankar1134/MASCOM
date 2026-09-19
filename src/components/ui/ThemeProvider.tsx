'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  /** What the user chose. */
  preference: ThemePref
  /** What is actually on screen right now. */
  resolved: 'light' | 'dark'
  setPreference: (next: ThemePref) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'mascom-theme'

/**
 * Inlined in <head> so the correct palette is painted on the very first frame.
 * Without it a dark-mode user sees a white flash before hydration.
 */
export const themeScript = `(function(){try{var p=localStorage.getItem('${STORAGE_KEY}');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=p==='light'||p==='dark'?p:(m?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePref>('system')
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setPreferenceState(stored)
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: 'light' | 'dark' =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
    document.documentElement.style.colorScheme = resolved
  }, [resolved])

  const setPreference = useCallback((next: ThemePref) => {
    setPreferenceState(next)
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode, the choice simply won't persist */
    }
  }, [])

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}

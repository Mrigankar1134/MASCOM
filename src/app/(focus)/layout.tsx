import { Ambient } from '@/components/shell/Ambient'

/**
 * Shell for screens that deserve undivided attention — signing in, and paying.
 * No tab bar, no footer, nothing to wander off to mid-flow.
 */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Ambient />
      <main className="min-h-dvh">{children}</main>
    </>
  )
}

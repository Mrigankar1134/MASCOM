import { Ambient } from '@/components/shell/Ambient'
import { TopNav } from '@/components/shell/TopNav'
import { ScrollRail } from '@/components/shell/ScrollRail'
import { Footer } from '@/components/shell/Footer'

/**
 * Shell for the committee pages that used to be bands in the landing scroll.
 * Same chrome as the landing, minus the transparent nav, those pages open on
 * a heading rather than a full-bleed hero so the bar needs its backing.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Ambient />
      <ScrollRail />
      <TopNav />
      {/* No top padding: the nav is sticky so it holds its own space, and
          every section below already carries py-16/lg:py-24. */}
      <main>{children}</main>
      <Footer />
    </>
  )
}

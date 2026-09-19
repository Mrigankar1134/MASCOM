import { TopNav } from '@/components/shell/TopNav'
import { TabBar } from '@/components/shell/TabBar'
import { Footer } from '@/components/shell/Footer'

/**
 * Shell for everything a student does day to day. The tab bar carries
 * navigation on phones; the top nav takes over from the large breakpoint.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      {/* Bottom padding clears the floating tab bar on phones. */}
      <main className="min-h-[60dvh] pb-32 lg:pb-16">{children}</main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <TabBar />
    </>
  )
}

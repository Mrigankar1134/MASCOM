import { TopNav } from '@/components/shell/TopNav'
import { Footer } from '@/components/shell/Footer'
import { Hero } from '@/components/landing/Hero'
import { DropShowcase } from '@/components/landing/DropShowcase'
import { About, Services } from '@/components/landing/Sections'
import { Team } from '@/components/landing/Team'
import { GalleryWall } from '@/components/landing/GalleryWall'
import { getShopProducts, safely } from '@/lib/data'

// The landing page reads the catalogue, so it is rendered per request rather
// than frozen at build time — a drop can open at any moment.
export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const products = await safely(getShopProducts, [])
  const openDrop = products.find((p) => p.available)

  return (
    <>
      <TopNav transparentUntilScroll />
      <main>
        <Hero ordersOpen={!!openDrop} dropName={openDrop?.name} />
        <DropShowcase products={products} />
        <About />
        <Services />
        <Team />
        <GalleryWall />
      </main>
      <Footer />
    </>
  )
}

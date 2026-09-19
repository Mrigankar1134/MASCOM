import type { Metadata } from 'next'
import { getShopProducts, safely } from '@/lib/data'
import { ShopGrid } from '@/components/shop/ShopGrid'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'The current MASCOM drop. Pick your size, pay on UPI, track it to collection day.',
}
export const dynamic = 'force-dynamic'

export default async function ShopPage() {
  const products = await safely(getShopProducts, [])
  return <ShopGrid products={products} />
}

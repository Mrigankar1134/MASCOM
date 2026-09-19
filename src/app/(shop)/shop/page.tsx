import type { Metadata } from 'next'
import { getShopProducts, safely } from '@/lib/data'
import { ShopGrid } from '@/components/shop/ShopGrid'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'The current MASCOM drop — pick your size, pay by UPI, track delivery.',
}
export const dynamic = 'force-dynamic'

export default async function ShopPage() {
  const products = await safely(getShopProducts, [])
  return <ShopGrid products={products} />
}

import type { Metadata } from 'next'
import { BagScreen } from '@/components/shop/BagScreen'

export const metadata: Metadata = { title: 'Your bag' }

export default function BagPage() {
  return <BagScreen />
}

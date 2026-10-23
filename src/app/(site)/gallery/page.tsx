import type { Metadata } from 'next'
import { GalleryWall } from '@/components/landing/GalleryWall'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Drops, events and behind the scenes.',
}

export default function GalleryPage() {
  return <GalleryWall />
}

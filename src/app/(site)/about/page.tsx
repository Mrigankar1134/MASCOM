import type { Metadata } from 'next'
import { About, Services } from '@/components/landing/Sections'

export const metadata: Metadata = {
  title: 'About',
  description: 'Who the committee is and what it runs through the year.',
}

export default function AboutPage() {
  return (
    <>
      <About />
      <Services />
    </>
  )
}

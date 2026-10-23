import type { Metadata } from 'next'
import { Team } from '@/components/landing/Team'

export const metadata: Metadata = {
  title: 'Team',
  description: 'The coordinators behind MASCOM.',
}

export default function TeamPage() {
  return <Team />
}

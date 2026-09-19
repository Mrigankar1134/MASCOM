export const site = {
  name: 'MASCOM',
  longName: 'Merchandising & Sponsorship Committee',
  institute: 'IIM Amritsar',
  tagline: 'Drop your fit.',
  intro:
    'Exclusive merch for our people. Limited drops, premium quality. Sign in with your college email to order.',
  instagram: 'https://www.instagram.com/mascom_iimamritsar/',
  linkedin: 'https://www.linkedin.com/company/mascom-iimasr/',
  instagramHandle: '@mascom_iimamritsar',
} as const

export const stats = [
  { value: '800+', label: 'Students served' },
  { value: '12', label: 'Drops completed' },
  { value: '5', label: 'Coordinators' },
] as const

export const about = {
  eyebrow: 'Who we are',
  title: 'The committee behind every drop',
  body: 'MASCOM — the Merchandising and Sponsorship Committee — is the creative and commercial backbone of our college. We design, produce, and drop exclusive merch our community is proud to wear. From concept to delivery, every drop is ours.',
} as const

export const services = [
  {
    no: '01',
    title: 'Brand collaborations',
    body: 'We partner with relevant brands to increase the scale, visibility, and impact of student events and campus moments.',
  },
  {
    no: '02',
    title: 'Sponsorship management',
    body: 'We identify sponsor opportunities, pitch partners, secure funding, and manage sponsor deliverables with clear coordination.',
  },
  {
    no: '03',
    title: 'Merchandising & customisation',
    body: 'We design, procure, and manage customised merch for students, clubs, committees, institute events, and batch memories.',
  },
  {
    no: '04',
    title: 'Vendor & event operations',
    body: 'We coordinate vendors for quality, cost efficiency, timelines, food stalls, event requirements, and delivery on ground.',
  },
] as const

export type Coordinator = {
  name: string
  role: string
  photo?: string
  ipm?: boolean
}

export const coordinators: Coordinator[] = [
  { name: 'Charu Jain', role: 'Coordinator', photo: '/coordinators/Charu.JPG' },
  { name: 'Melapu Harsha Vardhan', role: 'Coordinator', photo: '/coordinators/Harshavardhan.JPG' },
  { name: 'Hrishikesh Das', role: 'Coordinator', photo: '/coordinators/Hrishikesh.JPG' },
  { name: 'Pranavu V. A.', role: 'Coordinator', photo: '/coordinators/Pranavu.JPG' },
  { name: 'Sanju Jain', role: 'Coordinator', photo: '/coordinators/Sanju.JPG' },
  {
    name: 'Dharatbeer Singh Bhatia',
    role: 'IPM Coordinator',
    photo: '/coordinators/Dharatbeer.png',
    ipm: true,
  },
]

/** The three promises shown on the sign-in screen. */
export const portalPoints = [
  'Browse exclusive merch drops',
  'Pay by UPI — no transaction fees',
  'Track your order in real time',
  'Collect with your order code',
] as const

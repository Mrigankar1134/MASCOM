export const site = {
  name: 'MASCOM',
  longName: 'Merchandising & Sponsorship Committee',
  institute: 'IIM Amritsar',
  tagline: 'Drop your fit.',
  intro:
    'Merch made for us, by us. Small drops, good stuff, gone fast. Sign in with your college email and grab yours.',
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
  title: "So who's behind the drops?",
  body: "We're MASCOM, the Merchandising and Sponsorship Committee. Basically, we make the stuff you actually want to wear around campus. Every drop starts as a rough sketch and ends up in your hands, and we look after all of it in between.",
} as const

export const services = [
  {
    no: '01',
    title: 'Getting brands on campus',
    body: 'We get brands on board so campus events can be bigger, louder, and a lot better funded than they would be otherwise.',
  },
  {
    no: '02',
    title: 'Chasing the sponsors',
    body: 'We find them, make the pitch, bring in the money, then actually deliver on what we promised.',
  },
  {
    no: '03',
    title: 'Making the merch',
    body: 'Hoodies, polos, kits, whatever the occasion calls for. We design it, source it, and get it printed properly.',
  },
  {
    no: '04',
    title: 'Keeping events running',
    body: 'Someone has to chase vendors on quality, price and timelines so nothing falls apart on the day. That someone is us.',
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
  'See every drop before it sells out',
  'Pay by UPI, no extra fees',
  'Watch your order move, live',
  'Pick it up with your order code',
] as const

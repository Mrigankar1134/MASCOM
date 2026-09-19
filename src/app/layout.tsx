import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider, themeScript } from '@/components/ui/ThemeProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { CartProvider } from '@/lib/client/cart'
import { SessionProvider, type SessionUser } from '@/lib/client/session'
import { getCurrentUser, rolesOf } from '@/lib/auth'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'MASCOM · IIM Amritsar',
    template: '%s · MASCOM',
  },
  description:
    'Merchandising & Sponsorship Committee, IIM Amritsar. Small merch drops, ordered and tracked from your phone.',
  openGraph: {
    title: 'MASCOM · IIM Amritsar',
    description: 'Merch made for us, by us. Order, pay on UPI, track it to collection day.',
    type: 'website',
  },
  appleWebApp: { capable: true, title: 'MASCOM', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f3f7' },
    { media: '(prefers-color-scheme: dark)', color: '#07070c' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null)

  const sessionUser: SessionUser | null = user
    ? {
        id: String(user._id),
        name: user.name,
        email: user.email,
        profilePicUrl: user.profilePicUrl ?? null,
        rollNo: user.rollNo ?? null,
        phone: user.phone ?? null,
        roles: rolesOf(user),
        isAdmin: !!user.isAdmin,
        isModerator: !!user.isModerator,
        isRecipient: !!user.isRecipient,
      }
    : null

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Paints the right palette before first paint, no white flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <SessionProvider user={sessionUser}>
            <CartProvider>
              <ToastProvider>{children}</ToastProvider>
            </CartProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

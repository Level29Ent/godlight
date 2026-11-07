import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cinzel, Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel', weight: ['500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Godlight — Tend a Tiny World',
  description: 'A god game inspired by Godfinger. Bless your followers with sunlight, nurture crops with rain, and wield lightning on a beautiful 3D planet.',
  generator: 'v0.app',
  applicationName: 'Godlight',
  appleWebApp: { capable: true, title: 'Godlight', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#060817',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${cinzel.variable} dark`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NODE_ENV === 'production' && (
          <script
            id="sw-register"
            dangerouslySetInnerHTML={{
              __html:
                "if (typeof navigator.serviceWorker !== 'undefined') { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {}) }",
            }}
          />
        )}
      </body>
    </html>
  )
}

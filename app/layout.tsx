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
  // Verification only. Ad serving waits for a display slot and the web consent setup.
  other: { 'google-adsense-account': 'ca-pub-9730543201329278' },
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
      {/* Raw fixed markup prevents React from hoisting the async loader ahead of the pause. */}
      <head dangerouslySetInnerHTML={{ __html: '<script id="level29-google-tag-manager">\n(function(w,d){\n  \'use strict\';\n  // Web only: native game builds keep their existing privacy/ads integration.\n  if(!/^https?:$/.test(w.location.protocol)||w.Capacitor?.isNativePlatform?.())return;\n  try{if(w.top!==w&&w.top.__level29GTM===\'GTM-MTKR4ZCD\')return;}catch(_){/* Cross-origin frames cannot inspect their parent. */}\n  if(w.__level29GTM===\'GTM-MTKR4ZCD\')return;\n  w.__level29GTM=\'GTM-MTKR4ZCD\';\n  w.dataLayer=w.dataLayer||[];\n  w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};\n  // The site\'s CMP must update consent; loading the container does not grant it.\n  if(!w.google_tag_data?.ics)w.gtag(\'consent\',\'default\',{ad_storage:\'denied\',analytics_storage:\'denied\',ad_user_data:\'denied\',ad_personalization:\'denied\',wait_for_update:500});\n  w.gtag(\'js\',new Date());\n  w.dataLayer.push({\'gtm.start\':Date.now(),event:\'gtm.js\'});\n  var script=d.createElement(\'script\');script.async=true;script.src=\'https://www.googletagmanager.com/gtm.js?id=GTM-MTKR4ZCD\';\n  d.head.appendChild(script);\n})(window,document);\n</script>\n<script id="adsense-pause">(window.adsbygoogle=window.adsbygoogle||[]).pauseAdRequests=1;</script><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9730543201329278" crossorigin="anonymous"></script>' }} />
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

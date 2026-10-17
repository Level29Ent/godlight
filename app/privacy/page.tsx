import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Godlight',
  description: 'How Godlight collects, uses, and protects your information on the web and in the iOS and Android apps.',
}

const LAST_UPDATED = 'October 16, 2026'

type Section = { title: string; body: React.ReactNode }

const sections: Section[] = [
  {
    title: 'Who we are',
    body: (
      <p>
        Godlight is a god game you can play on the web at godfinger.vercel.app and in our iOS and Android apps. This policy
        explains what information we collect when you play, why we collect it, and the choices you have.
      </p>
    ),
  },
  {
    title: 'Information we collect',
    body: (
      <ul>
        <li>
          <strong>Account details.</strong> When you play, we create a guest account so your progress can be saved. If you
          choose to sign up, we store your email address and a securely hashed password. We never see or store your password
          in plain text.
        </li>
        <li>
          <strong>Game saves.</strong> We store your save slots, including the name you give each save, your faith, follower
          count, and the state of your world.
        </li>
        <li>
          <strong>Session cookies.</strong> We use a cookie to keep you signed in. It is required for the game to work and is
          not used for advertising.
        </li>
        <li>
          <strong>Usage analytics.</strong> On the website we use Vercel Web Analytics to count page views. It does not use
          cookies and does not identify you personally.
        </li>
        <li>
          <strong>On-device settings.</strong> The apps keep a few small values on your device, such as when you last watched
          a reward ad and whether you own the Supporter Pack, so the game can work offline.
        </li>
      </ul>
    ),
  },
  {
    title: 'Advertising (apps only)',
    body: (
      <>
        <p>
          The iOS and Android apps offer optional reward ads provided by Google AdMob. Ads only play when you tap to watch one.
          The website does not show ads.
        </p>
        <p>
          To show and measure ads, Google may collect your device&apos;s advertising identifier, IP address, and basic device
          information. Where required by law, such as in the EU, UK, and Switzerland, we ask for your consent first. On iOS we
          ask for permission before any tracking, and you can change this at any time in Settings → Privacy &amp; Security →
          Tracking. On Android you can reset or delete your advertising ID in your device settings.
        </p>
        <p>
          Learn more in{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google&apos;s advertising policy
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: 'Purchases (apps only)',
    body: (
      <p>
        The Supporter Pack is sold through the Apple App Store and Google Play, and they handle all payments. We never receive
        your card or payment details. We use RevenueCat to confirm which purchases you own, which involves an anonymous app user
        ID and your purchase receipts. See{' '}
        <a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer">
          RevenueCat&apos;s privacy policy
        </a>
        .
      </p>
    ),
  },
  {
    title: 'Notifications (apps only)',
    body: (
      <p>
        If you allow notifications, the app schedules a reminder on your device a few hours after you leave. These are created
        on your device, not sent from our servers, and you can turn them off at any time in your device settings.
      </p>
    ),
  },
  {
    title: 'How we use your information',
    body: (
      <ul>
        <li>To save your progress and let you continue on any device you sign in on.</li>
        <li>To provide rewards and unlock purchases you have made.</li>
        <li>To show optional reward ads in the apps.</li>
        <li>To understand how the game is used and fix problems.</li>
      </ul>
    ),
  },
  {
    title: 'Sharing',
    body: (
      <p>
        We do not sell your personal information. We only share it with the service providers that run the game: Vercel
        (hosting and analytics), Neon (database), Google AdMob (ads in the apps), RevenueCat (purchases in the apps), and Apple
        and Google (app stores). We may also disclose information if the law requires it.
      </p>
    ),
  },
  {
    title: 'Keeping and deleting your data',
    body: (
      <p>
        We keep your account and saves for as long as your account exists. Unused guest accounts may be removed. You can delete
        your account and all of its cloud saves at any time from inside the game: open Chronicles (the save menu) and choose
        Delete account. Deletion is immediate and permanent. You can also ask us to delete your data using the contact details
        below, and we will do so within 30 days.
      </p>
    ),
  },
  {
    title: 'Children',
    body: (
      <p>
        Godlight is not directed at children under 13, and we do not knowingly collect personal information from them. If you
        believe a child has given us personal information, contact us and we will delete it.
      </p>
    ),
  },
  {
    title: 'Security',
    body: (
      <p>
        Data is sent over encrypted HTTPS connections, and passwords are hashed. No system is perfectly secure, but we take
        reasonable steps to protect your information.
      </p>
    ),
  },
  {
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy as the game changes. When we do, we will change the date at the top of this page.
      </p>
    ),
  },
  {
    title: 'Contact',
    body: (
      <p>
  For privacy questions or to delete your data, email us at{' '}
  <a href="mailto:info@level29ent.com" className="underline underline-offset-4 hover:opacity-80">
  info@level29ent.com
  </a>
  .
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#060817] px-6 py-16 text-[#f4ecd8]">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm text-[#f5c451] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5c451]"
        >
          ← Back to Godlight
        </Link>
        <header className="mt-8 border-b border-[#f4ecd8]/10 pb-8">
          <p className="font-display text-xs uppercase tracking-[0.4em] text-[#f5c451]/80">Godlight</p>
          <h1 className="font-display mt-3 text-balance text-4xl font-semibold sm:text-5xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-[#f4ecd8]/55">Last updated {LAST_UPDATED}</p>
        </header>
        <div className="flex flex-col gap-10 py-10">
          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-semibold text-[#f5c451]">{section.title}</h2>
              <div className="flex flex-col gap-3 text-pretty text-[15px] leading-relaxed text-[#f4ecd8]/80 [&_a]:text-[#f5c451] [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-[#f4ecd8] [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  )
}

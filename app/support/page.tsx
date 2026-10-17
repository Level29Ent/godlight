import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Support — Godlight',
  description: 'Get help with Godlight: saves, accounts, purchases, controls, and how to contact Level 29 Interactive.',
}

const SUPPORT_EMAIL = 'info@level29ent.com'

type Faq = { question: string; answer: React.ReactNode }

const faqs: Faq[] = [
  {
    question: 'How do I play?',
    answer: (
      <p>
        Drag the planet to spin it and pinch or scroll to zoom. Pick a power or building from the toolbar, then press and hold
        on land to use it. On a keyboard, keys 1–8 switch tools. Keep your followers happy to earn faith and advance through the
        ages.
      </p>
    ),
  },
  {
    question: 'Where are my saves?',
    answer: (
      <p>
        Your progress is saved to your account in the cloud. Open Chronicles (the save menu) to load, rename, or create save
        slots. Sign up with an email and password to keep your saves when you switch devices. Guest progress stays on the
        device you started on.
      </p>
    ),
  },
  {
    question: 'How do I restore the Supporter Pack?',
    answer: (
      <p>
        Open Heavenly Gifts (the gift button in the game) and tap Restore purchases. Make sure you are signed in to the same
        Apple ID or Google account you used to buy it.
      </p>
    ),
  },
  {
    question: 'How do I get a refund?',
    answer: (
      <p>
        Purchases are handled by the App Store and Google Play, so refunds are requested through them:{' '}
        <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer">
          Apple
        </a>{' '}
        or{' '}
        <a href="https://support.google.com/googleplay/answer/2479637" target="_blank" rel="noopener noreferrer">
          Google Play
        </a>
        .
      </p>
    ),
  },
  {
    question: 'A reward ad did not give me my reward.',
    answer: (
      <p>
        Rewards are granted only when the ad plays to the end. If an ad will not load, check your connection and try again
        after a short wait. If it keeps happening, email us with your device model.
      </p>
    ),
  },
  {
    question: 'How do I delete my account?',
    answer: (
      <p>
        Open Chronicles, choose Delete account, and confirm with your password. This permanently removes your account and all
        of its cloud saves. You can also email us to request deletion.
      </p>
    ),
  },
  {
    question: 'The game is slow or stutters.',
    answer: (
      <p>
        Close other apps and make sure your device is up to date. On the web, use a current version of Chrome, Safari, Edge,
        or Firefox. If the problem continues, email us your device and browser so we can look into it.
      </p>
    ),
  },
]

export default function SupportPage() {
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
          <h1 className="font-display mt-3 text-balance text-4xl font-semibold sm:text-5xl">Support</h1>
          <p className="mt-3 text-pretty text-[15px] leading-relaxed text-[#f4ecd8]/70">
            Godlight is a god game by Level 29 Interactive. Shape a living planet, guide your followers, and grow their faith
            from the first village to a thriving world.
          </p>
        </header>

        <section
          aria-labelledby="contact-heading"
          className="mt-10 flex flex-col gap-3 rounded-2xl border border-[#f5c451]/25 bg-[#f5c451]/[0.06] p-6"
        >
          <h2 id="contact-heading" className="font-display text-xl font-semibold text-[#f5c451]">
            Need help?
          </h2>
          <p className="text-pretty text-[15px] leading-relaxed text-[#f4ecd8]/80">
            Email us and we will get back to you, usually within two business days. Please include your device model and a short
            description of the problem.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Godlight support')}`}
            className="mt-1 inline-flex w-fit items-center rounded-full bg-[#f5c451] px-5 py-2.5 text-sm font-semibold text-[#060817] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5c451]"
          >
            {SUPPORT_EMAIL}
          </a>
        </section>

        <section aria-labelledby="faq-heading" className="flex flex-col gap-8 py-10">
          <h2 id="faq-heading" className="font-display text-2xl font-semibold">
            Frequently asked questions
          </h2>
          {faqs.map((faq) => (
            <div key={faq.question} className="flex flex-col gap-2">
              <h3 className="font-display text-lg font-semibold text-[#f5c451]">{faq.question}</h3>
              <div className="text-pretty text-[15px] leading-relaxed text-[#f4ecd8]/80 [&_a]:text-[#f5c451] [&_a]:underline [&_a]:underline-offset-4">
                {faq.answer}
              </div>
            </div>
          ))}
        </section>

        <footer className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[#f4ecd8]/10 pt-8 text-sm text-[#f4ecd8]/55">
          <Link href="/privacy" className="underline underline-offset-4 hover:text-[#f4ecd8]/80">
            Privacy Policy
          </Link>
          <a
            href="https://level29ent.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-[#f4ecd8]/80"
          >
            Level 29 Entertainment
          </a>
        </footer>
      </article>
    </main>
  )
}

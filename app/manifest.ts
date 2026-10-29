import type { MetadataRoute } from 'next'

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Godlight — Tend a Tiny World',
    short_name: 'Godlight',
    description:
      'A god game on a tiny 3D planet. Bless your followers with sunlight, nurture crops with rain, and wield lightning.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['fullscreen', 'standalone'],
    orientation: 'any',
    background_color: '#060817',
    theme_color: '#060817',
    lang: 'en',
    dir: 'ltr',
    categories: ['games', 'entertainment'],
    prefer_related_applications: false,
    icons: [
      ...iconSizes.map((size) => ({
        src: `/icons/icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'any' as const,
      })),
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      { label: 'Warm your followers with sunlight on a tiny low-poly world' },
      { label: 'Call down a sunbeam to bless the land' },
      { label: 'Bring rain to water farms and grow forests' },
      { label: 'Harvests bring feasts and faith' },
    ].map(({ label }, index) => ({
      src: `/screenshots/gameplay-${index + 1}.webp`,
      sizes: '1280x649',
      type: 'image/webp',
      form_factor: 'wide' as const,
      label,
    })),
  }
}

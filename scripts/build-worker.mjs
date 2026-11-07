import { readFile, appendFile } from 'node:fs/promises'
import { generateSW, getManifest } from 'workbox-build'

const buildId = (await readFile('.next/BUILD_ID', 'utf8')).trim()
const { manifestEntries, size: chunkBytes, warnings: assetWarnings } = await getManifest({
  globDirectory: '.next/static', globPatterns: ['**/*.{js,css,woff,woff2}'],
  modifyURLPrefix: { '': '/_next/static/' }, maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
})
const { count, size, warnings } = await generateSW({
  swDest: 'public/sw.js', sourcemap: false, cacheId: 'godlight', inlineWorkboxRuntime: true,
  globDirectory: 'public', globPatterns: ['offline.html', 'icons/icon-{192,512}.png'],
  modifyURLPrefix: { '': '/' },
  additionalManifestEntries: [...manifestEntries, { url: '/', revision: buildId }],
  // Do not take over a running game with a different build's chunks.
  skipWaiting: false, clientsClaim: true, cleanupOutdatedCaches: true,
  navigateFallback: '/',
  navigateFallbackAllowlist: [/^\/$/],
  // No runtime API, auth, Server Action or RSC cache. Only the public game shell is offline.
})
if (assetWarnings.length || warnings.length) throw new Error([...assetWarnings, ...warnings].join('\n'))
// Remove only the cache owned by the previous handwritten worker, never unrelated origin caches.
await appendFile('public/sw.js', "\nself.addEventListener('activate', event => event.waitUntil(caches.delete('godlight-v1')));\n")
console.log(`Offline game: ${count} assets, ${((size + chunkBytes) / 1024 / 1024).toFixed(2)} MiB`)

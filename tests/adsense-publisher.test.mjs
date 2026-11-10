import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('web AdSense metadata, loader and seller declaration use the owner publisher', () => {
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
  assert.match(layout, /'google-adsense-account': 'ca-pub-9730543201329278'/)
  assert.equal(layout.split('adsbygoogle.js?client=ca-pub-9730543201329278').length - 1, 1)
  assert.ok(layout.indexOf('pauseAdRequests=1') < layout.indexOf('adsbygoogle.js?client='))
  assert.equal(readFileSync(new URL('../public/ads.txt', import.meta.url), 'utf8'),
    'google.com, pub-9730543201329278, DIRECT, f08c47fec0942fa0\n')
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function pngSize(path) {
  const data = readFileSync(new URL(`../public${path}`, import.meta.url))
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  return [data.readUInt32BE(16), data.readUInt32BE(20)]
}

test('web metadata serves Godlight icons instead of the template icons', () => {
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
  const icons = layout.slice(layout.indexOf('  icons: {'), layout.indexOf('export const viewport'))
  assert.match(icons, /url: '\/godlight-icon-32\.png'/)
  assert.match(icons, /url: '\/icons\/icon-192\.png'/)
  assert.match(icons, /apple: '\/godlight-apple-icon\.png'/)
  assert.doesNotMatch(icons, /icon-light|icon-dark|\/icon\.svg|['"]\/apple-icon\.png/)
  assert.deepEqual(pngSize('/godlight-icon-32.png'), [32, 32])
  assert.deepEqual(pngSize('/icons/icon-192.png'), [192, 192])
  assert.deepEqual(pngSize('/godlight-apple-icon.png'), [180, 180])
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { isGameRuntimeError, crashCode } from '../lib/game/runtime-errors.ts'
const origin = 'https://godlight.app'
test('third-party script failures do not terminate a healthy game', () => {
  for (const filename of ['https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', 'https://example.org/analytics.js']) {
    assert.equal(isGameRuntimeError({ filename, error: new Error('optional script failed') }, origin), false)
  }
})
test('opaque browser errors are not falsely attributed to game code', () => {
  assert.equal(isGameRuntimeError({ filename: '', error: null }, origin), false)
  assert.equal(isGameRuntimeError({ filename: '', error: { stack: 'Script error.' } }, origin), false)
})
test('first-party game exceptions are still fatal, not silently swallowed', () => {
  assert.equal(isGameRuntimeError({ filename: origin + '/_next/static/chunks/game.js', error: new TypeError('bad color') }, origin), true)
  assert.equal(isGameRuntimeError({ filename: '/_next/static/chunks/game.js', error: null }, origin), true)
  assert.equal(isGameRuntimeError({ filename: '', error: { stack: `at frame (${origin}/_next/static/game.js:1:1)` } }, origin), true)
})
test('crash codes are stable and contain no raw message or account data', () => {
  const a = crashCode(new TypeError('bad color'))
  assert.match(a, /^GL-[0-9A-F]{8}$/)
  assert.equal(a, crashCode(new TypeError('bad color')))
  assert.notEqual(a, crashCode(new Error('different failure')))
  assert.doesNotMatch(crashCode(new Error('private@example.com')), /private|example|@/)
})

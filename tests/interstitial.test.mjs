import test from 'node:test'
import assert from 'node:assert/strict'
import { createInterstitialController, INTERSTITIAL_COOLDOWN_MS, IOS_INTERSTITIAL_UNIT, IOS_TEST_INTERSTITIAL_UNIT } from '../lib/game/interstitial.ts'
function harness({ testAds = true } = {}) {
  let time = 0, allowed = true
  const events = new Map(), pauses = [], requests = []
  let shows = 0, removals = 0, failLoad = false, failShow = false, failListener = false
  const controller = createInterstitialController({
    async prepare(id, test) { requests.push([id, test]); if (failLoad) throw Error('no fill') },
    async show() { shows++; if (failShow) throw Error('not ready'); events.get('showed')?.(); queueMicrotask(() => events.get('dismissed')?.()) },
    async listen(event, callback) {
      if (failListener && event === 'failed') throw Error('bridge unavailable')
      events.set(event, callback)
      return { async remove() { removals++; events.delete(event) } }
    },
  }, { allowed: () => allowed, test: testAds, now: () => time, pause: value => pauses.push(value) })
  return { controller, requests, pauses, events, get shows() { return shows }, get removals() { return removals }, advance(ms) { time += ms }, setAllowed(v) { allowed = v }, failLoad() { failLoad = true }, failShow() { failShow = true }, failListener() { failListener = true } }
}
test('disabled consent/platform/supporter gate never loads or shows', async () => {
  const h = harness(); h.setAllowed(false)
  await h.controller.preload(); h.advance(INTERSTITIAL_COOLDOWN_MS)
  assert.equal(await h.controller.atBreak(), false)
  assert.equal(h.requests.length, 0); assert.equal(h.shows, 0)
})
test('preloads only once and skips the first four minutes without delaying restart', async () => {
  const h = harness(); await Promise.all([h.controller.preload(), h.controller.preload()])
  assert.deepEqual(h.requests, [[IOS_TEST_INTERSTITIAL_UNIT, true]])
  assert.equal(await h.controller.atBreak(), false); assert.equal(h.shows, 0)
})
test('release requests use the supplied iOS interstitial, not a rewarded unit', async () => {
  const h = harness({ testAds: false }); await h.controller.preload()
  assert.deepEqual(h.requests, [[IOS_INTERSTITIAL_UNIT, false]])
})
test('natural break waits for dismissal, pauses/restores and removes listeners', async () => {
  const h = harness(); await h.controller.preload(); h.advance(INTERSTITIAL_COOLDOWN_MS)
  assert.equal(await h.controller.atBreak(), true)
  assert.equal(h.shows, 1); assert.deepEqual(h.pauses, [true, false])
  assert.equal(h.removals, 3); assert.equal(h.events.size, 0)
  assert.equal(await h.controller.atBreak(), false)
})
test('load failures skip the break; show failures restore gameplay without throwing', async () => {
  const noFill = harness(); noFill.failLoad(); await noFill.controller.preload(); noFill.advance(INTERSTITIAL_COOLDOWN_MS)
  assert.equal(await noFill.controller.atBreak(), false); assert.equal(noFill.shows, 0)
  const failed = harness(); await failed.controller.preload(); failed.advance(INTERSTITIAL_COOLDOWN_MS); failed.failShow()
  assert.equal(await failed.controller.atBreak(), false); assert.deepEqual(failed.pauses, [true, false]); assert.equal(failed.removals, 3)
})
test('partial listener failure is cleaned up and never presents an ad', async () => {
  const h = harness(); await h.controller.preload(); h.advance(INTERSTITIAL_COOLDOWN_MS); h.failListener()
  assert.equal(await h.controller.atBreak(), false); assert.equal(h.shows, 0); assert.equal(h.removals, 1)
})
test('changed eligibility and expired preloads cannot show an ad', async () => {
  const h = harness(); await h.controller.preload(); h.advance(INTERSTITIAL_COOLDOWN_MS); h.setAllowed(false)
  assert.equal(await h.controller.atBreak(), false)
  const expired = harness(); await expired.controller.preload(); expired.advance(56 * 60 * 1000)
  assert.equal(await expired.controller.atBreak(), false); assert.equal(expired.shows, 0)
})
test('concurrent restart attempts cannot present twice', async () => {
  const h = harness(); await h.controller.preload(); h.advance(INTERSTITIAL_COOLDOWN_MS)
  const results = await Promise.all([h.controller.atBreak(), h.controller.atBreak()])
  assert.deepEqual(results, [true, false]); assert.equal(h.shows, 1)
})

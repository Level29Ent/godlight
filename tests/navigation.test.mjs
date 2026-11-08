import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { createLandNavigator } from '../lib/game/navigation.ts'
import { isLand } from '../lib/game/planet.ts'

const point = (lon, lat = 0) => new Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon))
function walk(nav, from, goal, seconds = 90) {
  const w = { dir: from.clone() }
  let result
  for (let frame = 0; frame < seconds * 60; frame++) {
    nav.beginFrame()
    result = nav.move(w, goal, 1.2, 1 / 60)
    if (result !== 'moving') break
  }
  return { w, result }
}

test('walkers take a land route around an inlet instead of pacing at its shoreline', () => {
  const land = d => !(Math.abs(Math.atan2(d.z, d.x)) < 0.13 && Math.abs(Math.asin(d.y)) < 0.34)
  const nav = createLandNavigator(land), from = point(-0.35), goal = point(0.35)
  assert.equal(nav.clear(from, goal), false)
  const route = nav.plan(from, goal)
  assert.ok(route && route.length > 2)
  let previous = from
  for (const next of route) { assert.equal(nav.clear(previous, next), true); previous = next }
  const { w, result } = walk(nav, from, goal)
  assert.equal(result, 'arrived')
  assert.ok(w.dir.distanceTo(goal) < 0.001)
})

test('disconnected islands are reported unreachable without wandering into water', () => {
  const from = point(-0.65), goal = point(0.65)
  const land = d => d.angleTo(from) < 0.22 || d.angleTo(goal) < 0.22
  const nav = createLandNavigator(land)
  const { w, result } = walk(nav, from, goal)
  assert.equal(result, 'unreachable')
  assert.deepEqual(w.dir, from)
})

test('a route is reused across frames and a changed target gets a new route', () => {
  let checks = 0
  const nav = createLandNavigator(() => { checks++; return true })
  const w = { dir: point(0) }, goal = point(0.5)
  nav.beginFrame(); nav.move(w, goal, 1, 1 / 60)
  const before = checks
  for (let i = 0; i < 60; i++) { nav.beginFrame(); nav.move(w, goal, 1, 1 / 60) }
  assert.ok(checks - before <= 125, 'per-frame work does not repeat route search')
  const opposite = point(-0.3)
  const beforeDistance = w.dir.distanceTo(opposite)
  nav.beginFrame(); nav.move(w, opposite, 1, 1 / 60)
  assert.ok(w.dir.distanceTo(opposite) < beforeDistance)
})

test('route searches are limited to one walker per tick', () => {
  const nav = createLandNavigator(d => !(Math.abs(Math.atan2(d.z, d.x)) < 0.13 && Math.abs(Math.asin(d.y)) < 0.34))
  const a = { dir: point(-0.35) }, b = { dir: point(-0.35) }, goal = point(0.35)
  nav.beginFrame()
  nav.move(a, goal, 1, 1 / 60)
  nav.move(b, goal, 1, 1 / 60)
  assert.deepEqual(b.dir, point(-0.35))
  nav.beginFrame(); nav.move(b, goal, 1, 1 / 60)
  assert.ok(b.dir.distanceTo(point(-0.35)) > 0)
})

test('dry endpoints cannot skip a narrow water strip between samples', () => {
  const nav = createLandNavigator(d => Math.abs(Math.atan2(d.z, d.x)) > 0.009)
  assert.equal(nav.clear(point(-0.03), point(0.03)), false)
})

test('sampled real-world land routes never cross water and finish at their targets', () => {
  const nav = createLandNavigator(isLand)
  const pairs = []
  for (let i = 0; i < 180 && pairs.length < 4; i++) {
    const from = point(i * 2.399, Math.sin(i) * 0.8), goal = point(i * 2.399 + 0.4, Math.sin(i) * 0.8)
    if (!isLand(from) || !isLand(goal) || nav.clear(from, goal)) continue
    const route = nav.plan(from, goal)
    if (route) pairs.push([from, goal, route])
  }
  assert.ok(pairs.length >= 2)
  for (const [from, goal, route] of pairs) {
    let prev = from
    for (const next of route) { assert.equal(nav.clear(prev, next), true); prev = next }
    const { result } = walk(nav, from, goal, 180)
    assert.equal(result, 'arrived')
  }
})

test('failed destinations are remembered so builders can select other reachable work', () => {
  const from = point(-0.65), goal = point(0.65)
  const nav = createLandNavigator(d => d.angleTo(from) < 0.2 || d.angleTo(goal) < 0.2)
  const w = { dir: from.clone() }
  nav.beginFrame()
  assert.equal(nav.move(w, goal, 1, 1 / 60), 'unreachable')
  assert.equal(nav.isUnreachable(w, goal), true)
  assert.equal(nav.isUnreachable(w, from), false)
})

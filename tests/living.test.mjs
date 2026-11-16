import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { identity, createLiving, restoreLiving, tickLiving, livingMiracle, prayerFactor, moraleDrift, disposition, OPENING } from '../lib/game/living.ts'
import { state, startGame, exportSave, importSave, tick, setTool, pressCursor, releaseCursor, setPhotoMode, setWorldLook } from '../lib/game/store.ts'

const tell = () => {}
const farm = () => state.buildings.find(b => b.type === 'farm' && b.progress >= 1)

test('identities are deterministic across saves and traits have distinct mechanical effects', () => {
  startGame()
  const before = state.followers.map(f => identity(f.id))
  const save = exportSave()
  assert.equal(importSave(save), true)
  assert.deepEqual(state.followers.map(f => identity(f.id)), before)
  assert.equal(prayerFactor({ id: 0 }, 0), 1.15)
  assert.equal(prayerFactor({ id: 3 }, -50), 1.2)
  assert.ok(moraleDrift({ id: 2 }, -50) < moraleDrift({ id: 3 }, -50))
  assert.ok(moraleDrift({ id: 2 }, 50) > 0)
  assert.equal(disposition(0), 'balanced')
})

test('opening milestones reward once, persist, and migrate established saves without payouts', () => {
  startGame()
  const f = state.faith
  state.stats.blessed = new Set([1, 2, 3])
  tickLiving(state, 0.1, tell)
  assert.equal(state.living.tutorial, 1)
  assert.equal(state.faith, f + OPENING[0].reward)
  tickLiving(state, 0.1, tell)
  assert.equal(state.faith, f + OPENING[0].reward)
  const save = exportSave()
  importSave(save)
  assert.equal(state.living.tutorial, 1)
  delete save.living
  importSave(save)
  assert.equal(state.living.tutorial, 5)
  assert.equal(state.faith, save.faith)
})

test('prayers are bounded, expire safely, and only pay once when answered', () => {
  startGame()
  state.time = 20
  tickLiving(state, 0.1, tell)
  assert.equal(state.living.prayers.length, 1)
  const p = state.living.prayers[0], follower = state.followers.find(f => f.id === p.followerId)
  const before = state.faith
  livingMiracle(state, 'sun', follower.dir, 1, tell)
  tickLiving(state, 0.1, tell)
  assert.equal(state.living.answered, 0)
  livingMiracle(state, 'sun', follower.dir, 1, tell)
  tickLiving(state, 0.1, tell)
  assert.equal(state.living.answered, 1)
  assert.equal(state.faith, before + 6)
  tickLiving(state, 0.1, tell)
  assert.equal(state.faith, before + 6)
  state.living.prayers = [{ followerId: -100, kind: 'work', progress: 0, expires: 100 }]
  tickLiving(state, 1, tell)
  assert.equal(state.living.prayers.length, 0)
  state.living.prayers = [{ followerId: follower.id, kind: 'warmth', progress: 0, expires: 19 }]
  tickLiving(state, 1, tell)
  assert.equal(state.living.prayers.length, 0)
})

test('work and farm-rain prayers require matching actions', () => {
  startGame()
  const f = state.followers[0], b = farm()
  assert.ok(b)
  state.living.prayers = [{ followerId: f.id, kind: 'rain', progress: 0, expires: 100 }]
  livingMiracle(state, 'rain', b.dir.clone().negate(), 2, tell)
  assert.equal(state.living.prayers[0].progress, 0)
  livingMiracle(state, 'rain', b.dir, 2, tell)
  tickLiving(state, 0.1, tell)
  assert.equal(state.living.answered, 1)
  state.living.prayers = [{ followerId: f.id, kind: 'work', progress: 0, expires: 100 }]
  f.job = { kind: 'chop', targetId: null, dir: f.dir, spot: f.dir, work: 0 }
  tickLiving(state, 0.1, tell)
  assert.equal(state.living.answered, 2)
})

test('sunshower needs nearby sustained rain, respects shared cooldown and does not harvest instantly', () => {
  startGame()
  const b = farm(); assert.ok(b); b.growth = 0.8
  livingMiracle(state, 'rain', b.dir, 1, tell)
  livingMiracle(state, 'sun', b.dir, 0.1, tell)
  assert.equal(b.growth, 0.8)
  state.living.cast = null
  livingMiracle(state, 'rain', b.dir, 2, tell)
  livingMiracle(state, 'sun', b.dir.clone().negate(), 0.1, tell)
  assert.equal(b.growth, 0.8)
  state.living.cast = null
  livingMiracle(state, 'rain', b.dir, 2, tell)
  state.time += 1
  livingMiracle(state, 'sun', b.dir, 0.1, tell)
  assert.equal(b.growth, 0.99)
  assert.deepEqual(state.living.combos, ['harvest'])
  b.growth = 0
  livingMiracle(state, 'rain', b.dir, 2, tell)
  livingMiracle(state, 'sun', b.dir, 0.1, tell)
  assert.equal(b.growth, 0)
})

test('thunderstorm has both wider alien damage and follower consequences, then expires', () => {
  startGame()
  const f = state.followers[0], dir = f.dir.clone()
  state.aliens = [{ dir, hp: 100 }]
  livingMiracle(state, 'rain', dir, 2, tell)
  const happy = f.happiness
  livingMiracle(state, 'lightning', dir, 0, tell)
  assert.equal(state.aliens[0].hp, 65)
  assert.equal(f.happiness, happy - 15)
  assert.ok(f.scared >= 4)
  assert.deepEqual(state.living.combos, ['storm'])
  state.time = 40
  livingMiracle(state, 'rain', dir, 2, tell)
  state.time = 53
  livingMiracle(state, 'lightning', dir, 0, tell)
  assert.equal(state.aliens[0].hp, 65)
})

test('optional save extension is isolated, bounded, and cannot unlock cosmetics early', () => {
  startGame()
  setWorldLook({ sky: 2, rings: true, moon: true, style: 2 })
  assert.equal(state.living.sky, 0)
  assert.equal(state.living.rings, false)
  state.ageIndex = 5
  setWorldLook({ sky: 2, rings: true, moon: true, style: 2 })
  const save = exportSave()
  assert.equal(save.living.cast, null)
  assert.deepEqual(save.living.prayers, [])
  save.living.combos.push('harvest')
  assert.deepEqual(state.living.combos, [])
  assert.equal(importSave(save), true)
  assert.equal(state.living.moon, true)
  assert.equal(state.living.style, 2)
  const l = restoreLiving({ tutorial: Infinity, sky: NaN, style: -10, moon: true, prayers: Array(1000).fill({}), combos: ['storm', 'storm', 'bad'] }, 0, 0)
  assert.equal(l.tutorial, 0); assert.equal(l.sky, 0); assert.equal(l.moon, false)
  assert.deepEqual(l.prayers, []); assert.deepEqual(l.combos, ['storm'])
})

test('photo mode freezes simulation and rejects latent casts until resumed', () => {
  startGame()
  const before = state.time
  try {
    setPhotoMode(true)
    setTool('sun'); pressCursor(new Vector3(0, 1, 0)); tick(1)
    assert.equal(state.time, before)
    assert.equal(state.cursor.down, false)
    assert.equal(state.cursor.pressed, false)
  } finally { setPhotoMode(false) }
  tick(0.05)
  assert.ok(state.time > before)
  releaseCursor()
})

test('actual channel input discovers sunshower and successful paid casts discover thunderstorm', () => {
  startGame()
  const b = farm(); assert.ok(b)
  setTool('rain'); pressCursor(b.dir)
  for (let i = 0; i < 45; i++) tick(0.05)
  releaseCursor(); setTool('sun'); pressCursor(b.dir); tick(0.05); releaseCursor()
  assert.ok(state.living.combos.includes('harvest'))
  state.living.comboCooldown = 0
  state.ageIndex = 5; state.faith = 1000
  setTool('rain'); pressCursor(b.dir)
  for (let i = 0; i < 45; i++) tick(0.05)
  releaseCursor(); setTool('lightning'); pressCursor(b.dir); tick(0.05); releaseCursor()
  assert.ok(state.living.combos.includes('storm'))
})

test('age advancement celebrates and cosmetic choices survive a device save round trip', () => {
  startGame()
  const exemplar = state.followers[0]
  state.followers = Array.from({ length: 15 }, (_, i) => ({ ...exemplar, id: 200 + i, dir: exemplar.dir.clone(), target: exemplar.target.clone(), happiness: 60, jump: 0 }))
  tick(0.01)
  assert.equal(state.ageIndex, 2)
  assert.ok(state.followers.every(f => f.jump > 0))
  setWorldLook({ sky: 2, style: 1 })
  importSave(JSON.parse(JSON.stringify(exportSave())))
  assert.equal(state.living.sky, 2)
  assert.equal(state.living.style, 1)
})


test('restoring while in photo mode cannot leave an invisible pause behind', () => {
  startGame()
  const save = exportSave()
  setPhotoMode(true)
  importSave(save)
  assert.equal(state.photoMode, false)
  const before = state.time
  tick(0.05)
  assert.ok(state.time > before)
})

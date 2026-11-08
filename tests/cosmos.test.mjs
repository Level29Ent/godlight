import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { createCosmos, restoreCosmos, actOnCosmos, tickCosmos, cosmicDuty, releaseCosmicDuty, cosmicFaith, faithMultiplier, climateCropFactor, protectedAt, alignMiracle, BLUEPRINTS } from '../lib/game/cosmos.ts'
import { state, resetGame, exportSave, importSave, startDir, tick } from '../lib/game/store.ts'
import { elevation } from '../lib/game/planet.ts'

function world() {
  resetGame()
  state.cosmos = createCosmos(42)
  state.faith = 10000; state.wood = 1000; state.stone = 1000
  state.ageIndex = 5
  for (const f of state.followers) { f.job = null; f.taskId = null; f.lost = false }
  return state
}
const hooks = () => ({ tell() {}, impact() {}, death() {} })
const advance = (s, seconds, h = hooks()) => { for (let i = 0; i < seconds * 20; i++) tickCosmos(s, 0.05, h) }

test('seeded mountain and seabed artifacts are deterministic and located in the right terrain', () => {
  const a = createCosmos(42), b = createCosmos(42)
  assert.deepEqual(a, b)
  a.relics.forEach((r, i) => {
    const e = elevation(new Vector3(...r.dir))
    assert.ok(i % 2 === 0 ? e > 0.36 : e < -0.08)
  })
})

test('shield miracle enforces cost, lasts bounded duration and is extended by the tide relic', () => {
  const s = world(); s.faith = 19
  actOnCosmos(s, { type: 'shield' }); assert.equal(s.cosmos.shield, 0); assert.equal(s.faith, 19)
  s.faith = 40; actOnCosmos(s, { type: 'shield' }); assert.equal(s.faith, 20); assert.equal(s.cosmos.shield, 25)
  s.cosmos.relics[1].progress = 1
  actOnCosmos(s, { type: 'shield' }); assert.equal(s.cosmos.shield, 33)
  advance(s, 34); assert.equal(s.cosmos.shield, 0)
})

test('disasters warn, resolve once, reward successful shielding and schedule another window', () => {
  const s = world(); s.cosmos.nextDisaster = 0
  let impacts = 0, protectedHits = 0
  const h = { ...hooks(), impact(_, safe) { impacts++; if (safe) protectedHits++ } }
  tickCosmos(s, 0.05, h)
  assert.equal(s.cosmos.disaster.remaining, 25)
  assert.equal(impacts, 0)
  actOnCosmos(s, { type: 'shield' })
  advance(s, 25, h)
  assert.equal(s.cosmos.averted, 1)
  assert.ok(impacts >= 1)
  assert.equal(impacts, protectedHits)
  const once = impacts
  advance(s, 4, h)
  assert.equal(impacts, once)
  assert.equal(s.cosmos.disaster, null)
  assert.ok(s.cosmos.nextDisaster > 140)
})

test('unshielded meteor targets are damaging while completed bunkers protect only locally', () => {
  const s = world(), c = s.cosmos, dir = startDir.toArray()
  c.projects.push({ kind: 'bunker', dir, progress: 0.99, crew: [] })
  assert.equal(protectedAt(c, startDir), false)
  c.projects[0].progress = 1
  assert.equal(protectedAt(c, startDir), true)
  assert.equal(protectedAt(c, startDir.clone().negate()), false)
  c.disaster = { kind: 'meteors', remaining: 0.01, duration: 25, targets: [dir, startDir.clone().negate().toArray()], resolved: false }
  const results = []
  advance(s, 1, { ...hooks(), impact(_, safe) { results.push(safe) } })
  assert.deepEqual(results, [true, false])
  assert.equal(c.impacts, 1)
})

test('a solar flare dehydrates unprotected farms and harms morale without instant population loss', () => {
  const s = world(), farm = s.buildings.find(b => b.type === 'farm')
  assert.ok(farm)
  farm.moisture = 1
  const original = s.followers.length
  s.cosmos.disaster = { kind: 'flare', remaining: 0.01, duration: 25, targets: [startDir.toArray()], resolved: false }
  advance(s, 1)
  assert.ok(farm.moisture < 0.5)
  assert.equal(s.followers.length, original)
  assert.equal(s.cosmos.impacts, 1)
})

test('blueprints enforce age/resources, reserve real builders, build on arrival and do not double-charge', () => {
  const s = world(); s.ageIndex = 0
  actOnCosmos(s, { type: 'build', blueprint: 'pyramid' }); assert.equal(s.cosmos.projects.length, 0)
  s.ageIndex = 5; s.stone = 0
  actOnCosmos(s, { type: 'build', blueprint: 'pyramid' }); assert.equal(s.cosmos.projects.length, 0)
  s.stone = 1000
  actOnCosmos(s, { type: 'build', blueprint: 'pyramid' })
  const p = s.cosmos.projects[0]
  assert.equal(s.stone, 950); assert.equal(s.wood, 975)
  assert.ok(p.crew.length > 0)
  actOnCosmos(s, { type: 'build', blueprint: 'pyramid' }); assert.equal(s.stone, 950)
  for (const f of s.followers.filter(f => p.crew.includes(f.id))) f.dir.fromArray(p.dir)
  advance(s, 95)
  assert.equal(p.progress, 1)
  assert.equal(p.crew.length, 0)
  assert.equal(cosmicFaith(s.cosmos), BLUEPRINTS.pyramid.faith)
})

test('stone commandments are permanent and have distinct cultural/economic rules', () => {
  const s = world(); s.stone = 7
  actOnCosmos(s, { type: 'commandment', choice: 'peace' }); assert.equal(s.cosmos.commandment, null)
  s.stone = 10
  actOnCosmos(s, { type: 'commandment', choice: 'peace' }); assert.equal(s.stone, 2)
  actOnCosmos(s, { type: 'commandment', choice: 'trial' }); assert.equal(s.cosmos.commandment, 'peace')
  assert.equal(faithMultiplier(s.cosmos), 1.1)
  alignMiracle(s.cosmos, false, 300); assert.equal(s.cosmos.alignment, -100)
  alignMiracle(s.cosmos, true, 400); assert.equal(s.cosmos.alignment, 100)
})

test('champions respect gates, do not duplicate, heal nearby followers and accelerate surveys', () => {
  const s = world(); s.ageIndex = 0
  actOnCosmos(s, { type: 'champion', role: 'prophet' }); assert.equal(s.cosmos.champions.length, 0)
  s.ageIndex = 1
  actOnCosmos(s, { type: 'champion', role: 'prophet' })
  actOnCosmos(s, { type: 'champion', role: 'prophet' }); assert.equal(s.cosmos.champions.length, 1)
  const f = s.followers[0]; f.happiness = 20; f.burning = 1
  tickCosmos(s, 0.05, hooks()); assert.ok(f.happiness > 20); assert.equal(f.burning, 0)
  actOnCosmos(s, { type: 'champion', role: 'scholar' })
  actOnCosmos(s, { type: 'survey' }); advance(s, 8)
  assert.equal(s.cosmos.survey, 0)
  assert.equal(s.cosmos.relics[0].revealed, true)
  assert.equal(s.cosmos.colonies[0].stage, 'surveyed')
})

test('equipment-gated relic expeditions recover permanent benefits without repeated rewards', () => {
  const s = world(), r = s.cosmos.relics[1]
  r.revealed = true; s.ageIndex = 2
  actOnCosmos(s, { type: 'excavate', index: 1 }); assert.equal(r.active, false)
  s.ageIndex = 3
  actOnCosmos(s, { type: 'excavate', index: 1 }); assert.equal(r.active, true)
  for (const f of s.followers.filter(f => r.crew.includes(f.id))) f.dir.fromArray(r.dir)
  advance(s, 61)
  assert.equal(r.progress, 1); assert.equal(r.active, false); assert.equal(r.crew.length, 0)
  const wood = s.wood
  actOnCosmos(s, { type: 'excavate', index: 1 }); assert.equal(s.wood, wood)
})

test('regional climate affects growth and responds to active rain/sun intervention', () => {
  const s = world(), c = s.cosmos
  c.weather = { kind: 'drought', dir: startDir.toArray(), remaining: 40, next: 60 }
  assert.equal(climateCropFactor(c, startDir), 0.45)
  assert.equal(climateCropFactor(c, startDir.clone().negate()), 1)
  s.cursor = { dir: startDir.clone(), down: true, pressed: false }; s.tool = 'rain'
  const before = c.weather.remaining
  advance(s, 1)
  assert.ok(c.weather.remaining < before - 4)
  c.weather.kind = 'blizzard'; c.weather.remaining = 40; s.tool = 'sun'
  advance(s, 1); assert.ok(c.weather.remaining < 36)
  c.relics[2].progress = 1
  c.weather.kind = 'clear'; assert.equal(climateCropFactor(c, startDir), 1.25)
})

test('biosphere declines under drought and recovers with healthy forest and rain', () => {
  const s = world(), c = s.cosmos
  c.weather = { kind: 'drought', dir: startDir.toArray(), remaining: 55, next: 60 }
  const before = c.moisture
  advance(s, 30); assert.ok(c.moisture < before)
  const dry = c.ecosystem
  c.weather = { kind: 'monsoon', dir: startDir.toArray(), remaining: 55, next: 60 }
  c.moisture = 0.8
  advance(s, 30); assert.ok(c.ecosystem > dry)
  assert.ok(c.ecosystem >= 0 && c.ecosystem <= 100)
})

test('rockets transfer settlers, take time to arrive and evolve parallel colony economies', () => {
  const s = world(), save = exportSave()
  save.followers = Array.from({ length: 10 }, (_, i) => ({ ...save.followers[0], id: i + 1 }))
  importSave(save)
  const c = s.cosmos; c.colonies[0].stage = 'surveyed'; c.colonies[0].surveyed = true
  s.ageIndex = 4
  actOnCosmos(s, { type: 'launch', index: 0 }); assert.equal(c.colonies[0].stage, 'surveyed')
  s.ageIndex = 5
  const population = s.followers.length
  actOnCosmos(s, { type: 'launch', index: 0 })
  assert.equal(s.followers.length, population - 3)
  assert.equal(c.colonies[0].stage, 'launching'); assert.equal(c.colonies[0].population, 3)
  c.colonies[1].stage = 'surveyed'; c.colonies[1].surveyed = true
  actOnCosmos(s, { type: 'launch', index: 1 }); assert.equal(s.followers.length, population - 3)
  assert.equal(c.colonies[1].stage, 'surveyed')
  advance(s, 31); assert.equal(c.colonies[0].stage, 'settled')
  const stone = s.stone
  advance(s, 61); assert.ok(s.stone > stone); assert.ok(c.colonies[0].population >= 4)
  assert.ok(cosmicFaith(c) >= 0.8)
})

test('optional cosmic save extension round trips, does not alias live state and migrates old saves', () => {
  const s = world(); actOnCosmos(s, { type: 'commandment', choice: 'peace' })
  s.cosmos.relics[0].progress = 1; s.cosmos.shield = 13
  const save = exportSave(); save.cosmos.shield = 2; assert.equal(s.cosmos.shield, 13)
  assert.equal(importSave(save), true); assert.equal(s.cosmos.commandment, 'peace'); assert.equal(s.cosmos.shield, 2)
  delete save.cosmos
  assert.equal(importSave(save), true); assert.equal(s.cosmos.commandment, null); assert.equal(s.cosmos.relics.length, 4)
})

test('malformed cosmic data is normalized and cannot create unbounded render collections', () => {
  const c = restoreCosmos({ v: 1, projects: Array(100).fill({ kind: '__proto__' }), champions: [null], relics: [null], colonies: [null], disaster: { kind: 'meteors', remaining: Infinity, targets: [] }, ecosystem: NaN })
  assert.equal(c.projects.length, 0); assert.equal(c.champions.length, 0); assert.equal(c.relics.length, 4)
  assert.equal(c.disaster.targets.length, 1); assert.ok(Number.isFinite(c.ecosystem))
})

test('full simulation advances cosmic systems and saves alongside normal gameplay', () => {
  const s = world(); actOnCosmos(s, { type: 'survey' })
  for (let i = 0; i < 1000; i++) { tick(1 / 60); s.particleQueue.length = 0 }
  assert.equal(s.cosmos.relics[0].revealed, true)
  assert.ok(Number.isFinite(s.faithRate)); assert.ok(s.time > 16)
})


test('explicit player redirection releases reserved cosmic crews', () => {
  const s = world()
  actOnCosmos(s, { type: 'build', blueprint: 'bunker' })
  const id = s.cosmos.projects[0].crew[0]
  assert.ok(cosmicDuty(s.cosmos, id))
  releaseCosmicDuty(s.cosmos, id)
  assert.equal(cosmicDuty(s.cosmos, id), null)
})

test('trial culture, artifact bonuses and colony faith compose without duplicated passive payouts', () => {
  const s = world(), c = s.cosmos
  c.commandment = 'trial'
  c.relics[0].progress = c.relics[3].progress = 1
  assert.ok(Math.abs(faithMultiplier(c) - 1.2) < 1e-9)
  c.disaster = { kind: 'flare', remaining: 10, duration: 25, targets: [startDir.toArray()], resolved: false }
  assert.ok(Math.abs(faithMultiplier(c) - 1.56) < 1e-9)
  c.disaster.resolved = true
  assert.ok(Math.abs(faithMultiplier(c) - 1.2) < 1e-9)
})

test('unreachable wonder crews are released and not immediately reassigned to the same shore', () => {
  const s = world()
  actOnCosmos(s, { type: 'build', blueprint: 'bunker' })
  const p = s.cosmos.projects[0]
  assert.ok(p.crew.length)
  tickCosmos(s, 0.05, { ...hooks(), canReach: () => false })
  assert.deepEqual(p.crew, [])
  assert.equal(p.progress, 0)
})

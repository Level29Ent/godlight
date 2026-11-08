import test from 'node:test'
import assert from 'node:assert/strict'
import { createColonySurface, restoreColonySurface, tickColonySurface } from '../lib/game/colony.ts'
import { actOnCosmos, restoreCosmos, tickCosmos, cosmicFaith } from '../lib/game/cosmos.ts'
import { state, resetGame, exportSave, importSave } from '../lib/game/store.ts'
const hooks = { tell() {}, impact() {}, death() {} }
function world() {
  resetGame(); state.faith = state.wood = state.stone = 1000
  const p = state.cosmos.colonies[0]; p.stage = 'settled'; p.surveyed = true; p.population = 3
  return p
}
test('surveyed planets can be visited before settlement and uncharted ones cannot', () => {
  world(); actOnCosmos(state, { type: 'visit', index: 1 }); assert.equal(state.cosmos.activeColony, null)
  actOnCosmos(state, { type: 'visit', index: 0 }); assert.equal(state.cosmos.activeColony, 0)
  actOnCosmos(state, { type: 'visit', index: null }); assert.equal(state.cosmos.activeColony, null)
})
test('colony construction enforces costs, a single build queue and completion', () => {
  const p = world()
  actOnCosmos(state, { type: 'colony-build', index: 0, kind: 'turret' })
  assert.equal(state.stone, 975); assert.equal(state.wood, 990)
  actOnCosmos(state, { type: 'colony-build', index: 0, kind: 'farm' }); assert.equal(state.wood, 990)
  for (let i = 0; i < 400; i++) tickColonySurface(p.surface, 0.05, false, () => {})
  assert.equal(p.surface.turrets, 1); assert.equal(p.surface.build, null)
  p.surface.turrets = 6
  actOnCosmos(state, { type: 'colony-build', index: 0, kind: 'turret' }); assert.equal(p.surface.build, null)
})
test('dinosaurs approach and bite unprotected colonies; shields prevent bites', () => {
  const s = createColonySurface(); s.nextRaid = 0
  tickColonySurface(s, 0.05, false, () => {}); assert.equal(s.dinosaurs.length, 2)
  for (let i = 0; i < 500; i++) tickColonySurface(s, 0.05, true, () => {})
  assert.equal(s.integrity, 100)
  for (let i = 0; i < 80; i++) tickColonySurface(s, 0.05, false, () => {})
  assert.ok(s.integrity < 100)
})
test('turrets and player smites kill dinosaurs and repair restores production', () => {
  const p = world(); p.surface.nextRaid = 0
  tickColonySurface(p.surface, 0.05, false, () => {})
  actOnCosmos(state, { type: 'colony-smite', index: 0 }); assert.equal(state.faith, 985)
  assert.ok(p.surface.dinosaurs.every(d => d.hp === 35))
  p.surface.turrets = 1
  for (let i = 0; i < 100; i++) tickColonySurface(p.surface, 0.05, false, () => {})
  assert.equal(p.surface.dinosaurs.length, 0); assert.equal(p.surface.kills, 2)
  p.surface.integrity = 20
  const rate = cosmicFaith(state.cosmos)
  actOnCosmos(state, { type: 'colony-repair', index: 0 })
  assert.equal(p.surface.integrity, 60); assert.ok(cosmicFaith(state.cosmos) > rate)
})
test('each planet develops independently and zero-integrity colonies stop exporting', () => {
  const p = world(), q = state.cosmos.colonies[1]
  q.stage = 'settled'; q.population = 3; q.surface.integrity = 0
  p.surface.farms = 2; p.surface.habitats = 1
  const wood = state.wood
  tickCosmos(state, 1, hooks)
  assert.ok(state.wood > wood); assert.equal(q.growth, 0); assert.ok(p.growth > 1)
})
test('legacy colonies gain fresh surfaces and new colony/dinosaur progress round trips', () => {
  const p = world(); p.surface.nextRaid = 0; tickColonySurface(p.surface, 0.05, false, () => {})
  p.surface.farms = 2; state.cosmos.activeColony = 0
  const save = exportSave(); assert.equal(importSave(save), true)
  assert.equal(state.cosmos.activeColony, 0); assert.equal(state.cosmos.colonies[0].surface.farms, 2)
  assert.equal(state.cosmos.colonies[0].surface.dinosaurs.length, 2)
  delete save.cosmos.colonies[0].surface
  const legacy = restoreCosmos(save.cosmos)
  assert.equal(legacy.colonies[0].surface.integrity, 100)
  assert.equal(legacy.colonies[0].surface.dinosaurs.length, 0)
})
test('malformed dinosaur saves cannot allocate unlimited enemies or construction', () => {
  const s = restoreColonySurface({ dinosaurs: Array(100).fill({ hp: Infinity, approach: NaN }), build: { kind: '__proto__' }, farms: 999 })
  assert.equal(s.dinosaurs.length, 4); assert.equal(s.farms, 6); assert.equal(s.build, null)
  assert.ok(s.dinosaurs.every(d => Number.isFinite(d.hp) && Number.isFinite(d.approach)))
})

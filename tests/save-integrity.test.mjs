import test from 'node:test'
import assert from 'node:assert/strict'
import { state, resetGame, exportSave, importSave, tick } from '../lib/game/store.ts'
import { readLocalWorld, writeLocalWorld, LOCAL_SAVE_KEY } from '../lib/game/local-save.ts'

test('reject malformed snapshots before changing a live world', () => {
  resetGame(); state.faith = 321
  for (const bad of [{ v: 1 }, { ...exportSave(), followers: [null] }, { ...exportSave(), buildings: [null] }, { ...exportSave(), rocks: {} }, { ...exportSave(), tool: 'toString' }]) {
    const before = exportSave()
    assert.equal(importSave(bad), false)
    assert.deepEqual(exportSave(), before)
  }
})

test('loading preserves fire, injuries and lost status instead of healing a threatened world', () => {
  resetGame()
  const f = state.followers[0], b = state.buildings[0], tree = state.trees[0]
  f.hp = 25; f.burning = 2; f.heat = 3; f.scared = 4; f.lost = true
  b.burning = 2; b.upgrade = { level: 0, remaining: 15 }; b.hp = 40
  tree.burning = 3; tree.heat = 4
  state.fearTimer = 12
  importSave(JSON.parse(JSON.stringify(exportSave())))
  assert.equal(state.followers[0].hp, 25)
  assert.equal(state.followers[0].burning, 2)
  assert.equal(state.followers[0].lost, true)
  assert.equal(state.buildings[0].burning, 2)
  assert.equal(state.trees[0].burning, 3)
  assert.equal(state.fearTimer, 12)
  tick(0.01)
  assert.equal(state.buildings[0].upgrade.remaining, 15)
})

test('a malformed primary that would crash import falls back to the valid recovery copy', () => {
  resetGame()
  const map = new Map(), storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
  state.faith = 80; writeLocalWorld(storage, exportSave())
  state.faith = 90; writeLocalWorld(storage, exportSave())
  map.set(LOCAL_SAVE_KEY, JSON.stringify({ ...exportSave(), tool: '__proto__' }))
  assert.equal(readLocalWorld(storage).faith, 80)
})

test('legacy saves migrate status fields and malformed optional state stays finite', () => {
  resetGame()
  const legacy = exportSave()
  for (const f of legacy.followers) for (const key of ['hp', 'fire', 'heat', 'scared', 'from', 'lost']) delete f[key]
  for (const b of legacy.buildings) delete b.fire
  for (const t of legacy.trees) { delete t.fire; delete t.heat }
  delete legacy.fearTimer
  assert.equal(importSave(legacy), true)
  assert.equal(state.followers[0].hp, 100); assert.equal(state.followers[0].burning, 0)
  assert.equal(state.buildings[0].burning, 0); assert.equal(state.fearTimer, 0)
  const malformed = exportSave()
  malformed.followers[0].hp = Infinity; malformed.followers[0].fire = -3; malformed.followers[0].d = [Infinity, NaN, 0]
  malformed.followers[0].h = 1000; malformed.followers[0].sp = -1
  malformed.buildings[0].m = Infinity; malformed.buildings[0].g = -1
  assert.equal(importSave(malformed), true)
  assert.ok(state.followers[0].dir.toArray().every(Number.isFinite))
  assert.equal(state.followers[0].hp, 100); assert.equal(state.followers[0].burning, 0)
  assert.equal(state.followers[0].happiness, 100); assert.ok(state.followers[0].speed > 0)
  assert.equal(state.buildings[0].moisture, 0); assert.equal(state.buildings[0].growth, 0)
})

test('invalid save rejection does not release photo pause or replace a challenge RNG', async () => {
  const { startScenario, setPhotoMode } = await import('../lib/game/store.ts')
  const { simulationSeed } = await import('../lib/game/random.ts')
  startScenario('drought'); setPhotoMode(true)
  const before = simulationSeed()
  try {
    assert.equal(importSave({ v: 1, followers: [null], buildings: [], trees: [] }), false)
    assert.equal(state.photoMode, true); assert.equal(state.chronicle.scenario, 'drought')
    assert.equal(simulationSeed(), before)
    const time = state.time; tick(0.05); assert.equal(state.time, time)
  } finally { setPhotoMode(false); resetGame() }
})

test('recovery rejects nonfinite root values and oversized model collections', () => {
  resetGame()
  for (const changed of [{ faith: Infinity }, { time: -10 }, { followers: Array(10001).fill({}) }]) {
    const before = exportSave()
    assert.equal(importSave({ ...before, ...changed }), false)
    assert.deepEqual(exportSave(), before)
  }
})

test('restoring zero-health entities does not resurrect them or their paid improvements', () => {
  resetGame()
  state.followers[0].hp = 0
  const remaining = state.followers.length - 1
  state.buildings[0].hp = 0; state.buildings[0].upgrade = { level: 1, remaining: 3 }
  const save = exportSave()
  importSave(save)
  assert.equal(state.followers.length, remaining)
  assert.equal(state.buildings.some(b => b.type === 'house'), false)
  assert.equal(state.buildings.some(b => b.upgrade), false)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { state, resetGame, startScenario, exportSave, importSave, tick, setTool, pressCursor, releaseCursor, favoriteFollower, ascendWorld, maxHp } from '../lib/game/store.ts'
import { createChronicle, record, restoreChronicle, tickChronicle, canAscend, ascensionGoals, SCENARIOS } from '../lib/game/chronicles.ts'
import { readLocalWorld, writeLocalWorld, LOCAL_SAVE_KEY, CHALLENGE_SAVE_KEY } from '../lib/game/local-save.ts'
import { powerBlock, comboFeedback, effectivePowerRadius } from '../lib/game/power-feedback.ts'
import { seedSimulation, simulationSeed, gameRandom } from '../lib/game/random.ts'
import { isBuildable } from '../lib/game/planet.ts'

const tell = () => {}
function storage() { const map = new Map(); return { map, getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) } }

test('journal records founding, answered prayers and disasters with bounded immutable save snapshots', () => {
  resetGame()
  assert.ok(state.chronicle.entries.some(e => e.text.includes('found')))
  const f = state.followers[0]
  state.living.prayers = [{ followerId: f.id, kind: 'work', progress: 1, expires: 100 }]
  tick(0.01)
  assert.ok(state.chronicle.entries.some(e => e.followerId === f.id && e.text.includes('answered')))
  state.cosmos.averted = 1
  tickChronicle(state, 0.01, tell); tickChronicle(state, 0.01, tell)
  assert.equal(state.chronicle.entries.filter(e => e.text.includes('protection')).length, 1)
  for (let i = 0; i < 100; i++) record(state, `Memory ${i}`, f.id)
  assert.equal(state.chronicle.entries.length, 80)
  favoriteFollower(f.id)
  const save = exportSave(); save.chronicle.entries[0].text = 'changed'
  assert.notEqual(state.chronicle.entries[0].text, 'changed')
  importSave(exportSave())
  assert.ok(state.chronicle.favorites.includes(f.id))
})

test('journal migration and malformed data cannot create unbounded lists', () => {
  resetGame()
  const save = exportSave(); delete save.chronicle; importSave(save)
  assert.equal(state.chronicle.entries.length, 0)
  const raw = { entries: Array.from({ length: 120 }, () => ({ text: 'x'.repeat(400), time: Infinity, followerId: NaN })), favorites: Array.from({ length: 20 }, (_, i) => i + 1), colony: [{ cargo: Infinity, secure: -20, complete: 'yes' }], scenario: 'other' }
  const c = restoreChronicle(raw, 100, 3, 4, 5)
  assert.equal(c.entries.length, 80); assert.equal(c.entries[0].text.length, 200)
  assert.equal(c.entries[0].followerId, null); assert.equal(c.favorites.length, 8)
  assert.equal(c.colony.length, 3); assert.equal(c.colony[0].cargo, 0)
  assert.equal(c.scenario, null); assert.equal(c.last.averted, 4)
})

test('colony specializations impose distinct hazards, progress independently and pay once', () => {
  resetGame()
  for (const p of state.cosmos.colonies) { p.stage = 'settled'; p.surveyed = true; p.population = 3 }
  const [moon, desert, ocean] = state.cosmos.colonies
  ocean.surface.dinosaurs = [{ id: 1, hp: 80, approach: 0, bite: 2, angle: 0 }]
  tickChronicle(state, 1, tell)
  assert.ok(moon.surface.integrity < 100); assert.ok(desert.surface.integrity < moon.surface.integrity)
  assert.ok(ocean.surface.dinosaurs[0].approach > 0)
  moon.surface.habitats = 2; desert.surface.farms = 2; ocean.surface.turrets = 2
  state.chronicle.colony[0].cargo = 19.99; state.chronicle.colony[1].cargo = 19.99
  state.chronicle.colony[2].secure = 179.9
  tickChronicle(state, 1, tell)
  assert.ok(state.chronicle.colony.every(p => p.complete))
  const memories = state.chronicle.entries.length
  tickChronicle(state, 1, tell)
  assert.equal(state.chronicle.entries.length, memories)
  importSave(exportSave())
  assert.ok(state.chronicle.colony.every(p => p.complete))
})

test('ocean secure time resets on damage, and dead colonies do not export cargo', () => {
  resetGame()
  const p = state.cosmos.colonies[2]; p.stage = 'settled'; p.population = 3; p.surface.turrets = 2
  state.chronicle.colony[2].secure = 50; p.surface.integrity = 70
  tickChronicle(state, 1, tell); assert.equal(state.chronicle.colony[2].secure, 0)
  p.surface.integrity = 0
  state.chronicle.colony[2].secure = 170
  const cargo = state.chronicle.colony[2].cargo
  tickChronicle(state, 10, tell); assert.equal(state.chronicle.colony[2].cargo, cargo)
  assert.equal(state.chronicle.colony[2].secure, 0)
})

test('home rewards heal only to max HP and restore moisture', () => {
  resetGame(); state.chronicle.colony[0].complete = state.chronicle.colony[2].complete = true
  for (const b of state.buildings) { b.hp = maxHp(b.type) - 0.001; b.burning = 0 }
  tick(0.05)
  assert.ok(state.buildings.every(b => b.hp <= maxHp(b.type)))
})

test('Ascension needs every milestone plus faith, transforms once without resetting the world', () => {
  resetGame(); state.faith = 10000
  assert.equal(canAscend(state), false)
  state.ageIndex = 5; state.living.answered = 20; state.cosmos.averted = 3
  state.cosmos.projects = ['bunker', 'pyramid', 'obelisk'].map(kind => ({ kind, dir: [0, 1, 0], progress: 1, crew: [] }))
  state.chronicle.colony.forEach(p => p.complete = true)
  assert.ok(ascensionGoals(state).every(g => g.done)); assert.equal(canAscend(state), true)
  const followers = state.followers.length
  ascendWorld(); assert.equal(state.faith, 9000); assert.equal(state.chronicle.ascended, true)
  assert.equal(state.followers.length, followers)
  ascendWorld(); assert.equal(state.faith, 9000)
  importSave(exportSave()); assert.equal(state.chronicle.ascended, true)
})

test('scenario starts are seeded and reproduce their model starting state', () => {
  for (const kind of Object.keys(SCENARIOS)) {
    startScenario(kind); const first = exportSave()
    startScenario(kind); const second = exportSave()
    assert.deepEqual(second, first)
    assert.equal(state.chronicle.scenario, kind)
  }
  resetGame(); assert.equal(simulationSeed(), null)
})

test('challenge and normal device saves never overwrite one another and recovery rejects wrong banks', () => {
  const store = storage()
  resetGame(); state.faith = 123
  const normal = exportSave(); assert.equal(writeLocalWorld(store, normal), true)
  const raw = store.map.get(LOCAL_SAVE_KEY)
  startScenario('drought'); assert.equal(writeLocalWorld(store, exportSave()), true)
  assert.equal(store.map.get(LOCAL_SAVE_KEY), raw)
  assert.ok(store.map.has(CHALLENGE_SAVE_KEY))
  assert.equal(readLocalWorld(store).faith, 123)
  assert.equal(readLocalWorld(store, 'challenge').chronicle.scenario, 'drought')
  store.map.set(LOCAL_SAVE_KEY, store.map.get(CHALLENGE_SAVE_KEY))
  assert.equal(readLocalWorld(store), null)
  assert.equal(importSave(normal), true); assert.equal(state.chronicle.scenario, null)
  assert.equal(simulationSeed(), null)
})

test('Gentle Hands blocks restricted powers at selection and cast time but keeps basic care', () => {
  startScenario('restraint'); state.ageIndex = 5; state.faith = 1000
  setTool('meteor'); assert.equal(state.tool, 'sun')
  state.tool = 'meteor'; pressCursor(state.followers[0].dir); tick(0.01); releaseCursor()
  assert.equal(state.meteors.length, 0); assert.match(powerBlock(state, 'meteor', state.viewDir), /Gentle Hands/)
  assert.equal(powerBlock(state, 'rain', state.viewDir), null)
})

test('challenge completion is one-time and resumes from a persisted seeded RNG', () => {
  startScenario('drought'); state.time = 300; state.harvests = 5
  tickChronicle(state, 0.01, tell); assert.equal(state.chronicle.won, true)
  const length = state.chronicle.entries.length
  tickChronicle(state, 1, tell); assert.equal(state.chronicle.entries.length, length)
  const saved = exportSave(); const next = gameRandom()
  importSave(saved); assert.equal(gameRandom(), next)
  resetGame()
})

test('feedback explains locks, insufficient faith, water and a ready wider Thunderstorm', () => {
  resetGame()
  assert.match(powerBlock(state, 'meteor', state.viewDir), /Unlocks/)
  state.ageIndex = 5; state.faith = 0
  assert.match(powerBlock(state, 'meteor', state.viewDir), /faith/)
  state.faith = 1000
  const water = new Vector3(0, 1, 0)
  if (!isBuildable(water)) assert.ok(powerBlock(state, 'house', water))
  state.living.cast = { tool: 'rain', seconds: 2, dir: state.viewDir.toArray(), time: state.time }
  state.cursor.dir = state.viewDir.clone()
  assert.match(comboFeedback(state), /ready/)
  assert.equal(effectivePowerRadius(state, 'lightning', state.viewDir, 0.4), 1.8)
  state.living.comboCooldown = state.time + 30
  assert.match(comboFeedback(state), /cooldown/)
  assert.equal(effectivePowerRadius(state, 'lightning', state.viewDir, 0.4), 0.4)
})

test('challenge entry refuses storage failure before changing a running normal world', async () => {
  const { beginChallenge, resumeChallenge } = await import('../lib/game/challenge-session.ts')
  resetGame(); state.faith = 777
  const before = exportSave()
  const broken = { getItem() { return null }, setItem() { throw new Error('quota') } }
  assert.throws(() => beginChallenge(broken, 'drought'), /backup failed/)
  assert.deepEqual(exportSave(), before)
  const device = storage()
  beginChallenge(device, 'drought')
  assert.equal(readLocalWorld(device).faith, 777)
  writeLocalWorld(device, exportSave())
  importSave(readLocalWorld(device))
  resumeChallenge(device)
  assert.equal(state.chronicle.scenario, 'drought')
  assert.equal(readLocalWorld(device).faith, 777)
  resetGame()
})

test('manual save slots reject challenge data without touching a normal slot', async () => {
  const { saveGame, listSaves } = await import('../app/actions/saves.ts')
  const previous = globalThis.window, device = storage()
  globalThis.window = { localStorage: device }
  try {
    resetGame(); await saveGame(1, 'Normal', exportSave())
    assert.equal((await listSaves())[0].followers, state.followers.filter(f => !f.lost).length)
    const before = new Map(device.map)
    startScenario('drought')
    await assert.rejects(saveGame(1, 'Challenge', exportSave()), /separate device save/)
    assert.deepEqual(device.map, before)
  } finally { globalThis.window = previous; resetGame() }
})

test('challenge saves retain the full long drought and restrict cosmic paid smites', async () => {
  const { actOnCosmos } = await import('../lib/game/cosmos.ts')
  startScenario('drought')
  assert.equal(state.cosmos.weather.remaining, 120)
  importSave(exportSave())
  assert.equal(state.cosmos.weather.remaining, 120)
  startScenario('restraint')
  const before = state.faith
  assert.match(actOnCosmos(state, { type: 'shield' }), /Gentle Hands/)
  assert.match(actOnCosmos(state, { type: 'colony-smite', index: 0 }), /Gentle Hands/)
  assert.equal(state.faith, before)
  resetGame()
})


test('challenge starts clear stale camera input and saved views restore their focus', async () => {
  const { cameraInput, setKeyAxes } = await import('../lib/game/camera.ts')
  setKeyAxes({ yaw: 1, pitch: 1, zoom: 1 })
  startScenario('drought')
  assert.deepEqual(cameraInput.keys, { yaw: 0, pitch: 0, zoom: 0 })
  assert.ok(cameraInput.focus.distanceTo(state.viewDir) < 1e-8)
  state.viewDir.copy(state.viewDir.clone().negate())
  const save = exportSave()
  importSave(save)
  assert.ok(cameraInput.focus.distanceTo(state.viewDir) < 1e-8)
  resetGame()
})


test('Sun crystal specialization applies the advertised ten percent faith reward', () => {
  resetGame()
  const snapshot = exportSave()
  const rate = active => {
    importSave(snapshot)
    state.chronicle.colony[1].complete = active
    for (const f of state.followers) { f.state = 'pray'; f.timer = 100; f.job = null; f.happiness = 100 }
    tick(0.01)
    return state.faithRate
  }
  const base = rate(false), boosted = rate(true)
  assert.ok(base > 0)
  assert.ok(Math.abs(boosted - base * 1.1) < 1e-6)
  resetGame()
})

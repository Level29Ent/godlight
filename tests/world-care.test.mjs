import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { resetGame, state, exportSave, importSave, setInspectMode, inspectEntity, focusCareTarget, setTool, pressCursor, tick, ascendWorld, showFinale, dismissFinale, maxHp } from '../lib/game/store.ts'
import { constructionDetails, followerNeed, worldIssues, followerMemories, inspectionTitle } from '../lib/game/world-care.ts'
import { createWildlife, restoreWildlife, tickWildlife, wildlifeHabitat } from '../lib/game/wildlife.ts'
import { restoreChronicle } from '../lib/game/chronicles.ts'

const farm = () => state.buildings.find(b => b.type === 'farm')
test('health overview identifies actionable home and colony issues without mutation', () => {
  resetGame()
  const f = state.followers[0], b = farm(); assert.ok(b)
  f.happiness = 10; f.burning = 1; f.job = null; f.taskId = null; f.state = 'idle'
  b.moisture = 0.1
  const unfinished = { ...state.buildings[0], id: 9999, progress: 0.4 }
  state.buildings.push(unfinished)
  const colony = state.cosmos.colonies[0]; colony.stage = 'settled'; colony.surveyed = true; colony.surface.integrity = 40
  const before = exportSave(), issues = worldIssues(state)
  assert.deepEqual(issues.map(i => i.key), ['fire', 'dry', 'construction', 'unhappy', 'idle', 'colonies'])
  assert.equal(issues.find(i => i.key === 'fire').target.id, f.id)
  assert.equal(issues.find(i => i.key === 'colonies').target.kind, 'colony')
  assert.deepEqual(exportSave(), before)
})

test('construction details report remaining costs, shortfalls and actual assigned builders', () => {
  resetGame()
  const b = state.buildings[0]; b.progress = 0.5
  state.wood = 1; state.stone = 0
  state.followers[0].job = { kind: 'build', targetId: b.id, dir: b.dir, spot: b.dir, work: 0 }
  state.followers[1].job = null; state.followers[1].taskId = b.id; state.followers[1].state = 'build'
  const d = constructionDetails(state, b)
  assert.equal(d.assigned, 2); assert.equal(d.progress, 50)
  assert.equal(d.wood, 4); assert.equal(d.stone, 2)
  assert.equal(d.missingWood, 3); assert.equal(d.missingStone, 2)
  b.progress = 1
  assert.equal(constructionDetails(state, b).missingWood, 0)
})

test('follower inspection prioritizes urgent needs and shows only that person’s recent memories', () => {
  resetGame()
  const f = state.followers[0]
  state.living.prayers.push({ followerId: f.id, kind: 'work', progress: 0, expires: 100 })
  assert.match(followerNeed(state, f), /task/)
  f.burning = 1; assert.match(followerNeed(state, f), /fire/)
  assert.ok(followerMemories(state, f.id).every(m => m.followerId === f.id))
  assert.equal(inspectionTitle(state, { kind: 'building', id: -100 }), null)
})

test('inspection does not cast powers, clears held gestures, and resets when switching tools or loading', () => {
  resetGame()
  state.cursor.down = true; state.cursor.pressed = true
  setInspectMode(true)
  assert.equal(state.cursor.down, false); assert.equal(state.cursor.pressed, false)
  const f = state.followers[0]
  inspectEntity({ kind: 'follower', id: f.id })
  assert.equal(state.inspection.id, f.id)
  pressCursor(f.dir); assert.equal(state.cursor.down, false)
  setTool('rain'); assert.equal(state.inspectMode, false); assert.equal(state.inspection, null)
  setInspectMode(true); inspectEntity({ kind: 'follower', id: f.id })
  importSave(exportSave()); assert.equal(state.inspectMode, false); assert.equal(state.inspection, null)
})

test('health focus safely switches worlds and rejects missing targets', () => {
  resetGame()
  const f = state.followers[0]
  assert.equal(focusCareTarget({ kind: 'colony', id: 0 }), false)
  state.cosmos.colonies[0].surveyed = true
  assert.equal(focusCareTarget({ kind: 'colony', id: 0 }), true)
  assert.equal(state.cosmos.activeColony, 0)
  assert.equal(focusCareTarget({ kind: 'follower', id: f.id }), true)
  assert.equal(state.cosmos.activeColony, null); assert.equal(state.inspection.id, f.id)
  assert.equal(focusCareTarget({ kind: 'building', id: -5 }), false)
})

test('selection is cleared after its person disappears, without freeing unrelated jobs', () => {
  resetGame()
  const f = state.followers[0]
  setInspectMode(true); inspectEntity({ kind: 'follower', id: f.id })
  state.followers = state.followers.filter(x => x.id !== f.id)
  tick(0.01)
  assert.equal(state.inspection, null)
})

test('wildlife habitats respond to water, forests, alignment and drought with bounded slow recovery', () => {
  resetGame()
  const h = wildlifeHabitat(state)
  assert.ok(h.forest.length > 0)
  state.cosmos.alignment = 50; const good = wildlifeHabitat(state)
  state.cosmos.alignment = -50; const bad = wildlifeHabitat(state)
  assert.ok(good.deerCapacity > bad.deerCapacity)
  state.cosmos.alignment = 0; state.cosmos.weather.kind = 'clear'
  tickWildlife(state, 1)
  assert.ok(state.wildlife.deer <= 0.04 && state.wildlife.birds <= 0.04)
  state.wildlife = { deer: 8, birds: 10 }; state.trees = []; state.buildings = []
  tickWildlife(state, 10)
  assert.ok(state.wildlife.deer < 8 && state.wildlife.birds < 10)
  assert.deepEqual(restoreWildlife({ deer: Infinity, birds: 999 }), { deer: 0, birds: 10 })
  assert.deepEqual(restoreWildlife(null), createWildlife())
})

test('wildlife offers modest farm and nearby forest benefits without reducing ripe crops', () => {
  resetGame()
  const b = farm(), f = state.followers[0]; assert.ok(b)
  b.moisture = 1; b.growth = 0.2
  state.wildlife = { deer: 5, birds: 5 }
  state.trees[0].dir.copy(f.dir); state.trees[0].size = 1; state.trees[0].charred = 0; state.trees[0].burning = 0
  f.happiness = 50
  tickWildlife(state, 0.05)
  assert.ok(b.growth > 0.2); assert.ok(f.happiness > 50)
  b.growth = 0.99999
  tickWildlife(state, 0.05)
  assert.equal(b.growth, 0.99999)
  b.moisture = 0; b.growth = 0.1
  tickWildlife(state, 0.05)
  assert.equal(b.growth, 0.1)
})

test('wildlife saves round trip independently and older worlds receive an empty habitat population', () => {
  resetGame(); state.wildlife = { deer: 3.5, birds: 4.2 }
  const save = exportSave(); save.wildlife.deer = 8
  assert.equal(state.wildlife.deer, 3.5)
  importSave(exportSave()); assert.deepEqual(state.wildlife, { deer: 3.5, birds: 4.2 })
  const old = exportSave(); delete old.wildlife; importSave(old)
  assert.deepEqual(state.wildlife, createWildlife())
})

test('Ascension captures an immutable finale story and persists acknowledgement and replay state correctly', () => {
  resetGame(); state.faith = 2000; state.ageIndex = 5; state.time = 600; state.living.answered = 20; state.cosmos.averted = 3
  state.chronicle.colony.forEach(c => c.complete = true)
  state.cosmos.projects = ['bunker', 'pyramid', 'obelisk'].map(kind => ({ kind, progress: 1, dir: [0, 1, 0], crew: [] }))
  ascendWorld()
  assert.equal(state.chronicle.finaleSeen, false)
  const story = structuredClone(state.chronicle.story)
  state.harvests = 1000; state.time = 700
  assert.deepEqual(state.chronicle.story, story)
  dismissFinale(); assert.equal(state.chronicle.finaleSeen, true)
  showFinale(); assert.equal(state.finaleReplay, true)
  importSave(exportSave()); assert.equal(state.finaleReplay, false); assert.deepEqual(state.chronicle.story, story)
  assert.equal(state.chronicle.finaleSeen, true)
})

test('finale migration and malformed stories remain bounded and do not fabricate old Ascension stats', () => {
  const old = restoreChronicle({ ascended: true }, 100, 5, 3, 0)
  assert.equal(old.story, null); assert.equal(old.finaleSeen, true)
  const c = restoreChronicle({ ascended: true, finaleSeen: false, story: { time: Infinity, followers: -10, colonies: 99, memories: Array(100).fill('x'.repeat(500)) } }, 100, 5, 3, 0)
  assert.equal(c.story.time, 0); assert.equal(c.story.followers, 0); assert.equal(c.story.colonies, 3)
  assert.equal(c.story.memories.length, 5); assert.equal(c.story.memories[0].length, 200)
  assert.equal(c.finaleSeen, false)
})

test('drought reduces wildlife capacity and benefits require whole visible populations', () => {
  resetGame()
  const b = farm(); assert.ok(b); b.moisture = 1; b.growth = 0.2
  state.cosmos.alignment = 50
  state.wildlife = { deer: 0.5, birds: 0.5 }
  tickWildlife(state, 0.1)
  assert.equal(b.growth, 0.2)
  state.wildlife = { deer: 4, birds: 1 }
  state.cosmos.weather.kind = 'clear'
  tickWildlife(state, 1)
  const clear = { ...state.wildlife }
  state.wildlife = { deer: 4, birds: 1 }; state.cosmos.weather.kind = 'drought'
  tickWildlife(state, 1)
  assert.ok(state.wildlife.deer <= clear.deer)
  assert.ok(state.wildlife.birds < clear.birds)
})

test('finale pause does not release the Worldbook pause and snapshot survives unseen reload', async () => {
  const { setPaused } = await import('../lib/game/store.ts')
  resetGame(); state.chronicle.ascended = true; state.chronicle.finaleSeen = false
  importSave(exportSave())
  assert.equal(state.chronicle.finaleSeen, false)
  try {
    setPaused(true, 'worldbook'); setPaused(true, 'ascension-finale')
    dismissFinale(); setPaused(false, 'ascension-finale')
    const before = state.time; tick(0.05)
    assert.equal(state.time, before)
    setPaused(false, 'worldbook'); tick(0.05)
    assert.ok(state.time > before)
  } finally { setPaused(false, 'worldbook'); setPaused(false, 'ascension-finale'); resetGame() }
})

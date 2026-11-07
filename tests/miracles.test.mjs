import test from 'node:test'
import assert from 'node:assert/strict'
import { state, startGame, setTool, pressCursor, releaseCursor, tick, exportSave, importSave, maxHp } from '../lib/game/store.ts'
import { isBuildable, randomLandDirNear } from '../lib/game/planet.ts'

test('well placement and repeated blessings keep simulation and save states valid', () => {
  startGame()
  state.ageIndex = 5
  state.faith = 10000
  state.wood = state.stone = 100
  let direction = null
  for (let i = 0; i < 300; i++) {
    const d = randomLandDirNear(state.viewDir, 1)
    if (d && isBuildable(d) && state.buildings.every(b => b.dir.distanceTo(d) * 7 > 1)) { direction = d; break }
  }
  assert.ok(direction, 'find an open buildable site')
  setTool('well')
  pressCursor(direction)
  tick(1 / 60)
  releaseCursor()
  const well = state.buildings.find(b => b.type === 'well')
  assert.ok(well)
  well.progress = 1
  well.hp = 1
  well.burning = 1
  state.followers[0].dir.copy(well.dir)
  state.followers[0].happiness = 10
  state.followers[0].burning = 1
  setTool('blessing')
  for (let i = 0; i < 10; i++) {
    pressCursor(well.dir)
    tick(1 / 60)
    releaseCursor()
    // The GPU consumers drain this each frame; emulate them in the headless simulation.
    state.particleQueue.length = 0
  }
  assert.equal(well.burning, 0)
  assert.equal(well.hp, maxHp('well'))
  assert.equal(state.stats.blessings, 10)
  assert.ok(state.followers[0].happiness > 90)
  const before = state.time
  for (let i = 0; i < 600; i++) { tick(1 / 60); state.particleQueue.length = 0 }
  assert.ok(state.time > before + 9)
  assert.ok(Number.isFinite(state.faith))
  const saved = exportSave()
  assert.equal(importSave(saved), true)
  assert.ok(state.buildings.some(b => b.type === 'well'))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { state, resetGame, exportSave, importSave, tick, upgradeBuilding, setPaused, commandCosmos } from '../lib/game/store.ts'
import { beginUpgrade, tickUpgrades, upgradeLevel, nextUpgrade, restoreUpgrade, housingCapacity, farmGrowthMultiplier, wellIrrigation } from '../lib/game/upgrades.ts'

function setup() { resetGame(); state.ageIndex = 5; state.faith = state.wood = state.stone = 1000; return state.buildings[0] }
const tell = () => {}

test('improvements enforce age, completion, health, resources and duplicate work before charging', () => {
  const b = setup()
  state.ageIndex = 0
  assert.equal(beginUpgrade(state, b.id).ok, false)
  assert.equal(state.wood, 1000)
  state.ageIndex = 1; b.progress = 0.5
  assert.equal(beginUpgrade(state, b.id).ok, false)
  b.progress = 1; b.burning = 1
  assert.equal(beginUpgrade(state, b.id).ok, false)
  b.burning = 0; b.hp = 0
  assert.equal(beginUpgrade(state, b.id).ok, false)
  b.hp = 100; state.stone = 0
  assert.equal(beginUpgrade(state, b.id).ok, false)
  state.stone = 1000
  assert.equal(beginUpgrade(state, b.id).ok, true)
  assert.equal(state.faith, 975); assert.equal(state.wood, 988); assert.equal(state.stone, 992)
  assert.equal(upgradeLevel(b), 0)
  assert.equal(beginUpgrade(state, b.id).ok, false)
  assert.equal(state.wood, 988)
  assert.equal(beginUpgrade(state, -1).ok, false)
})

test('tier benefits begin on completion and both tiers stop at their explicit cap', () => {
  const b = setup()
  beginUpgrade(state, b.id)
  assert.equal(housingCapacity(b), 3)
  tickUpgrades(state, 19, tell); assert.equal(upgradeLevel(b), 0)
  let completions = 0
  tickUpgrades(state, 1, () => completions++)
  assert.equal(upgradeLevel(b), 1); assert.equal(housingCapacity(b), 5)
  const next = nextUpgrade(b)
  assert.equal(next.faith, 50); assert.equal(next.wood, 24); assert.equal(next.seconds, 35)
  beginUpgrade(state, b.id); tickUpgrades(state, 35, () => completions++)
  assert.equal(upgradeLevel(b), 2); assert.equal(housingCapacity(b), 7)
  const faith = state.faith
  assert.equal(beginUpgrade(state, b.id).ok, false); assert.equal(state.faith, faith)
  tickUpgrades(state, 100, () => completions++)
  assert.equal(completions, 2); assert.equal(nextUpgrade(b), null)
})

test('fire and world pause stop improvement timers, destruction removes work with the building', () => {
  const b = setup()
  beginUpgrade(state, b.id)
  b.burning = 1
  tickUpgrades(state, 10, tell); assert.equal(b.upgrade.remaining, 20)
  b.burning = 0
  try { setPaused(true, 'test-upgrade'); tick(1); assert.equal(b.upgrade.remaining, 20) }
  finally { setPaused(false, 'test-upgrade') }
  tick(0.05); assert.equal(b.upgrade.remaining, 19.95)
  b.hp = 0; tick(0.01)
  assert.equal(state.buildings.some(site => site.id === b.id), false)
})

test('house upgrades update actual population capacity and do not grant free health or duplicate buildings', () => {
  const b = setup(), count = state.buildings.length
  b.hp = 30
  upgradeBuilding(b.id)
  tickUpgrades(state, 20, tell)
  tick(0.01)
  assert.equal(state.capacity, 7) // 2 base + 5 upgraded home
  assert.equal(state.buildings.length, count)
  assert.equal(b.hp, 30)
})

test('farms grow twenty percent faster per tier only while watered, including actual simulation', () => {
  setup()
  const snapshot = exportSave()
  const growth = level => {
    importSave(snapshot)
    const farm = state.buildings.find(b => b.type === 'farm')
    assert.ok(farm); farm.upgrade = { level, remaining: null }; farm.growth = 0; farm.moisture = 1
    state.cursor.down = false
    tick(0.01)
    return farm.growth
  }
  const base = growth(0), tierOne = growth(1), tierTwo = growth(2)
  assert.ok(Math.abs(tierOne - base * 1.2) < 1e-8)
  assert.ok(Math.abs(tierTwo - base * 1.4) < 1e-8)
  const farm = state.buildings.find(b => b.type === 'farm'); farm.moisture = 0; farm.growth = 0
  tick(0.01); assert.equal(farm.growth, 0)
})

test('well tiers increase actual irrigation reach and rate without changing care radii', () => {
  setup()
  const saved = exportSave(), home = saved.buildings[0]
  saved.buildings.push({ ...home, t: 'well' })
  const moisture = level => {
    importSave(saved)
    const well = state.buildings.find(b => b.type === 'well'), farm = state.buildings.find(b => b.type === 'farm')
    well.upgrade = { level, remaining: null }
    // Just outside normal 2.2-unit irrigation reach, inside both improved tiers.
    farm.dir.copy(well.dir).applyAxisAngle(well.dir.clone().cross(new Vector3(1, 0, 0)).normalize(), 0.35)
    farm.moisture = 0.1
    state.buildings = [farm, well]
    tick(0.01)
    return farm.moisture
  }
  const base = moisture(0), improved = moisture(1), best = moisture(2)
  assert.ok(improved > base); assert.ok(best > improved)
  assert.deepEqual(wellIrrigation({ upgrade: { level: 2 } }), { range: 3, moisture: 0.08 })
})

test('improvement level and in-flight timer survive saves without aliasing or recharging', () => {
  const b = setup(); beginUpgrade(state, b.id); tickUpgrades(state, 7, tell)
  const save = exportSave(); const faith = state.faith
  assert.equal(save.buildings[0].u.remaining, 13)
  save.buildings[0].u.remaining = 1
  assert.equal(b.upgrade.remaining, 13)
  importSave(exportSave())
  assert.equal(state.buildings[0].upgrade.remaining, 13)
  assert.equal(state.faith, faith)
  tickUpgrades(state, 13, tell)
  assert.equal(upgradeLevel(state.buildings[0]), 1)
})

test('legacy and invalid upgrade data migrate safely and unsupported buildings cannot improve', () => {
  setup()
  const saved = exportSave()
  assert.equal(saved.buildings[0].u, undefined)
  importSave(saved); assert.equal(upgradeLevel(state.buildings[0]), 0)
  assert.equal(restoreUpgrade({ level: 9, remaining: -10 }, false, true), undefined)
  assert.equal(restoreUpgrade({ level: 9, remaining: -10 }, true, false), undefined)
  assert.deepEqual(restoreUpgrade({ level: 99, remaining: 1000 }, true, true), { level: 2, remaining: null })
  assert.deepEqual(restoreUpgrade({ level: NaN, remaining: Infinity }, true, true), { level: 0, remaining: null })
  assert.deepEqual(restoreUpgrade({ level: 1, remaining: 999 }, true, true), { level: 1, remaining: 35 })
  assert.equal(farmGrowthMultiplier({ type: 'house' }), 1)
  state.buildings[0].type = 'temple'
  assert.equal(beginUpgrade(state, state.buildings[0].id).ok, false)
})

test('colony visits do not stop home upgrades and game over stops their timers', () => {
  const b = setup(); beginUpgrade(state, b.id)
  state.cosmos.colonies[0].surveyed = true
  commandCosmos({ type: 'visit', index: 0 })
  const snapshot = exportSave()
  assert.equal(snapshot.cosmos.activeColony, 0)
  tick(0.05)
  assert.equal(b.upgrade.remaining, 19.95)
  state.gameOver = true
  const t = b.upgrade.remaining
  tick(1); assert.equal(b.upgrade.remaining, t)
  resetGame()
})


test('upgrade commissioning is journaled once and photos cannot spend resources', () => {
  const b = setup()
  state.photoMode = true
  const before = state.faith
  upgradeBuilding(b.id)
  assert.equal(state.faith, before); assert.equal(b.upgrade, undefined)
  state.photoMode = false
  upgradeBuilding(b.id); upgradeBuilding(b.id)
  assert.equal(state.chronicle.entries.filter(e => e.text.includes('commissioned')).length, 1)
  assert.equal(state.faith, before - 25)
  resetGame()
})

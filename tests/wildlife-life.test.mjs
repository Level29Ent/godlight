import test from 'node:test'
import assert from 'node:assert/strict'
import { Object3D, Vector3 } from 'three'
import { state, resetGame, exportSave, importSave, inspectEntity, pressCursor, setTool, setPaused, tick } from '../lib/game/store.ts'
import { simulationSeed } from '../lib/game/random.ts'
import { isLand } from '../lib/game/planet.ts'
import { inspectionTitle } from '../lib/game/world-care.ts'
import { ANIMAL_PARTS, poseAnimalPart } from '../lib/game/animal-visuals.ts'
import { animalName, animalPose, animalContribution, wildlifeCatalog, wildlifeSites, rareWildlifeReady, wildlifeSoundLevel } from '../lib/game/wildlife-life.ts'

function healthy() {
  resetGame()
  state.cosmos.ecosystem = 95; state.cosmos.moisture = 0.7
  state.cosmos.alignment = 50; state.cosmos.weather.kind = 'clear'; state.time = 45
}

test('habitats attract distinct bounded wildlife without changing save data or gameplay RNG', () => {
  healthy()
  const before = exportSave(), rng = simulationSeed()
  const sites = wildlifeSites(state), animals = wildlifeCatalog(state)
  assert.ok(sites.some(p => p.kind === 'forest'))
  assert.ok(sites.some(p => p.kind === 'meadow'))
  assert.ok(sites.some(p => p.kind === 'wetland'))
  assert.ok(animals.length <= 68)
  assert.equal(new Set(animals.map(a => a.id)).size, animals.length)
  assert.ok(animals.filter(a => a.kind === 'bird').every(a => a.habitat === 'wetland'))
  assert.ok(animals.filter(a => a.kind === 'fish').every(a => !isLand(a.home)))
  assert.deepEqual(wildlifeCatalog(state), animals)
  assert.equal(simulationSeed(), rng); assert.deepEqual(exportSave(), before)
  assert.ok(animals.filter(a => !a.resident).every(a => /no direct|No extra/.test(animalContribution(a))))
})

test('drought removes flowers and wetlands, damaged forests lose cover, and moisture restores them', () => {
  healthy()
  assert.ok(wildlifeSites(state).some(p => p.kind === 'meadow'))
  state.cosmos.weather.kind = 'drought'; state.trees.forEach(t => { t.charred = 1 })
  assert.ok(wildlifeSites(state).every(p => p.kind === 'coast'))
  assert.ok(wildlifeCatalog(state).every(a => a.kind === 'fish' || a.resident))
  state.cosmos.weather.kind = 'clear'
  assert.ok(wildlifeSites(state).some(p => p.kind === 'wetland'))
  state.cosmos.moisture = 0.1
  assert.ok(wildlifeSites(state).every(p => p.kind === 'coast'))
})

test('rare visitors require health, moisture, benevolence, clear skies, habitat, and a visit window', () => {
  healthy()
  assert.equal(rareWildlifeReady(state), true)
  const visitors = wildlifeCatalog(state).filter(a => a.rare)
  assert.deepEqual(visitors.map(animalName), ['White stag', 'Luminous fish'])
  for (const [key, value] of [['ecosystem', 84], ['moisture', 0.44], ['alignment', 24]]) {
    const previous = state.cosmos[key]; state.cosmos[key] = value
    assert.equal(wildlifeCatalog(state).some(a => a.rare), false)
    state.cosmos[key] = previous
  }
  for (const time of [0, 29.999, 90, 180]) { state.time = time; assert.equal(wildlifeCatalog(state).some(a => a.rare), false) }
  state.time = 210; assert.equal(wildlifeCatalog(state).filter(a => a.rare).length, 2)
  state.trees.forEach(t => { t.charred = 1 })
  assert.deepEqual(wildlifeCatalog(state).filter(a => a.rare).map(animalName), ['Luminous fish'])
  state.cosmos.weather.kind = 'monsoon'; assert.equal(rareWildlifeReady(state), false)
})

test('animals graze, rest, fly, and school with finite surface-safe deterministic poses', () => {
  healthy()
  const animals = wildlifeCatalog(state)
  for (const a of animals) for (const time of [0, 4, 10, 15, 27.999, 28, 10000]) {
    const pose = animalPose(a, time)
    assert.ok(pose.matrix.elements.every(Number.isFinite))
    assert.equal(isLand(pose.dir), a.kind !== 'fish')
    assert.deepEqual(pose.matrix.elements, animalPose(a, time).matrix.elements)
  }
  const deer = { ...animals.find(a => a.kind === 'deer'), phase: 0 }
  assert.equal(animalPose(deer, 4).activity, 'Grazing')
  assert.equal(animalPose(deer, 15).activity, 'Wandering')
  assert.equal(animalPose(deer, 4).grazing, 1)
  const bird = { ...animals.find(a => a.kind === 'bird'), phase: 0 }
  assert.equal(animalPose(bird, 4).activity, 'Resting by water')
  assert.equal(animalPose(bird, 18).activity, 'Flying')
  assert.ok(animalPose(bird, 18).root.position.length() > animalPose(bird, 4).root.position.length() + 0.4)
  const wing = ANIMAL_PARTS.bird.find(p => p.motion === 'wing')
  const folded = new Object3D(), flying = new Object3D()
  poseAnimalPart(wing, 4, 0, folded, 0, 0)
  poseAnimalPart(wing, 4, 0, flying, 0, 1)
  assert.ok(Math.abs(folded.position.x) < Math.abs(flying.position.x))
  assert.ok(folded.scale.x < flying.scale.x)
  const fish = animals.filter(a => a.kind === 'fish' && a.id >= 34 && a.id < 38)
  assert.equal(fish.length, 4)
  assert.ok(fish.every(a => a.home.equals(fish[0].home)))
  assert.ok(animalPose(fish[0], 10).dir.distanceTo(animalPose(fish[3], 10).dir) < 0.04)
  const head = ANIMAL_PARTS.deer.find(p => p.motion === 'graze' && p.position[2] === 0.205)
  const scratch = new Object3D()
  poseAnimalPart(head, 4, 0, scratch, 1)
  assert.ok(scratch.position.y < head.position[1])
})

test('wildlife inspection clears casts, survives pause, rejects missing animals and resets on load', () => {
  healthy()
  const animal = wildlifeCatalog(state).find(a => a.rare)
  state.cursor.down = true
  inspectEntity({ kind: 'animal', id: animal.id })
  assert.equal(inspectionTitle(state, state.inspection), 'White stag')
  assert.equal(state.inspectMode, true); assert.equal(state.cursor.down, false)
  pressCursor(animal.home); assert.equal(state.cursor.down, false)
  const time = state.time, pose = animalPose(animal, time).matrix.elements
  setPaused(true, 'test-wildlife'); tick(5)
  assert.equal(state.time, time); assert.deepEqual(animalPose(animal, state.time).matrix.elements, pose)
  setPaused(false, 'test-wildlife')
  state.time = 91; tick(0.01); assert.equal(state.inspection, null)
  inspectEntity({ kind: 'animal', id: -1 }); assert.equal(state.inspection, null)
  importSave(exportSave()); assert.equal(state.inspectMode, false)
  setTool('rain')
})

test('nature sound attenuation fades with zoom and silences far-side animals', () => {
  const source = new Vector3(0, 0, 7)
  assert.equal(wildlifeSoundLevel(new Vector3(0, 0, -10), source), 0)
  assert.equal(wildlifeSoundLevel(new Vector3(0, 0, 35), source), 0)
  assert.ok(wildlifeSoundLevel(new Vector3(0, 0, 10), source) > wildlifeSoundLevel(new Vector3(0, 0, 20), source))
})

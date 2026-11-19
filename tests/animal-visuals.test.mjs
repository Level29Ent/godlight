import test from 'node:test'
import assert from 'node:assert/strict'
import { Object3D } from 'three'
import { ANIMAL_PARTS, MAX_ANIMAL_PARTS, poseAnimalPart } from '../lib/game/animal-visuals.ts'

test('each animal fits the instance budget and has finite, nondegenerate transforms', () => {
  const scratch = new Object3D()
  for (const parts of Object.values(ANIMAL_PARTS)) {
    assert.ok(parts.length <= MAX_ANIMAL_PARTS)
    for (const part of parts) for (const time of [0, 0.25, 50, 100000]) {
      const matrix = poseAnimalPart(part, time, 2.399, scratch)
      assert.ok(matrix.elements.every(Number.isFinite))
      assert.ok(matrix.determinant() > 0)
    }
  }
})

test('bird wings flap symmetrically around their shoulders', () => {
  const wings = ANIMAL_PARTS.bird.filter(part => part.motion === 'wing')
  const left = new Object3D(), right = new Object3D()
  for (const time of [0, 0.2, 0.5, 1]) {
    for (let i = 0; i < 2; i++) {
      poseAnimalPart(wings[i], time, 0.4, left)
      poseAnimalPart(wings[i + 2], time, 0.4, right)
      assert.ok(Math.abs(left.position.x + right.position.x) < 1e-9)
      assert.equal(left.position.y, right.position.y)
      assert.equal(left.rotation.z, -right.rotation.z)
    }
  }
})

test('poses freeze at a fixed simulation time and scratch reuse does not leak transforms', () => {
  const scratch = new Object3D()
  const parts = Object.values(ANIMAL_PARTS).flat()
  const before = parts.map(part => [...poseAnimalPart(part, 12.5, 1, scratch).elements])
  for (const part of parts.toReversed()) poseAnimalPart(part, 200, 4, scratch)
  assert.deepEqual(parts.map(part => [...poseAnimalPart(part, 12.5, 1, scratch).elements]), before)
  assert.notDeepEqual(
    [...poseAnimalPart(ANIMAL_PARTS.fish.find(part => part.motion === 'tail'), 0, 0, scratch).elements],
    [...poseAnimalPart(ANIMAL_PARTS.fish.find(part => part.motion === 'tail'), 0.2, 0, scratch).elements],
  )
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readLocalWorld, writeLocalWorld } from '../lib/game/local-save.ts'

const world = { v: 1, followers: [], buildings: [], trees: [], faith: 90 }
test('device progress round trips without a network or account', () => {
  const data = new Map()
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
  assert.equal(writeLocalWorld(storage, world), true)
  assert.deepEqual(readLocalWorld(storage), world)
})
test('malformed, incompatible and oversized saves do not restore', () => {
  for (const value of ['{', 'null', '{"v":2}', '{"v":1}', JSON.stringify({ ...world, followers: [null] }), JSON.stringify({ ...world, rocks: {} }), 'x'.repeat(1_500_001)]) {
    assert.equal(readLocalWorld({ getItem: () => value }), null)
  }
})
test('disabled storage and quota exhaustion are safe failures', () => {
  assert.equal(readLocalWorld({ getItem() { throw new Error('blocked') } }), null)
  assert.equal(writeLocalWorld({ setItem() { throw new Error('quota') } }, world), false)
  assert.equal(writeLocalWorld({ setItem() { assert.fail('must not write oversized data') } }, { ...world, extra: 'x'.repeat(1_500_001) }), false)
})

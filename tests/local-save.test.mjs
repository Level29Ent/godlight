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

test('a damaged primary recovers the previous valid snapshot without crossing banks', async () => {
  const { readLocalProgress, LOCAL_SAVE_KEY, CHALLENGE_SAVE_KEY } = await import('../lib/game/local-save.ts')
  const map = new Map(), storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
  writeLocalWorld(storage, world)
  writeLocalWorld(storage, { ...world, faith: 100 })
  assert.equal(readLocalWorld(storage).faith, 100)
  map.set(LOCAL_SAVE_KEY, '{bad')
  assert.equal(readLocalProgress(storage).recovered, true)
  assert.equal(readLocalWorld(storage).faith, 90)
  const challenge = { ...world, chronicle: { scenario: 'drought' } }
  writeLocalWorld(storage, challenge)
  writeLocalWorld(storage, { ...challenge, faith: 200 })
  map.set(CHALLENGE_SAVE_KEY, JSON.stringify(world))
  assert.equal(readLocalWorld(storage, 'challenge').chronicle.scenario, 'drought')
  assert.equal(readLocalWorld(storage).faith, 90)
})

test('corrupt primaries do not poison recovery copies, and backup quota does not block a primary write', async () => {
  const { LOCAL_SAVE_KEY } = await import('../lib/game/local-save.ts')
  const map = new Map(), storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
  writeLocalWorld(storage, world); writeLocalWorld(storage, { ...world, faith: 100 })
  map.set(LOCAL_SAVE_KEY, 'broken')
  writeLocalWorld(storage, { ...world, faith: 120 })
  assert.equal(JSON.parse(map.get(`${LOCAL_SAVE_KEY}-backup`)).faith, 90)
  assert.equal(writeLocalWorld({ ...storage, setItem(k, v) { if (k.endsWith('-backup')) throw new Error('quota'); map.set(k, v) } }, { ...world, faith: 150 }), true)
  assert.equal(readLocalWorld(storage).faith, 150)
  assert.equal(writeLocalWorld(storage, { ...world, followers: [null] }), false)
  assert.equal(readLocalWorld(storage).faith, 150)
})

test('a failed primary write still leaves the last valid snapshot recoverable', async () => {
  const { LOCAL_SAVE_KEY } = await import('../lib/game/local-save.ts')
  const map = new Map(), storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
  writeLocalWorld(storage, world)
  const failing = { ...storage, setItem(k, v) { if (k === LOCAL_SAVE_KEY) throw new Error('quota'); map.set(k, v) } }
  assert.equal(writeLocalWorld(failing, { ...world, faith: 200 }), false)
  assert.equal(readLocalWorld(storage).faith, 90)
  map.set(LOCAL_SAVE_KEY, 'broken')
  assert.equal(readLocalWorld(storage).faith, 90)
})

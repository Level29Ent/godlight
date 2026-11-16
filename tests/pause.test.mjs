import test from 'node:test'
import assert from 'node:assert/strict'
import { setPaused, startGame, state, tick } from '../lib/game/store.ts'

test('closing one pause owner does not resume another menu or ad', () => {
  startGame()
  const before = state.time
  try {
    setPaused(true, 'guide')
    setPaused(true, 'saves')
    setPaused(false, 'saves')
    tick(0.05)
    assert.equal(state.time, before)
    setPaused(false, 'guide')
    tick(0.05)
    assert.ok(state.time > before)
  } finally {
    setPaused(false, 'guide')
    setPaused(false, 'saves')
  }
})

test('pausing releases held powers and duplicate owner updates are idempotent', () => {
  startGame()
  state.cursor.down = true
  try {
    setPaused(true, 'guide')
    setPaused(true, 'guide')
    assert.equal(state.cursor.down, false)
    const before = state.time
    tick(0.05)
    assert.equal(state.time, before)
    setPaused(false, 'guide')
    tick(0.05)
    assert.ok(state.time > before)
  } finally { setPaused(false, 'guide') }
})

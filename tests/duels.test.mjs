import test from 'node:test'
import assert from 'node:assert/strict'
import { POWERS, isPower, outcome } from '../lib/duels/rules.ts'

test('all nine pairings are balanced and deterministic', () => {
  for (const a of POWERS) {
    assert.equal(outcome(a, a), 0)
    const rivals = POWERS.filter(b => b !== a)
    assert.deepEqual(rivals.map(b => outcome(a, b)).sort(), [-1, 1])
    for (const b of rivals) assert.equal(outcome(a, b), -outcome(b, a))
  }
  assert.equal(outcome('sun', 'rain'), 1)
  assert.equal(outcome('rain', 'lightning'), 1)
  assert.equal(outcome('lightning', 'sun'), 1)
})
test('rejects malformed and unrecognized moves', () => {
  for (const value of [null, undefined, {}, [], 1, 'SUN', 'boost', '']) assert.equal(isPower(value), false)
  for (const value of POWERS) assert.equal(isPower(value), true)
})

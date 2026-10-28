import test from 'node:test'
import assert from 'node:assert/strict'
import { stockpileProgress, constructionProgress } from '../lib/game/task-progress.ts'
import { OBJECTIVES } from '../lib/game/objectives.ts'

test('resource tasks count only net gain and never go negative', () => {
  assert.equal(stockpileProgress(40, 40), 0)
  assert.equal(stockpileProgress(52, 40), 12)
  assert.equal(stockpileProgress(30, 40), 0)
})
test('construction tasks exclude new sites and unfinished or destroyed sites', () => {
  assert.equal(constructionProgress([{ id: 1, progress: 0.9 }, { id: 2, progress: 1 }], [1]), 0)
  assert.equal(constructionProgress([{ id: 1, progress: 1 }], [1]), 1)
  assert.equal(constructionProgress([], [1]), 0)
})
test('new objectives preserve all saved original objective indexes', () => {
  assert.deepEqual(OBJECTIVES.slice(0, 17).map(o => o.id), ['bless', 'water', 'house', 'explore', 'pop6', 'harvest', 'clay', 'strike', 'douse', 'challenge1', 'trees', 'temple', 'farside', 'iron', 'meteor', 'challenge5', 'gold'])
  assert.equal(OBJECTIVES.length, 22)
  assert.equal(new Set(OBJECTIVES.map(o => o.id)).size, OBJECTIVES.length)
  const state = { wood: 80, stone: 60, harvests: 20, stats: { temples: 3 }, challengesWon: 10 }
  for (const objective of OBJECTIVES.slice(17)) assert.equal(objective.progress(state), objective.target)
})

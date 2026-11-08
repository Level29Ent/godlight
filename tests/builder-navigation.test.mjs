import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { state, resetGame, tick } from '../lib/game/store.ts'
import { isLand } from '../lib/game/planet.ts'

test('a builder with an obsolete approach target walks to the real site and resumes construction', () => {
  resetGame()
  const b = state.buildings.find(b => b.type === 'house')
  assert.ok(b)
  b.progress = 0.1
  state.wood = state.stone = 1000
  const f = state.followers[0]
  const axis = new Vector3().crossVectors(b.dir, new Vector3(0, 1, 0)).normalize()
  let approach = null
  for (const turn of [0.08, -0.08, 0.06, -0.06]) {
    const d = b.dir.clone().applyAxisAngle(axis, turn)
    if (isLand(d)) { approach = d; break }
  }
  assert.ok(approach)
  state.followers = [f]
  f.lost = false; f.burning = 0; f.scared = 0; f.job = null
  f.state = 'build'; f.taskId = b.id; f.dir.copy(approach); f.target.copy(approach)
  state.birthTimer = 10000; state.invasionTimer = 10000; state.challengeTimer = 10000
  state.cosmos.nextDisaster = 10000; state.cosmos.weather.next = 10000
  for (let i = 0; i < 900; i++) { tick(1 / 60); state.particleQueue.length = 0 }
  assert.ok(b.progress > 0.1, 'construction must resume, not stall forever at a stale approach point')
})

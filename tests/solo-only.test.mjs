import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const file = path => new URL(`../${path}`, import.meta.url)
test('solo title retains start and saves without a multiplayer entry', () => {
  const game = readFileSync(file('components/game/game.tsx'), 'utf8')
  assert.doesNotMatch(game, /\/duels|Divine Duels/)
  assert.match(game, /startGame\(\)/)
  assert.match(game, /<ContinueButton/)
  assert.match(game, /<SaveMenu/)
  assert.match(game, /<Autosave/)
})
test('multiplayer route, actions, rules and installation SQL are removed', () => {
  for (const path of ['app/duels/page.tsx', 'app/actions/duels.ts', 'lib/duels/rules.ts', 'scripts/duels.sql']) {
    assert.equal(existsSync(file(path)), false, path)
  }
})

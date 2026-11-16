import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// These are layout-structure regressions, not a substitute for browser screenshots.
test('all bottom menu triggers share the single measured flow dock', () => {
  const game = read('components/game/game.tsx')
  const dock = game.slice(game.indexOf('<footer'), game.indexOf('</footer>'))
  assert.match(dock, /data-game-dock/)
  for (const control of ['GameTools', 'FieldGuide', 'CosmicCouncil', 'Worldbook', 'ChallengeControls']) assert.match(dock, new RegExp(`<${control}`))
  assert.match(dock, /Eco/)
  assert.equal((game.match(/<footer/g) ?? []).length, 1)
  for (const path of ['field-guide', 'cosmic-council', 'worldbook', 'challenge-controls']) {
    const source = read(`components/game/${path}.tsx`)
    assert.match(source, /game-menu-button/)
    assert.doesNotMatch(source, /absolute bottom-(?:0|14) (?:left|right)/)
  }
})

test('panels reserve measured dock space and small-screen menus wrap into three columns', () => {
  const css = read('app/globals.css')
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(css, /bottom: calc\(var\(--game-dock-height\) \+ 0\.5rem\)/)
  assert.match(css, /env\(safe-area-inset-bottom\)/)
  assert.match(css, /@media \(max-height: 500px\)/)
  assert.match(css, /game-guidance:not\(\[aria-label="Challenge progress"\]\)/, 'challenge exit stays reachable in landscape')
  assert.match(css, /\.game-bottom dialog, \.game-bottom aside, \.game-bottom section \{ pointer-events: auto;/)
  for (const name of ['worldbook', 'challenge-controls', 'galaxy-controls', 'world-care']) assert.match(read(`components/game/${name}.tsx`), /game-floating-panel/)
})

test('layout observes rendered header/dock sizes and mode changes rather than guessing offsets', () => {
  const source = read('components/game/responsive-layout.tsx')
  assert.match(source, /ResizeObserver/)
  assert.match(source, /MutationObserver/)
  assert.match(source, /getBoundingClientRect\(\)\.height/)
  assert.match(source, /--game-dock-height/)
  assert.match(source, /--game-header-height/)
  assert.match(source, /observer\.disconnect\(\); mutations\.disconnect\(\)/)
  const hud = read('components/game/hud.tsx')
  assert.match(hud, /data-game-header/)
  assert.doesNotMatch(hud, /absolute inset-x-0 top-28/)
})

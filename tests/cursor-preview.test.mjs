import test from 'node:test'
import assert from 'node:assert/strict'
import { Color } from 'three'
import { TOOLS } from '../lib/game/config.ts'
import { CURSOR_PREVIEWS, cursorColor, canBuildPreview } from '../lib/game/cursor-preview.ts'
import { findStartDir } from '../lib/game/planet.ts'

// Reproduce the exact Color.copy call made by CursorFX on every active frame.
// Previously Well, Blessing, Grove and several other tools passed undefined here.
test('every selectable tool supports repeated cursor color updates without throwing', () => {
  const materialColor = new Color()
  for (const tool of TOOLS) for (const valid of [true, false]) {
    for (let frame = 0; frame < 60; frame++) {
      assert.doesNotThrow(() => materialColor.copy(cursorColor(tool.id, valid)), tool.id)
      assert.ok([materialColor.r, materialColor.g, materialColor.b].every(Number.isFinite), tool.id)
    }
    assert.ok(CURSOR_PREVIEWS[tool.id].radius > 0)
  }
})

test('all and only construction tools have a building ghost', () => {
  for (const tool of TOOLS) {
    const scale = CURSOR_PREVIEWS[tool.id].buildingScale
    assert.equal(scale !== null, tool.kind === 'build', tool.id)
    if (scale) assert.ok(scale.every(n => Number.isFinite(n) && n > 0))
  }
})

test('well and monument previews reject occupied sites and match large-building clearance', () => {
  const dir = findStartDir()
  const near = dir.clone().applyAxisAngle(dir.clone().cross({ x: 0, y: 1, z: 0 }).normalize(), 0.095)
  assert.ok(dir.distanceTo(near) * 7 > 0.55 && dir.distanceTo(near) * 7 < 0.8)
  assert.equal(canBuildPreview(dir, 'well', []), true)
  assert.equal(canBuildPreview(dir, 'well', [{ dir, type: 'house' }]), false)
  assert.equal(canBuildPreview(dir, 'well', [{ dir: near, type: 'house' }]), true)
  assert.equal(canBuildPreview(dir, 'well', [{ dir: near, type: 'monument' }]), false)
  assert.equal(canBuildPreview(dir, 'monument', [{ dir: near, type: 'house' }]), false)
  assert.notDeepEqual(cursorColor('well', true), cursorColor('well', false))
})

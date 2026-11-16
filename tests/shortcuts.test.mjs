import test from 'node:test'
import assert from 'node:assert/strict'
import { ignoreGameShortcut } from '../lib/game/shortcuts.ts'

const key = overrides => ({ defaultPrevented: false, ctrlKey: false, metaKey: false, altKey: false, repeat: false, target: null, ...overrides })
test('normal game keys work, but modified and repeating keys do not', () => {
  assert.equal(ignoreGameShortcut(key()), false)
  for (const flag of ['ctrlKey', 'metaKey', 'altKey', 'repeat', 'defaultPrevented']) {
    assert.equal(ignoreGameShortcut(key({ [flag]: true })), true, flag)
  }
})
test('forms, editable regions and menus keep their keyboard input', () => {
  for (const tag of ['input', 'textarea', 'select', 'dialog', 'aside']) {
    const target = { closest: selector => selector.split(', ').includes(tag) ? {} : null }
    assert.equal(ignoreGameShortcut(key({ target })), true, tag)
  }
  const target = { closest: selector => selector.includes('[contenteditable]') ? {} : null }
  assert.equal(ignoreGameShortcut(key({ target })), true)
  assert.equal(ignoreGameShortcut(key(), true), true)
})

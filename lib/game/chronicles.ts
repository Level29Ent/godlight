import type { GameState } from './store'
import { identity } from './living'

export const SCENARIOS = {
  drought: { name: 'The Long Drought', seed: 29401, text: 'Survive 5 minutes and harvest 5 crops. A seeded dry spell starts immediately.', seconds: 300 },
  restraint: { name: 'Gentle Hands', seed: 29402, text: 'Reach 8 home followers with Sun, Rain, Touch and buildings only. Destructive powers and paid miracles are sealed.', seconds: 0 },
} as const
export type Scenario = keyof typeof SCENARIOS
export interface Chronicle {
  entries: { time: number; text: string; followerId: number | null }[]
  favorites: number[]
  colony: { cargo: number; secure: number; complete: boolean }[]
  ascended: boolean
  scenario: Scenario | null; won: boolean
  last: { averted: number; impacts: number; age: number }
}
export function createChronicle(): Chronicle {
  return { entries: [], favorites: [], colony: Array.from({ length: 3 }, () => ({ cargo: 0, secure: 0, complete: false })), ascended: false, scenario: null, won: false, last: { averted: 0, impacts: 0, age: 0 } }
}
export function record(s: GameState, text: string, followerId: number | null = null) {
  s.chronicle.entries.push({ time: Math.max(0, s.time), text: text.slice(0, 200), followerId })
  if (s.chronicle.entries.length > 80) s.chronicle.entries.splice(0, s.chronicle.entries.length - 80)
}
const finite = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : 0
export function restoreChronicle(raw: unknown, time: number, age: number, averted: number, impacts: number): Chronicle {
  const c = createChronicle()
  c.last = { age, averted, impacts }
  if (!raw || typeof raw !== 'object') return c
  const x = raw as Partial<Chronicle>
  c.scenario = x.scenario === 'drought' || x.scenario === 'restraint' ? x.scenario : null
  c.won = x.won === true; c.ascended = x.ascended === true
  if (Array.isArray(x.entries)) c.entries = x.entries.slice(-80).filter(e => e && typeof e === 'object' && typeof e.text === 'string').map(e => ({ text: e.text.slice(0, 200), time: Math.min(time, finite(e.time, 1e9)), followerId: typeof e.followerId === 'number' && Number.isSafeInteger(e.followerId) && e.followerId > 0 ? e.followerId : null }))
  if (Array.isArray(x.favorites)) c.favorites = [...new Set(x.favorites.filter(v => Number.isSafeInteger(v) && v > 0))].slice(0, 8)
  if (Array.isArray(x.colony)) for (let i = 0; i < 3; i++) {
    const p = x.colony[i]
    if (p && typeof p === 'object') c.colony[i] = { cargo: finite(p.cargo, 1e6), secure: finite(p.secure, 180), complete: p.complete === true }
  }
  return c
}
export const COLONY_GOALS = [
  { resource: 'Moonstone', text: 'Low gravity fractures habitats: lose 0.12 integrity/sec without a habitat. Build 2 habitats and export 20 Moonstone.', reward: 'Home buildings slowly repair (+0.3 HP/sec).', target: 20 },
  { resource: 'Sun crystal', text: 'Desert heat stresses unwatered settlements: lose 0.18 integrity/sec without a farm. Build 2 farms and export 20 Sun crystal.', reward: 'Home prayer generation +10%.', target: 20 },
  { resource: 'Tide pearl', text: 'Ocean nesting grounds: dinosaur approaches are 25% faster. Build 2 turrets and maintain at least 80 integrity for 180 seconds.', reward: 'Home farms gain +0.015 moisture/sec.', target: 180 },
] as const
export function ascensionGoals(s: GameState) {
  return [
    { text: 'Reach the Age of Stars', done: s.ageIndex >= 5 },
    { text: 'Answer 20 follower prayers', done: s.living.answered >= 20 },
    { text: 'Avert 3 cosmic disasters', done: s.cosmos.averted >= 3 },
    { text: 'Complete 3 wonders', done: s.cosmos.projects.filter(p => p.progress >= 1).length >= 3 },
    { text: 'Complete all 3 colony specializations', done: s.chronicle.colony.every(p => p.complete) },
  ]
}
export function canAscend(s: GameState) { return s.started && !s.gameOver && !s.chronicle.ascended && ascensionGoals(s).every(g => g.done) && s.faith >= 1000 }
export function ascend(s: GameState) {
  if (!canAscend(s)) return false
  s.faith -= 1000; s.chronicle.ascended = true
  for (const f of s.followers) { f.happiness = 100; f.jump = 0.6 }
  record(s, 'Celestial Ascension: the world becomes a sanctuary among the stars.')
  return true
}
export function tickChronicle(s: GameState, dt: number, tell: (text: string) => void) {
  const c = s.chronicle
  if (s.cosmos.averted > c.last.averted) record(s, 'Your people survived a cosmic disaster under divine protection.')
  if (s.cosmos.impacts > c.last.impacts) record(s, 'A cosmic disaster left scars, but your civilization endured.')
  if (s.ageIndex > c.last.age) record(s, `Your civilization entered age ${s.ageIndex + 1}.`)
  c.last = { averted: s.cosmos.averted, impacts: s.cosmos.impacts, age: s.ageIndex }
  for (const [i, colony] of s.cosmos.colonies.entries()) {
    if (colony.stage !== 'settled') continue
    const p = c.colony[i], surface = colony.surface
    if (i === 0 && surface.habitats === 0) surface.integrity = Math.max(0, surface.integrity - dt * 0.12)
    if (i === 1 && surface.farms === 0) surface.integrity = Math.max(0, surface.integrity - dt * 0.18)
    if (i === 2) for (const d of surface.dinosaurs) d.approach = Math.min(1, d.approach + dt / 80)
    if (i === 2) p.secure = surface.integrity >= 80 && surface.turrets >= 2 && colony.population > 0 ? Math.min(180, p.secure + dt) : 0
    if (surface.integrity <= 0 || colony.population <= 0) continue
    p.cargo = Math.min(1e6, p.cargo + dt * colony.population * 0.04 * surface.integrity / 100)
    const done = i === 0 ? surface.habitats >= 2 && p.cargo >= 20 : i === 1 ? surface.farms >= 2 && p.cargo >= 20 : p.secure >= 180
    if (!p.complete && done) { p.complete = true; record(s, `${COLONY_GOALS[i].resource} specialization established. ${COLONY_GOALS[i].reward}`); tell('Colony specialization complete! A permanent home-world benefit is active.') }
  }
  if (c.colony[2].complete) for (const b of s.buildings) if (b.type === 'farm' && b.progress >= 1) b.moisture = Math.min(1, b.moisture + dt * 0.015)
  if (c.scenario && !c.won && !s.gameOver) {
    const done = c.scenario === 'drought' ? s.time >= 300 && s.harvests >= 5 : s.pop >= 8
    if (done) { c.won = true; record(s, `${SCENARIOS[c.scenario].name} completed.`); tell('Challenge complete! You may keep playing or return to your normal world.') }
  }
}
export function rememberFollower(s: GameState, id: number, event: string) { record(s, `${identity(id).name} ${event}`, id) }

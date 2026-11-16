import type { GameState } from './store'
import { PLANET_RADIUS } from './planet'

export interface Wildlife { deer: number; birds: number }
export function createWildlife(): Wildlife { return { deer: 0, birds: 0 } }
export function restoreWildlife(raw: unknown): Wildlife {
  const x = raw && typeof raw === 'object' ? raw as Partial<Wildlife> : {}
  const count = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : 0
  return { deer: count(x.deer, 8), birds: count(x.birds, 10) }
}
export function wildlifeHabitat(s: GameState) {
  const forest = s.trees.filter(t => t.charred === 0 && t.burning === 0 && t.size >= 0.4)
  const water = s.buildings.filter(b => b.progress >= 1 && b.burning === 0 && (b.type === 'well' || b.type === 'farm' && b.moisture >= 0.4))
  const peaceful = s.cosmos.alignment >= 25 ? 1.15 : s.cosmos.alignment <= -25 ? 0.55 : 1
  return { forest, water, deerCapacity: Math.min(8, forest.length / 12) * s.cosmos.ecosystem / 100 * peaceful, birdCapacity: Math.min(10, water.length * 2) * s.cosmos.moisture * peaceful }
}
export function tickWildlife(s: GameState, dt: number) {
  const h = wildlifeHabitat(s), w = s.wildlife
  const drought = s.cosmos.weather.kind === 'drought'
  const approach = (n: number, target: number, max: number) => Math.max(0, Math.min(max, n + Math.max(-dt * 0.12, Math.min(dt * 0.04, target - n))))
  w.deer = approach(w.deer, h.deerCapacity * (drought ? 0.4 : 1), 8)
  w.birds = approach(w.birds, h.birdCapacity * (drought ? 0.3 : 1), 10)
  // No fractional-population buffs: benefits follow actually visible herds/flocks.
  const deer = Math.floor(w.deer), birds = Math.floor(w.birds)
  if (birds) for (const b of s.buildings) if (b.type === 'farm' && b.progress >= 1 && b.moisture >= 0.4 && b.burning === 0) b.growth = Math.max(b.growth, Math.min(0.9999, b.growth + dt * birds * 0.001))
  if (deer) for (const f of s.followers) if (!f.lost && h.forest.slice(0, deer).some(t => t.dir.distanceTo(f.dir) * PLANET_RADIUS < 1.8)) f.happiness = Math.min(100, f.happiness + dt * 0.05 * deer)
}

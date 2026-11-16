import type { Building, GameState } from './store'

export interface BuildingUpgrade { level: number; remaining: number | null }
export const UPGRADE_TYPES = {
  house: { name: 'Expanded homes', benefit: '+2 housing per completed tier', wood: 12, stone: 8 },
  farm: { name: 'Terraced fields', benefit: '+20% crop growth per completed tier; still needs water', wood: 10, stone: 6 },
  well: { name: 'Irrigation channels', benefit: '+0.4 irrigation range and +0.015 moisture/sec per tier', wood: 8, stone: 12 },
} as const
export function upgradeLevel(b: Building) { return b.upgrade?.level ?? 0 }
export function restoreUpgrade(raw: unknown, supported: boolean, complete: boolean): BuildingUpgrade | undefined {
  if (!supported || !complete || !raw || typeof raw !== 'object') return undefined
  const x = raw as Partial<BuildingUpgrade>
  const level = typeof x.level === 'number' && Number.isFinite(x.level) ? Math.max(0, Math.min(2, Math.floor(x.level))) : 0
  const remaining = level < 2 && typeof x.remaining === 'number' && Number.isFinite(x.remaining) ? Math.max(0.05, Math.min(level === 0 ? 20 : 35, x.remaining)) : null
  return { level, remaining }
}
export function nextUpgrade(b: Building) {
  if (!Object.hasOwn(UPGRADE_TYPES, b.type) || upgradeLevel(b) >= 2) return null
  const def = UPGRADE_TYPES[b.type as keyof typeof UPGRADE_TYPES], tier = upgradeLevel(b) + 1
  return { ...def, tier, age: tier, faith: tier * 25, wood: def.wood * tier, stone: def.stone * tier, seconds: tier === 1 ? 20 : 35 }
}
export function upgradeBlock(s: GameState, b: Building): string | null {
  if (!s.started || s.gameOver) return 'Begin a living world first.'
  if (s.photoMode) return 'Exit photo mode to upgrade.'
  if (b.progress < 1) return 'Finish construction first.'
  if (b.hp <= 0) return 'This building has been destroyed.'
  if (b.burning > 0) return 'Extinguish the fire with Rain first.'
  if (b.upgrade?.remaining != null) return 'An improvement is already underway.'
  const next = nextUpgrade(b)
  if (!next) return Object.hasOwn(UPGRADE_TYPES, b.type) ? 'Fully improved: tier 2.' : 'This building has no village upgrades.'
  if (s.ageIndex < next.age) return `Requires civilization age ${next.age + 1}.`
  if (s.faith < next.faith || s.wood < next.wood || s.stone < next.stone) return `Needs ${next.faith} faith, ${next.wood} timber and ${next.stone} stone.`
  return null
}
export function beginUpgrade(s: GameState, id: number): { ok: boolean; message: string } {
  const b = s.buildings.find(b => b.id === id)
  if (!b) return { ok: false, message: 'That building no longer exists.' }
  const blocked = upgradeBlock(s, b)
  if (blocked) return { ok: false, message: blocked }
  const next = nextUpgrade(b)!
  s.faith -= next.faith; s.wood -= next.wood; s.stone -= next.stone
  b.upgrade = { level: upgradeLevel(b), remaining: next.seconds }
  return { ok: true, message: `${next.name} tier ${next.tier} begins. ${next.seconds}s; resources paid up front.` }
}
export function tickUpgrades(s: GameState, dt: number, completed: (b: Building) => void) {
  for (const b of s.buildings) {
    if (!b.upgrade || b.upgrade.remaining === null || b.burning > 0 || b.hp <= 0 || b.progress < 1) continue
    b.upgrade.remaining = Math.max(0, b.upgrade.remaining - dt)
    if (b.upgrade.remaining === 0) { b.upgrade.level = Math.min(2, b.upgrade.level + 1); b.upgrade.remaining = null; completed(b) }
  }
}
export function housingCapacity(b: Building) { return b.type === 'house' && b.progress >= 1 ? 3 + upgradeLevel(b) * 2 : 0 }
export function farmGrowthMultiplier(b: Building) { return b.type === 'farm' ? 1 + upgradeLevel(b) * 0.2 : 1 }
export function wellIrrigation(b: Building) { return { range: 2.2 + upgradeLevel(b) * 0.4, moisture: 0.05 + upgradeLevel(b) * 0.015 } }

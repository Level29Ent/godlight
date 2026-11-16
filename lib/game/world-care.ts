import { BUILD_COST, type Building, type Follower, type GameState } from './store'
import { identity } from './living'

export type Inspection = { kind: 'follower' | 'building'; id: number } | null
export interface CareIssue {
  key: string; title: string; advice: string; count: number
  target: { kind: 'follower' | 'building' | 'colony'; id: number }
}
export function followerNeed(s: GameState, f: Follower): string {
  if (f.burning > 0) return 'On fire — send Rain now.'
  if (f.hp < 50) return 'Injured — use Blessing when unlocked.'
  if (f.lost) return 'Lost — use Sunlight to guide them.'
  if (f.scared > 0) return 'Frightened — remove nearby threats.'
  const prayer = s.living.prayers.find(p => p.followerId === f.id)
  if (prayer) return prayer.kind === 'work' ? 'Wants a task — tether them to work.' : prayer.kind === 'rain' ? 'Asking for farm rain.' : 'Asking for Sunlight.'
  if (f.happiness < 40) return 'Unhappy — brief Sunlight, water and monuments help.'
  if (!f.job && f.taskId === null && f.state === 'idle') return 'Available for a task.'
  return 'No urgent need.'
}
export function constructionDetails(s: GameState, b: Building) {
  const remaining = Math.max(0, Math.min(1, 1 - b.progress)), cost = BUILD_COST[b.type]
  const wood = cost.wood * remaining, stone = cost.stone * remaining
  const assigned = s.followers.filter(f => !f.lost && (f.job?.kind === 'build' && f.job.targetId === b.id || !f.job && f.taskId === b.id && (f.state === 'build' || f.state === 'wander'))).length
  return { progress: Math.round(b.progress * 100), assigned, wood: Math.ceil(wood), stone: Math.ceil(stone), missingWood: Math.ceil(Math.max(0, wood - s.wood)), missingStone: Math.ceil(Math.max(0, stone - s.stone)), burning: b.burning > 0 }
}
export function worldIssues(s: GameState): CareIssue[] {
  const issues: CareIssue[] = []
  const add = (key: string, title: string, advice: string, targets: { kind: 'follower' | 'building' | 'colony'; id: number }[]) => {
    if (targets.length) issues.push({ key, title, advice, count: targets.length, target: targets[0] })
  }
  add('fire', 'Fires', 'Use Rain to extinguish fires before they spread.', [...s.followers.filter(f => f.burning > 0).map(f => ({ kind: 'follower' as const, id: f.id })), ...s.buildings.filter(b => b.burning > 0).map(b => ({ kind: 'building' as const, id: b.id }))])
  add('dry', 'Dry farms', 'Rain or nearby wells replenish moisture.', s.buildings.filter(b => b.type === 'farm' && b.progress >= 1 && b.moisture < 0.25).map(b => ({ kind: 'building', id: b.id })))
  add('construction', 'Unfinished buildings', 'Inspect missing materials and tether followers to the site.', s.buildings.filter(b => b.progress < 1).map(b => ({ kind: 'building', id: b.id })))
  add('unhappy', 'Unhappy followers', 'Warm them briefly. Holding Sun too long can start fires.', s.followers.filter(f => !f.lost && f.happiness < 40).map(f => ({ kind: 'follower', id: f.id })))
  add('idle', 'Idle followers', 'Assign a job with Touch, or let them choose their own work.', s.followers.filter(f => !f.lost && !f.job && f.taskId === null && f.state === 'idle').map(f => ({ kind: 'follower', id: f.id })))
  add('colonies', 'Threatened colonies', 'Visit to repair, build defenses or smite dinosaurs.', s.cosmos.colonies.flatMap((p, i) => p.stage === 'settled' && (p.surface.integrity < 60 || p.surface.dinosaurs.some(d => d.hp > 0)) ? [{ kind: 'colony' as const, id: i }] : []))
  return issues
}
export function followerMemories(s: GameState, id: number) { return s.chronicle.entries.filter(e => e.followerId === id).slice(-3).reverse() }
export function inspectionTitle(s: GameState, selection: Inspection) {
  if (!selection) return null
  if (selection.kind === 'follower') return s.followers.some(f => f.id === selection.id) ? identity(selection.id).name : null
  return s.buildings.find(b => b.id === selection.id)?.type ?? null
}

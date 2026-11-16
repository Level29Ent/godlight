import type { GameState, Follower } from './store'
import type { Tool } from './config'
import { Vector3 } from 'three'

export const TRAITS = ['devout', 'industrious', 'gentle', 'bold'] as const
const NAMES = ['Asha', 'Milo', 'Nia', 'Rowan', 'Sora', 'Amari', 'Lumi', 'Theo', 'Zuri', 'Ivo', 'Esme', 'Koa']
export function traitOf(id: number) { return TRAITS[Math.abs(Math.trunc(id)) % TRAITS.length] }
export function identity(id: number) {
  const n = Math.abs(Math.trunc(id))
  return { name: `${NAMES[n % NAMES.length]} ${Math.floor(n / NAMES.length) + 1}`, trait: traitOf(n) }
}
export function disposition(alignment: number) { return alignment >= 25 ? 'benevolent' : alignment <= -25 ? 'dreaded' : 'balanced' }
export function prayerFactor(f: Follower, alignment: number) {
  const trait = traitOf(f.id)
  return (trait === 'devout' ? 1.15 : 1) * (disposition(alignment) === 'dreaded' && trait === 'bold' ? 1.2 : 1)
}
export function moraleDrift(f: Follower, alignment: number) {
  const culture = disposition(alignment)
  return culture === 'benevolent' ? 0.2 : culture === 'dreaded' ? (traitOf(f.id) === 'gentle' ? -0.45 : -0.15) : 0
}
export const SKIES = [
  { name: 'Midnight', color: '#060817', age: 0 },
  { name: 'Twilight', color: '#201536', age: 1 },
  { name: 'Ocean dusk', color: '#082d3b', age: 2 },
] as const
export const STYLES = ['Sunstone', 'Jade', 'Rose quartz'] as const
export interface Living {
  tutorial: number; tutorialHidden: boolean; answered: number; nextPrayer: number
  prayers: { followerId: number; kind: 'warmth' | 'work' | 'rain'; progress: number; expires: number }[]
  combos: string[]; comboCooldown: number
  sky: number; rings: boolean; moon: boolean; style: number
  // Gesture memory is transient: loading a save cannot finish an old combo.
  cast: { tool: Tool; dir: [number, number, number]; seconds: number; time: number } | null
}
export function createLiving(): Living {
  return { tutorial: 0, tutorialHidden: false, answered: 0, nextPrayer: 20, prayers: [], combos: [], comboCooldown: 0, sky: 0, rings: false, moon: false, style: 0, cast: null }
}
const bounded = (v: unknown, max: number, fallback = 0) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : fallback
export function restoreLiving(raw: unknown, age: number, time: number): Living {
  const l = createLiving()
  // Established saves keep their original objective progression and do not farm opening rewards.
  if (!raw || typeof raw !== 'object') return { ...l, tutorial: 5, nextPrayer: time + 20 }
  const x = raw as Partial<Living>
  l.tutorial = Math.floor(bounded(x.tutorial, 5)); l.tutorialHidden = x.tutorialHidden === true
  l.answered = Math.floor(bounded(x.answered, 1e6)); l.nextPrayer = time + 20
  l.sky = Math.floor(bounded(x.sky, Math.min(age, SKIES.length - 1)))
  l.style = Math.floor(bounded(x.style, age >= 2 ? 2 : 0))
  l.rings = x.rings === true && age >= 3; l.moon = x.moon === true && age >= 4
  l.combos = Array.isArray(x.combos) ? [...new Set(x.combos.slice(0, 8).filter(v => v === 'harvest' || v === 'storm'))] : []
  // Requests restart on load instead of trusting stale follower references and deadlines.
  return l
}
export const OPENING = [
  { title: 'First light', text: 'Hold Sunlight over 3 followers. Release before they overheat.', tool: 'sun', reward: 8, done: (s: GameState) => s.stats.blessed.size >= 3 },
  { title: 'Water the fields', text: 'Choose Rain and hold over a completed farm for 3 seconds.', tool: 'rain', reward: 8, done: (s: GameState) => s.stats.farmRain >= 3 },
  { title: 'A helping hand', text: 'Choose Touch. Drag from a follower to a tree or rock to assign work.', tool: 'hand', reward: 8, done: (s: GameState) => s.stats.jobsAssigned >= 1 },
  { title: 'Gather together', text: 'Let workers collect 3 timber or stone. Focus a worker in the Worldbook to find them.', tool: 'hand', reward: 8, done: (s: GameState) => s.stats.woodChopped + s.stats.stoneMined >= 3 },
  { title: 'Room to grow', text: 'Place another house on open land, then tether a follower to finish construction.', tool: 'house', reward: 15, done: (s: GameState) => s.stats.houses >= 2 },
] as const
export const PRAYER_TEXT = { warmth: 'Please warm me with sunlight.', work: 'Let me help. Give me a job.', rain: 'Please send rain to our farm.' }

export function tickLiving(s: GameState, dt: number, tell: (text: string) => void) {
  const l = s.living
  const step = OPENING[l.tutorial]
  if (step?.done(s)) { l.tutorial++; s.faith += step.reward; tell(`${step.title} complete! +${step.reward} faith`) }
  l.prayers = l.prayers.filter(p => {
    const f = s.followers.find(f => f.id === p.followerId && !f.lost)
    if (!f || p.expires < s.time) return false
    if (p.kind === 'work' && f.job) p.progress = 1
    if (p.progress < 1) return true
    l.answered++; s.faith += 6; f.happiness = Math.min(100, f.happiness + 12); f.jump = 0.6
    tell(`${identity(f.id).name}: Thank you for hearing me! +6 faith`)
    return false
  })
  if (s.time >= l.nextPrayer && l.prayers.length < 3) {
    l.nextPrayer = s.time + 45
    const f = s.followers.find(f => !f.lost && !l.prayers.some(p => p.followerId === f.id) && !f.job)
    if (f) {
      const farm = s.buildings.find(b => b.type === 'farm' && b.progress >= 1 && b.moisture < 0.6)
      const kind = farm && l.answered % 3 === 2 ? 'rain' : l.answered % 2 ? 'work' : 'warmth'
      l.prayers.push({ followerId: f.id, kind, progress: 0, expires: s.time + 90 })
    }
  }
  for (const f of s.followers) {
    if (!f.lost) f.happiness = Math.max(0, Math.min(100, f.happiness + moraleDrift(f, s.cosmos.alignment) * dt))
  }
}

const dist = (a: Vector3, b: Vector3) => a.distanceTo(b) * 7
// Called only for successful one-shot casts or active channel frames.
export function livingMiracle(s: GameState, tool: Tool, dir: Vector3, dt: number, tell: (text: string) => void) {
  const l = s.living
  for (const p of l.prayers) {
    const f = s.followers.find(f => f.id === p.followerId)
    if (!f) continue
    if (p.kind === 'warmth' && tool === 'sun' && dist(f.dir, dir) < 1.1) p.progress += dt / 2
    if (p.kind === 'rain' && tool === 'rain' && s.buildings.some(b => b.type === 'farm' && b.progress >= 1 && dist(b.dir, dir) < 1.3)) p.progress += dt / 2
  }
  const last = l.cast
  if (s.time >= l.comboCooldown && last && s.time - last.time <= 12 && dist(new Vector3(...last.dir), dir) < 1.3 && last.tool === 'rain' && last.seconds >= 2) {
    if (tool === 'sun') {
      const farms = s.buildings.filter(b => b.type === 'farm' && b.progress >= 1 && dist(b.dir, dir) < 1.3)
      if (farms.length) {
        for (const b of farms) b.growth = Math.min(0.99, b.growth + 0.3)
        l.comboCooldown = s.time + 30; l.combos = [...new Set([...l.combos, 'harvest'])]
        tell('Miracle combination: Sunshower! Nearby farms gain 30% growth. Cooldown: 30s.')
      }
    } else if (tool === 'lightning') {
      // A storm amplifies the danger to your people as well as invaders.
      for (const f of s.followers) if (dist(f.dir, dir) < 1.8) { f.happiness = Math.max(0, f.happiness - 15); f.scared = Math.max(4, f.scared); f.scareFrom.copy(dir) }
      for (const a of s.aliens) if (dist(a.dir, dir) < 1.8) a.hp = Math.max(0, a.hp - 35)
      l.comboCooldown = s.time + 30; l.combos = [...new Set([...l.combos, 'storm'])]
      tell('Miracle combination: Thunderstorm! Wider alien damage, but nearby followers panic. Cooldown: 30s.')
    }
  }
  const same = last && last.tool === tool && s.time - last.time < 0.2 && dist(new Vector3(...last.dir), dir) < 1.3
  l.cast = { tool, dir: dir.toArray(), seconds: same ? Math.min(10, last.seconds + dt) : dt, time: s.time }
}

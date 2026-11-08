import { createColonySurface, restoreColonySurface, tickColonySurface, COLONY_BUILDINGS, type ColonySurface } from './colony'
import { Vector3 } from 'three'
import { elevation, isBuildable, isLand, PLANET_RADIUS } from './planet'
import type { Follower, GameState } from './store'

export type Direction = [number, number, number]
export type Commandment = 'peace' | 'trial'
export type Weather = 'clear' | 'drought' | 'monsoon' | 'blizzard'
export const BLUEPRINTS = {
  bunker: { name: 'Defensive bunker', wood: 4, stone: 6, age: 0, seconds: 12, faith: 0 },
  pyramid: { name: 'Sun pyramid', wood: 25, stone: 50, age: 1, seconds: 90, faith: 1.5 },
  obelisk: { name: 'Sky obelisk', wood: 18, stone: 40, age: 2, seconds: 75, faith: 2 },
  colosseum: { name: 'Grand colosseum', wood: 50, stone: 70, age: 3, seconds: 120, faith: 3 },
} as const
export type Blueprint = keyof typeof BLUEPRINTS
export const RELICS = [
  { name: 'Ember of Dawn', terrain: 'mountain', age: 1, benefit: '+10% faith generation' },
  { name: 'Tideglass Heart', terrain: 'ocean', age: 3, benefit: '+8 seconds to shields' },
  { name: 'Root of Ages', terrain: 'mountain', age: 1, benefit: '+25% crop growth' },
  { name: 'Choir Pearl', terrain: 'ocean', age: 3, benefit: '+10% faith generation' },
] as const
export const DESTINATIONS = [
  { name: 'Selene', biome: 'Lunar craters', color: '#b8bdcf', wood: 50, stone: 80, faith: 300 },
  { name: 'Aurelia', biome: 'Golden desert', color: '#e3b56d', wood: 70, stone: 100, faith: 450 },
  { name: 'Thalassa', biome: 'Ocean world', color: '#58bdce', wood: 100, stone: 130, faith: 600 },
] as const
export interface CosmicProject { kind: Blueprint; dir: Direction; progress: number; crew: number[] }
export interface Champion { name: string; role: 'prophet' | 'scholar'; dir: Direction; goal: Direction; pulse: number }
export interface CosmicDisaster { kind: 'meteors' | 'flare'; remaining: number; duration: number; targets: Direction[]; resolved: boolean }
export interface Relic { dir: Direction; revealed: boolean; progress: number; crew: number[]; active: boolean }
export interface Colony { surface: ColonySurface; surveyed: boolean; stage: 'unknown' | 'surveyed' | 'launching' | 'settled'; progress: number; population: number; growth: number }
export interface Cosmos {
  activeColony: number | null;
  v: 1; rng: number; alignment: number; commandment: Commandment | null
  weather: { kind: Weather; dir: Direction; remaining: number; next: number }
  ecosystem: number; moisture: number; shield: number; disaster: CosmicDisaster | null; nextDisaster: number
  projects: CosmicProject[]; champions: Champion[]; relics: Relic[]; colonies: Colony[]
  survey: number; history: string[]; averted: number; impacts: number
}
export type CosmosAction =
  | { type: 'shield' } | { type: 'commandment'; choice: Commandment }
  | { type: 'build'; blueprint: Blueprint } | { type: 'champion'; role: Champion['role'] }
  | { type: 'visit'; index: number | null } | { type: 'colony-build'; index: number; kind: keyof typeof COLONY_BUILDINGS } | { type: 'colony-smite'; index: number } | { type: 'colony-repair'; index: number }
  | { type: 'survey' } | { type: 'excavate'; index: number } | { type: 'launch'; index: number }

const unit = (d: Direction) => new Vector3(...d)
const tuple = (d: Vector3) => d.toArray() as Direction
const distance = (a: Direction, b: Vector3) => Math.hypot(a[0] - b.x, a[1] - b.y, a[2] - b.z) * PLANET_RADIUS
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
function random(c: Pick<Cosmos, 'rng'>) { c.rng = (Math.imul(c.rng, 1664525) + 1013904223) >>> 0; return c.rng / 4294967296 }
function direction(c: Pick<Cosmos, 'rng'>) {
  const y = random(c) * 2 - 1, angle = random(c) * Math.PI * 2, r = Math.sqrt(1 - y * y)
  return new Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r)
}
export function createCosmos(seed = Math.floor(Math.random() * 0x100000000)): Cosmos {
  const c: Cosmos = {
    activeColony: null, v: 1, rng: seed >>> 0, alignment: 0, commandment: null,
    weather: { kind: 'clear', dir: [0, 1, 0], remaining: 0, next: 45 },
    ecosystem: 65, moisture: 0.6, shield: 0, disaster: null, nextDisaster: 110,
    projects: [], champions: [], relics: [], colonies: DESTINATIONS.map(() => ({ surface: createColonySurface(), surveyed: false, stage: 'unknown', progress: 0, population: 0, growth: 0 })),
    survey: 0, history: ['A living cosmos awaits your guidance.'], averted: 0, impacts: 0,
  }
  for (const relic of RELICS) {
    let best = new Vector3(0, 1, 0), score = -Infinity
    // Bounded deterministic search. High peaks and deep seas hold different artifacts.
    for (let i = 0; i < 240; i++) {
      const d = direction(c), e = elevation(d), value = relic.terrain === 'ocean' ? -e : e
      if (value > score) { score = value; best = d }
    }
    c.relics.push({ dir: tuple(best), revealed: false, progress: 0, crew: [], active: false })
  }
  return c
}
function journal(c: Cosmos, text: string) { c.history = [...c.history.slice(-7), text] }
function available(s: GameState) {
  const busy = new Set([...s.cosmos.projects.flatMap(p => p.progress < 1 ? p.crew : []), ...s.cosmos.relics.flatMap(r => r.active ? r.crew : [])])
  return s.followers.filter(f => !f.lost && !f.job && f.taskId === null && f.burning === 0 && !busy.has(f.id) && f.id !== s.tether.followerId)
}
function pay(s: GameState, faith: number, wood = 0, stone = 0) {
  if (s.faith < faith || s.wood < wood || s.stone < stone) return false
  s.faith -= faith; s.wood -= wood; s.stone -= stone
  return true
}
function site(s: GameState): Vector3 | null {
  const c = s.cosmos
  const occupied = (d: Vector3) => s.buildings.some(b => b.dir.distanceTo(d) * 7 < 0.9) || c.projects.some(p => distance(p.dir, d) < 1.2)
  const focus = s.viewDir.clone()
  if (isBuildable(focus) && !occupied(focus)) return focus
  for (let i = 0; i < 160; i++) {
    const d = i < 80 ? focus.clone().addScaledVector(direction(c), 0.35).normalize() : direction(c)
    if (isBuildable(d) && !occupied(d)) return d
  }
  return null
}

/** All actions validate gates/resources before mutation. No UI-only unlocks. */
export function actOnCosmos(s: GameState, action: CosmosAction): string {
  const c = s.cosmos
  if (!s.started || s.gameOver) return 'Begin a living world first.'
  if (action.type === 'visit') {
    s.cursor.down = false; s.cursor.pressed = false
    if (action.index === null) { c.activeColony = null; return 'Returned to the home world.' }
    if (!Number.isInteger(action.index) || !c.colonies[action.index]?.surveyed) return 'Survey that world before exploring it.'
    c.activeColony = action.index
    return `Exploring ${DESTINATIONS[action.index].name}. Home continues in real time.`
  }
  if (action.type === 'colony-build' || action.type === 'colony-smite' || action.type === 'colony-repair') {
    const colony = c.colonies[action.index]
    if (!colony || colony.stage !== 'settled') return 'Land settlers before developing this world.'
    const surface = colony.surface
    if (action.type === 'colony-smite') {
      if (!surface.dinosaurs.length) return 'No dinosaurs are attacking this colony.'
      if (!pay(s, 15)) return 'Colony smite costs 15 faith.'
      for (const d of surface.dinosaurs) d.hp -= 45
      return 'Lightning strikes the attacking dinosaurs!'
    }
    if (action.type === 'colony-repair') {
      if (surface.integrity >= 100) return 'The colony is already healthy.'
      if (!pay(s, 10, 0, 5)) return 'Repairs need 10 faith and 5 stone.'
      surface.integrity = Math.min(100, surface.integrity + 40)
      return 'Colony repaired by 40 integrity.'
    }
    const cost = COLONY_BUILDINGS[action.kind]
    if (!Object.hasOwn(COLONY_BUILDINGS, action.kind)) return 'Unknown colony building.'
    if (surface.build) return 'A colony building is already under construction.'
    const count = action.kind === 'farm' ? surface.farms : action.kind === 'habitat' ? surface.habitats : surface.turrets
    if (count >= 6) return 'This colony already has the maximum of that building.'
    if (!pay(s, 0, cost.wood, cost.stone)) return `Needs ${cost.wood} timber and ${cost.stone} stone.`
    surface.build = { kind: action.kind, remaining: cost.seconds }
    return `Colony ${action.kind} construction begins.`
  }
  if (action.type === 'shield') {
    if (!pay(s, 20)) return 'The shield needs 20 faith.'
    c.shield = Math.max(c.shield, 25 + (c.relics[1].progress >= 1 ? 8 : 0))
    journal(c, 'A protective miracle surrounds your world.')
    return 'World shield raised.'
  }
  if (action.type === 'commandment') {
    if (c.commandment) return 'Your stone commandment is permanent for this world.'
    if (action.choice !== 'peace' && action.choice !== 'trial') return 'Unknown commandment.'
    if (!pay(s, 0, 0, 8)) return 'A carved commandment needs 8 stone.'
    c.commandment = action.choice
    c.alignment = action.choice === 'peace' ? 30 : -30
    journal(c, action.choice === 'peace' ? 'The Code of Peace is carved in stone.' : 'Trial by Combat is carved in stone.')
    return 'A new culture takes root. This choice cannot be reversed.'
  }
  if (action.type === 'build') {
    const b = BLUEPRINTS[action.blueprint]
    if (!b) return 'Unknown blueprint.'
    if (s.ageIndex < b.age) return 'This blueprint requires a later civilization age.'
    if (c.projects.some(p => p.kind === action.blueprint)) return 'This blueprint already stands or is under construction.'
    const crew = available(s).slice(0, 2)
    if (!crew.length) return 'Release a follower from assigned work to build.'
    const dir = site(s)
    if (!dir) return 'No open buildable site was found. Turn the planet and try again.'
    if (!pay(s, 0, b.wood, b.stone)) return `Needs ${b.wood} timber and ${b.stone} stone. Assign followers to trees and rocks.`
    c.projects = [...c.projects, { kind: action.blueprint, dir: tuple(dir), progress: 0, crew: crew.map(f => f.id) }]
    journal(c, `Followers start the ${b.name.toLowerCase()}.`)
    return `${b.name} funded. Builders are on their way.`
  }
  if (action.type === 'champion') {
    if (action.role !== 'prophet' && action.role !== 'scholar') return 'Unknown champion role.'
    if (c.champions.some(h => h.role === action.role)) return 'That champion already walks your world.'
    if (s.ageIndex < 1) return 'Champions awaken in the Age of Clay.'
    if (!pay(s, 60)) return 'Calling a champion needs 60 faith.'
    const home = s.followers.find(f => !f.lost)?.dir ?? s.viewDir
    const name = action.role === 'prophet' ? 'Liora Dawnkeeper' : 'Orin Tidewalker'
    c.champions = [...c.champions, { name, role: action.role, dir: tuple(home), goal: tuple(home), pulse: 0 }]
    journal(c, `${name} joins your civilization.`)
    return `${name} has answered your call.`
  }
  if (action.type === 'survey') {
    if (c.survey > 0) return 'A survey is already underway.'
    if (c.relics.every(r => r.revealed) && c.colonies.every(p => p.surveyed)) return 'The nearby cosmos is fully mapped.'
    if (!pay(s, 15)) return 'A survey needs 15 faith.'
    c.survey = 15
    return 'A 15-second celestial survey begins.'
  }
  if (action.type === 'excavate') {
    const r = c.relics[action.index], def = RELICS[action.index]
    if (!r || !def || !r.revealed || r.progress >= 1 || r.active) return 'Select a revealed, unexcavated relic.'
    if (s.ageIndex < def.age) return `This ${def.terrain} expedition needs civilization age ${def.age + 1}.`
    const crew = available(s).slice(0, 2)
    if (!crew.length) return 'Release a follower to join the expedition.'
    if (!pay(s, 0, 8, 4)) return 'An expedition needs 8 timber and 4 stone for climbing or diving equipment.'
    r.active = true; r.crew = crew.map(f => f.id)
    journal(c, `An expedition sets out for ${def.name}.`)
    return 'Expedition outfitted. Champions can accelerate discovery.'
  }
  const p = c.colonies[action.index], d = DESTINATIONS[action.index]
  if (!p || !d || p.stage !== 'surveyed') return 'Survey an unsettled destination first.'
  if (s.ageIndex < 5) return 'Rockets require the Age of Stars (50 followers).'
  const settlers = available(s).slice(-3)
  const homePopulation = s.followers.filter(f => !f.lost).length
  if (homePopulation < 8 || settlers.length < 3) return 'Keep at least 5 followers at home and release 3 settlers from work.'
  if (!pay(s, d.faith, d.wood, d.stone)) return `Needs ${d.faith} faith, ${d.wood} timber and ${d.stone} stone.`
  // Transfer settlers, rather than cloning population between planets.
  const ids = new Set(settlers.map(f => f.id))
  s.followers = s.followers.filter(f => !ids.has(f.id))
  p.stage = 'launching'; p.progress = 0; p.population = 3
  journal(c, `A rocket carrying three settlers departs for ${d.name}.`)
  return `Rocket launched to ${d.name}. Arrival in 30 seconds.`
}

export function releaseCosmicDuty(c: Cosmos, id: number) {
  for (const p of c.projects) p.crew = p.crew.filter(worker => worker !== id)
  for (const r of c.relics) r.crew = r.crew.filter(worker => worker !== id)
}
export function cosmicDuty(c: Cosmos, id: number): { dir: Direction; expedition: boolean } | null {
  const p = c.projects.find(p => p.progress < 1 && p.crew.includes(id))
  if (p) return { dir: p.dir, expedition: false }
  const r = c.relics.find(r => r.active && r.crew.includes(id))
  return r ? { dir: r.dir, expedition: true } : null
}
export function cosmicFaith(c: Cosmos) {
  let rate = 0
  for (const p of c.projects) if (p.progress >= 1) rate += BLUEPRINTS[p.kind].faith
  for (const p of c.colonies) if (p.stage === 'settled') rate += p.population * 0.2 * (p.surface.integrity / 100)
  return rate
}
export function faithMultiplier(c: Cosmos) {
  return (1 + (c.relics[0].progress >= 1 ? 0.1 : 0) + (c.relics[3].progress >= 1 ? 0.1 : 0)) * (c.commandment === 'peace' ? 1.1 : 1) * (c.commandment === 'trial' && c.disaster && !c.disaster.resolved ? 1.3 : 1)
}
export function climateCropFactor(c: Cosmos, dir: Vector3) {
  const local = distance(c.weather.dir, dir) < 6
  const weather = !local ? 1 : c.weather.kind === 'blizzard' ? 0.25 : c.weather.kind === 'drought' ? 0.45 : c.weather.kind === 'monsoon' ? 0.65 : 1
  return weather * (c.relics[2].progress >= 1 ? 1.25 : 1)
}
export function protectedAt(c: Cosmos, dir: Vector3) {
  return c.shield > 0 || c.projects.some(p => p.kind === 'bunker' && p.progress >= 1 && distance(p.dir, dir) < 3)
}
export function alignMiracle(c: Cosmos, good: boolean, strength = 2) { c.alignment = clamp(c.alignment + (good ? strength : -strength), -100, 100) }

export interface CosmicHooks { canReach?: (f: Follower, destination: Direction) => boolean; tell: (text: string) => void; impact: (dir: Vector3, protectedImpact: boolean, kind: 'meteors' | 'flare') => void; death: (f: Follower) => void }

/** Runs at simulation cadence with fixed bounded collections; no network, timers or React writes. */
export function tickCosmos(s: GameState, dt: number, hooks: CosmicHooks) {
  const c = s.cosmos
  if (c.survey > 0) {
    c.survey = Math.max(0, c.survey - dt * (c.champions.some(h => h.role === 'scholar') ? 2 : 1))
    if (!c.survey) {
      const relic = c.relics.find(r => !r.revealed), colony = c.colonies.find(p => !p.surveyed)
      if (relic) relic.revealed = true
      if (colony) { colony.surveyed = true; colony.stage = 'surveyed' }
      journal(c, 'A celestial survey reveals new expedition sites.'); hooks.tell('New relic and orbital survey reports are ready.')
    }
  }
  for (const p of c.projects) {
    if (p.progress >= 1) continue
    p.crew = p.crew.filter(id => s.followers.some(f => f.id === id && !f.lost && (hooks.canReach?.(f, p.dir) ?? true)))
    if (!p.crew.length) p.crew = available(s).filter(f => hooks.canReach?.(f, p.dir) ?? true).slice(0, 2).map(f => f.id)
    const working = s.followers.filter(f => p.crew.includes(f.id) && f.burning === 0 && f.scared <= 0 && distance(p.dir, f.dir) < 0.7).length
    p.progress = Math.min(1, p.progress + working * dt / BLUEPRINTS[p.kind].seconds)
    if (p.progress >= 1) { journal(c, `${BLUEPRINTS[p.kind].name} completed.`); hooks.tell(`${BLUEPRINTS[p.kind].name} completed!`); p.crew = [] }
  }
  for (const [i, r] of c.relics.entries()) {
    if (!r.active) continue
    r.crew = r.crew.filter(id => s.followers.some(f => f.id === id && !f.lost))
    if (!r.crew.length) r.crew = available(s).slice(0, 2).map(f => f.id)
    const workers = s.followers.filter(f => r.crew.includes(f.id) && f.burning === 0 && f.scared <= 0 && distance(r.dir, f.dir) < 0.7).length
    const scholar = c.champions.some(h => h.role === 'scholar' && distance(h.dir, unit(r.dir)) < 2)
    r.progress = Math.min(1, r.progress + dt * (workers + (scholar ? 2 : 0)) / 60)
    if (r.progress >= 1) { r.active = false; r.crew = []; journal(c, `${RELICS[i].name} recovered: ${RELICS[i].benefit}.`); hooks.tell(`${RELICS[i].name} grants a permanent upgrade!`) }
  }
  for (const h of c.champions) {
    const at = unit(h.dir)
    const expedition = c.relics.find(r => r.active)
    if (h.role === 'scholar' && expedition) h.goal = expedition.dir
    else if (distance(h.goal, at) < 0.3) {
      if (h.role === 'prophet' && s.followers.length) h.goal = tuple(s.followers[Math.floor(random(c) * s.followers.length)].dir)
      else {
        for (let i = 0; i < 20; i++) { const d = at.clone().addScaledVector(direction(c), 0.2).normalize(); if (isLand(d)) { h.goal = tuple(d); break } }
      }
    }
    at.lerp(unit(h.goal), Math.min(1, dt * 0.08)).normalize(); h.dir = tuple(at)
    h.pulse -= dt
    if (h.pulse <= 0) {
      h.pulse = 5
      if (h.role === 'prophet') for (const f of s.followers) if (!f.lost && distance(h.dir, f.dir) < 2) { f.happiness = Math.min(100, f.happiness + 8); f.burning = 0; f.hp = Math.min(100, f.hp + 10) }
    }
  }
  for (const [i, p] of c.colonies.entries()) {
    if (p.stage === 'launching') {
      p.progress = Math.min(1, p.progress + dt / 30)
      if (p.progress >= 1) { p.stage = 'settled'; journal(c, `${DESTINATIONS[i].name} colony established.`); hooks.tell(`${DESTINATIONS[i].name}: a new world joins your civilization!`) }
    } else if (p.stage === 'settled') {
      tickColonySurface(p.surface, dt, c.shield > 0, hooks.tell)
      const health = p.surface.integrity / 100
      p.growth += dt * (c.ecosystem > 40 ? 1 : 0.5) * health * (1 + p.surface.farms * 0.2)
      if (p.growth >= 60 && p.population < 6 + p.surface.habitats * 4) { p.population++; p.growth = 0 }
      s.stone += dt * p.population * 0.008 * health
      s.wood += dt * p.population * 0.006 * health * (1 + p.surface.farms * 0.3)
    }
  }
  const w = c.weather
  if (w.kind === 'clear') {
    w.next -= dt
    if (w.next <= 0) {
      w.kind = (['drought', 'monsoon', 'blizzard'] as const)[Math.floor(random(c) * 3)]
      w.remaining = 35 + random(c) * 20; w.dir = tuple(s.viewDir)
      journal(c, `A ${w.kind} sweeps across the world.`); hooks.tell(`${w.kind.toUpperCase()}: watch your farms and followers. Rain counters drought; sunlight counters cold and flooding.`)
    }
  } else {
    w.remaining = Math.max(0, w.remaining - dt)
    const axis = new Vector3(0, 1, 0)
    w.dir = tuple(unit(w.dir).applyAxisAngle(axis, dt * 0.015))
    if (s.cursor.down && s.cursor.dir && distance(w.dir, s.cursor.dir) < 6) {
      if ((w.kind === 'drought' && s.tool === 'rain') || ((w.kind === 'blizzard' || w.kind === 'monsoon') && s.tool === 'sun')) w.remaining = Math.max(0, w.remaining - dt * 4)
    }
    for (const b of s.buildings) if (distance(w.dir, b.dir) < 6 && b.type === 'farm') {
      if (w.kind === 'drought') b.moisture = Math.max(0, b.moisture - dt * 0.06)
      else if (w.kind === 'monsoon') { b.moisture = Math.min(1, b.moisture + dt * 0.1); b.burning = 0 }
    }
    for (const f of [...s.followers]) {
      if (f.lost || distance(w.dir, f.dir) >= 6 || protectedAt(c, f.dir)) continue
      f.happiness = Math.max(0, f.happiness - dt * (w.kind === 'blizzard' ? 2 : 0.8))
      // Only prolonged exposure at very low morale is lethal; intervention has a long warning window.
      if (f.happiness < 10) { f.hp -= dt * 6; if (f.hp <= 0) hooks.death(f) }
    }
    if (w.remaining <= 0) { w.kind = 'clear'; w.next = 55 + random(c) * 40; journal(c, 'Clear skies return.') }
  }
  const tending = s.cursor.down && (s.tool === 'rain' || s.tool === 'blessing' || s.tool === 'grove')
  c.moisture = clamp(c.moisture + dt * (w.kind === 'monsoon' ? 0.007 : w.kind === 'drought' ? -0.009 : (0.6 - c.moisture) * 0.015) + (tending ? dt * 0.01 : 0), 0, 1)
  const healthyTrees = s.trees.filter(t => t.charred === 0 && t.burning === 0).length
  const targetHealth = clamp(20 + Math.min(40, healthyTrees * 0.4) + c.moisture * 35 - (w.kind === 'blizzard' ? 15 : 0), 0, 100)
  c.ecosystem += (targetHealth - c.ecosystem) * Math.min(1, dt * 0.025)

  if (!c.disaster) {
    c.nextDisaster -= dt
    if (c.nextDisaster <= 0) {
      const target = s.buildings.find(b => b.progress >= 1)?.dir ?? s.followers.find(f => !f.lost)?.dir ?? s.viewDir
      const targets: Direction[] = [tuple(target)]
      for (let i = 0; i < 2; i++) targets.push(tuple(target.clone().addScaledVector(direction(c), 0.22).normalize()))
      c.disaster = { kind: random(c) < 0.7 ? 'meteors' : 'flare', remaining: 25, duration: 25, targets, resolved: false }
      journal(c, 'A cosmic threat approaches.'); hooks.tell('COSMIC WARNING: impact in 25 seconds. Raise a 20-faith shield or prepare a bunker!')
    }
  } else {
    const d = c.disaster
    d.remaining -= dt
    if (Math.abs(d.remaining) < 1e-8) d.remaining = 0
    if (!d.resolved && d.remaining <= 0) {
      d.resolved = true
      let protectedCount = 0
      const targets = d.kind === 'flare' ? [tuple(s.viewDir)] : d.targets
      for (const target of targets) {
        const at = unit(target), safe = protectedAt(c, at)
        if (safe) protectedCount++
        hooks.impact(at, safe, d.kind)
        if (d.kind === 'flare' && c.shield <= 0) {
          for (const b of s.buildings) { if (!protectedAt(c, b.dir)) b.moisture = Math.max(0, b.moisture - 0.7) }
          for (const f of s.followers) if (!f.lost && !protectedAt(c, f.dir)) { f.happiness = Math.max(0, f.happiness - 25); f.hp = Math.max(1, f.hp - 30) }
        }
      }
      if (d.kind === 'flare' ? c.shield > 0 : protectedCount === targets.length) { c.averted++; s.faith += 30; journal(c, 'Disaster averted. +30 faith.') }
      else { c.impacts++; c.ecosystem = Math.max(0, c.ecosystem - 12); journal(c, 'The disaster leaves scars on your biosphere.') }
    }
    if (d.remaining <= -3) { c.disaster = null; c.nextDisaster = 150 + random(c) * 100 }
  }
  // Resolve impacts before expiring a shield that covers this simulation interval.
  c.shield = Math.max(0, c.shield - dt)
}

// Optional, versioned save extension; old worlds receive fresh systems without losing progress.
export function restoreCosmos(raw: unknown): Cosmos {
  const fresh = createCosmos()
  if (!raw || typeof raw !== 'object' || (raw as Cosmos).v !== 1) return fresh
  const x = raw as Partial<Cosmos>
  const number = (n: unknown, fallback: number, min: number, max: number) => typeof n === 'number' && Number.isFinite(n) ? clamp(n, min, max) : fallback
  const dir = (d: unknown): Direction => Array.isArray(d) && d.length === 3 && d.every(n => typeof n === 'number' && Number.isFinite(n)) && new Vector3(...d as Direction).lengthSq() > 0 ? tuple(new Vector3(...d as Direction).normalize()) : [0, 1, 0]
  const crew = (ids: unknown) => Array.isArray(ids) ? ids.filter(id => Number.isInteger(id) && id > 0).slice(0, 2) : []
  fresh.rng = number(x.rng, fresh.rng, 0, 0xffffffff) >>> 0
  fresh.alignment = number(x.alignment, 0, -100, 100)
  fresh.commandment = x.commandment === 'peace' || x.commandment === 'trial' ? x.commandment : null
  fresh.ecosystem = number(x.ecosystem, 65, 0, 100); fresh.moisture = number(x.moisture, 0.6, 0, 1)
  fresh.shield = number(x.shield, 0, 0, 33); fresh.nextDisaster = number(x.nextDisaster, 110, 0, 250)
  fresh.averted = number(x.averted, 0, 0, 1e6); fresh.impacts = number(x.impacts, 0, 0, 1e6)
  fresh.survey = number(x.survey, 0, 0, 15)
  if (x.weather && ['clear', 'drought', 'monsoon', 'blizzard'].includes(x.weather.kind)) fresh.weather = { kind: x.weather.kind, dir: dir(x.weather.dir), remaining: number(x.weather.remaining, 0, 0, 60), next: number(x.weather.next, 45, 0, 95) }
  if (Array.isArray(x.projects)) for (const p of x.projects.slice(0, 4)) {
    if (!p || !Object.hasOwn(BLUEPRINTS, p.kind) || fresh.projects.some(existing => existing.kind === p.kind)) continue
    fresh.projects.push({ kind: p.kind, dir: dir(p.dir), progress: number(p.progress, 0, 0, 1), crew: crew(p.crew) })
  }
  if (Array.isArray(x.champions)) for (const h of x.champions.slice(0, 2)) {
    if (!h || (h.role !== 'prophet' && h.role !== 'scholar') || fresh.champions.some(existing => existing.role === h.role)) continue
    fresh.champions.push({ role: h.role, name: h.role === 'prophet' ? 'Liora Dawnkeeper' : 'Orin Tidewalker', dir: dir(h.dir), goal: dir(h.goal), pulse: number(h.pulse, 0, 0, 5) })
  }
  fresh.relics = fresh.relics.map((r, i) => {
    const saved = Array.isArray(x.relics) ? x.relics[i] : null
    return saved ? { ...r, dir: dir(saved.dir), revealed: saved.revealed === true, active: saved.active === true && !(typeof saved.progress === 'number' && saved.progress >= 1), progress: number(saved.progress, 0, 0, 1), crew: crew(saved.crew) } : r
  })
  fresh.colonies = fresh.colonies.map((p, i) => {
    const saved = Array.isArray(x.colonies) ? x.colonies[i] : null
    if (!saved || !['unknown', 'surveyed', 'launching', 'settled'].includes(saved.stage)) return p
    return { surface: restoreColonySurface(saved.surface), surveyed: saved.stage !== 'unknown', stage: saved.stage, progress: number(saved.progress, 0, 0, 1), population: saved.stage === 'settled' || saved.stage === 'launching' ? number(saved.population, 3, 3, 30) : 0, growth: number(saved.growth, 0, 0, 60) }
  })
  fresh.activeColony = typeof x.activeColony === 'number' && Number.isInteger(x.activeColony) && fresh.colonies[x.activeColony]?.surveyed ? x.activeColony : null
  if (x.disaster && ['meteors', 'flare'].includes(x.disaster.kind) && Array.isArray(x.disaster.targets)) fresh.disaster = { kind: x.disaster.kind, remaining: number(x.disaster.remaining, 25, -3, 25), duration: 25, targets: x.disaster.targets.length ? x.disaster.targets.slice(0, 3).map(dir) : [[0, 1, 0]], resolved: x.disaster.resolved === true }
  if (Array.isArray(x.history)) fresh.history = x.history.filter(t => typeof t === 'string').slice(-8).map(t => t.slice(0, 160))
  return fresh
}

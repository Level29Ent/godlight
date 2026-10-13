import { useSyncExternalStore } from 'react'
import { Color, Vector3 } from 'three'
import { AGES, ROBE_COLORS, SKIN_COLORS, TOOL_BY_ID, type Tool } from './config'
import {
  PLANET_RADIUS,
  findStartDir,
  isBuildable,
  isLand,
  randomDirNear,
  randomLandDirNear,
  surfacePoint,
} from './planet'

export type FollowerState = 'idle' | 'wander' | 'pray' | 'build' | 'pilgrim' | 'flee'

export interface Follower {
  id: number
  dir: Vector3
  target: Vector3
  state: FollowerState
  happiness: number
  heat: number
  burning: number
  scared: number
  scareFrom: Vector3
  timer: number
  jump: number
  speed: number
  taskId: number | null
  atTemple: boolean
  sunned: boolean
  robe: Color
  skin: Color
  phase: number
}

export type BuildingType = 'house' | 'farm' | 'temple'

export interface Building {
  id: number
  type: BuildingType
  dir: Vector3
  yaw: number
  progress: number
  hp: number
  burning: number
  moisture: number
  growth: number
  sunned: boolean
  builders: number
}

export interface Tree {
  id: number
  dir: Vector3
  size: number
  kind: 0 | 1
  heat: number
  burning: number
  charred: number
  yaw: number
}

export interface Bolt {
  id: number
  points: [number, number, number][]
  t: number
}

export interface Meteor {
  id: number
  from: Vector3
  to: Vector3
  dir: Vector3
  t: number
  duration: number
}

export interface Shockwave {
  id: number
  pos: Vector3
  normal: Vector3
  t: number
  size: number
}

export interface Ghost {
  pos: Vector3
  up: Vector3
  t: number
}

export interface Message {
  id: number
  text: string
  tone: 'good' | 'bad' | 'info'
  t: number
}

export type ParticleKind = 'faith' | 'ember' | 'spark'
export interface ParticleRequest {
  kind: ParticleKind
  pos: Vector3
  count: number
  spread: number
  up: Vector3
}

export interface GameState {
  started: boolean
  gameOver: boolean
  faith: number
  faithRate: number
  tool: Tool
  followers: Follower[]
  buildings: Building[]
  trees: Tree[]
  bolts: Bolt[]
  meteors: Meteor[]
  shockwaves: Shockwave[]
  ghosts: Ghost[]
  messages: Message[]
  particleQueue: ParticleRequest[]
  cursor: { dir: Vector3 | null; down: boolean; pressed: boolean }
  fearTimer: number
  birthTimer: number
  hintTimer: number
  ageIndex: number
  shake: number
  flash: { pos: Vector3; intensity: number }
  pop: number
  capacity: number
  happiness: number
  harvests: number
  time: number
}

const SUN_RADIUS = 1.1
const RAIN_RADIUS = 1.3
const FOLLOWER_SPEED = 0.55

let nextId = 1
const uid = () => nextId++

export const startDir = findStartDir()

function createState(): GameState {
  return {
    started: false,
    gameOver: false,
    faith: 30,
    faithRate: 0,
    tool: 'sun',
    followers: [],
    buildings: [],
    trees: [],
    bolts: [],
    meteors: [],
    shockwaves: [],
    ghosts: [],
    messages: [],
    particleQueue: [],
    cursor: { dir: null, down: false, pressed: false },
    fearTimer: 0,
    birthTimer: 6,
    hintTimer: 0,
    ageIndex: 0,
    shake: 0,
    flash: { pos: new Vector3(), intensity: 0 },
    pop: 0,
    capacity: 0,
    happiness: 0,
    harvests: 0,
    time: 0,
  }
}

export const state: GameState = createState()

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeFollower(dir: Vector3): Follower {
  return {
    id: uid(),
    dir: dir.clone(),
    target: dir.clone(),
    state: 'idle',
    happiness: 60,
    heat: 0,
    burning: 0,
    scared: 0,
    scareFrom: new Vector3(),
    timer: Math.random() * 2,
    jump: 0,
    speed: FOLLOWER_SPEED * (0.8 + Math.random() * 0.4),
    taskId: null,
    atTemple: false,
    sunned: false,
    robe: new Color(pick(ROBE_COLORS)),
    skin: new Color(pick(SKIN_COLORS)),
    phase: Math.random() * Math.PI * 2,
  }
}

function makeBuilding(type: BuildingType, dir: Vector3, complete = false): Building {
  return {
    id: uid(),
    type,
    dir: dir.clone(),
    yaw: Math.random() * Math.PI * 2,
    progress: complete ? 1 : 0,
    hp: type === 'temple' ? 220 : 100,
    burning: 0,
    moisture: complete ? 0.6 : 0,
    growth: 0,
    sunned: false,
    builders: 0,
  }
}

function makeTree(dir: Vector3, size: number): Tree {
  return {
    id: uid(),
    dir: dir.clone(),
    size,
    kind: Math.random() < 0.55 ? 0 : 1,
    heat: 0,
    burning: 0,
    charred: 0,
    yaw: Math.random() * Math.PI * 2,
  }
}

function populateWorld(s: GameState) {
  const house = makeBuilding('house', startDir, true)
  s.buildings = [house]
  const farmDir = randomLandDirNear(startDir, 0.18, true)
  if (farmDir) s.buildings = [house, makeBuilding('farm', farmDir, true)]

  for (let i = 0; i < 4; i++) {
    const d = randomLandDirNear(startDir, 0.15) ?? startDir
    s.followers.push(makeFollower(d))
  }

  const golden = Math.PI * (3 - Math.sqrt(5))
  const d = new Vector3()
  for (let i = 0; i < 900 && s.trees.length < 110; i++) {
    const y = 1 - (i / 899) * 2
    const r = Math.sqrt(1 - y * y)
    d.set(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r)
    randomDirNear(d, 0.08, d)
    if (!isBuildable(d)) continue
    if (d.distanceTo(startDir) < 0.12) continue
    if (Math.random() < 0.55) continue
    s.trees.push(makeTree(d, 0.5 + Math.random() * 0.5))
  }
}

// ---------- subscription ----------

const listeners = new Set<() => void>()
let lastNotify = 0
let version = 0

export function notify(force = false) {
  const now = performance.now()
  if (!force && now - lastNotify < 120) return
  lastNotify = now
  version++
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useGame<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}

export function useGameVersion() {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  )
}

// ---------- helpers ----------

function surfaceDist(a: Vector3, b: Vector3) {
  return a.distanceTo(b) * PLANET_RADIUS
}

export function say(text: string, tone: Message['tone'] = 'info') {
  state.messages = [...state.messages.slice(-3), { id: uid(), text, tone, t: state.time }]
  notify(true)
}

function emit(kind: ParticleKind, dir: Vector3, count: number, spread = 0.1, lift = 0.2) {
  const pos = surfacePoint(dir, new Vector3(), lift)
  state.particleQueue.push({ kind, pos, count, spread, up: dir.clone() })
}

function killFollower(f: Follower, reason: string, tone: Message['tone'] = 'bad') {
  const i = state.followers.indexOf(f)
  if (i === -1) return
  state.followers.splice(i, 1)
  state.ghosts.push({ pos: surfacePoint(f.dir, new Vector3(), 0.1), up: f.dir.clone(), t: 0 })
  if (reason) say(reason, tone)
}

function scareAround(point: Vector3, radius: number, duration: number) {
  for (const f of state.followers) {
    if (surfaceDist(f.dir, point) < radius) {
      f.scared = duration
      f.scareFrom.copy(point)
      f.taskId = null
    }
  }
}

function igniteTree(t: Tree) {
  if (t.charred > 0 || t.burning > 0) return
  t.burning = 0.001
}

function igniteBuilding(b: Building) {
  if (b.burning > 0) return
  b.burning = 0.001
  say(`Your ${b.type} is on fire! Bring rain!`, 'bad')
}

// ---------- actions ----------

export function setTool(tool: Tool) {
  const info = TOOL_BY_ID[tool]
  if (info.unlockAge > state.ageIndex) {
    say(`${info.label} unlocks in the ${AGES[info.unlockAge].name}.`)
    return
  }
  state.tool = tool
  notify(true)
}

export function startGame() {
  resetGame()
  state.started = true
  say('Your followers await a sign. Shine upon them.', 'good')
}

export function resetGame() {
  const fresh = createState()
  Object.assign(state, fresh)
  populateWorld(state)
  state.started = true
  updateStats()
  notify(true)
}

export function setCursor(dir: Vector3 | null) {
  if (dir) {
    if (state.cursor.dir) state.cursor.dir.copy(dir)
    else state.cursor.dir = dir.clone()
  } else {
    state.cursor.dir = null
  }
}

export function pressCursor(dir: Vector3) {
  setCursor(dir)
  state.cursor.down = true
  state.cursor.pressed = true
}

export function releaseCursor() {
  state.cursor.down = false
}

export function pokeFollower(index: number) {
  const f = state.followers[index]
  if (!f || !state.started) return
  f.happiness = Math.min(100, f.happiness + 10)
  f.jump = 0.6
  state.faith += 1
  emit('faith', f.dir, 6, 0.05, 0.3)
  notify(true)
}

function spend(cost: number) {
  if (state.faith < cost) {
    say(`You need ${cost} faith for that.`)
    return false
  }
  state.faith -= cost
  return true
}

function castLightning(dir: Vector3) {
  if (!spend(TOOL_BY_ID.lightning.cost)) return
  const target = surfacePoint(dir, new Vector3())
  const sky = dir.clone().multiplyScalar(PLANET_RADIUS + 7)
  const tangent = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(dir).normalize()
  sky.addScaledVector(tangent, 1.5)
  const points: [number, number, number][] = []
  const seg = 14
  const p = new Vector3()
  const jitter = new Vector3()
  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    p.lerpVectors(sky, target, t)
    if (i > 0 && i < seg) {
      const amp = Math.sin(t * Math.PI) * 0.45
      jitter.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(amp)
      p.add(jitter)
    }
    points.push([p.x, p.y, p.z])
  }
  state.bolts = [...state.bolts, { id: uid(), points, t: 0 }]
  state.flash.pos.copy(target).addScaledVector(dir, 0.6)
  state.flash.intensity = 60
  state.shake = Math.max(state.shake, 0.15)
  emit('spark', dir, 30, 0.12, 0.05)

  let victim: Follower | null = null
  let best = 0.35
  for (const f of state.followers) {
    const d = surfaceDist(f.dir, dir)
    if (d < best) {
      best = d
      victim = f
    }
  }
  if (victim) killFollower(victim, 'A follower was smitten. The others tremble.')
  for (const t of state.trees) if (surfaceDist(t.dir, dir) < 0.4) igniteTree(t)
  for (const b of state.buildings) if (surfaceDist(b.dir, dir) < 0.4) igniteBuilding(b)

  const witnesses = state.followers.filter((f) => surfaceDist(f.dir, dir) < 2.4).length
  scareAround(dir, 2.4, 2.5)
  if (witnesses > 0) {
    state.fearTimer = Math.max(state.fearTimer, 18)
    if (!victim) say('Thunder! Your followers pray in awe.', 'info')
  }
}

function castMeteor(dir: Vector3) {
  if (!spend(TOOL_BY_ID.meteor.cost)) return
  const to = surfacePoint(dir, new Vector3())
  const axis = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(dir).normalize()
  const from = dir
    .clone()
    .applyAxisAngle(axis, 0.6)
    .multiplyScalar(PLANET_RADIUS + 16)
  state.meteors = [...state.meteors, { id: uid(), from, to, dir: dir.clone(), t: 0, duration: 1.4 }]
  say('The heavens are falling...', 'bad')
}

function meteorImpact(m: Meteor) {
  const dir = m.dir
  state.shockwaves = [...state.shockwaves, { id: uid(), pos: m.to.clone(), normal: dir.clone(), t: 0, size: 2.6 }]
  state.flash.pos.copy(m.to).addScaledVector(dir, 1)
  state.flash.intensity = 160
  state.shake = 0.7
  emit('spark', dir, 140, 0.4, 0.1)
  emit('ember', dir, 80, 0.6, 0.1)

  let killed = 0
  for (const f of [...state.followers]) {
    if (surfaceDist(f.dir, dir) < 0.95) {
      killFollower(f, '')
      killed++
    }
  }
  for (const t of state.trees) if (surfaceDist(t.dir, dir) < 1.5) igniteTree(t)
  for (const b of state.buildings) {
    const d = surfaceDist(b.dir, dir)
    if (d < 1.5) {
      b.hp -= 60 * (1 - d / 1.5)
      igniteBuilding(b)
    }
  }
  scareAround(dir, 4, 3.5)
  state.fearTimer = Math.max(state.fearTimer, 35)
  say(killed > 0 ? `${killed} follower${killed > 1 ? 's' : ''} perished. Fear spreads across the world.` : 'The impact shakes the world. All fear you now.', 'bad')
}

function placeBuilding(type: BuildingType, dir: Vector3) {
  if (!isBuildable(dir)) {
    say(isLand(dir) ? 'The mountains are too steep to build on.' : 'You cannot build on water.')
    return
  }
  for (const b of state.buildings) {
    if (surfaceDist(b.dir, dir) < (type === 'temple' || b.type === 'temple' ? 0.8 : 0.55)) {
      say('Too close to another building.')
      return
    }
  }
  if (!spend(TOOL_BY_ID[type].cost)) return
  state.trees = state.trees.filter((t) => surfaceDist(t.dir, dir) > 0.35)
  state.buildings = [...state.buildings, makeBuilding(type, dir)]
  emit('faith', dir, 10, 0.15, 0.05)
  say(`Your followers begin building a ${type}.`, 'good')
}

// ---------- simulation ----------

const tmpAxis = new Vector3()
const tmpVec = new Vector3()

function moveToward(f: Follower, target: Vector3, speed: number, dt: number, avoidWater: boolean) {
  const angle = f.dir.angleTo(target)
  const step = (speed * dt) / PLANET_RADIUS
  if (angle <= step || angle < 1e-4) {
    f.dir.copy(target)
    return true
  }
  tmpAxis.crossVectors(f.dir, target).normalize()
  tmpVec.copy(f.dir).applyAxisAngle(tmpAxis, step)
  if (avoidWater && !isLand(tmpVec)) return true
  f.dir.copy(tmpVec).normalize()
  return false
}

function setWander(f: Follower, range = 0.3) {
  const d = randomLandDirNear(f.dir, range, false, 10)
  f.target.copy(d ?? f.dir)
  f.state = 'wander'
  f.timer = 4 + Math.random() * 4
}

function decide(f: Follower) {
  const sites = state.buildings.filter((b) => b.progress < 1 && b.burning === 0 && b.builders < 3)
  if (sites.length > 0 && Math.random() < 0.85) {
    let best: Building | null = null
    let bestD = Infinity
    for (const b of sites) {
      const d = f.dir.distanceTo(b.dir)
      if (d < bestD) {
        bestD = d
        best = b
      }
    }
    if (best) {
      f.state = 'build'
      f.taskId = best.id
      best.builders++
      f.target.copy(randomDirNear(best.dir, 0.04))
      return
    }
  }

  const prayChance = state.fearTimer > 0 ? 0.8 : f.happiness > 35 ? 0.45 : 0.1
  if (Math.random() < prayChance) {
    const temples = state.buildings.filter((b) => b.type === 'temple' && b.progress >= 1)
    if (temples.length > 0 && Math.random() < 0.65) {
      const temple = pick(temples)
      f.state = 'pilgrim'
      f.taskId = temple.id
      f.target.copy(randomDirNear(temple.dir, 0.07))
      f.timer = 25
      return
    }
    f.state = 'pray'
    f.timer = 3 + Math.random() * 4
    f.atTemple = false
    return
  }
  setWander(f)
}

function updateFollowers(dt: number) {
  for (const b of state.buildings) b.builders = 0
  for (const f of state.followers) {
    if ((f.state === 'build' || f.state === 'pilgrim') && f.taskId !== null) {
      const b = state.buildings.find((x) => x.id === f.taskId)
      if (b && f.state === 'build') b.builders++
    }
  }

  const embers: Follower[] = []

  for (const f of [...state.followers]) {
    f.heat = Math.max(0, f.heat - (f.sunned ? 0 : 1.6) * dt)
    f.sunned = false
    f.jump = Math.max(0, f.jump - dt)
    f.happiness = Math.max(0, Math.min(100, f.happiness - dt * (state.fearTimer > 0 ? 0.35 : 1.1)))

    if (f.heat > 7 && f.burning === 0) {
      f.burning = 0.001
      say('A follower caught fire under your blazing sun!', 'bad')
    }

    if (f.burning > 0) {
      f.burning += dt
      embers.push(f)
      if (moveToward(f, f.target, f.speed * 2.4, dt, true) || Math.random() < dt) {
        f.target.copy(randomLandDirNear(f.dir, 0.25, false, 6) ?? f.dir)
      }
      if (f.burning > 5) killFollower(f, 'A follower burned to ash.')
      continue
    }

    if (f.scared > 0) {
      f.scared -= dt
      f.state = 'flee'
      tmpVec.copy(f.dir).sub(f.scareFrom)
      if (tmpVec.lengthSq() < 1e-6) tmpVec.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
      f.target.copy(f.dir).addScaledVector(tmpVec.normalize(), 0.3).normalize()
      moveToward(f, f.target, f.speed * 2.6, dt, true)
      if (f.scared <= 0) {
        f.state = 'pray'
        f.timer = 5
        f.atTemple = false
      }
      continue
    }

    f.timer -= dt
    switch (f.state) {
      case 'idle':
        decide(f)
        break
      case 'wander':
        if (moveToward(f, f.target, f.speed, dt, true) || f.timer <= 0) {
          f.state = 'idle'
          f.timer = 0.5 + Math.random()
          f.state = Math.random() < 0.5 ? 'idle' : 'wander'
          if (f.state === 'wander') setWander(f)
        }
        break
      case 'pray':
        if (f.timer <= 0) f.state = 'idle'
        break
      case 'build': {
        const b = state.buildings.find((x) => x.id === f.taskId)
        if (!b || b.progress >= 1 || b.burning > 0) {
          f.state = 'idle'
          f.taskId = null
          break
        }
        if (surfaceDist(f.dir, b.dir) > 0.32) {
          moveToward(f, f.target, f.speed * 1.2, dt, false)
        } else {
          const rate = b.type === 'temple' ? 0.035 : b.type === 'farm' ? 0.18 : 0.1
          b.progress = Math.min(1, b.progress + rate * dt)
          if (Math.random() < dt * 2) emit('spark', b.dir, 1, 0.1, 0.2)
          if (b.progress >= 1) {
            say(`A new ${b.type} stands complete!`, 'good')
            emit('faith', b.dir, 24, 0.2, 0.3)
            notify(true)
          }
        }
        break
      }
      case 'pilgrim': {
        const b = state.buildings.find((x) => x.id === f.taskId)
        if (!b) {
          f.state = 'idle'
          break
        }
        if (moveToward(f, f.target, f.speed * 1.1, dt, false) || f.timer <= 0) {
          f.state = 'pray'
          f.atTemple = surfaceDist(f.dir, b.dir) < 0.6
          f.timer = 6 + Math.random() * 4
        }
        break
      }
      case 'flee':
        f.state = 'idle'
        break
    }
  }

  for (const f of embers) {
    if (Math.random() < dt * 8) emit('ember', f.dir, 1, 0.03, 0.2)
    for (const t of state.trees) if (Math.random() < dt * 0.6 && surfaceDist(t.dir, f.dir) < 0.35) igniteTree(t)
  }
}

function applyCursor(dt: number) {
  const { cursor, tool } = state
  if (!cursor.dir) {
    cursor.pressed = false
    return
  }
  const dir = cursor.dir

  if (cursor.pressed) {
    cursor.pressed = false
    if (tool === 'lightning') castLightning(dir)
    else if (tool === 'meteor') castMeteor(dir)
    else if (tool === 'house' || tool === 'farm' || tool === 'temple') placeBuilding(tool, dir)
  }

  if (!cursor.down) return

  if (tool === 'sun') {
    for (const f of state.followers) {
      if (surfaceDist(f.dir, dir) < SUN_RADIUS) {
        f.happiness = Math.min(100, f.happiness + 16 * dt)
        f.heat += 1.15 * dt
        f.sunned = true
        if (Math.random() < dt * 1.5) emit('faith', f.dir, 1, 0.02, 0.35)
      }
    }
    for (const t of state.trees) {
      if (surfaceDist(t.dir, dir) < SUN_RADIUS * 0.8) {
        t.heat += dt
        if (t.heat > 6) igniteTree(t)
      }
    }
    for (const b of state.buildings) if (surfaceDist(b.dir, dir) < SUN_RADIUS) b.sunned = true
  } else if (tool === 'rain') {
    for (const f of state.followers) {
      if (surfaceDist(f.dir, dir) < RAIN_RADIUS) {
        if (f.burning > 0) {
          f.burning = 0
          f.heat = 0
          f.happiness = Math.min(100, f.happiness + 20)
          say('Saved by the rain!', 'good')
        }
        f.heat = Math.max(0, f.heat - 4 * dt)
        f.happiness = Math.max(0, f.happiness - 1.2 * dt)
      }
    }
    for (const t of state.trees) {
      if (surfaceDist(t.dir, dir) < RAIN_RADIUS) {
        t.burning = 0
        t.heat = 0
        if (t.charred === 0) t.size = Math.min(1.15, t.size + 0.12 * dt)
      }
    }
    for (const b of state.buildings) {
      if (surfaceDist(b.dir, dir) < RAIN_RADIUS) {
        if (b.burning > 0) {
          b.burning = 0
          say(`The fire at your ${b.type} is out.`, 'good')
        }
        if (b.type === 'farm') b.moisture = Math.min(1, b.moisture + 0.45 * dt)
      }
    }
    if (state.trees.length < 170 && Math.random() < dt * 0.9) {
      const d = randomDirNear(dir, RAIN_RADIUS / PLANET_RADIUS)
      if (
        isBuildable(d) &&
        !state.trees.some((t) => surfaceDist(t.dir, d) < 0.28) &&
        !state.buildings.some((b) => surfaceDist(b.dir, d) < 0.4)
      ) {
        state.trees.push(makeTree(d, 0.05))
      }
    }
  }
}

function updateBuildings(dt: number) {
  let changed = false
  for (const b of state.buildings) {
    if (b.burning > 0) {
      b.burning += dt
      b.hp -= 7 * dt
      if (Math.random() < dt * 14) emit('ember', b.dir, 1, 0.12, 0.25)
      for (const t of state.trees) if (Math.random() < dt * 0.25 && surfaceDist(t.dir, b.dir) < 0.6) igniteTree(t)
      for (const o of state.buildings) if (o !== b && Math.random() < dt * 0.08 && surfaceDist(o.dir, b.dir) < 0.75) igniteBuilding(o)
      for (const f of state.followers) {
        if (f.scared <= 0 && surfaceDist(f.dir, b.dir) < 0.45) {
          f.scared = 1.5
          f.scareFrom.copy(b.dir)
        }
      }
    }
    if (b.type === 'farm' && b.progress >= 1) {
      b.moisture = Math.max(0, b.moisture - 0.035 * dt)
      if (b.moisture > 0.05) {
        b.growth += (0.03 + (b.sunned ? 0.11 : 0)) * dt
        if (b.growth >= 1) {
          b.growth = 0
          state.faith += 20
          state.harvests++
          for (const f of state.followers) f.happiness = Math.min(100, f.happiness + 12)
          emit('faith', b.dir, 30, 0.2, 0.15)
          say('Harvest! Your people feast and rejoice. +20 faith', 'good')
        }
      }
    }
    b.sunned = false
    if (b.hp <= 0) changed = true
  }
  if (changed) {
    const destroyed = state.buildings.filter((b) => b.hp <= 0)
    state.buildings = state.buildings.filter((b) => b.hp > 0)
    for (const b of destroyed) {
      emit('ember', b.dir, 30, 0.2, 0.1)
      say(`A ${b.type} was reduced to ashes.`, 'bad')
    }
  }
}

function updateTrees(dt: number) {
  let removed = false
  for (const t of state.trees) {
    if (t.charred > 0) {
      t.charred += dt
      if (t.charred > 25) removed = true
      continue
    }
    t.heat = Math.max(0, t.heat - 0.8 * dt)
    if (t.size < 1) t.size = Math.min(1, t.size + 0.006 * dt)
    if (t.burning > 0) {
      t.burning += dt
      if (Math.random() < dt * 6) emit('ember', t.dir, 1, 0.05, 0.3 * t.size)
      for (const o of state.trees) {
        if (o !== t && o.burning === 0 && o.charred === 0 && Math.random() < dt * 0.35 && surfaceDist(o.dir, t.dir) < 0.6) igniteTree(o)
      }
      for (const b of state.buildings) if (Math.random() < dt * 0.15 && surfaceDist(b.dir, t.dir) < 0.5) igniteBuilding(b)
      for (const f of state.followers) {
        if (surfaceDist(f.dir, t.dir) < 0.4) {
          if (f.scared <= 0) {
            f.scared = 1.2
            f.scareFrom.copy(t.dir)
          }
          if (Math.random() < dt * 0.05) f.burning = 0.001
        }
      }
      if (t.burning > 7) {
        t.burning = 0
        t.charred = 0.001
      }
    }
  }
  if (removed) state.trees = state.trees.filter((t) => t.charred <= 25)
}

function updateEffects(dt: number) {
  if (state.bolts.length) {
    for (const b of state.bolts) b.t += dt
    if (state.bolts.some((b) => b.t > 0.45)) state.bolts = state.bolts.filter((b) => b.t <= 0.45)
  }
  if (state.meteors.length) {
    const landed: Meteor[] = []
    for (const m of state.meteors) {
      m.t += dt
      if (Math.random() < 0.9) state.particleQueue.push({ kind: 'ember', pos: meteorPosition(m), count: 2, spread: 0.15, up: m.dir })
      if (m.t >= m.duration) landed.push(m)
    }
    if (landed.length) {
      state.meteors = state.meteors.filter((m) => !landed.includes(m))
      landed.forEach(meteorImpact)
    }
  }
  if (state.shockwaves.length) {
    for (const s of state.shockwaves) s.t += dt
    if (state.shockwaves.some((s) => s.t > 1.4)) state.shockwaves = state.shockwaves.filter((s) => s.t <= 1.4)
  }
  for (const g of state.ghosts) {
    g.t += dt
    g.pos.addScaledVector(g.up, dt * 0.6)
  }
  if (state.ghosts.some((g) => g.t > 3)) state.ghosts = state.ghosts.filter((g) => g.t <= 3)
  state.flash.intensity *= Math.exp(-dt * 9)
  state.shake = Math.max(0, state.shake - dt * 0.9)
  if (state.messages.length && state.time - state.messages[0].t > 6) {
    state.messages = state.messages.filter((m) => state.time - m.t <= 6)
    notify(true)
  }
}

export function meteorPosition(m: Meteor, out = new Vector3()) {
  const t = Math.min(1, m.t / m.duration)
  return out.lerpVectors(m.from, m.to, t * t)
}

function updateStats() {
  const pop = state.followers.length
  const houses = state.buildings.filter((b) => b.type === 'house' && b.progress >= 1).length
  const temples = state.buildings.filter((b) => b.type === 'temple' && b.progress >= 1).length
  state.pop = pop
  state.capacity = 2 + houses * 3 + temples * 2
  state.happiness = pop ? state.followers.reduce((a, f) => a + f.happiness, 0) / pop : 0
}

function updateEconomy(dt: number) {
  updateStats()
  const fearMult = state.fearTimer > 0 ? 1.8 : 1
  let rate = 0
  for (const f of state.followers) {
    if (f.state === 'pray' && f.burning === 0) {
      const r = (0.35 + (f.happiness / 100) * 1.1) * (f.atTemple ? 2.6 : 1) * fearMult
      rate += r
      if (Math.random() < dt * r * 0.9) emit('faith', f.dir, 1, 0.02, 0.4)
    } else {
      rate += (f.happiness / 100) * 0.12
    }
  }
  state.faithRate = rate
  state.faith += rate * dt
  state.fearTimer = Math.max(0, state.fearTimer - dt)

  state.birthTimer -= dt
  if (state.birthTimer <= 0) {
    if (state.pop > 0 && state.pop < state.capacity && state.happiness > 40) {
      const homes = state.buildings.filter((b) => b.type === 'house' && b.progress >= 1)
      const origin = homes.length ? pick(homes).dir : pick(state.followers).dir
      const d = randomLandDirNear(origin, 0.05) ?? origin
      const baby = makeFollower(d)
      baby.jump = 0.8
      baby.happiness = 75
      state.followers.push(baby)
      emit('faith', d, 16, 0.08, 0.2)
      say('A new follower is born!', 'good')
      state.birthTimer = 6 + state.pop * 0.25
    } else {
      state.birthTimer = 2
      if (state.pop >= state.capacity && state.pop > 0) {
        state.hintTimer -= 2
        if (state.hintTimer <= 0) {
          say('Your people need more homes to grow.')
          state.hintTimer = 30
        }
      } else if (state.happiness <= 40 && state.pop > 0) {
        state.hintTimer -= 2
        if (state.hintTimer <= 0) {
          say('Your followers are glum. Warm them with sunlight.')
          state.hintTimer = 30
        }
      }
    }
  }

  let age = state.ageIndex
  while (age + 1 < AGES.length && state.pop >= AGES[age + 1].pop) age++
  if (age > state.ageIndex) {
    state.ageIndex = age
    const unlocked = Object.values(TOOL_BY_ID).filter((t) => t.unlockAge === age)
    say(
      `Your civilization enters the ${AGES[age].name}!${unlocked.length ? ` ${unlocked.map((u) => u.label).join(', ')} unlocked.` : ''}`,
      'good',
    )
  }

  if (state.pop === 0 && !state.gameOver) {
    state.gameOver = true
    notify(true)
  }
}

export function tick(dt: number) {
  if (!state.started || state.gameOver) return
  state.time += dt
  applyCursor(dt)
  updateFollowers(dt)
  updateBuildings(dt)
  updateTrees(dt)
  updateEffects(dt)
  updateEconomy(dt)
  notify()
}

populateWorld(state)
updateStats()

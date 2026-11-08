import { createLandNavigator } from './navigation'
import { actOnCosmos, createCosmos, restoreCosmos, tickCosmos, cosmicDuty, releaseCosmicDuty, cosmicFaith, faithMultiplier, climateCropFactor, alignMiracle, type Cosmos, type CosmosAction } from './cosmos'
import { useSyncExternalStore } from 'react'
import { Color, Vector3 } from 'three'
import { AGES, ROBE_COLORS, SKIN_COLORS, TOOL_BY_ID, nightAmount, type Tool } from './config'
import { setLoop, setSoundscape, sfx, type SfxName } from './audio'
import { requestNotificationPermission } from './native'
import { OBJECTIVES } from './objectives'
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
  lost: boolean
  hp: number
  job: Job | null
}

export type JobKind = 'chop' | 'mine' | 'farm' | 'build' | 'pray' | 'fight' | 'guard'

export interface Job {
  kind: JobKind
  targetId: number | null
  dir: Vector3
  spot: Vector3
  work: number
  auto?: boolean
}

export type UfoPhase = 'arrive' | 'hover' | 'land' | 'landed' | 'leave'

export interface Ufo {
  id: number
  from: Vector3
  to: Vector3
  dir: Vector3
  phase: UfoPhase
  t: number
  height: number
  hp: number
  hurt: number
  beamTarget: number | null
  beamT: number
  abducted: number
  lonely: number
}

export interface Alien {
  id: number
  ufoId: number
  dir: Vector3
  target: Vector3
  hp: number
  cooldown: number
  hurt: number
  phase: number
}

export interface Zap {
  from: Vector3
  to: Vector3
  t: number
}

export interface TetherPreview {
  kind: JobKind | null
  label: string
}

export interface TetherState {
  followerId: number | null
  dragging: boolean
  preview: TetherPreview | null
}
export type ChallengeKind = 'wildfire' | 'pilgrims' | 'festival' | 'boom' | 'harvest' | 'lumber' | 'masonry' | 'builder' | 'drought' | 'devotion'

export interface Challenge {
  id: number
  kind: ChallengeKind
  title: string
  desc: string
  duration: number
  timeLeft: number
  elapsed: number
  progress: number
  target: number
  reward: number
  dir: Vector3 | null
  base: number
  ids: number[]
  status: 'active' | 'won' | 'lost'
}

export interface Stats {
  blessed: Set<number>
  farmRain: number
  strikes: number
  meteors: number
  doused: number
  treesGrown: number
  farSide: boolean
  houses: number
  temples: number
  farBuildings: number
  groves: number
  wells: number
  blessings: number
  quakes: number
  tornadoes: number
  aliensSlain: number
  ufosDowned: number
  invasionsRepelled: number
  jobsAssigned: number
  woodChopped: number
  stoneMined: number
  bounties: number
  monuments: number
  auroras: number
  nightPrayers: number
}

export type BuildingType = 'house' | 'farm' | 'temple' | 'well' | 'monument'
export type Material = 'wood' | 'stone'

export const BUILD_COST: Record<BuildingType, Record<Material, number>> = {
  house: { wood: 8, stone: 3 },
  farm: { wood: 5, stone: 0 },
  well: { wood: 2, stone: 8 },
  temple: { wood: 14, stone: 14 },
  monument: { wood: 10, stone: 20 },
}

export interface Rock {
  id: number
  dir: Vector3
  size: number
  yaw: number
}

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
  short: Material[]
  warnedAt: number
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

export type ShockwaveTone = 'fire' | 'gold' | 'earth' | 'life'

export interface Shockwave {
  id: number
  pos: Vector3
  normal: Vector3
  t: number
  size: number
  tone: ShockwaveTone
}

export interface Tornado {
  id: number
  dir: Vector3
  target: Vector3
  t: number
  life: number
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

export type ParticleKind = 'faith' | 'ember' | 'spark' | 'leaf' | 'dust'
export interface ParticleRequest {
  kind: ParticleKind
  pos: Vector3
  count: number
  spread: number
  up: Vector3
}

export interface GameState {
  cosmos: Cosmos
  started: boolean
  gameOver: boolean
  faith: number
  faithRate: number
  tool: Tool
  followers: Follower[]
  buildings: Building[]
  trees: Tree[]
  rocks: Rock[]
  bolts: Bolt[]
  meteors: Meteor[]
  shockwaves: Shockwave[]
  tornadoes: Tornado[]
  ghosts: Ghost[]
  messages: Message[]
  particleQueue: ParticleRequest[]
  cursor: { dir: Vector3 | null; down: boolean; pressed: boolean }
  fearTimer: number
  boostTimer: number
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
  viewDir: Vector3
  stats: Stats
  objectiveIndex: number
  challenge: Challenge | null
  challengeTimer: number
  challengesWon: number
  lastChallenge: ChallengeKind | null
  wood: number
  stone: number
  ufos: Ufo[]
  aliens: Alien[]
  zaps: Zap[]
  invasionTimer: number
  tether: TetherState
  auroraTimer: number
  night: number
  wasNight: boolean
}

const SUN_RADIUS = 1.1
const RAIN_RADIUS = 1.3
const FOLLOWER_SPEED = 0.6
export const MAX_TREES = 340

let nextId = 1
const uid = () => nextId++

export const startDir = findStartDir()

function createState(): GameState {
  return {
    cosmos: createCosmos(),
    started: false,
    gameOver: false,
    faith: 30,
    faithRate: 0,
    tool: 'sun',
    followers: [],
    buildings: [],
    trees: [],
    rocks: [],
    bolts: [],
    meteors: [],
    shockwaves: [],
    tornadoes: [],
    ghosts: [],
    messages: [],
    particleQueue: [],
    cursor: { dir: null, down: false, pressed: false },
    fearTimer: 0,
    boostTimer: 0,
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
    viewDir: startDir.clone(),
    stats: {
      blessed: new Set(),
      farmRain: 0,
      strikes: 0,
      meteors: 0,
      doused: 0,
      treesGrown: 0,
      farSide: false,
      houses: 0,
      temples: 0,
      farBuildings: 0,
      groves: 0,
      wells: 0,
      blessings: 0,
      quakes: 0,
      tornadoes: 0,
      aliensSlain: 0,
      ufosDowned: 0,
      invasionsRepelled: 0,
      jobsAssigned: 0,
      woodChopped: 0,
      stoneMined: 0,
      bounties: 0,
      monuments: 0,
      auroras: 0,
      nightPrayers: 0,
    },
    objectiveIndex: 0,
    challenge: null,
    challengeTimer: 60,
    challengesWon: 0,
    lastChallenge: null,
    wood: 10,
    stone: 4,
    ufos: [],
    aliens: [],
    zaps: [],
    invasionTimer: 150,
    tether: { followerId: null, dragging: false, preview: null },
    auroraTimer: 0,
    night: 0,
    wasNight: false,
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
    lost: false,
    hp: 100,
    job: null,
  }
}

export function maxHp(type: BuildingType) {
  return type === 'monument' ? 260 : type === 'temple' ? 220 : type === 'well' ? 140 : 100
}

function makeBuilding(type: BuildingType, dir: Vector3, complete = false): Building {
  return {
    id: uid(),
    type,
    dir: dir.clone(),
    yaw: Math.random() * Math.PI * 2,
    progress: complete ? 1 : 0,
    hp: maxHp(type),
    burning: 0,
    moisture: complete ? 0.6 : 0,
    growth: 0,
    sunned: false,
    builders: 0,
    short: [],
    warnedAt: -Infinity,
  }
}

function makeRock(dir: Vector3, size: number): Rock {
  return { id: uid(), dir: dir.clone(), size, yaw: Math.random() * Math.PI * 2 }
}

function populateRocks(s: GameState) {
  s.rocks = []
  for (let i = 0; i < 4; i++) {
    const d = randomLandDirNear(startDir, 0.3, true)
    if (d && d.distanceTo(startDir) > 0.08) s.rocks.push(makeRock(d, 0.7 + Math.random() * 0.3))
  }
  const golden = Math.PI * (3 - Math.sqrt(5))
  const d = new Vector3()
  for (let i = 0; i < 900 && s.rocks.length < 80; i++) {
    const y = 1 - (i / 899) * 2
    const r = Math.sqrt(1 - y * y)
    d.set(Math.cos(golden * i + 1.7) * r, y, Math.sin(golden * i + 1.7) * r)
    randomDirNear(d, 0.08, d)
    if (!isLand(d) || d.distanceTo(startDir) < 0.09) continue
    if (Math.random() < 0.7) continue
    if (s.buildings.some((b) => b.dir.distanceTo(d) < 0.06)) continue
    s.rocks.push(makeRock(d, 0.55 + Math.random() * 0.45))
  }
}

const MAX_ROCKS = 80

function updateRocks(dt: number) {
  for (const r of state.rocks) if (r.size < 1) r.size = Math.min(1, r.size + 0.004 * dt)
  if (state.rocks.length >= MAX_ROCKS || Math.random() > dt * 0.12) return
  const anchor = state.followers.length > 0 ? pick(state.followers).dir : startDir
  const d = randomLandDirNear(anchor, 0.9, true, 10)
  if (!d) return
  if (state.rocks.some((r) => surfaceDist(r.dir, d) < 0.3)) return
  if (state.buildings.some((b) => surfaceDist(b.dir, d) < 0.45)) return
  state.rocks.push(makeRock(d, 0.35))
  emit('dust', d, 6, 0.05, 0.3)
  notify(true)
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

  for (let i = 0; i < 5; i++) {
    const d = randomLandDirNear(startDir, 0.12) ?? startDir
    s.followers.push(makeFollower(d))
  }

  const golden = Math.PI * (3 - Math.sqrt(5))
  const d = new Vector3()
  for (let i = 0; i < 1800 && s.trees.length < 230; i++) {
    const y = 1 - (i / 1799) * 2
    const r = Math.sqrt(1 - y * y)
    d.set(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r)
    randomDirNear(d, 0.06, d)
    if (!isBuildable(d)) continue
    if (d.distanceTo(startDir) < 0.09) continue
    if (Math.random() < 0.55) continue
    s.trees.push(makeTree(d, 0.5 + Math.random() * 0.5))
  }
  populateRocks(s)
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
  sfx('death')
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
  sfx('ignite')
  say(`Your ${b.type} is on fire! Bring rain!`, 'bad')
}

// ---------- actions ----------

export function setTool(tool: Tool) {
  const info = TOOL_BY_ID[tool]
  if (info.unlockAge > state.ageIndex) {
    say(`${info.label} unlocks in the ${AGES[info.unlockAge].name}.`)
    sfx('error')
    return
  }
  if (state.tool !== tool) sfx('select')
  state.tool = tool
  notify(true)
}

export function startGame() {
  resetGame()
  state.started = true
  sfx('start')
  requestNotificationPermission()
  say('Your followers await a sign. Shine upon them.', 'good')
}

export function grantFaith(amount: number) {
  state.faith += amount
  if (state.followers.length) emit('faith', pick(state.followers).dir, 24, 0.05, 1)
  notify(true)
}

export function grantBoost(seconds: number) {
  state.boostTimer = Math.max(state.boostTimer, 0) + seconds
  notify(true)
}

export function resetGame() {
  const fresh = createState()
  Object.assign(state, fresh)
  populateWorld(state)
  state.started = true
  updateStats()
  notify(true)
}

export function commandCosmos(action: CosmosAction) {
  if (paused) return
  const message = actOnCosmos(state, action)
  say(message)
  notify(true)
}

// ---------- save / load ----------

type V3 = [number, number, number]

export interface SaveData {
  cosmos?: Cosmos
  v: 1
  faith: number
  ageIndex: number
  time: number
  harvests: number
  tool: Tool
  objectiveIndex: number
  challengesWon: number
  challengeTimer: number
  birthTimer: number
  view: V3
  stats: Omit<Stats, 'blessed'> & { blessed: number[] }
  wood?: number
  stone?: number
  rocks?: { d: V3; sz: number; y: number }[]
  invasionTimer?: number
  boostTimer?: number
  auroraTimer?: number
  followers: { id: number; d: V3; h: number; r: string; s: string; sp: number; ph: number; j?: [JobKind, V3] }[]
  buildings: { t: BuildingType; d: V3; y: number; p: number; hp: number; m: number; g: number }[]
  trees: { d: V3; sz: number; k: 0 | 1; c: number; y: number }[]
}

const round = (n: number) => Math.round(n * 1e4) / 1e4
const packV3 = (v: Vector3): V3 => [round(v.x), round(v.y), round(v.z)]
const unpackV3 = (a: unknown) => {
  const arr = Array.isArray(a) ? a : []
  const v = new Vector3(Number(arr[0]) || 0, Number(arr[1]) || 0, Number(arr[2]) || 0)
  return v.lengthSq() > 0 ? v.normalize() : startDir.clone()
}
const num = (n: unknown, fallback = 0) => (typeof n === 'number' && Number.isFinite(n) ? n : fallback)

export function exportSave(): SaveData {
  const s = state
  return {
    v: 1,
    cosmos: structuredClone(s.cosmos),
    faith: round(s.faith),
    ageIndex: s.ageIndex,
    time: round(s.time),
    harvests: s.harvests,
    tool: s.tool,
    objectiveIndex: s.objectiveIndex,
    challengesWon: s.challengesWon,
    challengeTimer: round(Math.max(s.challengeTimer, 20)),
    birthTimer: round(s.birthTimer),
    view: packV3(s.viewDir),
    stats: { ...s.stats, blessed: [...s.stats.blessed] },
    wood: round(s.wood),
    stone: round(s.stone),
    rocks: s.rocks.map((r) => ({ d: packV3(r.dir), sz: round(r.size), y: round(r.yaw) })),
    invasionTimer: round(Math.max(s.invasionTimer, 45)),
    boostTimer: round(s.boostTimer),
    auroraTimer: round(s.auroraTimer),
    followers: s.followers.map((f) => ({
      id: f.id,
      d: packV3(f.dir),
      h: round(f.happiness),
      r: f.robe.getHexString(),
      s: f.skin.getHexString(),
      sp: round(f.speed),
      ph: round(f.phase),
      ...(f.job && f.job.kind !== 'fight' ? { j: [f.job.kind, packV3(f.job.dir)] as [JobKind, V3] } : {}),
    })),
    buildings: s.buildings.map((b) => ({
      t: b.type,
      d: packV3(b.dir),
      y: round(b.yaw),
      p: round(b.progress),
      hp: round(b.hp),
      m: round(b.moisture),
      g: round(b.growth),
    })),
    trees: s.trees.map((t) => ({ d: packV3(t.dir), sz: round(t.size), k: t.kind, c: round(t.charred), y: round(t.yaw) })),
  }
}

const BUILDING_TYPES: BuildingType[] = ['house', 'farm', 'temple', 'well', 'monument']
const JOB_KINDS: JobKind[] = ['chop', 'mine', 'farm', 'build', 'pray', 'fight', 'guard']

export function importSave(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object' || (raw as SaveData).v !== 1) return false
  const data = raw as SaveData
  const fresh = createState()
  Object.assign(state, fresh)

  state.cosmos = restoreCosmos(data.cosmos)
  state.faith = Math.max(0, num(data.faith, 30))
  state.ageIndex = Math.max(0, Math.min(AGES.length - 1, Math.floor(num(data.ageIndex))))
  state.time = num(data.time)
  state.harvests = num(data.harvests)
  state.tool = data.tool in TOOL_BY_ID && TOOL_BY_ID[data.tool].unlockAge <= state.ageIndex ? data.tool : 'sun'
  state.objectiveIndex = Math.max(0, Math.min(OBJECTIVES.length, Math.floor(num(data.objectiveIndex))))
  state.challengesWon = num(data.challengesWon)
  state.challengeTimer = num(data.challengeTimer, 60)
  state.birthTimer = num(data.birthTimer, 6)
  state.viewDir = unpackV3(data.view)
  state.wood = Math.max(0, num(data.wood, 10))
  state.stone = Math.max(0, num(data.stone, 4))
  state.invasionTimer = Math.max(45, num(data.invasionTimer, 150))
  state.boostTimer = Math.max(0, Math.min(3600, num(data.boostTimer)))
  state.auroraTimer = Math.max(0, Math.min(30, num(data.auroraTimer)))
  state.night = nightAmount(state.time)
  state.wasNight = state.night > 0.5

  if (data.stats && typeof data.stats === 'object') {
    for (const key of Object.keys(fresh.stats) as (keyof Stats)[]) {
      if (key === 'blessed') continue
      const v = (data.stats as unknown as Record<string, unknown>)[key]
      ;(state.stats as unknown as Record<string, unknown>)[key] = typeof fresh.stats[key] === 'boolean' ? Boolean(v) : num(v)
    }
    state.stats.blessed = new Set(Array.isArray(data.stats.blessed) ? data.stats.blessed.map(Number) : [])
  }

  let maxId = 0
  state.followers = (Array.isArray(data.followers) ? data.followers : []).map((f) => {
    const follower = makeFollower(unpackV3(f.d))
    if (Number.isInteger(f.id)) follower.id = f.id
    maxId = Math.max(maxId, follower.id)
    follower.happiness = num(f.h, 60)
    if (/^[0-9a-f]{6}$/i.test(String(f.r))) follower.robe.set(`#${f.r}`)
    if (/^[0-9a-f]{6}$/i.test(String(f.s))) follower.skin.set(`#${f.s}`)
    follower.speed = num(f.sp, follower.speed)
    follower.phase = num(f.ph, follower.phase)
    if (Array.isArray(f.j) && JOB_KINDS.includes(f.j[0])) {
      const jobDir = unpackV3(f.j[1])
      follower.job = { kind: f.j[0], targetId: null, dir: jobDir, spot: randomDirNear(jobDir, 0.03), work: 0 }
    }
    return follower
  })
  nextId = Math.max(nextId, maxId + 1)

  state.buildings = (Array.isArray(data.buildings) ? data.buildings : [])
    .filter((b) => BUILDING_TYPES.includes(b.t))
    .map((b) => {
      const building = makeBuilding(b.t, unpackV3(b.d))
      building.yaw = num(b.y)
      building.progress = Math.max(0, Math.min(1, num(b.p, 1)))
      building.hp = Math.max(1, Math.min(maxHp(b.t), num(b.hp, maxHp(b.t))))
      building.moisture = num(b.m)
      building.growth = num(b.g)
      return building
    })

  state.trees = (Array.isArray(data.trees) ? data.trees : []).slice(0, MAX_TREES).map((t) => {
    const tree = makeTree(unpackV3(t.d), num(t.sz, 0.6))
    tree.kind = t.k === 1 ? 1 : 0
    tree.charred = num(t.c)
    tree.yaw = num(t.y)
    return tree
  })

  if (Array.isArray(data.rocks)) {
    state.rocks = data.rocks.slice(0, 120).map((r) => {
      const rock = makeRock(unpackV3(r.d), Math.max(0.25, Math.min(1, num(r.sz, 0.7))))
      rock.yaw = num(r.y)
      return rock
    })
  } else {
    populateRocks(state)
  }

  state.started = true
  updateStats()
  notify(true)
  return true
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
  const t = state.tether
  if (!t.dragging) return
  t.dragging = false
  const f = state.followers.find((x) => x.id === t.followerId)
  const dir = state.cursor.dir
  if (!f) return clearTether()
  if (dir && surfaceDist(dir, f.dir) > 0.4) {
    assignJob(f, dir)
    clearTether()
  }
  notify(true)
}

function clearTether() {
  state.tether = { followerId: null, dragging: false, preview: null }
  notify(true)
}

export function cancelTether() {
  if (state.tether.followerId !== null) clearTether()
}

export function beginTether(index: number) {
  const f = state.followers[index]
  if (!f || !state.started || f.lost) return
  const t = state.tether
  if (t.followerId === f.id && !t.dragging) {
    if (f.job) {
      f.job = null
      f.state = 'idle'
      f.taskId = null
      say('Your follower is free to roam again.')
      sfx('select')
    }
    clearTether()
    return
  }
  state.tether = { followerId: f.id, dragging: true, preview: null }
  f.jump = 0.4
  sfx('tether')
  notify(true)
}

/** Click on the planet while a follower is tethered but not being dragged. Returns true if consumed. */
export function tetherClick(dir: Vector3) {
  const t = state.tether
  if (t.followerId === null || t.dragging) return false
  const f = state.followers.find((x) => x.id === t.followerId)
  if (f) assignJob(f, dir)
  clearTether()
  return true
}

export function pokeFollower(index: number) {
  const f = state.followers[index]
  if (!f || !state.started) return
  if (f.lost) f.heat += 0.6
  f.happiness = Math.min(100, f.happiness + 10)
  f.jump = 0.6
  state.faith += 1
  sfx('poke')
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
  state.stats.strikes++
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
  damageInvaders(dir, 0.9, 999, 70)
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
  state.stats.meteors++
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
  sfx('meteorImpact')
  damageInvaders(dir, 2, 999, 220)
  addShockwave(dir, 2.6, 'fire')
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

function addShockwave(dir: Vector3, size: number, tone: ShockwaveTone) {
  state.shockwaves = [
    ...state.shockwaves,
    { id: uid(), pos: surfacePoint(dir, new Vector3()), normal: dir.clone(), t: 0, size, tone },
  ]
}

const GROVE_RADIUS = 1.3
const BLESSING_RADIUS = 2.2
const QUAKE_RADIUS = 2.6

function castGrove(dir: Vector3) {
  if (!isBuildable(dir)) {
    say(isLand(dir) ? 'Nothing takes root on these peaks.' : 'Seeds sink into the sea. Choose land.')
    return
  }
  if (!spend(TOOL_BY_ID.grove.cost)) return
  let planted = 0
  for (let i = 0; i < 40 && planted < 10 && state.trees.length < MAX_TREES; i++) {
    const d = randomDirNear(dir, GROVE_RADIUS / PLANET_RADIUS)
    if (!isBuildable(d)) continue
    if (state.trees.some((t) => surfaceDist(t.dir, d) < 0.24)) continue
    if (state.buildings.some((b) => surfaceDist(b.dir, d) < 0.38)) continue
    state.trees.push(makeTree(d, 0.25 + Math.random() * 0.25))
    emit('leaf', d, 8, 0.05, 0.1)
    planted++
  }
  state.stats.groves++
  state.stats.treesGrown += planted
  addShockwave(dir, 1.6, 'life')
  emit('leaf', dir, 50, 0.5, 0.15)
  for (const f of state.followers) {
    if (!f.lost && surfaceDist(f.dir, dir) < 2) {
      f.happiness = Math.min(100, f.happiness + 18)
      f.jump = 0.5
    }
  }
  say(planted > 0 ? `A sacred grove of ${planted} trees springs from the earth.` : 'The land here is already lush.', 'good')
}

const BOUNTY_RADIUS = 1.8

function castBounty(dir: Vector3) {
  if (!isLand(dir)) {
    say('Abundance needs soil. Choose land.')
    return
  }
  if (!spend(TOOL_BY_ID.bounty.cost)) return
  state.stats.bounties++
  addShockwave(dir, BOUNTY_RADIUS * 1.1, 'life')
  emit('leaf', dir, 70, 0.6, 0.2)
  emit('faith', dir, 30, 0.5, 0.2)
  let farms = 0
  let revived = 0
  for (const b of state.buildings) {
    if (b.type !== 'farm' || b.progress < 1 || surfaceDist(b.dir, dir) > BOUNTY_RADIUS) continue
    b.moisture = 1
    b.growth = Math.min(0.999, b.growth + 0.65)
    farms++
  }
  for (const t of state.trees) {
    if (surfaceDist(t.dir, dir) > BOUNTY_RADIUS) continue
    if (t.charred > 0 || t.burning > 0) {
      t.charred = 0
      t.burning = 0
      t.heat = 0
      revived++
    }
    t.size = Math.min(1.1, t.size + 0.3)
  }
  for (const f of state.followers) {
    if (!f.lost && surfaceDist(f.dir, dir) < BOUNTY_RADIUS + 0.4) {
      f.happiness = Math.min(100, f.happiness + 10)
      f.jump = 0.4
    }
  }
  const parts = [farms ? `${farms} field${farms > 1 ? 's' : ''} ripen` : '', revived ? `${revived} tree${revived > 1 ? 's' : ''} reborn` : '']
    .filter(Boolean)
    .join(', ')
  say(parts ? `Bounty! ${parts}.` : 'The land blooms with fresh life.', 'good')
}

const AURORA_DURATION = 30

function castAurora() {
  if (!spend(TOOL_BY_ID.aurora.cost)) return
  state.stats.auroras++
  state.auroraTimer = AURORA_DURATION
  for (const f of state.followers) {
    if (f.lost) continue
    f.happiness = Math.min(100, f.happiness + 30)
    f.jump = 0.6
    emit('faith', f.dir, 4, 0.04, 0.5)
  }
  say('An aurora dances across the sky. The whole world rejoices!', 'good')
}

function castBlessing(dir: Vector3) {
  if (!spend(TOOL_BY_ID.blessing.cost)) return
  state.stats.blessings++
  addShockwave(dir, BLESSING_RADIUS * 1.15, 'gold')
  state.flash.pos.copy(surfacePoint(dir, new Vector3(), 1))
  state.flash.intensity = 50
  emit('faith', dir, 120, 0.9, 0.2)
  let healed = 0
  for (const f of state.followers) {
    if (surfaceDist(f.dir, dir) > BLESSING_RADIUS) continue
    if (f.burning > 0) state.stats.doused++
    f.burning = 0
    f.scared = 0
    f.jump = 0.8
    if (f.lost) {
      f.heat = 3
      f.sunned = true
    } else {
      f.heat = 0
      f.happiness = 100
      state.stats.blessed.add(f.id)
    }
    healed++
  }
  for (const b of state.buildings) {
    if (surfaceDist(b.dir, dir) > BLESSING_RADIUS) continue
    if (b.burning > 0) state.stats.doused++
    b.burning = 0
    b.hp = maxHp(b.type)
    if (b.type === 'farm') {
      b.moisture = 1
      b.growth = Math.min(0.95, b.growth + 0.35)
    }
    emit('faith', b.dir, 12, 0.15, 0.3)
  }
  for (const t of state.trees) {
    if (surfaceDist(t.dir, dir) > BLESSING_RADIUS) continue
    if (t.burning > 0) state.stats.doused++
    t.burning = 0
    t.heat = 0
    if (t.charred > 0) {
      t.charred = 0
      t.size = 0.35
      emit('leaf', t.dir, 6, 0.05, 0.2)
    } else {
      t.size = Math.min(1.15, t.size + 0.3)
    }
  }
  state.fearTimer = Math.max(0, state.fearTimer - 10)
  say(healed > 0 ? 'A golden miracle! Your people are renewed.' : 'Divine light washes over the land.', 'good')
}

function castQuake(dir: Vector3) {
  if (!spend(TOOL_BY_ID.quake.cost)) return
  state.stats.quakes++
  state.shake = 1.2
  damageInvaders(dir, QUAKE_RADIUS, 22, 50)
  addShockwave(dir, QUAKE_RADIUS * 1.2, 'earth')
  emit('dust', dir, 160, 1.2, 0.05)
  let toppled = 0
  state.trees = state.trees.filter((t) => {
    const d = surfaceDist(t.dir, dir)
    if (d > QUAKE_RADIUS) return true
    if (Math.random() < 0.25 + 0.6 * (1 - d / QUAKE_RADIUS)) {
      emit('dust', t.dir, 6, 0.08, 0.1)
      emit('leaf', t.dir, 4, 0.08, 0.3 * t.size)
      toppled++
      return false
    }
    return true
  })
  let cracked = 0
  for (const b of state.buildings) {
    const d = surfaceDist(b.dir, dir)
    if (d > QUAKE_RADIUS) continue
    b.hp -= (b.type === 'temple' ? 40 : 70) * (1 - d / QUAKE_RADIUS) + 10
    emit('dust', b.dir, 20, 0.15, 0.1)
    cracked++
  }
  let killed = 0
  for (const f of [...state.followers]) {
    const d = surfaceDist(f.dir, dir)
    if (d < 0.5 && Math.random() < 0.5) {
      killFollower(f, '')
      killed++
    } else if (d < QUAKE_RADIUS) {
      f.jump = 0.4
    }
  }
  scareAround(dir, QUAKE_RADIUS + 1.5, 3)
  state.fearTimer = Math.max(state.fearTimer, 24)
  const parts = [toppled && `${toppled} trees fall`, cracked && `${cracked} buildings crack`, killed && `${killed} swallowed by the earth`].filter(Boolean)
  say(parts.length ? `The ground heaves! ${parts.join(', ')}.` : 'The ground heaves! Your people tremble.', 'bad')
}

function castTornado(dir: Vector3) {
  if (!isLand(dir)) {
    say('Twisters must touch down on land.')
    return
  }
  if (!spend(TOOL_BY_ID.tornado.cost)) return
  state.stats.tornadoes++
  state.tornadoes = [
    ...state.tornadoes,
    { id: uid(), dir: dir.clone(), target: randomDirNear(dir, 0.35), t: 0, life: 13 },
  ]
  addShockwave(dir, 1.2, 'earth')
  emit('dust', dir, 60, 0.4, 0.1)
  scareAround(dir, 3.5, 3)
  state.fearTimer = Math.max(state.fearTimer, 20)
  say('A tornado touches down! Run!', 'bad')
}

const tornadoAxis = new Vector3()

function updateTornadoes(dt: number) {
  if (!state.tornadoes.length) return
  let ended = false
  for (const tw of state.tornadoes) {
    tw.t += dt
    const angle = tw.dir.angleTo(tw.target)
    const step = (1.1 * dt) / PLANET_RADIUS
    if (angle < step + 0.01 || Math.random() < dt * 0.3) {
      tw.target.copy(randomDirNear(tw.dir, 0.4))
    } else {
      tornadoAxis.crossVectors(tw.dir, tw.target).normalize()
      tw.dir.applyAxisAngle(tornadoAxis, step).normalize()
    }
    if (Math.random() < dt * 22) emit('dust', tw.dir, 2, 0.25, 0.05)

    for (const f of [...state.followers]) {
      const d = surfaceDist(f.dir, tw.dir)
      if (d < 0.42) {
        killFollower(f, Math.random() < 0.5 ? 'A follower was swept into the sky!' : '')
      } else if (d < 1.8 && f.scared <= 0) {
        f.scared = 1.5
        f.scareFrom.copy(tw.dir)
        f.taskId = null
      }
    }
    const before = state.trees.length
    state.trees = state.trees.filter((t) => {
      if (surfaceDist(t.dir, tw.dir) < 0.45) {
        emit('leaf', t.dir, 10, 0.1, 0.4)
        emit('dust', t.dir, 4, 0.08, 0.1)
        return false
      }
      return true
    })
    if (state.trees.length !== before) state.shake = Math.max(state.shake, 0.2)
    damageInvaders(tw.dir, 0.5, 999, 0)
    for (const u of state.ufos) {
      if (u.phase === 'landed' && surfaceDist(u.dir, tw.dir) < 0.75) {
        u.hp -= 70 * dt
        u.hurt = 0.15
      }
    }
    for (const b of state.buildings) {
      if (surfaceDist(b.dir, tw.dir) < 0.6) {
        b.hp -= 60 * dt
        if (Math.random() < dt * 10) emit('dust', b.dir, 3, 0.12, 0.2)
      }
    }
    state.fearTimer = Math.max(state.fearTimer, 8)
    if (tw.t >= tw.life) ended = true
  }
  if (ended) {
    for (const tw of state.tornadoes) if (tw.t >= tw.life) emit('dust', tw.dir, 40, 0.4, 0.2)
    state.tornadoes = state.tornadoes.filter((tw) => tw.t < tw.life)
    say('The tornado dissipates.', 'info')
  }
}

function placeBuilding(type: BuildingType, dir: Vector3) {
  if (!isBuildable(dir)) {
    say(isLand(dir) ? 'The mountains are too steep to build on.' : 'You cannot build on water.')
    return
  }
  for (const b of state.buildings) {
    if (surfaceDist(b.dir, dir) < (type === 'temple' || b.type === 'temple' || type === 'monument' || b.type === 'monument' ? 0.8 : 0.55)) {
      say('Too close to another building.')
      return
    }
  }
  if (!spend(TOOL_BY_ID[type].cost)) return
  state.trees = state.trees.filter((t) => surfaceDist(t.dir, dir) > 0.35)
  state.rocks = state.rocks.filter((r) => surfaceDist(r.dir, dir) > 0.35)
  state.buildings = [...state.buildings, makeBuilding(type, dir)]
  emit('faith', dir, 10, 0.15, 0.05)
  say(`Your followers begin building a ${type}. It needs ${costText(BUILD_COST[type])}.`, 'good')
}

// ---------- tether jobs ----------

export const JOB_LABELS: Record<JobKind, string> = {
  chop: 'Chop wood',
  mine: 'Mine stone',
  farm: 'Tend farm',
  build: 'Build',
  pray: 'Pray at temple',
  fight: 'Fight invader',
  guard: 'Stand guard',
}

interface JobPlan {
  kind: JobKind
  targetId: number | null
  dir: Vector3
}

function planJob(dir: Vector3): JobPlan | null {
  for (const a of state.aliens) if (surfaceDist(a.dir, dir) < 0.45) return { kind: 'fight', targetId: a.id, dir: a.dir }
  for (const u of state.ufos) {
    if (u.phase === 'landed' && surfaceDist(u.dir, dir) < 0.7) return { kind: 'fight', targetId: -u.id, dir: u.dir }
  }
  let building: Building | null = null
  let bestB = 0.42
  for (const b of state.buildings) {
    const d = surfaceDist(b.dir, dir)
    if (d < bestB) {
      bestB = d
      building = b
    }
  }
  if (building) {
    if (building.progress < 1) return { kind: 'build', targetId: building.id, dir: building.dir }
    if (building.type === 'temple') return { kind: 'pray', targetId: building.id, dir: building.dir }
    if (building.type === 'farm') return { kind: 'farm', targetId: building.id, dir: building.dir }
    return { kind: 'guard', targetId: null, dir: building.dir }
  }
  let tree: Tree | null = null
  let bestT = 0.38
  for (const t of state.trees) {
    if (t.charred > 0 || t.burning > 0) continue
    const d = surfaceDist(t.dir, dir)
    if (d < bestT) {
      bestT = d
      tree = t
    }
  }
  if (tree) return { kind: 'chop', targetId: tree.id, dir: tree.dir }
  const rock = nearestRock(dir, 0.4)
  if (rock) return { kind: 'mine', targetId: rock.id, dir: rock.dir }
  if (!isLand(dir)) return null
  return { kind: 'guard', targetId: null, dir: dir.clone() }
}

function assignJob(f: Follower, dir: Vector3) {
  const plan = planJob(dir)
  if (!plan) {
    say("Followers can't walk on water.")
    sfx('error')
    return
  }
  if (f.state === 'build' && f.taskId !== null) {
    const b = state.buildings.find((x) => x.id === f.taskId)
    if (b) b.builders = Math.max(0, b.builders - 1)
  }
  releaseCosmicDuty(state.cosmos, f.id)
  f.taskId = null
  f.job = {
    kind: plan.kind,
    targetId: plan.targetId,
    dir: plan.dir.clone(),
    spot: jobSpot(plan.kind, plan.dir),
    work: 0,
  }
  f.state = 'wander'
  f.target.copy(f.job.spot)
  f.happiness = Math.min(100, f.happiness + 4)
  state.stats.jobsAssigned++
  sfx('assign')
  emit('faith', plan.dir, 8, 0.05, 0.2)
  say(`${JOB_LABELS[plan.kind]}: your follower sets off.`, 'good')
}

function jobSpot(kind: JobKind, dir: Vector3) {
  if (kind === 'guard' || kind === 'fight') return dir.clone()
  return randomLandDirNear(dir, kind === 'chop' || kind === 'mine' ? 0.035 : 0.05, false, 12) ?? dir.clone()
}

function nearestRock(dir: Vector3, range: number) {
  let best: Rock | null = null
  let bestD = range
  for (const r of state.rocks) {
    const d = surfaceDist(r.dir, dir)
    if (d < bestD) {
      bestD = d
      best = r
    }
  }
  return best
}

export function costText(cost: Record<Material, number>) {
  const parts: string[] = []
  if (cost.wood > 0) parts.push(`${cost.wood} wood`)
  if (cost.stone > 0) parts.push(`${cost.stone} stone`)
  return parts.join(' + ') || 'nothing'
}

function updateTetherPreview() {
  const t = state.tether
  if (t.followerId === null) return
  const f = state.followers.find((x) => x.id === t.followerId)
  if (!f) {
    state.tether = { followerId: null, dragging: false, preview: null }
    notify(true)
    return
  }
  const dir = state.cursor.dir
  let next: TetherPreview | null = null
  if (dir && surfaceDist(dir, f.dir) > 0.4) {
    const plan = planJob(dir)
    next = plan ? { kind: plan.kind, label: JOB_LABELS[plan.kind] } : { kind: null, label: 'Water — blocked' }
  }
  if (next?.label !== t.preview?.label) {
    t.preview = next
    notify(true)
  }
}

function buildRate(b: Building) {
  return b.type === 'temple' ? 0.035 : b.type === 'farm' ? 0.18 : 0.1
}

function advanceConstruction(b: Building, rate: number, dt: number) {
  const want = Math.min(1 - b.progress, rate * dt)
  if (want <= 0) return false
  const cost = BUILD_COST[b.type]
  const short: Material[] = []
  let fraction = 1
  for (const m of ['wood', 'stone'] as Material[]) {
    if (cost[m] <= 0) continue
    const needed = cost[m] * want
    if (state[m] < needed) {
      short.push(m)
      fraction = Math.min(fraction, state[m] / needed)
    }
  }
  const wasShort = b.short.length > 0
  if (short.join() !== b.short.join()) {
    b.short = short
    notify(true)
  }
  if (short.length > 0 && !wasShort && state.time - b.warnedAt > 25) {
    b.warnedAt = state.time
    const where = short.map((m) => (m === 'wood' ? 'trees' : 'rocks')).join(' and ')
    say(`The ${b.type} needs more ${short.join(' and ')}. Tether followers to ${where}.`, 'bad')
    sfx('error')
  }
  const delta = want * Math.max(0, fraction)
  if (delta <= 0) return false
  state.wood = Math.max(0, state.wood - cost.wood * delta)
  state.stone = Math.max(0, state.stone - cost.stone * delta)
  b.progress = Math.min(1, b.progress + delta)
  if (b.progress > 0.9999) b.progress = 1
  if (Math.random() < dt * 2) emit('spark', b.dir, 1, 0.1, 0.2)
  if (b.progress >= 1) {
    b.short = []
    say(`A new ${b.type} stands complete!`, 'good')
    sfx('complete')
    emit('faith', b.dir, 24, 0.2, 0.3)
    notify(true)
  }
  return true
}

function endJob(f: Follower, message?: string) {
  const auto = f.job?.auto
  f.job = null
  f.state = 'idle'
  f.timer = 0.5
  if (message && !auto) say(message)
  notify(true)
}

function nearestAlien(dir: Vector3, range: number) {
  let best: Alien | null = null
  let bestD = range
  for (const a of state.aliens) {
    const d = surfaceDist(a.dir, dir)
    if (d < bestD) {
      bestD = d
      best = a
    }
  }
  return best
}

function strike(f: Follower, job: Job, dt: number, targetDir: Vector3, hit: () => void) {
  f.target.copy(targetDir)
  if (surfaceDist(f.dir, targetDir) > 0.2) {
    f.state = 'wander'
    if (moveToward(f, targetDir, f.speed * 1.6, dt) && surfaceDist(f.dir, targetDir) > 0.2) {
      endJob(f, 'No dry route to that opponent. Your follower returns to other work.')
    }
    return
  }
  f.state = 'build'
  job.work += dt
  if (job.work >= 0.7) {
    job.work = 0
    f.jump = 0.3
    hit()
  }
}

function runJob(f: Follower, dt: number) {
  const job = f.job!

  if (job.kind === 'fight' || job.kind === 'guard') {
    let foe: Alien | null = null
    if (job.kind === 'fight' && job.targetId !== null && job.targetId > 0) {
      foe = state.aliens.find((a) => a.id === job.targetId) ?? null
    }
    if (!foe) foe = nearestAlien(job.kind === 'guard' ? job.dir : f.dir, job.kind === 'guard' ? 1.4 : 2.2)
    if (foe) {
      const target = foe
      strike(f, job, dt, target.dir, () => hurtAlien(target, 12))
      return
    }
    if (job.kind === 'fight' && job.targetId !== null && job.targetId < 0) {
      const ufo = state.ufos.find((u) => u.id === -job.targetId! && u.phase === 'landed')
      if (ufo) {
        strike(f, job, dt, ufo.dir, () => {
          ufo.hp -= 8
          ufo.hurt = 0.15
          sfx('alienHit')
        })
        return
      }
    }
    if (job.kind === 'fight') {
      job.kind = 'guard'
      job.targetId = null
      job.dir.copy(f.dir)
      job.spot.copy(f.dir)
      return
    }
    if (surfaceDist(f.dir, job.spot) > 0.06) {
      f.state = 'wander'
      f.target.copy(job.spot)
      if (moveToward(f, job.spot, f.speed * 1.2, dt) && surfaceDist(f.dir, job.spot) > 0.2) job.spot.copy(f.dir)
    } else {
      f.state = 'idle'
    }
    return
  }

  if (surfaceDist(f.dir, job.spot) > 0.06) {
    f.state = 'wander'
    f.target.copy(job.spot)
    if (moveToward(f, job.spot, f.speed * 1.25, dt) && surfaceDist(f.dir, job.spot) > 0.25) {
      endJob(f, "Your follower couldn't find a dry path there.")
    }
    return
  }
  f.target.copy(job.dir)

  switch (job.kind) {
    case 'chop': {
      const tree = state.trees.find((t) => t.id === job.targetId)
      if (!tree || tree.burning > 0 || tree.charred > 0) {
        const next = state.trees.find((t) => t.burning === 0 && t.charred === 0 && surfaceDist(t.dir, job.dir) < 1.4)
        if (!next) return endJob(f, 'No more trees nearby to chop.')
        job.targetId = next.id
        job.dir.copy(next.dir)
        job.spot.copy(jobSpot('chop', next.dir))
        return
      }
      f.state = 'build'
      job.work += dt
      if (job.work >= 1.2) {
        job.work = 0
        sfx('chop')
        emit('leaf', tree.dir, 4, 0.05, 0.4)
        tree.size -= 0.12
        if (tree.size < 0.3) {
          state.trees.splice(state.trees.indexOf(tree), 1)
          state.wood += 3
          state.stats.woodChopped += 3
          if (!job.auto) say('Timber! +3 wood', 'good')
          notify(true)
        } else {
          state.wood += 1
          state.stats.woodChopped++
        }
        if (job.auto && neededMaterial() !== 'wood') return endJob(f)
      }
      return
    }
    case 'build': {
      const b = state.buildings.find((x) => x.id === job.targetId)
      if (!b || b.progress >= 1) return endJob(f)
      if (b.burning > 0) return
      if (advanceConstruction(b, buildRate(b) * 2, dt)) {
        f.state = 'build'
        if (Math.random() < dt * 1.2) sfx('build')
      } else {
        f.state = 'idle'
      }
      return
    }
    case 'mine': {
      let rock = state.rocks.find((r) => r.id === job.targetId)
      if (!rock) {
        const next = nearestRock(job.dir, 1.6)
        if (!next) return endJob(f, 'No more stone nearby to mine.')
        job.targetId = next.id
        job.dir.copy(next.dir)
        job.spot.copy(jobSpot('mine', next.dir))
        return
      }
      f.state = 'build'
      job.work += dt
      if (job.work >= 1.4) {
        job.work = 0
        sfx('chop')
        emit('dust', rock.dir, 5, 0.05, 0.3)
        rock.size -= 0.14
        state.stone += 1
        state.stats.stoneMined++
        if (rock.size < 0.25) {
          state.rocks.splice(state.rocks.indexOf(rock), 1)
          rock = undefined
          state.stone += 2
          state.stats.stoneMined += 2
          if (!job.auto) say('The rock is quarried! +2 stone', 'good')
          notify(true)
        }
        if (job.auto && neededMaterial() !== 'stone') return endJob(f)
      }
      return
    }
    case 'farm': {
      const b = state.buildings.find((x) => x.id === job.targetId)
      if (!b) return endJob(f, 'The farm is gone.')
      f.state = 'build'
      b.growth += 0.025 * dt
      b.moisture = Math.min(1, b.moisture + 0.01 * dt)
      f.happiness = Math.min(100, f.happiness + 0.5 * dt)
      return
    }
    case 'pray': {
      const b = state.buildings.find((x) => x.id === job.targetId)
      if (!b) return endJob(f, 'The temple is gone.')
      f.state = 'pray'
      f.atTemple = true
      state.faith += 0.35 * dt
      f.happiness = Math.min(100, f.happiness + 1.5 * dt)
      if (Math.random() < dt) emit('faith', f.dir, 1, 0.02, 0.4)
      return
    }
  }
}

// ---------- invaders ----------

const UFO_HP = 140
const ALIEN_HP = 30
let invasionActive = false

function hurtAlien(a: Alien, amount: number) {
  a.hp -= amount
  a.hurt = 0.15
  sfx('alienHit')
}

function damageInvaders(dir: Vector3, radius: number, alienDamage: number, ufoDamage: number) {
  for (const a of state.aliens) {
    if (surfaceDist(a.dir, dir) < radius) {
      a.hp -= alienDamage
      a.hurt = 0.2
    }
  }
  if (ufoDamage <= 0) return
  for (const u of state.ufos) {
    if (u.height < 6 && surfaceDist(u.dir, dir) < radius + 0.4) {
      u.hp -= ufoDamage
      u.hurt = 0.25
    }
  }
}

function villageCenter() {
  const c = new Vector3()
  for (const f of state.followers) if (!f.lost) c.add(f.dir)
  return c.lengthSq() > 0 ? c.normalize() : state.viewDir.clone()
}

function launchInvasion() {
  const center = villageCenter()
  const count = 1 + Math.min(2, Math.floor(state.ageIndex / 2))
  for (let i = 0; i < count; i++) {
    const to = randomLandDirNear(center, 0.22, true, 40) ?? randomLandDirNear(center, 0.4, false, 40)
    if (!to) continue
    const from = randomDirNear(to, 0.9)
    state.ufos.push({
      id: uid(),
      from,
      to,
      dir: from.clone(),
      phase: 'arrive',
      t: -i * 1.5,
      height: 28,
      hp: UFO_HP,
      hurt: 0,
      beamTarget: null,
      beamT: 0,
      abducted: 0,
      lonely: 0,
    })
  }
  if (!state.ufos.length) return
  invasionActive = true
  state.shake = Math.max(state.shake, 0.3)
  sfx('ufoArrive')
  say(count > 1 ? `${count} UFOs approach! Smite them before they land!` : 'A UFO approaches! Smite it before it lands!', 'bad')
}

function spawnAliens(u: Ufo) {
  const n = 2 + Math.min(3, state.ageIndex)
  for (let i = 0; i < n; i++) {
    const d = randomLandDirNear(u.dir, 0.06, false, 15) ?? u.dir.clone()
    state.aliens.push({
      id: uid(),
      ufoId: u.id,
      dir: d,
      target: d.clone(),
      hp: ALIEN_HP,
      cooldown: 1 + Math.random(),
      hurt: 0,
      phase: Math.random() * Math.PI * 2,
    })
  }
}

function destroyUfo(u: Ufo) {
  sfx('ufoExplode')
  addShockwave(u.dir, 1.6, 'fire')
  emit('ember', u.dir, 60, 0.3, u.height + 0.3)
  emit('spark', u.dir, 40, 0.3, u.height + 0.3)
  state.flash.pos.copy(surfacePoint(u.dir, new Vector3(), u.height + 0.5))
  state.flash.intensity = 90
  state.shake = Math.max(state.shake, 0.6)
  state.stats.ufosDowned++
  state.faith += 25
  say('UFO destroyed! +25 faith', 'good')
  for (const f of state.followers) if (surfaceDist(f.dir, u.dir) < 2.5) f.happiness = Math.min(100, f.happiness + 15)
}

const ufoPos = new Vector3()

function updateUfo(u: Ufo, dt: number) {
  u.t += dt
  u.hurt = Math.max(0, u.hurt - dt)
  if (u.t < 0) return

  switch (u.phase) {
    case 'arrive': {
      const k = Math.min(1, u.t / 5)
      const e = 1 - Math.pow(1 - k, 3)
      u.dir.copy(u.from).lerp(u.to, e).normalize()
      u.height = 28 - 24 * e
      if (k >= 1) {
        u.phase = 'hover'
        u.t = 0
      }
      break
    }
    case 'hover': {
      u.height = 4 + Math.sin(u.t * 2) * 0.15
      if (u.beamTarget === null && u.abducted < 1) {
        let best: Follower | null = null
        let bestD = 1.3
        for (const f of state.followers) {
          const d = surfaceDist(f.dir, u.dir)
          if (d < bestD) {
            bestD = d
            best = f
          }
        }
        if (best) {
          u.beamTarget = best.id
          u.beamT = 0
          sfx('abduct')
        }
      }
      if (u.beamTarget !== null) {
        const f = state.followers.find((x) => x.id === u.beamTarget)
        if (!f) {
          u.beamTarget = null
        } else {
          u.beamT += dt
          f.scared = 1
          f.scareFrom.copy(u.dir)
          f.job = null
          f.dir.lerp(u.dir, Math.min(1, dt * 1.5)).normalize()
          f.jump = Math.max(f.jump, 0.2)
          if (u.beamT > 2.6) {
            u.beamTarget = null
            u.abducted++
            killFollower(f, 'A follower was abducted by the UFO!')
          }
        }
      }
      if (u.t > 5 && u.beamTarget === null) {
        u.phase = 'land'
        u.t = 0
      }
      break
    }
    case 'land':
      u.height = Math.max(0.35, 4 - u.t * 2.4)
      if (u.height <= 0.35) {
        u.phase = 'landed'
        u.t = 0
        sfx('ufoLand')
        addShockwave(u.dir, 1.2, 'earth')
        emit('dust', u.dir, 60, 0.4, 0.1)
        state.shake = Math.max(state.shake, 0.35)
        scareAround(u.dir, 1.6, 3)
        for (const b of state.buildings) {
          if (surfaceDist(b.dir, u.dir) < 0.5) {
            b.hp -= 30
            igniteBuilding(b)
          }
        }
        spawnAliens(u)
        say('The UFO has landed. Invaders pour out!', 'bad')
      }
      break
    case 'landed': {
      u.height = 0.35
      const crew = state.aliens.some((a) => a.ufoId === u.id)
      u.lonely = crew ? 0 : u.lonely + dt
      if (u.lonely > 6 || u.t > 75) {
        u.phase = 'leave'
        u.t = 0
        say(crew ? 'The UFO lifts off, its crew still roaming!' : 'Its crew defeated, the UFO flees into the sky.')
      }
      break
    }
    case 'leave':
      u.height += dt * (2 + u.t * 6)
      break
  }

  if (u.phase !== 'arrive' && Math.random() < dt * 4) {
    emit('spark', u.dir, 1, 0.05, u.height + 0.1)
  }
  void ufoPos
}

function updateAlien(a: Alien, dt: number) {
  a.hurt = Math.max(0, a.hurt - dt)
  a.cooldown -= dt

  let prey: Follower | null = null
  let preyD = 3
  for (const f of state.followers) {
    const d = surfaceDist(f.dir, a.dir)
    if (d < preyD) {
      preyD = d
      prey = f
    }
  }
  let mark: Building | null = null
  let markD = 2.2
  for (const b of state.buildings) {
    if (b.burning > 0) continue
    const d = surfaceDist(b.dir, a.dir)
    if (d < markD) {
      markD = d
      mark = b
    }
  }

  const range = 0.9
  if (prey && preyD < range) {
    if (a.cooldown <= 0) {
      a.cooldown = 1.6 + Math.random() * 0.6
      shoot(a, prey.dir)
      prey.hp -= 34
      prey.scared = Math.max(prey.scared, prey.job ? 0 : 2)
      prey.scareFrom.copy(a.dir)
      prey.happiness = Math.max(0, prey.happiness - 6)
      if (prey.hp <= 0) killFollower(prey, 'A follower was vaporized by an invader!')
    }
    return
  }
  if (mark && markD < range * 0.8 && (!prey || preyD > markD)) {
    if (a.cooldown <= 0) {
      a.cooldown = 2 + Math.random()
      shoot(a, mark.dir)
      mark.hp -= 12
      if (Math.random() < 0.3) igniteBuilding(mark)
    }
    return
  }

  const goal = prey && (!mark || preyD < markD + 0.6) ? prey.dir : mark?.dir
  if (goal) {
    a.target.copy(goal)
  } else if (surfaceDist(a.dir, a.target) < 0.1) {
    a.target.copy(randomLandDirNear(a.dir, 0.2, false, 10) ?? a.dir)
  }
  if (moveToward(a, a.target, 0.55, dt)) {
    a.target.copy(randomLandDirNear(a.dir, 0.15, false, 10) ?? a.dir)
  }
}

function shoot(a: Alien, at: Vector3) {
  state.zaps.push({ from: surfacePoint(a.dir, new Vector3(), 0.25), to: surfacePoint(at, new Vector3(), 0.2), t: 0 })
  sfx('zap')
}

function updateInvaders(dt: number) {
  const villagers = state.followers.filter((f) => !f.lost).length
  if (!state.ufos.length && !state.aliens.length && villagers >= 3 && state.time > 90) {
    state.invasionTimer -= dt
    if (state.invasionTimer <= 0) {
      state.invasionTimer = Math.max(100, 220 - state.ageIndex * 25) + Math.random() * 60
      launchInvasion()
    }
  }

  for (const u of state.ufos) updateUfo(u, dt)
  for (const a of state.aliens) updateAlien(a, dt)

  for (const f of state.followers) {
    if (f.job || f.scared > 0) continue
    const near = nearestAlien(f.dir, 0.8)
    if (near) {
      f.scared = 2
      f.scareFrom.copy(near.dir)
    }
  }

  const beforeAliens = state.aliens.length
  state.aliens = state.aliens.filter((a) => {
    if (a.hp > 0) return true
    sfx('alienDie')
    emit('spark', a.dir, 16, 0.06, 0.2)
    state.stats.aliensSlain++
    state.faith += 4
    return false
  })
  const beforeUfos = state.ufos.length
  state.ufos = state.ufos.filter((u) => {
    if (u.hp <= 0) {
      destroyUfo(u)
      return false
    }
    return !(u.phase === 'leave' && u.height > 30)
  })

  for (const z of state.zaps) z.t += dt
  if (state.zaps.length) state.zaps = state.zaps.filter((z) => z.t < 0.3)

  if (beforeAliens !== state.aliens.length || beforeUfos !== state.ufos.length) notify(true)

  if (invasionActive && !state.ufos.length && !state.aliens.length) {
    invasionActive = false
    state.stats.invasionsRepelled++
    state.faith += 15
    sfx('challengeWon')
    say('The invasion is over! Your people are safe. +15 faith', 'good')
  }
}

export function invasionStatus() {
  if (state.ufos.length || state.aliens.length) {
    return { active: true, ufos: state.ufos.length, aliens: state.aliens.length }
  }
  return { active: false, ufos: 0, aliens: 0, eta: Math.max(0, Math.ceil(state.invasionTimer)) }
}

// ---------- simulation ----------

const tmpAxis = new Vector3()
const tmpVec = new Vector3()
const navigator = createLandNavigator(isLand)

function stepStraight(w: { dir: Vector3 }, goal: Vector3, step: number) {
  const angle = w.dir.angleTo(goal)
  if (angle < 1e-4) return
  tmpAxis.crossVectors(w.dir, goal).normalize()
  w.dir.applyAxisAngle(tmpAxis, Math.min(step, angle)).normalize()
}

function moveToward(w: { dir: Vector3 }, target: Vector3, speed: number, dt: number, _avoidWater = true) {
  return navigator.move(w, target, speed, dt) !== 'moving'
}

function setWander(f: Follower, range = 0.3) {
  const d = randomLandDirNear(f.dir, range, false, 10)
  f.target.copy(d ?? f.dir)
  f.state = 'wander'
  f.timer = 4 + Math.random() * 4
}

function neededMaterial(): Material | null {
  const need: Record<Material, number> = { wood: 0, stone: 0 }
  for (const b of state.buildings) {
    if (b.progress >= 1) continue
    const cost = BUILD_COST[b.type]
    need.wood += cost.wood * (1 - b.progress)
    need.stone += cost.stone * (1 - b.progress)
  }
  const woodGap = need.wood - state.wood
  const stoneGap = need.stone - state.stone
  if (woodGap <= 0 && stoneGap <= 0) {
    if (state.wood < 12) return 'wood'
    if (state.stone < 6) return 'stone'
    return null
  }
  return woodGap / Math.max(1, need.wood) >= stoneGap / Math.max(1, need.stone) ? 'wood' : 'stone'
}

function autoGather(f: Follower, material: Material) {
  let targetId: number | null = null
  let dir: Vector3 | null = null
  if (material === 'wood') {
    let bestD = 1.6
    for (const t of state.trees) {
      if (t.burning > 0 || t.charred > 0 || t.size < 0.5) continue
      const d = surfaceDist(t.dir, f.dir)
      if (d < bestD) {
        bestD = d
        targetId = t.id
        dir = t.dir
      }
    }
  } else {
    const rock = nearestRock(f.dir, 1.8)
    if (rock) {
      targetId = rock.id
      dir = rock.dir
    }
  }
  if (!dir || targetId === null) return false
  const kind: JobKind = material === 'wood' ? 'chop' : 'mine'
  f.taskId = null
  f.job = { kind, targetId, dir: dir.clone(), spot: jobSpot(kind, dir), work: 0, auto: true }
  f.state = 'wander'
  f.target.copy(f.job.spot)
  return true
}

function decide(f: Follower) {
  const gathering = state.followers.filter((o) => o.job?.auto).length
  const material = neededMaterial()
  if (material && gathering < Math.max(2, Math.ceil(state.followers.length * 0.45)) && Math.random() < 0.55) {
    if (autoGather(f, material)) return
  }
  const sites = state.buildings.filter((b) => b.progress < 1 && b.burning === 0 && b.builders < 3 && b.short.length === 0 && !navigator.isUnreachable(f, b.dir))
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

  const prayChance = state.cosmos.commandment === 'peace' ? 0.6 : state.fearTimer > 0 ? 0.8 : f.happiness > 35 ? 0.45 : 0.1
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
    if (f.lost) {
      f.jump = Math.max(0, f.jump - dt)
      if (!f.sunned) f.heat = Math.max(0, f.heat - 0.5 * dt)
      f.sunned = false
      f.state = 'pray'
      if (f.heat > 1.6) {
        f.lost = false
        f.heat = 0
        f.happiness = 85
        f.jump = 0.8
        f.state = 'idle'
        emit('faith', f.dir, 24, 0.06, 0.3)
        say('A lost pilgrim has found faith in you!', 'good')
        sfx('birth')
      }
      continue
    }
    f.heat = Math.max(0, f.heat - (f.sunned ? 0 : 1.6) * dt)
    f.sunned = false
    f.jump = Math.max(0, f.jump - dt)
    f.hp = Math.min(100, f.hp + 4 * dt)
    f.happiness = Math.max(0, Math.min(100, f.happiness - dt * (state.fearTimer > 0 ? 0.35 : 1.1)))

    if (f.heat > 7 && f.burning === 0) {
      f.burning = 0.001
      sfx('ignite')
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

    const duty = cosmicDuty(state.cosmos, f.id)
    const shelter = state.cosmos.disaster && !state.cosmos.disaster.resolved
      ? state.cosmos.projects.find(p => p.kind === 'bunker' && p.progress >= 1 && new Vector3(...p.dir).distanceTo(f.dir) * PLANET_RADIUS < 6)
      : null
    if (duty || shelter) {
      const target = new Vector3(...(duty?.dir ?? shelter!.dir))
      f.target.copy(target)
      f.atTemple = false
      if (surfaceDist(f.dir, target) > 0.4) {
        f.state = 'wander'
        if (duty?.expedition) stepStraight(f, target, dt * f.speed * 2 / PLANET_RADIUS)
        else if (moveToward(f, target, f.speed * 1.8, dt) && surfaceDist(f.dir, target) > 0.4) {
          if (duty) releaseCosmicDuty(state.cosmos, f.id)
          f.state = 'idle'
        }
      } else { f.state = shelter ? 'pray' : 'build' }
      continue
    }
    f.timer -= dt
    if (f.job) {
      runJob(f, dt)
      continue
    }
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
          f.target.copy(b.dir)
          if (moveToward(f, b.dir, f.speed * 1.2, dt) && surfaceDist(f.dir, b.dir) > 0.32) {
            f.taskId = null
            f.state = 'idle'
          }
        } else {
          advanceConstruction(b, buildRate(b), dt)
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

const CAST_SFX: Partial<Record<Tool, SfxName>> = {
  lightning: 'thunder',
  meteor: 'meteorFall',
  grove: 'grove',
  blessing: 'blessing',
  quake: 'quake',
  tornado: 'tornado',
  bounty: 'grove',
  aurora: 'blessing',
  monument: 'build',
  house: 'build',
  farm: 'build',
  temple: 'build',
  well: 'build',
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
    const faithBefore = state.faith
    const castSound = CAST_SFX[tool]
    if (tool === 'lightning') castLightning(dir)
    else if (tool === 'meteor') castMeteor(dir)
    else if (tool === 'grove') castGrove(dir)
    else if (tool === 'blessing') castBlessing(dir)
    else if (tool === 'quake') castQuake(dir)
    else if (tool === 'tornado') castTornado(dir)
    else if (tool === 'bounty') castBounty(dir)
    else if (tool === 'aurora') castAurora()
    else if (tool === 'house' || tool === 'farm' || tool === 'temple' || tool === 'well' || tool === 'monument') placeBuilding(tool, dir)
    if (state.faith < faithBefore) alignMiracle(state.cosmos, !['lightning', 'meteor', 'quake', 'tornado'].includes(tool), 3)
    if (castSound) sfx(state.faith < faithBefore ? castSound : 'error')
  }

  if (!cursor.down) return

  if (tool === 'sun') {
    alignMiracle(state.cosmos, true, dt * 0.15)
    for (const f of state.followers) {
      if (surfaceDist(f.dir, dir) < SUN_RADIUS) {
        if (f.lost) {
          f.heat += 1.15 * dt
          f.sunned = true
          continue
        }
        state.stats.blessed.add(f.id)
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
    for (const a of state.aliens) {
      if (surfaceDist(a.dir, dir) < SUN_RADIUS) {
        a.hp -= 9 * dt
        a.hurt = 0.1
      }
    }
  } else if (tool === 'rain') {
    alignMiracle(state.cosmos, true, dt * 0.15)
    for (const f of state.followers) {
      if (surfaceDist(f.dir, dir) < RAIN_RADIUS) {
        if (f.burning > 0) {
          f.burning = 0
          f.heat = 0
          f.happiness = Math.min(100, f.happiness + 20)
          state.stats.doused++
          say('Saved by the rain!', 'good')
        }
        f.heat = Math.max(0, f.heat - 4 * dt)
        f.happiness = Math.max(0, f.happiness - 1.2 * dt)
      }
    }
    for (const t of state.trees) {
      if (surfaceDist(t.dir, dir) < RAIN_RADIUS) {
        if (t.burning > 0) state.stats.doused++
        t.burning = 0
        t.heat = 0
        if (t.charred === 0) t.size = Math.min(1.15, t.size + 0.12 * dt)
      }
    }
    for (const b of state.buildings) {
      if (surfaceDist(b.dir, dir) < RAIN_RADIUS) {
        if (b.burning > 0) {
          b.burning = 0
          state.stats.doused++
          say(`The fire at your ${b.type} is out.`, 'good')
        }
        if (b.type === 'farm') {
          b.moisture = Math.min(1, b.moisture + 0.45 * dt)
          if (b.progress >= 1) state.stats.farmRain += dt
        }
      }
    }
    if (state.trees.length < MAX_TREES && Math.random() < dt * 0.9) {
      const d = randomDirNear(dir, RAIN_RADIUS / PLANET_RADIUS)
      if (
        isBuildable(d) &&
        !state.trees.some((t) => surfaceDist(t.dir, d) < 0.28) &&
        !state.buildings.some((b) => surfaceDist(b.dir, d) < 0.4)
      ) {
        state.trees.push(makeTree(d, 0.05))
        state.stats.treesGrown++
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
        b.growth += (0.03 + (b.sunned ? 0.11 : 0)) * dt * climateCropFactor(state.cosmos, b.dir)
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
    if (b.type === 'well' && b.progress >= 1) {
      for (const o of state.buildings) {
        if (o.type === 'farm' && o.progress >= 1 && surfaceDist(o.dir, b.dir) < 2.2) o.moisture = Math.min(1, o.moisture + 0.05 * dt)
      }
      for (const f of state.followers) {
        if (!f.lost && surfaceDist(f.dir, b.dir) < 1.6) f.happiness = Math.min(100, f.happiness + 0.6 * dt)
      }
      for (const t of state.trees) {
        if (t.charred === 0 && t.size < 1 && surfaceDist(t.dir, b.dir) < 1.6) t.size = Math.min(1, t.size + 0.02 * dt)
      }
    }
    if (b.type === 'monument' && b.progress >= 1) {
      for (const f of state.followers) {
        if (!f.lost && surfaceDist(f.dir, b.dir) < 2.4) f.happiness = Math.min(100, f.happiness + 1.4 * dt)
      }
      if (Math.random() < dt * 3) emit('faith', b.dir, 1, 0.06, 0.9)
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
  const active = state.followers.filter((f) => !f.lost)
  const pop = active.length
  const done = state.buildings.filter((b) => b.progress >= 1)
  const houses = done.filter((b) => b.type === 'house').length
  const temples = done.filter((b) => b.type === 'temple').length
  state.pop = pop
  state.capacity = 2 + houses * 3 + temples * 2
  state.happiness = pop ? active.reduce((a, f) => a + f.happiness, 0) / pop : 0
  state.stats.houses = houses
  state.stats.temples = temples
  state.stats.wells = done.filter((b) => b.type === 'well').length
  state.stats.monuments = done.filter((b) => b.type === 'monument').length
  state.stats.farBuildings = done.filter((b) => b.dir.dot(startDir) < 0).length
}

function updateEconomy(dt: number) {
  updateStats()
  const fearMult = state.fearTimer > 0 ? 1.8 : 1
  state.night = nightAmount(state.time)
  const isNight = state.night > 0.5
  if (isNight !== state.wasNight) {
    state.wasNight = isNight
    say(isNight ? 'Night falls. Prayers by moonlight carry 25% more faith.' : 'Dawn breaks over your world.', 'info')
  }
  const nightMult = 1 + state.night * 0.25
  let rate = 0
  for (const f of state.followers) {
    if (f.lost) continue
    if (f.state === 'pray' && f.burning === 0) {
      const r = (0.35 + (f.happiness / 100) * 1.1) * (f.atTemple ? 2.6 : 1) * fearMult * nightMult
      rate += r
      if (isNight) state.stats.nightPrayers += dt
      if (Math.random() < dt * r * 0.9) emit('faith', f.dir, 1, 0.02, 0.4)
    } else {
      rate += (f.happiness / 100) * 0.12
    }
  }
  rate += state.stats.monuments * 1.5 + cosmicFaith(state.cosmos)
  rate *= faithMultiplier(state.cosmos)
  if (state.cosmos.commandment === 'peace') for (const f of state.followers) if (!f.lost) f.happiness = Math.min(100, f.happiness + 0.3 * dt)
  if (state.cosmos.commandment === 'trial') state.fearTimer = Math.max(state.fearTimer, 0.5)
  if (state.auroraTimer > 0) rate *= 1.5
  if (state.boostTimer > 0) rate *= 2
  state.faithRate = rate
  state.faith += rate * dt
  state.fearTimer = Math.max(0, state.fearTimer - dt)
  state.boostTimer = Math.max(0, state.boostTimer - dt)
  state.auroraTimer = Math.max(0, state.auroraTimer - dt)

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
      sfx('birth')
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
    sfx('ageUp')
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

// ---------- objectives ----------

function updateObjectives() {
  if (state.viewDir.dot(startDir) < -0.4) state.stats.farSide = true
  let o = OBJECTIVES[state.objectiveIndex]
  while (o && o.progress(state) >= o.target) {
    state.faith += o.reward
    state.objectiveIndex++
    say(`Objective complete: ${o.title}. +${o.reward} faith`, 'good')
    sfx('objective')
    emit('faith', state.viewDir, 40, 0.5, 0.4)
    o = OBJECTIVES[state.objectiveIndex]
    if (!o) say('Every divine purpose fulfilled. You are a true god.', 'good')
  }
}

// ---------- challenges ----------

const CHALLENGE_KINDS: ChallengeKind[] = ['wildfire', 'pilgrims', 'festival', 'boom', 'harvest', 'drought', 'devotion']
const CHALLENGE_RADIUS = 4.5

function findFarLandDir() {
  const d = new Vector3()
  for (let i = 0; i < 400; i++) {
    d.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
    if (d.dot(state.viewDir) < -0.25 && isBuildable(d)) return d.clone()
  }
  return null
}

function makeChallenge(
  kind: ChallengeKind,
  title: string,
  desc: string,
  duration: number,
  target: number,
  reward: number,
  extra: Partial<Pick<Challenge, 'dir' | 'base' | 'ids'>> = {},
): Challenge {
  return {
    id: uid(),
    kind,
    title,
    desc,
    duration,
    timeLeft: duration,
    elapsed: 0,
    progress: 0,
    target,
    reward,
    dir: extra.dir ?? null,
    base: extra.base ?? 0,
    ids: extra.ids ?? [],
    status: 'active',
  }
}

function createChallenge(kind: ChallengeKind): Challenge | null {
  switch (kind) {
    case 'wildfire': {
      const candidates = state.trees.filter((t) => t.charred === 0 && t.burning === 0 && t.dir.dot(state.viewDir) < -0.1)
      if (candidates.length < 3) return null
      const seed = pick(candidates)
      for (const t of state.trees) if (surfaceDist(t.dir, seed.dir) < 0.7) igniteTree(t)
      return makeChallenge(
        'wildfire',
        'Wildfire!',
        'A blaze erupted on the far side of the world. Spin the planet and drown it with Rain.',
        45,
        1,
        50,
        { dir: seed.dir.clone(), base: state.stats.doused },
      )
    }
    case 'pilgrims': {
      const dir = findFarLandDir()
      if (!dir) return null
      const ids: number[] = []
      for (let i = 0; i < 3; i++) {
        const d = randomLandDirNear(dir, 0.1, true, 12) ?? dir
        const f = makeFollower(d)
        f.lost = true
        f.state = 'pray'
        f.happiness = 30
        state.followers.push(f)
        ids.push(f.id)
      }
      return makeChallenge(
        'pilgrims',
        'Lost Pilgrims',
        'Three wanderers seek a god on the far side of the world. Find them and bless them with Sunlight.',
        55,
        3,
        45,
        { dir, ids },
      )
    }
    return null;
    case 'festival':
      if (state.pop < 3) return null
      return makeChallenge(
        'festival',
        'Festival of Light',
        'Lift your people to 75% happiness and hold it for 8 seconds.',
        45,
        8,
        40,
      )
    case 'boom':
      return makeChallenge('boom', 'Season of Births', 'Welcome 3 new followers into your flock.', 80, 3, 50, { base: state.pop })
    case 'harvest':
      if (!state.buildings.some((b) => b.type === 'farm' && b.progress >= 1)) return null
      return makeChallenge('harvest', 'Great Harvest', 'Bring in 2 harvests. Rain and sun make crops grow fast.', 70, 2, 45, {
        base: state.harvests,
      })
    case 'drought': {
      const farms = state.buildings.filter((b) => b.type === 'farm' && b.progress >= 1)
      if (farms.length < 2) return null
      for (const b of farms) b.moisture = 0
      const target = Math.min(3, farms.length)
      return makeChallenge(
        'drought',
        'Great Drought',
        `The fields have cracked under a cruel sun. Soak ${target} farms with Rain before the crops wither.`,
        50,
        target,
        55,
        { dir: farms[0].dir.clone() },
      )
    }
    case 'devotion': {
      if (state.pop < 5) return null
      const goal = Math.max(4, Math.ceil(state.faithRate * 1.4))
      return makeChallenge(
        'devotion',
        'Night of Devotion',
        `Raise faith income to ${goal}/s and hold it for 10 seconds. Temples and moonlit prayer help.`,
        60,
        10,
        60,
        { base: goal },
      )
    }
  // end of last switch case in createChallenge
  }
  return null;
}

function startChallenge() {
  const options = CHALLENGE_KINDS.filter((k) => k !== state.lastChallenge).sort(() => Math.random() - 0.5)
  for (const kind of options) {
    const c = createChallenge(kind)
    if (c) {
      state.challenge = c
      state.lastChallenge = kind
      say(`New challenge: ${c.title}`, 'info')
      sfx('challengeStart')
      notify(true)
      return
    }
  }
  state.challengeTimer = 20
}

function finishChallenge(c: Challenge, won: boolean) {
  c.status = won ? 'won' : 'lost'
  c.timeLeft = 0
  sfx(won ? 'challengeWon' : 'challengeLost')
  if (won) {
    state.faith += c.reward
    state.challengesWon++
    for (const f of state.followers) if (!f.lost) f.happiness = Math.min(100, f.happiness + 15)
    if (c.dir) emit('faith', c.dir, 50, 0.4, 0.3)
    say(`Challenge complete: ${c.title}! +${c.reward} faith`, 'good')
  } else if (c.kind === 'wildfire') {
    for (const f of state.followers) f.happiness = Math.max(0, f.happiness - 20)
    say('The wildfire burned unchecked. Your people despair.', 'bad')
  } else if (c.kind === 'drought') {
    for (const b of state.buildings) if (b.type === 'farm') b.growth = 0
    for (const f of state.followers) f.happiness = Math.max(0, f.happiness - 12)
    say('The crops withered in the drought.', 'bad')
  } else if (c.kind === 'pilgrims') {
    state.followers = state.followers.filter((f) => !(f.lost && c.ids.includes(f.id)))
    say('The lost pilgrims wandered away into the wilds.', 'bad')
  } else {
    say(`The ${c.title} slipped away.`, 'info')
  }
  notify(true)
}

function updateChallenges(dt: number) {
  const c = state.challenge
  if (!c) {
    if (state.objectiveIndex < 3) return
    state.challengeTimer -= dt
    if (state.challengeTimer <= 0) startChallenge()
    return
  }
  if (c.status !== 'active') {
    c.timeLeft -= dt
    if (c.timeLeft <= -4) {
      state.challenge = null
      state.challengeTimer = 50 + Math.random() * 35
      notify(true)
    }
    return
  }

  c.timeLeft -= dt
  c.elapsed += dt
  let failEarly = false

  switch (c.kind) {
    case 'wildfire': {
      const dir = c.dir!
      const burning =
        state.trees.some((t) => t.burning > 0 && surfaceDist(t.dir, dir) < CHALLENGE_RADIUS) ||
        state.buildings.some((b) => b.burning > 0 && surfaceDist(b.dir, dir) < CHALLENGE_RADIUS)
      const doused = state.stats.doused > c.base
      c.progress = !burning && doused ? 1 : 0
      failEarly = !burning && !doused && c.elapsed > 1
      break
    }
    case 'pilgrims': {
      const alive = state.followers.filter((f) => c.ids.includes(f.id))
      c.progress = alive.filter((f) => !f.lost).length
      failEarly = alive.length < c.target
      break
    }
    case 'festival':
      if (state.happiness >= 75) c.progress += dt
      break
    case 'boom':
      c.progress = Math.max(0, state.pop - c.base)
      break
    case 'harvest':
      c.progress = state.harvests - c.base
      break
    case 'drought':
      c.progress = state.buildings.filter((b) => b.type === 'farm' && b.progress >= 1 && b.moisture >= 0.85).length
      break
    case 'devotion':
      if (state.faithRate >= c.base) c.progress += dt
      break
  }

  if (c.progress >= c.target) finishChallenge(c, true)
  else if (c.timeLeft <= 0 || failEarly) finishChallenge(c, false)
}

let paused = false
export function setPaused(value: boolean) {
  paused = value
  if (value) {
    setSoundscape('peace', 0)
    state.cursor.down = false
    setLoop('sun', false)
    setLoop('rain', false)
  }
}

export function tick(dt: number) {
  if (paused) return
  const playing = state.started && !state.gameOver
  const channeling = playing && state.cursor.down && state.cursor.dir !== null
  setLoop('sun', channeling && state.tool === 'sun')
  setLoop('rain', channeling && state.tool === 'rain')
  if (!playing) { setSoundscape('peace', 0); return }
  state.time += dt
  applyCursor(dt)
  navigator.beginFrame()
  updateFollowers(dt)
  updateBuildings(dt)
  updateTrees(dt)
  updateRocks(dt)
  updateTornadoes(dt)
  updateInvaders(dt)
  updateTetherPreview()
  updateEffects(dt)
  tickCosmos(state, dt, {
    canReach: (follower, destination) => !navigator.isUnreachable(follower, new Vector3(...destination)),
    tell: text => say(text),
    death: follower => killFollower(follower, 'A follower succumbed to prolonged climate exposure.'),
    impact: (dir, safe, kind) => {
      if (safe) { addShockwave(dir, 2.6, 'gold'); sfx('blessing'); return }
      if (kind === 'flare') { addShockwave(dir, 3, 'fire'); state.flash.pos.copy(surfacePoint(dir)); state.flash.intensity = 80; sfx('thunder'); return }
      meteorImpact({ id: uid(), dir, to: surfacePoint(dir), from: dir.clone().multiplyScalar(23), t: 0, duration: 1 })
    },
  })
  setSoundscape(state.cosmos.disaster && !state.cosmos.disaster.resolved ? 'disaster' : state.cosmos.weather.kind !== 'clear' ? 'storm' : state.fearTimer > 5 ? 'wrath' : 'peace', state.ageIndex)
  updateEconomy(dt)
  updateObjectives()
  updateChallenges(dt)
  notify()
}

populateWorld(state)
updateStats()

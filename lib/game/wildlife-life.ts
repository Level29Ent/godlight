import { Matrix4, Object3D, Vector3 } from 'three'
import type { GameState } from './store'
import type { AnimalKind } from './animal-visuals'
import { elevation, isLand, OCEAN_RADIUS, surfacePoint } from './planet'
import { facingQuaternion } from './orient'
import { wildlifeHabitat } from './wildlife'

export type HabitatKind = 'forest' | 'meadow' | 'wetland' | 'coast'
export interface HabitatSite { id: string; kind: HabitatKind; dir: Vector3 }
export interface WildAnimal { id: number; kind: AnimalKind; home: Vector3; habitat: HabitatKind; phase: number; resident: boolean; rare?: boolean }
const UP = new Vector3(0, 1, 0), RIGHT = new Vector3(1, 0, 0)
// Fixed terrain samples never consume challenge/gameplay RNG.
const samples = Array.from({ length: 180 }, (_, i) => {
  const y = 1 - (i + 0.5) / 90, r = Math.sqrt(1 - y * y), a = i * 2.399963
  return new Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
})
const meadowSites = samples.filter(d => isLand(d) && elevation(d) < 0.26).slice(0, 18)
const wetlandSites = samples.filter(d => isLand(d) && elevation(d) < 0.04).slice(0, 10)
const coastSites = samples.filter(d => !isLand(d)).slice(0, 14)

export function wildlifeSites(s: GameState): HabitatSite[] {
  const h = wildlifeHabitat(s), sites: HabitatSite[] = []
  for (const tree of h.forest) {
    if (sites.filter(p => p.kind === 'forest').length >= 6) break
    if (sites.some(p => p.dir.distanceTo(tree.dir) < 0.22)) continue
    if (h.forest.filter(t => t.dir.distanceTo(tree.dir) < 0.25).length >= 6) sites.push({ id: `forest-${tree.id}`, kind: 'forest', dir: tree.dir })
  }
  if (s.cosmos.moisture >= 0.25 && s.cosmos.weather.kind !== 'drought') {
    meadowSites.filter(d => !s.buildings.some(b => b.dir.distanceTo(d) < 0.14) && h.forest.filter(t => t.dir.distanceTo(d) < 0.15).length < 6).slice(0, 6).forEach((dir, i) => sites.push({ id: `meadow-${i}`, kind: 'meadow', dir }))
  }
  if (s.cosmos.moisture >= 0.4 && s.cosmos.weather.kind !== 'drought') {
    const water = [...h.water.map(b => b.dir), ...wetlandSites]
    water.slice(0, 6).forEach((dir, i) => sites.push({ id: `wetland-${i}`, kind: 'wetland', dir }))
  }
  coastSites.slice(0, 6).forEach((dir, i) => sites.push({ id: `coast-${i}`, kind: 'coast', dir }))
  return sites
}

export function rareWildlifeReady(s: GameState) {
  return s.cosmos.ecosystem >= 85 && s.cosmos.moisture >= 0.45 && s.cosmos.alignment >= 25 && s.cosmos.weather.kind === 'clear'
}
export function wildlifeCatalog(s: GameState): WildAnimal[] {
  const sites = wildlifeSites(s), h = wildlifeHabitat(s), animals: WildAnimal[] = []
  const forests = sites.filter(p => p.kind === 'forest'), meadows = sites.filter(p => p.kind === 'meadow'), wetlands = sites.filter(p => p.kind === 'wetland')
  const land = [...forests, ...meadows]
  const add = (id: number, kind: AnimalKind, home: Vector3, habitat: HabitatKind, resident = false, rare = false) => animals.push({ id, kind, home, habitat, resident, rare, phase: id * 2.399 })
  for (let i = 0; i < 48; i++) {
    if ((i % 10) / 10 >= s.cosmos.ecosystem / 100) continue
    if (i < 20 && land.length) { const p = land[i % land.length]; add(i, 'deer', p.dir, p.kind) }
    else if (i >= 20 && i < 34 && wetlands.length) { const p = wetlands[i % wetlands.length]; add(i, 'bird', p.dir, 'wetland') }
    // Small schools share a home and path, with individual offsets.
    else if (i >= 34) add(i, 'fish', coastSites[Math.floor((i - 34) / 4) % coastSites.length], 'coast')
  }
  for (let i = 0; i < Math.floor(s.wildlife.deer) && h.forest.length; i++) add(100 + i, 'deer', h.forest[i % h.forest.length].dir, 'forest', true)
  for (let i = 0; i < Math.floor(s.wildlife.birds) && h.water.length; i++) add(108 + i, 'bird', h.water[i % h.water.length].dir, 'wetland', true)
  // A minute-long visit every three simulation minutes, never while paused.
  const visiting = s.time % 180 >= 30 && s.time % 180 < 90
  if (rareWildlifeReady(s) && visiting) {
    if (forests.length) add(200, 'deer', forests[0].dir, 'forest', false, true)
    if (wetlands.length) add(201, 'fish', coastSites[0], 'coast', false, true)
  }
  return animals
}

export function createAnimalPose() {
  return { root: new Object3D(), dir: new Vector3(), x: new Vector3(), z: new Vector3(), toward: new Vector3(), grazing: 0, flight: 1, activity: '', matrix: new Matrix4() }
}
const smooth = (n: number) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t) }
export function animalPose(a: WildAnimal, time: number, out = createAnimalPose()) {
  const cycle = (time + a.phase) % 28
  const rest = a.kind === 'fish' ? 0 : 10
  const movingTime = Math.floor((time + a.phase) / 28) * (28 - rest) + Math.max(0, cycle - rest)
  const angle = a.kind === 'fish' ? time * 0.35 + Math.floor((a.id - 34) / 4) : movingTime * (a.kind === 'bird' ? 0.25 : 0.12)
  out.x.crossVectors(Math.abs(a.home.y) > 0.95 ? RIGHT : UP, a.home).normalize()
  out.z.crossVectors(a.home, out.x).normalize()
  const radius = a.kind === 'fish' ? 0.045 : a.kind === 'bird' ? 0.045 : 0.025
  const schoolOffset = a.kind === 'fish' ? (a.id % 4 - 1.5) * 0.009 : 0
  out.dir.copy(a.home).addScaledVector(out.x, Math.sin(angle) * radius + schoolOffset).addScaledVector(out.z, Math.cos(angle) * radius).normalize()
  if (isLand(out.dir) !== (a.kind !== 'fish')) out.dir.copy(a.home)
  out.toward.copy(out.dir).addScaledVector(out.x, Math.cos(angle)).addScaledVector(out.z, -Math.sin(angle)).normalize()
  facingQuaternion(out.dir, out.toward, out.root.quaternion)
  out.grazing = a.kind === 'deer' ? smooth(cycle) * (1 - smooth((cycle - 8) / 2)) : 0
  const flight = a.kind === 'bird' ? smooth((cycle - 10) / 4) * (1 - smooth((cycle - 24) / 4)) : 0
  out.flight = a.kind === 'bird' ? flight : 1
  out.activity = a.kind === 'deer' ? cycle < 10 ? 'Grazing' : 'Wandering' : a.kind === 'bird' ? cycle < 10 ? 'Resting by water' : 'Flying' : 'Schooling'
  if (a.kind === 'fish') out.root.position.copy(out.dir).multiplyScalar(OCEAN_RADIUS + 0.04 + Math.sin(angle * 2) * 0.015)
  else surfacePoint(out.dir, out.root.position, a.kind === 'bird' ? 0.09 + flight * 0.9 : 0.015)
  out.root.scale.setScalar(a.rare ? 1.15 : a.kind === 'deer' ? 0.85 : 0.8)
  out.root.updateMatrix(); out.matrix.copy(out.root.matrix)
  return out
}

export function animalName(a: WildAnimal) { return a.rare ? a.kind === 'deer' ? 'White stag' : 'Luminous fish' : a.kind === 'deer' ? 'Meadow deer' : a.kind === 'bird' ? 'Waterbird' : 'Coastal fish' }
export function animalContribution(a: WildAnimal) {
  return a.rare ? 'A rare visitor celebrating a thriving ecosystem. No extra resource or hidden buff.' : !a.resident ? 'Ambient wildlife: a sign of suitable habitat, with no direct gameplay bonus.' : a.kind === 'deer' ? 'This habitat herd gently cheers nearby followers.' : 'Each whole habitat waterbird adds 0.1% farm growth/sec to moist, completed farms.'
}
export function wildlifeSoundLevel(camera: Vector3, position: Vector3) {
  // Backside animals are inaudible; zooming out smoothly fades nearby nature sounds.
  if (camera.dot(position) <= position.lengthSq()) return 0
  return Math.max(0, Math.min(1, (18 - camera.distanceTo(position)) / 14))
}

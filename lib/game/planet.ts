import { createNoise3D } from 'simplex-noise'
import { Color, IcosahedronGeometry, BufferAttribute, Vector3 } from 'three'

export const PLANET_RADIUS = 7
export const TERRAIN_AMP = 0.7
export const SEA_LEVEL = -0.08
export const OCEAN_RADIUS = PLANET_RADIUS + SEA_LEVEL * TERRAIN_AMP

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const noise3D = createNoise3D(mulberry32(1337))

export function elevation(d: Vector3) {
  let e = 0
  let amp = 1
  let freq = 0.85
  let norm = 0
  for (let i = 0; i < 4; i++) {
    e += amp * noise3D(d.x * freq + 11.3, d.y * freq - 4.1, d.z * freq + 7.7)
    norm += amp
    amp *= 0.5
    freq *= 2.15
  }
  return e / norm + 0.12
}

export function radiusFromElevation(e: number) {
  const mountains = Math.max(0, e - 0.32) * 1.6
  return PLANET_RADIUS + e * TERRAIN_AMP + mountains * TERRAIN_AMP
}

export function radiusAt(d: Vector3) {
  return radiusFromElevation(elevation(d))
}

export function isLand(d: Vector3) {
  return elevation(d) > SEA_LEVEL + 0.02
}

export function isBuildable(d: Vector3) {
  const e = elevation(d)
  return e > SEA_LEVEL + 0.04 && e < 0.36
}

/** Height for walkers: they wade at the ocean surface instead of sinking to the sea floor. */
export function walkRadiusAt(d: Vector3) {
  return Math.max(radiusAt(d), OCEAN_RADIUS - 0.1)
}

export function surfacePoint(d: Vector3, out = new Vector3(), lift = 0) {
  return out.copy(d).multiplyScalar(walkRadiusAt(d) + lift)
}

const tmpAxis = new Vector3()
const tmpRand = new Vector3()

/** Random direction within maxAngle (radians) of center. */
export function randomDirNear(center: Vector3, maxAngle: number, out = new Vector3()) {
  tmpRand.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
  tmpAxis.crossVectors(center, tmpRand).normalize()
  const angle = Math.sqrt(Math.random()) * maxAngle
  return out.copy(center).applyAxisAngle(tmpAxis, angle).normalize()
}

export function randomLandDirNear(center: Vector3, maxAngle: number, buildable = false, tries = 30) {
  const out = new Vector3()
  for (let i = 0; i < tries; i++) {
    randomDirNear(center, maxAngle, out)
    if (buildable ? isBuildable(out) : isLand(out)) return out
  }
  return null
}

export function findStartDir() {
  const golden = Math.PI * (3 - Math.sqrt(5))
  let best = new Vector3(0, 0, 1)
  let bestScore = -Infinity
  const d = new Vector3()
  const probe = new Vector3()
  for (let i = 0; i < 400; i++) {
    const y = 1 - (i / 399) * 2
    const r = Math.sqrt(1 - y * y)
    d.set(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r)
    if (!isBuildable(d)) continue
    let score = 0
    for (let k = 0; k < 16; k++) {
      randomDirNear(d, 0.35, probe)
      if (isBuildable(probe)) score++
    }
    score -= Math.abs(d.y) * 4
    if (score > bestScore) {
      bestScore = score
      best = d.clone()
    }
  }
  return best
}

const SAND = new Color('#e9d49c')
const SEABED = new Color('#b89a62')
const GRASS_LOW = new Color('#8cc84b')
const GRASS_HIGH = new Color('#4f9a3c')
const FOREST = new Color('#3b7a35')
const ROCK = new Color('#8b7d6b')
const SNOW = new Color('#f5f7fa')

function colorForElevation(e: number, out: Color) {
  if (e < SEA_LEVEL) return out.copy(SEABED).lerp(SAND, Math.max(0, 1 + (e - SEA_LEVEL) * 4))
  if (e < SEA_LEVEL + 0.04) return out.copy(SAND)
  if (e < 0.2) return out.copy(GRASS_LOW).lerp(GRASS_HIGH, (e - SEA_LEVEL - 0.04) / (0.2 - SEA_LEVEL - 0.04))
  if (e < 0.32) return out.copy(GRASS_HIGH).lerp(FOREST, (e - 0.2) / 0.12)
  if (e < 0.44) return out.copy(ROCK)
  return out.copy(SNOW)
}

export function createPlanetGeometry(detail = 30) {
  const geo = new IcosahedronGeometry(1, detail)
  const pos = geo.attributes.position as BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const v = new Vector3()
  const centroid = new Vector3()
  const c = new Color()
  const jitter = mulberry32(42)

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    v.multiplyScalar(radiusAt(v))
    pos.setXYZ(i, v.x, v.y, v.z)
  }

  for (let f = 0; f < pos.count; f += 3) {
    centroid.set(0, 0, 0)
    for (let k = 0; k < 3; k++) centroid.add(v.fromBufferAttribute(pos, f + k))
    centroid.normalize()
    colorForElevation(elevation(centroid), c)
    const shade = 0.94 + jitter() * 0.1
    for (let k = 0; k < 3; k++) {
      colors[(f + k) * 3] = c.r * shade
      colors[(f + k) * 3 + 1] = c.g * shade
      colors[(f + k) * 3 + 2] = c.b * shade
    }
  }

  geo.setAttribute('color', new BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

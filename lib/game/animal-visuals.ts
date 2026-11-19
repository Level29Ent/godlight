import { Object3D } from 'three'

type Triple = [number, number, number]
export type AnimalKind = 'deer' | 'bird' | 'fish'
type Motion = 'leg' | 'wing' | 'tail' | 'graze'
export interface AnimalPart {
  position: Triple
  scale: Triple
  color: string
  rotation?: Triple
  motion?: Motion
  side?: number
}
const part = (position: Triple, scale: Triple, color: string, extra: Partial<AnimalPart> = {}): AnimalPart => ({ position, scale, color, ...extra })

// Local +Y is the surface normal; +Z is forward. All sizes are radii.
// Shared low-poly geometry keeps silhouettes readable without textures or extra draw calls.
export const ANIMAL_PARTS: Record<AnimalKind, AnimalPart[]> = {
  deer: [
    part([0, 0.25, 0], [0.105, 0.115, 0.21], '#b77b45'),
    part([0, 0.205, 0.025], [0.086, 0.065, 0.16], '#e7c49a'),
    part([0, 0.355, 0.155], [0.064, 0.135, 0.067], '#c68d53', { rotation: [0.35, 0, 0] }),
    part([0, 0.46, 0.205], [0.076, 0.073, 0.105], '#cd995f', { motion: 'graze' }),
    part([0, 0.431, 0.287], [0.052, 0.038, 0.052], '#f0d7b2', { motion: 'graze' }),
    part([0, 0.438, 0.325], [0.032, 0.025, 0.019], '#352c2a', { motion: 'graze' }),
    ...[-1, 1].flatMap(side => [
      part([side * 0.079, 0.535, 0.175], [0.034, 0.087, 0.029], '#bb824e', { rotation: [0, 0, side * -0.55], motion: 'graze' }),
      part([side * 0.079, 0.54, 0.194], [0.017, 0.055, 0.012], '#f1c5a4', { rotation: [0, 0, side * -0.55], motion: 'graze' }),
      part([side * 0.064, 0.476, 0.247], [0.014, 0.016, 0.014], '#211f27', { motion: 'graze' }),
      part([side * 0.068, 0.481, 0.255], [0.005, 0.005, 0.005], '#fff1d7', { motion: 'graze' }),
      ...[-1, 1].flatMap(end => [
        part([side * 0.067, 0.12, end * 0.13], [0.023, 0.115, 0.026], '#9a643c', { motion: 'leg', side: side * end }),
        part([side * 0.067, 0.025, end * 0.13 + 0.008], [0.026, 0.026, 0.035], '#443632', { motion: 'leg', side: side * end }),
      ]),
      part([side * 0.068, 0.3, -0.08], [0.019, 0.014, 0.026], '#efd2a2'),
      part([side * 0.087, 0.28, -0.02], [0.013, 0.014, 0.02], '#efd2a2'),
    ]),
    part([0, 0.3, -0.215], [0.037, 0.06, 0.053], '#f1dec1', { rotation: [-0.6, 0, 0], motion: 'tail' }),
  ],
  bird: [
    part([0, 0, 0], [0.065, 0.065, 0.15], '#f5ecd7'),
    part([0, -0.024, 0.035], [0.054, 0.044, 0.1], '#d5d9d4'),
    part([0, 0.047, 0.125], [0.043, 0.065, 0.047], '#e7e8dc'),
    part([0, 0.091, 0.155], [0.047, 0.045, 0.055], '#faf1dc'),
    part([0, 0.08, 0.216], [0.026, 0.019, 0.045], '#e7ad55'),
    ...[-1, 1].flatMap(side => [
      part([side * 0.041, 0.1, 0.178], [0.009, 0.011, 0.012], '#242f3a'),
      part([side * 0.135, 0.015, -0.014], [0.125, 0.018, 0.082], '#c1d4d8', { motion: 'wing', side }),
      part([side * 0.255, 0.014, -0.055], [0.068, 0.012, 0.05], '#566b7a', { motion: 'wing', side }),
    ]),
    part([0, 0.009, -0.163], [0.062, 0.018, 0.075], '#8fa7b2', { motion: 'tail' }),
  ],
  fish: [
    part([0, 0, 0], [0.062, 0.075, 0.17], '#55b6c5'),
    part([0, -0.029, 0.019], [0.05, 0.043, 0.125], '#b3e6d8'),
    part([0, 0.064, -0.018], [0.017, 0.058, 0.08], '#318298', { rotation: [-0.25, 0, 0] }),
    part([0, 0, -0.195], [0.026, 0.083, 0.07], '#e9b965', { motion: 'tail' }),
    ...[-1, 1].flatMap(side => [
      part([side * 0.058, 0.022, 0.105], [0.013, 0.017, 0.018], '#203b4b'),
      part([side * 0.063, 0.027, 0.111], [0.004, 0.005, 0.006], '#f0ffec'),
      part([side * 0.064, -0.025, 0.005], [0.048, 0.014, 0.05], '#e1af5d', { rotation: [0, side * 0.4, side * -0.4] }),
    ]),
  ],
}

export const MAX_ANIMAL_PARTS = Math.max(...Object.values(ANIMAL_PARTS).map(parts => parts.length))

/** Reuses the caller's scratch object; visual motion never consumes simulation RNG. */
export function poseAnimalPart(part: AnimalPart, time: number, phase: number, out: Object3D) {
  out.position.set(...part.position)
  out.scale.set(...part.scale)
  out.rotation.set(part.rotation?.[0] ?? 0, part.rotation?.[1] ?? 0, part.rotation?.[2] ?? 0)
  const cycle = time * 5 + phase
  if (part.motion === 'leg') {
    const stride = Math.sin(cycle) * (part.side ?? 1)
    out.rotation.x += stride * 0.2
    out.position.z += stride * 0.022
    out.position.y += Math.max(0, stride) * 0.012
  } else if (part.motion === 'wing') {
    // Both wings lift together, hinging at the shoulders rather than rolling the bird.
    const flap = Math.sin(time * 7 + phase) * 0.65
    const reach = Math.abs(part.position[0]) - 0.035
    out.position.x = (part.side ?? 1) * (0.035 + reach * Math.cos(flap))
    out.position.y += reach * Math.sin(flap)
    out.rotation.z = (part.side ?? 1) * flap
  } else if (part.motion === 'tail') {
    out.rotation.y += Math.sin(cycle) * 0.3
    out.position.x += Math.sin(cycle) * 0.014
  } else if (part.motion === 'graze') {
    out.rotation.x += Math.sin(time * 0.8 + phase) * 0.06
    out.position.y += Math.sin(time * 0.8 + phase) * 0.009
  }
  out.updateMatrix()
  return out.matrix
}

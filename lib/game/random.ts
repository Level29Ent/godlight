// Simulation-only RNG: rendering, audio and native integrations never consume this stream.
let seed: number | null = null
export function seedSimulation(value: number | null) { seed = value === null ? null : value >>> 0 }
export function simulationSeed() { return seed }
export function gameRandom() {
  if (seed === null) return Math.random()
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return seed / 4294967296
}

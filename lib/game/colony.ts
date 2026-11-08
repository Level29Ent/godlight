export interface Dinosaur { id: number; hp: number; approach: number; bite: number; angle: number }
export interface ColonySurface {
  farms: number; habitats: number; turrets: number; integrity: number
  build: { kind: 'farm' | 'habitat' | 'turret'; remaining: number } | null
  dinosaurs: Dinosaur[]; nextRaid: number; kills: number; nextId: number
}
export const COLONY_BUILDINGS = {
  farm: { wood: 15, stone: 5, seconds: 15 },
  habitat: { wood: 20, stone: 15, seconds: 20 },
  turret: { wood: 10, stone: 25, seconds: 18 },
} as const
export function createColonySurface(): ColonySurface {
  return { farms: 0, habitats: 0, turrets: 0, integrity: 100, build: null, dinosaurs: [], nextRaid: 60, kills: 0, nextId: 1 }
}
export function restoreColonySurface(raw: unknown): ColonySurface {
  const out = createColonySurface()
  if (!raw || typeof raw !== 'object') return out
  const x = raw as Partial<ColonySurface>
  const n = (v: unknown, fallback: number, max: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : fallback
  out.farms = Math.floor(n(x.farms, 0, 6)); out.habitats = Math.floor(n(x.habitats, 0, 6)); out.turrets = Math.floor(n(x.turrets, 0, 6))
  out.integrity = n(x.integrity, 100, 100); out.nextRaid = n(x.nextRaid, 60, 180); out.kills = Math.floor(n(x.kills, 0, 1e6))
  if (x.build && Object.hasOwn(COLONY_BUILDINGS, x.build.kind)) out.build = { kind: x.build.kind, remaining: n(x.build.remaining, 15, 20) }
  if (Array.isArray(x.dinosaurs)) out.dinosaurs = x.dinosaurs.slice(0, 4).filter(d => d && typeof d === 'object').map((d, i) => ({ id: i + 1, hp: n(d.hp, 80, 80), approach: n(d.approach, 0, 1), bite: n(d.bite, 2, 3), angle: n(d.angle, i, Math.PI * 2) }))
  out.nextId = out.dinosaurs.length + 1
  return out
}
export function tickColonySurface(surface: ColonySurface, dt: number, shield: boolean, tell: (message: string) => void) {
  if (surface.build) {
    surface.build.remaining -= dt
    if (surface.build.remaining <= 0) {
      const kind = surface.build.kind
      if (kind === 'farm') surface.farms++
      else if (kind === 'habitat') surface.habitats++
      else surface.turrets++
      surface.build = null
      tell(`Colony ${kind} completed.`)
    }
  }
  surface.nextRaid -= dt
  if (surface.nextRaid <= 0 && !surface.dinosaurs.length) {
    for (let i = 0; i < 2; i++) surface.dinosaurs.push({ id: surface.nextId++, hp: 80, approach: 0, bite: 2, angle: (surface.nextId * 2.399) % (Math.PI * 2) })
    surface.nextRaid = 120
    tell('DINOSAURS approach the colony! Build turrets, raise a shield or cast smite.')
  }
  for (const d of surface.dinosaurs) {
    d.hp -= surface.turrets * dt * 8
    if (d.hp <= 0) continue
    d.approach = Math.min(1, d.approach + dt / 20)
    if (d.approach >= 1 && !shield) {
      d.bite -= dt
      if (d.bite <= 0) { d.bite = 2; surface.integrity = Math.max(0, surface.integrity - 6) }
    }
  }
  const killed = surface.dinosaurs.filter(d => d.hp <= 0).length
  surface.kills += killed
  surface.dinosaurs = surface.dinosaurs.filter(d => d.hp > 0)
  if (killed) tell(`${killed} dinosaur defeated.`)
}

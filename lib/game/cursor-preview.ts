import { Color, Vector3 } from 'three'
import { TOOL_BY_ID, type Tool } from './config'
import { isBuildable, PLANET_RADIUS } from './planet'
import type { Building } from './store'

interface CursorPreview {
  radius: number
  color: Color
  buildingScale: readonly [number, number, number] | null
}

// Exhaustive over Tool: a new power must supply its preview before TypeScript can pass.
// Colors are allocated once, never in the animation loop.
export const CURSOR_PREVIEWS = {
  hand: { radius: 0.5, color: new Color('#ffffff'), buildingScale: null },
  sun: { radius: 1.1, color: new Color(2.2, 1.7, 0.5), buildingScale: null },
  rain: { radius: 1.3, color: new Color(0.5, 1.2, 2.2), buildingScale: null },
  lightning: { radius: 0.4, color: new Color(1.6, 1.6, 2.6), buildingScale: null },
  meteor: { radius: 1.5, color: new Color(2.6, 0.9, 0.3), buildingScale: null },
  grove: { radius: 1.3, color: new Color(0.7, 2.1, 0.8), buildingScale: null },
  blessing: { radius: 2.2, color: new Color(2.2, 1.7, 0.5), buildingScale: null },
  bounty: { radius: 1.8, color: new Color(0.7, 2.1, 0.8), buildingScale: null },
  quake: { radius: 2.6, color: new Color(1.6, 1.1, 0.7), buildingScale: null },
  tornado: { radius: 0.7, color: new Color(1.1, 1.3, 1.7), buildingScale: null },
  aurora: { radius: 2.2, color: new Color(0.7, 2.1, 1.8), buildingScale: null },
  house: { radius: 0.3, color: new Color('#ffffff'), buildingScale: [0.26, 0.3, 0.24] },
  farm: { radius: 0.3, color: new Color('#ffffff'), buildingScale: [0.46, 0.05, 0.36] },
  temple: { radius: 0.42, color: new Color('#ffffff'), buildingScale: [0.6, 0.35, 0.6] },
  well: { radius: 0.3, color: new Color('#ffffff'), buildingScale: [0.3, 0.37, 0.3] },
  monument: { radius: 0.42, color: new Color('#ffffff'), buildingScale: [0.6, 0.8, 0.6] },
} satisfies Record<Tool, CursorPreview>

const OK = new Color(0.4, 2, 0.8)
const BAD = new Color(2.4, 0.4, 0.3)

export function cursorColor(tool: Tool, valid: boolean): Color {
  return TOOL_BY_ID[tool].kind === 'build' ? (valid ? OK : BAD) : CURSOR_PREVIEWS[tool].color
}

export function canBuildPreview(dir: Vector3, tool: Tool, buildings: readonly Building[]): boolean {
  if (!isBuildable(dir)) return false
  const large = tool === 'temple' || tool === 'monument'
  return !buildings.some(b => b.dir.distanceTo(dir) * PLANET_RADIUS < (large || b.type === 'temple' || b.type === 'monument' ? 0.8 : 0.55))
}

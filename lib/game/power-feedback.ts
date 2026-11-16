import { TOOL_BY_ID, AGES, type Tool } from './config'
import { canBuildPreview } from './cursor-preview'
import { isLand, isBuildable, PLANET_RADIUS } from './planet'
import { Vector3 } from 'three'
import type { GameState } from './store'

export function powerBlock(s: GameState, tool: Tool, dir: Vector3 | null): string | null {
  const info = TOOL_BY_ID[tool]
  if (info.unlockAge > s.ageIndex) return `Unlocks in ${AGES[info.unlockAge].name}.`
  if (s.chronicle.scenario === 'restraint' && info.kind === 'power' && info.cost > 0) return 'Gentle Hands permits Sun, Rain, Touch and buildings only.'
  if (info.cost > s.faith) return `Needs ${info.cost} faith; you have ${Math.floor(s.faith)}.`
  if (!dir) return 'Point at the planet to aim; on touch, press and hold land.'
  if (info.kind === 'build' && !canBuildPreview(dir, tool, s.buildings)) return !isLand(dir) ? 'Cannot build on water.' : !isBuildable(dir) ? 'The slope is too steep.' : 'Too close to another building.'
  if ((tool === 'bounty' || tool === 'grove') && !isLand(dir)) return 'This miracle needs soil; choose land.'
  return null
}
export function comboFeedback(s: GameState): string {
  const l = s.living, last = l.cast, remaining = Math.ceil(l.comboCooldown - s.time)
  if (remaining > 0) return `Combination cooldown: ${remaining}s`
  if (!last || last.tool !== 'rain' || s.time - last.time > 12) return 'Prepare a combo: hold Rain locally for 2s, then Sun or Lightning.'
  if (last.seconds < 2) return `Rain preparation: ${Math.min(100, Math.floor(last.seconds / 2 * 100))}%`
  const nearby = s.cursor.dir && new Vector3(...last.dir).distanceTo(s.cursor.dir) * PLANET_RADIUS < 1.3
  return nearby ? `Rain ready here · ${Math.max(0, Math.ceil(12 - (s.time - last.time)))}s to combine` : 'Rain prepared elsewhere. Return to the watered area to combine.'
}


export function effectivePowerRadius(s: GameState, tool: Tool, dir: Vector3, base: number) {
  const last = s.living.cast
  return tool === 'lightning' && !powerBlock(s, tool, dir) && s.time >= s.living.comboCooldown && last?.tool === 'rain' && last.seconds >= 2 && s.time - last.time <= 12 && new Vector3(...last.dir).distanceTo(dir) * PLANET_RADIUS < 1.3 ? 1.8 : base
}

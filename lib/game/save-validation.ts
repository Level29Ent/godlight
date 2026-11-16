import { TOOL_BY_ID } from './config'
import type { SaveData } from './store'

// Shared by direct slot imports and device recovery, before touching live state.
export function validSaveStructure(raw: unknown): raw is SaveData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const x = raw as Partial<SaveData>
  if (x.v !== 1) return false
  for (const [entries, limit] of [[x.followers, 10000], [x.buildings, 10000], [x.trees, 340]] as const) {
    if (!Array.isArray(entries) || entries.length > limit || entries.some(e => !e || typeof e !== 'object' || Array.isArray(e))) return false
  }
  if (x.rocks !== undefined && (!Array.isArray(x.rocks) || x.rocks.length > 120 || x.rocks.some(e => !e || typeof e !== 'object' || Array.isArray(e)))) return false
  if (x.tool !== undefined && (typeof x.tool !== 'string' || !Object.hasOwn(TOOL_BY_ID, x.tool))) return false
  // Missing optional fields are migrated; explicitly malformed numbers are not trusted.
  for (const key of ['faith', 'ageIndex', 'time', 'harvests', 'wood', 'stone'] as const) {
    const value = x[key]
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) return false
  }
  return true
}

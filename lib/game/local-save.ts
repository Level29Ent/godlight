import { validSaveStructure } from './save-validation'
import type { SaveData } from './store'

export const LOCAL_SAVE_KEY = 'godlight-world-v1'
export const CHALLENGE_SAVE_KEY = 'godlight-challenge-v1'
const MAX_BYTES = 1_500_000
export type SaveMode = 'normal' | 'challenge'
const keyFor = (mode: SaveMode) => mode === 'challenge' ? CHALLENGE_SAVE_KEY : LOCAL_SAVE_KEY

function parseWorld(raw: string | null, mode: SaveMode): SaveData | null {
  try {
    if (!raw || raw.length > MAX_BYTES) return null
    const data = JSON.parse(raw)
    if (!validSaveStructure(data)) return null
    const scenario = data.chronicle?.scenario
    if (mode === 'challenge' ? scenario !== 'drought' && scenario !== 'restraint' : scenario != null) return null
    return data
  } catch { return null }
}

export function readLocalProgress(storage: Pick<Storage, 'getItem'>, mode: SaveMode = 'normal'): { data: SaveData; recovered: boolean } | null {
  try {
    const key = keyFor(mode)
    const primary = parseWorld(storage.getItem(key), mode)
    if (primary) return { data: primary, recovered: false }
    const backup = parseWorld(storage.getItem(`${key}-backup`), mode)
    return backup ? { data: backup, recovered: true } : null
  } catch { return null }
}

export function readLocalWorld(storage: Pick<Storage, 'getItem'>, mode: SaveMode = 'normal'): SaveData | null {
  return readLocalProgress(storage, mode)?.data ?? null
}

export function writeLocalWorld(storage: Pick<Storage, 'setItem'> & Partial<Pick<Storage, 'getItem'>>, data: SaveData): boolean {
  try {
    const raw = JSON.stringify(data)
    const scenario = data.chronicle?.scenario
    const mode = scenario ? 'challenge' : 'normal'
    if (!parseWorld(raw, mode)) return false
    const key = keyFor(mode)
    // Keep one previously valid snapshot. Corrupt/wrong-bank primaries never replace it.
    // Backup storage is best-effort: lack of space must not prevent the primary save.
    try {
      const previous = storage.getItem?.(key) ?? null
      if (parseWorld(previous, mode)) storage.setItem(`${key}-backup`, previous!)
    } catch { /* Primary save may still fit even when a second copy does not. */ }
    storage.setItem(key, raw)
    return true
  } catch { return false }
}

import type { SaveData } from './store'

export const LOCAL_SAVE_KEY = 'godlight-world-v1'
const MAX_BYTES = 1_500_000

export function readLocalWorld(storage: Pick<Storage, 'getItem'>): SaveData | null {
  try {
    const raw = storage.getItem(LOCAL_SAVE_KEY)
    if (!raw || raw.length > MAX_BYTES) return null
    const data = JSON.parse(raw)
    if (data?.v !== 1 || !Array.isArray(data.followers) || !Array.isArray(data.buildings) || !Array.isArray(data.trees)) return null
    for (const entries of [data.followers, data.buildings, data.trees, ...(data.rocks ? [data.rocks] : [])]) {
      if (!Array.isArray(entries) || entries.some(entry => !entry || typeof entry !== 'object' || Array.isArray(entry))) return null
    }
    return data
  } catch { return null }
}

export function writeLocalWorld(storage: Pick<Storage, 'setItem'>, data: SaveData): boolean {
  try {
    const raw = JSON.stringify(data)
    if (raw.length > MAX_BYTES) return false
    storage.setItem(LOCAL_SAVE_KEY, raw)
    return true
  } catch { return false }
}

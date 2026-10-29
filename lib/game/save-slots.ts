export const AUTOSAVE_SLOT = 0
export const SLOT_COUNT = 3
export const AUTOSAVE_INTERVAL_MS = 60_000

export interface SaveSummary {
  slot: number
  name: string
  faith: number
  followers: number
  updatedAt: string
}

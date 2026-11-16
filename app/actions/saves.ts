import { AUTOSAVE_SLOT, SLOT_COUNT, type SaveSummary } from '@/lib/game/save-slots';

const STORAGE_PREFIX = 'godlight_save_slot_';
const MAX_SAVE_BYTES = 1_500_000;

interface StoredSave extends SaveSummary {
  data: unknown;
}

function assertSlot(slot: unknown): asserts slot is number {
  if (!Number.isInteger(slot) || (slot as number) < AUTOSAVE_SLOT || (slot as number) > SLOT_COUNT) {
    throw new Error('Invalid slot');
  }
}

export async function listSaves(): Promise<SaveSummary[]> {
  if (typeof window === 'undefined') return [];
  const saves: SaveSummary[] = [];

  for (let slot = AUTOSAVE_SLOT; slot <= SLOT_COUNT; slot++) {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${slot}`);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as StoredSave;
      saves.push({
        slot: parsed.slot,
        name: parsed.name,
        faith: parsed.faith,
        followers: parsed.followers,
        updatedAt: parsed.updatedAt,
      });
    } catch {
      // Skip corrupted slot data
    }
  }
  return saves.sort((a, b) => a.slot - b.slot);
}

export async function saveGame(slot: number, name: string, data: unknown): Promise<void> {
  if (typeof window === 'undefined') return;
  assertSlot(slot);

  if (data && typeof data === 'object' && (data as { chronicle?: { scenario?: unknown } }).chronicle?.scenario != null) {
    throw new Error('Challenge worlds use a separate device save. Return to a normal world to use these slots.');
  }
  const serializedData = JSON.stringify(data);
  if (serializedData.length > MAX_SAVE_BYTES) {
    throw new Error('Save data exceeds maximum allowed size');
  }

  const state = (data as Record<string, any>) || {};
  const payload: StoredSave = {
    slot,
    name: name || `Slot ${slot}`,
    faith: typeof state.faith === 'number' ? state.faith : 0,
    followers: Array.isArray(state.followers) ? state.followers.filter((f: any) => f && !f.lost).length : 0,
    updatedAt: new Date().toISOString(),
    data,
  };

  window.localStorage.setItem(`${STORAGE_PREFIX}${slot}`, JSON.stringify(payload));
}

export async function loadGame(slot: number): Promise<unknown | null> {
  if (typeof window === 'undefined') return null;
  assertSlot(slot);

  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${slot}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredSave;
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export async function deleteSave(slot: number): Promise<void> {
  if (typeof window === 'undefined') return;
  assertSlot(slot);
  window.localStorage.removeItem(`${STORAGE_PREFIX}${slot}`);
}

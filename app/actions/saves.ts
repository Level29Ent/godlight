'use server'

import { and, asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { gameSave } from '@/lib/db/schema'
import { AUTOSAVE_SLOT, SLOT_COUNT, type SaveSummary } from '@/lib/game/save-slots'

const MAX_SAVE_BYTES = 1_500_000

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

function assertSlot(slot: unknown): asserts slot is number {
  if (!Number.isInteger(slot) || (slot as number) < AUTOSAVE_SLOT || (slot as number) > SLOT_COUNT) {
    throw new Error('Invalid slot')
  }
}

export async function listSaves(): Promise<SaveSummary[]> {
  const userId = await getUserId()
  const rows = await db
    .select({
      slot: gameSave.slot,
      name: gameSave.name,
      faith: gameSave.faith,
      followers: gameSave.followers,
      updatedAt: gameSave.updatedAt,
    })
    .from(gameSave)
    .where(eq(gameSave.userId, userId))
    .orderBy(asc(gameSave.slot))
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))
}

export async function saveGame(slot: number, name: string, data: unknown) {
  const userId = await getUserId()
  assertSlot(slot)
  if (!data || typeof data !== 'object' || (data as { v?: unknown }).v !== 1) {
    throw new Error('Invalid save data')
  }
  if (JSON.stringify(data).length > MAX_SAVE_BYTES) throw new Error('Save is too large')

  const save = data as { faith?: unknown; followers?: unknown[] }
  const faith = Math.max(0, Math.min(1_000_000_000, Math.floor(Number(save.faith) || 0)))
  const followers = Array.isArray(save.followers) ? save.followers.length : 0
  const cleanName = String(name || '').trim().slice(0, 40) || `World ${slot}`
  const now = new Date()

  await db
    .insert(gameSave)
    .values({ userId, slot, name: cleanName, faith, followers, data, updatedAt: now })
    .onConflictDoUpdate({
      target: [gameSave.userId, gameSave.slot],
      set: { name: cleanName, faith, followers, data, updatedAt: now },
    })
}

export async function loadGame(slot: number) {
  const userId = await getUserId()
  assertSlot(slot)
  const [row] = await db
    .select({ data: gameSave.data })
    .from(gameSave)
    .where(and(eq(gameSave.userId, userId), eq(gameSave.slot, slot)))
    .limit(1)
  return row?.data ?? null
}

export async function deleteSave(slot: number) {
  const userId = await getUserId()
  assertSlot(slot)
  await db.delete(gameSave).where(and(eq(gameSave.userId, userId), eq(gameSave.slot, slot)))
}

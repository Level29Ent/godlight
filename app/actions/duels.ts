'use server'

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { isPower, outcome } from '@/lib/duels/rules'

async function userId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Sign in to play.')
  return session.user.id
}
function validate(code: string) {
  if (!/^[A-F0-9]{12}$/.test(code)) throw new Error('Enter a valid 12-character invite code.')
}

export async function createDuel() {
  const id = await userId()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Serialize creation per account to keep the room cap effective under concurrency.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [id])
    const count = await client.query('SELECT count(*) FROM divine_duel WHERE host_id=$1 AND expires_at > now() AND round < 5', [id])
    if (Number(count.rows[0].count) >= 5) throw new Error('You already have five open duels. Finish one or wait for it to expire.')
    const code = randomBytes(6).toString('hex').toUpperCase()
    await client.query('INSERT INTO divine_duel(code,host_id) VALUES ($1,$2)', [code, id])
    await client.query('COMMIT')
    return code
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function enterDuel(code: string) {
  validate(code)
  const id = await userId()
  await pool.query(`UPDATE divine_duel SET guest_id=$2 WHERE code=$1 AND guest_id IS NULL AND host_id<>$2 AND expires_at>now()`, [code, id])
  return readDuel(code)
}

export async function readDuel(code: string) {
  validate(code)
  const id = await userId()
  const { rows } = await pool.query(`SELECT * FROM divine_duel WHERE code=$1 AND (host_id=$2 OR guest_id=$2) AND expires_at>now()`, [code, id])
  const room = rows[0]
  if (!room) throw new Error('Duel is full, unavailable, or expired.')
  const host = room.host_id === id
  // Never send identities or an unrevealed opponent move to the client.
  return {
    code, ready: !!room.guest_id, round: room.round as number,
    score: (host ? room.host_score : room.guest_score) as number,
    opponentScore: (host ? room.guest_score : room.host_score) as number,
    submitted: !!(host ? room.host_move : room.guest_move),
    lastResult: room.last_result as { host: string; guest: string } | null,
    role: host ? 'host' : 'guest',
  }
}

export async function playDuel(code: string, round: number, power: unknown) {
  validate(code)
  if (!isPower(power) || !Number.isInteger(round)) throw new Error('Invalid move.')
  const id = await userId()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(`SELECT * FROM divine_duel WHERE code=$1 AND (host_id=$2 OR guest_id=$2) AND expires_at>now() FOR UPDATE`, [code, id])
    const room = rows[0]
    if (!room || !room.guest_id || room.round >= 5 || room.round !== round) throw new Error('Refresh the duel before playing.')
    const host = room.host_id === id
    if (host ? room.host_move : room.guest_move) throw new Error('Your move is already locked.')
    const a = host ? power : room.host_move
    const b = host ? room.guest_move : power
    if (a && b) {
      const result = outcome(a, b)
      await client.query(`UPDATE divine_duel SET host_move=NULL, guest_move=NULL, round=round+1,
        host_score=host_score+$2, guest_score=guest_score+$3, last_result=$4::jsonb WHERE code=$1`,
      [code, result === 1 ? 1 : 0, result === -1 ? 1 : 0, JSON.stringify({ host: a, guest: b })])
    } else {
      await client.query(host ? 'UPDATE divine_duel SET host_move=$2 WHERE code=$1' : 'UPDATE divine_duel SET guest_move=$2 WHERE code=$1', [code, power])
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
  return readDuel(code)
}

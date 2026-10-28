'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { authClient, ensureGuest } from '@/lib/auth-client'
import { createDuel, enterDuel, playDuel, readDuel } from '@/app/actions/duels'
import { POWERS } from '@/lib/duels/rules'

type Room = Awaited<ReturnType<typeof readDuel>>
const labels = { sun: '☀ Sun', rain: '☂ Rain', lightning: 'ϟ Lightning' }
export default function Duels() {
  const [code, setCode] = useState('')
  const [room, setRoom] = useState<Room | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const activeCode = room?.code
  useEffect(() => {
    if (!activeCode) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const next = await readDuel(activeCode!)
        if (!cancelled) { setRoom(current => current && (current.round > next.round || (current.round === next.round && current.submitted && !next.submitted)) ? current : next); setError('') }
      } catch { if (!cancelled) setError('Connection lost or duel expired. Rejoin to try again.') }
      if (!cancelled) timer = setTimeout(poll, 3000)
    }
    timer = setTimeout(poll, 3000)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [activeCode])

  async function run(action: () => Promise<Room>) {
    setBusy(true); setError('')
    try {
      const { data: session, error: sessionError } = await authClient.getSession()
      if (sessionError) throw new Error('Could not check your sign-in. Please retry.')
      if (!session) {
        const result = await ensureGuest() as { error?: { message?: string } }
        if (result?.error) throw new Error(result.error.message || 'Could not sign in.')
      }
      setRoom(await action())
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not connect. Try again.') }
    finally { setBusy(false) }
  }
  const finished = room && room.round >= 5
  return (
    <main className="min-h-dvh bg-[#060817] px-6 py-12 text-[#f4ecd8]" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))', paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto max-w-lg space-y-6">
        <Link href="/" className="text-sm text-[#f5c451] underline">← Your planet</Link>
        <p className="text-xs uppercase tracking-[0.3em] text-[#f5c451]">Godlight · Multiplayer</p>
        <h1 className="text-4xl font-semibold">Divine Duels</h1>
        <p>Challenge a friend to five rounds of hidden powers. Sun beats rain. Rain beats lightning. Lightning beats sun. Ties score nothing.</p>
        <p className="text-sm text-[#f4ecd8]/60">Both players lock a choice before it is revealed. No boosts, purchases, or ads affect duels. Invites expire after 24 hours.</p>
        {!room ? <section className="space-y-4 rounded-2xl border border-[#f5c451]/30 p-6">
          <button disabled={busy} onClick={() => void run(async () => readDuel(await createDuel()))} className="min-h-12 w-full rounded-xl bg-[#f5c451] p-3 font-semibold text-black disabled:opacity-50">Create a duel</button>
          <label className="block" htmlFor="invite">Friend&apos;s invite code</label>
          <input id="invite" autoCapitalize="characters" autoComplete="off" maxLength={12} value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, ''))} className="min-h-12 w-full rounded-xl border p-3" />
          <button disabled={busy || code.length !== 12} onClick={() => void run(() => enterDuel(code))} className="min-h-12 w-full rounded-xl border border-[#f5c451] p-3 disabled:opacity-50">Join duel</button>
        </section> : <section className="space-y-5 rounded-2xl border border-[#f5c451]/30 p-6">
          <p>Invite code: <strong className="select-all break-all font-mono">{room.code}</strong></p>
          <p className="text-sm">Share this code with a friend on another device.</p>
          <p className="text-3xl">You {room.score} : {room.opponentScore} Rival</p>
          <p aria-live="polite">{finished ? room.score === room.opponentScore ? 'A divine draw!' : room.score > room.opponentScore ? 'You win!' : 'Your rival wins!' : !room.ready ? 'Waiting for your friend…' : room.submitted ? 'Power locked. Waiting for your rival…' : `Round ${room.round + 1} of 5 — choose your power`}</p>
          {room.lastResult && <p>Last round: you used {room.lastResult[room.role === 'host' ? 'host' : 'guest']}; rival used {room.lastResult[room.role === 'host' ? 'guest' : 'host']}.</p>}
          {!finished && <div className="flex flex-wrap gap-3">{POWERS.map(power => <button key={power} disabled={busy || !room.ready || room.submitted} onClick={() => void run(() => playDuel(room.code, room.round, power))} className="min-h-12 flex-1 rounded-xl border border-[#f5c451] p-3 disabled:opacity-40">{labels[power]}</button>)}</div>}
          <button disabled={busy} onClick={() => setRoom(null)} className="min-h-12 text-sm underline">{finished ? 'Play another duel' : 'Back to lobby (keep your code to return)'}</button>
        </section>}
        {error && <p role="alert" className="text-red-300">{error}</p>}
      </div>
    </main>
  )
}

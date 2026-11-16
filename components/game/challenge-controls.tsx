'use client'

import { useState } from 'react'
import { SCENARIOS, type Scenario } from '@/lib/game/chronicles'
import { exportSave, state, useGame, useGameVersion } from '@/lib/game/store'
import { writeLocalWorld } from '@/lib/game/local-save'
import { beginChallenge, resumeChallenge } from '@/lib/game/challenge-session'
import { unlockAudio } from '@/lib/game/audio'

const button = 'min-h-11 rounded-xl border border-[#f5c451]/40 bg-[#0c1028] px-3 py-2 text-xs text-[#ffe2a1] hover:bg-white/10'
export function ChallengeControls() {
  const started = useGame(s => s.started)
  const scenario = useGame(s => s.chronicle.scenario)
  useGameVersion()
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState(false)
  const [error, setError] = useState('')
  const begin = (kind: Scenario) => {
    if (!window.confirm('Start a new challenge? This replaces only your challenge save, never your normal world.')) return
    try {
      beginChallenge(localStorage, kind); unlockAudio(); setOpen(false); setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Storage unavailable.') }
  }
  return <>
    {!scenario && <button type="button" className={`${button} absolute bottom-0 left-1/2 z-10 -translate-x-1/2`} onClick={() => setOpen(v => !v)} aria-expanded={open}>Challenges</button>}
    {scenario && <section aria-label="Challenge progress" className="absolute bottom-28 left-3 z-10 w-56 max-w-[90vw] rounded-xl border border-[#c5b1ff]/40 bg-[#0c1028]/95 p-2 text-center text-xs text-[#f4ecd8]">
      <p>{SCENARIOS[scenario].name} · Seed {SCENARIOS[scenario].seed} · {state.chronicle.won ? 'Completed!' : `${Math.floor(state.time)}s · ${state.harvests} harvests · ${state.pop} followers`}</p>
      <button type="button" className="min-h-11 underline" aria-expanded={details} onClick={() => setDetails(v => !v)}>{details ? 'Hide challenge controls' : 'Goal & return to title'}</button>
      {details && <>
      <p className="mt-1 max-w-sm text-[10px]">{SCENARIOS[scenario].text}</p>
      <button type="button" className={`${button} mt-2`} onClick={() => {
        try { if (!writeLocalWorld(localStorage, exportSave())) { setError('Challenge save failed. Your normal save is safe.'); return } location.reload() }
        catch { setError('Device storage unavailable. Your normal save is unchanged.') }
      }}>Save challenge & return to title</button>
      </>}
    </section>}
    {open && !scenario && <section aria-label="Choose challenge" className="absolute inset-x-3 bottom-14 z-40 mx-auto max-h-[75dvh] max-w-lg overflow-y-auto rounded-2xl border border-white/20 bg-[#0c1028] p-4 text-[#f4ecd8] shadow-2xl">
      <div className="flex items-center justify-between"><h2 className="font-display text-lg">Challenge worlds</h2><button type="button" className={button} onClick={() => setOpen(false)}>Close</button></div>
      <p className="my-3 text-xs leading-5">Separate device progress; normal worlds and save slots are protected. Fixed seeds reproduce starting conditions, not frame-perfect replays. No leaderboards or purchases. {started ? 'Your current normal world is backed up before starting.' : 'Continue your normal world from the title after returning.'}</p>
      {Object.entries(SCENARIOS).map(([key, s]) => <div key={key} className="mb-3 rounded-xl border border-white/10 p-3"><h3>{s.name} · {s.seed}</h3><p className="my-2 text-xs">{s.text}</p><button type="button" className={button} onClick={() => begin(key as Scenario)}>Start fresh challenge</button></div>)}
      <button type="button" className={button} onClick={() => {
        try {
          resumeChallenge(localStorage); unlockAudio(); setOpen(false); setError('')
        } catch (e) { setError(e instanceof Error ? e.message : 'Device storage unavailable.') }
      }}>Continue device challenge</button>
    </section>}
    {error && <p role="alert" className="absolute inset-x-3 bottom-28 z-50 mx-auto max-w-md rounded-xl bg-[#301827] p-3 text-sm text-[#ffd2d2]">{error}<button type="button" className="ml-3 underline" onClick={() => setError('')}>Dismiss</button></p>}
  </>
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { SCENARIOS, type Scenario } from '@/lib/game/chronicles'
import { cancelTether, setPaused, state, useGame, useGameVersion } from '@/lib/game/store'
import { beginChallenge, leaveChallenge, resumeChallenge } from '@/lib/game/challenge-session'
import { setKeyAxes } from '@/lib/game/camera'
import { unlockAudio } from '@/lib/game/audio'

const button = 'min-h-11 rounded-xl border border-[#f5c451]/40 bg-[#0c1028] px-3 py-2 text-xs text-[#ffe2a1] hover:bg-white/10'
export function ChallengeControls() {
  const started = useGame(s => s.started)
  const scenario = useGame(s => s.chronicle.scenario)
  useGameVersion()
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState(false)
  const [error, setError] = useState('')
  const trigger = useRef<HTMLButtonElement>(null)
  return <>
    {!scenario && <button ref={trigger} type="button" className={`${button} game-menu-button`} onClick={() => setOpen(true)} aria-haspopup="dialog">Challenges</button>}
    {scenario && <section aria-label="Challenge progress" className="game-guidance game-floating-panel w-56 max-w-[90vw] rounded-xl border border-[#c5b1ff]/40 bg-[#0c1028]/95 p-2 text-center text-xs text-[#f4ecd8]">
      <p>{SCENARIOS[scenario].name} · Seed {SCENARIOS[scenario].seed} · {state.chronicle.won ? 'Completed!' : `${Math.floor(state.time)}s · ${state.harvests} harvests · ${state.pop} followers`}</p>
      <button type="button" className="min-h-11 underline" aria-expanded={details} onClick={() => setDetails(v => !v)}>{details ? 'Hide challenge controls' : 'Goal & leave challenge'}</button>
      {details && <>
        <p className="mt-1 max-w-sm text-[10px]">{SCENARIOS[scenario].text}</p>
        <button type="button" className={`${button} mt-2`} onClick={() => {
          try { leaveChallenge(localStorage); setDetails(false); setError(''); trigger.current?.focus() }
          catch (e) { setError(e instanceof Error ? e.message : 'Device storage unavailable. Your normal save is unchanged.') }
        }}>Save challenge & return to normal world</button>
        <p className="mt-2 text-[10px]">Restores your normal device world without reloading. If none exists, returns to the title.</p>
      </>}
    </section>}
    {open && !scenario && <ChallengePicker started={started} onClose={() => { setOpen(false); trigger.current?.focus() }} />}
    {error && <p role="alert" className="game-dock-alert absolute inset-x-3 z-50 mx-auto max-w-md rounded-xl bg-[#301827] p-3 text-sm text-[#ffd2d2]">{error}<button type="button" className="ml-3 min-h-11 underline" onClick={() => setError('')}>Dismiss</button></p>}
  </>
}

function ChallengePicker({ started, onClose }: { started: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    setPaused(true, 'challenge-picker')
    cancelTether()
    setKeyAxes({ yaw: 0, pitch: 0, zoom: 0 })
    dialog.current?.showModal()
    return () => { setPaused(false, 'challenge-picker') }
  }, [])
  const run = (action: () => void) => {
    try { action(); unlockAudio(); onClose() }
    catch (e) { setError(e instanceof Error ? e.message : 'Device storage unavailable.') }
  }
  const begin = (kind: Scenario) => {
    if (!window.confirm('Start a new challenge? This replaces only your challenge save, never your normal world.')) return
    run(() => beginChallenge(localStorage, kind))
  }
  return <dialog ref={dialog} onClose={onClose} aria-labelledby="challenge-picker-title" className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_1.5rem)] max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-[#f5c451]/30 bg-[#0c1028] p-5 text-[#f4ecd8] shadow-2xl backdrop:bg-[#060817]/85">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.3em] text-[#f5c451]">World paused</p><h2 id="challenge-picker-title" className="font-display text-lg">Challenge worlds</h2></div><button autoFocus type="button" className={button} onClick={() => dialog.current?.close()}>Close</button></div>
    <p className="my-3 text-xs leading-5">Separate device progress; normal worlds and save slots are protected. Fixed seeds reproduce starting conditions, not frame-perfect replays. No leaderboards or purchases. {started ? 'Your current normal world is backed up before starting.' : 'Return directly to your normal device world when leaving the challenge.'}</p>
    {error && <p role="alert" className="mb-3 rounded-xl border border-[#ffb3b3]/40 bg-[#301827] p-3 text-sm text-[#ffd2d2]">{error}</p>}
    {Object.entries(SCENARIOS).map(([key, s]) => <div key={key} className="mb-3 rounded-xl border border-white/10 p-3"><h3>{s.name} · {s.seed}</h3><p className="my-2 text-xs leading-5">{s.text}</p><button type="button" className={button} onClick={() => begin(key as Scenario)}>Start fresh challenge</button></div>)}
    <button type="button" className={button} onClick={() => run(() => resumeChallenge(localStorage))}>Continue device challenge</button>
    <p className="mt-3 text-xs leading-5 text-[#f4ecd8]/60">Your device keeps one previous valid snapshot per world type when storage permits. A damaged primary save can fall back to that snapshot; clearing browser storage removes both copies.</p>
  </dialog>
}

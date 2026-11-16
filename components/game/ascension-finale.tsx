'use client'

import { useEffect, useRef } from 'react'
import { worldStory } from '@/lib/game/chronicles'
import { cancelTether, dismissFinale, setPaused, state, useGame } from '@/lib/game/store'
import { setKeyAxes } from '@/lib/game/camera'

export function AscensionFinale() {
  const ascended = useGame(s => s.chronicle.ascended)
  const seen = useGame(s => s.chronicle.finaleSeen)
  const replay = useGame(s => s.finaleReplay)
  return ascended && (!seen || replay) ? <FinaleDialog /> : null
}
function FinaleDialog() {
  const dialog = useRef<HTMLDialogElement>(null)
  const story = useRef(state.chronicle.story ?? worldStory(state)).current
  useEffect(() => {
    setPaused(true, 'ascension-finale'); cancelTether(); setKeyAxes({ yaw: 0, pitch: 0, zoom: 0 })
    dialog.current?.showModal()
    return () => setPaused(false, 'ascension-finale')
  }, [])
  return <dialog ref={dialog} onClose={dismissFinale} aria-labelledby="ascension-title" className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_1.5rem)] max-w-xl overflow-y-auto overscroll-contain rounded-3xl border border-[#f5c451]/60 bg-[#0c1028] p-6 text-center text-[#f4ecd8] shadow-[0_0_60px_#f5c45133] backdrop:bg-[#060817]/90">
    <p className="text-xs uppercase tracking-[0.3em] text-[#f5c451]">Your world, remembered</p>
    <div aria-hidden="true" className="mx-auto my-5 flex size-20 items-center justify-center rounded-full border-4 border-[#f5c451]/70 bg-[#f5c451]/15 text-4xl text-[#ffe5a5] motion-safe:animate-in motion-safe:zoom-in motion-safe:duration-700">✦</div>
    <h2 id="ascension-title" className="font-display text-3xl font-semibold sm:text-4xl">Celestial Ascension</h2>
    <p className="mt-3 text-sm leading-6 text-[#f4ecd8]/75">From a handful of followers to a sanctuary among the stars. Your people carry the memory of every prayer you heard and every storm you faced together.</p>
    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">{[
      ['Time of Ascension', `${Math.floor(story.time / 60)}m ${Math.floor(story.time % 60)}s`], ['Home followers', story.followers], ['Harvests', story.harvests], ['Answered prayers', story.prayers], ['Disasters averted', story.averted], ['Settled colonies', story.colonies], ['Completed wonders', story.wonders],
    ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3"><dt className="text-xs text-[#f4ecd8]/60">{label}</dt><dd className="mt-1 font-display text-lg text-[#ffe2a1]">{value}</dd></div>)}</dl>
    <h3 className="mt-5 font-display text-lg text-[#ffe2a1]">Moments along the way</h3>
    <ul className="mt-2 space-y-2 text-left text-xs leading-5 text-[#f4ecd8]/75">{story.memories.map((text, i) => <li key={i} className="rounded-xl border border-white/10 p-3">{text}</li>)}</ul>
    {!state.chronicle.story && <p className="mt-3 text-xs text-[#f4ecd8]/60">This older ascended world has no saved finale snapshot; these are its current statistics.</p>}
    <button autoFocus type="button" onClick={() => dialog.current?.close()} className="mt-6 min-h-11 w-full rounded-full bg-[#f5c451] px-6 py-3 font-semibold text-[#1a1406]">Continue tending your sanctuary</button>
    <p className="mt-3 text-xs leading-5 text-[#f4ecd8]/60">Your world is paused for this celebration. Nothing resets. Replay this story from Worldbook → Celestial Ascension.</p>
  </dialog>
}

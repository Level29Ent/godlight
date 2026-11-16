'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { cancelTether, setPaused, useGame } from '@/lib/game/store'
import { setKeyAxes } from '@/lib/game/camera'

const lessons = [
  ['1 · Give your people a sign', 'Choose Sun and hold on land near your followers. Use Rain on farms to keep crops watered. Powers spend faith; prayers replenish it.'],
  ['2 · Give followers a job', 'Choose Touch, then drag from a follower to a tree for timber, a rock for stone, or a farm for food. Drag to a construction site to assign a builder.'],
  ['3 · Make room to grow', 'Gather timber and stone before placing buildings. Houses increase population capacity; farms and wells help sustain your people. Open the objective card below your civilization age for your next milestone.'],
  ['4 · Protect your little world', 'Watch happiness, weather and invasion warnings. Destructive powers can hurt your own people too. Open Living Cosmos for climate advice, shields, wonders and later-age expeditions.'],
] as const

export function FieldGuide() {
  const started = useGame(s => s.started)
  const gameOver = useGame(s => s.gameOver)
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  if (gameOver) return null
  return <>
    <button ref={trigger} type="button" onClick={() => setOpen(true)} className={started
      ? 'absolute bottom-14 left-3 z-20 flex min-h-11 items-center gap-2 rounded-xl border border-[#f5c451]/40 bg-[#0c1028]/95 px-3 text-xs text-[#ffe2a1] sm:left-5'
      : 'mt-3 flex min-h-11 items-center gap-2 rounded-full px-5 text-sm text-[#f5c451] underline underline-offset-4'}>
      <BookOpen className="size-4" aria-hidden="true" />{started ? 'Pause & guide' : 'How to play'}
    </button>
    {open && <GuideDialog started={started} onClose={() => { setOpen(false); trigger.current?.focus() }} />}
  </>
}

function GuideDialog({ started, onClose }: { started: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    setPaused(true, 'guide')
    cancelTether()
    setKeyAxes({ yaw: 0, pitch: 0, zoom: 0 })
    dialog.current?.showModal()
    return () => { setPaused(false, 'guide') }
  }, [])
  return <dialog ref={dialog} aria-labelledby="field-guide-title" onClose={onClose} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_1.5rem)] max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-[#f5c451]/30 bg-[#0c1028] p-5 text-[#f4ecd8] shadow-2xl backdrop:bg-[#060817]/85 sm:p-6">
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#f5c451]">{started ? 'World paused' : 'Welcome, worldkeeper'}</p>
        <h2 id="field-guide-title" className="font-display mt-1 text-2xl">The Godlight field guide</h2>
      </div>
      <button type="button" autoFocus aria-label="Close field guide" onClick={() => dialog.current?.close()} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"><X className="size-5" aria-hidden="true" /></button>
    </header>
    <p className="mt-3 text-sm leading-6 text-[#f4ecd8]/70">{started ? 'Your people, colonies and threats wait while you read. Resume whenever you’re ready.' : 'Start small: nurture your people, gather resources and build a thriving civilization.'}</p>
    <ol className="mt-5 space-y-3">
      {lessons.map(([title, body]) => <li key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <h3 className="font-display text-sm font-semibold text-[#ffe2a1]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#f4ecd8]/75">{body}</p>
      </li>)}
    </ol>
    <section aria-label="Game controls" className="mt-5 text-sm leading-6 text-[#f4ecd8]/75">
      <h3 className="font-display font-semibold text-[#ffe2a1]">Move & explore</h3>
      <p>Drag the stars to orbit. Pinch or scroll to zoom. Hold on land to use the selected power.</p>
      <p className="mt-2">Keyboard: arrows / WASD to orbit · + / − to zoom · F to flip · R to recenter · M for music · N for sound effects. Power keys appear in Choose power on desktop.</p>
    </section>
    <p className="mt-4 text-sm leading-6 text-[#f4ecd8]/75">Open Worldbook during play to meet followers, answer prayers, learn miracle combinations and unlock planet styles. Your guided beginning can be hidden or restored there too.</p>
    <p className="mt-4 text-xs leading-5 text-[#f4ecd8]/60">Device progress saves every 15 seconds when storage is available. Use “Continue on this device” on your next visit. Cloud saves are separate and require a connection.</p>
    <button type="button" onClick={() => dialog.current?.close()} className="mt-5 min-h-11 w-full rounded-full bg-[#f5c451] px-6 py-3 font-semibold text-[#1a1406]">{started ? 'Resume world' : 'Ready to begin'}</button>
  </dialog>
}

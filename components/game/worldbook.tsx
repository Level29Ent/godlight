'use client'

import { useEffect, useRef, useState } from 'react'
import { BookHeart, Camera, X } from 'lucide-react'
import { CareOverview } from './world-care'
import { ChroniclePanels } from './chronicle-panels'
import { AGES, type Tool } from '@/lib/game/config'
import { identity, disposition, OPENING, PRAYER_TEXT, SKIES, STYLES } from '@/lib/game/living'
import { cancelTether, hideOpening, setPaused, setPhotoMode, setTool, setWorldLook, state, useGame, useGameVersion } from '@/lib/game/store'
import { focusCamera, setKeyAxes } from '@/lib/game/camera'

const button = 'min-h-11 rounded-xl border border-[#f5c451]/40 px-3 py-2 text-xs text-[#ffe2a1] hover:bg-white/10 disabled:opacity-40 aria-pressed:border-[#f5c451] aria-pressed:bg-[#f5c451]/20'

export function Worldbook() {
  const started = useGame(s => s.started)
  const gameOver = useGame(s => s.gameOver)
  const photo = useGame(s => s.photoMode)
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  if (!started || gameOver || photo) return null
  return <>
    <button ref={trigger} type="button" className={`${button} absolute bottom-0 right-0 z-20 flex items-center gap-2 bg-[#0c1028]/95`} onClick={() => setOpen(true)}><BookHeart className="size-4" aria-hidden="true" />Worldbook</button>
    <OpeningCard />
    {open && <WorldbookDialog onClose={() => { setOpen(false); trigger.current?.focus() }} onPhoto={() => { setOpen(false); setPhotoMode(true) }} />}
  </>
}

function OpeningCard() {
  useGameVersion()
  const l = state.living, step = OPENING[l.tutorial]
  if (!step || l.tutorialHidden || state.cosmos.activeColony !== null) return null
  return <section aria-label="Guided beginning" className="absolute bottom-28 left-3 z-10 w-[min(17rem,calc(100vw_-_1.5rem))] rounded-2xl border border-[#f5c451]/30 bg-[#0c1028]/95 p-3 text-xs text-[#f4ecd8]">
    <div className="flex items-center justify-between gap-3"><h2 className="font-display text-[#ffe2a1]">{l.tutorial + 1}/5 · {step.title}</h2><button type="button" aria-label="Hide guided beginning" className="flex size-11 shrink-0 items-center justify-center" onClick={() => hideOpening(true)}><X className="size-4" /></button></div>
    <p className="leading-5">{step.text}</p>
    <button type="button" className={`${button} mt-2`} onClick={() => setTool(step.tool)}>Choose {step.tool === 'hand' ? 'Touch' : step.tool} · +{step.reward} faith on completion</button>
  </section>
}

function WorldbookDialog({ onClose, onPhoto }: { onClose: () => void; onPhoto: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useGameVersion()
  useEffect(() => {
    setPaused(true, 'worldbook'); cancelTether(); setKeyAxes({ yaw: 0, pitch: 0, zoom: 0 })
    dialog.current?.showModal()
    return () => setPaused(false, 'worldbook')
  }, [])
  const close = () => dialog.current?.close()
  const l = state.living, culture = disposition(state.cosmos.alignment)
  const visitingColony = state.cosmos.activeColony !== null
  const focus = (id: number, tool?: Tool) => {
    const f = state.followers.find(f => f.id === id)
    if (visitingColony) return
    if (f) focusCamera(f.dir)
    if (tool) setTool(tool)
    close()
  }
  return <dialog ref={dialog} onClose={onClose} aria-labelledby="worldbook-title" className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_1.5rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-[#f5c451]/30 bg-[#0c1028] p-5 text-[#f4ecd8] shadow-2xl backdrop:bg-[#060817]/85">
    <header className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.3em] text-[#f5c451]">World paused</p><h2 id="worldbook-title" className="font-display text-2xl">Your living world</h2></div><button autoFocus type="button" className={button} onClick={close}>Close</button></header>
    <CareOverview onLocate={onClose} />
    {visitingColony && <p role="status" className="mt-4 text-sm text-[#ffe2a1]">These requests and followers belong to your home world. Return home from Colony controls to find or help them. Planet styles apply at home; photo mode captures your current view.</p>}
    <section className="mt-5 space-y-2"><h3 className="font-display text-lg text-[#ffe2a1]">Prayers · {l.answered} answered</h3><p className="text-xs leading-5 text-[#f4ecd8]/70">Requests last 90 seconds of play. Answering one grants 6 faith and cheers its follower. Time waits while this book is open.</p>
      {!l.prayers.length && <p className="text-sm">Listen as you play: your people will ask for warmth, work or rain.</p>}
      {l.prayers.map(p => <div key={p.followerId} className="rounded-xl border border-white/10 p-3 text-sm"><p><strong>{identity(p.followerId).name}</strong>: {PRAYER_TEXT[p.kind]}</p><p className="mt-1 text-xs text-[#f4ecd8]/60">{Math.ceil(Math.max(0, p.expires - state.time))}s left · {Math.min(100, Math.floor(p.progress * 100))}%</p><button type="button" className={`${button} mt-2`} disabled={visitingColony} onClick={() => {
        if (p.kind === 'rain') {
          const farm = state.buildings.find(b => b.type === 'farm' && b.progress >= 1)
          if (farm) focusCamera(farm.dir)
          setTool('rain'); close()
        } else focus(p.followerId, p.kind === 'warmth' ? 'sun' : 'hand')
      }}>Find request & choose power</button></div>)}
    </section>
    <section className="mt-5 space-y-2"><h3 className="font-display text-lg text-[#ffe2a1]">Your divine reputation · {culture}</h3><p className="text-sm leading-6">Alignment: {Math.round(state.cosmos.alignment)}. Nurturing shifts toward benevolence; destructive miracles toward dread. At +25, followers regain 0.2 happiness/sec and wear peaceful colors. At −25, prayer choices become more frequent and bold prayers yield 20% more, but gentle followers lose an extra 0.45 happiness/sec (others 0.15). Architecture reflects your culture; a carved commandment keeps its own visual identity.</p></section>
    <section className="mt-5 space-y-2"><h3 className="font-display text-lg text-[#ffe2a1]">Miracle combinations · {l.combos.length}/2 discovered</h3><p className="text-sm leading-6">Sunshower: rain on a completed farm for 2 seconds, then use Sun there within 12 seconds. Adds 30% crop growth. Thunderstorm: rain for 2 seconds, then cast Lightning in the same area within 12 seconds. Deals 35 extra damage to nearby aliens but frightens and saddens your followers in the wider area. Both share a 30-second cooldown; Lightning still requires its normal age and faith cost.</p></section>
    <section className="mt-5 space-y-3"><h3 className="font-display text-lg text-[#ffe2a1]">Shape your planet</h3><p className="text-xs leading-5">Cosmetic rewards unlock with civilization age. They never cost faith or change simulation.</p>
      <div className="flex flex-wrap gap-2">{SKIES.map((sky, i) => <button type="button" key={sky.name} aria-pressed={l.sky === i} disabled={state.ageIndex < sky.age} className={button} onClick={() => setWorldLook({ sky: i })}>{sky.name}{state.ageIndex < sky.age ? ` · ${AGES[sky.age].name}` : ''}</button>)}</div>
      <div className="flex flex-wrap gap-2">{STYLES.map((name, i) => <button type="button" key={name} aria-pressed={l.style === i} disabled={i > 0 && state.ageIndex < 2} className={button} onClick={() => setWorldLook({ style: i })}>{name}{i > 0 && state.ageIndex < 2 ? ` · ${AGES[2].name}` : ''}</button>)}</div>
      <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={state.ageIndex < 3} aria-pressed={l.rings} onClick={() => setWorldLook({ rings: !l.rings })}>Planet rings · {AGES[3].name}</button><button type="button" className={button} disabled={state.ageIndex < 4} aria-pressed={l.moon} onClick={() => setWorldLook({ moon: !l.moon })}>Moon · {AGES[4].name}</button></div>
      <button type="button" className={`${button} flex items-center gap-2`} onClick={onPhoto}><Camera className="size-4" aria-hidden="true" />Enter photo mode</button>
    </section>
    <section className="mt-5 space-y-2"><h3 className="font-display text-lg text-[#ffe2a1]">Civilization · {AGES[state.ageIndex].name}</h3><p className="text-sm leading-6">Each age changes robes and homes: stone paths, annexes, solar roofs, luminous halos, then floating crystals. New ages trigger a follower celebration. These visuals do not change building costs.</p><button type="button" className={button} onClick={() => hideOpening(!l.tutorialHidden)}>{l.tutorialHidden ? 'Show' : 'Hide'} guided beginning{l.tutorial >= 5 ? ' · complete' : ''}</button></section>
    <ChroniclePanels />
    <section className="mt-5 space-y-2"><h3 className="font-display text-lg text-[#ffe2a1]">Meet your followers</h3><p className="text-xs leading-5">Devout: +15% prayer faith · Industrious: +15% assigned gathering/attack work · Gentle: sensitive to dread · Bold: stronger prayers under dread. Names and traits stay with a follower across saves.</p>
      <ul className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">{state.followers.filter(f => !f.lost).slice(0, 160).map(f => <li key={f.id}><button type="button" className={`${button} w-full text-left`} disabled={visitingColony} onClick={() => focus(f.id)}>{identity(f.id).name} · {identity(f.id).trait}<br /><span className="text-[#f4ecd8]/60">{Math.round(f.happiness)}% happy · {f.job?.kind ?? f.state} · Find</span></button></li>)}</ul>
    </section>
  </dialog>
}

export function PhotoControls() {
  const photo = useGame(s => s.photoMode)
  const [status, setStatus] = useState('Drag to orbit · Scroll or pinch to zoom. Your world is paused.')
  useEffect(() => {
    if (!photo) return
    setStatus('Drag to orbit · Scroll or pinch to zoom. Your world is paused.')
    const result = (e: Event) => setStatus((e as CustomEvent<string>).detail)
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) setPhotoMode(false) }
    window.addEventListener('godlight-photo-result', result); window.addEventListener('keydown', key)
    return () => { window.removeEventListener('godlight-photo-result', result); window.removeEventListener('keydown', key) }
  }, [photo])
  if (!photo) return null
  return <section aria-label="Photo mode" className="absolute inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-2xl border border-white/20 bg-[#0c1028]/95 p-3 text-center text-xs text-[#f4ecd8]">
    <p role="status">{status}</p><div className="mt-2 flex justify-center gap-2"><button type="button" className={button} onClick={() => window.dispatchEvent(new Event('godlight-photo'))}>Download planet PNG</button><button type="button" className={button} onClick={() => setPhotoMode(false)}>Exit photo mode</button></div>
  </section>
}

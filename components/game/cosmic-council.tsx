'use client'

import { useEffect, useRef, useState } from 'react'
import { commandCosmos, state, useGame, useGameVersion } from '@/lib/game/store'
import { BLUEPRINTS, DESTINATIONS, RELICS, cosmicFaith, type Blueprint, type Commandment } from '@/lib/game/cosmos'
import { focusCamera } from '@/lib/game/camera'
import { Vector3 } from 'three'
import { unlockAudio } from '@/lib/game/audio'

const button = 'min-h-11 rounded-xl border border-[#f5c451]/40 px-3 py-2 text-left text-xs text-[#ffe2a1] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45'
const card = 'space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4'
const percent = (n: number) => `${Math.floor(n * 100)}%`

export function CosmicCouncil() {
  const started = useGame(s => s.started)
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    panel.current?.focus()
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggle.current?.focus() } }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open])
  if (!started) return null
  return <>
    <CosmicWarning onOpen={() => setOpen(true)} />
    <button ref={toggle} type="button" aria-expanded={open} aria-controls="cosmic-council" className={`${button} absolute bottom-14 right-3 z-20 bg-[#0c1028]/95 sm:right-5`} onClick={() => { unlockAudio(); setOpen(v => !v) }}>Living Cosmos {open ? '−' : '+'}</button>
    {open && <aside ref={panel} tabIndex={-1} id="cosmic-council" aria-label="Living Cosmos council" className="absolute inset-x-3 bottom-28 top-3 z-30 overflow-y-auto overscroll-contain rounded-3xl border border-[#c1b5ff]/30 bg-[#090e24]/95 p-4 text-[#f4ecd8] shadow-2xl backdrop-blur-lg sm:left-auto sm:right-5 sm:top-5 sm:w-[min(32rem,90vw)] sm:p-5">
      <div className="sticky -top-4 z-10 flex items-center justify-between gap-3 bg-[#090e24] py-3">
        <div><p className="text-[10px] uppercase tracking-[0.3em] text-[#bcb4ec]">A living, changing universe</p><h2 className="font-display text-xl">Living Cosmos</h2></div>
        <button type="button" className={button} onClick={() => { setOpen(false); toggle.current?.focus() }}>Close</button>
      </div>
      <p className="mb-4 text-xs leading-5 text-[#c9cfe5]">Time keeps flowing here. Close the council to cast on the planet. Timber and stone come from assigning followers to trees and rocks. Wonders reserve up to two unassigned followers. To redirect a worker, use Touch and tether them to a normal task.</p>
      <CouncilContent />
    </aside>}
  </>
}

function CosmicWarning({ onOpen }: { onOpen: () => void }) {
  const kind = useGame(s => s.cosmos.disaster?.kind ?? null)
  const remaining = useGame(s => Math.max(0, Math.ceil(s.cosmos.disaster?.remaining ?? 0)))
  const resolved = useGame(s => s.cosmos.disaster?.resolved ?? false)
  const shield = useGame(s => Math.ceil(s.cosmos.shield))
  const faith = useGame(s => Math.floor(s.faith))
  if (!kind && !shield) return null
  return <section aria-label="Cosmic defense" className="absolute left-1/2 top-[28%] z-20 w-[min(90vw,26rem)] -translate-x-1/2 rounded-2xl border border-[#f3bd75]/50 bg-[#100e26]/95 p-3 text-center text-xs text-[#fff0c9] shadow-xl">
    <p role="status">{kind ? `${kind === 'meteors' ? 'Meteor shower' : 'Solar flare'} ${resolved ? 'has passed' : 'approaching'}` : 'World shield active'}</p>
    {kind && !resolved && <p className="mt-1 font-display text-lg" role="timer">Impact in {remaining}s</p>}
    <p className="mt-1">{shield ? `Shield: ${shield}s remaining` : 'Raise a world shield or evacuate to a completed bunker.'}</p>
    <div className="mt-2 flex justify-center gap-2">
      <button type="button" className={button} disabled={faith < 20} onClick={() => commandCosmos({ type: 'shield' })}>Shield · 20 faith</button>
      <button type="button" className={button} onClick={onOpen}>Defenses & council</button>
    </div>
  </section>
}

function CouncilContent() {
  useGameVersion()
  const [choice, setChoice] = useState<Commandment | null>(null)
  const c = state.cosmos
  const canPay = (faith = 0, wood = 0, stone = 0) => state.faith >= faith && state.wood >= wood && state.stone >= stone && !state.gameOver
  const climateRemedy = c.weather.kind === 'drought' ? 'Rain shortens drought.' : c.weather.kind === 'clear' ? 'Healthy forests and rain sustain wildlife.' : 'Sunlight shortens cold or flooding.'
  return <div className="space-y-4">
    <p role="status" className="rounded-xl border border-white/10 p-3 text-xs text-[#ffe2a1]">{state.messages.at(-1)?.text ?? 'Your followers await your guidance.'}</p>
    <section className={card} aria-labelledby="cosmic-climate">
      <h3 id="cosmic-climate" className="font-display text-lg">Climate & biosphere</h3>
      <p className="text-sm capitalize">{c.weather.kind} {c.weather.kind !== 'clear' && `· ${Math.ceil(c.weather.remaining)}s`}</p>
      <p className="text-xs text-[#bfcde1]">{climateRemedy} Weather moves across a region; prolonged low-morale exposure can be lethal.</p>
      <label className="block text-xs">Biosphere health · {Math.round(c.ecosystem)}%<meter className="mt-1 block w-full" min={0} max={100} value={c.ecosystem} low={30} high={65} optimum={90} /></label>
      <p className="text-xs">Soil moisture {percent(c.moisture)} · Herds, birds and marine life respond to ecosystem health.</p>
      {c.weather.kind !== 'clear' && <button type="button" className={button} onClick={() => focusCamera(new Vector3(...c.weather.dir))}>Locate weather front</button>}
    </section>
    <section className={card} aria-labelledby="cosmic-defense">
      <h3 id="cosmic-defense" className="font-display text-lg">Cosmic watch</h3>
      <p className="text-xs">{c.disaster ? `${c.disaster.kind === 'flare' ? 'Solar flare' : 'Meteor shower'} · ${c.disaster.resolved ? 'resolved' : `${Math.max(0, Math.ceil(c.disaster.remaining))}s to impact`}` : `Next cosmic window in ${Math.ceil(c.nextDisaster)}s`}</p>
      <p className="text-xs text-[#bfcde1]">Shields protect the whole world for 25s. A bunker protects a 3m radius; nearby followers automatically seek shelter. Meteor impacts can destroy buildings and kill followers.</p>
      <button type="button" className={button} disabled={!canPay(20)} onClick={() => commandCosmos({ type: 'shield' })}>Raise shield · 20 faith {c.shield > 0 && `· active ${Math.ceil(c.shield)}s`}</button>
      {c.disaster && <button type="button" className={`${button} ml-2`} onClick={() => focusCamera(new Vector3(...c.disaster!.targets[0]))}>Locate impact</button>}
      <p className="text-xs">Averted {c.averted} · Impacts {c.impacts}</p>
    </section>
    <section className={card} aria-labelledby="cosmic-wonders">
      <h3 id="cosmic-wonders" className="font-display text-lg">Worship blueprints</h3>
      <p className="text-xs text-[#bfcde1]">The site is placed on open land near your view. Resources are funded up front; followers must arrive to construct it.</p>
      <div className="grid grid-cols-2 gap-2">{(Object.entries(BLUEPRINTS) as [Blueprint, typeof BLUEPRINTS[Blueprint]][]).map(([id, b]) => {
        const built = c.projects.find(p => p.kind === id)
        return <div key={id} className="space-y-1">
          <button type="button" className={`${button} w-full`} disabled={!!built || state.ageIndex < b.age || !canPay(0, b.wood, b.stone)} onClick={() => commandCosmos({ type: 'build', blueprint: id })}>
            <span className="block font-semibold">{b.name}</span><span className="block">{b.wood} timber · {b.stone} stone</span>
            <span className="block">{built ? built.progress >= 1 ? 'Completed' : `Building ${percent(built.progress)}` : state.ageIndex < b.age ? `Unlocks at age ${b.age + 1}` : `${b.seconds}s per builder · ${b.faith ? `+${b.faith} faith/s` : 'Local shelter'}`}</span>
          </button>
          {built && <button type="button" className="min-h-11 w-full text-xs text-[#a9dfef] underline" onClick={() => focusCamera(new Vector3(...built.dir))}>Locate {b.name}</button>}
        </div>
      })}</div>
      <p className="text-xs">Wonders and colonies generate +{cosmicFaith(c).toFixed(1)} faith/s before multipliers.</p>
    </section>
    <section className={card} aria-labelledby="cosmic-commandments">
      <h3 id="cosmic-commandments" className="font-display text-lg">Stone commandments</h3>
      <p className="text-xs">Alignment {Math.round(c.alignment)} · {c.alignment > 20 ? 'Benevolent' : c.alignment < -20 ? 'Wrathful' : 'Balanced'}</p>
      <p className="text-xs text-[#bfcde1]">Choose one permanent cultural law for 8 stone. Robes, architectural emblems and worship adapt. Blessings and smites continue to shift your moral alignment.</p>
      {c.commandment ? <p className="text-sm text-[#f5c451]">{c.commandment === 'peace' ? 'Code of Peace: +10% faith and gentler morale decay; pale robes and circular shrines.' : 'Trial by Combat: fearful worship and +30% faith during cosmic threats; crimson robes and pointed shrines.'}</p> : <div className="grid grid-cols-2 gap-2">
        <button type="button" className={button} disabled={!canPay(0, 0, 8)} onClick={() => setChoice('peace')}>Code of Peace · 8 stone</button>
        <button type="button" className={button} disabled={!canPay(0, 0, 8)} onClick={() => setChoice('trial')}>Trial by Combat · 8 stone</button>
      </div>}
      {choice && !c.commandment && <div className="space-y-2 rounded-xl border border-[#f5c451]/50 p-3" role="group" aria-label="Confirm permanent commandment">
        <p className="text-xs">Permanently carve {choice === 'peace' ? 'Code of Peace' : 'Trial by Combat'}? Costs 8 stone. This law cannot be reversed.</p>
        <button type="button" className={button} onClick={() => { commandCosmos({ type: 'commandment', choice }); setChoice(null) }}>Confirm permanent law</button>
        <button type="button" className={`${button} ml-2`} onClick={() => setChoice(null)}>Cancel</button>
      </div>}
    </section>
    <section className={card} aria-labelledby="cosmic-champions">
      <h3 id="cosmic-champions" className="font-display text-lg">Prophets & champions</h3>
      <p className="text-xs text-[#bfcde1]">Original mortal legends, not historical impersonations. Liora heals and calms nearby followers every 5s. Orin doubles survey speed and helps excavate relics.</p>
      <div className="grid grid-cols-2 gap-2">{(['prophet', 'scholar'] as const).map(role => {
        const h = c.champions.find(h => h.role === role)
        return <button key={role} type="button" className={button} disabled={!h && (state.ageIndex < 1 || !canPay(60))} onClick={() => h ? focusCamera(new Vector3(...h.dir)) : commandCosmos({ type: 'champion', role })}>{h ? `Locate ${h.name}` : `${role === 'prophet' ? 'Call Liora' : 'Call Orin'} · 60 faith · age 2`}</button>
      })}</div>
    </section>
    <section className={card} aria-labelledby="cosmic-relics">
      <h3 id="cosmic-relics" className="font-display text-lg">Relic expeditions</h3>
      <button type="button" className={button} disabled={c.survey > 0 || !canPay(15) || (c.relics.every(r => r.revealed) && c.colonies.every(p => p.surveyed))} onClick={() => commandCosmos({ type: 'survey' })}>{c.survey > 0 ? `Surveying · ${Math.ceil(c.survey)}s` : 'Survey relics & nearby worlds · 15 faith'}</button>
      <p className="text-xs text-[#bfcde1]">Each survey reveals a mountain or seabed site and a neighboring world. Expedition equipment lets assigned followers traverse mountains and sea; age 4 is required for diving. Equipment includes expedition boats; these workers are not limited to normal land routes.</p>
      {c.relics.map((r, i) => r.revealed && <div key={i} className="border-t border-white/10 pt-2 text-xs">
        <p className="font-semibold">{RELICS[i].name} · {RELICS[i].terrain} · {r.progress >= 1 ? 'Recovered' : percent(r.progress)}</p><p className="mt-1 text-[#bfcde1]">{RELICS[i].benefit}</p>
        <div className="mt-2 flex gap-2"><button type="button" className={button} disabled={r.active || r.progress >= 1 || state.ageIndex < RELICS[i].age || !canPay(0, 8, 4)} onClick={() => commandCosmos({ type: 'excavate', index: i })}>{r.active ? 'Expedition underway' : `Excavate · 8 timber + 4 stone · age ${RELICS[i].age + 1}`}</button><button type="button" className={button} onClick={() => focusCamera(new Vector3(...r.dir))}>Locate</button></div>
      </div>)}
    </section>
    <section className={card} aria-labelledby="cosmic-galaxy">
      <h3 id="cosmic-galaxy" className="font-display text-lg">Galaxy colonies</h3>
      <p className="text-xs text-[#bfcde1]">Survey, then launch rockets in the Age of Stars. Three settlers leave your home world. Colonies grow independently to 30 residents and send faith, timber and stone. These are autonomous orbital outposts, not full terrain-switching worlds.</p>
      {c.colonies.map((p, i) => <div key={i} className="space-y-2 border-t border-white/10 pt-2 text-xs">
        <p className="font-semibold">{DESTINATIONS[i].name} · {DESTINATIONS[i].biome}</p>
        <p>{p.stage === 'unknown' ? 'Uncharted · survey to reveal' : p.stage === 'launching' ? `Rocket in flight · ${percent(p.progress)}` : p.stage === 'settled' ? `${p.population} settlers · +${(p.population * 0.2).toFixed(1)} faith/s` : 'Survey complete'}</p>
        {p.stage === 'surveyed' && <button type="button" className={button} disabled={state.ageIndex < 5 || !canPay(DESTINATIONS[i].faith, DESTINATIONS[i].wood, DESTINATIONS[i].stone)} onClick={() => commandCosmos({ type: 'launch', index: i })}>Launch · {DESTINATIONS[i].faith} faith · {DESTINATIONS[i].wood} timber · {DESTINATIONS[i].stone} stone · 3 settlers</button>}
      </div>)}
    </section>
    <section className={card} aria-labelledby="cosmic-journal"><h3 id="cosmic-journal" className="font-display text-lg">Chronicle</h3><ol className="space-y-2 text-xs text-[#c9cfe5]">{c.history.map((text, i) => <li key={i}>{text}</li>)}</ol></section>
  </div>
}

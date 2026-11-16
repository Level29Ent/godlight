'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Group } from 'three'
import { identity } from '@/lib/game/living'
import { constructionDetails, followerMemories, followerNeed, worldIssues } from '@/lib/game/world-care'
import { surfacePoint } from '@/lib/game/planet'
import { wildlifeHabitat } from '@/lib/game/wildlife'
import { focusCareTarget, inspectEntity, setInspectMode, setTool, state, useGame, useGameVersion } from '@/lib/game/store'

const button = 'min-h-11 rounded-xl border border-[#f5c451]/40 px-3 py-2 text-xs text-[#ffe2a1] hover:bg-white/10'

export function CareOverview({ onLocate }: { onLocate: () => void }) {
  useGameVersion()
  const issues = worldIssues(state), habitat = wildlifeHabitat(state)
  return <section className="mt-5 space-y-3" aria-label="World health overview">
    <h3 className="font-display text-lg text-[#ffe2a1]">World health</h3>
    <p className="text-sm leading-6">Select an issue to visit its first affected person, building or colony. This list refreshes as you play. Idle followers are available, not necessarily in trouble.</p>
    {!issues.length && <p className="text-sm text-[#a8ecc5]">No listed care issues right now.</p>}
    <div className="grid gap-2 sm:grid-cols-2">{issues.map(issue => <button key={issue.key} type="button" className={`${button} text-left`} onClick={() => { if (focusCareTarget(issue.target)) onLocate() }}><strong>{issue.title} · {issue.count}</strong><br /><span className="text-[#f4ecd8]/70">{issue.advice}</span></button>)}</div>
    <button type="button" className={button} onClick={() => { setInspectMode(true); onLocate() }}>Inspect followers & buildings on home planet</button>
    <p className="text-xs leading-5 text-[#f4ecd8]/65">Inspection mode never casts powers or assigns jobs. Tap a person or building, or use the accessible lists below. Exit inspection before using Touch-and-drag tasks.</p>
    <details className="rounded-xl border border-white/10 p-3"><summary className="min-h-11 cursor-pointer text-sm">Inspect a follower or building</summary><div className="grid max-h-60 gap-2 overflow-y-auto sm:grid-cols-2">{state.followers.slice(0, 160).map(f => <button type="button" key={`f${f.id}`} className={button} onClick={() => { focusCareTarget({ kind: 'follower', id: f.id }); onLocate() }}>{identity(f.id).name}</button>)}{state.buildings.map(b => <button type="button" key={`b${b.id}`} className={button} onClick={() => { focusCareTarget({ kind: 'building', id: b.id }); onLocate() }}>{b.type} · {Math.round(b.progress * 100)}%</button>)}</div></details>
    <h4 className="font-display text-[#ffe2a1]">Wildlife · {Math.floor(state.wildlife.deer)} deer · {Math.floor(state.wildlife.birds)} waterbirds</h4>
    <p className="text-xs leading-5">{habitat.forest.length} healthy mature trees · {habitat.water.length} usable water sites. Healthy forests support deer; moist farms and wells attract birds. Drought, damaged habitats and dread reduce their numbers. Whole deer herds gently cheer nearby followers; waterbirds add 0.1% farm growth/sec each to moist, completed farms. Populations recover gradually, not instantly.</p>
  </section>
}

export function InspectionCard() {
  useGameVersion()
  const active = useGame(s => s.inspectMode)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!active) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) setInspectMode(false) }
    window.addEventListener('keydown', key)
    trigger.current?.focus()
    return () => window.removeEventListener('keydown', key)
  }, [active])
  if (!active || !state.started || state.gameOver || state.photoMode || state.cosmos.activeColony !== null) return null
  const selected = state.inspection
  const f = selected?.kind === 'follower' ? state.followers.find(f => f.id === selected.id) : null
  const b = selected?.kind === 'building' ? state.buildings.find(b => b.id === selected.id) : null
  const details = b ? constructionDetails(state, b) : null
  return <section aria-label="Inspection card" className="absolute right-3 top-1/2 z-30 max-h-[42dvh] w-[min(19rem,calc(100vw_-_1.5rem))] -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#a4d7f2]/40 bg-[#0c1028]/95 p-3 text-xs leading-5 text-[#f4ecd8] shadow-xl">
    <div className="flex items-center justify-between gap-2"><h2 className="font-display text-base text-[#ffe2a1]">{f ? identity(f.id).name : b ? `${b.type} inspection` : 'Inspection mode'}</h2><button ref={trigger} type="button" className={button} onClick={() => setInspectMode(false)}>Exit</button></div>
    {!f && !b && <p className="mt-2">Tap a follower or building to inspect it. No powers are cast in this mode. Worldbook → World health also provides keyboard-accessible lists.</p>}
    {f && <><p className="mt-2">Trait: {identity(f.id).trait} · Job: {f.job?.kind ?? f.state}</p><p>{Math.round(f.happiness)}% happy · {Math.ceil(f.hp)} HP</p><p className="mt-2 text-[#ffe2a1]">{followerNeed(state, f)}</p><h3 className="mt-3 font-semibold">Recent memories</h3>{followerMemories(state, f.id).map((m, i) => <p key={i} className="mt-1 text-[#f4ecd8]/70">{m.text}</p>)}{!followerMemories(state, f.id).length && <p>No recorded memories yet.</p>}<div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} onClick={() => focusCareTarget({ kind: 'follower', id: f.id })}>Find me</button><button type="button" className={button} onClick={() => setTool('hand')}>Exit & choose Touch</button></div></>}
    {b && details && <><p className="mt-2">{details.progress}% complete · {details.assigned} assigned builders</p><progress aria-label="Building completion" className="mt-1 w-full" value={details.progress} max={100} /><p>Health: {Math.ceil(b.hp)} HP{details.burning ? ' · ON FIRE: send Rain' : ''}</p>{b.progress < 1 && <><p className="mt-2">Remaining: {details.wood} timber · {details.stone} stone</p><p className="text-[#ffe2a1]">Stockpile shortfall: {details.missingWood} timber · {details.missingStone} stone</p><p className="mt-1 text-[#f4ecd8]/65">Other sites share these stockpiles. Materials are consumed as construction advances. Tether a follower to this site with Touch.</p></>}{b.type === 'farm' && <p>Moisture: {Math.round(b.moisture * 100)}% · Crop: {Math.round(b.growth * 100)}%</p>}<div className="mt-3 flex gap-2"><button type="button" className={button} onClick={() => focusCareTarget({ kind: 'building', id: b.id })}>Find building</button><button type="button" className={button} onClick={() => setTool(b.burning > 0 || b.type === 'farm' ? 'rain' : 'hand')}>Exit & choose {b.burning > 0 || b.type === 'farm' ? 'Rain' : 'Touch'}</button></div></>}
  </section>
}

export function ConstructionLabel() {
  const anchor = useRef<Group>(null), label = useRef<HTMLDivElement>(null)
  const camera = useThree(s => s.camera)
  useGameVersion()
  const selection = state.inspection
  const b = selection?.kind === 'building' ? state.buildings.find(b => b.id === selection.id) : null
  useFrame(() => {
    if (!b || !anchor.current) return
    surfacePoint(b.dir, anchor.current.position, 1.2)
    if (label.current) label.current.style.display = b.dir.dot(camera.position) > 8 ? 'block' : 'none'
  })
  if (!b || !state.inspectMode || state.photoMode) return null
  const d = constructionDetails(state, b)
  return <group ref={anchor}><Html center style={{ pointerEvents: 'none' }} zIndexRange={[8, 0]}><div ref={label} className="w-40 rounded-xl border border-[#a4d7f2]/40 bg-[#0c1028]/95 p-2 text-center text-[10px] text-[#f4ecd8]"><strong>{b.type} · {d.progress}%</strong><p>{d.assigned} builders</p>{b.progress < 1 && <p>Missing: {d.missingWood} timber · {d.missingStone} stone</p>}</div></Html></group>
}

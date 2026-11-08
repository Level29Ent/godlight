'use client'

import { commandCosmos, state, useGame, useGameVersion } from '@/lib/game/store'
import { DESTINATIONS } from '@/lib/game/cosmos'
import { COLONY_BUILDINGS } from '@/lib/game/colony'
const button = 'min-h-11 rounded-xl border border-[#f5c451]/40 bg-[#10172d] px-3 py-2 text-xs text-[#ffe2a1] disabled:opacity-40'
export function GalaxyControls() {
  useGameVersion()
  const index = useGame(s => s.cosmos.activeColony)
  if (index === null) return null
  const p = state.cosmos.colonies[index], d = DESTINATIONS[index], surface = p.surface
  return <section aria-label="Colony controls" className="absolute inset-x-3 bottom-14 z-40 max-h-[45dvh] overflow-y-auto rounded-2xl border border-white/20 bg-[#090e24]/95 p-4 text-[#f4ecd8] sm:left-auto sm:w-[30rem]">
    <div className="flex items-center justify-between gap-2"><h2 className="font-display text-xl">{d.name} · {d.biome}</h2><button type="button" className={button} onClick={() => commandCosmos({ type: 'visit', index: null })}>Return home</button></div>
    <p className="mt-2 text-xs">Drag to orbit · Home world keeps running. Shared resources: {Math.floor(state.faith)} faith · {Math.floor(state.wood)} timber · {Math.floor(state.stone)} stone</p>
    {state.cosmos.disaster && !state.cosmos.disaster.resolved && <p role="alert" className="mt-2 text-sm text-[#ffbf8d]">Home cosmic warning: {Math.ceil(Math.max(0, state.cosmos.disaster.remaining))}s to impact. Return home or raise a global shield.</p>}
    {state.cosmos.shield > 0 && <p className="mt-2 text-xs">Global shield · {Math.ceil(state.cosmos.shield)}s remaining</p>}
    <p className="mt-2 text-xs" role="status">{state.messages.at(-1)?.text}</p>
    {p.stage !== 'settled' ? <p className="mt-3 text-sm">{p.stage === 'launching' ? `Rocket in flight: ${Math.floor(p.progress * 100)}%` : 'Survey complete. Launch settlers from Living Cosmos in the Age of Stars to establish this world.'}</p> : <>
      <p className="my-3 text-sm">{p.population}/{6 + surface.habitats * 4} settlers · Integrity {Math.ceil(surface.integrity)}% · Dinosaur kills {surface.kills}</p>
      <p className="mb-3 text-xs" role="status">{surface.dinosaurs.length ? `${surface.dinosaurs.length} dinosaurs attacking! ${surface.dinosaurs.map(d => Math.ceil(d.hp)).join(' / ')} HP` : `Next dinosaur approach in ${Math.ceil(Math.max(0, surface.nextRaid))}s`}</p>
      <div className="grid grid-cols-3 gap-2">{(Object.entries(COLONY_BUILDINGS) as [keyof typeof COLONY_BUILDINGS, typeof COLONY_BUILDINGS[keyof typeof COLONY_BUILDINGS]][]).map(([kind, cost]) => <button key={kind} type="button" className={button} disabled={!!surface.build || state.wood < cost.wood || state.stone < cost.stone} onClick={() => commandCosmos({ type: 'colony-build', index, kind })}>Build {kind}<br />{cost.wood} timber · {cost.stone} stone<br />{cost.seconds}s</button>)}</div>
      <p className="my-2 text-xs">Farms boost timber and growth. Habitats add 4 capacity. Turrets automatically damage dinosaurs. Maximum 6 of each.</p>
      {surface.build && <p className="my-2 text-xs">Building {surface.build.kind} · {Math.ceil(surface.build.remaining)}s</p>}
      <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={!surface.dinosaurs.length || state.faith < 15} onClick={() => commandCosmos({ type: 'colony-smite', index })}>Smite dinosaurs · 15 faith</button><button type="button" className={button} disabled={state.faith < 20} onClick={() => commandCosmos({ type: 'shield' })}>Shield · 20 faith</button><button type="button" className={button} disabled={surface.integrity >= 100 || state.faith < 10 || state.stone < 5} onClick={() => commandCosmos({ type: 'colony-repair', index })}>Repair · 10 faith + 5 stone</button></div>
    </>}
  </section>
}

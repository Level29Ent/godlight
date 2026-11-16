'use client'

import { AGES } from '@/lib/game/config'
import { nextUpgrade, upgradeBlock, upgradeLevel } from '@/lib/game/upgrades'
import { focusCareTarget, state, upgradeBuilding, useGameVersion, type Building } from '@/lib/game/store'

const button = 'min-h-11 rounded-xl border border-[#f5c451]/40 px-3 py-2 text-xs text-[#ffe2a1] disabled:cursor-not-allowed disabled:opacity-45'
export function BuildingUpgradeControls({ building: b }: { building: Building }) {
  useGameVersion()
  const next = nextUpgrade(b), blocked = upgradeBlock(state, b)
  if (!next && !['house', 'farm', 'well'].includes(b.type)) return null
  const working = b.upgrade?.remaining != null
  return <section aria-label={`${b.type} upgrades`} className="mt-3 space-y-2 rounded-xl border border-[#f5c451]/25 bg-white/[0.025] p-3 text-xs leading-5">
    <h3 className="font-display font-semibold text-[#ffe2a1]">Village improvement · tier {upgradeLevel(b)}/2</h3>
    {working ? <p role="status">{Math.ceil(b.upgrade!.remaining!)}s remaining{b.burning > 0 ? ' · paused by fire; use Rain' : ' · local craftspeople are working'}</p> : next ? <>
      <p>{next.name} · {next.benefit}</p>
      <p>{next.faith} faith · {next.wood} timber · {next.stone} stone · {next.seconds}s</p>
      <p>Unlock: {AGES[next.age].name}</p>
      <button type="button" className={button} disabled={!!blocked} onClick={() => upgradeBuilding(b.id)}>Begin tier {next.tier} improvement</button>
      {blocked && <p className="text-[#f4ecd8]/65">{blocked}</p>}
    </> : <p className="text-[#a8ecc5]">Fully improved. Benefits remain with this building.</p>}
    <p className="text-[10px] leading-4 text-[#f4ecd8]/60">Paid up front. Existing service continues during work; new benefits start at completion. Fire pauses work. Destruction loses the improvement and spent materials. No worker reassignment or instant repair.</p>
  </section>
}

export function VillageUpgrades({ onLocate }: { onLocate: () => void }) {
  useGameVersion()
  const buildings = state.buildings.filter(b => ['house', 'farm', 'well'].includes(b.type))
  const underway = buildings.filter(b => b.upgrade?.remaining != null).length
  return <details className="mt-4 rounded-xl border border-white/10 p-3">
    <summary className="min-h-11 cursor-pointer font-display text-[#ffe2a1]">Village improvements · {underway} underway</summary>
    <p className="my-2 text-xs leading-5">Improve existing homes, farms and wells instead of expanding endlessly. Tier 1 unlocks at Clay; tier 2 at Bronze. Each site works independently in simulation time, including on a colony visit, but waits while the world is paused.</p>
    <div className="max-h-[50dvh] space-y-3 overflow-y-auto overscroll-contain">{buildings.map(b => <div key={b.id} className="rounded-xl border border-white/10 p-2"><button type="button" className={button} onClick={() => { if (focusCareTarget({ kind: 'building', id: b.id })) onLocate() }}>Inspect {b.type} · tier {upgradeLevel(b)}</button><BuildingUpgradeControls building={b} /></div>)}</div>
    {!buildings.length && <p className="text-xs">Build a home, farm or well to begin.</p>}
  </details>
}

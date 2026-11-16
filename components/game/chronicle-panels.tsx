'use client'

import { useState } from 'react'
import { ascensionGoals, canAscend, COLONY_GOALS } from '@/lib/game/chronicles'
import { identity } from '@/lib/game/living'
import { ascendWorld, showFinale, favoriteFollower, state, useGameVersion } from '@/lib/game/store'
import { DESTINATIONS } from '@/lib/game/cosmos'

const button = 'min-h-11 rounded-xl border border-[#f5c451]/40 px-3 py-2 text-xs text-[#ffe2a1] disabled:opacity-40'
export function ChroniclePanels() {
  useGameVersion()
  const [filter, setFilter] = useState('all')
  const c = state.chronicle
  const people = new Map<number, string>()
  for (const id of c.favorites) people.set(id, identity(id).name)
  for (const f of state.followers) people.set(f.id, identity(f.id).name)
  for (const e of c.entries) if (e.followerId !== null) people.set(e.followerId, identity(e.followerId).name)
  return <>
    <section className="mt-5 space-y-3"><h3 className="font-display text-lg text-[#ffe2a1]">Celestial Ascension</h3>
      <p className="text-sm leading-6">Build a sanctuary among the stars. Complete every milestone, then spend 1,000 faith to transform the home planet. Your people, saves and progression stay intact; there is no reset.</p>
      <ul className="space-y-1 text-sm">{ascensionGoals(state).map(g => <li key={g.text}>{g.done ? '✓' : '○'} {g.text}</li>)}</ul>
      <button type="button" className={button} disabled={!canAscend(state)} onClick={ascendWorld}>{c.ascended ? 'Ascended · sanctuary unlocked' : 'Ascend · 1,000 faith'}</button>
      {c.ascended && <button type="button" className={button} onClick={showFinale}>Replay your world’s Ascension story</button>}
    </section>
    <section className="mt-5 space-y-3"><h3 className="font-display text-lg text-[#ffe2a1]">Colony specializations</h3>
      {COLONY_GOALS.map((g, i) => <div key={g.resource} className="rounded-xl border border-white/10 p-3 text-sm"><h4 className="text-[#ffe2a1]">{DESTINATIONS[i].name} · {g.resource} {c.colony[i].complete ? '✓' : ''}</h4><p className="my-2 text-xs leading-5">{g.text}</p><p className="text-xs">{i === 2 ? `${Math.floor(c.colony[i].secure)}/180 secure seconds` : `${Math.floor(c.colony[i].cargo)}/20 exported`} · {g.reward}</p></div>)}
      <p className="text-xs text-[#f4ecd8]/60">Cargo is a local specialization counter, not a tradable currency. Completed home benefits are permanent for this world.</p>
    </section>
    <section className="mt-5 space-y-3"><h3 className="font-display text-lg text-[#ffe2a1]">Follower story journal</h3>
      <label className="block text-xs">Filter memories<select value={filter} onChange={e => setFilter(e.target.value)} className="ml-2 min-h-11 max-w-full rounded-xl bg-[#171e36] p-2 text-sm"><option value="all">All memories</option><option value="favorites">Favorite followers</option>{[...people].map(([id, name]) => <option key={id} value={String(id)}>{name}</option>)}</select></label>
      <p className="text-xs leading-5">Up to 80 recent memories and 8 favorite followers are kept in your world save, including remembered settlers and the fallen. Older memories roll off; past events from older versions cannot be reconstructed.</p>
      <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">{[...people].map(([id, name]) => <button key={id} type="button" className={button} aria-pressed={c.favorites.includes(id)} disabled={!c.favorites.includes(id) && c.favorites.length >= 8} onClick={() => favoriteFollower(id)}>{c.favorites.includes(id) ? '★' : '☆'} {name}</button>)}</div>
      <ol className="max-h-72 space-y-2 overflow-y-auto text-xs leading-5">{[...c.entries].reverse().filter(e => filter === 'all' || (filter === 'favorites' ? e.followerId !== null && c.favorites.includes(e.followerId) : e.followerId === Number(filter))).map((e, i) => <li key={`${e.time}-${i}`} className="rounded-xl border border-white/10 p-2"><span className="text-[#f5c451]">{Math.floor(e.time / 60)}:{String(Math.floor(e.time % 60)).padStart(2, '0')}</span> · {e.text}</li>)}</ol>
      {!c.entries.length && <p className="text-sm">New rescues, answered prayers, births, settlers and disasters will appear here.</p>}
    </section>
  </>
}

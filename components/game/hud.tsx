'use client'

import { useEffect } from 'react'
import { CloudRain, Flame, Hand, Home, Landmark, Lock, Sparkles, Sun, Users, Wheat, Zap, Skull, Smile } from 'lucide-react'
import { AGES, TOOLS, TOOL_BY_ID, type Tool } from '@/lib/game/config'
import { setTool, useGame } from '@/lib/game/store'
import { cn } from '@/lib/utils'

const ICONS: Record<Tool, typeof Sun> = {
  hand: Hand,
  sun: Sun,
  rain: CloudRain,
  house: Home,
  farm: Wheat,
  lightning: Zap,
  temple: Landmark,
  meteor: Flame,
}

export function Hud() {
  const started = useGame((s) => s.started)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= TOOLS.length) setTool(TOOLS[n - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!started) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <AgePanel />
        <StatsPanel />
      </header>
      <Messages />
      <Toolbar />
    </div>
  )
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'pointer-events-auto rounded-2xl border border-white/10 bg-[#0c1028]/70 text-[#f4ecd8] shadow-2xl shadow-black/40 backdrop-blur-md',
        className,
      )}
    >
      {children}
    </div>
  )
}

function AgePanel() {
  const ageIndex = useGame((s) => s.ageIndex)
  const pop = useGame((s) => s.pop)
  const next = AGES[ageIndex + 1]
  const prev = AGES[ageIndex].pop
  const progress = next ? Math.min(1, (pop - prev) / (next.pop - prev)) : 1
  return (
    <Panel className="w-44 px-4 py-3 sm:w-60">
      <p className="font-display text-[10px] uppercase tracking-[0.25em] text-[#f5c451]/80">Godlight</p>
      <h2 className="font-display mt-0.5 text-base font-semibold sm:text-lg">{AGES[ageIndex].name}</h2>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next age">
        <div className="h-full rounded-full bg-gradient-to-r from-[#f5c451] to-[#ffe9a8] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-[#f4ecd8]/60">
        {next ? `${next.name} at ${next.pop} followers` : 'Your people have reached glory'}
      </p>
    </Panel>
  )
}

function StatsPanel() {
  const faith = useGame((s) => Math.floor(s.faith))
  const rate = useGame((s) => Math.round(s.faithRate * 10) / 10)
  const pop = useGame((s) => s.pop)
  const capacity = useGame((s) => s.capacity)
  const happiness = useGame((s) => Math.round(s.happiness))
  const fear = useGame((s) => s.fearTimer > 0)

  return (
    <Panel className="flex flex-col items-end gap-2 px-4 py-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-[#f5c451]" aria-hidden="true" />
        <span className="font-display text-2xl font-semibold tabular-nums sm:text-3xl">{faith}</span>
        <span className="sr-only">faith</span>
      </div>
      <p className="-mt-1.5 text-[11px] tabular-nums text-[#f5c451]/80">+{rate.toFixed(1)} faith / sec</p>
      <div className="flex items-center gap-4 text-sm tabular-nums">
        <span className="flex items-center gap-1.5" title="Followers / housing">
          <Users className="size-4 text-[#9ecbff]" aria-hidden="true" />
          {pop}
          <span className="text-[#f4ecd8]/50">/{capacity}</span>
          <span className="sr-only">followers</span>
        </span>
        <span className="flex items-center gap-1.5" title="Happiness">
          {fear ? <Skull className="size-4 text-[#ff7a5c]" aria-hidden="true" /> : <Smile className="size-4 text-[#9be38a]" aria-hidden="true" />}
          {happiness}%
          <span className="sr-only">happiness</span>
        </span>
      </div>
      {fear && <p className="text-[11px] font-medium text-[#ff9a7a]">Your people pray in fear</p>}
    </Panel>
  )
}

function Messages() {
  const messages = useGame((s) => s.messages)
  return (
    <div className="pointer-events-none absolute inset-x-0 top-28 flex flex-col items-center gap-2 px-4 sm:top-6" aria-live="polite">
      {messages.map((m) => (
        <p
          key={m.id}
          className={cn(
            'animate-in fade-in slide-in-from-top-2 rounded-full border px-4 py-1.5 text-center text-xs font-medium backdrop-blur-md duration-300 sm:text-sm',
            m.tone === 'good' && 'border-[#f5c451]/30 bg-[#2a2210]/70 text-[#ffe7a6]',
            m.tone === 'bad' && 'border-[#ff7a5c]/30 bg-[#2a1210]/70 text-[#ffc2b0]',
            m.tone === 'info' && 'border-white/10 bg-[#0c1028]/70 text-[#f4ecd8]',
          )}
        >
          {m.text}
        </p>
      ))}
    </div>
  )
}

function Toolbar() {
  const tool = useGame((s) => s.tool)
  const ageIndex = useGame((s) => s.ageIndex)
  const faith = useGame((s) => Math.floor(s.faith))
  const info = TOOL_BY_ID[tool]

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="max-w-md rounded-full bg-black/40 px-4 py-1.5 text-center text-xs text-[#f4ecd8]/85 backdrop-blur-sm sm:text-sm">
        {info.hint}
      </p>
      <Panel className="max-w-full overflow-x-auto p-1.5">
        <div className="flex gap-1" role="toolbar" aria-label="Divine powers">
          {TOOLS.map((t, i) => {
            const Icon = ICONS[t.id]
            const locked = t.unlockAge > ageIndex
            const active = tool === t.id
            const affordable = faith >= t.cost
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTool(t.id)}
                aria-pressed={active}
                aria-label={`${t.label}${t.cost ? `, costs ${t.cost} faith` : ''}${locked ? `, locked until ${AGES[t.unlockAge].name}` : ''}`}
                className={cn(
                  'group relative flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-all sm:w-16',
                  active ? 'bg-[#f5c451] text-[#1a1406] shadow-lg shadow-[#f5c451]/30' : 'text-[#f4ecd8] hover:bg-white/10',
                  locked && 'opacity-45',
                )}
              >
                <span className="absolute left-1.5 top-1 text-[9px] font-medium opacity-50">{i + 1}</span>
                {locked ? <Lock className="size-5" aria-hidden="true" /> : <Icon className="size-5" aria-hidden="true" />}
                <span className="text-[10px] font-medium leading-tight sm:text-[11px]">{t.label}</span>
                {t.cost > 0 && (
                  <span
                    className={cn(
                      'text-[10px] tabular-nums leading-none',
                      active ? 'text-[#1a1406]/70' : affordable ? 'text-[#f5c451]' : 'text-[#ff9a7a]',
                    )}
                  >
                    {t.cost}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

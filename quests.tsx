'use client'

import { useState } from 'react'
import { ChevronDown, Crown, Hourglass, LocateFixed, ScrollText, Trophy } from 'lucide-react'
import { OBJECTIVES } from '@/lib/game/objectives'
import { focusCamera } from '@/lib/game/camera'
import { state, useGame } from '@/lib/game/store'
import { cn } from '@/lib/utils'

function Shell({ className, children }: { className?: string; children: React.ReactNode }) {
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

function Bar({ value, tone = 'gold' }: { value: number; tone?: 'gold' | 'sky' | 'ember' }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          tone === 'gold' && 'bg-gradient-to-r from-[#f5c451] to-[#ffe9a8]',
          tone === 'sky' && 'bg-gradient-to-r from-[#5aa9ff] to-[#9ecbff]',
          tone === 'ember' && 'bg-gradient-to-r from-[#ff7a5c] to-[#ffb38a]',
        )}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  )
}

export function QuestStack() {
  const [open, setOpen] = useState(false)
  const index = useGame((s) => s.objectiveIndex)
  const objective = OBJECTIVES[index]
  const raw = useGame((s) => (objective ? objective.progress(s) : 0))
  const challengeActive = useGame((s) => s.challenge?.status === 'active')
  const timeLeft = useGame((s) => Math.max(0, Math.ceil(s.challenge?.timeLeft ?? 0)))
  const progress = objective ? Math.min(objective.target, Math.floor(raw)) : 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="quest-cards"
        className="pointer-events-auto flex w-40 items-center gap-2 rounded-full border border-white/10 bg-[#0c1028]/60 px-3 py-1.5 text-left text-[#f4ecd8] backdrop-blur-md sm:hidden"
      >
        <ScrollText className="size-3.5 shrink-0 text-[#f5c451]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
          {objective ? objective.title : 'All fulfilled'}
        </span>
        {objective && (
          <span className="text-[10px] tabular-nums text-[#f4ecd8]/60">
            {progress}/{objective.target}
          </span>
        )}
        {challengeActive && (
          <span className="flex items-center gap-0.5 text-[10px] font-semibold tabular-nums text-[#9ecbff]">
            <Trophy className="size-3 animate-pulse" aria-hidden="true" />
            {timeLeft}s
          </span>
        )}
        <ChevronDown className={cn('size-3.5 shrink-0 opacity-60 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        <span className="sr-only">{open ? 'Hide objectives' : 'Show objectives'}</span>
      </button>
      <div id="quest-cards" className={cn('flex-col gap-2', open ? 'flex' : 'hidden sm:flex')}>
        <ObjectivePanel />
        <ChallengeCard />
      </div>
    </>
  )
}

export function ObjectivePanel() {
  const index = useGame((s) => s.objectiveIndex)
  const objective = OBJECTIVES[index]
  const raw = useGame((s) => (objective ? objective.progress(s) : 0))

  if (!objective) {
    return (
      <Shell className="w-44 px-4 py-3 sm:w-60">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#f5c451]/80">
          <Crown className="size-3.5" aria-hidden="true" />
          All objectives
        </p>
        <p className="font-display mt-1 text-sm font-semibold">Every divine purpose fulfilled</p>
      </Shell>
    )
  }

  const progress = Math.min(objective.target, Math.floor(raw))
  return (
    <Shell className="w-44 px-4 py-3 sm:w-60">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#f5c451]/80">
          <ScrollText className="size-3.5" aria-hidden="true" />
          Objective
        </p>
        <span className="text-[10px] tabular-nums text-[#f4ecd8]/50">
          {index + 1}/{OBJECTIVES.length}
        </span>
      </div>
      <h3 className="font-display mt-1 text-sm font-semibold sm:text-base">{objective.title}</h3>
      <p className="mt-0.5 text-[11px] leading-snug text-[#f4ecd8]/70 sm:text-xs">{objective.desc}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1">
          <Bar value={progress / objective.target} />
        </div>
        <span className="text-[11px] tabular-nums text-[#f4ecd8]/80">
          {progress}/{objective.target}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-[#f5c451]/80">Reward: +{objective.reward} faith</p>
    </Shell>
  )
}

export function ChallengeCard() {
  const c = useGame((s) => s.challenge)
  const id = useGame((s) => s.challenge?.id)
  const status = useGame((s) => s.challenge?.status)
  const timeLeft = useGame((s) => Math.max(0, Math.ceil(s.challenge?.timeLeft ?? 0)))
  const progress = useGame((s) => s.challenge?.progress ?? 0)
  const offscreen = useGame((s) => (s.challenge?.dir ? s.challenge.dir.dot(s.viewDir) < 0.55 : false))
  const nextIn = useGame((s) => (s.objectiveIndex >= 3 ? Math.max(0, Math.ceil(s.challengeTimer)) : null))

  if (!c || !id) {
    if (nextIn === null) return null
    return (
      <Shell className="flex w-48 items-center gap-2 px-3 py-2 text-[11px] text-[#f4ecd8]/60 sm:w-60">
        <Hourglass className="size-3.5 text-[#9ecbff]" aria-hidden="true" />
        Next challenge in {nextIn}s
      </Shell>
    )
  }

  const shown = c.kind === 'festival' ? Math.floor(progress) : progress
  const ratio = c.duration ? timeLeft / c.duration : 0
  const urgent = status === 'active' && timeLeft <= 10

  return (
    <Shell
      className={cn(
        'w-48 px-4 py-3 sm:w-60',
        status === 'won' && 'border-[#f5c451]/50',
        status === 'lost' && 'border-[#ff7a5c]/40',
        urgent && 'border-[#ff7a5c]/50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#9ecbff]">
          <Trophy className="size-3.5" aria-hidden="true" />
          Challenge
        </p>
        {status === 'active' ? (
          <span className={cn('text-xs font-semibold tabular-nums', urgent ? 'text-[#ff9a7a]' : 'text-[#f4ecd8]/80')}>
            {timeLeft}s
          </span>
        ) : (
          <span className={cn('text-xs font-semibold', status === 'won' ? 'text-[#f5c451]' : 'text-[#ff9a7a]')}>
            {status === 'won' ? 'Complete' : 'Failed'}
          </span>
        )}
      </div>
      <h3 className="font-display mt-1 text-sm font-semibold sm:text-base">{c.title}</h3>
      <p className="mt-0.5 text-[11px] leading-snug text-[#f4ecd8]/70 sm:text-xs">{c.desc}</p>
      {status === 'active' && (
        <>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1">
              <Bar value={shown / c.target} tone="sky" />
            </div>
            <span className="text-[11px] tabular-nums text-[#f4ecd8]/80">
              {shown}/{c.target}
            </span>
          </div>
          <div className="mt-1.5">
            <Bar value={ratio} tone="ember" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[10px] text-[#f5c451]/80">+{c.reward} faith</p>
            {c.dir && (
              <button
                type="button"
                onClick={() => c.dir && focusCamera(c.dir)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                  offscreen
                    ? 'animate-pulse bg-[#9ecbff] text-[#0c1028] hover:bg-[#c3e0ff]'
                    : 'bg-white/10 text-[#f4ecd8] hover:bg-white/20',
                )}
              >
                <LocateFixed className="size-3.5" aria-hidden="true" />
                {offscreen ? 'Go there' : 'In view'}
              </button>
            )}
          </div>
        </>
      )}
    </Shell>
  )
}

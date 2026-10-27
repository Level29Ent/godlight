'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  CloudRain,
  Droplets,
  Flame,
  Hand,
  Home,
  Landmark,
  Lock,
  Sparkles,
  Sun,
  Tornado,
  Trees,
  Users,
  Wheat,
  Zap,
  Skull,
  Smile,
  Wand2,
  Sprout,
  Castle,
  Rainbow,
  Moon,
} from 'lucide-react'
import { AGES, TOOLS, TOOL_BY_ID, type Tool } from '@/lib/game/config'
import { BUILD_COST, cancelTether, costText, setTool, useGame, type BuildingType } from '@/lib/game/store'
import { toggleMusic, toggleSfx, unlockAudio, useAudioSettings } from '@/lib/game/audio'
import { initNativeApp } from '@/lib/game/native'
import { initMonetization, useMonetization } from '@/lib/game/monetization'
import { Axe, Crown, Gift, Pickaxe, Music, Music2, Save, Volume2, VolumeX } from 'lucide-react'
import { BoostBadge, GiftsMenu, useRewardCooldown } from './gifts-menu'
import { cn } from '@/lib/utils'
import { QuestStack } from './quests'

const ICONS: Record<Tool, typeof Sun> = {
  hand: Hand,
  sun: Sun,
  rain: CloudRain,
  grove: Trees,
  house: Home,
  farm: Wheat,
  well: Droplets,
  lightning: Zap,
  blessing: Wand2,
  temple: Landmark,
  quake: Activity,
  meteor: Flame,
  tornado: Tornado,
  bounty: Sprout,
  monument: Castle,
  aurora: Rainbow,
}

const TOOL_DESTRUCTIVE = new Set<Tool>(['lightning', 'quake', 'meteor', 'tornado'])

const TOOL_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'z', 'x', 'c', 'v', 'b', 'g']

export function Hud({ onOpenSaves }: { onOpenSaves: () => void }) {
  const started = useGame((s) => s.started)
  const [giftsOpen, setGiftsOpen] = useState(false)
  const openGifts = useCallback(() => {
    unlockAudio()
    setGiftsOpen(true)
  }, [])
  const closeGifts = useCallback(() => setGiftsOpen(false), [])
  useEffect(() => {
    initNativeApp()
    initMonetization()
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      const key = e.key.toLowerCase()
      if (key === 'escape') return cancelTether()
      if (key === 'm') return toggleMusic()
      if (key === 'n') return toggleSfx()
      const i = TOOL_KEYS.indexOf(key)
      if (i >= 0 && i < TOOLS.length) setTool(TOOLS[i].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!started) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <AgePanel />
          <QuestStack />
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatsPanel onOpenSaves={onOpenSaves} onOpenGifts={openGifts} />
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center gap-2 pt-2">
        <InvasionBanner />
      </div>
      <Messages />
      <TetherHint />
      <Toolbar />
      <GiftsMenu open={giftsOpen} onClose={closeGifts} />
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
  const isNight = useGame((s) => s.night > 0.5)
  const aurora = useGame((s) => Math.ceil(s.auroraTimer))
  return (
    <Panel className="w-40 rounded-xl px-3 py-2 sm:w-60 sm:rounded-2xl sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display hidden text-[10px] uppercase tracking-[0.25em] text-[#f5c451]/80 sm:block">Godlight</p>
        <span
          className={cn(
            'flex items-center gap-1 text-[10px] tabular-nums',
            aurora > 0 ? 'text-[#8ff5c8]' : isNight ? 'text-[#a9b8ff]' : 'text-[#f5c451]/80',
          )}
          title={isNight ? 'Night: prayers yield 25% more faith' : 'Day'}
        >
          {aurora > 0 ? <Rainbow className="size-3" aria-hidden="true" /> : isNight ? <Moon className="size-3" aria-hidden="true" /> : <Sun className="size-3" aria-hidden="true" />}
          {aurora > 0 ? `Aurora ${aurora}s` : isNight ? 'Night +25%' : 'Day'}
        </span>
      </div>
      <h2 className="font-display text-sm font-semibold sm:mt-0.5 sm:text-lg">{AGES[ageIndex].name}</h2>
      <div className="mt-1.5 h-1 sm:mt-2 sm:h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next age">
        <div className="h-full rounded-full bg-gradient-to-r from-[#f5c451] to-[#ffe9a8] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-[#f4ecd8]/60 sm:mt-1.5 sm:text-[11px]">
        {next ? `${next.name} at ${next.pop} followers` : 'Your people have reached glory'}
      </p>
    </Panel>
  )
}

function StatsPanel({ onOpenSaves, onOpenGifts }: { onOpenSaves: () => void; onOpenGifts: () => void }) {
  const faith = useGame((s) => Math.floor(s.faith))
  const rate = useGame((s) => Math.round(s.faithRate * 10) / 10)
  const pop = useGame((s) => s.pop)
  const capacity = useGame((s) => s.capacity)
  const happiness = useGame((s) => Math.round(s.happiness))
  const fear = useGame((s) => s.fearTimer > 0)
  const wood = useGame((s) => Math.floor(s.wood))
  const stone = useGame((s) => Math.floor(s.stone))

  return (
    <Panel className="flex flex-col items-end gap-1.5 rounded-xl px-3 py-2 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3">
      <div className="flex items-baseline gap-1.5 sm:items-center sm:gap-2">
        <Sparkles className="size-4 self-center text-[#f5c451] sm:size-5" aria-hidden="true" />
        <span className="font-display text-xl font-semibold tabular-nums sm:text-3xl">{faith}</span>
        <span className="sr-only">faith</span>
        <span className="text-[10px] tabular-nums text-[#f5c451]/80 sm:hidden">+{rate.toFixed(1)}/s</span>
      </div>
      <p className="-mt-1.5 hidden text-[11px] tabular-nums text-[#f5c451]/80 sm:block">+{rate.toFixed(1)} faith / sec</p>
      <div className="flex items-center gap-2.5 text-xs tabular-nums sm:gap-4 sm:text-sm [&_svg]:size-3.5 sm:[&_svg]:size-4">
        <span className="flex items-center gap-1.5" title="Followers / housing">
          <Users className="size-4 text-[#9ecbff]" aria-hidden="true" />
          {pop}
          <span className="text-[#f4ecd8]/50">/{capacity}</span>
          <span className="sr-only">followers</span>
        </span>
        <span className="flex items-center gap-1.5" title="Wood (chop trees, needed to build)">
          <Axe className="size-4 text-[#d9a066]" aria-hidden="true" />
          {wood}
          <span className="sr-only">wood</span>
        </span>
        <span className="flex items-center gap-1.5" title="Stone (mine rocks, needed to build)">
          <Pickaxe className="size-4 text-[#b8c0cc]" aria-hidden="true" />
          {stone}
          <span className="sr-only">stone</span>
        </span>
        <span className="flex items-center gap-1.5" title="Happiness">
          {fear ? <Skull className="size-4 text-[#ff7a5c]" aria-hidden="true" /> : <Smile className="size-4 text-[#9be38a]" aria-hidden="true" />}
          {happiness}%
          <span className="sr-only">happiness</span>
        </span>
      </div>
      {fear && <p className="text-[11px] font-medium text-[#ff9a7a]">Your people pray in fear</p>}
      <BoostBadge />
      <AudioToggles onOpenSaves={onOpenSaves} onOpenGifts={onOpenGifts} />
    </Panel>
  )
}

function InvasionBanner() {
  const active = useGame((s) => s.ufos.length > 0 || s.aliens.length > 0)
  const ufos = useGame((s) => s.ufos.length)
  const aliens = useGame((s) => s.aliens.length)
  if (!active) return null
  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-center gap-3 rounded-full border border-[#7dff9a]/40 bg-[#0b1f14]/80 px-4 py-2 text-sm text-[#d9ffe2] shadow-lg shadow-[#3dff7a]/10 backdrop-blur-md"
    >
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#7dff9a] opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-[#7dff9a]" />
      </span>
      <span className="font-display font-semibold tracking-wide">Invasion!</span>
      <span className="tabular-nums text-[#d9ffe2]/80">
        {ufos > 0 && `${ufos} UFO${ufos > 1 ? 's' : ''}`}
        {ufos > 0 && aliens > 0 && ' · '}
        {aliens > 0 && `${aliens} alien${aliens > 1 ? 's' : ''}`}
      </span>
      <span className="hidden text-xs text-[#d9ffe2]/60 sm:inline">Smite them, or tether followers to fight</span>
    </div>
  )
}

function TetherHint() {
  const tool = useGame((s) => s.tool)
  const active = useGame((s) => s.tether.followerId !== null)
  const dragging = useGame((s) => s.tether.dragging)
  const preview = useGame((s) => s.tether.preview)
  if (tool !== 'hand') return null
  let text = 'Drag from a follower to give them a task — trees, farms, temples, builds, or invaders'
  if (active) {
    text = preview
      ? preview.kind
        ? `${dragging ? 'Release' : 'Click'} to assign: ${preview.label}`
        : "Can't send followers across water"
      : dragging
        ? 'Drag the tether onto a target'
        : 'Click a target to assign · click the follower again to free them · Esc to cancel'
  }
  return (
    <p
      className={cn(
        'mx-auto mb-2 max-w-md rounded-full px-3 py-1 text-center text-[11px] backdrop-blur-sm sm:text-xs',
        !active && 'hidden sm:block',
        active && preview && !preview.kind ? 'bg-[#3a0f0f]/70 text-[#ffb3a8]' : 'bg-black/30 text-[#f4ecd8]/75',
      )}
      aria-live="polite"
    >
      {text}
    </p>
  )
}

function GiftsButton({ onOpenGifts }: { onOpenGifts: () => void }) {
  const cooldown = useRewardCooldown()
  const { supporter } = useMonetization()
  return (
    <button
      type="button"
      onClick={onOpenGifts}
      aria-label="Heavenly gifts"
      title="Heavenly gifts"
      className="relative flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-full border border-[#f5c451]/30 px-1.5 text-[11px] sm:px-2.5 font-medium text-[#f5c451] transition hover:bg-[#f5c451]/10 focus-visible:outline-2 focus-visible:outline-[#f5c451]"
    >
      {supporter ? <Crown className="size-3.5" aria-hidden="true" /> : <Gift className="size-3.5" aria-hidden="true" />}
      <span className="hidden sm:inline">Gifts</span>
      {cooldown === 0 && (
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#9be38a]" aria-hidden="true" />
      )}
    </button>
  )
}

function AudioToggles({ onOpenSaves, onOpenGifts }: { onOpenSaves: () => void; onOpenGifts: () => void }) {
  const { music, sfx } = useAudioSettings()
  const base =
    'flex size-7 items-center justify-center rounded-full border border-white/10 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#f5c451]'
  return (
    <div className="flex items-center gap-1.5 sm:mt-1">
      <GiftsButton onOpenGifts={onOpenGifts} />
      <button
        type="button"
        onClick={onOpenSaves}
        aria-label="Save or load world"
        title="Save / load"
        className={cn(base, 'gap-1.5 text-[11px] font-medium text-[#f5c451] sm:w-auto sm:px-2.5')}
      >
        <Save className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Save</span>
      </button>
      <button
        type="button"
        onClick={() => {
          unlockAudio()
          toggleMusic()
        }}
        aria-pressed={music}
        aria-label={music ? 'Mute music' : 'Play music'}
        title={music ? 'Mute music (M)' : 'Play music (M)'}
        className={cn(base, music ? 'text-[#f5c451]' : 'text-[#f4ecd8]/40')}
      >
        {music ? <Music className="size-3.5" aria-hidden="true" /> : <Music2 className="size-3.5 opacity-60" aria-hidden="true" />}
      </button>
      <button
        type="button"
        onClick={() => {
          unlockAudio()
          toggleSfx()
        }}
        aria-pressed={sfx}
        aria-label={sfx ? 'Mute sound effects' : 'Enable sound effects'}
        title={sfx ? 'Mute sound effects (N)' : 'Enable sound effects (N)'}
        className={cn(base, sfx ? 'text-[#f5c451]' : 'text-[#f4ecd8]/40')}
      >
        {sfx ? <Volume2 className="size-3.5" aria-hidden="true" /> : <VolumeX className="size-3.5" aria-hidden="true" />}
      </button>
    </div>
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
  const [hintVisible, setHintVisible] = useState(true)
  useEffect(() => {
    setHintVisible(true)
    const id = window.setTimeout(() => setHintVisible(false), 4000)
    return () => window.clearTimeout(id)
  }, [tool])

  return (
    <div className="flex flex-col items-center gap-2">
      <p
        className={cn(
          'max-w-[90vw] rounded-full bg-black/40 px-3 py-1 text-center text-[11px] leading-snug text-[#f4ecd8]/85 backdrop-blur-sm transition-opacity duration-500 sm:block sm:max-w-md sm:px-4 sm:py-1.5 sm:text-sm sm:opacity-100',
          hintVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
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
                aria-label={`${t.label}${t.cost ? `, costs ${t.cost} faith` : ''}${t.kind === 'build' ? `, needs ${costText(BUILD_COST[t.id as BuildingType])}` : ''}${locked ? `, locked until ${AGES[t.unlockAge].name}` : ''}`}
                className={cn(
                  'group relative flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-all sm:w-16',
                  active ? 'bg-[#f5c451] text-[#1a1406] shadow-lg shadow-[#f5c451]/30' : 'text-[#f4ecd8] hover:bg-white/10',
                  locked && 'opacity-45',
                )}
              >
                <span className="absolute left-1.5 top-1 hidden text-[9px] font-medium uppercase opacity-50 sm:inline">{TOOL_KEYS[i]}</span>
                <span
                  className={cn(
                    'absolute right-1.5 top-1.5 size-1.5 rounded-full',
                    t.kind === 'build' ? 'bg-[#8fd3ff]' : TOOL_DESTRUCTIVE.has(t.id) ? 'bg-[#ff7a5c]' : t.kind === 'power' ? 'bg-[#9be37a]' : 'bg-transparent',
                  )}
                  aria-hidden="true"
                />
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
                {t.kind === 'build' && (
                  <span
                    className={cn('flex gap-1 text-[9px] tabular-nums leading-none', active ? 'text-[#1a1406]/70' : 'text-[#f4ecd8]/60')}
                    aria-hidden="true"
                  >
                    {BUILD_COST[t.id as BuildingType].wood > 0 && <span className={active ? '' : 'text-[#d9a066]'}>{BUILD_COST[t.id as BuildingType].wood}w</span>}
                    {BUILD_COST[t.id as BuildingType].stone > 0 && <span className={active ? '' : 'text-[#b8c0cc]'}>{BUILD_COST[t.id as BuildingType].stone}s</span>}
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

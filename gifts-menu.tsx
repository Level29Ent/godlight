'use client'

import { useEffect, useRef, useState } from 'react'
import { Crown, Gift, Loader2, RotateCcw, Sparkles, Timer, X, Zap } from 'lucide-react'
import {
  AD_COOLDOWN_MS,
  buySupporterPack,
  claimReward,
  restorePurchases,
  rewardFaithAmount,
  useMonetization,
  type RewardKind,
} from '@/lib/game/monetization'
import { setPaused, useGame } from '@/lib/game/store'
import { cn } from '@/lib/utils'

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

const formatClock = (ms: number) => {
  const total = Math.ceil(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function useRewardCooldown() {
  const { lastRewardAt } = useMonetization()
  const now = useNow(true)
  return Math.max(0, lastRewardAt + AD_COOLDOWN_MS - now)
}

export function BoostBadge() {
  const boost = useGame((s) => Math.ceil(s.boostTimer))
  if (boost <= 0) return null
  return (
    <p className="flex items-center gap-1 text-[11px] font-medium tabular-nums text-[#9be38a]">
      <Zap className="size-3" aria-hidden="true" />
      Double faith {formatClock(boost * 1000)}
    </p>
  )
}

export function GiftsMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const { native, adsReady, storeReady, supporter, busy, price } = useMonetization()
  const cooldown = useRewardCooldown()
  const faithGift = useGame(() => rewardFaithAmount())

  useEffect(() => {
    if (!open) return
    setPaused(true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      setPaused(false)
    }
  }, [open, onClose])

  if (!open) return null

  const canReward = (supporter || (native && adsReady)) && cooldown === 0 && !busy
  const claim = async (kind: RewardKind) => {
    onClose()
    await claimReward(kind)
  }

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-[#060817]/70 p-4 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gifts-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1028]/95 p-5 text-[#f4ecd8] shadow-2xl shadow-black/60 outline-none sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.3em] text-[#f5c451]/80">Offerings</p>
            <h2 id="gifts-title" className="font-display mt-1 text-2xl font-semibold">
              Heavenly Gifts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full border border-white/10 text-[#f4ecd8]/70 transition hover:bg-white/10 hover:text-[#f4ecd8] focus-visible:outline-2 focus-visible:outline-[#f5c451]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <section className="mt-5" aria-labelledby="gifts-rewards">
          <div className="flex items-center justify-between">
            <h3 id="gifts-rewards" className="text-sm font-semibold">
              {supporter ? 'Supporter gifts' : 'Watch a short vision'}
            </h3>
            {cooldown > 0 && (
              <span className="flex items-center gap-1 text-[11px] tabular-nums text-[#f4ecd8]/60">
                <Timer className="size-3" aria-hidden="true" />
                Ready in {formatClock(cooldown)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#f4ecd8]/60">
            {supporter
              ? 'As a Supporter, claim gifts instantly with no ads.'
              : native
                ? 'Optional. Watch a brief ad to receive a blessing. Never required to play.'
                : 'Gifts are available in the Godlight app for iOS and Android.'}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <RewardButton
              icon={<Sparkles className="size-5 text-[#f5c451]" aria-hidden="true" />}
              title={`+${faithGift} faith`}
              detail="Instant"
              disabled={!canReward}
              loading={busy === 'ad'}
              onClick={() => claim('faith')}
            />
            <RewardButton
              icon={<Zap className="size-5 text-[#9be38a]" aria-hidden="true" />}
              title="2x faith"
              detail="For 10 minutes"
              disabled={!canReward}
              loading={busy === 'ad'}
              onClick={() => claim('boost')}
            />
          </div>
        </section>

        <section
          className="mt-5 rounded-2xl border border-[#f5c451]/30 bg-gradient-to-b from-[#f5c451]/10 to-transparent p-4"
          aria-labelledby="gifts-supporter"
        >
          <div className="flex items-center gap-2">
            <Crown className="size-5 text-[#f5c451]" aria-hidden="true" />
            <h3 id="gifts-supporter" className="font-display text-lg font-semibold">
              Supporter Pack
            </h3>
            {supporter && (
              <span className="ml-auto rounded-full bg-[#9be38a]/15 px-2 py-0.5 text-[11px] font-medium text-[#9be38a]">Owned</span>
            )}
          </div>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-[#f4ecd8]/75">
            <li>Claim every gift instantly, never watch an ad</li>
            <li>Golden halos crown all of your followers</li>
            <li>Support a tiny independent game</li>
          </ul>
          {!supporter && (
            <button
              type="button"
              onClick={() => void buySupporterPack()}
              disabled={!storeReady || !!busy}
              className="font-display mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#f5c451] py-2.5 font-semibold text-[#1a1406] transition hover:bg-[#ffd36e] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c451]"
            >
              {busy === 'purchase' ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Gift className="size-4" aria-hidden="true" />
              )}
              {storeReady ? `Become a Supporter · ${price ?? '$3.99'}` : native ? 'Store unavailable' : 'Available in the app'}
            </button>
          )}
          {native && (
            <button
              type="button"
              onClick={() => void restorePurchases()}
              disabled={!!busy}
              className="mx-auto mt-2 flex items-center gap-1.5 text-[11px] text-[#f4ecd8]/60 underline-offset-2 transition hover:text-[#f4ecd8] hover:underline disabled:opacity-50"
            >
              {busy === 'restore' ? (
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcw className="size-3" aria-hidden="true" />
              )}
              Restore purchases
            </button>
          )}
        </section>
      </div>
    </div>
  )
}

function RewardButton({
  icon,
  title,
  detail,
  disabled,
  loading,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  detail: string
  disabled: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center transition',
        'hover:border-[#f5c451]/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-white/10 disabled:hover:bg-white/5',
        'focus-visible:outline-2 focus-visible:outline-[#f5c451]',
      )}
    >
      {loading ? <Loader2 className="size-5 animate-spin text-[#f5c451]" aria-hidden="true" /> : icon}
      <span className="text-sm font-semibold tabular-nums">{title}</span>
      <span className="text-[11px] text-[#f4ecd8]/55">{detail}</span>
    </button>
  )
}

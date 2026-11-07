'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { CloudUpload, FolderOpen, Link2, Loader2, LogOut, RotateCcw, Trash2, Users, Sparkles, X } from 'lucide-react'
import { deleteSave, listSaves, loadGame, saveGame } from '@/app/actions/saves'
import { authClient, ensureGuest, signIn, signOut, signUp, useSession } from '@/lib/auth-client'
import { AUTOSAVE_SLOT, SLOT_COUNT, type SaveSummary } from '@/lib/game/save-slots'
import { exportSave, importSave, say, setPaused, useGame } from '@/lib/game/store'
import { sfx } from '@/lib/game/audio'
import { cn } from '@/lib/utils'

const savesKey = (userId: string) => ['saves', userId] as const

function useSaves(userId: string | undefined) {
  return useSWR(userId ? savesKey(userId) : null, () => listSaves())
}

export function SaveMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session, isPending } = useSession()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    if (open && !isPending && !session?.user) ensureGuest()
  }, [open, isPending, session?.user])

  useEffect(() => {
    if (!open) return
    setLinking(false)
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

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-[#060817]/70 p-4 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-menu-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1028]/95 p-5 text-[#f4ecd8] shadow-2xl shadow-black/60 outline-none sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.3em] text-[#f5c451]/80">Cloud saves</p>
            <h2 id="save-menu-title" className="font-display mt-1 text-2xl font-semibold">
              Chronicles
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

        <div className="mt-5">
          {isPending || !session?.user ? (
            <div className="flex items-center justify-center py-10 text-[#f4ecd8]/60">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span className="sr-only">Loading</span>
            </div>
          ) : linking ? (
            <AuthPanel onBack={() => setLinking(false)} />
          ) : (
            <SlotList
              userId={session.user.id}
              email={session.user.email}
              guest={!!session.user.isAnonymous}
              onLink={() => setLinking(true)}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function AuthPanel({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '').trim() || email.split('@')[0]
    setError(null)
    setLoading(true)
    const res =
      mode === 'sign-up'
        ? await signUp.email({ email, password, name })
        : await signIn.email({ email, password })
    setLoading(false)
    if (res.error) {
      setError(
        mode === 'sign-up'
          ? 'Could not create that account. Try a different email or a longer password.'
          : 'Those credentials did not match. Please try again.',
      )
      return
    }
    sfx('select')
    onBack()
  }

  const input =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[#f4ecd8] placeholder:text-[#f4ecd8]/35 outline-none transition focus:border-[#f5c451]/60 focus:bg-white/10'

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 text-xs text-[#f4ecd8]/60 transition hover:text-[#f4ecd8]"
      >
        ← Back to saves
      </button>
      <p className="text-sm leading-relaxed text-[#f4ecd8]/70">
        {mode === 'sign-up'
          ? 'Optional: link an email so your guest worlds follow you to any device. Your saves move over automatically.'
          : 'Sign in to an existing account. Guest saves fill any empty slots there.'}
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        {mode === 'sign-up' && (
          <label className="flex flex-col gap-1.5 text-xs text-[#f4ecd8]/70">
            Divine name
            <input name="name" type="text" autoComplete="nickname" placeholder="Helios" maxLength={40} className={input} />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-xs text-[#f4ecd8]/70">
          Email
          <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-[#f4ecd8]/70">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            placeholder="At least 8 characters"
            className={input}
          />
        </label>
        {error && (
          <p role="alert" className="text-xs text-[#ff9a7a]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="font-display mt-1 flex items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 py-3 font-semibold text-[#1a1406] transition hover:bg-[#ffd36e] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c451]"
        >
          {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {mode === 'sign-up' ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-[#f4ecd8]/60">
        {mode === 'sign-up' ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')
            setError(null)
          }}
          className="font-medium text-[#f5c451] underline-offset-4 hover:underline"
        >
          {mode === 'sign-up' ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </div>
  )
}

function SlotList({
  userId,
  email,
  guest,
  onLink,
  onClose,
}: {
  userId: string
  email: string
  guest: boolean
  onLink: () => void
  onClose: () => void
}) {
  const { data: saves, isLoading, mutate } = useSaves(userId)
  const started = useGame((s) => s.started)
  const gameOver = useGame((s) => s.gameOver)
  const canSave = started && !gameOver
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const bySlot = new Map((saves ?? []).map((s) => [s.slot, s]))
  const slots = [AUTOSAVE_SLOT, ...Array.from({ length: SLOT_COUNT }, (_, i) => i + 1)]

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key)
    setError(null)
    try {
      await fn()
    } catch {
      setError('The heavens are clouded. Please try again.')
      sfx('error')
    } finally {
      setBusy(null)
    }
  }

  const onSave = (slot: number) =>
    run(`save-${slot}`, async () => {
      const data = exportSave()
      await saveGame(slot, `World ${slot}`, data)
      await mutate()
      sfx('complete')
      say(`World saved to slot ${slot}.`, 'good')
    })

  const onLoad = (slot: number) =>
    run(`load-${slot}`, async () => {
      const data = await loadGame(slot)
      if (!data || !importSave(data)) throw new Error('Invalid save')
      sfx('start')
      say(slot === AUTOSAVE_SLOT ? 'Autosave restored.' : `World ${slot} restored.`, 'good')
      onClose()
    })

  const onDelete = (slot: number) =>
    run(`delete-${slot}`, async () => {
      await deleteSave(slot)
      await mutate()
    })

  return (
    <div>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3.5 py-2.5">
        {guest ? (
          <>
            <p className="min-w-0 text-xs text-[#f4ecd8]/70">
              Saving as <span className="text-[#f4ecd8]">guest</span> on this device
            </p>
            <button
              type="button"
              onClick={onLink}
              className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#f5c451] transition hover:text-[#ffd36e]"
            >
              <Link2 className="size-3.5" aria-hidden="true" />
              Link account
            </button>
          </>
        ) : (
          <>
            <p className="min-w-0 truncate text-xs text-[#f4ecd8]/70">
              Signed in as <span className="text-[#f4ecd8]">{email}</span>
            </p>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex shrink-0 items-center gap-1.5 text-xs text-[#f4ecd8]/60 transition hover:text-[#f4ecd8]"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sign out
            </button>
          </>
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {slots.map((slot) => (
          <SlotRow
            key={slot}
            slot={slot}
            save={bySlot.get(slot)}
            loading={isLoading}
            canSave={canSave && slot !== AUTOSAVE_SLOT}
            busy={busy}
            onSave={() => onSave(slot)}
            onLoad={() => onLoad(slot)}
            onDelete={() => onDelete(slot)}
          />
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-3 text-xs text-[#ff9a7a]">
          {error}
        </p>
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-[#f4ecd8]/45">
        Your world autosaves every minute while you play. The game is paused while this menu is open.
      </p>
      {!guest && <DeleteAccount />}
    </div>
  )
}

function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { mutate } = useSWRConfig()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-[11px] text-[#ff9a7a]/70 underline-offset-4 transition hover:text-[#ff9a7a] hover:underline"
      >
        Delete account
      </button>
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const password = String(new FormData(e.currentTarget).get('password') ?? '')
    setError(null)
    setLoading(true)
    const res = await authClient.deleteUser({ password })
    setLoading(false)
    if (res.error) {
      setError('That password did not match. Your account was not deleted.')
      sfx('error')
      return
    }
    await mutate((key) => Array.isArray(key) && key[0] === 'saves', undefined, { revalidate: false })
    say('Your account and cloud saves were deleted.', 'info')
    await ensureGuest()
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#ff9a7a]/30 bg-[#ff9a7a]/5 p-3.5"
    >
      <p className="text-xs leading-relaxed text-[#f4ecd8]/80">
        This permanently deletes your account and every cloud save. It cannot be undone. Supporter Pack purchases stay
        with your Apple or Google account and can be restored.
      </p>
      <label className="flex flex-col gap-1.5 text-xs text-[#f4ecd8]/70">
        Confirm with your password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[#f4ecd8] outline-none transition focus:border-[#ff9a7a]/60 focus:bg-white/10"
        />
      </label>
      {error && (
        <p role="alert" className="text-xs text-[#ff9a7a]">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          className="flex-1 rounded-full border border-white/10 px-4 py-2.5 text-xs text-[#f4ecd8]/80 transition hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ff9a7a] px-4 py-2.5 text-xs font-semibold text-[#2a0d06] transition hover:bg-[#ffb39a] disabled:opacity-60"
        >
          {loading && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          Delete forever
        </button>
      </div>
    </form>
  )
}

function SlotRow({
  slot,
  save,
  loading,
  canSave,
  busy,
  onSave,
  onLoad,
  onDelete,
}: {
  slot: number
  save: SaveSummary | undefined
  loading: boolean
  canSave: boolean
  busy: string | null
  onSave: () => void
  onLoad: () => void
  onDelete: () => void
}) {
  const isAuto = slot === AUTOSAVE_SLOT
  const btn =
    'flex size-8 items-center justify-center rounded-full border border-white/10 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[#f5c451]'
  const label = isAuto ? 'Autosave' : `Slot ${slot}`

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-3.5 py-3',
        save ? 'border-[#f5c451]/20 bg-[#f5c451]/[0.04]' : 'border-dashed border-white/10',
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 font-display text-sm text-[#f5c451]">
        {isAuto ? <RotateCcw className="size-4" aria-hidden="true" /> : slot}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold">{label}</p>
        {loading ? (
          <p className="mt-0.5 text-[11px] text-[#f4ecd8]/40">Loading…</p>
        ) : save ? (
          <p className="mt-0.5 flex items-center gap-2.5 text-[11px] tabular-nums text-[#f4ecd8]/60">
            <span className="flex items-center gap-1">
              <Users className="size-3 text-[#9ecbff]" aria-hidden="true" />
              {save.followers}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="size-3 text-[#f5c451]" aria-hidden="true" />
              {save.faith}
            </span>
            <span>{timeAgo(save.updatedAt)}</span>
          </p>
        ) : (
          <p className="mt-0.5 text-[11px] text-[#f4ecd8]/40">{isAuto ? 'Nothing autosaved yet' : 'Empty'}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {!isAuto && (
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || busy !== null}
            aria-label={save ? `Overwrite ${label}` : `Save to ${label}`}
            title={save ? 'Overwrite' : 'Save'}
            className={cn(btn, 'text-[#f5c451]')}
          >
            {busy === `save-${slot}` ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <CloudUpload className="size-3.5" aria-hidden="true" />}
          </button>
        )}
        <button
          type="button"
          onClick={onLoad}
          disabled={!save || busy !== null}
          aria-label={`Load ${label}`}
          title="Load"
          className={cn(btn, 'text-[#9ecbff]')}
        >
          {busy === `load-${slot}` ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <FolderOpen className="size-3.5" aria-hidden="true" />}
        </button>
        {!isAuto && (
          <button
            type="button"
            onClick={onDelete}
            disabled={!save || busy !== null}
            aria-label={`Delete ${label}`}
            title="Delete"
            className={cn(btn, 'text-[#ff9a7a]')}
          >
            {busy === `delete-${slot}` ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="size-3.5" aria-hidden="true" />}
          </button>
        )}
      </div>
    </li>
  )
}

function timeAgo(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const abs = Math.abs(seconds)
  if (abs < 60) return rtf.format(seconds, 'second')
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
  return rtf.format(Math.round(seconds / 86400), 'day')
}

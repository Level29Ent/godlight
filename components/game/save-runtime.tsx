'use client'

import { useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { listSaves, saveGame } from '@/app/actions/saves'
import { ensureGuest, useSession } from '@/lib/auth-client'
import { AUTOSAVE_INTERVAL_MS, AUTOSAVE_SLOT } from '@/lib/game/save-slots'
import { exportSave, useGame } from '@/lib/game/store'

const savesKey = (userId: string) => ['saves', userId] as const
function useSaves(userId: string | undefined) {
  return useSWR(userId ? savesKey(userId) : null, () => listSaves())
}

export function Autosave() {
  const { data: session, isPending } = useSession()
  const userId = session?.user.id
  const started = useGame((s) => s.started)
  const gameOver = useGame((s) => s.gameOver)
  const { mutate } = useSWRConfig()

  useEffect(() => {
    if (started && !isPending && !userId) ensureGuest()
  }, [started, isPending, userId])

  useEffect(() => {
    if (!userId || !started || gameOver) return
    const id = window.setInterval(async () => {
      try {
        await saveGame(AUTOSAVE_SLOT, 'Autosave', exportSave())
        mutate(savesKey(userId))
      } catch {
        // Autosave is best-effort; manual saves surface errors.
      }
    }, AUTOSAVE_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [userId, started, gameOver, mutate])

  return null
}

export function ContinueButton({ onOpenSaves }: { onOpenSaves: () => void }) {
  const { data: session } = useSession()
  const { data: saves } = useSaves(session?.user.id)
  const hasSaves = (saves?.length ?? 0) > 0
  return (
    <button
      type="button"
      onClick={onOpenSaves}
      className="font-display mt-3 rounded-full border border-[#f5c451]/40 px-8 py-2.5 text-sm font-semibold text-[#f5c451] transition hover:bg-[#f5c451]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5c451]"
    >
      {hasSaves ? 'Continue a saved world' : 'Your saved worlds'}
    </button>
  )
}

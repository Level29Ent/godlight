'use client'

import { useEffect, useState } from 'react'
import { exportSave, importSave, state, useGame } from '@/lib/game/store'
import { readLocalWorld, writeLocalWorld } from '@/lib/game/local-save'
import { unlockAudio } from '@/lib/game/audio'

export function LocalProgress({ control = false }: { control?: boolean }) {
  const started = useGame(s => s.started)
  const [available, setAvailable] = useState(false)
  const [warning, setWarning] = useState(false)
  useEffect(() => {
    try { setAvailable(!!readLocalWorld(localStorage)) } catch { /* Storage disabled. */ }
  }, [])
  useEffect(() => {
    if (control || !started) return
    const save = () => {
      if (!state.started || state.gameOver) return
      try { setWarning(!writeLocalWorld(localStorage, exportSave())) }
      catch { setWarning(true) }
    }
    save()
    const onHidden = () => { if (document.hidden) save() }
    const id = window.setInterval(save, 15_000)
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      clearInterval(id)
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [started, control])
  if (warning && started) return <p role="status" className="absolute bottom-32 left-3 rounded bg-[#0c1028] p-2 text-xs text-[#f5c451]">Device save unavailable. Use cloud saves while online.</p>
  if (!control || started || !available) return null
  return <button type="button" className="mt-3 rounded-full border border-[#f5c451]/50 px-6 py-3 text-sm text-[#f5c451]" onClick={() => {
    try {
      const saved = readLocalWorld(localStorage)
      if (saved) { unlockAudio(); importSave(saved) }
    } catch { setAvailable(false) }
  }}>Continue on this device</button>
}

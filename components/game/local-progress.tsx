'use client'

import { useEffect, useState } from 'react'
import { exportSave, importSave, state, useGame } from '@/lib/game/store'
import { readLocalProgress, writeLocalWorld } from '@/lib/game/local-save'
import { unlockAudio } from '@/lib/game/audio'

export function LocalProgress({ control = false }: { control?: boolean }) {
  const started = useGame(s => s.started)
  const [available, setAvailable] = useState(false)
  const [warning, setWarning] = useState(false)
  const [recovered, setRecovered] = useState(false)
  const [restoreError, setRestoreError] = useState('')
  useEffect(() => {
    try { const saved = readLocalProgress(localStorage); setAvailable(!!saved); setRecovered(saved?.recovered ?? false) } catch { /* Storage disabled. */ }
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
  if (warning && started) return <p role="status" className="absolute bottom-32 left-3 rounded bg-[#0c1028] p-2 text-xs text-[#f5c451]">Device saving unavailable. Keep this tab open and check browser storage before leaving.</p>
  if (!control || started || !available) return null
  return <div className="mt-3 flex flex-col items-center gap-2">
    <button type="button" className="rounded-full border border-[#f5c451]/50 px-6 py-3 text-sm text-[#f5c451]" onClick={() => {
      try {
        const saved = readLocalProgress(localStorage)
        if (!saved || !importSave(saved.data)) { setRestoreError('No valid device world could be restored.'); return }
        unlockAudio()
      } catch { setRestoreError('Device storage is unavailable. Your saved slots have not been changed.') }
    }}>{recovered ? 'Recover previous device world' : 'Continue on this device'}</button>
    {recovered && <p role="status" className="max-w-xs text-xs leading-5 text-[#ffe2a1]">The latest device save could not be read. A previous snapshot is available; it restores older progress.</p>}
    {restoreError && <p role="alert" className="max-w-xs text-xs text-[#ffb3b3]">{restoreError}</p>}
  </div>
}

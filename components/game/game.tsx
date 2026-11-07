'use client'

import { Canvas } from '@react-three/fiber'
import { Sparkles, Sun, CloudRain, Zap } from 'lucide-react'
import { startDir, startGame, resetGame, useGame } from '@/lib/game/store'
import { PLANET_RADIUS } from '@/lib/game/planet'
import { Scene } from './scene'
import { Hud } from './hud'
import { unlockAudio } from '@/lib/game/audio'
import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Autosave, ContinueButton } from './save-runtime'
import { LocalProgress } from './local-progress'
import { RenderBudget } from './render-budget'
import { recordCrash } from '@/lib/game/crash-log'

const SaveMenu = dynamic(() => import('./save-menu').then(module => module.SaveMenu), { ssr: false })

const cameraPosition = startDir.clone().multiplyScalar(PLANET_RADIUS * 3).toArray() as [number, number, number]

export default function Game() {
  const [batterySaver, setBatterySaver] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  useEffect(() => {
    try { setBatterySaver(localStorage.getItem('godlight-battery') === 'true') } catch {}
  }, [])
  const [savesOpen, setSavesOpen] = useState(false)
  const openSaves = useCallback(() => {
    unlockAudio()
    setSavesOpen(true)
  }, [])
  const closeSaves = useCallback(() => setSavesOpen(false), [])
  return (
    <main className="relative h-dvh w-full select-none overflow-hidden bg-[#060817]">
      <Canvas
        shadows={!batterySaver}
        dpr={batterySaver ? 1 : [1, 1.5]}
        fallback={<p role="alert">This device needs WebGL to play Godlight.</p>}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault()
            recordCrash('webgl')
            setContextLost(true)
          }, { once: true })
        }}
        camera={{ position: cameraPosition, fov: 42, near: 0.1, far: 200 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <RenderBudget batterySaver={batterySaver} />
        <Scene batterySaver={batterySaver} />
      </Canvas>
      <Hud onOpenSaves={openSaves} />
      <TitleScreen onOpenSaves={openSaves} />
      <GameOver onOpenSaves={openSaves} />
      {savesOpen && <SaveMenu open onClose={closeSaves} />}
      <Autosave />
      <LocalProgress />
      <button type="button" aria-pressed={batterySaver} className="absolute bottom-0 left-0 z-10 min-h-11 rounded-tr-xl bg-[#0c1028] px-3 text-xs text-[#f5c451]" onClick={() => {
        const next = !batterySaver
        setBatterySaver(next)
        try { localStorage.setItem('godlight-battery', String(next)) } catch {}
      }}>Battery saver {batterySaver ? 'on' : 'off'}</button>
      {contextLost && <div role="alert" className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#060817] p-6 text-center text-[#f4ecd8]">
        <p>The graphics connection was interrupted. Reload to recover your saved world.</p>
        <button type="button" onClick={() => location.reload()} className="rounded-full bg-[#f5c451] px-6 py-3 text-[#1a1406]">Reload game</button>
      </div>}
    </main>
  )
}

function TitleScreen({ onOpenSaves }: { onOpenSaves: () => void }) {
  const started = useGame((s) => s.started)
  if (started) return null
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-[#060817] via-[#060817]/40 to-transparent px-6 pb-16 text-center sm:justify-center sm:pb-0">
      <p className="font-display text-xs uppercase tracking-[0.4em] text-[#f5c451]/80">A tiny world awaits</p>
      <h1 className="font-display mt-3 text-balance text-6xl font-semibold text-[#f4ecd8] drop-shadow-[0_0_30px_rgba(245,196,81,0.35)] sm:text-8xl">
        Godlight
      </h1>
      <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-[#f4ecd8]/75 sm:text-base">
        Tend a little planet of devoted followers. Warm them with sunlight, nourish their crops with rain — or remind them who&apos;s in charge.
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[#f4ecd8]/70">
        <li className="flex items-center gap-1.5"><Sun className="size-4 text-[#f5c451]" aria-hidden="true" />Bless</li>
        <li className="flex items-center gap-1.5"><CloudRain className="size-4 text-[#9ecbff]" aria-hidden="true" />Nurture</li>
        <li className="flex items-center gap-1.5"><Zap className="size-4 text-[#c9b8ff]" aria-hidden="true" />Smite</li>
        <li className="flex items-center gap-1.5"><Sparkles className="size-4 text-[#f5c451]" aria-hidden="true" />Grow your faith</li>
      </ul>
      <button
        type="button"
        onClick={() => {
          unlockAudio()
          startGame()
        }}
        className="font-display mt-8 rounded-full bg-[#f5c451] px-10 py-3.5 text-lg font-semibold text-[#1a1406] shadow-[0_0_40px_rgba(245,196,81,0.45)] transition hover:scale-105 hover:bg-[#ffd36e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5c451]"
      >
        Become a God
      </button>
      <ContinueButton onOpenSaves={onOpenSaves} />
      <LocalProgress control />
      <p className="mt-4 text-[11px] text-[#f4ecd8]/45">Drag the stars to spin the world · Hold on land to use powers · Keys 1–8 switch tools</p>
      <nav aria-label="Legal and support" className="mt-3 flex gap-4">
        <a
          href="/support"
          className="text-[11px] text-[#f4ecd8]/45 underline underline-offset-4 hover:text-[#f4ecd8]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c451]"
        >
          Support
        </a>
        <a
          href="/privacy"
          className="text-[11px] text-[#f4ecd8]/45 underline underline-offset-4 hover:text-[#f4ecd8]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c451]"
        >
          Privacy Policy
        </a>
      </nav>
    </div>
  )
}

function GameOver({ onOpenSaves }: { onOpenSaves: () => void }) {
  const gameOver = useGame((s) => s.gameOver)
  const harvests = useGame((s) => s.harvests)
  if (!gameOver) return null
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#060817]/75 px-6 text-center backdrop-blur-sm">
      <h2 className="font-display text-4xl font-semibold text-[#f4ecd8] sm:text-6xl">The world is silent</h2>
      <p className="mt-3 max-w-sm text-sm text-[#f4ecd8]/70">
        No one remains to worship you. {harvests > 0 ? `They celebrated ${harvests} harvest${harvests > 1 ? 's' : ''} in your name.` : ''}
      </p>
      <button
        type="button"
        onClick={resetGame}
        className="font-display mt-8 rounded-full bg-[#f5c451] px-8 py-3 font-semibold text-[#1a1406] transition hover:scale-105"
      >
        Begin anew
      </button>
      <button
        type="button"
        onClick={onOpenSaves}
        className="font-display mt-3 rounded-full border border-[#f5c451]/40 px-8 py-2.5 text-sm font-semibold text-[#f5c451] transition hover:bg-[#f5c451]/10"
      >
        Load a saved world
      </button>
    </div>
  )
}

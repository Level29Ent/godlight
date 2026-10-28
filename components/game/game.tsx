'use client'

import Link from 'next/link'
import { Canvas } from '@react-three/fiber'
import { Sparkles, Sun, CloudRain, Zap } from 'lucide-react'
import { startDir, startGame, resetGame, useGame } from '@/lib/game/store'
import { PLANET_RADIUS } from '@/lib/game/planet'
import { Scene } from './scene'
import { Hud } from './hud'
import { unlockAudio } from '@/lib/game/audio'
import { useCallback, useState } from 'react'
import { Autosave, ContinueButton, SaveMenu } from './save-menu'

const cameraPosition = startDir.clone().multiplyScalar(PLANET_RADIUS * 3).toArray() as [number, number, number]

export default function Game() {
  const [savesOpen, setSavesOpen] = useState(false)
  const openSaves = useCallback(() => {
    unlockAudio()
    setSavesOpen(true)
  }, [])
  const closeSaves = useCallback(() => setSavesOpen(false), [])
  return (
    <main className="relative h-dvh w-full touch-none select-none overflow-hidden bg-[#060817]">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: cameraPosition, fov: 42, near: 0.1, far: 200 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Scene />
      </Canvas>
      <Hud onOpenSaves={openSaves} />
      <TitleScreen onOpenSaves={openSaves} />
      <GameOver onOpenSaves={openSaves} />
      <SaveMenu open={savesOpen} onClose={closeSaves} />
      <Autosave />
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
      <Link href="/duels" className="mt-4 rounded-full border border-[#f5c451]/50 px-8 py-3 text-[#f5c451]">Divine Duels · Play a friend</Link>
      <ContinueButton onOpenSaves={onOpenSaves} />
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

'use client'

import dynamic from 'next/dynamic'

const Game = dynamic(() => import('./game'), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-[#060817]">
      <p className="font-display animate-pulse text-sm uppercase tracking-[0.4em] text-[#f5c451]/80">Forming the world</p>
    </div>
  ),
})

export function GameLoader() {
  return <Game />
}

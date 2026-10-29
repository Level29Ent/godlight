'use client'

import { useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Renders its children for a few frames, shrunk inside the planet where they're hidden,
 * so their shaders (including shadow passes) compile before the first real use instead of
 * causing a hitch mid-game.
 */
export function Warmup({ children, frames = 30 }: { children: ReactNode; frames?: number }) {
  const [done, setDone] = useState(false)
  const count = useRef(0)
  useFrame(() => {
    if (!done && ++count.current >= frames) setDone(true)
  })
  if (done) return null
  return <group scale={0.001}>{children}</group>
}

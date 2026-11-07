'use client'

import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

/**
 * Renders its children for a few frames, shrunk inside the planet where they're hidden,
 * so their shaders (including shadow passes) compile before the first real use instead of
 * causing a hitch mid-game.
 */
export function Warmup({ children, frames = 30 }: { children: ReactNode; frames?: number }) {
  const group = useRef<Group>(null)
  const count = useRef(0)
  useFrame(() => {
    if (group.current && ++count.current >= frames) group.current.visible = false
  })
  // Keep materials mounted: unmounting disposes their shader programs and defeats warmup.
  return <group ref={group} scale={0.001}>{children}</group>
}

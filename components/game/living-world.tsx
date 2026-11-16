'use client'

import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Group } from 'three'
import { state, useGame, useGameVersion } from '@/lib/game/store'
import { identity, PRAYER_TEXT } from '@/lib/game/living'
import { surfacePoint } from '@/lib/game/planet'

export function LivingWorld() {
  const sky = useGame(s => s.living.sky)
  const rings = useGame(s => s.living.rings)
  const moon = useGame(s => s.living.moon)
  const photo = useGame(s => s.photoMode)
  const ascended = useGame(s => s.chronicle.ascended)
  useGameVersion()
  return <>
    {ascended && <group rotation={[0.4, 0.2, 0.3]}>{[0, 1, 2].map(i => <mesh key={i} rotation={[i * 0.9, i * 0.7, 0]} raycast={() => null}><torusGeometry args={[8.8 + i * 0.3, 0.035, 6, 96]} /><meshBasicMaterial color={i === 1 ? '#99eaff' : '#ffe1a3'} toneMapped={false} transparent opacity={0.7} /></mesh>)}</group>}
    {rings && <mesh rotation={[0.5, 0, 0.3]} raycast={() => null}><ringGeometry args={[10, 11.5, 96]} /><meshBasicMaterial color={sky === 2 ? '#80e3de' : '#d9b7ed'} side={2} transparent opacity={0.35} depthWrite={false} /></mesh>}
    {moon && <mesh position={[-12, 7, -6]} raycast={() => null}><icosahedronGeometry args={[0.75, 2]} /><meshStandardMaterial color="#d9d8ef" roughness={0.95} /></mesh>}
    {!photo && state.started && state.living.prayers.map(p => <PrayerBubble key={p.followerId} followerId={p.followerId} kind={p.kind} />)}
  </>
}

function PrayerBubble({ followerId, kind }: { followerId: number; kind: keyof typeof PRAYER_TEXT }) {
  const group = useRef<Group>(null)
  const label = useRef<HTMLDivElement>(null)
  const camera = useThree(s => s.camera)
  useFrame(() => {
    const f = state.followers.find(f => f.id === followerId)
    if (!f || !group.current) return
    group.current.position.copy(surfacePoint(f.dir)).addScaledVector(f.dir, 0.8)
    if (label.current) label.current.style.display = f.dir.dot(camera.position) > 8 ? 'block' : 'none'
  })
  return <group ref={group}><Html center style={{ pointerEvents: 'none' }} zIndexRange={[9, 0]}><div ref={label} className="w-36 rounded-xl border border-[#f5c451]/40 bg-[#0c1028]/90 p-2 text-center text-[10px] text-[#f4ecd8] shadow-lg"><strong className="text-[#ffe2a1]">{identity(followerId).name}</strong><p>{PRAYER_TEXT[kind]}</p></div></Html></group>
}
